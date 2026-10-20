// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { snapshot, gateClick, gateType, getEl, typeInto, chooseOption } from "./uiControls";

beforeEach(() => {
  document.body.innerHTML = "";
  // jsdom returns zero rects; the visibility check needs a size.
  Element.prototype.getBoundingClientRect = function () {
    return { width: 100, height: 30, top: 10, bottom: 40, left: 0, right: 100, x: 0, y: 10, toJSON: () => ({}) } as DOMRect;
  };
});

describe("snapshot", () => {
  it("indexes buttons, links, inputs and selects with labels", () => {
    document.body.innerHTML = `<button>Save</button><a href="/news">News</a><input aria-label="Amount" value="42"><select aria-label="Pick"><option>One</option><option>Two</option></select>`;
    const c = snapshot();
    expect(c.map((x) => x.role)).toEqual(expect.arrayContaining(["button", "link", "textbox", "select"]));
    expect(c.find((x) => x.label === "Amount")?.value).toBe("42");
    expect(c.find((x) => x.role === "select")?.options).toEqual(["One", "Two"]);
  });
  it("skips password, file and hidden inputs, disabled and aria-hidden controls", () => {
    document.body.innerHTML = `<input type="password" aria-label="pw"><input type="file" aria-label="f"><input type="hidden"><button disabled>Off</button><button aria-hidden="true">Ghost</button><button>Real</button>`;
    const c = snapshot();
    expect(c.map((x) => x.label)).toEqual(["Real"]);
  });
  it("never indexes DOT's own UI", () => {
    document.body.innerHTML = `<div data-dot-ui><button>DotBtn</button></div><button>Page</button>`;
    expect(snapshot().map((x) => x.label)).toEqual(["Page"]);
  });
  it("does not capture values of sensitive-labelled fields (card, cvv, סיסמה)", () => {
    document.body.innerHTML = `<input aria-label="Card number" value="4111"><input aria-label="סיסמה" value="s3cret"><input aria-label="City" value="Haifa">`;
    const c = snapshot();
    expect(c.find((x) => x.label === "Card number")?.value).toBeUndefined();
    expect(c.find((x) => x.label === "סיסמה")?.value).toBeUndefined();
    expect(c.find((x) => x.label === "City")?.value).toBe("Haifa");
  });
  it("caps the snapshot at 100 controls", () => {
    document.body.innerHTML = Array.from({ length: 130 }, (_, i) => `<button>B${i}</button>`).join("");
    expect(snapshot().length).toBe(100);
  });
  it("checkbox state and aria-expanded map to checked", () => {
    document.body.innerHTML = `<input type="checkbox" aria-label="Agree" checked><button aria-expanded="true">Open</button>`;
    const c = snapshot();
    expect(c.find((x) => x.label === "Agree")?.checked).toBe(true);
    expect(c.find((x) => x.label === "Open")?.checked).toBe(true);
  });
});

describe("gateClick", () => {
  it("blocks sign-in, sign-out, sign-up and payment buttons, in both languages", () => {
    for (const l of ["Sign in", "Log out", "Sign up", "Pay now", "התחברות", "התנתקות", "תשלום", "מחיקת חשבון"]) {
      expect(gateClick(l).ok, l).toBe(false);
    }
  });
  it("blocks external http links, allows same-origin and relative", () => {
    expect(gateClick("Docs", "https://evil.example/x").ok).toBe(false);
    expect(gateClick("News", `${location.origin}/news`).ok).toBe(true);
    expect(gateClick("News", "/news").ok).toBe(true);
  });
  it("marks destructive and sending buttons as needing confirmation", () => {
    for (const l of ["Delete row", "Send message", "Export CSV", "מחק", "שלח", "ייצוא"]) {
      const g = gateClick(l);
      expect(g.ok, l).toBe(true);
      if (g.ok) expect(g.confirm, l).toBe(true);
    }
    const plain = gateClick("Open settings");
    expect(plain.ok && plain.confirm).toBe(false);
  });
});

describe("gateType", () => {
  const el = (html: string) => { document.body.innerHTML = html; return document.body.firstElementChild!; };
  it("blocks password and file inputs outright", () => {
    expect(gateType(el(`<input type="password">`)).ok).toBe(false);
    expect(gateType(el(`<input type="file">`)).ok).toBe(false);
  });
  it("blocks sensitive fields by label, name, autocomplete or id, in both languages", () => {
    for (const h of [`<input aria-label="CVV">`, `<input name="card_number">`, `<input autocomplete="cc-csc">`, `<input aria-label="כרטיס אשראי">`, `<input id="otp-code">`]) {
      expect(gateType(el(h)).ok, h).toBe(false);
    }
  });
  it("allows ordinary text fields", () => {
    expect(gateType(el(`<input aria-label="Ask InvestED">`)).ok).toBe(true);
    expect(gateType(el(`<textarea aria-label="הערות"></textarea>`)).ok).toBe(true);
  });
});

describe("registry and actions", () => {
  it("getEl returns the indexed element and null for stale or unknown indexes", () => {
    document.body.innerHTML = `<button>One</button>`;
    snapshot();
    expect(getEl(1)?.textContent).toBe("One");
    expect(getEl(999)).toBeNull();
    document.body.innerHTML = "";
    expect(getEl(1)).toBeNull();
  });
  it("typeInto sets the value through the native setter and fires input+change", () => {
    document.body.innerHTML = `<input aria-label="q">`;
    const el = document.querySelector("input")!;
    let input = 0, change = 0;
    el.addEventListener("input", () => input++); el.addEventListener("change", () => change++);
    typeInto(el, "מה זה ETF?");
    expect(el.value).toBe("מה זה ETF?");
    expect(input).toBe(1); expect(change).toBe(1);
  });
  it("typeInto works for textarea", () => {
    document.body.innerHTML = `<textarea aria-label="t"></textarea>`;
    const el = document.querySelector("textarea")!;
    typeInto(el, "hello");
    expect(el.value).toBe("hello");
  });
  it("chooseOption matches exactly, then partially, and fails cleanly", () => {
    document.body.innerHTML = `<select aria-label="s"><option value="a">Beginner</option><option value="b">Advanced</option></select>`;
    const el = document.querySelector("select") as HTMLSelectElement;
    expect(chooseOption(el, "Advanced")).toBe(true); expect(el.value).toBe("b");
    expect(chooseOption(el, "begin")).toBe(true); expect(el.value).toBe("a");
    expect(chooseOption(el, "nonexistent")).toBe(false);
  });
});
