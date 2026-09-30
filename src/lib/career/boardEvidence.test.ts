import {describe,it,expect} from 'vitest';
import {isEvidenceSelection,readyBoardEvidence} from './boardEvidence';
import {ANALYST_METRICS,newAnalystGame,isAnalystGame,readyToSubmit} from './analystGame';
import {ACCOUNTING_METRICS,newAccountantGame,readyForBoard,isAccountantGame} from './accountantGame';
describe('fictional low-typing board challenge',()=>{
  it('requires supported findings and limits, not a guaranteed outcome',()=>{
    expect(readyBoardEvidence('analyst',['growth','dividend'])).toBe(false);
    expect(readyBoardEvidence('analyst',['dividend','limits'])).toBe(true);
    expect(readyBoardEvidence('analyst',['growth','limits','guarantee'])).toBe(false);
    expect(readyBoardEvidence('accountant',['funding','limits'])).toBe(true);
    expect(readyBoardEvidence('accountant',['liquidity','limits','solvent'])).toBe(false);
    expect(isEvidenceSelection('analyst',['limits','limits'])).toBe(false);
    expect(isEvidenceSelection('accountant',['dividend'])).toBe(false);
  });
  it('accepts a zero-typing analyst brief only after calculations and a decision',()=>{
    const g={...newAnalystGame(),answers:{revenueGrowth:'25',operatingMargin:'12',shareholderReturn:'16'},checked:[...ANALYST_METRICS],boardChoice:'review' as const,evidence:['dividend','limits']};
    expect(readyToSubmit(g)).toBe(true);expect(isAnalystGame({...g,submitted:true})).toBe(true);
    expect(readyToSubmit({...g,answers:{...g.answers,shareholderReturn:'12'}})).toBe(false);
    expect(readyToSubmit({...g,evidence:[]})).toBe(false);
  });
  it('accepts a zero-typing accounting brief but rejects false solvency claims',()=>{
    const g={...newAccountantGame(),answers:{grossMargin:'35',currentRatio:'1.5',cashChange:'40'},checked:[...ACCOUNTING_METRICS],conclusion:'cautious' as const,evidence:['funding','limits']};
    expect(readyForBoard(g)).toBe(true);expect(isAccountantGame({...g,presented:true})).toBe(true);
    expect(isAccountantGame({...g,presented:true,evidence:['solvent','limits']})).toBe(false);
  });
  it('keeps the existing twenty-character analyst memo path consistent with its save validator',()=>{
    const g={answers:{revenueGrowth:'25',operatingMargin:'12',shareholderReturn:'16'},checked:[...ANALYST_METRICS],boardChoice:'review' as const,memo:'12345678901234567890',submitted:true};
    expect(isAnalystGame(g)).toBe(true);expect(isAnalystGame({...g,boardChoice:'none'})).toBe(false);
  });
});
