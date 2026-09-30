// @vitest-environment jsdom
import {it,expect} from 'vitest';
import {advance, canAdvance, inventedEvidenceSnapshot, isEvidence, isResearchCase, newCase, readCase, saveCase, archiveCompletedCase, readCaseArchive} from './engine';
import {getTrack} from './tracks';

const liveSnapshot={symbol:'AAPL',price:123,currency:'USD',source:'yahoo_finance' as const,timestamp:'2026-09-29T11:00:00.000Z',capturedAt:'2026-09-29T11:01:00.000Z',freshness:'current' as const};

it('the credit track validates its fixed invented teaching evidence and rejects live market snapshots',()=>{
  const invented=inventedEvidenceSnapshot('credit-analyst',new Date('2026-09-30T10:00:00Z'))!;
  expect(invented.source).toBe('invented_teaching_input');
  expect(isEvidence(invented,'credit-analyst')).toBe(true);
  // The same invented snapshot is not valid analyst evidence, and a live AAPL quote is not valid credit evidence.
  expect(isEvidence(invented,'investment-analyst')).toBe(false);
  expect(isEvidence(liveSnapshot,'credit-analyst')).toBe(false);
  expect(isEvidence(liveSnapshot,'investment-analyst')).toBe(true);
  // Tampered invented values are rejected.
  expect(isEvidence({...invented,price:1.1},'credit-analyst')).toBe(false);
});

it('the credit track has no allocation desk: practice advances on the written answer alone',()=>{
  expect(getTrack('credit-analyst').allocationDesk).toBe(false);
  const record={...newCase(new Date(),'credit-analyst'),stage:'practice' as const,lessonAnswer:'Verified borrower data is required.'};
  expect(canAdvance(record)).toBe(false);
  expect(canAdvance({...record,practiceAnswer:'Compare income with obligations over time.'})).toBe(true);
  // The analyst track still requires a valid allocation decision.
  const analyst={...newCase(new Date()),stage:'practice' as const,lessonAnswer:'x',practiceAnswer:'y'};
  expect(canAdvance(analyst)).toBe(false);
});

it('a credit case runs the same 7-stage engine to completion with invented evidence and stays readable',()=>{
  localStorage.clear();
  let record=newCase(new Date('2026-09-30T09:00:00Z'),'credit-analyst');
  record={...record,provenanceChoice:'withSource' as const,lessonAnswer:'A lending decision needs verifiable borrower data.'};
  record=advance(record,new Date('2026-09-30T09:10:00Z'));
  record=advance({...record,practiceAnswer:'Repayment ability is judged over time, not one month.'},new Date('2026-09-30T09:20:00Z'));
  record={...record,evidence:inventedEvidenceSnapshot('credit-analyst',new Date('2026-09-30T09:30:00Z')),thesis:'The invented borrower covers interest from steady operating cash flow.',bearCase:'A downturn could cut the invented borrower revenue below debt service.',risk:'Invented teaching input only; concentration in one sector is the main risk.'};
  record=advance(record,new Date('2026-09-30T09:40:00Z'));
  record=advance({...record,defense:'Verified bank statements would change the decision.'},new Date('2026-09-30T09:50:00Z'));
  record=advance(record,new Date('2026-09-30T10:00:00Z'));
  record=advance({...record,improvement:'Check collateral quality before the next decision.'},new Date('2026-09-30T10:10:00Z'));
  expect(record.stage).toBe('complete');
  expect(isResearchCase(record)).toBe(true);
  saveCase(record,null,'credit-analyst');
  expect(readCase('credit-analyst')?.id).toBe(record.id);
  // Storage stays separate from the analyst track.
  expect(readCase('investment-analyst')).toBeNull();
  const archived=archiveCompletedCase(record,'credit-analyst');
  expect(archived.map(c=>c.id)).toEqual([record.id]);
  expect(readCaseArchive('investment-analyst')).toEqual([]);
});
