import { useLanguage } from "@/context/languageContext";
import { STATE_LABEL, type Provenance } from "@/lib/intelligence/envelope";

/** One provenance line for any tool result: state, source, as-of date, license, assumptions, caveat. Built from data, never typed per card. */
export function ChatProvenance({ prov }: { prov: Provenance }) {
  const { language } = useLanguage();
  const l = language === "he" ? "he" : "en";
  const parts = [prov.source[l], prov.asOf ? `${l === "he" ? "נכון ל" : "as of "}${prov.asOf}` : null, prov.license ? `${l === "he" ? "רישיון" : "License"} ${prov.license}` : null].filter(Boolean);
  return (
    <div className="mt-2 text-[11px] leading-5 text-muted-foreground" data-testid="provenance">
      <span className="me-2 rounded-full border border-border px-2 py-0.5 font-semibold">{STATE_LABEL[prov.state][l]}</span>
      <span>{parts.join(" · ")}</span>
      {prov.note && <p className="mt-1">{prov.note[l]}</p>}
      {prov.assumptions?.map((a, i) => <p key={i} className="mt-1">{a[l]}</p>)}
    </div>
  );
}
