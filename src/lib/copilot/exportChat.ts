/** Export of the visible conversation as CSV or a print page (save as PDF). Text only: what is on screen, no extra data. */
export interface ExportMessage { role: "user" | "copilot"; text: string }

/** CSV cell: quotes doubled, and a leading = + - @ is prefixed so a spreadsheet never runs it as a formula. */
export function csvCell(v: string): string {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}
export function toCsv(messages: ExportMessage[], lang: "en" | "he"): string {
  const head = lang === "he" ? ["מספר", "מי", "טקסט"] : ["n", "who", "text"];
  const who = (r: ExportMessage["role"]) => (r === "user" ? (lang === "he" ? "אני" : "me") : "InvestED+");
  const rows = messages.map((m, i) => [String(i + 1), who(m.role), m.text].map(csvCell).join(","));
  return "\ufeff" + [head.map(csvCell).join(","), ...rows].join("\r\n");
}
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export function toPrintHtml(messages: ExportMessage[], lang: "en" | "he", title: string, note: string): string {
  const dir = lang === "he" ? "rtl" : "ltr";
  const body = messages.map((m) => `<p><b>${esc(m.role === "user" ? (lang === "he" ? "אני" : "Me") : "InvestED+")}:</b> ${esc(m.text).replace(/\n/g, "<br>")}</p>`).join("");
  return `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font:14px/1.5 system-ui,sans-serif;margin:24px;color:#111}p{margin:0 0 10px}small{color:#555}</style></head><body><h1>${esc(title)}</h1><p><small>${esc(note)}</small></p>${body}</body></html>`;
}
export function downloadText(name: string, mime: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function printHtml(html: string): boolean {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open(); w.document.write(html); w.document.close(); w.focus();
  setTimeout(() => w.print(), 300);
  return true;
}
