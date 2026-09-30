/** Fictional committee decisions, shared by research/reporting/investment desks. */
export type CommitteeRole='investment'|'research'|'reporting';
export const COMMITTEE_CASES={
 investment:[{id:'concentration',facts:'concentration',correct:'review',reason:'concentration'},{id:'liquidity',facts:'liquidity',correct:'defer',reason:'liquidity'},{id:'mandateFit',facts:'mandateFit',correct:'approve',reason:'mandateFit'},{id:'proposedWeight',facts:'proposedWeight',correct:'review',reason:'proposedWeight'}],
 research:[{id:'fundFees',facts:'fundFees',correct:'review',reason:'fundFees'},{id:'fundRisk',facts:'fundRisk',correct:'defer',reason:'fundRisk'},{id:'returnCalculation',facts:'returnCalculation',correct:'approve',reason:'returnCalculation'},{id:'dilutedEarnings',facts:'dilutedEarnings',correct:'review',reason:'dilutedEarnings'}],
 reporting:[{id:'profitCash',facts:'profitCash',correct:'review',reason:'profitCash'},{id:'funding',facts:'funding',correct:'defer',reason:'funding'},{id:'cashBridge',facts:'cashBridge',correct:'approve',reason:'cashBridge'},{id:'accrualBridge',facts:'accrualBridge',correct:'approve',reason:'accrualBridge'}],
} as const;
export type CommitteeDecision='approve'|'review'|'defer';
export interface CommitteeCaseState {decisions:Record<string,CommitteeDecision>;}
export const committeeKey=(role:CommitteeRole)=>`invested_committee_${role}_v1`;
export function isCommitteeState(value:unknown,role:CommitteeRole):value is CommitteeCaseState{
 if(!value||typeof value!=='object')return false;const state=value as CommitteeCaseState;
 return !!state.decisions&&typeof state.decisions==='object'&&!Array.isArray(state.decisions)&&Object.entries(state.decisions).every(([id,decision])=>COMMITTEE_CASES[role].some(row=>row.id===id)&&['approve','review','defer'].includes(decision));
}
export function readCommitteeState(role:CommitteeRole):CommitteeCaseState|null{try{const raw=localStorage.getItem(committeeKey(role));const value=raw?JSON.parse(raw):null;return isCommitteeState(value,role)?value:null;}catch{return null;}}
export class CommitteeConflictError extends Error{}
export function saveCommitteeState(role:CommitteeRole,next:CommitteeCaseState,expected:CommitteeCaseState|null){if(!isCommitteeState(next,role))throw new Error('Invalid committee choice');if(JSON.stringify(readCommitteeState(role))!==JSON.stringify(expected))throw new CommitteeConflictError('Changed in another tab');localStorage.setItem(committeeKey(role),JSON.stringify(next));}

/** These are case inputs, not external quotes or real financial statements. */
export const COMMITTEE_NUMBERS:Record<string,{label:string;value:number;unit:'percent'|'units'|'days'|'shares'|'perShare'}[]>={
 mandateFit:[{label:'issuerWeight',value:30,unit:'percent'},{label:'issuerLimit',value:40,unit:'percent'},{label:'cashNeed',value:20,unit:'units'},{label:'cashAvailable',value:25,unit:'units'}],
 returnCalculation:[{label:'startingPrice',value:50,unit:'units'},{label:'endingPrice',value:56,unit:'units'},{label:'dividend',value:2,unit:'units'},{label:'calculatedReturn',value:16,unit:'percent'}],
 proposedWeight:[{label:'currentWeight',value:35,unit:'percent'},{label:'proposedWeight',value:45,unit:'percent'},{label:'issuerLimit',value:40,unit:'percent'}],
 dilutedEarnings:[{label:'netIncome',value:120,unit:'units'},{label:'basicShares',value:60,unit:'shares'},{label:'dilutedShares',value:80,unit:'shares'},{label:'claimedDilutedEps',value:2,unit:'perShare'}],
 accrualBridge:[{label:'bookedRevenue',value:90,unit:'units'},{label:'cashCollected',value:30,unit:'units'},{label:'openingReceivables',value:0,unit:'units'},{label:'endingReceivables',value:60,unit:'units'}],
 cashBridge:[{label:'operatingCash',value:240,unit:'units'},{label:'investmentCash',value:-300,unit:'units'},{label:'financingCash',value:100,unit:'units'},{label:'cashChange',value:40,unit:'units'}],
 concentration:[{label:'issuerWeight',value:80,unit:'percent'},{label:'issuerLimit',value:40,unit:'percent'},{label:'portfolioGain',value:12,unit:'percent'}],
 liquidity:[{label:'cashNeed',value:30,unit:'units'},{label:'cashAvailable',value:10,unit:'units'},{label:'saleRestriction',value:5,unit:'days'}],
 fundFees:[{label:'fundAGross',value:8,unit:'percent'},{label:'fundAFee',value:2,unit:'percent'},{label:'fundBGross',value:7.5,unit:'percent'},{label:'fundBFee',value:.5,unit:'percent'}],
 fundRisk:[{label:'pastReturn',value:15,unit:'percent'}],
 profitCash:[{label:'profit',value:200,unit:'units'},{label:'operatingCash',value:-50,unit:'units'},{label:'receivablesChange',value:250,unit:'units'}],
 funding:[{label:'operatingCash',value:240,unit:'units'},{label:'investmentCash',value:-300,unit:'units'},{label:'financingCash',value:100,unit:'units'},{label:'cashChange',value:40,unit:'units'}],
};
