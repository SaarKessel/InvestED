// ---------------------------------------------------------------------------
// InvestED - SEC Form N-PORT reader (ETF / fund constituents, read-only)
//
// Latest public N-PORT holdings of a fund series from SEC EDGAR (free,
// official). Nothing is estimated or mapped: names, CUSIPs and values are
// exactly as the fund reported them. Only quarter-end reports are public,
// about 60 days after quarter end, so the data can be 2-4 months old; the
// report date is always returned. Funds that file no N-PORT (for example
// unit investment trusts such as SPY) are reported as unavailable.
// Educational data, not advice.
// ---------------------------------------------------------------------------

import { SecUnavailableError, type SecFetch } from "./thirteenF.js";

export class NoNportError extends Error {}
export class NportParseError extends Error {}

export interface FundHolding {
  name: string;
  title: string;
  cusip: string;
  isin: string;
  balance: number;
  units: string;
  valueUsd: number;
  /** Percent of the fund's net assets, as reported. */
  weightPct: number;
  assetCategory: string;
  payoffProfile: string;
}

export interface FundHoldings {
  ticker: string;
  cik: string;
  seriesId: string;
  seriesName: string;
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  netAssetsUsd: number | null;
  totalHoldingCount: number;
  holdings: FundHolding[];
  /** Sum of the shown holdings' weights, so the card can say how much of the fund is covered. */
  shownWeightPct: number;
  sourceUrl: string;
}

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<(?:\\w+:)?${name}>([\\s\\S]*?)</(?:\\w+:)?${name}>`));
  return m ? decode(m[1].trim()) : null;
}
function num(block: string, name: string): number | null {
  const raw = tag(block, name);
  if (raw === null || raw === "") return null;
  const v = Number(raw);
  return Number.isFinite(v) ? v : null;
}

export function cleanTicker(input: string): string | null {
  const t = input.trim().toUpperCase();
  return /^[A-Z][A-Z0-9.-]{0,7}$/.test(t) ? t : null;
}

export interface SeriesRef { cik: string; seriesId: string; classId: string }

/** company_tickers_mf.json: { fields: [cik, seriesId, classId, symbol], data: [...] } */
export function findFundSeries(mfJson: unknown, ticker: string): SeriesRef | null {
  const j = mfJson as { fields?: string[]; data?: unknown[][] };
  if (!j?.fields || !Array.isArray(j.data)) return null;
  const ix = (n: string) => j.fields!.indexOf(n);
  const [ci, si, cl, sy] = [ix("cik"), ix("seriesId"), ix("classId"), ix("symbol")];
  if ([ci, si, cl, sy].some((i) => i < 0)) return null;
  const row = j.data.find((r) => String(r[sy]).toUpperCase() === ticker);
  return row ? { cik: String(row[ci]).padStart(10, "0"), seriesId: String(row[si]), classId: String(row[cl]) } : null;
}

/** Newest NPORT-P entry from the series' EDGAR atom feed. */
export function pickLatestNport(atom: string): { accessionNumber: string; filingDate: string } | null {
  for (const entry of atom.match(/<entry>[\s\S]*?<\/entry>/g) ?? []) {
    if (tag(entry, "filing-type") === "NPORT-P") {
      const accessionNumber = tag(entry, "accession-number");
      if (accessionNumber) return { accessionNumber, filingDate: tag(entry, "filing-date") ?? "" };
    }
  }
  return null;
}

export function parseNport(xml: string, expectedSeriesId: string, topN: number) {
  const seriesId = tag(xml, "seriesId");
  if (!seriesId) throw new NportParseError("No seriesId in filing");
  if (seriesId !== expectedSeriesId) throw new NportParseError("Filing is for a different fund series");
  const blocks = xml.match(/<invstOrSec>[\s\S]*?<\/invstOrSec>/g);
  if (!blocks || blocks.length === 0) throw new NportParseError("No holdings found");
  const rows: FundHolding[] = [];
  for (const b of blocks) {
    const name = tag(b, "name");
    const value = num(b, "valUSD");
    const pct = num(b, "pctVal");
    if (!name || value === null || pct === null) continue; // a row we cannot read fully is left out, never guessed
    rows.push({
      name,
      title: tag(b, "title") ?? "",
      cusip: tag(b, "cusip") ?? "",
      isin: b.match(/<isin\s+value="([^"]+)"/)?.[1] ?? "",
      balance: num(b, "balance") ?? 0,
      units: tag(b, "units") ?? "",
      valueUsd: value,
      weightPct: Number(pct.toFixed(3)),
      assetCategory: tag(b, "assetCat") ?? "",
      payoffProfile: tag(b, "payoffProfile") ?? "",
    });
  }
  if (rows.length === 0) throw new NportParseError("No readable holdings");
  rows.sort((a, b) => b.weightPct - a.weightPct);
  const holdings = rows.slice(0, topN);
  return {
    seriesName: tag(xml, "seriesName") ?? "",
    reportDate: tag(xml, "repPdDate") ?? "",
    netAssetsUsd: num(xml, "netAssets"),
    totalHoldingCount: blocks.length,
    holdings,
    shownWeightPct: Number(holdings.reduce((s, h) => s + h.weightPct, 0).toFixed(2)),
  };
}

async function getText(fetchSec: SecFetch, url: string): Promise<string> {
  let r;
  try { r = await fetchSec(url); } catch { throw new SecUnavailableError(`SEC request failed: ${url}`); }
  if (!r.ok) throw new SecUnavailableError(`SEC returned HTTP ${r.status}`);
  return r.text();
}

export async function fetchFundHoldings(
  tickerInput: string,
  fetchSec: SecFetch,
  options: { topN?: number; seriesMap?: unknown } = {}
): Promise<FundHoldings> {
  const ticker = cleanTicker(tickerInput);
  if (!ticker) throw new NoNportError("Invalid ticker");
  const map = options.seriesMap ?? JSON.parse(await getText(fetchSec, "https://www.sec.gov/files/company_tickers_mf.json"));
  const ref = findFundSeries(map, ticker);
  if (!ref) throw new NoNportError("Ticker is not a registered fund or ETF series with N-PORT filings");

  const atom = await getText(fetchSec, `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${ref.seriesId}&type=NPORT-P&dateb=&owner=include&count=5&output=atom`);
  const latest = pickLatestNport(atom);
  if (!latest) throw new NoNportError("No N-PORT filing found for this fund");

  const folder = latest.accessionNumber.replace(/-/g, "");
  const sourceUrl = `https://www.sec.gov/Archives/edgar/data/${Number(ref.cik)}/${folder}/primary_doc.xml`;
  const parsed = parseNport(await getText(fetchSec, sourceUrl), ref.seriesId, options.topN ?? 10);
  return { ticker, cik: ref.cik, seriesId: ref.seriesId, accessionNumber: latest.accessionNumber, filingDate: latest.filingDate, sourceUrl, ...parsed };
}
