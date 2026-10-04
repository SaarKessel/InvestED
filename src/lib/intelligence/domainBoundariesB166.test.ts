import { describe, expect, it } from "vitest";
import { DOMAINS, domainOf, runInDomain, type DomainId } from "./domains";
const domains = Object.keys(DOMAINS) as DomainId[];
const tools = Object.values(DOMAINS).flatMap((domain) => domain.tools);
const rows = domains.flatMap((domain) => tools.filter((tool) => !DOMAINS[domain].tools.includes(tool)).map((tool) => [domain, tool] as const));
describe("[sweep] B166 tools cannot execute through a different domain boundary", () => {
  it.each(rows)("domain %s foreign tool %s", async (domain, tool) => {
    expect(await runInDomain(domain, tool, { arbitrary: true })).toEqual({ ok: false, reason: "unknown_tool" });
  });
});
describe("[sweep] B166 every wired tool belongs to exactly its declared domain", () => {
  it.each(tools)("tool %s", (tool) => {
    const owners = Object.values(DOMAINS).filter((domain) => domain.tools.includes(tool));
    expect(owners).toHaveLength(1);
    expect(domainOf(tool)).toBe(owners[0].id);
    expect(owners[0].status).toBe("wired");
  });
});
describe("[hand] B166 unwired capabilities stay honest boundaries", () => {
  it("boundary domains have no fake tools and unknown identities are refused", async () => {
    for (const domain of Object.values(DOMAINS)) {
      expect(domain.title.en.length).toBeGreaterThan(0);
      expect(domain.title.he).toMatch(/[א-ת]/);
      expect(domain.servedBy.length).toBeGreaterThan(0);
      if (domain.status === "boundary") expect(domain.tools).toEqual([]);
      expect(await runInDomain(domain.id, "made-up-tool", {})).toEqual({ ok: false, reason: "unknown_tool" });
    }
    expect(domainOf("made-up-tool")).toBeNull();
  });
});
