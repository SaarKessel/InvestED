import { useEffect, useState } from "react";
import { useLanguage } from "@/context/languageContext";
import type { MemoryApi } from "@/lib/memory/memoryApi";

const T = {
  en: { title: "Memory", off: "Off by default. Nothing is stored unless you turn this on.", on: "On. Only facts you choose to keep are stored.", toggle: "Allow memory", exp: "Export my data", del: "Delete all my memory", sure: "Delete everything and turn memory off?", yes: "Yes, delete", no: "Cancel", unavailable: "Memory is not available right now.", done: "Deleted.", exported: "Exported." },
  he: { title: "זיכרון", off: "כבוי כברירת מחדל. שום דבר לא נשמר אלא אם תפעיל.", on: "פעיל. נשמרות רק עובדות שבחרת לשמור.", toggle: "אפשר זיכרון", exp: "ייצוא הנתונים שלי", del: "מחיקת כל הזיכרון שלי", sure: "למחוק הכול ולכבות את הזיכרון?", yes: "כן, למחוק", no: "ביטול", unavailable: "הזיכרון לא זמין כרגע.", done: "נמחק.", exported: "יוצא." },
};
/** Consent switch, export and delete. Nothing in the app writes memory unless consent is on. */
export function MemoryPanel({ api }: { api: MemoryApi }) {
  const { language } = useLanguage();
  const s = language === "he" ? T.he : T.en;
  const [consent, setConsent] = useState<boolean | null>(null);
  const [status, setStatus] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => { api.getConsent().then(setConsent).catch(() => setFailed(true)); }, [api]);
  const toggle = async () => {
    const next = !consent;
    try { await api.setConsent(next); setConsent(next); setStatus(""); } catch { setFailed(true); }
  };
  const doExport = async () => {
    try {
      const data = await api.exportMemory();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const a = document.createElement("a"); a.href = url; a.download = "invested-memory.json"; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus(s.exported);
    } catch { setFailed(true); }
  };
  const doDelete = async () => {
    try { await api.deleteAll(); setConsent(false); setConfirming(false); setStatus(s.done); } catch { setFailed(true); }
  };
  const btn = "rounded-lg border border-border px-2 py-1.5 text-start text-sm hover:bg-muted";
  return (
    <section aria-label={s.title} data-testid="memory-panel" className="px-3 pb-2">
      <p className="pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{s.title}</p>
      {failed ? <p role="status" className="text-xs text-muted-foreground">{s.unavailable}</p> : (
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" role="switch" checked={!!consent} disabled={consent === null} onChange={() => void toggle()} aria-label={s.toggle} />
            <span>{s.toggle}</span>
          </label>
          <p className="text-xs text-muted-foreground">{consent ? s.on : s.off}</p>
          <button type="button" className={btn} onClick={() => void doExport()}>{s.exp}</button>
          {confirming ? (
            <div className="flex flex-col gap-1">
              <p className="text-xs">{s.sure}</p>
              <div className="flex gap-2">
                <button type="button" className={`${btn} text-destructive`} onClick={() => void doDelete()}>{s.yes}</button>
                <button type="button" className={btn} onClick={() => setConfirming(false)}>{s.no}</button>
              </div>
            </div>
          ) : <button type="button" className={`${btn} text-destructive`} onClick={() => setConfirming(true)}>{s.del}</button>}
          {status && <p role="status" className="text-xs text-muted-foreground">{status}</p>}
        </div>
      )}
    </section>
  );
}
