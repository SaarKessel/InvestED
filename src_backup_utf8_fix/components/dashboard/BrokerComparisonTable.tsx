import { ExternalLink, Landmark } from "lucide-react";
import { BROKERS } from "@/lib/brokers";
import { InfoBadge } from "@/components/ui/InfoBadge";
import { FeeDragCalculator } from "./FeeDragCalculator";

export function BrokerComparisonTable() {
  return (
    <div className="mt-6 border-t border-border pt-6">
      <div className="mb-3 flex items-center gap-2 text-primary">
        <Landmark className="h-4 w-4" />
        <span className="text-xs font-bold uppercase tracking-wide">׳׳™׳₪׳” ׳׳₪׳©׳¨ ׳׳₪׳×׳•׳— ׳×׳™׳§ ׳”׳©׳§׳¢׳•׳×</span>
      </div>
      <div className="mb-1 flex items-center gap-2">
        <h4 className="font-display text-base font-bold">׳”׳©׳•׳•׳׳× ׳‘׳×׳™ ׳”׳©׳§׳¢׳•׳× ׳•׳׳₪׳׳™׳§׳¦׳™׳•׳× ׳׳¡׳—׳¨</h4>
        <InfoBadge description="׳›׳׳™ ׳׳”׳©׳•׳•׳׳× ׳¢׳׳׳•׳× ׳׳¡׳—׳¨ ׳•׳“׳׳™ ׳ ׳™׳”׳•׳ ׳‘׳‘׳ ׳§׳™׳ ׳•׳‘׳‘׳×׳™ ׳”׳©׳§׳¢׳•׳× ׳™׳©׳¨׳׳׳™׳™׳ ׳•׳‘׳™׳ ׳׳׳•׳׳™׳™׳, ׳›׳“׳™ ׳׳—׳¡׳•׳ ׳›׳¡׳£ ׳׳™׳•׳×׳¨." />
      </div>
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
        ׳˜׳‘׳׳” ׳›׳׳׳™׳× ׳׳”׳×׳׳¦׳׳•׳× ׳‘׳׳‘׳“ ג€” ׳¢׳׳׳•׳× ׳•׳“׳׳™ ׳ ׳™׳”׳•׳ ׳׳©׳×׳ ׳™׳ ׳׳¢׳™׳×׳™׳ ׳§׳¨׳•׳‘׳•׳× (׳׳‘׳¦׳¢׳™׳, ׳”׳˜׳‘׳•׳× ׳”׳¦׳˜׳¨׳₪׳•׳×).
        ׳™׳© ׳׳‘׳“׳•׳§ ׳×׳ ׳׳™׳ ׳׳¢׳•׳“׳›׳ ׳™׳ ׳‘׳׳×׳¨ ׳”׳¨׳©׳׳™ ׳©׳ ׳›׳ ׳‘׳™׳× ׳”׳©׳§׳¢׳•׳× ׳׳₪׳ ׳™ ׳§׳‘׳׳× ׳”׳—׳׳˜׳”. ׳–׳• ׳׳™׳ ׳” ׳”׳׳׳¦׳” ׳׳”׳¢׳“׳™׳£
        ׳‘׳¨׳•׳§׳¨ ׳׳—׳“ ׳¢׳ ׳₪׳ ׳™ ׳׳—׳¨.
      </p>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-right text-xs font-bold">׳‘׳™׳× ׳”׳©׳§׳¢׳•׳×</th>
              <th className="px-4 py-3 text-right text-xs font-bold">׳׳₪׳׳™׳§׳¦׳™׳”</th>
              <th className="px-4 py-3 text-right text-xs font-bold">׳¢׳׳׳× ׳׳¡׳—׳¨</th>
              <th className="px-4 py-3 text-right text-xs font-bold">׳“׳׳™ ׳ ׳™׳”׳•׳</th>
              <th className="px-4 py-3 text-right text-xs font-bold">׳”׳¨׳©׳׳”</th>
            </tr>
          </thead>
          <tbody>
            {BROKERS.map((broker) => (
              <tr key={broker.name} className="border-t border-border">
                <td className="px-4 py-3">
                  <p className="font-semibold">{broker.name}</p>
                  {broker.highlight && <p className="mt-0.5 text-[11px] text-muted-foreground">{broker.highlight}</p>}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{broker.app}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{broker.tradingFee}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{broker.managementFee}</td>
                <td className="px-4 py-3">
                  <a
                    href={broker.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                  >
                    ׳׳׳×׳¨
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FeeDragCalculator />
    </div>
  );
}

