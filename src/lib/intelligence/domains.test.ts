import { describe, it, expect } from "vitest";
import { DOMAINS, domainOf, runInDomain } from "./domains";
import { TOOL_SPECS } from "./tools";

describe("domains", () => {
  it("every runnable tool belongs to exactly one domain", () => {
    for (const id of Object.keys(TOOL_SPECS)) {
      expect(Object.values(DOMAINS).filter((d) => (d.tools as string[]).includes(id))).toHaveLength(1);
      expect(domainOf(id)).not.toBeNull();
    }
  });
  it("boundary domains run nothing", async () => {
    for (const d of Object.values(DOMAINS).filter((x) => x.status === "boundary")) expect(d.tools).toEqual([]);
    expect(await runInDomain("risk", "calc", "1+1")).toEqual({ ok: false, reason: "unknown_tool" });
  });
  it("runs a tool inside its own domain only", async () => {
    const r = await runInDomain("financial", "math", "2+3*4");
    expect(r.ok).toBe(true);
    expect(await runInDomain("market", "math", "2+3")).toEqual({ ok: false, reason: "unknown_tool" });
  });
});
