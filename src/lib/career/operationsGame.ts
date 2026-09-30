import {archivePracticeRun,validPracticeRuns,type PracticeRun} from './practiceRuns';
/** Invented unified securities/funds reconciliation exercise, not real settlement instructions. */
export type OperationDecision='match'|'hold'|'escalate';
export const OPERATIONS=[
 {id:'S-101',kind:'security',symbol:'NST-F',units:10,custodyUnits:10,cash:1000,bankCash:1000,nav:'notApplicable',reference:'REF-101',duplicate:false,expected:'match',reason:'matched'},
 {id:'S-102',kind:'security',symbol:'HBR-F',units:5,custodyUnits:4,cash:400,bankCash:400,nav:'notApplicable',reference:'REF-102',duplicate:false,expected:'hold',reason:'units'},
 {id:'F-201',kind:'fund',symbol:'EDU-FUND',units:20,custodyUnits:20,cash:1000,bankCash:1000,nav:'pending',reference:'REF-201',duplicate:false,expected:'hold',reason:'nav'},
 {id:'F-202',kind:'fund',symbol:'EDU-FUND',units:10,custodyUnits:10,cash:500,bankCash:490,nav:'confirmed',reference:'REF-202',duplicate:false,expected:'hold',reason:'cash'},
 {id:'S-103',kind:'security',symbol:'NST-F',units:2,custodyUnits:2,cash:200,bankCash:200,nav:'notApplicable',reference:'REF-101',duplicate:true,expected:'escalate',reason:'duplicate'},
 {id:'F-203',kind:'fund',symbol:'EDU-FUND',units:8,custodyUnits:8,cash:400,bankCash:400,nav:'confirmed',reference:'REF-203',duplicate:false,expected:'match',reason:'matched'},
 {id:'S-104',kind:'security',symbol:'HBR-F',units:6,custodyUnits:5,cash:600,bankCash:585,nav:'notApplicable',reference:'REF-104',duplicate:false,expected:'hold',reason:'combined'},
] as const;
export type OperationId=typeof OPERATIONS[number]['id'];
export type OperationEvidence='books'|'position'|'navApproval'|'cashExplanation'|'duplicateReview'|'marketQuote'|'manualEdit'|'combinedApproval';
export const REQUIRED_EVIDENCE:Record<OperationId,OperationEvidence>={'S-101':'books','S-102':'position','F-201':'navApproval','F-202':'cashExplanation','S-103':'duplicateReview','F-203':'books','S-104':'combinedApproval'};
/** Supporting values from invented packets; not edits to the original records. */
export const OPERATION_EVIDENCE_NUMBERS:Partial<Record<OperationId,{label:string;value:number}[]>>={
 'S-102':[{label:'originalCustodyUnits',value:4},{label:'supportedCustodyUnits',value:5}],
 'F-201':[{label:'approvedFundUnits',value:20},{label:'approvedFundCash',value:1000}],
 'F-202':[{label:'grossCash',value:500},{label:'documentedFee',value:10},{label:'netBankCash',value:490}],
 'S-104':[{label:'originalCustodyUnits',value:5},{label:'supportedCustodyUnits',value:6},{label:'grossCash',value:600},{label:'documentedFee',value:15},{label:'netBankCash',value:585}],
 'S-103':[{label:'originalReferenceCount',value:2},{label:'preservedInstructionCount',value:1}],
};
export interface OperationsGame {caseVersion?:2;evidence?:Partial<Record<OperationId,OperationEvidence>>;resolved?:OperationId[];runs?:PracticeRun[];decisions:Partial<Record<OperationId,OperationDecision>>;checked:OperationId[];closed:boolean;}
export const OPERATIONS_KEY='invested_career_operations_game_v1';
export const newOperationsGame=():OperationsGame=>({caseVersion:2,decisions:{},checked:[],closed:false,evidence:{},resolved:[]});
export const correctOperation=(game:OperationsGame,id:OperationId)=>game.checked.includes(id)&&game.decisions[id]===OPERATIONS.find(row=>row.id===id)!.expected;
export const resolvedOperation=(game:OperationsGame,id:OperationId)=>correctOperation(game,id)&&(game.evidence===undefined||game.resolved?.includes(id)&&game.evidence[id]===REQUIRED_EVIDENCE[id]);
/** Missing version means the original six-record exercise, including closed legacy runs. */
export const operationCases=(game:OperationsGame)=>game.caseVersion===2?OPERATIONS:OPERATIONS.slice(0,6);
export const readyOperations=(game:OperationsGame)=>operationCases(game).every(row=>resolvedOperation(game,row.id));
export function isOperationsGame(value:unknown):value is OperationsGame{
 if(!value||typeof value!=='object')return false;const game=value as OperationsGame;
 if(game.caseVersion!==undefined&&game.caseVersion!==2)return false;
 if(game.caseVersion===2&&(game.evidence===undefined||game.resolved===undefined))return false;
 if(!validPracticeRuns(game.runs,'operations'))return false;
 if(!Array.isArray(game.checked)||!game.decisions||typeof game.decisions!=='object')return false;
 if(game.evidence!==undefined&&(!game.evidence||typeof game.evidence!=='object'||Array.isArray(game.evidence)||!Object.entries(game.evidence).every(([id,value])=>operationCases(game).some(row=>row.id===id)&&['books','position','navApproval','cashExplanation','duplicateReview','marketQuote','manualEdit','combinedApproval'].includes(value))))return false;
 if(game.resolved!==undefined&&(!Array.isArray(game.resolved)||new Set(game.resolved).size!==game.resolved.length||!game.resolved.every(id=>operationCases(game).some(row=>row.id===id)&&correctOperation(game,id)&&game.evidence?.[id]===REQUIRED_EVIDENCE[id])))return false;
 return !!game.decisions&&typeof game.decisions==='object'&&!Array.isArray(game.decisions)&&Object.entries(game.decisions).every(([id,decision])=>operationCases(game).some(row=>row.id===id)&&['match','hold','escalate'].includes(decision))&&Array.isArray(game.checked)&&game.checked.every(id=>operationCases(game).some(row=>row.id===id))&&new Set(game.checked).size===game.checked.length&&typeof game.closed==='boolean'&&(!game.closed||readyOperations(game));
}
export function decideOperation(game:OperationsGame,id:OperationId,decision:OperationDecision):OperationsGame{
 if(!isOperationsGame(game)||game.closed||!operationCases(game).some(row=>row.id===id)||!['match','hold','escalate'].includes(decision))throw new Error('Invalid operation');
 return {...game,resolved:game.resolved?.filter(value=>value!==id),evidence:game.evidence===undefined?undefined:Object.fromEntries(Object.entries(game.evidence).filter(([key])=>key!==id)),decisions:{...game.decisions,[id]:decision},checked:game.checked.includes(id)?game.checked:[...game.checked,id]};
}
export function chooseOperationEvidence(game:OperationsGame,id:OperationId,evidence:OperationEvidence):OperationsGame{
 if(!isOperationsGame(game)||game.closed||game.evidence===undefined||!correctOperation(game,id)||!['books','position','navApproval','cashExplanation','duplicateReview','marketQuote','manualEdit','combinedApproval'].includes(evidence))throw new Error('Review before evidence');
 return {...game,evidence:{...game.evidence,[id]:evidence},resolved:(game.resolved??[]).filter(value=>value!==id)};
}
export function resolveOperation(game:OperationsGame,id:OperationId):OperationsGame{
 if(!isOperationsGame(game)||game.closed||!correctOperation(game,id)||game.evidence?.[id]!==REQUIRED_EVIDENCE[id])throw new Error('Supporting evidence required');
 return {...game,resolved:[...new Set([...(game.resolved??[]),id])]};
}
export function closeOperations(game:OperationsGame):OperationsGame{if(game.closed||!readyOperations(game))throw new Error('Reconcile every exception');return {...game,closed:true};}
export function restartOperations(game:OperationsGame):OperationsGame{if(!isOperationsGame(game)||!game.closed)throw new Error('Close before archiving');return {...newOperationsGame(),runs:archivePracticeRun(game.runs,'operations',{resolved:operationCases(game).length})};}
export function readOperationsGame():OperationsGame|null{try{const raw=localStorage.getItem(OPERATIONS_KEY);const value=raw?JSON.parse(raw):null;return isOperationsGame(value)?value:null;}catch{return null;}}
export class OperationsConflictError extends Error{}
export function saveOperationsGame(next:OperationsGame,expected:OperationsGame|null){if(!isOperationsGame(next))throw new Error('Invalid game');if(JSON.stringify(readOperationsGame())!==JSON.stringify(expected))throw new OperationsConflictError('Changed in another tab');localStorage.setItem(OPERATIONS_KEY,JSON.stringify(next));}
