// @vitest-environment jsdom
import {describe,it,expect} from 'vitest';
import {ANALYST_KEY,ANALYST_METRICS,AnalystConflictError,checkMetric,expectedMetric,isAnalystGame,newAnalystGame,readyToSubmit,readAnalystGame,saveAnalystGame} from './analystGame';
describe('fictional analyst report game',()=>{
  it('calculates exact revenue growth, margin and dividend-inclusive return',()=>{
    expect(ANALYST_METRICS.map(expectedMetric)).toEqual([25,12,16]);
    expect(checkMetric('shareholderReturn','16')).toBe(true);
    expect(checkMetric('shareholderReturn','12')).toBe(false);
    expect(checkMetric('operatingMargin','12%')).toBe(false);
    expect(checkMetric('revenueGrowth','25trailing')).toBe(false);
  });
  it('requires checked correct work and a board memo before local submission',()=>{
    const start=newAnalystGame();expect(readyToSubmit(start)).toBe(false);
    const candidate={answers:{revenueGrowth:'25',operatingMargin:'12',shareholderReturn:'16'},checked:[...ANALYST_METRICS],boardChoice:'review' as const,memo:'The fictional report shows growth but further risk review is needed before a decision.',submitted:false};
    expect(readyToSubmit({...candidate,boardChoice:'none'})).toBe(false);
    expect(readyToSubmit(candidate)).toBe(true);
    expect(isAnalystGame({...candidate,submitted:true})).toBe(true);
    expect(isAnalystGame({...candidate,answers:{...candidate.answers,shareholderReturn:'12'},submitted:true})).toBe(false);
  });
  it('preserves local drafts and detects stale tabs',()=>{
    localStorage.removeItem(ANALYST_KEY);const first=newAnalystGame();saveAnalystGame(first,null);
    const edited={...first,answers:{revenueGrowth:'25'}};saveAnalystGame(edited,first);
    expect(()=>saveAnalystGame({...first,memo:'stale'},first)).toThrow(AnalystConflictError);
    expect(readAnalystGame()).toEqual(edited);localStorage.removeItem(ANALYST_KEY);
  });
});
describe('submitted-record contract across local generations',()=>{
  const answers={revenueGrowth:'25',operatingMargin:'12',shareholderReturn:'16'};
  it('keeps first-generation submitted records readable under their original 40-character memo rule',()=>{
    // The first local generation had no board choice and no evidence panel; submission required a 40-character memo.
    const firstGen={answers,checked:[...ANALYST_METRICS],memo:'1234567890123456789012345678901234567890',submitted:true};
    expect(isAnalystGame(firstGen)).toBe(true);
    expect(isAnalystGame({...firstGen,memo:'12345678901234567890'})).toBe(false);
    expect(isAnalystGame({...firstGen,submitted:false})).toBe(true);
  });
  it('keeps second-generation submitted records on the 20-character memo plus board choice rule',()=>{
    const secondGen={answers,checked:[...ANALYST_METRICS],boardChoice:'review' as const,memo:'12345678901234567890',submitted:true};
    expect(isAnalystGame(secondGen)).toBe(true);
    expect(isAnalystGame({...secondGen,memo:'1234567890123456789'})).toBe(false);
    // A first-generation record gains the current rules once a board choice exists.
    expect(isAnalystGame({answers,checked:[...ANALYST_METRICS],boardChoice:'review' as const,memo:'1234567890123456789012345678901234567890',submitted:true})).toBe(true);
  });
  it('round-trips a first-generation submitted record through local storage',()=>{
    localStorage.removeItem(ANALYST_KEY);
    const firstGen={answers,checked:[...ANALYST_METRICS],memo:'1234567890123456789012345678901234567890',submitted:true};
    saveAnalystGame(firstGen,null);
    expect(readAnalystGame()).toEqual(firstGen);
    localStorage.removeItem(ANALYST_KEY);
  });
});
