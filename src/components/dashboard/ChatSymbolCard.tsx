import { useLanguage } from "@/context/languageContext";
import type { SymbolInfo } from "@/lib/copilot/symbolDesk";

/** Static metadata about a ticker. No price. The attribution names the dataset. */
export function ChatSymbolCard({ info, onAsk }: { info: SymbolInfo; onAsk: (q: string) => void }) {
  const { language } = useLanguage();
  const he = language === "he";
  const row = (label: string, value: string) => <div><p className="text-muted-foreground">{label}</p><p className="mt-0.5 text-sm font-semibold">{value}</p></div>;
  return (
    <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-3 text-xs">
      <p className="font-semibold" dir="ltr">{info.symbol} · {info.name}</p>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {row(he ? "סוג" : "Type", info.kind === "equity" ? (he ? "מניה" : "Stock") : (he ? "קרן סל / קרן" : "ETF or fund"))}
        {info.sector && row(he ? "סקטור" : "Sector", info.sector)}
        {info.size && row(he ? "גודל חברה" : "Company size", info.size)}
        {info.issuer && row(he ? "מנפיק" : "Issuer", info.issuer)}
      </div>
      <button type="button" onClick={() => onAsk(`how is ${info.symbol} doing`)} className="mt-3 font-semibold text-primary hover:underline">{he ? "הצג מחיר וגרף" : "Show price and chart"}</button>
      <p className="mt-2 text-muted-foreground">{he ? "פרטי זיהוי בלבד, ללא מחיר וללא המלצה. מקור: FinanceDatabase (רישיון MIT), רשימה מקוצרת שלא תמיד מעודכנת." : "Identity details only, no price and no advice. Source: FinanceDatabase (MIT license), a trimmed list that may not be current."}</p>
    </div>
  );
}
