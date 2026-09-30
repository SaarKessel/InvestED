import { isAllocationScenario, simulatedAllocation, type AllocationScenario } from './allocation';
import { getTrack, isTrackId } from './tracks';
import { checkProvenanceChoice, type ProvenanceChoice } from './lessonCheck';
/** Career Lab's first local-only case. Client records are educational drafts, not verified credentials. */
export type AssistanceLevel = 0 | 1 | 2 | 3 | 4;
export type CaseStage = 'lesson' | 'practice' | 'research' | 'defense' | 'review' | 'improve' | 'complete';
export interface EvidenceSnapshot {
  symbol: string;
  price: number;
  currency: string;
  source: 'alpha_vantage' | 'yahoo_finance' | 'invented_teaching_input';
  timestamp: string;
  freshness: 'current' | 'recent' | 'stale';
  capturedAt: string;
}
export interface ResearchCase {
  id: string;
  /** Track from the Career Lab registry. Undefined means the original Investment Analyst case, so earlier local saves stay readable. */
  track?: string;
  stage: CaseStage;
  startedAt: string;
  updatedAt: string;
  assistance: AssistanceLevel;
  lessonAnswer: string;
  provenanceChoice?: ProvenanceChoice;
  practiceAnswer: string;
  allocationDecision?: {equity:number; cash:number; scenario?:AllocationScenario} | null;
  evidence: EvidenceSnapshot | null;
  thesis: string;
  bearCase: string;
  risk: string;
  defense: string;
  improvement: string;
  completedAt: string | null;
}
export const CASE_SYMBOL = 'AAPL';
export const CASE_KEY = 'invested_career_analyst_v1';
export const STAGES: CaseStage[] = ['lesson','practice','research','defense','review','improve','complete'];
export function newCase(now = new Date(), trackId?: string): ResearchCase {
  return { id: crypto.randomUUID(), track:getTrack(trackId).id, stage:'lesson', startedAt:now.toISOString(), updatedAt:now.toISOString(), assistance:0, lessonAnswer:'', provenanceChoice:'noChoice', practiceAnswer:'', allocationDecision:null, evidence:null, thesis:'', bearCase:'', risk:'', defense:'', improvement:'', completedAt:null };
}
const nonBlank = (value: string) => value.trim().length >= 20;
export function validAllocationDecision(input: unknown): input is {equity:number;cash:number;scenario?:AllocationScenario} {
  if (!input || typeof input!=='object') return false;
  const value=input as {equity:number;cash:number;scenario?:unknown};
  if (value.scenario!==undefined && !isAllocationScenario(value.scenario)) return false;
  try { simulatedAllocation(value.equity,value.cash,value.scenario as AllocationScenario|undefined); return true; } catch { return false; }
}

export function canAdvance(record: ResearchCase): boolean {
  switch(record.stage) {
    case 'lesson': return nonBlank(record.lessonAnswer) && checkProvenanceChoice(record.provenanceChoice??'noChoice')==='correct';
    case 'practice': return nonBlank(record.practiceAnswer) && (!getTrack(record.track).allocationDesk || validAllocationDecision(record.allocationDecision));
    case 'research': return isEvidence(record.evidence, record.track) && nonBlank(record.thesis) && nonBlank(record.bearCase) && nonBlank(record.risk);
    case 'defense': return nonBlank(record.defense);
    case 'review': return true;
    case 'improve': return nonBlank(record.improvement);
    case 'complete': return false;
  }
}
export function advance(record: ResearchCase, now = new Date()): ResearchCase {
  if (!canAdvance(record)) throw new Error('Required work is incomplete');
  const next=STAGES[STAGES.indexOf(record.stage)+1];
  return { ...record, stage:next, updatedAt:now.toISOString(), completedAt: next==='complete' ? now.toISOString() : null };
}
/** Never score returns or certify analysis quality from a price move. */
export function review(record: ResearchCase): string[] {
  const findings:string[]=[];
  if (validAllocationDecision(record.allocationDecision)) {
    const allocation=simulatedAllocation(record.allocationDecision.equity,record.allocationDecision.cash,record.allocationDecision.scenario);
    if (!allocation.equityLimitMet) findings.push('equityLimit');
    if (!allocation.liquidityFloorMet) findings.push('liquidityFloor');
  }
  if (!record.evidence) findings.push('missingEvidence');
  else if (record.evidence.freshness==='stale') findings.push('staleEvidence');
  if (record.thesis.trim().length < 80) findings.push('thinThesis');
  if (record.bearCase.trim().length < 50) findings.push('thinBearCase');
  if (record.risk.trim().length < 50) findings.push('thinRisk');
  if (record.defense.trim().length < 50) findings.push('thinDefense');
  return findings.length ? findings : ['manualReview'];
}
export interface SkillEvidence {
  skill: 'researchProcess' | 'riskReasoning' | 'decisionDefense';
  basis: string;
  status: 'practiced';
}
/** These are self-reported practice markers, never verified proficiency. */
export function skillEvidence(record: ResearchCase): SkillEvidence[] {
  if (record.stage!=='complete' || !isResearchCase(record)) return [];
  return [
    {skill:'researchProcess',basis:record.evidence!.source+' '+record.evidence!.timestamp,status:'practiced'},
    {skill:'riskReasoning',basis:record.risk,status:'practiced'},
    {skill:'decisionDefense',basis:record.defense,status:'practiced'},
  ];
}
export function isResearchCase(input: unknown): input is ResearchCase {
  if (!input || typeof input !== 'object') return false;
  const r=input as ResearchCase;
  return typeof r.id==='string' && r.id.length>0 && STAGES.includes(r.stage) && (r.track===undefined || isTrackId(r.track)) &&
    Number.isFinite(Date.parse(r.startedAt)) && Number.isFinite(Date.parse(r.updatedAt)) &&
    [0,1,2,3,4].includes(r.assistance) &&
    ['lessonAnswer','practiceAnswer','thesis','bearCase','risk','defense','improvement'].every(k=>typeof r[k as keyof ResearchCase]==='string') &&
    (r.completedAt===null || Number.isFinite(Date.parse(r.completedAt))) &&
    (r.stage==='complete' || r.completedAt===null) &&
    (r.stage!=='complete' || (r.completedAt!==null && ['lessonAnswer','practiceAnswer','thesis','bearCase','risk','defense','improvement'].every(k=>nonBlank(r[k as keyof ResearchCase] as string)) && isEvidence(r.evidence, r.track))) &&
    (r.evidence===null || isEvidence(r.evidence, r.track)) &&
    (r.provenanceChoice===undefined || ['withSource','withoutSource','noChoice'].includes(r.provenanceChoice)) &&
    (r.allocationDecision===undefined || r.allocationDecision===null || validAllocationDecision(r.allocationDecision)) &&
    (r.stage==='lesson' || nonBlank(r.lessonAnswer)) &&
    (r.stage==='lesson' || r.stage==='practice' || nonBlank(r.practiceAnswer)) &&
    (['lesson','practice','research'].includes(r.stage) || (isEvidence(r.evidence, r.track) && nonBlank(r.thesis) && nonBlank(r.bearCase) && nonBlank(r.risk))) &&
    (['lesson','practice','research','defense'].includes(r.stage) || nonBlank(r.defense)) &&
    (r.stage!=='complete' || nonBlank(r.improvement));
}
export function isEvidence(value: unknown, trackId?: string): value is EvidenceSnapshot {
  if (!value || typeof value!=='object') return false;
  const e=value as EvidenceSnapshot;
  const track=getTrack(trackId);
  const shared = Number.isFinite(e.price) && e.price>0 &&
    typeof e.currency==='string' && /^[A-Z]{3}$/.test(e.currency) &&
    ['current','recent','stale'].includes(e.freshness) &&
    Number.isFinite(Date.parse(e.timestamp)) && Number.isFinite(Date.parse(e.capturedAt)) &&
    Date.parse(e.timestamp)<=Date.parse(e.capturedAt) + 5*60*1000;
  if (track.inventedEvidence) {
    return shared && e.source==='invented_teaching_input' &&
      e.symbol===track.inventedEvidence.symbol && e.price===track.inventedEvidence.price && e.currency===track.inventedEvidence.currency;
  }
  return shared && e.symbol===track.evidenceSymbol && (e.source==='alpha_vantage'||e.source==='yahoo_finance');
}
/** Fixed invented teaching snapshot for tracks without a live symbol. Not market data; the UI labels it as invented. */
export function inventedEvidenceSnapshot(trackId?: string, now = new Date()): EvidenceSnapshot | null {
  const invented=getTrack(trackId).inventedEvidence;
  if (!invented) return null;
  return { symbol:invented.symbol, price:invented.price, currency:invented.currency,
    source:'invented_teaching_input', timestamp:now.toISOString(), freshness:'current', capturedAt:now.toISOString() };
}
export function readCase(trackId?: string): ResearchCase | null {
  try { const raw=localStorage.getItem(getTrack(trackId).caseKey); const value=raw ? JSON.parse(raw) : null; return isResearchCase(value) ? value : null; }
  catch { return null; }
}
export class CaseConflictError extends Error {}
/** Compare the entire previous record, not just timestamp: two tabs may write in the same millisecond. */
export function saveCase(record: ResearchCase, expected: ResearchCase | null, trackId?: string): void {
  if (!isResearchCase(record)) throw new Error('Invalid case record');
  const actual=readCase(trackId ?? record.track);
  if (JSON.stringify(actual)!==JSON.stringify(expected)) throw new CaseConflictError('Case changed in another tab');
  localStorage.setItem(getTrack(trackId ?? record.track).caseKey, JSON.stringify(record));
}
/** Bounded device-local archive of completed cases. Self-reported practice records, never verified credentials or employment. */
export const CASE_ARCHIVE_KEY = 'invested_career_analyst_archive_v1';
export const CASE_ARCHIVE_LIMIT = 10;
const isCompleteCase = (value: unknown): value is ResearchCase => isResearchCase(value) && value.stage === 'complete';
export function readCaseArchive(trackId?: string): ResearchCase[] {
  try {
    const raw=localStorage.getItem(getTrack(trackId).archiveKey);
    const value=raw ? JSON.parse(raw) : [];
    if (!Array.isArray(value) || value.length > CASE_ARCHIVE_LIMIT) return [];
    if (!value.every(isCompleteCase)) return [];
    if (new Set(value.map(item => item.id)).size !== value.length) return [];
    return value;
  } catch { return []; }
}
/** Idempotent by case id: archiving the same completed case again replaces its copy, never duplicates it. */
export function archiveCompletedCase(record: ResearchCase, trackId?: string): ResearchCase[] {
  if (!isCompleteCase(record)) throw new Error('Only a completed case can be archived');
  const track=trackId ?? record.track;
  const next=[...readCaseArchive(track).filter(item => item.id !== record.id), record].slice(-CASE_ARCHIVE_LIMIT);
  localStorage.setItem(getTrack(track).archiveKey, JSON.stringify(next));
  return next;
}
