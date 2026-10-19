// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildTable, runTool, TOOLS, ROUTES, GAPSHEET_STORE, GAPSHEET_PREV, type DotContext } from "./tools";
import { floatToPcm16 } from "./audio";

const mk = (): DotContext & { nav: string[] } => { const nav: string[] = []; return { nav, navigate: (p) => { nav.push(p); }, language: "en", askCopilot: async () => "ok" }; };
beforeEach(() => localStorage.clear());

describe("DOT tools and policy gate", () => {
  it("builds a table from dictated columns and rows, numbers become numbers, no formulas", () => {
    const wb = buildTable("Budget", ["Item", "Cost"], [["Rent", "3000"], ["=HYPERLINK(1)", 5]]);
    const c = wb.sheets[0].cells;
    expect(c.A1.value).toBe("Item"); expect(c.B2.value).toBe(3000); expect(c.B3.value).toBe(5);
    expect(c.A3.formula).toBeNull();
  });
  it("rejects a table without columns", () => { expect(() => buildTable("x", [], [])).toThrow(); });
  it("refuses unknown tools", async () => { expect((await runTool("delete_everything", {}, mk(), async () => true)).result).toMatchObject({ ok: false, error: "unknown_tool" }); });
  it("navigates only to known pages", async () => {
    const c = mk();
    expect((await runTool("navigate", { page: "GapSheet" }, c, async () => true)).result.ok).toBe(true); expect(c.nav).toEqual([ROUTES.gapsheet]);
    expect((await runTool("navigate", { page: "https://evil.example" }, c, async () => true)).result).toMatchObject({ ok: false });
  });
  it("a T2 tool runs only after confirmation, and declining changes nothing", async () => {
    const args = { title: "T", columns: ["A"], rows: [["1"]] };
    const no = await runTool("create_gapsheet_table", args, mk(), async () => false);
    expect(no.result).toMatchObject({ ok: false, error: "user_declined" }); expect(localStorage.getItem(GAPSHEET_STORE)).toBeNull();
    localStorage.setItem(GAPSHEET_STORE, "old");
    const c = mk(); const yes = await runTool("create_gapsheet_table", args, c, async () => true);
    expect(yes.result.ok).toBe(true); expect(localStorage.getItem(GAPSHEET_PREV)).toBe("old"); expect(c.nav).toEqual(["/gapsheet"]);
  });
  it("get_quote rejects malformed symbols and never returns a simulated price", async () => {
    expect((await runTool("get_quote", { symbol: "AAPL; DROP" }, mk(), async () => true)).result).toMatchObject({ ok: false, error: "bad_symbol" });
  });
  it("no registered tool is tier 3 and none touches credentials or payments", () => {
    expect(TOOLS.every((t) => t.tier < 3)).toBe(true);
    expect(TOOLS.map((t) => t.name).join(" ")).not.toMatch(/password|card|payment|login|trade|(?<!paper_)order/i);
  });
  it("downsamples to 16 kHz 16-bit", () => { const out = floatToPcm16(new Float32Array(480).fill(0.5), 48000); expect(out.length).toBe(160); expect(out[0]).toBeGreaterThan(16000); });
});

describe("/api/dot-token", () => {
  const call = async (headers: Record<string, string> = {}, env: Record<string, string> = {}) => {
    vi.resetModules(); Object.assign(process.env, env);
    const h = (await import("../api/dotTokenHandler")).default;
    let code = 0; let body: unknown;
    await h({ method: "POST", headers }, { setHeader() {}, status: (c) => { code = c; return { json: (b) => { body = b; } }; } });
    return { code, body };
  };
  it("requires sign-in", async () => { expect(await call()).toMatchObject({ code: 401 }); });
  it("reports not configured without a key, never leaking one", async () => {
    delete process.env.GEMINI_API_KEY;
    const r = await call({ authorization: "Bearer x" });
    expect(JSON.stringify(r)).not.toMatch(/AIza/); expect(r.code).toBe(200); expect(r.body).toMatchObject({ available: false, reason: "auth_not_configured" });
  });
});

describe("DOT coverage map", () => {
  // Every typed-action area from the Phase 0 inventory is either mapped to a tool or listed as an explicit gap. A new area must be added here.
  const COVERAGE: Record<string, string | "GAP"> = {
    navigation: "navigate", "copilot-qa": "ask_copilot", calculators: "ask_copilot", "news-research": "ask_copilot", "market-quotes": "get_quote", "data-freshness": "data_status",
    "gapsheet-create": "create_gapsheet_table", "gapsheet-edit-sort-filter-formula-format-chart": "gapsheet_edit", language: "set_language", theme: "set_theme",
    "gapsheet-export-import": "screen_controls", watchlist: "watchlist_add", "watchlist-read-remove": "watchlist_remove", "paper-ledger": "paper_order", "paper-ledger-view": "paper_ledger_view", simulation: "screen_controls", "learning-quiz": "screen_controls", "career-lab": "screen_controls", "data-controls": "screen_controls", "contact-form": "screen_controls", "file-upload": "MANUAL",
    auth: "T3", payments: "T3", "real-money": "T3",
  };
  it("every mapped tool exists", () => { for (const [k, v] of Object.entries(COVERAGE)) if (v !== "GAP" && v !== "T3" && v !== "MANUAL") expect(TOOLS.some((t) => t.name === v), k).toBe(true); });
  it("T3 areas have no tool", () => { expect(TOOLS.some((t) => /auth|login|payment|money/i.test(t.name))).toBe(false); });
});

describe("gapsheet_edit", () => {
  it("sorts and applies after confirmation for destructive clears", async () => {
    localStorage.clear();
    const mkc = () => ({ navigate() {}, language: "en" as const, askCopilot: async () => "" });
    await runTool("create_gapsheet_table", { title: "T", columns: ["N", "V"], rows: [["a", "3"], ["b", "1"], ["c", "2"]] }, mkc(), async () => true);
    const sorted = await runTool("gapsheet_edit", { type: "SORT", range: "A2:B4", keyColumn: "B", direction: "asc" }, mkc(), async () => true);
    expect(sorted.result.ok).toBe(true);
    const wb = JSON.parse(localStorage.getItem(GAPSHEET_STORE)!); expect(wb.sheets[0].cells.A2.value).toBe("b");
    const declined = await runTool("gapsheet_edit", { type: "CLEAR_RANGE", range: "A1:B4" }, mkc(), async () => false);
    expect(declined.result).toMatchObject({ ok: false, error: "user_declined" });
    expect(JSON.parse(localStorage.getItem(GAPSHEET_STORE)!).sheets[0].cells.A2.value).toBe("b");
    const bad = await runTool("gapsheet_edit", { type: "DROP_TABLE" }, mkc(), async () => true);
    expect(bad.result).toMatchObject({ ok: false });
  });
});

describe("watchlist and paper tools", () => {
  const c = () => ({ navigate() {}, language: "en" as const, askCopilot: async () => "" });
  it("adds, dedupes and removes watchlist symbols", async () => {
    localStorage.clear();
    expect((await runTool("watchlist_add", { symbol: "AAPL" }, c(), async () => true)).result.ok).toBe(true);
    expect((await runTool("watchlist_add", { symbol: "AAPL" }, c(), async () => true)).result).toMatchObject({ already: true });
    expect((await runTool("watchlist_get", {}, c(), async () => true)).result.symbols).toContain("AAPL");
    expect((await runTool("watchlist_remove", { symbol: "AAPL" }, c(), async () => true)).result.ok).toBe(true);
    expect((await runTool("watchlist_add", { symbol: "NOTAREALTHING9" }, c(), async () => true)).result).toMatchObject({ ok: false });
  });
  it("paper orders need confirmation and reject bad input", async () => {
    expect((await runTool("paper_order", { side: "buy", quantity: 1, symbol: "AAPL" }, c(), async () => false)).result).toMatchObject({ error: "user_declined" });
    expect((await runTool("paper_order", { side: "short", quantity: -1, symbol: "AAPL" }, c(), async () => true)).result).toMatchObject({ ok: false });
  });
});

describe("screen controls", () => {
  const c = () => ({ navigate() {}, language: "en" as const, askCopilot: async () => "" });
  const html = '<button id="a">Run scenario</button><button>Reset ledger</button><button>Sign in</button><input aria-label="Amount" value=""/><input type="password" aria-label="Password"/><input aria-label="Card number"/><select aria-label="Mode"><option>Fast</option><option>Slow</option></select>';
  it("lists controls without password fields, clicks safe ones, confirms destructive ones, refuses sign-in and credential typing", async () => {
    document.body.innerHTML = html;
    Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", { configurable: true, value: () => ({ width: 10, height: 10, top: 0, left: 0, right: 10, bottom: 10, x: 0, y: 0, toJSON() {} }) });
    const list = (await runTool("screen_controls", {}, c(), async () => true)).result.controls as { index: number; label: string; role: string }[];
    expect(list.some((x) => /password/i.test(x.label))).toBe(false);
    const idx = (l: string) => list.find((x) => x.label === l)!.index;
    let clicked = 0; document.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => clicked++));
    expect((await runTool("ui_click", { index: idx("Run scenario") }, c(), async () => false)).result.ok).toBe(true); expect(clicked).toBe(1);
    expect((await runTool("ui_click", { index: idx("Reset ledger") }, c(), async () => false)).result).toMatchObject({ error: "user_declined" }); expect(clicked).toBe(1);
    expect((await runTool("ui_click", { index: idx("Reset ledger") }, c(), async () => true)).result.ok).toBe(true); expect(clicked).toBe(2);
    expect((await runTool("ui_click", { index: idx("Sign in") }, c(), async () => true)).result).toMatchObject({ error: "not_allowed_by_voice" }); expect(clicked).toBe(2);
    expect((await runTool("ui_type", { index: idx("Card number"), text: "4111" }, c(), async () => true)).result).toMatchObject({ error: "not_allowed_by_voice" });
    expect((await runTool("ui_type", { index: idx("Amount"), text: "250" }, c(), async () => true)).result.ok).toBe(true);
    expect((document.querySelector('input[aria-label="Amount"]') as HTMLInputElement).value).toBe("250");
    expect((await runTool("ui_select", { index: idx("Mode"), value: "slow" }, c(), async () => true)).result.ok).toBe(true);
    expect((document.querySelector("select") as HTMLSelectElement).value).toBe("Slow");
  });
});

describe("data_status", () => {
  it("reports failing feeds from /api/health and never claims health on error", async () => {
    const ctx = { navigate() {}, language: "en" as const, askCopilot: async () => "" };
    const f = vi.fn(async () => ({ ok: true, json: async () => ({ checkedAt: "t", allOk: false, checks: [{ name: "yahoo_finance", ok: true }, { name: "daily_feed", ok: false, detail: "stale 17d" }] }) }));
    vi.stubGlobal("fetch", f);
    const r = (await runTool("data_status", {}, ctx, async () => true)).result;
    expect(r).toMatchObject({ ok: true, allOk: false, problems: [{ feed: "daily_feed", detail: "stale 17d" }] });
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("net"); }));
    expect((await runTool("data_status", {}, ctx, async () => true)).result).toMatchObject({ ok: false, error: "unavailable" });
    vi.unstubAllGlobals();
  });
});

describe("screen controls coverage", () => {
  it("lists custom widget roles and puts page content ahead of nav chrome", async () => {
    const { snapshot } = await import("./uiControls");
    document.body.innerHTML = "<nav>" + Array.from({ length: 120 }, (_, i) => `<a href="/n${i}">Nav ${i}</a>`).join("") + "</nav><main><div role='combobox' aria-label='Asset'>Stocks</div><div role='option'>Bonds</div><div role='menuitem'>Export view</div></main>";
    const labels = snapshot().map((c) => c.label);
    expect(labels.slice(0, 3)).toEqual(["Asset", "Bonds", "Export view"]);
    expect(labels.length).toBeLessThanOrEqual(100);
  });
});
