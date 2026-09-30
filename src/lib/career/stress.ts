import { simulatedAllocation, type AllocationScenario } from './allocation';

/** Invented shocks for an educational exercise, not forecasts or historical returns. */
export const FICTIONAL_SHOCKS = {equity:-20,bonds:-5,cash:0} as const;
export type StressAsset = keyof typeof FICTIONAL_SHOCKS;
export interface FictionalStressRow { asset:StressAsset; weight:number; shock:number; contribution:number; }
/** Percent contributions to the fictional portfolio change, not money or market data. */
export function fictionalStress(equity:number,cash:number,scenario:AllocationScenario='base'):{rows:FictionalStressRow[];total:number} {
  const allocation=simulatedAllocation(equity,cash,scenario);
  const rows=(Object.keys(FICTIONAL_SHOCKS) as StressAsset[]).map(asset=>({
    asset,weight:allocation[asset],shock:FICTIONAL_SHOCKS[asset],
    contribution:allocation[asset]*FICTIONAL_SHOCKS[asset]/100,
  }));
  return {rows,total:rows.reduce((sum,row)=>sum+row.contribution,0)};
}
