// Generic screen control for DOT: "everything you can type or click on the page" without per-page code.
// Snapshot -> index -> act. Credentials/payment fields and sign-in/payment buttons are blocked (tier 3); destructive or sending buttons need confirmation.
const MAX = 100;
const T3_FIELD = /pass(word)?|סיסמ|cvv|cvc|card|כרטיס|iban|ssn|otp|one-time|2fa|token|secret/i;
const T3_BUTTON = /sign\s?in|log\s?in|sign\s?up|create account|sign\s?out|log\s?out|התחבר|הרשמ|יצירת חשבון|התנתק|pay\b|payment|checkout|buy now|purchase|subscribe|upgrade|תשלום|רכישה|שלם|מנוי|delete (my )?account|מחיקת חשבון/i;
const CONFIRM_BUTTON = /delete|remove|reset|clear|erase|discard|send|submit|export|download|מחק|הסר|אפס|נקה|שלח|שליחה|ייצוא|הורד/i;
const registry = new Map<number, Element>();

export interface Control { index: number; role: string; label: string; value?: string; checked?: boolean; options?: string[] }

function labelOf(el: Element): string {
  const h = el as HTMLElement; const id = h.id; let t = h.getAttribute("aria-label") || "";
  if (!t && id) t = document.querySelector(`label[for="${(typeof CSS !== "undefined" && CSS.escape ? CSS.escape(id) : id.replace(/["\\]/g, ""))}"]`)?.textContent ?? "";
  if (!t) t = (el as HTMLInputElement).placeholder || h.getAttribute("title") || h.textContent || (el as HTMLInputElement).name || "";
  return t.replace(/\s+/g, " ").trim().slice(0, 80);
}
function visible(el: Element): boolean { const r = (el as HTMLElement).getBoundingClientRect?.(); const s = getComputedStyle(el); return !!r && s.visibility !== "hidden" && s.display !== "none" && (r.width > 0 || r.height > 0); }
const inDot = (el: Element) => !!el.closest("[data-dot-ui]");

export function snapshot(root: ParentNode = document): Control[] {
  registry.clear(); const out: Control[] = [];
  const els = root.querySelectorAll("button, a[href], input, textarea, select, [role=button], [role=tab], [role=switch], [role=checkbox], [role=combobox], [role=option], [role=menuitem], [role=menuitemcheckbox], [role=menuitemradio], [role=radio], [role=slider]");
  // Page content first (in view, outside nav/header chrome), so a long sidebar never hides the page's own controls.
  const rank = (el: Element) => { const r = (el as HTMLElement).getBoundingClientRect?.(); const chrome = !!el.closest("nav, aside, header, [role=navigation]"); const inView = !!r && r.bottom > 0 && r.top < (typeof innerHeight === "number" ? innerHeight : 800); return (inView ? 0 : 2) + (chrome ? 1 : 0); };
  const ordered = Array.from(els).map((el, i) => ({ el, i, k: rank(el) })).sort((a, b) => a.k - b.k || a.i - b.i).map((x) => x.el);
  for (const el of ordered) {
    if (out.length >= MAX) break;
    if (inDot(el) || (el as HTMLButtonElement).disabled || el.getAttribute("aria-hidden") === "true" || !visible(el)) continue;
    const tag = el.tagName.toLowerCase(); const type = (el as HTMLInputElement).type?.toLowerCase() ?? "";
    if (tag === "input" && ["hidden", "password", "file"].includes(type)) continue;
    const label = labelOf(el); if (!label && tag !== "input" && tag !== "textarea") continue;
    const index = out.length + 1; registry.set(index, el);
    const c: Control = { index, role: tag === "a" ? "link" : tag === "input" ? (type === "checkbox" ? "checkbox" : type === "range" ? "slider" : "textbox") : tag === "textarea" ? "textbox" : tag === "select" ? "select" : el.getAttribute("role") || "button", label };
    if (el.getAttribute("aria-expanded") === "true") c.checked = true;
    if (tag === "input" && type !== "checkbox" && !T3_FIELD.test(label + (el as HTMLInputElement).name + (el as HTMLInputElement).autocomplete)) c.value = (el as HTMLInputElement).value.slice(0, 60);
    if (type === "checkbox") c.checked = (el as HTMLInputElement).checked;
    if (tag === "select") c.options = Array.from((el as HTMLSelectElement).options).slice(0, 20).map((o) => o.text.trim());
    out.push(c);
  }
  return out;
}

export type Gate = { ok: true; confirm: boolean } | { ok: false; error: string; note: string };
export function gateClick(label: string, href?: string | null): Gate {
  if (T3_BUTTON.test(label)) return { ok: false, error: "not_allowed_by_voice", note: "Sign-in, sign-up, sign-out and payments are done by typing and tapping on screen." };
  if (href && /^https?:\/\//i.test(href) && !href.startsWith(location.origin)) return { ok: false, error: "external_link_blocked", note: "Opening other websites is not done by voice." };
  return { ok: true, confirm: CONFIRM_BUTTON.test(label) };
}
export function gateType(el: Element): Gate {
  const i = el as HTMLInputElement; const sig = `${labelOf(el)} ${i.name ?? ""} ${i.autocomplete ?? ""} ${i.id ?? ""}`;
  if (i.type === "password" || i.type === "file" || T3_FIELD.test(sig)) return { ok: false, error: "not_allowed_by_voice", note: "Passwords, payment details and file pickers are done by hand on screen." };
  return { ok: true, confirm: false };
}
export const getEl = (index: number): Element | null => { const el = registry.get(index); return el && el.isConnected ? el : null; };
export function typeInto(el: Element, text: string) {
  const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, text);
  el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true }));
}
export function chooseOption(el: HTMLSelectElement, wanted: string): boolean {
  const w = wanted.trim().toLowerCase(); const o = Array.from(el.options).find((x) => x.text.trim().toLowerCase() === w) ?? Array.from(el.options).find((x) => x.text.toLowerCase().includes(w));
  if (!o) return false; Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set?.call(el, o.value); el.dispatchEvent(new Event("change", { bubbles: true })); return true;
}
