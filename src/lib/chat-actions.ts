"use server";

import { createSupabaseClient, createServiceClient } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/auth";

export interface ChatMessage {
  id: string;
  sender: "admin" | "hala";
  content: string;
  created_at: string;
}

export async function getChatMessages(): Promise<ChatMessage[]> {
  const { data, error } = await createSupabaseClient()
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function sendHalaMessage(content: string): Promise<void> {
  const trimmed = content.trim();
  if (!trimmed) return;
  const { error } = await createSupabaseClient()
    .from("chat_messages")
    .insert({ sender: "hala", content: trimmed });
  if (error) throw new Error(error.message);
}

export async function sendAdminMessage(content: string): Promise<void> {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("Unauthorized");
  const trimmed = content.trim();
  if (!trimmed) return;
  const { error } = await createServiceClient()
    .from("chat_messages")
    .insert({ sender: "admin", content: trimmed });
  if (error) throw new Error(error.message);
}
