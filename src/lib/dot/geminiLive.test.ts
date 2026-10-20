// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GeminiLiveTransport } from "./geminiLive";
import type { TransportEvents } from "./transport";
import { TOOLS } from "./tools";

// Fake WebSocket: instances register here so tests can drive server frames.
class FakeWS {
  static instances: FakeWS[] = [];
  static OPEN = 1;
  url: string; readyState = 0; sent: string[] = [];
  onopen: (() => void) | null = null; onmessage: ((e: { data: string }) => void) | null = null; onerror: (() => void) | null = null; onclose: ((e: { code: number }) => void) | null = null;
  constructor(url: string) { this.url = url; FakeWS.instances.push(this); }
  send(s: string) { this.sent.push(s); }
  close() { this.readyState = 3; }
  // test helpers
  serverOpen() { this.readyState = 1; this.onopen?.(); }
  serverSend(m: unknown) { this.onmessage?.({ data: JSON.stringify(m) }); }
  serverClose(code = 1006) { this.readyState = 3; this.onclose?.({ code }); }
}
vi.stubGlobal("WebSocket", FakeWS);
// PcmPlayer needs AudioContext; stub the player methods instead.
vi.mock("./audio", async (orig) => {
  const mod = await orig<typeof import("./audio")>();
  class StubPlayer { onBusy: (() => void) | null = null; onIdle: (() => void) | null = null; pushed = 0; flushed = 0; closed = 0;
    push() { this.pushed++; } flush() { this.flushed++; this.onIdle?.(); } close() { this.closed++; } }
  return { ...mod, PcmPlayer: StubPlayer };
});

const mkEvents = () => {
  const calls: string[] = [];
  const ev: TransportEvents = {
    onReady: () => calls.push("ready"), onUserText: (t) => calls.push(`user:${t}`), onModelText: (t) => calls.push(`model:${t}`),
    onTurnComplete: () => calls.push("turn"), onAudioStart: () => calls.push("a+"), onAudioEnd: () => calls.push("a-"),
    onInterrupted: () => calls.push("interrupted"), onToolCall: (c) => calls.push(`tool:${c.name}`), onClosed: (r) => calls.push(`closed:${r}`),
  };
  return { ev, calls };
};

const setup = () => {
  const { ev, calls } = mkEvents();
  const tr = new GeminiLiveTransport("tok123", "m1", "he", ev);
  const p = tr.connect();
  const ws = FakeWS.instances[FakeWS.instances.length - 1];
  ws.serverOpen();
  return { tr, p, ws, calls };
};

beforeEach(() => { FakeWS.instances = []; });

describe("GeminiLiveTransport setup", () => {
  it("opens with the token in the URL and sends a setup frame with tools and both transcriptions", async () => {
    const { p, ws } = setup();
    ws.serverSend({ setupComplete: {} });
    await p;
    expect(ws.url).toContain("access_token=tok123");
    const s = JSON.parse(ws.sent[0]);
    expect(s.setup.model).toBe("models/m1");
    expect(s.setup.generationConfig.responseModalities).toEqual(["AUDIO"]);
    expect(s.setup.tools[0].functionDeclarations.length).toBe(TOOLS.filter((t) => t.tier < 3).length);
    expect(s.setup.inputAudioTranscription).toEqual({});
    expect(s.setup.outputAudioTranscription).toEqual({});
    expect(s.setup.systemInstruction.parts[0].text).toContain("InvestED");
  });
  it("fires onReady once on first setupComplete", async () => {
    const { p, ws, calls } = setup();
    ws.serverSend({ setupComplete: {} });
    await p;
    expect(calls).toEqual(["ready"]);
  });
  it("rejects when the socket closes before setup completes", async () => {
    const { p, ws } = setup();
    ws.serverClose(1006);
    await expect(p).rejects.toThrow("closed_1006");
  });
});

describe("GeminiLiveTransport message routing", () => {
  it("routes transcripts, turn completion and tool calls to events", async () => {
    const { p, ws, calls } = setup();
    ws.serverSend({ setupComplete: {} });
    await p;
    ws.serverSend({ serverContent: { inputTranscription: { text: "מה זה ETF" } } });
    ws.serverSend({ serverContent: { outputTranscription: { text: "קרן סל היא" } } });
    ws.serverSend({ serverContent: { turnComplete: true } });
    ws.serverSend({ toolCall: { functionCalls: [{ id: "1", name: "get_quote", args: { symbol: "AAPL" } }] } });
    expect(calls).toEqual(["ready", "user:מה זה ETF", "model:קרן סל היא", "turn", "tool:get_quote"]);
  });
  it("barge-in: an interrupted frame flushes the player and reports the interruption", async () => {
    const { p, ws, calls, tr } = setup();
    ws.serverSend({ setupComplete: {} });
    await p;
    ws.serverSend({ serverContent: { interrupted: true } });
    expect((tr.player as unknown as { flushed: number }).flushed).toBe(1);
    expect(calls).toContain("interrupted");
  });
  it("audio chunks are decoded and pushed to the player", async () => {
    const { p, ws, tr } = setup();
    ws.serverSend({ setupComplete: {} });
    await p;
    ws.serverSend({ serverContent: { modelTurn: { parts: [{ inlineData: { data: btoa("abcd") } }] } } });
    expect((tr.player as unknown as { pushed: number }).pushed).toBe(1);
  });
  it("malformed frames are ignored", async () => {
    const { p, ws } = setup();
    ws.serverSend({ setupComplete: {} });
    await p;
    ws.onmessage?.({ data: "not json{" });
    ws.serverSend({ serverContent: { turnComplete: true } });
  });
});

describe("GeminiLiveTransport sendAudio and session resumption", () => {
  it("sendAudio only sends while open and connected", async () => {
    const { tr, p, ws } = setup();
    tr.sendAudio(new Int16Array([1, 2]));
    expect(ws.sent.length).toBe(1); // only the setup frame
    ws.serverSend({ setupComplete: {} });
    await p;
    tr.sendAudio(new Int16Array([1, 2]));
    const frame = JSON.parse(ws.sent[1]);
    expect(frame.realtimeInput.audio.mimeType).toBe("audio/pcm;rate=16000");
  });
  it("sends tool results back with their id and name", async () => {
    const { tr, p, ws } = setup();
    ws.serverSend({ setupComplete: {} });
    await p;
    tr.sendToolResult("id9", "get_quote", { ok: true });
    const frame = JSON.parse(ws.sent[1]);
    expect(frame.toolResponse.functionResponses[0]).toMatchObject({ id: "id9", name: "get_quote" });
  });
  it("resumes on an unexpected close using the stored handle, without a second onReady", async () => {
    const { p, ws, calls } = setup();
    ws.serverSend({ setupComplete: {} });
    await p;
    ws.serverSend({ sessionResumptionUpdate: { newHandle: "h1", resumable: true } });
    ws.serverClose(1006);
    await new Promise((r) => setTimeout(r, 0));
    const ws2 = FakeWS.instances[FakeWS.instances.length - 1];
    expect(ws2).not.toBe(ws);
    ws2.serverOpen();
    const setup2 = JSON.parse(ws2.sent[0]);
    expect(setup2.setup.sessionResumption).toEqual({ handle: "h1" });
    ws2.serverSend({ setupComplete: {} });
    await new Promise((r) => setTimeout(r, 0));
    expect(calls.filter((c) => c === "ready")).toHaveLength(1);
  });
  it("gives up after 3 failed resumes and reports the close reason", async () => {
    const { p, ws, calls } = setup();
    ws.serverSend({ setupComplete: {} });
    await p;
    ws.serverSend({ sessionResumptionUpdate: { newHandle: "h1", resumable: true } });
    for (let i = 0; i < 4; i++) {
      const cur = FakeWS.instances[FakeWS.instances.length - 1];
      cur.serverClose(1006);
      await new Promise((r) => setTimeout(r, 0));
      const next = FakeWS.instances[FakeWS.instances.length - 1];
      if (next !== cur) next.serverClose(1006); // resume socket dies before setup
      await new Promise((r) => setTimeout(r, 0));
    }
    expect(calls.filter((c) => c.startsWith("closed:")).length).toBeGreaterThan(0);
  });
  it("close() is terminal: no resume attempts afterwards", async () => {
    const { tr, p, ws, calls } = setup();
    ws.serverSend({ setupComplete: {} });
    await p;
    ws.serverSend({ sessionResumptionUpdate: { newHandle: "h1", resumable: true } });
    tr.close();
    ws.serverClose(1006);
    await new Promise((r) => setTimeout(r, 0));
    expect(FakeWS.instances).toHaveLength(1);
    expect(calls.some((c) => c.startsWith("closed:"))).toBe(false);
    expect((tr.player as unknown as { closed: number }).closed).toBe(1);
  });
});
