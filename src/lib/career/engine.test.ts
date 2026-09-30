// @vitest-environment jsdom
import { describe,it,expect } from 'vitest';
import { advance, canAdvance, CaseConflictError, isResearchCase, newCase, readCase, review, saveCase, skillEvidence, CASE_KEY } from './engine';
describe('local analyst case integrity',()=>{
  it('cannot skip work or mark an empty case complete',()=>{
    const first=newCase(new Date('2026-09-29T12:00:00Z'));
    expect(canAdvance(first)).toBe(false);
    expect(skillEvidence(first)).toEqual([]);
    expect(()=>advance(first)).toThrow();
    expect(isResearchCase({...first,stage:'complete',completedAt:new Date().toISOString()})).toBe(false);
    expect(isResearchCase({...first,stage:'research'})).toBe(false);
    expect(isResearchCase({...first,stage:'practice'})).toBe(false);
    expect(isResearchCase({...first,completedAt:new Date().toISOString()})).toBe(false);
    expect(isResearchCase({...first,provenanceChoice:'unknown'})).toBe(false);
    expect(isResearchCase({...first,allocationDecision:{equity:110,cash:10}})).toBe(false);
    expect(isResearchCase({...first,allocationDecision:{equity:55,cash:15}})).toBe(true);
    expect(isResearchCase({...first,allocationDecision:{equity:55.5,cash:15}})).toBe(false);
    expect(isResearchCase({...first,allocationDecision:{equity:45,cash:20,scenario:'stress'}})).toBe(true);
    expect(isResearchCase({...first,allocationDecision:{equity:45,cash:20,scenario:'unknown'}})).toBe(false);
  });
  it('tracks each stage and discloses assistance',()=>{
    let c=newCase(); c.lessonAnswer='Prices need a dated source and a currency.';expect(canAdvance(c)).toBe(false);c.provenanceChoice='withoutSource';expect(canAdvance(c)).toBe(false);c.provenanceChoice='withSource'; c=advance(c);
    c.practiceAnswer='I would compare risk with an alternative.';expect(canAdvance(c)).toBe(false);c.allocationDecision={equity:55,cash:15}; c=advance(c);
    c.evidence={symbol:'AAPL',price:123,currency:'USD',source:'yahoo_finance',timestamp:'2026-09-28T15:00:00Z',capturedAt:'2026-09-29T15:00:00Z',freshness:'recent'};
    c.thesis='There is a case to investigate further.';c.bearCase='Competition could weaken the outlook.';c.risk='Concentration in one security is a risk.';c=advance(c);
    c.defense='I would need stronger evidence before deciding.';c=advance(c);
    expect(review(c)).toContain('thinThesis');expect(review(c)).toEqual(expect.not.arrayContaining(['equityLimit','liquidityFloor']));c=advance(c);c.improvement='I will verify cash flows before revising the thesis.';c=advance(c);
    // Existing local v1 cases may lack a choice; keep those drafts readable. New practice cannot advance without one.
    expect(isResearchCase({...c,allocationDecision:null})).toBe(true);
    expect(c.allocationDecision).toEqual({equity:55,cash:15});
    expect(c.stage).toBe('complete');expect(c.completedAt).toBeTruthy();expect(c.assistance).toBe(0);expect(skillEvidence(c).map(e=>e.status)).toEqual(['practiced','practiced','practiced']);
  });
  it('reviews fictional constraints independent of market movement',()=>{
    const c=newCase();
    c.allocationDecision={equity:60,cash:10,scenario:'stress'};
    expect(review(c)).toEqual(expect.arrayContaining(['equityLimit','liquidityFloor']));
    c.allocationDecision={equity:40,cash:20,scenario:'stress'};
    expect(review(c)).not.toEqual(expect.arrayContaining(['equityLimit','liquidityFloor']));
  });
  it('blocks stale tabs, including same-millisecond changes',()=>{
    localStorage.removeItem(CASE_KEY);
    const first=newCase(new Date('2026-09-29T12:00:00Z'));
    saveCase(first,null);
    expect(readCase()).toEqual(first);
    const newer={...first,lessonAnswer:'A source and timestamp are required.'};
    saveCase(newer,first);
    const stale={...first,practiceAnswer:'Check a second source before acting.'};
    expect(()=>saveCase(stale,first)).toThrow(CaseConflictError);
    expect(readCase()).toEqual(newer);
    const legacy={...newer,stage:'practice' as const};delete (legacy as Partial<typeof legacy>).allocationDecision;
    localStorage.setItem(CASE_KEY,JSON.stringify(legacy));
    expect(readCase()).toEqual(legacy);
    expect(canAdvance(legacy)).toBe(false);
    localStorage.removeItem(CASE_KEY);
  });
  it('rejects synthetic and unusable market evidence',()=>{
    const c=newCase();c.evidence={symbol:'AAPL',price:0,currency:'USD',source:'yahoo_finance',timestamp:'2026-09-29T12:00:00Z',capturedAt:'2026-09-29T12:00:00Z',freshness:'recent'};
    expect(isResearchCase(c)).toBe(false);
    expect(isResearchCase({...c,evidence:{...c.evidence,price:123,source:'mock'}})).toBe(false);
    expect(isResearchCase({...c,evidence:{...c.evidence,price:123,timestamp:'2030-01-01T00:00:00Z'}})).toBe(false);
  });
});
