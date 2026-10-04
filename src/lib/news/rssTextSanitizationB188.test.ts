import { describe, expect, it } from "vitest";
import { sanitizeText } from "./rssFeeds";
const wrappers = ["<b>VALUE</b>", "<![CDATA[VALUE]]>", "&lt;b&gt;VALUE&lt;/b&gt;", "\u202eVALUE\u2069", "\u0000VALUE\u007f", "  VALUE \n "];
const rows = wrappers.flatMap((wrapper) => ["Headline", "שלום", "A &amp; B"].map((text) => [wrapper, text] as const));
describe("[sweep] B188 feed title cleanup strips markup controls and directional overrides", () => {
  it.each(rows)("wrapper %s text %s", (wrapper, text) => {
    const clean = sanitizeText(wrapper.replace("VALUE", text));
    expect(clean).toBe(text.replace("&amp;", "&"));
    // eslint-disable-next-line no-control-regex -- asserts external control removal
    expect(clean).not.toMatch(/[<>\u0000\u007f\u202e\u2069]/);
  });
});
describe("[hand] B188 feed title truncation is bounded and does not execute content", () => {
  it("caps long plain titles and decodes supported entities once", () => {
    expect(sanitizeText("x".repeat(250))).toBe(`${"x".repeat(219)}…`);
    expect(sanitizeText("&quot;Title&quot; &apos;name&apos; &#65; &#x42;")).toBe('"Title" \'name\' A B');
    expect(sanitizeText("&amp;lt;script&amp;gt;")).toBe("&lt;script&gt;");
    expect(sanitizeText("<script>alert(1)</script>")).toBe("alert(1)");
  });
});
