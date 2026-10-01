import { useMemo, useState } from "react";
import enLocale from "@/locales/en.json";
import heLocale from "@/locales/he.json";
import { linkTerms, termExplanation } from "@/lib/copilot/termLinks";

/** Answer text with known terms underlined. A click opens the stored explanation under the paragraph, with an option to ask more. */
export function ChatLinkedText({ text, onAsk }: { text: string; onAsk: (q: string) => void }) {
  const he = /[א-ת]/.test(text);
  const lang = he ? "he" : "en";
  const segments = useMemo(() => linkTerms(text), [text]);
  const [open, setOpen] = useState<string | null>(null);
  const info = open ? termExplanation(open, lang) : null;
  return (
    <>
      <p dir={he ? "rtl" : "ltr"} className="whitespace-pre-wrap">
        {segments.map((s, i) => s.id
          ? <button key={i} type="button" onClick={() => setOpen(open === s.id ? null : s.id!)} aria-expanded={open === s.id} className="underline decoration-dotted decoration-primary/60 underline-offset-4 hover:text-primary">{s.text}</button>
          : <span key={i}>{s.text}</span>)}
      </p>
      {info && (
        <div dir={he ? "rtl" : "ltr"} className="mt-2 rounded-xl border border-border/70 bg-muted/30 p-3 text-xs leading-6" data-testid="term-explanation">
          <p className="font-semibold">{info.label}</p>
          <p>{info.text}</p>
          <button type="button" onClick={() => onAsk(he ? `מה זה ${info.label}?` : `What is ${info.label}?`)} className="mt-1 font-medium text-primary hover:underline">{((he ? heLocale : enLocale) as Record<string, string>).term_more}</button>
        </div>
      )}
    </>
  );
}
