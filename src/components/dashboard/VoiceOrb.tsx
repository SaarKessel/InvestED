// Voice orb: the full-screen voice conversation, plus the always-visible round launcher (VoiceDot).
// The glow moves with the state (idle, listening, thinking, speaking, error). Speech amplitude is not available from the
// browser's on-device voice, so the motion shows state, not volume. The colour follows the topic agent; no topic keeps the blue default.
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Mic, Square, X } from "lucide-react";
import { useLanguage } from "@/context/languageContext";

export type OrbState = "idle" | "listening" | "thinking" | "speaking" | "error";
export type OrbLang = "he" | "en";

interface OrbProps {
  state: OrbState; accent?: string | null; onClose: () => void; onTapOrb: () => void; note: string | null; code?: string | null; trace?: string[];
  heard?: string; reply?: string; speechLang?: OrbLang; onLang?: (l: OrbLang) => void; onStopSpeech?: () => void;
}

export function VoiceOrb({ state, onClose, onTapOrb, note, code, trace, accent, heard, reply, speechLang, onLang, onStopSpeech }: OrbProps) {
  const { t } = useLanguage();
  const orbRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);
  useEffect(() => {
    opener.current = document.activeElement;
    orbRef.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); onClose(); } };
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("keydown", key); (opener.current as HTMLElement | null)?.focus?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const label = state === "idle" && !note ? t("orb_idle_tap") : t(`orb_${state}`);
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={t("orb_title")} className="voice-orb-screen fixed inset-0 z-[100] flex flex-col items-center justify-between px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]" data-testid="voice-orb">
      <div className="flex w-full items-center justify-between gap-3">
        {onLang ? (
          <div role="group" aria-label={t("orb_lang")} className="inline-flex rounded-full border border-border/60 bg-muted/40 p-0.5 text-xs font-semibold">
            {(["he", "en"] as const).map((l) => <button key={l} type="button" aria-pressed={speechLang === l} onClick={() => onLang(l)} className={`rounded-full px-3 py-1.5 transition-colors ${speechLang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{t(`orb_lang_${l}`)}</button>)}
          </div>
        ) : <span />}
        <button type="button" onClick={onClose} aria-label={t("talk_stop")} className="rounded-full p-3 text-muted-foreground hover:bg-accent hover:text-foreground"><X className="h-6 w-6" /></button>
      </div>
      <div className="flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6">
        <button ref={orbRef} type="button" onClick={onTapOrb} aria-label={label} className="orb-wrap rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background" data-accent={accent ?? undefined} data-state={state} style={accent ? ({ "--orb-accent": accent } as React.CSSProperties) : undefined}>
          <span className={`orb-halo orb-${state}`} aria-hidden="true" />
          <span className={`orb-core orb-${state}`} aria-hidden="true"><i className="orb-blob b1" /><i className="orb-blob b2" /><i className="orb-blob b3" /></span>
        </button>
        <div className="w-full text-center">
          <p className="text-lg font-medium" aria-live="polite" data-testid="orb-label">{label}</p>
          <div className="mt-3 min-h-[3.25rem] space-y-2 text-sm">
            {heard ? <p className="line-clamp-2 text-foreground/90" data-testid="orb-heard"><span className="me-1 text-xs text-muted-foreground">{t("orb_heard")}:</span>{heard}</p> : null}
            {reply && state !== "listening" ? <p className="line-clamp-3 text-muted-foreground" data-testid="orb-reply"><span className="me-1 text-xs">{t("orb_reply")}:</span>{reply}</p> : null}
          </div>
        </div>
      </div>
      <div className="flex w-full max-w-md flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onTapOrb} aria-label={state === "listening" ? t("voice_stop") : t("orb_mic_on")} aria-pressed={state === "listening"} className={`inline-flex h-12 w-12 items-center justify-center rounded-full border border-border/60 transition-colors ${state === "listening" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-foreground hover:bg-accent"}`}>{state === "listening" ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}</button>
          {state === "speaking" && onStopSpeech ? <button type="button" onClick={onStopSpeech} className="rounded-full border border-border/60 bg-muted/40 px-4 py-3 text-xs font-semibold hover:bg-accent">{t("orb_stop_speech")}</button> : null}
        </div>
        <p className={`max-w-xs text-center text-xs ${state === "error" ? "text-destructive" : "text-muted-foreground"}`} role={state === "error" ? "alert" : undefined}>{note ?? t("orb_hint")}</p>
        {(trace && trace.length > 0) || code ? (
          <details className="max-w-xs text-center text-[10px] text-muted-foreground/70">
            <summary className="cursor-pointer">{t("orb_details")}</summary>
            {trace && trace.length > 0 && <p dir="ltr" className="mt-1" data-testid="voice-trace">{trace.join(" › ")}</p>}
            {code && <p className="mt-1">{t("voice_code")} <bdi dir="ltr" className="font-mono">{code}</bdi></p>}
          </details>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

/** Always-visible round launcher (like a voice "dot"): sits bottom-end above the status bar and the mobile bottom nav; reflects the voice state. */
export function VoiceDot({ state, onOpen, accent }: { state: OrbState; onOpen: () => void; accent?: string | null }) {
  const { t } = useLanguage();
  return createPortal(
    <button type="button" onClick={onOpen} aria-label={t("orb_open")} title={t("orb_open")} data-testid="voice-dot" data-state={state} className="voice-dot" style={accent ? ({ "--orb-accent": accent } as React.CSSProperties) : undefined}>
      <span className="voice-dot-ring" aria-hidden="true" />
      <span className={`orb-core orb-${state}`} aria-hidden="true"><i className="orb-blob b1" /><i className="orb-blob b2" /><i className="orb-blob b3" /></span>
    </button>,
    document.body,
  );
}
