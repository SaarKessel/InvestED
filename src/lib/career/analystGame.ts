import {validPracticeRuns,type PracticeRun} from './practiceRuns';
import {isEvidenceSelection,readyBoardEvidence} from './boardEvidence';
/** Invented company report for a learning game, not a real filing or market data. */
export const FICTIONAL_REPORT = {
  company:'Northstar Tools (fictional)',
  rows:[
    {year:'Year 1',revenue:1200,operatingProfit:120,sharePrice:50,dividend:0},
    {year:'Year 2',revenue:1500,operatingProfit:180,sharePrice:56,dividend:2},
  ],
} as const;
export type AnalystMetric='revenueGrowth'|'operatingMargin'|'shareholderReturn';
export type BoardChoice = 'none'|'review'|'proceed';
export interface AnalystGame {runs?:PracticeRun[]; answers:Partial<Record<AnalystMetric,string>>; checked:AnalystMetric[]; boardChoice?:BoardChoice; memo:string; submitted:boolean; evidence?:string[]; }
export const ANALYST_KEY='invested_career_analyst_game_v1';
export const ANALYST_METRICS:AnalystMetric[]=['revenueGrowth','operatingMargin','shareholderReturn'];
export const newAnalystGame=():AnalystGame=>({answers:{},checked:[],boardChoice:'none',memo:'',submitted:false,evidence:[]});
const [prior,current]=FICTIONAL_REPORT.rows;
/** Percent values. Shareholder return includes the invented dividend. */
export const expectedMetric=(metric:AnalystMetric):number=>{
  if(metric==='revenueGrowth') return (current.revenue/prior.revenue-1)*100;
  if(metric==='operatingMargin') return current.operatingProfit/current.revenue*100;
  return ((current.sharePrice-prior.sharePrice)+current.dividend)/prior.sharePrice*100;
};
export const checkMetric=(metric:AnalystMetric,input:string):boolean=>{
  // Full decimal input only; no trailing text or percentage signs in the field.
  if(!/^-?(?:\d+\.?\d*|\.\d+)$/.test(input.trim())) return false;
  const number=Number(input.trim());
  return Number.isFinite(number) && Math.abs(number-expectedMetric(metric))<=.01;
};
export const isAnalystGame=(value:unknown):value is AnalystGame=>{
  if(!value||typeof value!=='object')return false;
  const v=value as AnalystGame;
  if(!validPracticeRuns(v.runs,'analyst'))return false;
  return !!v.answers && typeof v.answers==='object' && ANALYST_METRICS.every(key=>v.answers[key]===undefined||typeof v.answers[key]==='string') &&
    Array.isArray(v.checked) && v.checked.every(key=>ANALYST_METRICS.includes(key)) && new Set(v.checked).size===v.checked.length &&
    (v.boardChoice===undefined||['none','review','proceed'].includes(v.boardChoice)) && typeof v.memo==='string' && typeof v.submitted==='boolean' && (v.evidence===undefined||isEvidenceSelection('analyst',v.evidence)) && (!v.submitted || readyToSubmit(v));
};
export const readyToSubmit=(game:AnalystGame):boolean=>ANALYST_METRICS.every(key=>game.checked.includes(key)&&checkMetric(key,game.answers[key]??''))&&(game.boardChoice==='review'||game.boardChoice==='proceed')&&(game.evidence===undefined?game.memo.trim().length>=20:readyBoardEvidence('analyst',game.evidence));
export function readAnalystGame():AnalystGame|null{try{const raw=localStorage.getItem(ANALYST_KEY);const value=raw?JSON.parse(raw):null;return isAnalystGame(value)?value:null;}catch{return null;}}
export class AnalystConflictError extends Error {}
export function saveAnalystGame(next:AnalystGame,expected:AnalystGame|null):void{
  if(!isAnalystGame(next))throw new Error('Invalid analyst game');
  if(JSON.stringify(readAnalystGame())!==JSON.stringify(expected))throw new AnalystConflictError('Changed in another tab');
  localStorage.setItem(ANALYST_KEY,JSON.stringify(next));
}
