// Provider-agnostic voice transport. Adapters: GeminiLiveTransport (this file's sibling), the browser-speech fallback (existing talk mode),
// later: local Whisper/Piper, other realtime providers. The UI and the tool registry never import a provider.
export interface ToolCall { id: string; name: string; args: Record<string, unknown> }
export interface TransportEvents {
  onReady: () => void; onUserText: (t: string) => void; onModelText: (t: string) => void; onTurnComplete: () => void;
  onAudioStart: () => void; onAudioEnd: () => void; onInterrupted: () => void; onToolCall: (c: ToolCall) => void; onClosed: (reason: string) => void;
}
export interface VoiceTransport {
  connect(): Promise<void>; sendAudio(pcm16k: Int16Array): void; sendToolResult(id: string, name: string, result: Record<string, unknown>): void; close(): void;
}
