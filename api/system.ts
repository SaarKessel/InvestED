// InvestED - /api/system: one serverless function that serves the read-only operations endpoints
// (health, sec-13f, sec-nport). Public URLs /api/health and /api/sec-13f are rewrites in vercel.json.
// Kept as one function because the free Vercel plan allows at most 12 functions.
import closesHandler from "../src/lib/api/closesHandler.js";
import copy13fHandler from "../src/lib/api/copy13fHandler.js";
import personaFactsHandler from "../src/lib/api/personaFactsHandler.js";
import dividendHandler from "../src/lib/api/dividendHandler.js";
import healthHandler from "../src/lib/api/healthHandler.js";
import imfHandler from "../src/lib/api/imfHandler.js";
import newsSentimentHandler from "../src/lib/api/newsSentimentHandler.js";
import nportHandler from "../src/lib/api/nportHandler.js";
import researchBriefHandler from "../src/lib/api/researchBriefHandler.js";
import sec13fHandler from "../src/lib/api/sec13fHandler.js";

type Req = { query?: Record<string, string | string[] | undefined>; method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> };
type Res = { setHeader(n: string, v: string): void; status(c: number): { json(b: unknown): void } };

export default async function handler(req: Req, res: Res) {
  const fn = Array.isArray(req.query?.fn) ? req.query?.fn[0] : req.query?.fn;
  if (fn === "closes") return closesHandler(req, res);
  if (fn === "copy-13f") return copy13fHandler(req, res);
  if (fn === "persona-facts") return personaFactsHandler(req, res);
  if (fn === "health") return healthHandler(req, res);
  if (fn === "sec-13f") return sec13fHandler(req, res);
  if (fn === "sec-nport") return nportHandler(req, res);
  if (fn === "imf-weo") return imfHandler(req, res);
  if (fn === "research-brief") return researchBriefHandler(req, res);
  if (fn === "news-sentiment") return newsSentimentHandler(req, res);
  if (fn === "dividends") return dividendHandler(req, res);
  res.status(404).json({ error: "unknown_function" });
}
