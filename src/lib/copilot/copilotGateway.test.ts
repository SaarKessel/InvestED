import { afterEach, describe, expect, it, vi } from "vitest";
import { rephraseWithGateway } from "./copilotGateway";
import type { CopilotResponse } from "../copilotResponse";

const deterministic = {
  text: "VOO trades at 706.07 USD. Educational data, not advice.",
  language: "en",
  intent: "asset_analysis",
  assets: [],
  calculation: null,
  comparison: null,
  strategies: [],
  strategyFit: null,
  profileContextUsed: false,
  dataDependencies: [],
  dataSources: [],
  dataFreshness: [],
  clarification: null,
  holdingValuation: null,
  purchasePower: null,
  toolResult: null,
} as unknown as CopilotResponse;

afterEach(() => vi.unstubAllGlobals());

describe("rephraseWithGateway", () => {
  it("returns the rephrased text on success", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ text: "VOO is at $706.07 today." }), { status: 200 })));
    expect(await rephraseWithGateway("VOO price?", "en", deterministic)).toBe("VOO is at $706.07 today.");
  });

  it("returns null when the endpoint asks to fall back", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ fallback: true, reason: "gateway_429" }), { status: 200 })));
    expect(await rephraseWithGateway("VOO price?", "en", deterministic)).toBeNull();
  });

  it("returns null on HTTP errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("oops", { status: 500 })));
    expect(await rephraseWithGateway("VOO price?", "en", deterministic)).toBeNull();
  });

  it("returns null on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    expect(await rephraseWithGateway("VOO price?", "en", deterministic)).toBeNull();
  });

  it("returns null on empty or malformed success bodies", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ text: "   " }), { status: 200 })));
    expect(await rephraseWithGateway("VOO price?", "en", deterministic)).toBeNull();
  });
});
