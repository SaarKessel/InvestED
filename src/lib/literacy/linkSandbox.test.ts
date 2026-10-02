import { describe, expect, it } from "vitest";
import { CHECKLIST, EXERCISES, NO_NOTICES, readLink, registrableOf } from "./linkSandbox";

const ids = (l: string) => readLink(l).notices.map((n) => n.id);

describe("link sandbox", () => {
  it("finds the real host behind deceptive subdomains", () => {
    const r = readLink("https://login.mybroker.com.secure-check.example/session");
    expect(r.host).toBe("login.mybroker.com.secure-check.example");
    expect(r.registrable).toBe("secure-check.example");
    expect(ids(r.input)).toEqual(expect.arrayContaining(["deep-subdomains", "domain-in-subdomain", "keyword-subdomain"]));
  });
  it("reads the host after an @ and flags it", () => {
    const r = readLink("https://mybroker.example@accounts-portal.example/verify");
    expect(r.host).toBe("accounts-portal.example");
    expect(r.userinfo).toBe("mybroker.example");
    expect(ids(r.input)).toContain("userinfo");
  });
  it("flags IP hosts, including disguised forms, and unusual ports", () => {
    expect(ids("http://192.0.2.45:8080/x")).toEqual(expect.arrayContaining(["ip-host", "port"]));
    const r = readLink("http://0x7f.1/");
    expect(r.host).toBe("127.0.0.1");
    expect(ids(r.input)).toContain("ip-obfuscated");
  });
  it("flags lookalike digits and non-English letters inside an English-looking name", () => {
    expect(ids("https://www.mybr0ker.example/")).toContain("lookalike-chars");
    const r = readLink("https://mybr\u043eker.example/login");
    expect(r.host.startsWith("xn--")).toBe(true);
    expect(r.oddChars[0]).toMatchObject({ codepoint: "U+043E", script: "Cyrillic" });
    expect(ids(r.input)).toEqual(expect.arrayContaining(["punycode", "non-ascii", "mixed-script"]));
  });
  it("flags shorteners, missing https, and a domain hidden in the path", () => {
    expect(ids("https://bit.ly/abc")).toContain("shortener");
    expect(ids("http://example.com/")).toContain("no-https");
    expect(ids("https://example.com/www.mybroker.com/login")).toContain("domain-in-path");
  });
  it("handles multi-part suffixes and plain names", () => {
    expect(registrableOf("www.bank.co.il")).toEqual({ registrable: "bank.co.il", subdomain: "www" });
    expect(readLink("https://example.com/").notices).toEqual([]);
  });
  it("rejects non-web or unreadable input and never throws", () => {
    for (const bad of ["", "   ", "javascript:alert(1)", "ftp://x.example", "not a link", "http://"]) expect(readLink(bad).readable).toBe(false);
    expect(() => readLink("http://[::1]:99999999/")).not.toThrow();
    expect(readLink("x".repeat(1000) + ".example").input.length).toBe(300);
  });
  it("never rates a link: no score, no safe label", () => {
    for (const e of EXERCISES) {
      const r = readLink(e.link);
      expect(Object.keys(r)).not.toEqual(expect.arrayContaining(["score"]));
      expect(JSON.stringify(r)).not.toMatch(/"(score|safe|isSafe|risk|probability)"/i);
    }
    expect(NO_NOTICES.en).toMatch(/does not make it safe/);
  });
  it("uses only reserved example names in the synthetic exercises", () => {
    for (const e of EXERCISES) { const h = readLink(e.link).host; expect(h.endsWith(".example") || h === "192.0.2.45").toBe(true); }
  });
  it("has the checklist in both languages", () => {
    expect(CHECKLIST.length).toBeGreaterThanOrEqual(5);
    for (const c of CHECKLIST) { expect(c.text.en.length).toBeGreaterThan(10); expect(c.text.he).toMatch(/[\u0590-\u05FF]/); }
  });
  it("makes no network call", () => {
    const orig = globalThis.fetch; let called = false;
    globalThis.fetch = (() => { called = true; return Promise.reject(new Error("no")); }) as typeof fetch;
    try { for (const e of EXERCISES) readLink(e.link); } finally { globalThis.fetch = orig; }
    expect(called).toBe(false);
  });
});
