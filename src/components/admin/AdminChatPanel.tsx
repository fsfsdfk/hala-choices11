"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, Send, Heart, Sword } from "lucide-react";
import { getChatMessages, sendAdminMessage, toggleChatReaction } from "@/lib/chat-actions";
import type { ChatMessage } from "@/types";
import { CHAT_EMOJIS } from "@/types";
import { createSupabaseClient } from "@/lib/supabase";

interface Props { onClose: () => void; }

export default function AdminChatPanel({ onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [reactingTo, setReactingTo] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createSupabaseClient(), []);

  const load = useCallback(async () => {
    try {
      const msgs = await getChatMessages();
      setMessages(msgs);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const msg = payload.new as ChatMessage;
        setMessages((prev) => [...prev, { ...msg, reactions: msg.reactions ?? {} }]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages" }, (payload) => {
        const updated = payload.new as ChatMessage;
        setMessages((prev) => prev.map((m) => m.id === updated.id ? { ...updated, reactions: updated.reactions ?? {} } : m));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true); setInput("");
    try { await sendAdminMessage(text); } catch (e) { console.error(e); } finally { setSending(false); }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  async function handleReact(msgId: string, emoji: string) {
    setReactingTo(null);
    setMessages((prev) => prev.map((m) => {
      if (m.id !== msgId) return m;
      const reactions = { ...(m.reactions ?? {}) };
      const current = reactions[emoji] ?? [];
      if (current.includes("admin")) {
        const next = current.filter((s) => s !== "admin");
        if (next.length === 0) delete reactions[emoji];
        else reactions[emoji] = next;
      } else {
        reactions[emoji] = [...current, "admin"];
      }
      return { ...m, reactions };
    }));
    try { await toggleChatReaction(msgId, emoji, "admin"); } catch (e) { console.error(e); load(); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={() => { setReactingTo(null); onClose(); }}
    >
      <div
        className="relative w-full sm:max-w-md flex flex-col"
        style={{ height: "min(620px,90vh)", background: "white", borderRadius: "28px 28px 0 0", boxShadow: "0 -8px 60px rgba(251,113,133,0.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "linear-gradient(135deg,#1a0a0f,#2d0718)", borderRadius: "28px 28px 0 0" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f43f5e,#be123c)" }}>
            <Heart size={18} className="text-white" fill="currentColor" strokeWidth={0} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-rose-100 text-sm" style={{ fontFamily: "var(--font-jost)" }}>Chat with Hala 💌</p>
            <p className="text-xs text-rose-400" style={{ fontFamily: "var(--font-jost)", fontWeight: 300 }}>She sees you as her knight in shining armor 🛡️</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <X size={16} className="text-rose-300" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1" onClick={() => setReactingTo(null)}>
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <Sword size={36} className="text-rose-200 mb-3" />
              <p className="text-rose-400 text-lg" style={{ fontFamily: "var(--font-cormorant)" }}>Send her a message, my lord</p>
              <p className="text-rose-300 text-xs mt-1" style={{ fontFamily: "var(--font-jost)", fontWeight: 300 }}>She&apos;s waiting to hear from you 💕</p>
            </div>
          )}
          {messages.map((msg) => {
            const isAdmin = msg.sender === "admin";
            const reactionEntries = Object.entries(msg.reactions ?? {}).filter(([, senders]) => senders.length > 0);
            const isPickingReaction = reactingTo === msg.id;

            return (
              <div key={msg.id} className={`flex flex-col ${isAdmin ? "items-end" : "items-start"} mb-1`}>
                <div className={`flex items-end gap-2 ${isAdmin ? "flex-row-reverse" : ""}`}>
                  {!isAdmin && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#fda4af,#f43f5e)" }}>
                      <Heart size={12} className="text-white" fill="currentColor" strokeWidth={0} />
                    </div>
                  )}
                  <div className="relative group">
                    <div
                      className="flex flex-col gap-0.5 max-w-[75vw] sm:max-w-[280px] cursor-pointer"
                      onDoubleClick={() => setReactingTo(isPickingReaction ? null : msg.id)}
                    >
                      <div
                        className="px-4 py-2.5 rounded-2xl text-sm"
                        style={{
                          fontFamily: "var(--font-jost)",
                          background: isAdmin ? "linear-gradient(135deg,#1a0a0f,#be123c)" : "rgba(253,164,175,0.15)",
                          color: isAdmin ? "white" : "#9f1239",
                          borderBottomRightRadius: isAdmin ? "6px" : "18px",
                          borderBottomLeftRadius: !isAdmin ? "6px" : "18px",
                        }}
                      >
                        {msg.content}
                      </div>
                      <p className={`text-[10px] text-gray-400 ${isAdmin ? "text-right" : "text-left"} px-1`} style={{ fontFamily: "var(--font-jost)" }}>
                        {isAdmin ? "You (Knight 🛡️)" : "Hala 💕"} · {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {isPickingReaction && (
                      <div
                        className={`absolute bottom-full ${isAdmin ? "right-0" : "left-0"} mb-1 flex gap-1 p-2 rounded-2xl shadow-xl z-10 animate-scale-in`}
                        style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {CHAT_EMOJIS.map((emoji) => {
                          const active = (msg.reactions?.[emoji] ?? []).includes("admin");
                          return (
                            <button key={emoji} onClick={() => handleReact(msg.id, emoji)}
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all hover:scale-125"
                              style={{ background: active ? "rgba(190,18,60,0.1)" : "transparent", transform: active ? "scale(1.15)" : "scale(1)" }}>
                              {emoji}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                {reactionEntries.length > 0 && (
                  <div className={`flex gap-1 mt-1 ${isAdmin ? "pr-2" : "pl-9"}`}>
                    {reactionEntries.map(([emoji, senders]) => (
                      <button
                        key={emoji}
                        onClick={() => handleReact(msg.id, emoji)}
                        className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs transition-all hover:scale-110"
                        style={{ background: senders.includes("admin") ? "rgba(190,18,60,0.08)" : "rgba(0,0,0,0.05)", border: senders.includes("admin") ? "1px solid rgba(190,18,60,0.25)" : "1px solid rgba(0,0,0,0.08)" }}
                      >
                        <span>{emoji}</span>
                        {senders.length > 1 && <span className="text-gray-400" style={{ fontFamily: "var(--font-jost)", fontSize: "10px" }}>{senders.length}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 flex items-center gap-2 flex-shrink-0" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message to Hala…"
            rows={1}
            className="flex-1 resize-none outline-none text-sm py-2.5 px-4 rounded-2xl"
            style={{ fontFamily: "var(--font-jost)", background: "rgba(0,0,0,0.04)", border: "1.5px solid rgba(0,0,0,0.09)", color: "#1a1a2e", maxHeight: "100px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0"
            style={{ background: input.trim() && !sending ? "linear-gradient(135deg,#1a0a0f,#be123c)" : "rgba(0,0,0,0.07)", boxShadow: input.trim() ? "0 3px 12px rgba(190,18,60,0.25)" : "none" }}
          >
            <Send size={16} className={input.trim() && !sending ? "text-white" : "text-gray-400"} />
          </button>
        </div>
      </div>
    </div>
  );
}
