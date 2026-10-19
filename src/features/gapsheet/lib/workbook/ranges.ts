export interface CellRef { col: number; row: number } // 1-based

export function colToLetters(col: number): string {
  let s = "";
  let n = col;
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
export function lettersToCol(letters: string): number {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}
export function parseAddress(addr: string): CellRef | null {
  const m = /^([A-Za-z]{1,3})([1-9][0-9]{0,4})$/.exec(addr.trim());
  if (!m) return null;
  return { col: lettersToCol(m[1].toUpperCase()), row: parseInt(m[2], 10) };
}
export function toAddress(ref: CellRef): string { return `${colToLetters(ref.col)}${ref.row}`; }

export interface RangeRef { start: CellRef; end: CellRef }
export function parseRange(r: string): RangeRef | null {
  const parts = r.trim().split(":");
  if (parts.length === 1) { const a = parseAddress(parts[0]); return a ? { start: a, end: a } : null; }
  if (parts.length !== 2) return null;
  const a = parseAddress(parts[0]); const b = parseAddress(parts[1]);
  if (!a || !b) return null;
  return {
    start: { col: Math.min(a.col, b.col), row: Math.min(a.row, b.row) },
    end: { col: Math.max(a.col, b.col), row: Math.max(a.row, b.row) },
  };
}
export function expandRange(r: RangeRef): string[] {
  const out: string[] = [];
  for (let row = r.start.row; row <= r.end.row; row++)
    for (let col = r.start.col; col <= r.end.col; col++) out.push(toAddress({ col, row }));
  return out;
}
