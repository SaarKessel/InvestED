// @vitest-environment jsdom
import {describe,it,expect} from 'vitest';
import {ACCOUNTING_KEY,ACCOUNTING_METRICS,AccountantConflictError,checkAccountingMetric,expectedAccountingMetric,isAccountantGame,newAccountantGame,readAccountantGame,readyForBoard,saveAccountantGame} from './accountantGame';
describe('fictional accountant board game',()=>{
  it('computes gross margin, current ratio and cash movement from the invented statements',()=>{
    expect(ACCOUNTING_METRICS.map(expectedAccountingMetric)).toEqual([35,1.5,40]);
    expect(checkAccountingMetric('cashChange','-40')).toBe(false);
    expect(checkAccountingMetric('currentRatio','1.5')).toBe(true);
    expect(checkAccountingMetric('grossMargin','35%')).toBe(false);
  });
  it('requires correct calculations, a conclusion and memo before a local presentation',()=>{
    const draft=newAccountantGame();expect(readyForBoard(draft)).toBe(false);
    const reviewed={answers:{grossMargin:'35',currentRatio:'1.5',cashChange:'40'},checked:[...ACCOUNTING_METRICS],conclusion:'cautious' as const,boardMemo:'The invented statements show a current ratio above one but investment cash outflow merits review.',presented:false};
    expect(readyForBoard(reviewed)).toBe(true);expect(isAccountantGame({...reviewed,presented:true})).toBe(true);
    expect(isAccountantGame({...reviewed,answers:{...reviewed.answers,cashChange:'-40'},presented:true})).toBe(false);
  });
  it('saves local drafts and refuses stale tab changes',()=>{
    localStorage.removeItem(ACCOUNTING_KEY);const first=newAccountantGame();saveAccountantGame(first,null);
    const next={...first,answers:{cashChange:'40'}};saveAccountantGame(next,first);
    expect(()=>saveAccountantGame({...first,boardMemo:'stale'},first)).toThrow(AccountantConflictError);
    expect(readAccountantGame()).toEqual(next);localStorage.removeItem(ACCOUNTING_KEY);
  });
});
