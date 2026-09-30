// @vitest-environment jsdom
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {COMMITTEE_CASES,COMMITTEE_NUMBERS,CommitteeConflictError,committeeKey,isCommitteeState,readCommitteeState,saveCommitteeState} from './committeeCases';
beforeEach(()=>localStorage.clear());
describe('shared committee scenarios',()=>{
 it('keeps four role-specific cases per shared desk',()=>{expect(COMMITTEE_CASES.research.map(row=>row.id)).toEqual(['fundFees','fundRisk','returnCalculation','dilutedEarnings']);expect(COMMITTEE_CASES.reporting).toHaveLength(4);expect(COMMITTEE_CASES.investment).toHaveLength(4);});
 it('allows narrow approval when the supplied case evidence supports the exact claim',()=>{for(const role of ['investment','research','reporting'] as const)expect(COMMITTEE_CASES[role].filter(row=>row.correct==='approve')).toHaveLength(role==='reporting'?2:1);const points=COMMITTEE_NUMBERS.returnCalculation.map(point=>point.value);expect((points[1]-points[0]+points[2])/points[0]*100).toBe(points[3]);});
 it('saves independently by role and preserves state on stale writes',()=>{const state={decisions:{fundFees:'review' as const}};saveCommitteeState('research',state,null);expect(readCommitteeState('research')).toEqual(state);expect(readCommitteeState('reporting')).toBeNull();expect(()=>saveCommitteeState('research',{decisions:{}},null)).toThrow(CommitteeConflictError);expect(readCommitteeState('research')).toEqual(state);});
 it('keeps numerical case cards tied to the documented arithmetic',()=>{const sum=(id:string)=>COMMITTEE_NUMBERS[id].map(point=>point.value);expect(sum('fundFees')).toEqual([8,2,7.5,.5]);expect(sum('funding').slice(0,3).reduce((a,b)=>a+b,0)).toBe(40);expect(sum('liquidity')[0]-sum('liquidity')[1]).toBe(20);});
 it('lets a learner resume from the newer saved snapshot after a conflict',()=>{const original={decisions:{fundFees:'review' as const}};const newer={decisions:{fundFees:'defer' as const}};saveCommitteeState('research',original,null);saveCommitteeState('research',newer,original);expect(()=>saveCommitteeState('research',original,original)).toThrow(CommitteeConflictError);const loaded=readCommitteeState('research');saveCommitteeState('research',original,loaded);expect(readCommitteeState('research')).toEqual(original);});
 it('reports blocked writes without claiming a saved decision',()=>{const spy=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('Quota');});try{expect(()=>saveCommitteeState('research',{decisions:{fundFees:'review'}},null)).toThrow('Quota');expect(readCommitteeState('research')).toBeNull();}finally{spy.mockRestore();}});
 it('rejects unknown cases, actions and corrupt storage',()=>{expect(isCommitteeState({decisions:{fundFees:'approve'}},'reporting')).toBe(false);expect(isCommitteeState({decisions:{fundFees:'invented'}},'research')).toBe(false);localStorage.setItem(committeeKey('research'),'oops');expect(readCommitteeState('research')).toBeNull();});
});

it('new scenario numbers support only the exact bounded claims',()=>{
 const values=(id:string)=>Object.fromEntries(COMMITTEE_NUMBERS[id].map(p=>[p.label,p.value]));
 const weight=values('proposedWeight');expect(weight.currentWeight).toBeLessThan(weight.issuerLimit);expect(weight.proposedWeight-weight.issuerLimit).toBe(5);
 const earnings=values('dilutedEarnings');expect(earnings.netIncome/earnings.basicShares).toBe(earnings.claimedDilutedEps);expect(earnings.netIncome/earnings.dilutedShares).toBe(1.5);
 const accrual=values('accrualBridge');expect(accrual.cashCollected+accrual.endingReceivables-accrual.openingReceivables).toBe(accrual.bookedRevenue);expect(accrual.cashCollected).not.toBe(accrual.bookedRevenue);
});
it('keeps earlier saved decisions valid as new shared cases are added',()=>{
 const earlier={decisions:{fundFees:'review' as const,fundRisk:'defer' as const,returnCalculation:'approve' as const}};
 localStorage.setItem(committeeKey('research'),JSON.stringify(earlier));const saved=readCommitteeState('research');expect(saved).toEqual(earlier);
 saveCommitteeState('research',{decisions:{...saved!.decisions,dilutedEarnings:'review'}},saved);expect(Object.keys(readCommitteeState('research')!.decisions)).toHaveLength(4);
});
