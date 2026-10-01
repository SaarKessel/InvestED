// GPT-voice-style orb. The glow moves with the state (listening, thinking, speaking). Speech amplitude is not
// available from the browser's on-device voice, so the motion shows state, not volume.
import { X } from "lucide-react";
import { useLanguage } from "@/context/languageContext";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";
export function VoiceOrb({ state, onClose, onTapOrb, note }: { state: OrbState; onClose: () => void; onTapOrb: () => void; note: string | null }) {
  const { t } = useLanguage();
  return (
    <div role="dialog" aria-modal="true" aria-label={t("orb_title")} className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-background/95 px-6 py-8 backdrop-blur-md" data-testid="voice-orb">
      <button type="button" onClick={onClose} aria-label={t("talk_stop")} className="self-end rounded-full p-3 text-muted-foreground hover:bg-accent hover:text-foreground"><X className="h-6 w-6" /></button>
      <button type="button" onClick={onTapOrb} aria-label={t(`orb_${state}`)} className="orb-wrap rounded-full outline-none">
        <span className={`orb-halo orb-${state}`} aria-hidden="true" />
        <span className={`orb-core orb-${state}`} aria-hidden="true"><i className="orb-blob b1" /><i className="orb-blob b2" /><i className="orb-blob b3" /></span>
      </button>
      <div className="text-center">
        <p className="text-lg font-medium" aria-live="polite">{t(`orb_${state}`)}</p>
        <p className="mt-2 max-w-xs text-xs text-muted-foreground">{note ?? t("orb_hint")}</p>
      </div>
    </div>
  );
}
