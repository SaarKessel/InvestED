// InvestED - prediction ledger math (educational simulation, not advice).
// The user writes a directional call with a stated confidence and a horizon. Settlement is mechanical:
// real daily closes only, hit/miss by direction, return compared with SPY. Nothing here is estimated or invented.
// Brier score and the calibration table are the textbook definitions (math only, no dataset).
// Idea credit: calibration concept as used in Jon-Becker/prediction-market-analysis (MIT); no code or data copied.

export type Direction = "up" | "down";
export interface Close { date: string; close: number }

export interface PredictionInput {
  symbol: string;
  direction: Direction;
  /** Stated chance (50-99) that the call turns out right. */
  confidence: number;
  horizonDays: number;
  thesis: string;
}

export interface Prediction extends PredictionInput {
  id: string;
  createdAt: string; // ISO
  dueDate: string; // YYYY-MM-DD
  entryDate: string; entryClose: number; entrySpyClose: number;
  status: "open" | "settled";
  settledDate?: string; exitClose?: number; exitSpyClose?: number;
  hit?: boolean; returnPct?: number; spyReturnPct?: number;
}

export const MIN_HORIZON_DAYS = 7;
export const MAX_HORIZON_DAYS = 365;

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function validateInput(i: PredictionInput): string | null {
  if (!/^[A-Z0-9^][A-Z0-9.\-^=]{0,9}$/.test(i.symbol)) return "symbol";
  if (i.direction !== "up" && i.direction !== "down") return "direction";
  if (!Number.isFinite(i.confidence) || i.confidence < 50 || i.confidence > 99) return "confidence";
  if (!Number.isInteger(i.horizonDays) || i.horizonDays < MIN_HORIZON_DAYS || i.horizonDays > MAX_HORIZON_DAYS) return "horizon";
  if (i.thesis.trim().length < 3 || i.thesis.length > 500) return "thesis";
  return null;
}

/** Last close strictly before `today` (a bar dated today may still be moving). */
export function lastCompletedClose(closes: Close[], today: string): Close | null {
  const done = closes.filter((c) => c.date < today && Number.isFinite(c.close) && c.close > 0);
  return done.length ? done[done.length - 1] : null;
}

/** First completed close on or after the due date; null while the due date has not passed. */
export function settlementClose(closes: Close[], dueDate: string, today: string): Close | null {
  return closes.find((c) => c.date >= dueDate && c.date < today && Number.isFinite(c.close) && c.close > 0) ?? null;
}

export function settle(p: Prediction, stock: Close[], spy: Close[], today: string): Prediction {
  if (p.status === "settled") return p;
  const s = settlementClose(stock, p.dueDate, today);
  const m = settlementClose(spy, p.dueDate, today);
  if (!s || !m) return p;
  const returnPct = (s.close / p.entryClose - 1) * 100;
  const spyReturnPct = (m.close / p.entrySpyClose - 1) * 100;
  // A flat close (exactly equal) is a miss for either direction: the call was not confirmed.
  const hit = p.direction === "up" ? s.close > p.entryClose : s.close < p.entryClose;
  return { ...p, status: "settled", settledDate: s.date, exitClose: s.close, exitSpyClose: m.close, hit, returnPct, spyReturnPct };
}

/** Mean squared gap between stated confidence (0-1) and the outcome (1 hit, 0 miss). 0 is perfect, 0.25 is always saying 50%. */
export function brierScore(settled: Prediction[]): number | null {
  const s = settled.filter((p) => p.status === "settled" && typeof p.hit === "boolean");
  if (!s.length) return null;
  return s.reduce((sum, p) => sum + (p.confidence / 100 - (p.hit ? 1 : 0)) ** 2, 0) / s.length;
}

export interface CalibrationBin { label: string; low: number; high: number; n: number; statedAvg: number | null; hitRate: number | null; enough: boolean }
export const MIN_BIN_SAMPLE = 5;

/** Buckets by stated confidence: 50-59, 60-69, 70-79, 80-89, 90-99. A bucket under 5 calls is flagged as too small to judge. */
export function calibrationBins(settled: Prediction[]): CalibrationBin[] {
  const s = settled.filter((p) => p.status === "settled" && typeof p.hit === "boolean");
  return [50, 60, 70, 80, 90].map((low) => {
    const high = low + 9;
    const inBin = s.filter((p) => p.confidence >= low && p.confidence <= high);
    const n = inBin.length;
    return {
      label: `${low}-${high}%`, low, high, n,
      statedAvg: n ? inBin.reduce((a, p) => a + p.confidence, 0) / n : null,
      hitRate: n ? (inBin.filter((p) => p.hit).length / n) * 100 : null,
      enough: n >= MIN_BIN_SAMPLE,
    };
  });
}

// ---- reading a request from chat -------------------------------------------------------------

export type LedgerRequest =
  | { kind: "create"; input: PredictionInput }
  | { kind: "view" }
  | { kind: "help" };

const UP = /\b(up|rise|rises|go up|goes up|higher|gain|gains|outperform|beat)\b|עולה|תעלה|יעלה|עלייה/i;
const DOWN = /\b(down|fall|falls|drop|drops|go down|goes down|lower|decline|declines)\b|יורד|תרד|ירד|תיפול|יפול|ירידה/i;
const PREDICT = /\b(predict(ion)?|i bet|i call it|my call|log (a )?(call|thesis)|my thesis)\b|תחזית|אני חוזה|אני מנבא|תרשום (לי )?(תחזית|תזה)|התזה שלי/i;
const VIEW = /\b(my (predictions|calls|calibration|track record|brier)|calibration|brier|prediction ledger)\b|התחזיות שלי|כיול|רשומת התחזיות/i;

export function parseHorizonDays(text: string): number | null {
  const m = text.match(/(\d{1,3})\s*(days?|d\b|weeks?|w\b|months?|ימים|יום|שבועות|שבוע|חודשים|חודש)/i);
  if (!m) return null;
  const n = Number(m[1]); const u = m[2].toLowerCase();
  if (/^(days?|d|ימים|יום)$/.test(u)) return n;
  if (/^(weeks?|w|שבועות|שבוע)$/.test(u)) return n * 7;
  return n * 30;
}

export function parseLedgerRequest(text: string, resolveSymbol: (q: string) => string | null): LedgerRequest | null {
  if (text.length > 600) return null;
  const isPredict = PREDICT.test(text);
  if (!isPredict) return VIEW.test(text) ? { kind: "view" } : null;
  const confidence = Number((text.match(/(\d{2})\s*%/) ?? [])[1]);
  const horizonDays = parseHorizonDays(text);
  const down = DOWN.test(text), up = UP.test(text);
  const direction: Direction | null = up === down ? null : up ? "up" : "down";
  let symbol: string | null = null;
  for (const token of text.match(/[A-Za-z][A-Za-z0-9.-]{0,9}|[\u0590-\u05FF]{2,12}/g) ?? []) {
    if (/^(predict|prediction|will|the|up|down|in|days|day|weeks|week|months|month|my|call|thesis|bet|rise|fall|drop|go|goes|higher|lower|chance|sure|confident|percent|to|by|beat|spy)$/i.test(token)) continue;
    const r = resolveSymbol(token);
    if (r) { symbol = r; break; }
  }
  if (!symbol || !direction || !Number.isFinite(confidence) || horizonDays === null) return { kind: "help" };
  const input: PredictionInput = { symbol, direction, confidence, horizonDays, thesis: text.trim() };
  return validateInput(input) ? { kind: "help" } : { kind: "create", input };
}
