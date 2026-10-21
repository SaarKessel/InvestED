import { afterEach, describe, expect, it, vi } from "vitest";
import { rephraseWithGatewayStream } from "./copilotGateway";
import { encodeFactsTrailer, VERDICT_OK } from "./streamGateway";
import type { CopilotResponse } from "../copilotResponse";

const response = { text: "VOO trades at 612.5.", intent: "quote", assets: [] } as unknown as CopilotResponse;

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({ start(c) { for (const ch of chunks) c.enqueue(enc.encode(ch)); c.close(); } });
}

afterEach(() => vi.unstubAllGlobals());

describe("rephraseWithGatewayStream", () => {
  it("streams chunks progressively and returns verified text plus tool facts", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(streamOf(["VOO ", "trades ", "at 612.5.", `${encodeFactsTrailer(["quote VOO: 612.5"])}${VERDICT_OK}`]))));
    const seen: string[] = [];
    const out = await rephraseWithGatewayStream("price of VOO?", "en", response, { onChunk: (t) => seen.push(t) });
    expect(out?.ok).toBe(true);
    expect(out?.text).toBe("VOO trades at 612.5.");
    expect(out?.acceptedFacts).toEqual(["quote VOO: 612.5"]);
    expect(seen.length).toBeGreaterThanOrEqual(3);
    expect(seen.at(-1)).toBe("VOO trades at 612.5.");
  });
  it("sends botId when provided", async () => {
    const spy = vi.fn(async () => new Response(streamOf([`ok${VERDICT_OK}`])));
    vi.stubGlobal("fetch", spy);
    await rephraseWithGatewayStream("q", "he", response, { botId: "investing" });
    expect(JSON.parse(String((spy.mock.calls[0][1] as RequestInit).body)).botId).toBe("investing");
  });
  it("returns null without an ok verdict and on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(streamOf(["dangling text"]))));
    expect(await rephraseWithGatewayStream("q", "en", response)).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    expect(await rephraseWithGatewayStream("q", "en", response)).toBeNull();
  });
});
