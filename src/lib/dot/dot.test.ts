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
    expect(TOOLS.map((t) => t.name).join(" ")).not.toMatch(/password|card|payment|login|trade|order/i);
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
