// ---------------------------------------------------------------------------
// InvestED — streaming rephrase trailer (shared, client + tests)
//
// Stream mode of /api/copilot-chat sends plain-text chunks as they generate,
// then a trailer:
//   \n[[INVESTED_FACTS:<base64 JSON string[]>]]\n[[INVESTED_VERDICT:ok|fallback]]
// Facts are the server-side tool results the model actually used; the client
// adds them to the accepted number sources so tool-grounded figures pass the
// same no-new-numbers check as engine facts. Missing/fallback trailer = the
// whole stream is discarded and the deterministic answer stands.
// ---------------------------------------------------------------------------

export const FACTS_MARKER = "\n[[INVESTED_FACTS:";
export const VERDICT_OK = "\n[[INVESTED_VERDICT:ok]]";
export const VERDICT_FALLBACK = "\n[[INVESTED_VERDICT:fallback]]";

export interface StreamedRephrase {
  ok: boolean;
  text: string;
  acceptedFacts: string[];
}

/** Strip everything from the first trailer marker onward (progressive display). */
export function visibleStreamText(raw: string): string {
  const cut = raw.indexOf("\n[[");
  return (cut === -1 ? raw : raw.slice(0, cut)).trim();
}

export function encodeFactsTrailer(facts: string[]): string {
  return `${FACTS_MARKER}${Buffer.from(JSON.stringify(facts), "utf8").toString("base64")}]]`;
}

export function splitStreamTrailer(raw: string): StreamedRephrase {
  if (raw.includes(VERDICT_FALLBACK) || !raw.includes(VERDICT_OK)) {
    return { ok: false, text: "", acceptedFacts: [] };
  }
  const text = visibleStreamText(raw.split(VERDICT_OK)[0]);
  let acceptedFacts: string[] = [];
  const start = raw.indexOf(FACTS_MARKER);
  if (start !== -1) {
    const end = raw.indexOf("]]", start + FACTS_MARKER.length);
    if (end !== -1) {
      try {
        const decoded: unknown = JSON.parse(Buffer.from(raw.slice(start + FACTS_MARKER.length, end), "base64").toString("utf8"));
        if (Array.isArray(decoded)) acceptedFacts = decoded.filter((f): f is string => typeof f === "string");
      } catch { acceptedFacts = []; }
    }
  }
  return { ok: text.length > 0, text, acceptedFacts };
}
