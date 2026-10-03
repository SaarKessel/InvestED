import { safeSlice } from "@/lib/copilot/safeSlice";
import { getSupabase } from "../account/supabaseClient";
import { relevantHits, tokenizeQuestion, type KnowledgeItem } from "./knowledge";

/** Best-effort: any failure returns an empty list so the chat never depends on this. */
export async function searchKnowledge(question: string): Promise<KnowledgeItem[]> {
  try {
    const tokens = tokenizeQuestion(question);
    if (!tokens.length) return [];
    const { data, error } = await getSupabase().rpc("search_knowledge", { tokens, lim: 5 });
    if (error || !Array.isArray(data)) return [];
    return relevantHits(question, data as KnowledgeItem[]);
  } catch { return []; }
}

export async function recordGap(question: string, lang: string, reason: "no_hit" | "thumbs_down"): Promise<void> {
  try { await getSupabase().from("knowledge_gaps").insert({ question: safeSlice(question, 500), lang, reason }); } catch { /* best effort */ }
}

export async function submitFeedback(question: string, rating: 1 | -1, knowledgeIds: string[], lang: string): Promise<boolean> {
  try {
    const { error } = await getSupabase().from("answer_feedback").insert({ question: safeSlice(question, 1000), rating, knowledge_ids: knowledgeIds, lang });
    if (error) return false;
    if (rating === -1) await recordGap(question, lang, "thumbs_down");
    return true;
  } catch { return false; }
}

export async function isOwner(): Promise<boolean> {
  try { const { data } = await getSupabase().rpc("is_owner"); return data === true; } catch { return false; }
}

export interface KnowledgeStats { items: number; up: number; down: number; gaps: number }

export async function loadOwnerData() {
  const sb = getSupabase();
  const [items, gaps, fb] = await Promise.all([
    sb.from("knowledge_items").select("id,title,body,lang,source_label,source_url,published_at,kind,created_at").order("created_at", { ascending: false }).limit(200),
    sb.from("knowledge_gaps").select("id,question,lang,reason,created_at").order("created_at", { ascending: false }).limit(100),
    sb.from("answer_feedback").select("rating").limit(5000),
  ]);
  const ratings = (fb.data ?? []) as Array<{ rating: number }>;
  return {
    items: (items.data ?? []) as Array<KnowledgeItem & { kind: string; created_at: string }>,
    gaps: (gaps.data ?? []) as Array<{ id: string; question: string; lang: string; reason: string; created_at: string }>,
    stats: { items: items.data?.length ?? 0, up: ratings.filter((r) => r.rating === 1).length, down: ratings.filter((r) => r.rating === -1).length, gaps: gaps.data?.length ?? 0 } as KnowledgeStats,
  };
}

export async function addKnowledge(item: { title: string; body: string; lang: "he" | "en"; source_label: string; source_url: string | null; kind?: "curated" | "feed"; published_at?: string | null }): Promise<string | null> {
  const { error } = await getSupabase().from("knowledge_items").insert({ kind: "curated", ...item });
  return error ? error.message : null;
}
export async function deleteKnowledge(id: string): Promise<void> { await getSupabase().from("knowledge_items").delete().eq("id", id); }
export async function deleteGap(id: string): Promise<void> { await getSupabase().from("knowledge_gaps").delete().eq("id", id); }

export async function importFeeds(notes: Array<{ title: string; body: string; lang: "he" | "en"; source_label: string; source_url: string | null; published_at: string | null }>): Promise<number> {
  const sb = getSupabase();
  let n = 0;
  for (const note of notes) {
    await sb.from("knowledge_items").delete().eq("kind", "feed").eq("title", note.title);
    const { error } = await sb.from("knowledge_items").insert({ kind: "feed", ...note });
    if (!error) n += 1;
  }
  return n;
}
