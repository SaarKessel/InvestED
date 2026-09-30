/** Fictional exercise calculations; never use these as market prices or real suitability advice. */
export interface SimulatedAllocation { equity:number; bonds:number; cash:number; total:number; equityLimitMet:boolean; liquidityFloorMet:boolean; }
export type AllocationScenario = 'base' | 'stress';
/** Both mandates are invented for this learning exercise, not investment advice. */
export const FICTIONAL_MANDATES: Record<AllocationScenario,{maximumEquity:number;minimumCash:number}> = {
  base:{maximumEquity:55,minimumCash:10},
  stress:{maximumEquity:45,minimumCash:20},
};
export function isAllocationScenario(value:unknown): value is AllocationScenario { return value==='base' || value==='stress'; }
export function simulatedAllocation(equity:number,cash:number,scenario:AllocationScenario='base'):SimulatedAllocation {
  if (!isAllocationScenario(scenario) || !Number.isInteger(equity) || !Number.isInteger(cash) || equity<0 || cash<0 || equity+cash>100) throw new Error('Invalid fictional allocation');
  const bonds=100-equity-cash;
  const mandate=FICTIONAL_MANDATES[scenario];
  return {equity,bonds,cash,total:equity+bonds+cash,equityLimitMet:equity<=mandate.maximumEquity,liquidityFloorMet:cash>=mandate.minimumCash};
}
