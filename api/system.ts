// InvestED - /api/system: one serverless function that serves the read-only operations endpoints
// (health, sec-13f, sec-nport). Public URLs /api/health and /api/sec-13f are rewrites in vercel.json.
// Kept as one function because the free Vercel plan allows at most 12 functions.
import healthHandler from "../src/lib/api/healthHandler.js";
import nportHandler from "../src/lib/api/nportHandler.js";
import sec13fHandler from "../src/lib/api/sec13fHandler.js";

type Req = { query?: Record<string, string | string[] | undefined> };
type Res = { setHeader(n: string, v: string): void; status(c: number): { json(b: unknown): void } };

export default async function handler(req: Req, res: Res) {
  const fn = Array.isArray(req.query?.fn) ? req.query?.fn[0] : req.query?.fn;
  if (fn === "health") return healthHandler(req, res);
  if (fn === "sec-13f") return sec13fHandler(req, res);
  if (fn === "sec-nport") return nportHandler(req, res);
  res.status(404).json({ error: "unknown_function" });
}
