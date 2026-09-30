/** Device-local, self-reported practice history. Never a verified credential. */
export type PracticeRole='portfolio'|'analyst'|'accountant'|'operations';
export interface PracticeRun {id:string;finishedAt:string;role:PracticeRole;metrics:Record<string,number>;}
export function validPracticeRuns(value:unknown,role:PracticeRole):boolean{
 if(value===undefined)return true;
 if(!Array.isArray(value)||value.length>20)return false;
 return value.every(run=>run&&typeof run==='object'&&typeof run.id==='string'&&run.id.length>0&&typeof run.finishedAt==='string'&&Number.isFinite(Date.parse(run.finishedAt))&&run.role===role&&run.metrics&&typeof run.metrics==='object'&&!Array.isArray(run.metrics)&&Object.keys(run.metrics).length<=8&&Object.entries(run.metrics).every(([key,v])=>['netReturn','maxDrawdown','retained','checked','evidence','resolved'].includes(key)&&typeof v==='number'&&Number.isFinite(v)))&&new Set(value.map(run=>run.id)).size===value.length;
}
export function archivePracticeRun(runs:PracticeRun[]|undefined,role:PracticeRole,metrics:Record<string,number>,now=new Date()):PracticeRun[]{
 const next=[...(runs??[]),{id:crypto.randomUUID(),finishedAt:now.toISOString(),role,metrics}].slice(-20);
 if(!validPracticeRuns(next,role))throw new Error('Invalid practice history');return next;
}
