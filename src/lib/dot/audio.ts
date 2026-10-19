// Browser audio for DOT: mic -> 16 kHz 16-bit PCM chunks, and a gap-free 24 kHz PCM player that can be cut instantly (barge-in).
export function floatToPcm16(input: Float32Array, inRate: number, outRate = 16000): Int16Array {
  const ratio = inRate / outRate; const n = Math.floor(input.length / ratio); const out = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.floor(i * ratio), b = Math.min(input.length, Math.floor((i + 1) * ratio)); let sum = 0, c = 0;
    for (let j = a; j < b; j++) { sum += input[j]; c++; }
    const v = Math.max(-1, Math.min(1, c ? sum / c : 0)); out[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
  }
  return out;
}
export function toBase64(buf: ArrayBuffer): string { let s = ""; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); }
export function fromBase64(b64: string): ArrayBuffer { const s = atob(b64); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }

export class MicCapture {
  private ctx: AudioContext | null = null; private stream: MediaStream | null = null; private node: ScriptProcessorNode | null = null; muted = false;
  async start(onChunk: (pcm: Int16Array) => void): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.node = this.ctx.createScriptProcessor(4096, 1, 1);
    this.node.onaudioprocess = (e) => { if (!this.muted) onChunk(floatToPcm16(e.inputBuffer.getChannelData(0), this.ctx!.sampleRate)); };
    src.connect(this.node); this.node.connect(this.ctx.destination);
  }
  stop() { this.node?.disconnect(); this.stream?.getTracks().forEach((t) => t.stop()); void this.ctx?.close(); this.node = null; this.stream = null; this.ctx = null; }
}

export class PcmPlayer {
  private ctx: AudioContext | null = null; private next = 0; private live = new Set<AudioBufferSourceNode>(); onIdle: (() => void) | null = null; onBusy: (() => void) | null = null;
  private ensure() { if (!this.ctx) { const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; this.ctx = new Ctx({ sampleRate: 24000 }); } return this.ctx; }
  push(buf: ArrayBuffer) {
    const ctx = this.ensure(); const pcm = new Int16Array(buf); const f = new Float32Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) f[i] = pcm[i] / 0x8000;
    const ab = ctx.createBuffer(1, f.length, 24000); ab.copyToChannel(f, 0);
    const s = ctx.createBufferSource(); s.buffer = ab; s.connect(ctx.destination);
    const at = Math.max(ctx.currentTime + 0.02, this.next); s.start(at); this.next = at + ab.duration;
    if (this.live.size === 0) this.onBusy?.();
    this.live.add(s); s.onended = () => { this.live.delete(s); if (this.live.size === 0) this.onIdle?.(); };
  }
  /** Barge-in: drop everything that is queued or playing right now. */
  flush() { for (const s of this.live) { s.onended = null; try { s.stop(); } catch { /* already ended */ } } const had = this.live.size > 0; this.live.clear(); this.next = 0; if (had) this.onIdle?.(); }
  close() { this.flush(); void this.ctx?.close(); this.ctx = null; }
}
