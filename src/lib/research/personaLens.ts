// InvestED - investor-persona lens: transparent pass/fail checklists from textbook public criteria
// (Buffett, Graham, Lynch). Inputs are SEC XBRL company facts (annual 10-K values) and the quoted price.
// A criterion with a missing input is "unavailable", never filled in. Educational checklist, not advice.

export interface YearValue { fy: number; end: string; val: number }
export interface PersonaFacts {
  cik: string; name: string;
  equity: YearValue[]; netIncome: YearValue[]; revenue: YearValue[]; epsDiluted: YearValue[];
  liabilities: YearValue[]; currentAssets: YearValue[]; currentLiabilities: YearValue[]; longTermDebt: YearValue[];
  sharesOutstanding: number | null;
}
export type Status = "pass" | "fail" | "unavailable" | "judgment";
export interface Criterion { id: string; label: { en: string; he: string }; rule: { en: string; he: string }; value: string | null; status: Status }
export interface Lens { persona: "buffett" | "graham" | "lynch"; criteria: Criterion[]; passed: number; checked: number }
export interface LensDerived { asOf: string | null; roe: number | null; netMargin: number | null; pe: number | null; pb: number | null; currentRatio: number | null; liabToEquity: number | null; epsCagr3y: number | null; peg: number | null; netNetPerShare: number | null; yearsPositiveEarnings: number }

const latest = (a: YearValue[]) => (a.length ? a[a.length - 1] : null);

/** Last value per fiscal year, oldest first. */
export function annual(rows: YearValue[]): YearValue[] {
  const by = new Map<number, YearValue>();
  for (const r of rows) { const p = by.get(r.fy); if (!p || r.end >= p.end) by.set(r.fy, r); }
  return [...by.values()].sort((a, b) => a.fy - b.fy);
}

export function derive(f: PersonaFacts, price: number | null): LensDerived {
  const eq = latest(f.equity), ni = latest(f.netIncome), rev = latest(f.revenue), eps = latest(f.epsDiluted);
  const liab = latest(f.liabilities), ca = latest(f.currentAssets), cl = latest(f.currentLiabilities);
  const okPrice = price !== null && price > 0;
  const roe = eq && ni && eq.val > 0 ? (ni.val / eq.val) * 100 : null;
  const netMargin = ni && rev && rev.val > 0 ? (ni.val / rev.val) * 100 : null;
  const pe = okPrice && eps && eps.val > 0 ? (price as number) / eps.val : null;
  const bvps = eq && f.sharesOutstanding && f.sharesOutstanding > 0 ? eq.val / f.sharesOutstanding : null;
  const pb = okPrice && bvps && bvps > 0 ? (price as number) / bvps : null;
  const currentRatio = ca && cl && cl.val > 0 ? ca.val / cl.val : null;
  const liabToEquity = liab && eq && eq.val > 0 ? liab.val / eq.val : null;
  const e = f.epsDiluted;
  let epsCagr3y: number | null = null;
  if (e.length >= 4) { const a = e[e.length - 4], b = e[e.length - 1]; epsCagr3y = a.val > 0 && b.val > 0 ? (Math.pow(b.val / a.val, 1 / 3) - 1) * 100 : null; }
  const peg = pe !== null && epsCagr3y !== null && epsCagr3y > 0 ? pe / epsCagr3y : null;
  const netNetPerShare = ca && liab && f.sharesOutstanding && f.sharesOutstanding > 0 ? (ca.val - liab.val) / f.sharesOutstanding : null;
  return { asOf: eq?.end ?? null, roe, netMargin, pe, pb, currentRatio, liabToEquity, epsCagr3y, peg, netNetPerShare, yearsPositiveEarnings: f.netIncome.slice(-10).filter((x) => x.val > 0).length };
}

const b = (en: string, he: string) => ({ en, he });
function c(id: string, label: Criterion["label"], rule: Criterion["rule"], value: number | null, test: (v: number) => boolean, d = 2, suffix = ""): Criterion {
  if (value === null || !Number.isFinite(value)) return { id, label, rule, value: null, status: "unavailable" };
  const shown = id === "steady" || id === "earn" ? (value === 1 ? "yes" : "no") : `${value.toFixed(d)}${suffix}`;
  return { id, label, rule, value: shown, status: test(value) ? "pass" : "fail" };
}
const judgment = (id: string, label: Criterion["label"], rule: Criterion["rule"]): Criterion => ({ id, label, rule, value: null, status: "judgment" });
const tally = (persona: Lens["persona"], criteria: Criterion[]): Lens => ({ persona, criteria, passed: criteria.filter((x) => x.status === "pass").length, checked: criteria.filter((x) => x.status === "pass" || x.status === "fail").length });

export function buildLenses(f: PersonaFacts, price: number | null): { derived: LensDerived; lenses: Lens[] } {
  const d = derive(f, price);
  const ni = f.netIncome.slice(-5);
  const consistent: number | null = ni.length >= 5 ? (ni.every((x) => x.val > 0) ? 1 : 0) : null;
  const ltd = latest(f.longTermDebt), nic = latest(f.netIncome);
  const debtYears = ltd && nic && nic.val > 0 ? ltd.val / nic.val : f.longTermDebt.length === 0 && nic && nic.val > 0 ? 0 : null;
  const buffett = tally("buffett", [
    c("roe", b("Return on equity", "תשואה על ההון"), b("at least 15%", "לפחות 15%"), d.roe, (v) => v >= 15, 1, "%"),
    c("margin", b("Net margin", "שולי רווח נקי"), b("at least 10%", "לפחות 10%"), d.netMargin, (v) => v >= 10, 1, "%"),
    c("steady", b("Profitable every year (last 5 filings)", "רווחי בכל שנה (5 דוחות אחרונים)"), b("5 of 5 years", "5 מתוך 5 שנים"), consistent, (v) => v === 1, 0),
    c("debt", b("Long-term debt in years of earnings", "חוב לטווח ארוך בשנות רווח"), b("at most 4 years", "לכל היותר 4 שנים"), debtYears, (v) => v <= 4, 1, " yr"),
    judgment("moat", b("Durable moat", "יתרון תחרותי מתמשך"), b("A judgment about the business. No number measures it.", "שיפוט על העסק. אין מספר שמודד את זה.")),
    judgment("mos", b("Margin of safety", "מרווח ביטחון"), b("Needs your own estimate of value, which this checklist does not make.", "דורש הערכת שווי משלכם, שהרשימה הזו לא עושה.")),
  ]);
  const graham = tally("graham", [
    c("pe", b("Price to earnings", "מכפיל רווח"), b("at most 15", "לכל היותר 15"), d.pe, (v) => v <= 15, 1),
    c("pb", b("Price to book", "מחיר להון עצמי"), b("at most 1.5", "לכל היותר 1.5"), d.pb, (v) => v <= 1.5, 2),
    c("pepb", b("P/E times P/B", "מכפיל רווח כפול מחיר להון"), b("at most 22.5", "לכל היותר 22.5"), d.pe !== null && d.pb !== null ? d.pe * d.pb : null, (v) => v <= 22.5, 1),
    c("current", b("Current ratio", "יחס שוטף"), b("at least 2", "לפחות 2"), d.currentRatio, (v) => v >= 2, 2),
    c("earn", b("Years with positive earnings (up to 10)", "שנים עם רווח חיובי (עד 10)"), b("every year, at least 5 on file", "בכל שנה, לפחות 5 בדוחות"), f.netIncome.length >= 5 ? (d.yearsPositiveEarnings === Math.min(10, f.netIncome.length) ? 1 : 0) : null, (v) => v === 1, 0),
    d.netNetPerShare !== null && d.netNetPerShare <= 0 ? { id: "netnet", label: b("Net-net: price below 2/3 of (current assets minus all liabilities) per share", "נט-נט: מחיר מתחת ל-2/3 מ(נכסים שוטפים פחות כל ההתחייבויות) למניה"), rule: b("price below 2/3 of that value", "מחיר מתחת ל-2/3 מהערך"), value: "negative", status: "fail" as Status } :
    c("netnet", b("Net-net: price below 2/3 of (current assets minus all liabilities) per share", "נט-נט: מחיר מתחת ל-2/3 מ(נכסים שוטפים פחות כל ההתחייבויות) למניה"), b("price below 2/3 of that value", "מחיר מתחת ל-2/3 מהערך"), d.netNetPerShare !== null && price !== null && price > 0 ? (price / ((2 / 3) * d.netNetPerShare)) : null, (v) => v > 0 && v < 1, 2, "x"),
  ]);
  const lynch = tally("lynch", [
    c("growth", b("EPS growth, 3-year yearly rate", "צמיחת רווח למניה, קצב שנתי ל-3 שנים"), b("above 0%", "מעל 0%"), d.epsCagr3y, (v) => v > 0, 1, "%"),
    c("peg", b("PEG (P/E divided by growth)", "PEG (מכפיל רווח חלקי צמיחה)"), b("at most 1", "לכל היותר 1"), d.peg, (v) => v <= 1, 2),
    c("lev", b("Total liabilities to equity", "סך התחייבויות להון"), b("at most 0.8", "לכל היותר 0.8"), d.liabToEquity, (v) => v <= 0.8, 2),
  ]);
  return { derived: d, lenses: [buffett, graham, lynch] };
}

// ---- parsing SEC companyfacts ------------------------------------------------------------------

type Fact = { end: string; val: number; fy?: number; fp?: string; form?: string };
type Concept = { units?: Record<string, Fact[]> };
const series = (concepts: Record<string, Concept> | undefined, names: string[], unit: string): YearValue[] => {
  for (const n of names) {
    const rows = concepts?.[n]?.units?.[unit];
    if (!rows) continue;
    const fy = rows.filter((r) => r.fp === "FY" && r.form === "10-K" && typeof r.fy === "number" && Number.isFinite(r.val))
      .map((r) => ({ fy: r.fy as number, end: r.end, val: r.val }));
    // the 10-K for fiscal year X also lists prior years: key by period end year instead so each year appears once
    const by = new Map<string, YearValue>();
    fy.forEach((r) => by.set(r.end, r));
    const out = [...by.values()].sort((a, b) => a.end.localeCompare(b.end)).map((r) => ({ ...r, fy: Number(r.end.slice(0, 4)) }));
    if (out.length) return annual(out);
  }
  return [];
};

export function parseCompanyFacts(json: unknown, cik: string): PersonaFacts | null {
  const j = json as { entityName?: string; facts?: { "us-gaap"?: Record<string, Concept>; dei?: Record<string, Concept> } };
  const g = j?.facts?.["us-gaap"];
  if (!g) return null;
  const shares = series(g, ["CommonStockSharesOutstanding"], "shares");
  const dei = j.facts?.dei?.EntityCommonStockSharesOutstanding?.units?.shares;
  const sharesOutstanding = shares.length ? shares[shares.length - 1].val : dei?.length ? dei[dei.length - 1].val : null;
  const out: PersonaFacts = {
    cik, name: j.entityName ?? "",
    equity: series(g, ["StockholdersEquity"], "USD"),
    netIncome: series(g, ["NetIncomeLoss"], "USD"),
    revenue: series(g, ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet"], "USD"),
    epsDiluted: series(g, ["EarningsPerShareDiluted"], "USD/shares"),
    liabilities: series(g, ["Liabilities"], "USD"),
    currentAssets: series(g, ["AssetsCurrent"], "USD"),
    currentLiabilities: series(g, ["LiabilitiesCurrent"], "USD"),
    longTermDebt: series(g, ["LongTermDebt", "LongTermDebtNoncurrent"], "USD"),
    sharesOutstanding,
  };
  return out.equity.length || out.netIncome.length ? out : null;
}
