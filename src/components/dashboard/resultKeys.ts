/** The approved structured-result types the chat can render as cards (see resultCards.tsx). */
export const RESULT_KEYS = ["desk", "calc", "symbol", "scenario", "marketsim", "wb", "filings", "etf", "macro", "fx", "prov", "math"] as const;
export type ResultKey = (typeof RESULT_KEYS)[number];
