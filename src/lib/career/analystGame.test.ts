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
