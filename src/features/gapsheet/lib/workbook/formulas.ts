import type { CellValue } from "@/features/gapsheet/types/workbook";
import { expandRange, parseAddress, parseRange, toAddress } from "./ranges";

/** Functions advertised as supported (BUILD_SPEC 25). Only tested ones are listed. */
export const SUPPORTED_FUNCTIONS = ["SUM", "AVERAGE", "MIN", "MAX", "COUNT", "COUNTA", "IF", "SUMIF", "COUNTIF", "XLOOKUP", "VLOOKUP", "INDEX", "MATCH", "SUMIFS", "COUNTIFS", "AVERAGEIF", "IFERROR", "AND", "OR", "NOT", "ROUND", "ABS", "SQRT", "POWER", "MOD", "ROUNDUP", "ROUNDDOWN", "SUMPRODUCT", "TEXTJOIN", "TEXT", "LEFT", "RIGHT", "MID", "LEN", "TRIM", "UPPER", "LOWER", "CONCAT", "CONCATENATE", "DATE", "TODAY", "NOW", "YEAR", "MONTH", "DAY", "EDATE", "EOMONTH", "DATEDIF"] as const;
export type SupportedFunction = (typeof SUPPORTED_FUNCTIONS)[number];

export interface FormulaNode {
  type: "function" | "range" | "reference" | "literal" | "operator";
  name?: string;
  value?: string | number;
  children?: FormulaNode[];
}

type Tok = { k: "num" | "str" | "id" | "op" | "cmp" | "lp" | "rp" | "comma"; v: string };
export class FormulaError extends Error {}

/** A reference may be qualified with a sheet name: "Data!A1" or "Data!A1:B5". Sheet names keep their case. */
export function splitRef(v: string): { sheet: string; ref: string } { const i = v.lastIndexOf("!"); return i < 0 ? { sheet: "", ref: v } : { sheet: v.slice(0, i), ref: v.slice(i + 1) }; }
export function expandRef(v: string): string[] {
  const { sheet, ref } = splitRef(v); const list = ref.includes(":") ? expandRange(parseRange(ref)!) : [ref];
  return sheet ? list.map((a) => `${sheet}!${a}`) : list;
}

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '"') { let j = i + 1; while (j < src.length && src[j] !== '"') j++; if (j >= src.length) throw new FormulaError("Unterminated string"); toks.push({ k: "str", v: src.slice(i + 1, j) }); i = j + 1; continue; }
    if (/[0-9.]/.test(c)) { const m = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(src.slice(i)); let j = i; if (m) j = i + m[0].length; else while (j < src.length && /[0-9.]/.test(src[j])) j++; toks.push({ k: "num", v: src.slice(i, j) }); i = j; continue; }
    if (c === "'") { const j = src.indexOf("'", i + 1); if (j < 0 || src[j + 1] !== "!") throw new FormulaError("Bad sheet name"); let k = j + 2; while (k < src.length && /[A-Za-z0-9$:]/.test(src[k])) k++; toks.push({ k: "id", v: `${src.slice(i + 1, j)}!${src.slice(j + 2, k).replace(/\$/g, "")}` }); i = k; continue; }
    if (/[\p{L}$]/u.test(c)) { let j = i; while (j < src.length && /[\p{L}0-9$:!_]/u.test(src[j])) j++; toks.push({ k: "id", v: src.slice(i, j).replace(/\$/g, "") }); i = j; continue; }
    if (c === "<" || c === ">" || c === "=") {
      const two = src.slice(i, i + 2);
      if (two === "<=" || two === ">=" || two === "<>") { toks.push({ k: "cmp", v: two }); i += 2; continue; }
      toks.push({ k: "cmp", v: c }); i++; continue;
    }
    if ("+-*/^&%".includes(c)) { toks.push({ k: "op", v: c }); i++; continue; }
    if (c === "(") { toks.push({ k: "lp", v: c }); i++; continue; }
    if (c === ")") { toks.push({ k: "rp", v: c }); i++; continue; }
    if (c === "," || c === ";") { toks.push({ k: "comma", v: "," }); i++; continue; }
    throw new FormulaError(`Unexpected character "${c}"`);
  }
  return toks;
}

/** Recursive-descent parser. No eval, no Function constructor. */
export function parseFormula(formula: string): FormulaNode {
  if (!formula.startsWith("=")) throw new FormulaError("Formula must start with =");
  const toks = tokenize(formula.slice(1));
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];

  // Excel precedence, lowest to highest: comparison, &, + -, * /, ^, %, unary minus. Equal precedence is evaluated left to right (so 2^3^2 = 64, and -2^2 = 4).
  const bin = (name: string, left: FormulaNode, right: FormulaNode): FormulaNode => ({ type: "operator", name, children: [left, right] });
  function comparison(): FormulaNode {
    let left = concat();
    while (peek() && peek().k === "cmp") { const op = next().v; left = bin(op, left, concat()); }
    return left;
  }
  function concat(): FormulaNode {
    let left = expr();
    while (peek() && peek().k === "op" && peek().v === "&") { next(); left = bin("&", left, expr()); }
    return left;
  }
  function expr(): FormulaNode {
    let left = term();
    while (peek() && peek().k === "op" && "+-".includes(peek().v)) { const op = next().v; left = bin(op, left, term()); }
    return left;
  }
  function term(): FormulaNode {
    let left = power();
    while (peek() && peek().k === "op" && "*/".includes(peek().v)) { const op = next().v; left = bin(op, left, power()); }
    return left;
  }
  function power(): FormulaNode {
    let left = unary();
    while (peek() && peek().k === "op" && peek().v === "^") { next(); left = bin("^", left, unary()); }
    return left;
  }
  function unary(): FormulaNode {
    const t = peek();
    if (t && t.k === "op" && t.v === "-") { next(); return { type: "operator", name: "neg", children: [unary()] }; }
    if (t && t.k === "op" && t.v === "+") { next(); return unary(); }
    let n = factor();
    while (peek() && peek().k === "op" && peek().v === "%") { next(); n = { type: "operator", name: "pct", children: [n] }; }
    return n;
  }
  function factor(): FormulaNode {
    const t = next();
    if (!t) throw new FormulaError("Unexpected end of formula");
    if (t.k === "num") { const n = Number(t.v); if (Number.isNaN(n)) throw new FormulaError("Bad number"); return { type: "literal", value: n }; }
    if (t.k === "str") return { type: "literal", value: t.v };
    if (t.k === "lp") { const e = comparison(); if (next()?.k !== "rp") throw new FormulaError("Missing )"); return e; }
    if (t.k === "id") {
      if (peek()?.k === "lp") {
        next();
        const args: FormulaNode[] = [];
        if (peek()?.k !== "rp") {
          args.push(comparison());
          while (peek()?.k === "comma") { next(); args.push(comparison()); }
        }
        if (next()?.k !== "rp") throw new FormulaError("Missing )");
        return { type: "function", name: t.v.toUpperCase(), children: args };
      }
      if (t.v.includes("!")) {
        const { sheet, ref } = splitRef(t.v); const R = ref.toUpperCase();
        if (!sheet) throw new FormulaError(`Unknown name ${t.v}`);
        if (R.includes(":")) { if (!parseRange(R)) throw new FormulaError(`Bad range ${t.v}`); return { type: "range", value: `${sheet}!${R}` }; }
        if (!parseAddress(R)) throw new FormulaError(`Unknown name ${t.v}`);
        return { type: "reference", value: `${sheet}!${R}` };
      }
      const up = t.v.toUpperCase();
      if (up === "TRUE" || up === "FALSE") return { type: "literal", value: up };
      if (up.includes(":")) { if (!parseRange(up)) throw new FormulaError(`Bad range ${t.v}`); return { type: "range", value: up }; }
      if (!parseAddress(up)) throw new FormulaError(`Unknown name ${t.v}`);
      return { type: "reference", value: up };
    }
    throw new FormulaError(`Unexpected token ${t.v}`);
  }
  const node = comparison();
  if (p < toks.length) throw new FormulaError("Unexpected trailing input");
  return node;
}

/** TODAY/NOW read this clock. Tests inject a fixed one so no result depends on the machine's date. */
let clock: () => Date = () => new Date();
export function setClock(fn: (() => Date) | null) { clock = fn ?? (() => new Date()); }
/** Functions that look at cells without being poisoned by an error inside the range (Excel: COUNT ignores errors, COUNTA counts them). */
const SOFT = new Set(["COUNT", "COUNTA", "COUNTIF", "COUNTIFS", "MATCH"]);

export type CellLookup = (address: string) => CellValue;

function toNum(v: CellValue): number {
  if (typeof v === "number") return v;
  if (v === null || v === "") return 0;
  if (typeof v === "boolean") return v ? 1 : 0;
  const n = Number(v);
  if (Number.isNaN(n)) throw new FormulaError("#VALUE!");
  return n;
}

/** Number to text the way Excel shows it in a concatenation: 15 significant digits, so 0.1+0.2 gives "0.3". */
function numText(v: CellValue): string { return typeof v === "number" ? String(Number(v.toPrecision(15))) : v === null ? "" : typeof v === "boolean" ? (v ? "TRUE" : "FALSE") : String(v); }

/** Excel ordering (DAT-03): numbers < text < logical. Text compares case-insensitively. A blank cell acts as 0, "" or FALSE depending on what it meets.
 *  Numbers compare at 15 significant digits. Documented in docs/audit/ENGINE_DEVIATIONS.md. */
function compare(op: string, a: CellValue, b: CellValue): boolean {
  const kind = (v: CellValue) => (typeof v === "number" ? 1 : typeof v === "string" ? 2 : typeof v === "boolean" ? 3 : 0);
  let ka = kind(a), kb = kind(b);
  if (ka === 0 && kb === 0) { a = 0; b = 0; ka = kb = 1; }
  else if (ka === 0) { a = kb === 1 ? 0 : kb === 2 ? "" : false; ka = kb; }
  else if (kb === 0) { b = ka === 1 ? 0 : ka === 2 ? "" : false; kb = ka; }
  let c: number;
  if (ka !== kb) c = ka < kb ? -1 : 1;
  else if (ka === 1) { const x = Number((a as number).toPrecision(15)), y = Number((b as number).toPrecision(15)); c = x < y ? -1 : x > y ? 1 : 0; }
  else if (ka === 2) { const x = (a as string).toLowerCase(), y = (b as string).toLowerCase(); c = x < y ? -1 : x > y ? 1 : 0; }
  else c = Number(a) - Number(b);
  switch (op) { case "=": return c === 0; case "<>": return c !== 0; case ">": return c > 0; case ">=": return c >= 0; case "<": return c < 0; default: return c <= 0; }
}

/** Excel-style criteria: 15000, ">15000", "<=5", "<>x", "Sarah" (case-insensitive text equality). */
function criteriaMatcher(c: CellValue): (v: CellValue) => boolean {
  if (typeof c === "number") return (v) => typeof v === "number" && v === c;
  const m = /^(>=|<=|<>|>|<|=)?(.*)$/s.exec(String(c ?? ""))!;
  const op = m[1] ?? "="; const rhs = m[2].trim();
  const n = rhs !== "" && Number.isFinite(Number(rhs)) ? Number(rhs) : null;
  return (v) => {
    if (n !== null) {
      if (typeof v !== "number") return op === "<>";
      return op === ">" ? v > n : op === ">=" ? v >= n : op === "<" ? v < n : op === "<=" ? v <= n : op === "<>" ? v !== n : v === n;
    }
    const eq = String(v ?? "").toLowerCase() === rhs.toLowerCase();
    return op === "<>" ? !eq : op === "=" ? eq : false;
  };
}


/** A 2D range argument as a grid of values. Lookups need real ranges; a scalar is rejected so the error is explicit. */
function grid(node: FormulaNode, lookup: CellLookup, fn: string): { rows: number; cols: number; at: (r: number, c: number) => CellValue } {
  if (node.type !== "range") throw new FormulaError(`${fn} needs a range`);
  const { sheet, ref } = splitRef(node.value as string); const r = parseRange(ref)!;
  return { rows: r.end.row - r.start.row + 1, cols: r.end.col - r.start.col + 1, at: (i, j) => lookup(`${sheet ? sheet + "!" : ""}${toAddress({ col: r.start.col + j, row: r.start.row + i })}`) };
}
const NA = () => new FormulaError("#N/A");
const same = (a: CellValue, b: CellValue) => (typeof a === "number" && typeof b === "number" ? a === b : String(a ?? "").toLowerCase() === String(b ?? "").toLowerCase() && a !== null && a !== "");

/** XLOOKUP / VLOOKUP / INDEX / MATCH. Exact match by default except VLOOKUP/MATCH where Excel defaults to approximate (sorted ascending). */
function lookupFn(fn: string, args: FormulaNode[], lookup: CellLookup): CellValue {
  const need = (min: number, max: number) => { if (args.length < min || args.length > max) throw new FormulaError(`${fn} has the wrong number of arguments`); };
  if (fn === "XLOOKUP") {
    need(3, 4); const key = evaluate(args[0], lookup); const keys = grid(args[1], lookup, fn); const ret = grid(args[2], lookup, fn);
    if (keys.cols !== 1 && keys.rows !== 1) throw new FormulaError("XLOOKUP lookup range must be one row or one column");
    const n = Math.max(keys.rows, keys.cols); const vert = keys.cols === 1;
    if ((vert ? ret.rows : ret.cols) !== n) throw new FormulaError("XLOOKUP ranges must be the same size");
    for (let i = 0; i < n; i++) if (same(vert ? keys.at(i, 0) : keys.at(0, i), key)) return (vert ? ret.at(i, 0) : ret.at(0, i)) ?? "";
    if (args[3]) return evaluate(args[3], lookup);
    throw NA();
  }
  if (fn === "VLOOKUP") {
    need(3, 4); const key = evaluate(args[0], lookup); const t = grid(args[1], lookup, fn); const idx = Math.trunc(toNum(evaluate(args[2], lookup)));
    if (idx < 1 || idx > t.cols) throw new FormulaError("#REF!");
    const approx = args[3] ? (() => { const v = evaluate(args[3], lookup); return typeof v === "boolean" ? v : toNum(v) !== 0; })() : true;
    if (!approx) { for (let i = 0; i < t.rows; i++) if (same(t.at(i, 0), key)) return t.at(i, idx - 1) ?? ""; throw NA(); }
    let hit = -1; for (let i = 0; i < t.rows; i++) { const v = t.at(i, 0); if (typeof v === "number" && typeof key === "number" ? v <= key : false) hit = i; else if (typeof v !== "number" || typeof key !== "number") { if (same(v, key)) hit = i; } }
    if (hit < 0) throw NA(); return t.at(hit, idx - 1) ?? "";
  }
  if (fn === "MATCH") {
    need(2, 3); const key = evaluate(args[0], lookup); const g = grid(args[1], lookup, fn); const type = args[2] ? Math.sign(toNum(evaluate(args[2], lookup))) : 1;
    if (g.cols !== 1 && g.rows !== 1) throw new FormulaError("MATCH range must be one row or one column");
    const n = Math.max(g.rows, g.cols); const at = (i: number) => (g.cols === 1 ? g.at(i, 0) : g.at(0, i));
    if (type === 0) { for (let i = 0; i < n; i++) if (same(at(i), key)) return i + 1; throw NA(); }
    let best = -1;
    for (let i = 0; i < n; i++) { const v = at(i); if (typeof v === "number" && typeof key === "number") { if (type > 0 ? v <= key : v >= key) best = i; } else if (same(v, key)) best = i; }
    if (best < 0) throw NA(); return best + 1;
  }
  // INDEX(range, row, [col])
  need(2, 3); const g = grid(args[0], lookup, fn); const r = Math.trunc(toNum(evaluate(args[1], lookup))); const c = args[2] ? Math.trunc(toNum(evaluate(args[2], lookup))) : (g.cols === 1 ? 1 : r);
  const row = g.cols === 1 || args[2] ? r : 1;
  if (row < 1 || row > g.rows || c < 1 || c > g.cols) throw new FormulaError("#REF!");
  return g.at(row - 1, c - 1) ?? "";
}

/** Evaluate a parsed formula. Circular refs are handled by the engine passing a guarded lookup. */
export function evaluate(node: FormulaNode, lookup: CellLookup): CellValue {
  switch (node.type) {
    case "literal": return node.value === "TRUE" ? true : node.value === "FALSE" ? false : (node.value as string | number);
    case "reference": return lookup(node.value as string);
    case "range": throw new FormulaError("A range can only be used inside a function");
    case "operator": {
      const [a, b] = node.children ?? [];
      if (node.name === "neg") return -toNum(evaluate(a, lookup));
      if (node.name === "pct") return toNum(evaluate(a, lookup)) / 100;
      const l = evaluate(a, lookup); const r = evaluate(b, lookup);
      if (["=", "<>", "<", ">", "<=", ">="].includes(node.name!)) return compare(node.name!, l, r);
      if (node.name === "&") return numText(l) + numText(r);
      const x = toNum(l); const y = toNum(r);
      if (node.name === "^") { if (x === 0 && y === 0) throw new FormulaError("#NUM!"); if (x === 0 && y < 0) throw new FormulaError("#DIV/0!"); const v = Math.pow(x, y); if (!Number.isFinite(v)) throw new FormulaError("#NUM!"); return v; }
      if (node.name === "+") return x + y;
      if (node.name === "-") return x - y;
      if (node.name === "*") return x * y;
      if (y === 0) throw new FormulaError("#DIV/0!");
      return x / y;
    }
    case "function": {
      const fn = node.name as string;
      if (SOFT.has(fn)) { const l0 = lookup; lookup = (a) => { try { return l0(a); } catch (e) { if (e instanceof FormulaError) return e.message; throw e; } }; }
      if (!(SUPPORTED_FUNCTIONS as readonly string[]).includes(fn)) throw new FormulaError(`Unsupported function ${fn}`);
      const args = node.children ?? [];
      if (fn === "XLOOKUP" || fn === "VLOOKUP" || fn === "INDEX" || fn === "MATCH") return lookupFn(fn, args, lookup);
      if (["SUMIFS", "COUNTIFS", "AVERAGEIF", "IFERROR", "AND", "OR", "NOT", "ROUND", "ABS", "SQRT", "POWER", "MOD", "ROUNDUP", "ROUNDDOWN", "SUMPRODUCT", "TEXTJOIN", "TEXT", "LEFT", "RIGHT", "MID", "LEN", "TRIM", "UPPER", "LOWER", "CONCAT", "CONCATENATE", "DATE", "TODAY", "NOW", "YEAR", "MONTH", "DAY", "EDATE", "EOMONTH", "DATEDIF"].includes(fn)) return moreFn(fn, args, lookup);
      if (fn === "IF") {
        if (args.length < 2 || args.length > 3) throw new FormulaError("IF needs 2 or 3 arguments");
        const cond = evaluate(args[0], lookup);
        const truthy = typeof cond === "boolean" ? cond : toNum(cond) !== 0;
        if (truthy) return evaluate(args[1], lookup);
        return args[2] ? evaluate(args[2], lookup) : false;
      }
      if (fn === "SUMIF" || fn === "COUNTIF") {
        if (fn === "SUMIF" ? args.length < 2 || args.length > 3 : args.length !== 2) throw new FormulaError(`${fn} has the wrong number of arguments`);
        if (args[0].type !== "range" || (args[2] && args[2].type !== "range")) throw new FormulaError(`${fn} needs ranges`);
        const crit = criteriaMatcher(evaluate(args[1], lookup));
        const test = expandRef(args[0].value as string);
        const sumAddrs = fn === "SUMIF" ? expandRef((args[2] ?? args[0]).value as string) : [];
        if (fn === "SUMIF" && sumAddrs.length !== test.length) throw new FormulaError("SUMIF ranges must be the same size");
        let total = 0, count = 0;
        test.forEach((a, i) => { if (crit(lookup(a))) { count++; if (fn === "SUMIF") { const v = lookup(sumAddrs[i]); if (typeof v === "number") total += v; } } });
        return fn === "SUMIF" ? total : count;
      }
      const raw: CellValue[] = [];
      const nums: number[] = [];
      for (const arg of args) {
        if (arg.type === "range") {
          for (const addr of expandRef(arg.value as string)) {
            const v = lookup(addr); raw.push(v);
            if (typeof v === "number") nums.push(v);
          }
        } else if (arg.type === "reference") {
          const v = lookup(arg.value as string); raw.push(v);
          if (typeof v === "number") nums.push(v);
        } else { const v = toNum(evaluate(arg, lookup)); raw.push(v); nums.push(v); }
      }
      if (fn === "SUM") return nums.reduce((s, n) => s + n, 0);
      if (fn === "COUNT") return nums.length;
      if (fn === "COUNTA") return raw.filter((v) => v !== null && v !== "").length;
      if (nums.length === 0) { if (fn === "AVERAGE") throw new FormulaError("#DIV/0!"); return 0; }
      if (fn === "AVERAGE") return nums.reduce((s, n) => s + n, 0) / nums.length;
      if (fn === "MIN") return Math.min(...nums);
      return Math.max(...nums);
    }
  }
}

/** Collect every cell address a formula reads (for validation and learning). */
export function referencedAddresses(node: FormulaNode): string[] {
  if (node.type === "reference") return [node.value as string];
  if (node.type === "range") return expandRef(node.value as string);
  return (node.children ?? []).flatMap(referencedAddresses);
}

/** Names of all functions used, e.g. ["IF","AVERAGE"]. */
export function functionsUsed(node: FormulaNode): string[] {
  const own = node.type === "function" ? [node.name as string] : [];
  return [...own, ...(node.children ?? []).flatMap(functionsUsed)];
}

/** Shift relative row references down by `dRow` (fill down). `$` on the row keeps it fixed. */
export function shiftFormulaRows(formula: string, dRow: number): string {
  return formula.split(/("[^"]*")/).map((part, i) => i % 2 === 1 ? part
    : part.replace(/(\$?)([A-Z]{1,3})(\$?)([1-9][0-9]*)(?![0-9(A-Za-z!])/g, (_m, d1, col, d2, row) => d2 ? `${d1}${col}${d2}${row}` : `${d1}${col}${Number(row) + dRow}`)).join("");
}


const rng = (n: FormulaNode | undefined, fn: string): string[] => { if (!n || n.type !== "range") throw new FormulaError(`${fn} needs ranges`); return expandRef(n.value as string); };
const txt = (v: CellValue): string => (v === null ? "" : typeof v === "boolean" ? (v ? "TRUE" : "FALSE") : String(v));
const truth = (v: CellValue): boolean => (typeof v === "boolean" ? v : toNum(v) !== 0);

/** Phase 3 functions: multi-criteria aggregates, logic, rounding and text. Pure and deterministic. */
function moreFn(fn: string, args: FormulaNode[], lookup: CellLookup): CellValue {
  const ev = (n: FormulaNode) => evaluate(n, lookup);
  const need = (min: number, max = min) => { if (args.length < min || args.length > max) throw new FormulaError(`${fn} has the wrong number of arguments`); };
  if (fn === "TODAY" || fn === "NOW") { need(0); const d = clock(); const base = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000 + 25569; return fn === "TODAY" ? base : base + (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400; }
  if (fn === "DATE") { need(3); const [y, m, d] = args.map((a) => Math.trunc(toNum(ev(a)))); if (y < 1900 || y > 9999) throw new FormulaError("#NUM!"); return Math.round(Date.UTC(y, m - 1, d) / 86400000) + 25569; }
  if (fn === "YEAR" || fn === "MONTH" || fn === "DAY") { need(1); const d = fromSerial(toNum(ev(args[0]))); return fn === "YEAR" ? d.getUTCFullYear() : fn === "MONTH" ? d.getUTCMonth() + 1 : d.getUTCDate(); }
  if (fn === "EDATE" || fn === "EOMONTH") {
    need(2); const d = fromSerial(toNum(ev(args[0]))); const n = Math.trunc(toNum(ev(args[1])));
    if (fn === "EOMONTH") return Math.round(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n + 1, 0) / 86400000) + 25569;
    const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1)); const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    return Math.round(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(d.getUTCDate(), last)) / 86400000) + 25569;
  }
  if (fn === "DATEDIF") {
    need(3); const a = toNum(ev(args[0])), b = toNum(ev(args[1])); const unit = txt(ev(args[2])).toUpperCase();
    if (b < a) throw new FormulaError("#NUM!");
    const x = fromSerial(a), y = fromSerial(b);
    if (unit === "D") return Math.floor(b) - Math.floor(a);
    if (unit === "M" || unit === "Y") { let months = (y.getUTCFullYear() - x.getUTCFullYear()) * 12 + y.getUTCMonth() - x.getUTCMonth(); if (y.getUTCDate() < x.getUTCDate()) months--; return unit === "M" ? months : Math.floor(months / 12); }
    throw new FormulaError("#NUM!");
  }
  if (fn === "IFERROR") { need(2); try { const v = ev(args[0]); return v; } catch { return ev(args[1]); } }
  if (fn === "SUMIFS" || fn === "COUNTIFS") {
    const isSum = fn === "SUMIFS"; const off = isSum ? 1 : 0;
    if (args.length < off + 2 || (args.length - off) % 2 !== 0) throw new FormulaError(`${fn} has the wrong number of arguments`);
    const sumR = isSum ? rng(args[0], fn) : [];
    const pairs: { r: string[]; m: (v: CellValue) => boolean }[] = [];
    for (let i = off; i < args.length; i += 2) pairs.push({ r: rng(args[i], fn), m: criteriaMatcher(ev(args[i + 1])) });
    const size = pairs[0].r.length;
    if (pairs.some((p) => p.r.length !== size) || (isSum && sumR.length !== size)) throw new FormulaError(`${fn} ranges must be the same size`);
    let total = 0, count = 0;
    for (let i = 0; i < size; i++) if (pairs.every((p) => p.m(lookup(p.r[i])))) { count++; if (isSum) { const v = lookup(sumR[i]); if (typeof v === "number") total += v; } }
    return isSum ? total : count;
  }
  if (fn === "AVERAGEIF") {
    need(2, 3); const test = rng(args[0], fn); const avg = args[2] ? rng(args[2], fn) : test;
    if (avg.length !== test.length) throw new FormulaError("AVERAGEIF ranges must be the same size");
    const m = criteriaMatcher(ev(args[1])); let t = 0, c = 0;
    test.forEach((a, i) => { if (m(lookup(a))) { const v = lookup(avg[i]); if (typeof v === "number") { t += v; c++; } } });
    if (c === 0) throw new FormulaError("#DIV/0!");
    return t / c;
  }
  if (fn === "AND" || fn === "OR") {
    if (args.length < 1) throw new FormulaError(`${fn} needs at least one argument`);
    const vals = args.map((a) => truth(ev(a)));
    return fn === "AND" ? vals.every(Boolean) : vals.some(Boolean);
  }
  if (fn === "NOT") { need(1); return !truth(ev(args[0])); }
  if (fn === "SUMPRODUCT") {
    if (args.length < 1) throw new FormulaError("SUMPRODUCT needs at least one range");
    const lists = args.map((a) => rng(a, fn)); if (lists.some((l) => l.length !== lists[0].length)) throw new FormulaError("#VALUE!");
    let t = 0; for (let i = 0; i < lists[0].length; i++) t += lists.reduce((p, l) => { const v = lookup(l[i]); return p * (typeof v === "number" ? v : 0); }, 1);
    return t;
  }
  if (fn === "TEXTJOIN") {
    if (args.length < 3) throw new FormulaError("TEXTJOIN needs a delimiter, ignore-empty and at least one value");
    const delim = txt(ev(args[0])); const skip = truth(ev(args[1]));
    const parts = args.slice(2).flatMap((a) => (a.type === "range" ? rng(a, fn).map((x) => txt(lookup(x))) : [txt(ev(a))]));
    return (skip ? parts.filter((p) => p !== "") : parts).join(delim);
  }
  if (fn === "TEXT") {
    need(2); const v = ev(args[0]); const fmt = txt(ev(args[1]));
    if (typeof v !== "number") return txt(v);
    const grp = (n: string) => n.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    let m = /^(#,##)?0(?:\.(0+))?(%)?$/.exec(fmt);
    if (m) { const d = m[2]?.length ?? 0; let x = m[3] ? v * 100 : v; const neg = x < 0; x = Math.abs(Number(x.toPrecision(15))); const body = (Math.round(x * 10 ** d + 1e-9) / 10 ** d).toFixed(d); const [ip, fp] = body.split("."); return (neg && Number(body) !== 0 ? "-" : "") + (m[1] ? grp(ip) : ip) + (fp ? "." + fp : "") + (m[3] ? "%" : ""); }
    m = /^(yyyy-mm-dd|dd\/mm\/yyyy|mm\/dd\/yyyy)$/.exec(fmt);
    if (m) { if (!(v >= 1 && v < 2958466)) throw new FormulaError("#VALUE!"); const iso = new Date(Math.round((Math.floor(v) - 25569) * 86400000)).toISOString().slice(0, 10); const [y, mo, d] = iso.split("-"); return fmt === "yyyy-mm-dd" ? iso : fmt === "dd/mm/yyyy" ? `${d}/${mo}/${y}` : `${mo}/${d}/${y}`; }
    throw new FormulaError("#VALUE!"); // formats outside the documented subset are an error, never a guess
  }
  if (fn === "ABS") { need(1); return Math.abs(toNum(ev(args[0]))); }
  if (fn === "SQRT") { need(1); const x = toNum(ev(args[0])); if (x < 0) throw new FormulaError("#NUM!"); return Math.sqrt(x); }
  if (fn === "POWER") { need(2); const b = toNum(ev(args[0])), e = toNum(ev(args[1])); if (b === 0 && e < 0) throw new FormulaError("#DIV/0!"); const r = Math.pow(b, e); if (!Number.isFinite(r)) throw new FormulaError("#NUM!"); return r; }
  if (fn === "MOD") { need(2); const n = toNum(ev(args[0])), d = toNum(ev(args[1])); if (d === 0) throw new FormulaError("#DIV/0!"); return n - d * Math.floor(n / d); }
  if (fn === "ROUNDUP" || fn === "ROUNDDOWN") {
    need(2); const x = toNum(ev(args[0])); const f = 10 ** Math.trunc(toNum(ev(args[1]))); const y = Math.abs(x) * f; const near = Math.round(y);
    const m = Math.abs(y - near) < 1e-9 * Math.max(1, y) ? near : y; // absorb binary noise such as 2.3*100 = 229.99999999999997
    return (Math.sign(x) * (fn === "ROUNDUP" ? Math.ceil(m) : Math.floor(m))) / f;
  }
  if (fn === "ROUND") { need(2); const d = Math.trunc(toNum(ev(args[1]))); const f = 10 ** d; const x = toNum(ev(args[0])); return (Math.sign(x) * Math.round(Math.abs(x) * f + 1e-9)) / f; }
  if (fn === "CONCAT" || fn === "CONCATENATE") {
    if (args.length < 1) throw new FormulaError(`${fn} needs at least one argument`);
    return args.flatMap((a) => (a.type === "range" ? rng(a, fn).map((x) => txt(lookup(x))) : [txt(ev(a))])).join("");
  }
  need(1, fn === "MID" ? 3 : 2);
  const s = txt(ev(args[0]));
  if (fn === "LEN") return s.length;
  if (fn === "UPPER") return s.toUpperCase();
  if (fn === "LOWER") return s.toLowerCase();
  if (fn === "TRIM") return s.trim().replace(/\s+/g, " ");
  if (fn === "LEFT" || fn === "RIGHT") {
    const n = args[1] ? Math.trunc(toNum(ev(args[1]))) : 1; if (n < 0) throw new FormulaError("#VALUE!");
    return fn === "LEFT" ? s.slice(0, n) : n === 0 ? "" : s.slice(-n);
  }
  need(3); const start = Math.trunc(toNum(ev(args[1]))); const len = Math.trunc(toNum(ev(args[2])));
  if (start < 1 || len < 0) throw new FormulaError("#VALUE!");
  return s.slice(start - 1, start - 1 + len);
}

const fromSerial = (n: number): Date => new Date(Math.round((Math.floor(n) - 25569) * 86400000));

const SAFE_NAME = /^[\p{L}_][\p{L}0-9_]*$/u;
/** The sheet part of a reference as it must be written: bare when the tokenizer can read it bare, otherwise quoted. */
export const sheetRefName = (name: string) => (SAFE_NAME.test(name) ? name : `'${name}'`);
/**
 * Rewrites every reference to sheet `from` so it points at `to`. Works on the formula's own tokens: text inside string literals is never touched
 * ("Sales"!A1 style text stays, a literal "Sales" stays), and both Sales!A1 and 'My Data'!A1:B2 forms are handled. Case-insensitive like Excel.
 */
export function renameSheetInFormula(formula: string, from: string, to: string): string {
  return formula.split(/("[^"]*")/).map((part, i) => i % 2 === 1 ? part
    : part.replace(/('[^']*'|[\p{L}_][\p{L}0-9_]*)!/gu, (m, q: string) => { const n = q.startsWith("'") ? q.slice(1, -1) : q; return n.toLowerCase() === from.toLowerCase() ? `${sheetRefName(to)}!` : m; })).join("");
}
