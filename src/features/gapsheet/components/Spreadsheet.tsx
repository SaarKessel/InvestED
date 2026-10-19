
import { sheetDirection } from "@/features/gapsheet/lib/workbook/direction";
import { useRef, useState, type KeyboardEvent } from "react";
import type { WorkbookState } from "@/features/gapsheet/types/workbook";
import { colToLetters, parseAddress, parseRange, toAddress } from "@/features/gapsheet/lib/workbook/ranges";
import { formattedValue, hiddenRows } from "@/features/gapsheet/lib/workbook/engine";
import { BG_HEX, FG_HEX } from "@/features/gapsheet/lib/workbook/palette";
import type { Lang } from "@/features/gapsheet/lib/i18n";

/** LTR cell addresses inside either page direction. Native clipboard events preserve browser permissions. */
export function Spreadsheet({ state, onEdit, onPaste, onSelect, highlight, cols = 6, rows = 18, testId = "grid", lang = "he" }: {
  onSelect?: (addr: string) => void;
  onPaste?: (edits: { address: string; raw: string }[]) => void;
  state: WorkbookState; onEdit: (addr: string, raw: string) => void; highlight?: string | null; cols?: number; rows?: number; testId?: string; lang?: Lang;
}) {
  const sheet = state.sheets.find(s => s.id === state.activeSheetId)!;
  const direction = sheetDirection(sheet);
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [firstRow, setFirstRow] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const editingRef = useRef<string | null>(null);
  const [draft, setDraft] = useState("");
  const [selected, setSelected] = useState("A1");
  const [anchor, setAnchor] = useState("A1");
  const [notice, setNotice] = useState("");
  const fxCancelled = useRef(false);
  const hidden = hiddenRows(sheet);
  const visibleRows = Array.from({ length: rows }, (_, i) => i + 1).filter(row => !hidden.has(row));
  const virtual = rows > 100;
  const windowStart = virtual ? Math.max(0, firstRow - 5) : 0;
  const windowRows = virtual ? visibleRows.slice(windowStart, windowStart + 40) : visibleRows;
  const range = parseRange(`${anchor}:${selected}`)!;
  const rangeAddress = anchor === selected ? selected : `${toAddress(range.start)}:${toAddress(range.end)}`;
  const raw = (address: string) => sheet.cells[address]?.formula ?? String(sheet.cells[address]?.value ?? "");
  const t = (he: string, en: string) => lang === "he" ? he : en;
  function select(address: string, extend = false, focus = true) {
    setSelected(address); if (!extend) setAnchor(address);
    onSelect?.(extend ? `${anchor}:${address}` : address);
    if (focus) {
      const rowIndex = visibleRows.indexOf(parseAddress(address)!.row);
      if (virtual && (rowIndex < windowStart || rowIndex >= windowStart + 40)) { viewport.current!.scrollTop = rowIndex * 24; setFirstRow(rowIndex); }
      const focusCell = () => root.current?.querySelector<HTMLElement>(`td[data-addr="${address}"]`)?.focus();
      if (root.current?.querySelector(`td[data-addr="${address}"]`)) focusCell(); else requestAnimationFrame(focusCell);
    }
  }
  function move(dc: number, dr: number, extend = false) {
    const ref = parseAddress(selected)!;
    const col = Math.max(1, Math.min(cols, ref.col + dc));
    let row = Math.max(1, Math.min(rows, ref.row + dr));
    while (hidden.has(row) && row >= 1 && row <= rows) row += dr < 0 ? -1 : 1;
    if (row >= 1 && row <= rows) select(toAddress({ col, row }), extend);
  }
  function begin(address: string, initial = raw(address)) {
    editingRef.current = address; setEditing(address); setDraft(initial);
  }
  function finish(address: string, value: string, commit: boolean) {
    if (editingRef.current !== address) return;
    editingRef.current = null; setEditing(null);
    if (commit) onEdit(address, value);
  }
  /** Delete/Backspace on a focused grid cell clears the selection through the existing edit path (onEdit for one cell, the batch path for a range). Hidden (filtered) rows are never touched. */
  function clearSelection() {
    if (range.start.col === range.end.col && range.start.row === range.end.row) { onEdit(toAddress(range.start), ""); return; }
    const edits: { address: string; raw: string }[] = [];
    for (let r = range.start.row; r <= range.end.row; r++) { if (hidden.has(r)) continue; for (let c = range.start.col; c <= range.end.col; c++) edits.push({ address: toAddress({ col: c, row: r }), raw: "" }); }
    if (edits.length && onPaste) onPaste(edits);
  }
  function key(e: KeyboardEvent<HTMLTableCellElement>, address: string) {
    if (e.target !== e.currentTarget) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.startsWith("Arrow")) { e.preventDefault(); move((e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0) * (direction === "rtl" ? -1 : 1), e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0, e.shiftKey); }
    else if (e.key === "Tab") { const col = parseAddress(selected)!.col; if ((!e.shiftKey && col < cols) || (e.shiftKey && col > 1)) { e.preventDefault(); move(e.shiftKey ? -1 : 1, 0); } }
    else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); clearSelection(); }
    else if (e.key === "Enter" || e.key === "F2") { e.preventDefault(); begin(address); }
    else if (e.key.length === 1) { e.preventDefault(); begin(address, e.key); }
  }
  return (
    <div ref={root} dir={direction} data-testid={testId} className="gs-grid max-w-full overflow-auto border border-slate-300 bg-white"
      onCopy={e => {
        if ((e.target as HTMLElement).tagName === "INPUT") return;
        const lines = [];
        for (let r = range.start.row; r <= range.end.row; r++) {
          if (hidden.has(r)) continue;
          const cells = []; for (let c = range.start.col; c <= range.end.col; c++) cells.push(raw(toAddress({ col: c, row: r })));
          lines.push(cells.join("\t"));
        }
        e.preventDefault(); e.clipboardData.setData("text/plain", lines.join("\n"));
      }}
      onPaste={e => {
        if ((e.target as HTMLElement).tagName === "INPUT" || !onPaste) return;
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n").replace(/\n$/, "");
        const matrix = text.split("\n").map(line => line.split("\t"));
        const start = parseAddress(selected)!;
        if (text.length > 1_000_000 || matrix.length * Math.max(...matrix.map(r => r.length)) > 20000 || matrix.some(r => r.some(v => v.length > 8192)) || start.row + matrix.length - 1 > rows || matrix.some(r => start.col + r.length - 1 > cols) || matrix.some((_, i) => hidden.has(start.row + i))) {
          setNotice(t("ההדבקה לא בוצעה: הטווח גדול מדי, מחוץ לגיליון או כולל שורות מוסתרות. הנתונים לא השתנו.", "Paste was not applied: the range is too large, outside the grid or includes hidden rows. Your data did not change.")); return;
        }
        const edits = matrix.flatMap((line, r) => line.map((value, c) => ({ address: toAddress({ col: start.col + c, row: start.row + r }), raw: value })));
        onPaste(edits); setNotice(t(`הודבקו ${edits.length} תאים.`, `${edits.length} cells pasted.`));
      }}>
      <div dir={direction} className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-2 py-1 text-sm">
        <span className="min-w-16 rounded border bg-white px-1 text-center font-mono text-xs" data-testid="cell-name">{rangeAddress}</span>
        <label htmlFor={`${testId}-fx`} className="text-slate-600">fx</label>
        <input id={`${testId}-fx`} key={`${sheet.id}:${selected}:${raw(selected)}`} aria-label={t(`נוסחה או ערך עבור ${selected}`, `Formula or value for ${selected}`)} className="min-w-0 flex-1 bg-transparent font-mono" data-testid="formula-bar" defaultValue={raw(selected)}
          onFocus={() => { fxCancelled.current = false; }}
          onBlur={e => { if (!fxCancelled.current && e.currentTarget.value !== raw(selected)) onEdit(selected, e.currentTarget.value); }}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); fxCancelled.current = true; onEdit(selected, e.currentTarget.value); select(selected); } if (e.key === "Escape") { fxCancelled.current = true; e.currentTarget.value = raw(selected); select(selected); } }} />
      </div>
      <p role="status" className={notice ? "px-2 py-1 text-xs text-slate-700" : "sr-only"}>{notice}</p>
      <div ref={viewport} data-testid="grid-viewport" className={virtual ? "max-h-[560px] overflow-auto" : "overflow-auto"} onScroll={e => { if (virtual) setFirstRow(Math.floor(e.currentTarget.scrollTop / 24)); }}>
      <table role="grid" aria-label={t("גיליון עבודה", "Spreadsheet")} aria-rowcount={rows + 1} aria-colcount={cols + 1} className="border-collapse text-sm">
        <thead className="sticky top-0 z-10"><tr role="row"><th role="columnheader" className="w-10 border bg-slate-100"><span className="sr-only">{t("מספר שורה", "Row number")}</span></th>{Array.from({ length: cols }, (_, c) => (
          <th role="columnheader" key={c} className="min-w-24 border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{colToLetters(c + 1)}</th>))}</tr></thead>
        <tbody>{virtual && windowStart > 0 && <tr aria-hidden="true"><td colSpan={cols + 1} style={{ height: windowStart * 24, padding: 0, border: 0 }} /></tr>}
        {windowRows.map(row => { const r = row - 1; return (
          <tr role="row" aria-rowindex={r + 2} key={r} data-row={r + 1} className={hidden.has(r + 1) ? "hidden" : ""}><th scope="row" role="rowheader" className="w-9 border border-slate-300 bg-slate-100 px-1 text-center text-xs font-normal text-slate-600">{r + 1}</th>
            {Array.from({ length: cols }, (_, c) => {
              const addr = toAddress({ col: c + 1, row: r + 1 });
              const cell = sheet.cells[addr]; const isEditing = editing === addr;
              const inRange = r + 1 >= range.start.row && r + 1 <= range.end.row && c + 1 >= range.start.col && c + 1 <= range.end.col;
              return (
                <td role="gridcell" aria-colindex={c + 2} aria-label={`${addr}${cell?.formula ? `: ${cell.formula}` : ""}`} aria-selected={inRange} tabIndex={selected === addr ? 0 : -1} key={addr} data-addr={addr}
                  onKeyDown={e => key(e, addr)} onClick={e => select(addr, e.shiftKey)} onDoubleClick={() => begin(addr)}
                  style={{ ...(cell?.format?.background ? { backgroundColor: BG_HEX[cell.format.background] } : {}), ...(cell?.format?.color ? { color: FG_HEX[cell.format.color] } : {}), ...(cell?.format?.border ? { border: "1px solid #7F7F7F" } : {}) }}
                  className={`h-6 border border-slate-200 px-1.5 text-[13px] ${cell?.formula && !cell?.format?.background ? "bg-emerald-50 font-semibold" : ""} ${cell?.format?.bold ? "font-bold" : ""} ${cell?.format?.italic ? "italic" : ""} ${cell?.format?.align === "center" ? "text-center" : cell?.format?.align === "left" ? "text-left" : cell?.format?.align === "right" ? "text-right" : ""} ${highlight === addr ? "outline outline-2 outline-emerald-500" : ""} ${selected === addr ? "ring-2 ring-blue-600 ring-inset" : inRange ? "ring-1 ring-blue-400 ring-inset bg-blue-50" : ""} ${typeof cell?.value === "number" || (cell?.formula && typeof cell.computedValue === "number") ? "text-right tabular-nums" : ""}`}>
                  {isEditing ? (
                    <input dir={direction} aria-label={t(`עריכת ${addr}`, `Edit ${addr}`)} autoFocus className="w-full bg-transparent outline-none" value={draft} onChange={e => setDraft(e.target.value)}
                      onBlur={() => finish(addr, draft, true)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); finish(addr, draft, true); if (e.key === "Enter") move(0, e.shiftKey ? -1 : 1); else move(e.shiftKey ? -1 : 1, 0); } if (e.key === "Escape") { e.preventDefault(); finish(addr, draft, false); select(addr); } }} />
                  ) : formattedValue(cell)}
                </td>);
            })}
          </tr>); })}
        {virtual && windowStart + windowRows.length < visibleRows.length && <tr aria-hidden="true"><td colSpan={cols + 1} style={{ height: (visibleRows.length - windowStart - windowRows.length) * 24, padding: 0, border: 0 }} /></tr>}
        </tbody>
      </table>
      </div>
    </div>
  );
}
