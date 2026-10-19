// Gemini Live adapter (browser, ephemeral token). Spec: https://ai.google.dev/gemini-api/docs/live-api/ (v1beta, BidiGenerateContentConstrained).
import { PcmPlayer, fromBase64, toBase64 } from "./audio";
import type { ToolCall, TransportEvents, VoiceTransport } from "./transport";
import { TOOLS, systemPrompt } from "./tools";

const URL_BASE = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained";

export class GeminiLiveTransport implements VoiceTransport {
  private ws: WebSocket | null = null; readonly player = new PcmPlayer(); private open = false;
  constructor(private token: string, private model: string, private lang: "he" | "en", private ev: TransportEvents) {
    this.player.onBusy = () => this.ev.onAudioStart(); this.player.onIdle = () => this.ev.onAudioEnd();
  }
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${URL_BASE}?access_token=${encodeURIComponent(this.token)}`); this.ws = ws;
      const timer = setTimeout(() => { reject(new Error("timeout")); ws.close(); }, 10000);
      ws.onopen = () => ws.send(JSON.stringify({ setup: {
        model: `models/${this.model}`,
        generationConfig: { responseModalities: ["AUDIO"] },
        systemInstruction: { parts: [{ text: systemPrompt(this.lang) }] },
        tools: [{ functionDeclarations: TOOLS.filter((t) => t.tier < 3).map((t) => ({ name: t.name, description: t.description, parameters: t.parameters })) }],
        inputAudioTranscription: {}, outputAudioTranscription: {},
        contextWindowCompression: { slidingWindow: {} },
      } }));
      ws.onmessage = async (e) => {
        let m: Record<string, unknown>;
        try { const raw = typeof e.data === "string" ? e.data : await (e.data as Blob).text(); m = JSON.parse(raw); } catch { return; }
        if (m.setupComplete) { clearTimeout(timer); this.open = true; resolve(); this.ev.onReady(); return; }
        const sc = m.serverContent as { modelTurn?: { parts?: { inlineData?: { data?: string } }[] }; inputTranscription?: { text?: string }; outputTranscription?: { text?: string }; interrupted?: boolean; turnComplete?: boolean } | undefined;
        if (sc) {
          if (sc.interrupted) { this.player.flush(); this.ev.onInterrupted(); }
          for (const p of sc.modelTurn?.parts ?? []) if (p.inlineData?.data) this.player.push(fromBase64(p.inlineData.data));
          if (sc.inputTranscription?.text) this.ev.onUserText(sc.inputTranscription.text);
          if (sc.outputTranscription?.text) this.ev.onModelText(sc.outputTranscription.text);
          if (sc.turnComplete) this.ev.onTurnComplete();
        }
        const tc = m.toolCall as { functionCalls?: { id: string; name: string; args?: Record<string, unknown> }[] } | undefined;
        for (const c of tc?.functionCalls ?? []) this.ev.onToolCall({ id: c.id, name: c.name, args: c.args ?? {} } as ToolCall);
        if (m.goAway) this.ev.onClosed("go_away");
      };
      ws.onerror = () => { clearTimeout(timer); if (!this.open) reject(new Error("socket_error")); };
      ws.onclose = (e) => { clearTimeout(timer); if (!this.open) reject(new Error(`closed_${e.code}`)); this.open = false; this.ev.onClosed(`closed_${e.code}`); };
    });
  }
  sendAudio(pcm: Int16Array) { if (this.open && this.ws?.readyState === 1) this.ws.send(JSON.stringify({ realtimeInput: { audio: { data: toBase64(pcm.buffer as ArrayBuffer), mimeType: "audio/pcm;rate=16000" } } })); }
  sendToolResult(id: string, name: string, response: Record<string, unknown>) { if (this.ws?.readyState === 1) this.ws.send(JSON.stringify({ toolResponse: { functionResponses: [{ id, name, response }] } })); }
  close() { this.open = false; this.player.close(); try { this.ws?.close(); } catch { /* closed */ } }
}
