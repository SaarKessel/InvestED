/**
 * Institutional holdings from SEC Form 13F, through the site's own /api/sec-13f (SEC EDGAR, free, official).
 * Fires only when the question names a known manager (or gives a CIK) AND asks for holdings. Values are
 * shown exactly as the manager reported them. 13F is delayed, long-only and not a live portfolio.
 */
export interface FilingsRequest { cik: string; managerName: { en: string; he: string } }
export interface FilingHolding { issuer: string; titleOfClass: string; cusip: string; valueUsd: number; shares: number; shareType: string; weightPct: number }
export interface FilingsResult extends FilingsRequest {
  filerName: string; reportDate: string; filingDate: string; form: string;
  reportedTotalValueUsd: number | null; reportedEntryCount: number | null;
  holdings: FilingHolding[]; sourceUrl: string;
}

/** Managers whose CIK was checked against SEC EDGAR (the filer name matches). */
const MANAGERS: { cik: string; re: RegExp; name: { en: string; he: string } }[] = [
  { cik: "0001067983", re: /(?:berkshire|buffett)|(?<![א-ת])[הבלומשכ]?(?:ברקשייר|באפט)(?![א-ת])/i, name: { en: "Berkshire Hathaway", he: "ברקשייר האת'אווי" } },
  { cik: "0001350694", re: /(?:bridgewater|dalio)|(?<![א-ת])[הבלומשכ]?(?:ברידג'?ווטר|דליו)(?![א-ת])/i, name: { en: "Bridgewater Associates", he: "ברידג'ווטר" } },
  { cik: "0001649339", re: /(?:scion|burry)|(?<![א-ת])[הבלומשכ]?(?:בורי)(?![א-ת])/i, name: { en: "Scion Asset Management", he: "Scion Asset Management" } },
  { cik: "0001336528", re: /(?:pershing|ackman)|(?<![א-ת])[הבלומשכ]?(?:אקמן|פרשינג)(?![א-ת])/i, name: { en: "Pershing Square", he: "פרשינג סקוור" } },
  { cik: "0001037389", re: /(?:renaissance|medallion)|(?<![א-ת])[הבלומשכ]?(?:רנסנס)(?![א-ת])/i, name: { en: "Renaissance Technologies", he: "רנסנס טכנולוג'יז" } },
  { cik: "0000102909", re: /(?:vanguard)|(?<![א-ת])[הבלומשכ]?(?:ונגארד)(?![א-ת])/i, name: { en: "Vanguard Group", he: "ונגארד" } },
  { cik: "0001423053", re: /(?:citadel)|(?<![א-ת])[הבלומשכ]?(?:סיטדל)(?![א-ת])/i, name: { en: "Citadel Advisors", he: "סיטדל" } },
  { cik: "0001167483", re: /(?:tiger global)|(?<![א-ת])[הבלומשכ]?(?:טייגר גלובל)(?![א-ת])/i, name: { en: "Tiger Global Management", he: "טייגר גלובל" } },
  { cik: "0001656456", re: /(?:appaloosa|tepper)|(?<![א-ת])[הבלומשכ]?(?:טפר)(?![א-ת])/i, name: { en: "Appaloosa", he: "אפלוזה" } },
  { cik: "0001603466", re: /(?:point ?72)|(?<![א-ת])[הבלומשכ]?(?:פוינט72|פוינט 72)(?![א-ת])/i, name: { en: "Point72", he: "פוינט72" } },
];

const ASKS_HOLDINGS = /13-?f\b|\bholdings?\b|\bpositions?\b|what (?:(?:stocks|shares|companies|positions) )?(?:does|did|do|is|are) .{1,60}?\b(?:own|hold|buy|bought|holding|buying|selling|sold|invested in)\b|\bportfolio\b|החזקות|מה (?:יש|מחזיק|מחזיקה|קנה|קנתה|הוא מחזיק)|במה (?:מחזיק|מחזיקה|השקיע|השקיעה)|במה [א-ת'"-]{2,15} (?:מחזיק|מחזיקה)|המניות של|תיק ההשקעות של/i;

/** The known manager a question names, or null. Shared with the copy-the-fund desk. */
export function findManager(text: string): FilingsRequest | null {
  const cikMatch = text.match(/\bcik\b\D{0,3}(\d{4,10})\b/i);
  if (cikMatch) {
    const cik = cikMatch[1].padStart(10, "0");
    const known = MANAGERS.find((m) => m.cik === cik);
    return { cik, managerName: known?.name ?? { en: `CIK ${Number(cik)}`, he: `CIK ${Number(cik)}` } };
  }
  // "holdings of Vanguard S&P 500 ETF" asks about a fund, not the manager's 13F, unless 13F is named.
  if (/\b(?:etfs?|index funds?|mutual funds?)\b|קרן סל|קרן מחקה|קרן נאמנות|תעודת סל/i.test(text) && !/13-?f\b/i.test(text)) return null;
  const m = MANAGERS.find((x) => x.re.test(text));
  return m ? { cik: m.cik, managerName: m.name } : null;
}

export function parseFilingsRequest(text: string): FilingsRequest | null {
  if (text.length > 140 || !ASKS_HOLDINGS.test(text)) return null;
  const cikMatch = text.match(/\bcik\b\D{0,3}(\d{4,10})\b/i);
  if (cikMatch) {
    const cik = cikMatch[1].padStart(10, "0");
    const known = MANAGERS.find((m) => m.cik === cik);
    return { cik, managerName: known?.name ?? { en: `CIK ${Number(cik)}`, he: `CIK ${Number(cik)}` } };
  }
  const m = MANAGERS.find((x) => x.re.test(text));
  return m ? { cik: m.cik, managerName: m.name } : null;
}

export async function loadFilings(req: FilingsRequest, fetcher: typeof fetch = fetch): Promise<FilingsResult | null> {
  try {
    const r = await fetcher(`/api/sec-13f?cik=${encodeURIComponent(req.cik)}&top=10`);
    if (!r.ok) return null;
    const j = (await r.json()) as { filing?: Record<string, unknown> };
    const f = j.filing;
    if (!f || !Array.isArray(f.holdings) || f.holdings.length === 0 || typeof f.reportDate !== "string") return null;
    const holdings = (f.holdings as FilingHolding[]).filter((h) => typeof h.issuer === "string" && Number.isFinite(h.valueUsd) && Number.isFinite(h.shares) && Number.isFinite(h.weightPct));
    if (holdings.length === 0) return null;
    return {
      ...req,
      filerName: typeof f.managerName === "string" ? f.managerName : "",
      reportDate: f.reportDate, filingDate: typeof f.filingDate === "string" ? f.filingDate : "", form: typeof f.form === "string" ? f.form : "13F-HR",
      reportedTotalValueUsd: typeof f.reportedTotalValueUsd === "number" ? f.reportedTotalValueUsd : null,
      reportedEntryCount: typeof f.reportedEntryCount === "number" ? f.reportedEntryCount : null,
      holdings, sourceUrl: typeof f.sourceUrl === "string" ? f.sourceUrl : "",
    };
  } catch { return null; }
}

/** $ in billions or millions, as the card prints it. */
export function formatUsd(v: number): string {
  const a = Math.abs(v);
  if (a >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  return `$${Math.round(v).toLocaleString("en-US")}`;
}
