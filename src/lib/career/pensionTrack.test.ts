// @vitest-environment jsdom
import {it,expect} from 'vitest';
import {advance, canAdvance, inventedEvidenceSnapshot, isEvidence, isResearchCase, newCase, readCase, saveCase, archiveCompletedCase, readCaseArchive} from './engine';
import {getTrack} from './tracks';

it('the pension track validates its fixed invented teaching evidence and rejects live or tampered snapshots',()=>{
  expect(getTrack('pension-analyst').allocationDesk).toBe(false);
  const invented=inventedEvidenceSnapshot('pension-analyst',new Date('2026-09-30T10:00:00Z'))!;
  expect(invented.source).toBe('invented_teaching_input');
  expect(isEvidence(invented,'pension-analyst')).toBe(true);
  expect(isEvidence(invented,'credit-analyst')).toBe(false);
  expect(isEvidence(invented,'investment-analyst')).toBe(false);
  expect(isEvidence({symbol:'AAPL',price:123,currency:'USD',source:'yahoo_finance',timestamp:'2026-09-29T11:00:00.000Z',capturedAt:'2026-09-29T11:01:00.000Z',freshness:'current'},'pension-analyst')).toBe(false);
  expect(isEvidence({...invented,price:9.9},'pension-analyst')).toBe(false);
});

it('a pension case runs the same 7-stage engine to completion and stays separated from other tracks',()=>{
  localStorage.clear();
  let record=newCase(new Date('2026-09-30T09:00:00Z'),'pension-analyst');
  expect(canAdvance({...record,stage:'practice' as const,lessonAnswer:'Verifiable policy data is required.',practiceAnswer:'Judge contributions over decades.'})).toBe(true);
  record={...record,provenanceChoice:'withSource' as const,lessonAnswer:'A pension decision needs verifiable policy data.'};
  record=advance(record,new Date('2026-09-30T09:10:00Z'));
  record=advance({...record,practiceAnswer:'Contributions are judged against the retirement need over decades.'},new Date('2026-09-30T09:20:00Z'));
  record={...record,evidence:inventedEvidenceSnapshot('pension-analyst',new Date('2026-09-30T09:30:00Z')),thesis:'The invented policy fits the saver horizon and covers the projected need.',bearCase:'Fees and inflation could erode the invented policy real value below the need.',risk:'Invented teaching input only; longevity and rate uncertainty are the main risks.'};
  record=advance(record,new Date('2026-09-30T09:40:00Z'));
  record=advance({...record,defense:'Verified fee tables and projection assumptions would change the recommendation.'},new Date('2026-09-30T09:50:00Z'));
  record=advance(record,new Date('2026-09-30T10:00:00Z'));
  record=advance({...record,improvement:'Compare payout options before the next recommendation.'},new Date('2026-09-30T10:10:00Z'));
  expect(record.stage).toBe('complete');
  expect(isResearchCase(record)).toBe(true);
  saveCase(record,null,'pension-analyst');
  expect(readCase('pension-analyst')?.id).toBe(record.id);
  expect(readCase('credit-analyst')).toBeNull();
  expect(readCase('investment-analyst')).toBeNull();
  const archived=archiveCompletedCase(record,'pension-analyst');
  expect(archived.map(c=>c.id)).toEqual([record.id]);
  expect(readCaseArchive('credit-analyst')).toEqual([]);
});
