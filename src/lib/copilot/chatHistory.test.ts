import { describe, it, expect, vi, beforeEach } from "vitest";

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));
vi.mock("@/lib/account/supabaseClient", () => ({ getSupabase: () => ({ from: fromMock }) }));

import { titleFromMessage, listConversations, loadMessages, createConversation, saveMessage, deleteConversation } from "./chatHistory";

type Res = { data?: unknown; error?: unknown };
const chain = (res: Res) => {
  const c: Record<string, unknown> = {};
  const self = () => c;
  for (const m of ["select", "order", "limit", "eq", "insert", "update", "delete"]) c[m] = vi.fn(self);
  c.single = vi.fn(() => Promise.resolve(res));
  return Object.assign(c, { then: (ok: (r: Res) => unknown) => Promise.resolve(ok(res)) });
};

beforeEach(() => fromMock.mockReset());

describe("titleFromMessage", () => {
  it("collapses whitespace and caps at 60 chars", () => {
    expect(titleFromMessage("  what\nis   an ETF?  ")).toBe("what is an ETF?");
    expect(titleFromMessage("x".repeat(200)).length).toBeLessThanOrEqual(60);
  });
  it("handles Hebrew without mangling", () => {
    expect(titleFromMessage("מה זה קרן סל?")).toBe("מה זה קרן סל?");
  });
});

describe("chatHistory supabase calls", () => {
  it("listConversations queries newest 30", async () => {
    const c = chain({ data: [{ id: "1", title: "t", updated_at: "u" }] });
    fromMock.mockReturnValue(c);
    const out = await listConversations();
    expect(fromMock).toHaveBeenCalledWith("chat_conversations");
    expect(c.order).toHaveBeenCalledWith("updated_at", { ascending: false });
    expect(c.limit).toHaveBeenCalledWith(30);
    expect(out).toHaveLength(1);
  });
  it("listConversations returns [] on null data and throws on error", async () => {
    fromMock.mockReturnValue(chain({ data: null }));
    expect(await listConversations()).toEqual([]);
    fromMock.mockReturnValue(chain({ error: new Error("db down") }));
    await expect(listConversations()).rejects.toThrow("db down");
  });
  it("loadMessages scopes to the conversation, oldest first, capped at 200", async () => {
    const c = chain({ data: [] });
    fromMock.mockReturnValue(c);
    await loadMessages("conv-9");
    expect(c.eq).toHaveBeenCalledWith("conversation_id", "conv-9");
    expect(c.order).toHaveBeenCalledWith("created_at", { ascending: true });
    expect(c.limit).toHaveBeenCalledWith(200);
  });
  it("createConversation stores a title derived from the first message", async () => {
    const c = chain({ data: { id: "new-id" } });
    fromMock.mockReturnValue(c);
    const id = await createConversation("  hello   world ");
    expect(c.insert).toHaveBeenCalledWith({ title: "hello world" });
    expect(id).toBe("new-id");
  });
  it("saveMessage slices text at 8000 chars and bumps updated_at", async () => {
    const c = chain({});
    fromMock.mockReturnValue(c);
    await saveMessage("c1", { role: "copilot", text: "y".repeat(9000) });
    const inserted = (c.insert as ReturnType<typeof vi.fn>).mock.calls[0][0] as { conversation_id: string; role: string; text: string };
    expect(inserted.conversation_id).toBe("c1");
    expect(inserted.text.length).toBeLessThanOrEqual(8000);
    expect(c.update).toHaveBeenCalled();
  });
  it("deleteConversation targets the id and throws on error", async () => {
    const c = chain({});
    fromMock.mockReturnValue(c);
    await deleteConversation("c7");
    expect(c.eq).toHaveBeenCalledWith("id", "c7");
    fromMock.mockReturnValue(chain({ error: new Error("nope") }));
    await expect(deleteConversation("c7")).rejects.toThrow("nope");
  });
});
