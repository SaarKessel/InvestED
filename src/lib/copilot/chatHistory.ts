import { getSupabase } from "@/lib/account/supabaseClient";

export interface ChatConversation { id: string; title: string; updated_at: string }
export interface StoredMessage { role: "user" | "copilot"; text: string }

export const titleFromMessage = (text: string): string => text.replace(/\s+/g, " ").trim().slice(0, 60);

export async function listConversations(): Promise<ChatConversation[]> {
  const { data, error } = await getSupabase().from("chat_conversations").select("id,title,updated_at").order("updated_at", { ascending: false }).limit(30);
  if (error) throw error;
  return data ?? [];
}
export async function loadMessages(conversationId: string): Promise<StoredMessage[]> {
  const { data, error } = await getSupabase().from("chat_messages").select("role,text").eq("conversation_id", conversationId).order("created_at", { ascending: true }).limit(200);
  if (error) throw error;
  return (data ?? []) as StoredMessage[];
}
export async function createConversation(firstMessage: string): Promise<string> {
  const { data, error } = await getSupabase().from("chat_conversations").insert({ title: titleFromMessage(firstMessage) }).select("id").single();
  if (error) throw error;
  return data.id as string;
}
export async function saveMessage(conversationId: string, message: StoredMessage): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("chat_messages").insert({ conversation_id: conversationId, role: message.role, text: message.text.slice(0, 8000) });
  if (error) throw error;
  await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
}
export async function deleteConversation(conversationId: string): Promise<void> {
  const { error } = await getSupabase().from("chat_conversations").delete().eq("id", conversationId);
  if (error) throw error;
}
