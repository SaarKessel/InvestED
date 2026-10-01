/**
 * One routing entry point. Stage 1 is the planner (deterministic desks, tools, pages). When stage 1
 * finds no desk (route "copilot") and a conversation session is given, stage 2 resolves the intent and
 * the engines with the older intent stage. Callers get one RoutedPlan instead of knowing two routers.
 * No rules moved: this composes the two existing stages, and characterization.test.ts pins the result.
 */
import { planQuestion, type Plan } from "@/lib/copilot/planner";
import type { ConversationSession, TurnResolution } from "@/lib/conversationContext";
import { createOrchestrationPlan, type EngineId } from "./orchestrator";

export interface RoutedPlan {
  plan: Plan;
  /** set only when the planner found no desk and a session was provided */
  resolution: TurnResolution | null;
  /** legacy engine ids the intent stage plans with; empty when stage 2 did not run */
  engines: EngineId[];
}

export function routeRequest(text: string, session?: ConversationSession): RoutedPlan {
  const plan = planQuestion(text);
  if (plan.route !== "copilot" || !session) return { plan, resolution: null, engines: [] };
  const resolution = session.processTurn(text);
  return { plan, resolution, engines: createOrchestrationPlan(resolution).engines };
}
