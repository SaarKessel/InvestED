/**
 * Consented memory (Phase 4). Facts the user chose to keep, in Supabase tables with owner-only RLS.
 * Order of safety: consent off means nothing is written (also enforced by the table policy), export and
 * delete exist before any write path is used by the app. No model writes here; callers pass explicit facts.
 */
import { getSupabase } from "@/lib/account/supabaseClient";

export interface MemoryItem { kind: string; key: string; value: unknown; source: string; updated_at: string }
export interface MemoryExport { exportedAt: string; consent: boolean; items: MemoryItem[]; savedAnswers: { question: string; answer: string; created_at: string }[] }
type Db = ReturnType<typeof getSupabase>;

export async function getConsent(db: Db = getSupabase()): Promise<boolean> {
  const { data, error } = await db.from("memory_consent").select("enabled").maybeSingle();
  if (error) throw error;
  return !!data?.enabled;
}
export async function setConsent(enabled: boolean, userId: string, db: Db = getSupabase()): Promise<void> {
  const { error } = await db.from("memory_consent").upsert({ user_id: userId, enabled, updated_at: new Date().toISOString() });
  if (error) throw error;
}
/** Refuses to write unless consent is on. Returns false when refused. */
export async function remember(kind: string, key: string, value: unknown, userId: string, source = "user", db: Db = getSupabase()): Promise<boolean> {
  if (!(await getConsent(db))) return false;
  const { error } = await db.from("user_memory").upsert({ user_id: userId, kind: kind.slice(0, 40), key: key.slice(0, 80), value, source: source.slice(0, 80), updated_at: new Date().toISOString() }, { onConflict: "user_id,kind,key" });
  if (error) throw error;
  return true;
}
export async function exportMemory(db: Db = getSupabase()): Promise<MemoryExport> {
  const [c, m, s] = await Promise.all([
    getConsent(db),
    db.from("user_memory").select("kind,key,value,source,updated_at").order("updated_at", { ascending: false }).limit(1000),
    db.from("saved_answers").select("question,answer,created_at").order("created_at", { ascending: false }).limit(1000),
  ]);
  if (m.error) throw m.error;
  if (s.error) throw s.error;
  return { exportedAt: new Date().toISOString(), consent: c, items: (m.data ?? []) as MemoryItem[], savedAnswers: (s.data ?? []) as MemoryExport["savedAnswers"] };
}
/** Deletes every memory row and saved answer of the signed-in user and turns consent off. */
export async function deleteAllMemory(userId: string, db: Db = getSupabase()): Promise<void> {
  const a = await db.from("user_memory").delete().eq("user_id", userId);
  if (a.error) throw a.error;
  const b = await db.from("saved_answers").delete().eq("user_id", userId);
  if (b.error) throw b.error;
  await setConsent(false, userId, db);
}
