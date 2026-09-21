// ---------------------------------------------------------------------------
// InvestED — AI News client: fetches /api/news and types the payload.
// ---------------------------------------------------------------------------

export interface NewsKeyFact { label: string; value: string }
export interface NewsImplication { scope: "company" | "transaction" | "sector" | "macro"; text: string }

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  summary?: string;
  symbols: string[];
  eventType: string;
  eventLabel: { he: string; en: string };
  keyFacts: { he: NewsKeyFact[]; en: NewsKeyFact[] };
  implications: { he: NewsImplication[]; en: NewsImplication[] };
}

export interface NewsResult {
  available: boolean;
  items: NewsItem[];
  fetchedAt: string;
}

export async function fetchNews(): Promise<NewsResult> {
  const response = await fetch("/api/news");
  if (!response.ok) throw new Error(`news responded ${response.status}`);
  return (await response.json()) as NewsResult;
}
