"use server";

import { createSupabaseClient, createServiceClient } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/auth";
import type { ChatMessage } from "@/types";

export type { ChatMessage };

export async function getChatMessages(): Promise<ChatMessage[]> {
  const { data, error } = await createSupabaseClient()
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []).map((m) => ({ ...m, reactions: m.reactions ?? {} }));
}

export async function sendHalaMessage(content: string): Promise<void> {
  const trimmed = content.trim();
  if (!trimmed) return;
  const { error } = await createSupabaseClient()
    .from("chat_messages")
    .insert({ sender: "hala", content: trimmed, reactions: {} });
  if (error) throw new Error(error.message);
}

export async function sendAdminMessage(content: string): Promise<void> {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("Unauthorized");
  const trimmed = content.trim();
  if (!trimmed) return;
  const { error } = await createServiceClient()
    .from("chat_messages")
    .insert({ sender: "admin", content: trimmed, reactions: {} });
  if (error) throw new Error(error.message);
}

/**
 * Toggle an emoji reaction on a chat message.
 * sender: who is reacting ("hala" or "admin")
 */
export async function toggleChatReaction(
  messageId: string,
  emoji: string,
  sender: "hala" | "admin"
): Promise<void> {
  // Fetch current reactions
  const db = createServiceClient();
  const { data, error } = await db
    .from("chat_messages")
    .select("reactions")
    .eq("id", messageId)
    .single();
  if (error) throw new Error(error.message);

  const reactions: Record<string, string[]> = data?.reactions ?? {};
  const current = reactions[emoji] ?? [];
  const already = current.includes(sender);
  const updated = already
    ? current.filter((s) => s !== sender)
    : [...current, sender];

  if (updated.length === 0) {
    delete reactions[emoji];
  } else {
    reactions[emoji] = updated;
  }

  const { error: updateErr } = await db
    .from("chat_messages")
    .update({ reactions })
    .eq("id", messageId);
  if (updateErr) throw new Error(updateErr.message);
}
