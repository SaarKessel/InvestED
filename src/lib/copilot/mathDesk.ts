/**
 * Plain arithmetic from one sentence. A small recursive-descent parser, no eval,
 * no model. Handles + - * / ^ ( ), "X% of Y", k/m/b suffixes, sqrt/abs/round/min/max
 * and common English and Hebrew operator words. Steps are shown so every result can be re-checked.
 */
export interface MathStep { expr: string; value: number }
export interface MathDeskResult { ok: boolean; expression: string; value?: number; steps: MathStep[]; error?: "divide_by_zero" | "unparseable" | "too_large" }

const WORDS: [RegExp, string][] = [
  [/(?:^|\s)(?:what is|what's|calculate|compute|how much is|solve|eval(?:uate)?)\s*:?/gi, " "],
  [/(?:^|\s)(?:כמה זה|כמה יוצא|כמה הם|חשב(?:י)?|תחשב(?:י)?|חישוב)\s*:?/g, " "],
  [/\bto the power of\b/gi, "^"], [/\bdivided by\b/gi, "/"], [/\bmultiplied by\b/gi, "*"],
  [/\bplus\b/gi, "+"], [/\bminus\b/gi, "-"], [/\btimes\b/gi, "*"], [/\bover\b/gi, "/"],
  [/(?<![א-ת])ועוד(?![א-ת])/g, "+"], [/(?<![א-ת])פחות(?![א-ת])/g, "-"], [/(?<![א-ת])כפול(?![א-ת])/g, "*"], [/(?<![א-ת])חלקי(?![א-ת])/g, "/"],
  [/(?<![א-ת])בחזקת(?![א-ת])/g, "^"], [/(?<![א-ת])מתוך(?![א-ת])/g, " of "],
  [/(?<=[\d)]\s*)[×x✕](?=\s*[\d(.])/gi, "*"], [/×|✕/g, "*"], [/÷/g, "/"], [/\*\*/g, "^"], [/[−–]/g, "-"], [/[=?؟]/g, " "], [/[$€£₪]/g, ""],
];

function normalize(raw: string): string {
  let s = ` ${raw} `;
  for (const [re, to] of WORDS) s = s.replace(re, to);
  s = s.replace(/(\d),(?=\d{3}(?!\d))/g, "$1");
  s = s.replace(/(\d+(?:\.\d+)?)\s*%\s*(?:of|מ)\s*/gi, "($1/100)*");
  s = s.replace(/(\d+(?:\.\d+)?)\s*%/g, "($1/100)");
  s = s.replace(/(\d+(?:\.\d+)?)\s*([kmb])\b/gi, (_m, n: string, u: string) => `(${n}*${{ k: 1e3, m: 1e6, b: 1e9 }[u.toLowerCase() as "k"]})`);
  return s.replace(/\s+/g, " ").trim();
}

const FN: Record<string, (...a: number[]) => number> = { sqrt: Math.sqrt, abs: Math.abs, round: Math.round, min: Math.min, max: Math.max, pow: Math.pow,
  /** cagr(start, end, years) in percent */
  cagr: (a, b, y) => { if (!(a > 0) || !(y > 0)) throw new Error("unparseable"); return (Math.pow(b / a, 1 / y) - 1) * 100; },
  /** pmt(loan, annualPct, years): fixed monthly payment, monthly compounding */
  pmt: (loan, pct, y) => { const n = Math.round(y * 12); if (!(n > 0)) throw new Error("unparseable"); const r = pct / 1200; return r === 0 ? loan / n : (loan * r) / (1 - Math.pow(1 + r, -n)); },
  /** fv(annualPct, years, monthly, start): monthly compounding, deposits at month end */
  fv: (pct, y, m, st = 0) => { const n = Math.round(y * 12), r = pct / 1200; return r === 0 ? st + m * n : st * Math.pow(1 + r, n) + (m * (Math.pow(1 + r, n) - 1)) / r; },
  /** real(nominalPct, inflationPct): real return in percent */
  real: (nom, inf) => ((1 + nom / 100) / (1 + inf / 100) - 1) * 100,
};

class Parser {
  i = 0; steps: MathStep[] = [];
  constructor(private s: string) {}
  private ws() { while (this.s[this.i] === " ") this.i++; }
  private peek() { this.ws(); return this.s[this.i]; }
  done() { this.ws(); return this.i >= this.s.length; }
  expr(): number {
    let v = this.term();
    for (;;) { const c = this.peek(); if (c !== "+" && c !== "-") return v; this.i++; const r = this.term(); const before = `${fmt(v)} ${c} ${fmt(r)}`; v = c === "+" ? v + r : v - r; this.steps.push({ expr: before, value: v }); }
  }
  term(): number {
    let v = this.pow();
    for (;;) {
      const c = this.peek(); if (c !== "*" && c !== "/") return v; this.i++;
      const r = this.pow(); if (c === "/" && r === 0) throw new Error("divide_by_zero");
      const before = `${fmt(v)} ${c} ${fmt(r)}`; v = c === "*" ? v * r : v / r; this.steps.push({ expr: before, value: v });
    }
  }
  pow(): number {
    const base = this.unary();
    if (this.peek() === "^") { this.i++; const e = this.pow(); const v = Math.pow(base, e); this.steps.push({ expr: `${fmt(base)} ^ ${fmt(e)}`, value: v }); return v; }
    return base;
  }
  unary(): number { const c = this.peek(); if (c === "-") { this.i++; return -this.unary(); } if (c === "+") { this.i++; return this.unary(); } return this.atom(); }
  atom(): number {
    const c = this.peek();
    if (c === "(") { this.i++; const v = this.expr(); if (this.peek() !== ")") throw new Error("unparseable"); this.i++; return v; }
    const num = /^\d+(?:\.\d+)?|^\.\d+/.exec(this.s.slice(this.i));
    if (num) { this.i += num[0].length; return Number(num[0]); }
    const fn = /^[a-z]+/i.exec(this.s.slice(this.i));
    if (fn && FN[fn[0].toLowerCase()]) {
      this.i += fn[0].length; if (this.peek() !== "(") throw new Error("unparseable"); this.i++;
      const args = [this.expr()]; while (this.peek() === ",") { this.i++; args.push(this.expr()); }
      if (this.peek() !== ")") throw new Error("unparseable"); this.i++;
      const v = FN[fn[0].toLowerCase()](...args); this.steps.push({ expr: `${fn[0].toLowerCase()}(${args.map(fmt).join(", ")})`, value: v }); return v;
    }
    throw new Error("unparseable");
  }
}

export function fmt(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  const r = Math.abs(n) >= 1e15 ? n.toExponential(6) : String(Number(n.toFixed(8)));
  if (/e/.test(r)) return r;
  const [i, d] = r.split(".");
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (d ? `.${d}` : "");
}

/** Only fires when the whole sentence is arithmetic: at least two numbers (or a function) and an operator. */
export function runMathDesk(text: string): MathDeskResult | null {
  const s = normalize(text);
  if (!s || /[א-תa-wyz]{2,}/i.test(s.replace(/\b(?:sqrt|abs|round|min|max|pow|cagr|pmt|fv|real|of)\b/gi, ""))) return null;
  const numbers = s.match(/\d+(?:\.\d+)?/g) ?? [];
  const hasFn = /\b(?:sqrt|abs|round|min|max|pow|cagr|pmt|fv|real)\s*\(/i.test(s);
  if (!/[+\-*/^]/.test(s.replace(/^-/, "")) && !hasFn) return null;
  if (numbers.length < 2 && !hasFn) return null;
  if (!/^[\d\s+\-*/^().,%a-z]+$/i.test(s)) return null;
  const p = new Parser(s.replace(/\bof\b/gi, "*"));
  try {
    const v = p.expr();
    if (!p.done()) throw new Error("unparseable");
    if (!Number.isFinite(v)) throw new Error("too_large");
    return { ok: true, expression: s, value: v, steps: p.steps.slice(0, 12) };
  } catch (e) {
    const m = (e as Error).message;
    return { ok: false, expression: s, steps: [], error: m === "divide_by_zero" || m === "too_large" ? m : "unparseable" };
  }
}
