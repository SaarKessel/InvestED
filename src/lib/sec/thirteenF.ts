// ---------------------------------------------------------------------------
// InvestED - SEC Form 13F reader (read-only)
//
// Reads an institutional manager's latest 13F-HR holdings from SEC EDGAR
// (public, free, official). Nothing is estimated: values are exactly as
// the manager reported them, holdings are only summed across the filing's
// own rows for the same CUSIP and class, and a filing that cannot be
// read or parsed is reported as unavailable.
//
// 13F covers long positions in US-listed securities reported with a
// delay of up to 45 days after quarter end. It is not a live portfolio.
// Educational data, not advice.
// ---------------------------------------------------------------------------

export interface Holding {
  issuer: string;
  titleOfClass: string;
  cusip: string;
  /** Reported value in US dollars (filings from 2023 onward report whole dollars). */
  valueUsd: number;
  shares: number;
  shareType: string;
  /** Share of the filing's reported total value, in percent. */
  weightPct: number;
}

export interface Latest13F {
  cik: string;
  managerName: string;
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  form: string;
  reportedTotalValueUsd: number | null;
  reportedEntryCount: number | null;
  holdings: Holding[];
  sourceUrl: string;
}

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<(?:\\w+:)?${name}>([\\s\\S]*?)</(?:\\w+:)?${name}>`));
  return m ? decode(m[1].trim()) : null;
}

export class ThirteenFParseError extends Error {}

export function cleanCik(input: string): string | null {
  const digits = input.trim().replace(/^CIK/i, "");
  return /^\d{1,10}$/.test(digits) ? digits.padStart(10, "0") : null;
}

/** Aggregate rows with the same CUSIP + class (filings split rows per sub-manager). */
export function parseInfoTable(xml: string): Omit<Holding, "weightPct">[] {
  const blocks = xml.match(/<(?:\w+:)?infoTable>[\s\S]*?<\/(?:\w+:)?infoTable>/g);
  if (!blocks || blocks.length === 0) throw new ThirteenFParseError("No infoTable rows found");
  const merged = new Map<string, Omit<Holding, "weightPct">>();
  for (const block of blocks) {
    const cusip = tag(block, "cusip");
    const rawValue = tag(block, "value");
    const rawShares = tag(block, "sshPrnamt");
    const value = rawValue ? Number(rawValue) : NaN;
    const shares = rawShares ? Number(rawShares) : NaN;
    const issuer = tag(block, "nameOfIssuer");
    if (!cusip || !issuer || !Number.isFinite(value) || !Number.isFinite(shares)) {
      throw new ThirteenFParseError("Malformed infoTable row");
    }
    const titleOfClass = tag(block, "titleOfClass") ?? "";
    const shareType = tag(block, "sshPrnamtType") ?? "SH";
    const key = `${cusip}|${titleOfClass}|${shareType}`;
    const existing = merged.get(key);
    if (existing) {
      existing.valueUsd += value;
      existing.shares += shares;
    } else {
      merged.set(key, { issuer, titleOfClass, cusip, valueUsd: value, shares, shareType });
    }
  }
  return [...merged.values()];
}

export function parsePrimaryDoc(xml: string): { reportedTotalValueUsd: number | null; reportedEntryCount: number | null } {
  const num = (name: string): number | null => {
    const raw = tag(xml, name);
    const value = raw === null || raw === "" ? NaN : Number(raw);
    return Number.isFinite(value) ? value : null;
  };
  return { reportedTotalValueUsd: num("tableValueTotal"), reportedEntryCount: num("tableEntryTotal") };
}

interface SubmissionsJson {
  name?: string;
  filings?: { recent?: Record<string, string[]> };
}

export function pickLatest13F(submissions: SubmissionsJson): {
  accessionNumber: string;
  form: string;
  filingDate: string;
  reportDate: string;
} | null {
  const recent = submissions.filings?.recent;
  if (!recent?.form || !recent.accessionNumber) return null;
  for (let i = 0; i < recent.form.length; i++) {
    if (recent.form[i] === "13F-HR" || recent.form[i] === "13F-HR/A") {
      return {
        accessionNumber: recent.accessionNumber[i],
        form: recent.form[i],
        filingDate: recent.filingDate?.[i] ?? "",
        reportDate: recent.reportDate?.[i] ?? "",
      };
    }
  }
  return null;
}

export type SecFetch = (url: string) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

export class SecUnavailableError extends Error {}
export class No13FError extends Error {}

async function getText(fetchSec: SecFetch, url: string): Promise<string> {
  let response;
  try {
    response = await fetchSec(url);
  } catch {
    throw new SecUnavailableError(`SEC request failed: ${url}`);
  }
  if (!response.ok) throw new SecUnavailableError(`SEC returned HTTP ${response.status}`);
  return response.text();
}

export async function fetchLatest13F(cikInput: string, fetchSec: SecFetch, options: { topN?: number } = {}): Promise<Latest13F> {
  const cik = cleanCik(cikInput);
  if (!cik) throw new No13FError("Invalid CIK");
  const submissions = JSON.parse(await getText(fetchSec, `https://data.sec.gov/submissions/CIK${cik}.json`)) as SubmissionsJson;
  const latest = pickLatest13F(submissions);
  if (!latest) throw new No13FError("No 13F-HR filing found for this filer");

  const cikNumber = String(Number(cik));
  const folder = latest.accessionNumber.replace(/-/g, "");
  const base = `https://www.sec.gov/Archives/edgar/data/${cikNumber}/${folder}`;
  const index = JSON.parse(await getText(fetchSec, `${base}/index.json`)) as { directory?: { item?: { name: string }[] } };
  const names = (index.directory?.item ?? []).map((item) => item.name).filter((n) => n.toLowerCase().endsWith(".xml"));
  const infoName = names.find((n) => n !== "primary_doc.xml");
  if (!infoName) throw new ThirteenFParseError("Information table not found in filing");

  const [infoXml, primaryXml] = await Promise.all([
    getText(fetchSec, `${base}/${infoName}`),
    getText(fetchSec, `${base}/primary_doc.xml`).catch(() => ""),
  ]);
  const rows = parseInfoTable(infoXml);
  const { reportedTotalValueUsd, reportedEntryCount } = primaryXml
    ? parsePrimaryDoc(primaryXml)
    : { reportedTotalValueUsd: null, reportedEntryCount: null };

  const total = rows.reduce((s, r) => s + r.valueUsd, 0);
  const holdings = rows
    .map((r) => ({ ...r, weightPct: total > 0 ? Number(((r.valueUsd / total) * 100).toFixed(2)) : 0 }))
    .sort((a, b) => b.valueUsd - a.valueUsd)
    .slice(0, options.topN ?? 25);

  return {
    cik,
    managerName: submissions.name ?? "",
    ...latest,
    reportedTotalValueUsd,
    reportedEntryCount,
    holdings,
    sourceUrl: `${base}/${infoName}`,
  };
}
