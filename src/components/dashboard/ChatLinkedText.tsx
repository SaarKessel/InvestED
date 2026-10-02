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
  const [peek, setPeek] = useState<string | null>(null);
  const info = open ? termExplanation(open, lang) : null;
  const preview = peek && peek !== open ? termExplanation(peek, lang) : null;
  return (
    <>
      <p dir={he ? "rtl" : "ltr"} className="whitespace-pre-wrap break-words">
        {segments.map((s, i) => s.id
          ? <button key={i} type="button" onClick={() => setOpen(open === s.id ? null : s.id!)} onMouseEnter={() => setPeek(s.id!)} onMouseLeave={() => setPeek(null)} onFocus={() => setPeek(s.id!)} onBlur={() => setPeek(null)} aria-expanded={open === s.id} className="underline decoration-dotted decoration-primary/60 underline-offset-4 hover:text-primary">{s.text}</button>
          : <span key={i}>{s.text}</span>)}
      </p>
      {preview && (
        <div dir={he ? "rtl" : "ltr"} role="tooltip" className="mt-1 rounded-lg border border-border/70 bg-popover p-2 text-xs leading-5 shadow-sm" data-testid="term-hover">
          <span className="font-semibold">{preview.label}: </span>{preview.text.length > 160 ? `${preview.text.slice(0, 160).trimEnd()}…` : preview.text}
        </div>
      )}
      {info && (
        <div dir={he ? "rtl" : "ltr"} className="mt-2 rounded-xl border border-border/70 bg-muted/30 p-3 text-xs leading-6" data-testid="term-explanation">
          <p className="font-semibold">{info.label}</p>
          <p className="whitespace-pre-wrap break-words">{info.text}</p>
          <button type="button" onClick={() => onAsk(he ? `מה זה ${info.label}?` : `What is ${info.label}?`)} className="mt-1 font-medium text-primary hover:underline">{((he ? heLocale : enLocale) as Record<string, string>).term_more}</button>
        </div>
      )}
    </>
  );
}
