/** AIProvider: the one seam between the deterministic engines and any language model. A provider may only rephrase; facts always come from the engines. */
import type { CopilotResponse } from "../copilotResponse";
import type { ConversationLanguage } from "../conversationContext";
import { rephraseWithGateway } from "../copilot/copilotGateway";

export type ProviderId = "rule-based" | "gemini" | "openai" | "anthropic" | "local";
export interface AIProvider {
  id: ProviderId;
  label: string;
  /** Free tier only. Stubs are not selectable until a free, reviewed integration exists. */
  available: boolean;
  /** Returns reworded text, or null to keep the deterministic answer. Never throws. */
  rephrase(question: string, language: ConversationLanguage, response: CopilotResponse): Promise<string | null>;
}

export const ruleBasedProvider: AIProvider = { id: "rule-based", label: "Rules only", available: true, rephrase: async () => null };
export const geminiProvider: AIProvider = {
  id: "gemini", label: "Gemini (free tier)", available: true,
  rephrase: (question, language, response) => rephraseWithGateway(question, language, response),
};
const stub = (id: ProviderId, label: string): AIProvider => ({ id, label, available: false, rephrase: async () => null });
export const PROVIDERS: Record<ProviderId, AIProvider> = {
  "rule-based": ruleBasedProvider, gemini: geminiProvider,
  openai: stub("openai", "OpenAI (not connected)"), anthropic: stub("anthropic", "Anthropic (not connected)"), local: stub("local", "On-device model (not connected)"),
};
export const DEFAULT_PROVIDER: ProviderId = "gemini";
/** Unknown or unavailable ids fall back to rules-only, never to another vendor. */
export function getProvider(id: string | null | undefined): AIProvider {
  const p = id ? PROVIDERS[id as ProviderId] : undefined;
  return p?.available ? p : id === undefined || id === null ? PROVIDERS[DEFAULT_PROVIDER] : ruleBasedProvider;
}
