// Production smoke test: node scripts/smoke.mjs [baseUrl]. Read-only GETs. Exit code 1 if any check fails.
const base = (process.argv[2] || "https://investeducationai.vercel.app").replace(/\/$/, "");
const checks = [];
const get = async (path, init) => {
  const r = await fetch(base + path, { ...init, signal: AbortSignal.timeout(20000) });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: r.status, text, json };
};
const check = async (name, fn) => {
  try { const msg = await fn(); checks.push({ name, ok: true, msg }); } catch (e) { checks.push({ name, ok: false, msg: e instanceof Error ? e.message : String(e) }); }
};
const need = (cond, msg) => { if (!cond) throw new Error(msg); };

await check("home page serves the app", async () => { const r = await get("/"); need(r.status === 200 && /index-[\w-]+\.js/.test(r.text), `status ${r.status}`); return "ok"; });
await check("/api/market-quote returns real daily data", async () => {
  const r = await get("/api/market-quote?symbols=AAPL,SPY&range=1y");
  need(r.status === 200 && r.json, `status ${r.status}`);
  const s = JSON.stringify(r.json); need(/yahoo/i.test(s), "no provider named"); return `${s.length} bytes`;
});
await check("/api/news has items with links", async () => {
  const r = await get("/api/news"); need(r.status === 200 && r.json?.available === true, `available=${r.json?.available}`);
  const it = r.json.items?.[0]; need(it?.title && /^https:/.test(it.url || ""), "first item lacks title or https url"); return `${r.json.items.length} items`;
});
await check("/api/market-movers is available", async () => { const r = await get("/api/market-movers"); need(r.status === 200 && r.json?.available === true, `available=${r.json?.available}`); return "ok"; });
await check("/api/news-feeds is available with https links only", async () => {
  const r = await get("/api/news-feeds"); need(r.status === 200 && r.json?.available === true, `available=${r.json?.available}`);
  need((r.json.items || []).every((i) => /^https:/.test(i.url)), "non-https link"); return `${r.json.items.length} items`;
});
await check("/api/health reports every provider", async () => { const r = await get("/api/health"); need(r.status === 200 && Array.isArray(r.json?.checks) && r.json.checks.length >= 5, `status ${r.status}`); const down = r.json.checks.filter((c) => !c.ok).map((c) => `${c.name}: ${c.detail}`); need(down.length === 0, `down: ${down.join("; ")}`); return `${r.json.checks.length} providers ok`; });
await check("cron endpoint refuses without the secret", async () => { const r = await get("/api/cron/daily-feed"); need(r.status === 401, `status ${r.status}`); return "401"; });
await check("daily_feed rows are publicly readable but not writable", async () => {
  const url = "https://yltbcsmkpjosyovsvtmn.supabase.co/rest/v1/daily_feed";
  const key = "sb_publishable_mmnIVK2ZxZ79gcqSrER-Aw_UxV5WF9q"; // public publishable key
  const rd = await fetch(`${url}?select=feed_date&limit=1`, { headers: { apikey: key }, signal: AbortSignal.timeout(20000) }); need(rd.status === 200, `read ${rd.status}`);
  const wr = await fetch(url, { method: "POST", headers: { apikey: key, "Content-Type": "application/json" }, body: JSON.stringify({ feed_date: "2000-01-01", kind: "headlines", payload: {}, source: "smoke" }), signal: AbortSignal.timeout(20000) });
  need(wr.status === 401 || wr.status === 403, `anon write returned ${wr.status}`); return "read 200, write denied";
});

for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name}  ${c.msg}`);
process.exit(checks.every((c) => c.ok) ? 0 : 1);
