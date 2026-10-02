import { useState } from "react";
import { Calculator } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { computeDcf, dcfSensitivity, type DcfInput } from "@/lib/analytics/dcf";

const FIELDS: { key: keyof DcfInput; label: string; def: string; optional?: boolean }[] = [
  { key: "baseCashFlow", label: "dcf_f_cash", def: "100" },
  { key: "growthPct", label: "dcf_f_growth", def: "8" },
  { key: "discountPct", label: "dcf_f_discount", def: "10" },
  { key: "terminalGrowthPct", label: "dcf_f_terminal", def: "2.5" },
  { key: "years", label: "dcf_f_years", def: "5" },
  { key: "netDebt", label: "dcf_f_debt", def: "", optional: true },
  { key: "shares", label: "dcf_f_shares", def: "", optional: true },
];

const num = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

export function DcfCard() {
  const { t } = useLanguage();
  const [vals, setVals] = useState<Record<string, string>>(Object.fromEntries(FIELDS.map((f) => [f.key, f.def])));
  const parse = (k: string) => (vals[k].trim() === "" ? undefined : Number(vals[k]));
  const input = {
    baseCashFlow: Number(vals.baseCashFlow), growthPct: Number(vals.growthPct), discountPct: Number(vals.discountPct),
    terminalGrowthPct: Number(vals.terminalGrowthPct), years: Number(vals.years), netDebt: parse("netDebt"), shares: parse("shares"),
  } as DcfInput;
  const blank = ["baseCashFlow", "growthPct", "discountPct", "terminalGrowthPct", "years"].some((k) => vals[k].trim() === "");
  const out = blank ? null : computeDcf(input);
  const grid = out?.ok ? dcfSensitivity(input) : [];
  return (
    <section className="rounded-3xl border border-border bg-card p-5 md:p-6" data-testid="dcf-card" aria-labelledby="dcf-title">
      <h2 id="dcf-title" className="flex items-center gap-2 text-xl font-bold md:text-2xl"><Calculator className="h-5 w-5" />{t("dcf_title")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t("dcf_note")}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FIELDS.map((f) => (
          <label key={f.key} className="text-xs font-semibold text-muted-foreground">
            {t(f.label)}{f.optional ? ` (${t("dcf_optional")})` : ""}
            <input inputMode="decimal" dir="ltr" value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} className="mt-1 block min-h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground" />
          </label>
        ))}
      </div>
      {blank && <p className="mt-4 text-sm text-muted-foreground" role="status">{t("dcf_fill")}</p>}
      {out && !out.ok && <p className="mt-4 text-sm text-danger" role="alert">{t("dcf_err_" + out.error.split(" ")[0].toLowerCase(), out.error)}</p>}
      {out?.ok && (
        <div className="mt-4 space-y-3" aria-live="polite">
          <dl className="grid gap-3 sm:grid-cols-3" dir="ltr">
            <div className="rounded-xl bg-muted/40 p-3"><dt className="text-xs text-muted-foreground">{t("dcf_r_ev")}</dt><dd className="font-bold">{num(out.result.enterpriseValue)}</dd></div>
            <div className="rounded-xl bg-muted/40 p-3"><dt className="text-xs text-muted-foreground">{t("dcf_r_terminal")}</dt><dd className="font-bold">{num(out.result.terminalShareOfValuePct)}%</dd></div>
            <div className="rounded-xl bg-muted/40 p-3"><dt className="text-xs text-muted-foreground">{t("dcf_r_pershare")}</dt><dd className="font-bold">{out.result.perShare === null ? t("dcf_na") : num(out.result.perShare)}</dd></div>
          </dl>
          <table className="w-full text-xs" dir="ltr" aria-label={t("dcf_sens")}>
            <caption className="mb-1 text-start font-bold">{t("dcf_sens")}</caption>
            <tbody>{[0, 3, 6].map((r) => <tr key={r}>{grid.slice(r, r + 3).map((c) => <td key={`${c.discountPct}-${c.terminalGrowthPct}`} className="border border-border/50 p-1.5"><span className="text-muted-foreground">{num(c.discountPct)}% / {num(c.terminalGrowthPct)}%</span><br /><b>{c.enterpriseValue === null ? t("dcf_na") : num(c.enterpriseValue)}</b></td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
