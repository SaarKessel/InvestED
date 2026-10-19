import { BarChart3, Briefcase, FlaskConical, GraduationCap, Table2 } from "lucide-react";
import { useLanguage } from "@/context/languageContext";

const TILES = [
  { k: "f1", Icon: BarChart3 },
  { k: "f2", Icon: FlaskConical },
  { k: "f3", Icon: Briefcase },
  { k: "f4", Icon: Table2 },
  { k: "f5", Icon: GraduationCap },
] as const;

/** Signed-out showcase under the sign-in card: what InvestED+ is, in five tiles. Presentation only. */
export function GateShowcase() {
  const { t } = useLanguage();
  return (
    <section aria-label={t("gate_tagline")} className="fx-showcase mx-auto mt-8 w-full max-w-3xl" data-testid="gate-showcase">
      <p className="text-center text-sm text-muted-foreground">{t("gate_sub")}</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map(({ k, Icon }) => (
          <li key={k} className="fx-tile flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
            <span className="fx-tile-icon grid h-10 w-10 shrink-0 place-items-center rounded-xl"><Icon className="h-5 w-5" aria-hidden="true" /></span>
            <span className="min-w-0"><span className="block text-sm font-semibold">{t(`gate_${k}_t`)}</span><span className="block text-xs leading-5 text-muted-foreground">{t(`gate_${k}_d`)}</span></span>
          </li>
        ))}
      </ul>
    </section>
  );
}
