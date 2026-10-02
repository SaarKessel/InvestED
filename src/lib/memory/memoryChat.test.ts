import { describe, expect, it, vi } from "vitest";
import { runMemoryCommand } from "./memoryChat";
import type { MemoryApi } from "./memoryApi";

const api = (over: Partial<MemoryApi> = {}): MemoryApi => ({ getConsent: vi.fn(), setConsent: vi.fn(), deleteAll: vi.fn(), remember: vi.fn().mockResolvedValue(true), missedQuiz: vi.fn().mockResolvedValue([]), noteMissedQuiz: vi.fn().mockResolvedValue(true), clearMissedQuiz: vi.fn().mockResolvedValue(undefined), exportMemory: vi.fn().mockResolvedValue({ exportedAt: "x", consent: true, items: [{ kind: "note", key: "n1", value: "flat", source: "chat", updated_at: "x" }], savedAnswers: [] }), ...over });

describe("runMemoryCommand", () => {
  it("saves a note when consent is on", async () => {
    const a = api();
    expect(await runMemoryCommand({ kind: "remember", value: "flat" }, a, "en")).toContain('Saved this note: "flat"');
    expect(a.remember).toHaveBeenCalledWith("flat");
  });
  it("says nothing was saved when consent is off", async () => {
    const out = await runMemoryCommand({ kind: "remember", value: "flat" }, api({ remember: vi.fn().mockResolvedValue(false) }), "en");
    expect(out).toContain("saved nothing");
  });
  it("lists notes, and never deletes from chat", async () => {
    const a = api();
    expect(await runMemoryCommand({ kind: "list" }, a, "he")).toContain("1. flat");
    expect(await runMemoryCommand({ kind: "forget" }, a, "en")).toContain("Delete all my memory");
    expect(a.deleteAll).not.toHaveBeenCalled();
  });
  it("handles signed-out and failures", async () => {
    expect(await runMemoryCommand({ kind: "list" }, undefined, "en")).toContain("Sign in");
    expect(await runMemoryCommand({ kind: "list" }, api({ exportMemory: vi.fn().mockRejectedValue(new Error("x")) }), "en")).toContain("not available");
  });
});
