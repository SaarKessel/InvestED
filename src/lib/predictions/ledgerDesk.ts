// Prediction ledger desk: saves a call in Supabase (owner-only RLS), settles due calls mechanically against real
// Yahoo daily closes (through /api/closes), and builds the calibration view. If closes are unavailable nothing is
// saved or settled and the result says so. Educational simulation, not advice.
import { getSupabase } from "@/lib/account/supabaseClient";
import { resolveAssetSymbol } from "@/lib/market/symbolResolution";
import { addDays, brierScore, calibrationBins, lastCompletedClose, parseLedgerRequest, settle, validateInput, type CalibrationBin, type Close, type LedgerRequest, type Prediction, type PredictionInput } from "./ledger";

export interface LedgerResult {
  reason?: "help" | "signin" | "closes_unavailable" | "save_failed";
  created?: Prediction;
  predictions: Prediction[];
  settledNow: number;
  brier: number | null;
  bins: CalibrationBin[];
  today: string;
}
type Db = ReturnType<typeof getSupabase>;
type Row = Record<string, unknown>;

export const planLedgerRequest = (text: string): LedgerRequest | null => parseLedgerRequest(text, (q) => resolveAssetSymbol(q)?.symbol ?? null);

const num = (v: unknown) => (v === null || v === undefined ? undefined : Number(v));
export function fromRow(r: Row): Prediction {
  return {
    id: String(r.id), symbol: String(r.symbol), direction: r.direction as Prediction["direction"], confidence: Number(r.confidence), horizonDays: Number(r.horizon_days),
    thesis: String(r.thesis), createdAt: String(r.created_at), dueDate: String(r.due_date), entryDate: String(r.entry_date), entryClose: Number(r.entry_close), entrySpyClose: Number(r.entry_spy_close),
    status: r.status === "settled" ? "settled" : "open", settledDate: (r.settled_date as string | null) ?? undefined, exitClose: num(r.exit_close), exitSpyClose: num(r.exit_spy_close),
    hit: typeof r.hit === "boolean" ? r.hit : undefined, returnPct: num(r.return_pct), spyReturnPct: num(r.spy_return_pct),
  };
}

async function getCloses(symbol: string, from: string, fetcher: typeof fetch): Promise<Close[] | null> {
  try {
    const r = await fetcher(`/api/closes?symbol=${encodeURIComponent(symbol)}&from=${from}`);
    if (!r.ok) return null;
    const j = (await r.json()) as { closes?: Close[] };
    return Array.isArray(j.closes) && j.closes.length ? j.closes : null;
  } catch { return null; }
}

const view = (predictions: Prediction[], today: string, extra: Partial<LedgerResult> = {}): LedgerResult => {
  const settled = predictions.filter((p) => p.status === "settled");
  return { predictions, settledNow: 0, brier: brierScore(settled), bins: calibrationBins(settled), today, ...extra };
};

export async function runLedger(req: LedgerRequest, deps: { db?: Db; fetcher?: typeof fetch; now?: Date } = {}): Promise<LedgerResult> {
  const fetcher = deps.fetcher ?? fetch;
  const today = (deps.now ?? new Date()).toISOString().slice(0, 10);
  if (req.kind === "help") return view([], today, { reason: "help" });
  const db = deps.db ?? getSupabase();
  const { data: auth } = await db.auth.getUser();
  if (!auth?.user) return view([], today, { reason: "signin" });

  let created: Prediction | undefined;
  if (req.kind === "create") {
    if (validateInput(req.input)) return view([], today, { reason: "help" });
    const from = addDays(today, -10);
    const [stock, spy] = await Promise.all([getCloses(req.input.symbol, from, fetcher), getCloses("SPY", from, fetcher)]);
    const e = stock && lastCompletedClose(stock, today), m = spy && lastCompletedClose(spy, today);
    if (!e || !m) return view([], today, { reason: "closes_unavailable" });
    const input: PredictionInput = req.input;
    const { data, error } = await db.from("predictions").insert({
      symbol: input.symbol, direction: input.direction, confidence: input.confidence, horizon_days: input.horizonDays, thesis: input.thesis.slice(0, 500),
      due_date: addDays(today, input.horizonDays), entry_date: e.date, entry_close: e.close, entry_spy_close: m.close,
    }).select().single();
    if (error || !data) return view([], today, { reason: "save_failed" });
    created = fromRow(data as Row);
  }

  const { data: rows, error } = await db.from("predictions").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) return view(created ? [created] : [], today, { created, reason: "save_failed" });
  let list = ((rows ?? []) as Row[]).map(fromRow);

  let settledNow = 0;
  const due = list.filter((p) => p.status === "open" && p.dueDate < today);
  for (const p of due) {
    const [stock, spy] = await Promise.all([getCloses(p.symbol, p.dueDate, fetcher), getCloses("SPY", p.dueDate, fetcher)]);
    if (!stock || !spy) continue; // stays open; never guessed
    const next = settle(p, stock, spy, today);
    if (next.status !== "settled") continue;
    const { error: upErr } = await db.from("predictions").update({
      status: "settled", settled_date: next.settledDate, exit_close: next.exitClose, exit_spy_close: next.exitSpyClose, hit: next.hit, return_pct: next.returnPct, spy_return_pct: next.spyReturnPct,
    }).eq("id", p.id);
    if (upErr) continue;
    list = list.map((x) => (x.id === p.id ? next : x));
    settledNow += 1;
  }
  return view(list, today, { created, settledNow });
}
