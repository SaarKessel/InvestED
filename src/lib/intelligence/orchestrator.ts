import type { ConversationIntent, TurnResolution } from "../conversationContext";
export type EngineId = "financial"|"market"|"strategy"|"profile"|"portfolio"|"backtesting"|"news"|"education";
export interface OrchestrationPlan { intent: ConversationIntent; engines: EngineId[]; entities:{assets:string[];strategies:string[]}; requiresClarification:boolean; explanation:string[] }
type Resolver=(turn:TurnResolution)=>EngineId[];
const registry:Record<ConversationIntent,Resolver>={
 financial_projection:()=>["financial"], asset_analysis:()=>["market"], comparison:()=>["market"],
 investor_profile_fit:(t)=>t.strategyIds.length?["strategy","profile"]:["profile"],
 strategy_question:(t)=>["strategy",...(t.investorProfileContext?["profile" as const]:[])],
 educational_question:()=>["education"], general:()=>["education"],
};
export function createOrchestrationPlan(turn:TurnResolution):OrchestrationPlan { const engines=[...new Set(registry[turn.intent](turn))]; return {intent:turn.intent,engines,entities:{assets:turn.intent==="comparison"?turn.comparisonSet:turn.currentAsset?[turn.currentAsset]:[],strategies:turn.strategyIds},requiresClarification:turn.status==="needs_clarification",explanation:engines.map(e=>`Selected ${e} engine for ${turn.intent}.`)}; }
