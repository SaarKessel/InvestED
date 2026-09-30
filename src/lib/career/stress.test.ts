import {describe,it,expect} from 'vitest';
import {fictionalStress} from './stress';
describe('invented portfolio-shock exercise',()=>{
  it('calculates percent-point contributions from chosen weights',()=>{
    expect(fictionalStress(60,10)).toEqual({rows:[
      {asset:'equity',weight:60,shock:-20,contribution:-12},
      {asset:'bonds',weight:30,shock:-5,contribution:-1.5},
      {asset:'cash',weight:10,shock:0,contribution:0},
    ],total:-13.5});
    expect(fictionalStress(40,20,'stress').total).toBe(-10);
  });
  it('rejects impossible weights rather than inventing a valid result',()=>{
    expect(()=>fictionalStress(90,20)).toThrow();
  });
});
