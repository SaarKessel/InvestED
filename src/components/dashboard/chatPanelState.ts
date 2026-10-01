import { useEffect, useState } from "react";

interface VisualMessage { desk?: unknown; calc?: unknown; learnPath?: boolean; knowledge?: unknown[]; response?: { toolResult?: unknown; calculation?: unknown; assets?: unknown[]; strategyExplanation?: unknown; strategyFit?: unknown; comparison?: unknown[] | null } }

export function hasVisuals(m: VisualMessage): boolean {
  const r = m.response;
  return Boolean(m.desk || m.calc || m.learnPath || (m.knowledge && m.knowledge.length) || r?.toolResult || r?.calculation || (r?.assets && r.assets.length) || r?.strategyExplanation || r?.strategyFit || (r?.comparison && r.comparison.length));
}

export function useWide(): boolean {
  const query = "(min-width: 1024px)";
  const [wide, setWide] = useState(() => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(query).matches);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(query);
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    on();
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

