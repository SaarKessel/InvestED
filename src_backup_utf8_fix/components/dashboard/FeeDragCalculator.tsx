import { useMemo, useState } from "react";
import { Calculator, Trophy } from "lucide-react";
import { BROKERS } from "@/lib/brokers";
import { InfoBadge } from "@/components/ui/InfoBadge";
import { cn } from "@/lib/utils";

function computeAnnualCost(
  broker: (typeof BROKERS)[number],
  monthlyAmountILS: number,
  tradesPerMonth: number
): number {
  const annualManagement = broker.monthlyFeeILS * 12;
  const annualTrading = broker.perTradeFeeILS * tradesPerMonth * 12;
  const annualInvested = monthlyAmountILS * 12;
  const annualFx = (broker.fxSpreadPct / 100) * annualInvested;
  return annualManagement + annualTrading + annualFx;
}

export function FeeDragCalculator() {
  const [monthlyAmount, setMonthlyAmount] = useState(2000);
  const [tradesPerMonth, setTradesPerMonth] = useState(1);

  const ranked = useMemo(() => {
    return BROKERS.map((b) => ({
      broker: b,
      annualCost: computeAnnualCost(b, monthlyAmount, tradesPerMonth),
    })).sort((a, b) => a.annualCost - b.annualCost);
  }, [monthlyAmount, tradesPerMonth]);

  const cheapest = ranked[0];
  const mostExpensive = ranked[ranked.length - 1];
  const maxCost = mostExpensive.annualCost || 1;

  return (
    <div className="mt-6 rounded-xl border border-border bg-muted/20 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-primary" />
        <h4 className="font-display text-sm font-bold">׳׳—׳©׳‘׳•׳ ׳¢׳׳׳•׳× ׳“׳™׳ ׳׳™</h4>
        <InfoBadge description="׳’׳¨׳¨׳• ׳׳× ׳”׳׳—׳•׳•׳ ׳™׳ ׳›׳“׳™ ׳׳¨׳׳•׳× ׳׳™׳ ׳¡׳›׳•׳ ׳”׳”׳©׳§׳¢׳” ׳”׳—׳•׳“׳©׳™ ׳•׳×׳“׳™׳¨׳•׳× ׳”׳׳¡׳—׳¨ ׳׳©׳₪׳™׳¢׳™׳ ׳¢׳ ׳”׳¢׳׳׳” ׳”׳©׳ ׳×׳™׳× ׳”׳›׳•׳׳׳× ׳‘׳›׳ ׳‘׳™׳× ׳”׳©׳§׳¢׳•׳×." />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
            <span>׳¡׳›׳•׳ ׳”׳©׳§׳¢׳” ׳—׳•׳“׳©׳™</span>
            <span className="text-primary">ג‚×{monthlyAmount.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={500}
            max={10000}
            step={100}
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
            <span>׳׳¡׳₪׳¨ ׳¢׳¡׳§׳׳•׳× ׳‘׳—׳•׳“׳©</span>
            <span className="text-primary">{tradesPerMonth}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={tradesPerMonth}
            onChange={(e) => setTradesPerMonth(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {ranked.map(({ broker, annualCost }, idx) => (
          <div key={broker.name} className="flex items-center gap-3">
            <span className="w-32 shrink-0 truncate text-xs font-semibold">{broker.name}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all duration-500", idx === 0 ? "bg-success" : "bg-primary/60")}
                style={{ width: `${Math.max(4, (annualCost / maxCost) * 100)}%` }}
              />
            </div>
            <span className="w-20 shrink-0 text-left text-xs font-bold">ג‚×{Math.round(annualCost).toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-success/10 p-3 text-xs text-success">
        <Trophy className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          <b>{cheapest.broker.name}</b> ׳™׳•׳¦׳ ׳”׳›׳™ ׳׳©׳×׳׳ ׳‘׳₪׳¨׳•׳₪׳™׳ ׳”׳©׳™׳׳•׳© ׳”׳–׳” ג€” ׳›-ג‚×{Math.round(cheapest.annualCost).toLocaleString()}{" "}
          ׳¢׳׳׳•׳× ׳׳©׳•׳¢׳¨׳•׳× ׳‘׳©׳ ׳”. ׳”׳₪׳¨׳©׳™׳ ׳׳׳• ׳”׳ ׳”׳¢׳¨׳›׳” ׳—׳™׳ ׳•׳›׳™׳× ׳‘׳׳‘׳“ ׳•׳×׳׳•׳™׳™׳ ׳‘׳×׳ ׳׳™׳ ׳”׳׳“׳•׳™׳§׳™׳ ׳‘׳׳×׳¨ ׳”׳‘׳¨׳•׳§׳¨.
        </p>
      </div>
    </div>
  );
}

