import {validPracticeRuns,type PracticeRun} from './practiceRuns';
import {isEvidenceSelection,isFollowupChoice,readyBoardEvidence,readyFollowup} from './boardEvidence';
/** Invented statements for an educational game. Not a company filing. */
export const FICTIONAL_STATEMENTS={
  name:'Harbor Manufacturing (fictional)',
  income:{revenue:2000,costOfSales:1300,operatingExpenses:400},
  balance:{cash:250,receivables:350,inventory:300,fixedAssets:1100,currentLiabilities:600,longTermLiabilities:700,equity:700},
  cashFlow:{operating:240,investing:-300,financing:100},
} as const;
export type AccountingMetric='grossMargin'|'currentRatio'|'cashChange';
export const ACCOUNTING_METRICS:AccountingMetric[]=['grossMargin','currentRatio','cashChange'];
export const ACCOUNTING_KEY='invested_career_accountant_game_v1';
export interface AccountantGame {runs?:PracticeRun[];answers:Partial<Record<AccountingMetric,string>>;checked:AccountingMetric[];conclusion:'none'|'cautious'|'confident';boardMemo:string;presented:boolean;evidence?:string[];followup?:string;}
export const newAccountantGame=():AccountantGame=>({answers:{},checked:[],conclusion:'none',boardMemo:'',presented:false,evidence:[],followup:'none'});
export function expectedAccountingMetric(metric:AccountingMetric):number{
  const {income,balance,cashFlow}=FICTIONAL_STATEMENTS;
  if(metric==='grossMargin')return (income.revenue-income.costOfSales)/income.revenue*100;
  if(metric==='currentRatio')return (balance.cash+balance.receivables+balance.inventory)/balance.currentLiabilities;
  return cashFlow.operating+cashFlow.investing+cashFlow.financing;
}
export function checkAccountingMetric(metric:AccountingMetric,input:string):boolean{
  if(!/^-?(?:\d+\.?\d*|\.\d+)$/.test(input.trim()))return false;
  const value=Number(input.trim());return Number.isFinite(value)&&Math.abs(value-expectedAccountingMetric(metric))<=.01;
}
export function readyForBoard(game:AccountantGame):boolean{return ACCOUNTING_METRICS.every(metric=>game.checked.includes(metric)&&checkAccountingMetric(metric,game.answers[metric]??''))&&game.conclusion!=='none'&&(game.evidence===undefined?game.boardMemo.trim().length>=20:readyBoardEvidence('accountant',game.evidence))&&(game.followup===undefined||readyFollowup('accountant',game.followup));}
export function isAccountantGame(value:unknown):value is AccountantGame{
  if(!value||typeof value!=='object')return false;
  const g=value as AccountantGame;
  if(!validPracticeRuns(g.runs,'accountant'))return false;
  return !!g.answers&&typeof g.answers==='object'&&ACCOUNTING_METRICS.every(metric=>g.answers[metric]===undefined||typeof g.answers[metric]==='string')&&
    Array.isArray(g.checked)&&g.checked.every(metric=>ACCOUNTING_METRICS.includes(metric))&&new Set(g.checked).size===g.checked.length&&
    ['none','cautious','confident'].includes(g.conclusion)&&typeof g.boardMemo==='string'&&typeof g.presented==='boolean'&&(g.evidence===undefined||isEvidenceSelection('accountant',g.evidence))&&(g.followup===undefined||isFollowupChoice('accountant',g.followup))&&(!g.presented||readyForBoard(g));
}
export function readAccountantGame():AccountantGame|null{try{const raw=localStorage.getItem(ACCOUNTING_KEY);const value=raw?JSON.parse(raw):null;return isAccountantGame(value)?value:null;}catch{return null;}}
export class AccountantConflictError extends Error{}
export function saveAccountantGame(next:AccountantGame,expected:AccountantGame|null):void{
  if(!isAccountantGame(next))throw new Error('Invalid accountant game');
  if(JSON.stringify(readAccountantGame())!==JSON.stringify(expected))throw new AccountantConflictError('Changed in another tab');
  localStorage.setItem(ACCOUNTING_KEY,JSON.stringify(next));
}
