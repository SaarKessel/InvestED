import type { Sheet, WorkbookState } from '@/features/gapsheet/types/workbook';
export type TableDirection = 'rtl'|'ltr';
/** The request's leading language controls layout, not its quoted headers or UI language. */
export function requestDirection(text:string):TableDirection {
 const first=text.match(/[\p{L}]/u)?.[0]??'';
 return /[\u0590-\u05ff]/.test(first)?'rtl':'ltr';
}
export function sheetDirection(sheet:Sheet):TableDirection {return sheet.direction??'ltr';}
export function withRequestDirection(state:WorkbookState,text:string):WorkbookState {
 const direction=requestDirection(text);
 return {...state,sheets:state.sheets.map(sh=>({...sh,direction}))};
}
