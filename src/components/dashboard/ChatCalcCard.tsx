import { Link } from "react-router-dom";
import { useLanguage } from "@/context/languageContext";
import type { CalcDeskResult } from "@/lib/copilot/calcDesk";
import { formatCurrencyCapped } from "@/lib/format";
import { calcSteps } from "@/lib/copilot/calcExplain";

/** Read-only projection card. Numbers come from calculatorEngine; the rate is a labeled teaching assumption. */
export function ChatCalcCard({ data }: { data: CalcDeskResult }) {
  const { t, language } = useLanguage();
  const money = (v: number) => formatCurrencyCapped(v, data.currency, language);
  const cell = (label: string, value: string) => <div><p className="text-muted-foreground">{label}</p><p className="mt-0.5 text-sm font-semibold" dir="ltr">{value}</p></div>;
  return (
    <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-3 text-xs">
      <p className="font-semibold">{t("calc_title")}</p>
      <p className="mt-1 text-muted-foreground">{t("calc_inputs").replace("{monthly}", money(data.monthly)).replace("{principal}", money(data.principal)).replace("{years}", String(data.years))}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cell(t("calc_final"), money(data.finalBalance))}
        {cell(t("calc_contributed"), money(data.contributed))}
        {cell(t("calc_growth"), money(data.growth))}
        {cell(t("calc_real"), money(data.real))}
      </div>
      {data.target !== null && <p className="mt-3 font-medium">{t(data.reachesTarget ? "calc_target_yes" : "calc_target_no").replace("{target}", money(data.target))}</p>}
      <p className="mt-3 text-muted-foreground">{t("calc_assumption").replace("{rate}", String(data.returnPct))}</p>
      {data.warning && <p className="mt-2 font-medium text-amber-600">{data.warning[language === "he" ? "he" : "en"]}</p>}
      <details className="mt-3">
        <summary className="cursor-pointer select-none font-medium text-muted-foreground hover:text-foreground">{t("calc_how")}</summary>
        <ol className="mt-1.5 list-decimal space-y-1 ps-5 text-muted-foreground">{calcSteps({ data, money, language: language === "he" ? "he" : "en" }).map((x, i) => <li key={i}>{x}</li>)}</ol>
      </details>
      <Link to="/calculator" className="mt-2 inline-block font-semibold text-primary hover:underline">{t("calc_open")}</Link>
    </div>
  );
}
