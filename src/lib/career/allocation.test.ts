import {describe,it,expect} from 'vitest';
import {simulatedAllocation} from './allocation';
describe('fictional allocation task',()=>{
  it('keeps the table at 100% and checks the fictional cap',()=>{
    expect(simulatedAllocation(60,10)).toEqual({equity:60,bonds:30,cash:10,total:100,equityLimitMet:false,liquidityFloorMet:true});
    expect(simulatedAllocation(55,15)).toEqual({equity:55,bonds:30,cash:15,total:100,equityLimitMet:true,liquidityFloorMet:true});
    expect(simulatedAllocation(40,10).bonds).toBe(50);
    expect(simulatedAllocation(40,10,'stress')).toMatchObject({bonds:50,equityLimitMet:true,liquidityFloorMet:false});
    expect(simulatedAllocation(45,20,'stress')).toMatchObject({bonds:35,total:100,equityLimitMet:true,liquidityFloorMet:true});
    expect(simulatedAllocation(50,20,'stress')).toMatchObject({equityLimitMet:false,liquidityFloorMet:true});
  });
  it('rejects impossible or fractional weights',()=>{
    expect(()=>simulatedAllocation(95,10)).toThrow();
    expect(()=>simulatedAllocation(50.5,10)).toThrow();
    expect(()=>simulatedAllocation(40,20,'unknown' as 'base')).toThrow();
  });
});
