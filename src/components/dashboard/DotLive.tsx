// DOT live voice (beta): Gemini Live over an ephemeral token, with the same tool registry and a policy gate. Any failure hands over to the
// existing browser-speech talk mode (onFallback), so voice never dead-ends.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/context/languageContext";
import { getSupabase } from "@/lib/account/supabaseClient";
import { MicCapture } from "@/lib/dot/audio";
import { GeminiLiveTransport } from "@/lib/dot/geminiLive";
import { runTool, type DotContext, type DotTool } from "@/lib/dot/tools";
import { VoiceOrb, type OrbState } from "./VoiceOrb";

interface Props { ctx: Omit<DotContext, "language">; onClose: () => void; onFallback: (reason: string) => void }
interface Pending { tool: DotTool; args: Record<string, unknown>; resolve: (ok: boolean) => void }

export function DotLive({ ctx, onClose, onFallback }: Props) {
  const { t, language } = useLanguage();
  const lang = language === "he" ? "he" : "en";
  const [state, setState] = useState<OrbState>("thinking");
  const [heard, setHeard] = useState(""); const [reply, setReply] = useState(""); const [note, setNote] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null); const [done, setDone] = useState<string[]>([]);
  const tr = useRef<GeminiLiveTransport | null>(null); const mic = useRef<MicCapture>(new MicCapture()); const speaking = useRef(false); const turnHeard = useRef("");
  const ctxRef = useRef(ctx); ctxRef.current = ctx;

  useEffect(() => {
    let dead = false;
    const fall = (r: string) => { if (!dead) { dead = true; cleanup(); onFallback(r); } };
    const cleanup = () => { mic.current.stop(); tr.current?.close(); };
    (async () => {
      try {
        const { data } = await getSupabase().auth.getSession(); const jwt = data.session?.access_token; if (!jwt) return fall("sign_in_required");
        const r = await fetch("/api/dot-token", { method: "POST", headers: { Authorization: `Bearer ${jwt}` } });
        const j = (await r.json().catch(() => ({}))) as { available?: boolean; token?: string; model?: string; reason?: string };
        if (!j.available || !j.token || !j.model) return fall(j.reason ?? `http_${r.status}`);
        const confirm = (tool: DotTool, args: Record<string, unknown>) => new Promise<boolean>((resolve) => setPending({ tool, args, resolve }));
        const transport = new GeminiLiveTransport(j.token, j.model, lang, {
          onReady: () => { if (!dead) setState("listening"); },
          onUserText: (x) => { if (!turnHeard.current) setReply(""); turnHeard.current += x; setHeard(turnHeard.current); },
          onModelText: (x) => setReply((p) => p + x),
          onTurnComplete: () => { turnHeard.current = ""; },
          onAudioStart: () => { speaking.current = true; setState("speaking"); },
          onAudioEnd: () => { speaking.current = false; setState("listening"); },
          onInterrupted: () => { speaking.current = false; setState("listening"); },
          onClosed: (why) => { if (!dead) { setState("error"); setNote(t(why === "go_away" ? "dot_session_end" : "dot_closed")); mic.current.stop(); } },
          onToolCall: (c) => { void (async () => {
            setState("thinking");
            const out = await runTool(c.name, c.args, { ...ctxRef.current, language: lang }, confirm);
            setPending(null);
            if (out.result.ok === true && out.tool && out.tool.tier >= 1) setDone((d) => [...d, `${out.tool!.name}`].slice(-3));
            transport.sendToolResult(c.id, c.name, out.result);
          })(); },
        });
        tr.current = transport;
        await transport.connect();
        await mic.current.start((pcm) => transport.sendAudio(pcm));
      } catch (e) { fall(e instanceof Error ? e.message : "failed"); }
    })();
    return () => { dead = true; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const answer = (ok: boolean) => { pending?.resolve(ok); setPending(null); };
  return (
    <>
      <VoiceOrb state={state} onClose={onClose} onTapOrb={() => { mic.current.muted = !mic.current.muted; setNote(mic.current.muted ? t("dot_muted") : null); }} note={note ?? t("dot_notice")} heard={heard} reply={reply} onStopSpeech={() => tr.current?.player.flush()} />
      {done.length > 0 && !pending ? createPortal(<div className="fixed inset-x-0 bottom-24 z-[102] mx-auto w-fit rounded-full border border-border/60 bg-card px-4 py-2 text-xs" role="status" data-testid="dot-done">{t("dot_done")}: {done[done.length - 1]}</div>, document.body) : null}
      {pending ? createPortal(
        <div role="alertdialog" aria-modal="true" aria-label={t("dot_confirm_title")} className="fixed inset-x-4 bottom-28 z-[103] mx-auto max-w-md rounded-2xl border border-border bg-card p-4 shadow-2xl" data-testid="dot-confirm">
          <p className="text-sm font-semibold">{t("dot_confirm_title")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{pending.tool.name}: <bdi dir="auto">{JSON.stringify(pending.args).slice(0, 240)}</bdi></p>
          <div className="mt-3 flex gap-2"><button type="button" onClick={() => answer(true)} className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{t("dot_confirm_yes")}</button><button type="button" onClick={() => answer(false)} className="flex-1 rounded-full border border-border px-4 py-2 text-sm">{t("dot_confirm_no")}</button></div>
        </div>, document.body) : null}
    </>
  );
}
