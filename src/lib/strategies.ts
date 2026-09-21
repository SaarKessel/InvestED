// =====================================================
// InvestED — Legacy strategy adapter
// =====================================================
// The dashboard cards (StrategiesCard / ComparisonCard) still
// consume the original Strategy shape. Since Phase 6 the data
// itself lives in the Strategy Engine's universe — this module
// derives the legacy view from it so there is exactly one
// source of truth and no parallel strategy data.
// =====================================================

import type { Strategy } from "@/types";
import type { StrategyId } from "@/types";
import { STRATEGY_UNIVERSE } from "@/lib/strategy/strategyUniverse";

/** Legacy card ids → Strategy Engine universe ids. */
const LEGACY_ID_MAP: Record<string, StrategyId> = {
  passive: "long-term-index",
  dividend: "dividend",
  growth: "growth",
  value: "value",
};

function toLegacy(legacyId: string, universeId: StrategyId): Strategy {
  const strategy = STRATEGY_UNIVERSE.find((item) => item.id === universeId);
  if (!strategy) throw new Error(`Strategy universe is missing "${universeId}"`);
  return {
    id: legacyId as Strategy["id"],
    name: strategy.name,
    whatItIs: strategy.description,
    pros: { he: strategy.strengths.map((item) => item.he), en: strategy.strengths.map((item) => item.en) },
    cons: { he: strategy.limitations.map((item) => item.he), en: strategy.limitations.map((item) => item.en) },
    riskLevel: strategy.riskProfile.level,
    suitableFor: strategy.suitableFor,
    stocks: [...strategy.exampleAssets],
  };
}

export const STRATEGIES: Strategy[] = Object.entries(LEGACY_ID_MAP).map(([legacyId, universeId]) =>
  toLegacy(legacyId, universeId)
);
