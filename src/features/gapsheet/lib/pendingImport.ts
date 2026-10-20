/** One-shot handoff for a data file picked in the chat "+" menu: the chat
 *  stashes the File, opens GapSheet in the thread, and GapSheet imports it
 *  on mount through its existing validated CSV path (5MB / 5,000 rows /
 *  100 columns limits stay in force). */
let pending: File | null = null;

export function stashGapSheetImport(file: File): void {
  pending = file;
}

export function takeGapSheetImport(): File | null {
  const file = pending;
  pending = null;
  return file;
}
