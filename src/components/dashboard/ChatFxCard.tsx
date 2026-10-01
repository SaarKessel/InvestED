import { useLanguage } from "@/context/languageContext";
import { fmt } from "@/lib/copilot/mathDesk";
import type { FxResult } from "@/lib/copilot/fxDesk";

/** Reference-rate conversion. Rate and date come from the ECB via Frankfurter; the card says it is not a live quote. */
export function ChatFxCard({ data }: { data: FxResult }) {
  const { language } = useLanguage();
  const he = language === "he";
  return (
    <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-3 text-xs">
      <p className="font-semibold">{he ? "המרת מטבע" : "Currency conversion"}</p>
      <p className="mt-2 text-lg font-semibold" dir="ltr">{fmt(data.amount)} {data.from} = {fmt(Number(data.result.toFixed(4)))} {data.to}</p>
      <p className="mt-1 font-mono text-muted-foreground" dir="ltr">1 {data.from} = {fmt(data.rate)} {data.to}</p>
      <p className="mt-2 text-muted-foreground">{he ? `שער יחס יומי של הבנק המרכזי האירופי (ECB), דרך Frankfurter, לתאריך ${data.date}. זה לא שער מסחר חי; בנקים ובורסאות מציעים שערים אחרים.` : `European Central Bank daily reference rate, via Frankfurter, for ${data.date}. It is not a live trading quote; banks and brokers use other rates.`}</p>
    </div>
  );
}
