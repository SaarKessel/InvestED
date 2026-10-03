/**
 * "What is VOO?" answered from a static, trimmed symbol list built from FinanceDatabase (MIT).
 * Metadata only: name, kind, sector or issuer. No prices, no advice. The file is loaded on demand.
 */
import { findConcept } from "../knowledge/concepts/registry";

export interface SymbolInfo { symbol: string; kind: "equity" | "fund"; name: string; sector: string | null; size: string | null; issuer: string | null }
type Row = [string, string, string, string, string];

const ASK = /^\s*(?:[Ww]hat(?:'s| is| does)|[Ww]ho is|[Tt]ell me about|[Ee]xplain|מה זה|מהו|מהי|ספר(?:י)? לי על|הסבר(?:י)? על)\s+\$?([A-Z]{1,5})\s*(?:stock|etf|fund|מניה|קרן)?\s*\??\s*$/;

/** Returns the ticker when the whole question is "what is TICKER" with an uppercase ticker that is not a finance term. */
export function parseSymbolQuestion(text: string): string | null {
  const m = ASK.exec(text);
  if (!m) return null;
  const sym = m[1];
  if (findConcept(sym)) return null;
  return sym;
}

let cache: Promise<Record<string, Row>> | null = null;
export const loadSymbols = (): Promise<Record<string, Row>> => (cache ??= import("../../data/symbols.json").then((m) => m.default as unknown as Record<string, Row>));

export function toInfo(symbol: string, row: Row | undefined): SymbolInfo | null {
  if (!row) return null;
  return row[0] === "E"
    ? { symbol, kind: "equity", name: row[1], sector: row[2] || null, size: row[4] || null, issuer: null }
    : { symbol, kind: "fund", name: row[1], sector: null, size: null, issuer: row[4] || null };
}

export async function lookupSymbol(symbol: string): Promise<SymbolInfo | null> {
  try { return toInfo(symbol, (await loadSymbols())[symbol]); } catch { return null; }
}
