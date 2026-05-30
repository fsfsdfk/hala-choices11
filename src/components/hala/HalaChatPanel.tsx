"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, Send, Heart, Sword } from "lucide-react";
import { getChatMessages, sendHalaMessage, toggleChatReaction } from "@/lib/chat-actions";
import type { ChatMessage } from "@/types";
import { CHAT_EMOJIS } from "@/types";
import { createSupabaseClient } from "@/lib/supabase";

interface Props {
  onClose: () => void;
  hasNewMessage: boolean;
  onRead: () => void;
}

export default function HalaChatPanel({ onClose, hasNewMessage, onRead }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [reactingTo, setReactingTo] = useState<string | null>(null); // message id
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createSupabaseClient(), []);

  const load = useCallback(async () => {
    try {
      const msgs = await getChatMessages();
      setMessages(msgs);
      onRead();
    } catch (e) { console.error(e); }
  }, [onRead]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel("hala-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const msg = payload.new as ChatMessage;
        setMessages((prev) => [...prev, { ...msg, reactions: msg.reactions ?? {} }]);
        onRead();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages" }, (payload) => {
        const updated = payload.new as ChatMessage;
        setMessages((prev) => prev.map((m) => m.id === updated.id ? { ...updated, reactions: updated.reactions ?? {} } : m));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, onRead]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    try { await sendHalaMessage(text); } catch (e) { console.error(e); } finally { setSending(false); }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  async function handleReact(msgId: string, emoji: string) {
    setReactingTo(null);
    // Optimistic update
    setMessages((prev) => prev.map((m) => {
      if (m.id !== msgId) return m;
      const reactions = { ...(m.reactions ?? {}) };
      const current = reactions[emoji] ?? [];
      if (current.includes("hala")) {
        const next = current.filter((s) => s !== "hala");
        if (next.length === 0) delete reactions[emoji];
        else reactions[emoji] = next;
      } else {
        reactions[emoji] = [...current, "hala"];
      }
      return { ...m, reactions };
    }));
    try { await toggleChatReaction(msgId, emoji, "hala"); } catch (e) { console.error(e); load(); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={() => { setReactingTo(null); onClose(); }}
    >
      <div
        className="relative w-full sm:max-w-md flex flex-col animate-slide-up"
        style={{ height: "min(600px,90vh)", background: "white", borderRadius: "28px 28px 0 0", boxShadow: "0 -8px 60px rgba(251,113,133,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(253,164,175,0.2)", background: "linear-gradient(135deg,rgba(255,241,242,0.8),rgba(255,255,255,0.9))", borderRadius: "28px 28px 0 0" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f43f5e,#be123c)" }}>
            <Sword size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-rose-900 text-sm" style={{ fontFamily: "var(--font-jost)" }}>Your Knight in Shining Armor 🛡️</p>
            <p className="text-xs text-rose-400" style={{ fontFamily: "var(--font-jost)", fontWeight: 300 }}>Always here for you, my love ❤️</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-rose-50 transition-colors">
            <X size={16} className="text-rose-400" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1" onClick={() => setReactingTo(null)}>
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <Heart size={40} className="text-rose-200 mb-3" fill="currentColor" strokeWidth={0} />
              <p className="text-rose-400 font-display text-xl" style={{ fontFamily: "var(--font-cormorant)" }}>Start the conversation...</p>
              <p className="text-rose-300 text-xs mt-1" style={{ fontFamily: "var(--font-jost)", fontWeight: 300 }}>Your knight is waiting 💕</p>
            </div>
          )}
          {messages.map((msg) => {
            const isHala = msg.sender === "hala";
            const reactionEntries = Object.entries(msg.reactions ?? {}).filter(([, senders]) => senders.length > 0);
            const isPickingReaction = reactingTo === msg.id;

            return (
              <div key={msg.id} className={`flex flex-col ${isHala ? "items-end" : "items-start"} mb-1`}>
                <div className={`flex items-end gap-2 ${isHala ? "flex-row-reverse" : ""}`}>
                  {!isHala && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#f43f5e,#be123c)" }}>
                      <Sword size={12} className="text-white" />
                    </div>
                  )}
                  <div className="relative group">
                    <div
                      className="max-w-[75vw] sm:max-w-[280px] px-4 py-2.5 rounded-2xl text-sm cursor-pointer select-none"
                      style={{
                        fontFamily: "var(--font-jost)",
                        background: isHala ? "linear-gradient(135deg,#f43f5e,#be123c)" : "rgba(253,164,175,0.12)",
                        color: isHala ? "white" : "#9f1239",
                        borderBottomRightRadius: isHala ? "6px" : "18px",
                        borderBottomLeftRadius: !isHala ? "6px" : "18px",
                      }}
                      onDoubleClick={() => setReactingTo(isPickingReaction ? null : msg.id)}
                    >
                      {msg.content}
                    </div>
                    {/* Reaction picker — appears on double-tap/click */}
                    {isPickingReaction && (
                      <div
                        className={`absolute bottom-full ${isHala ? "right-0" : "left-0"} mb-1 flex gap-1 p-2 rounded-2xl shadow-xl z-10 animate-scale-in`}
                        style={{ background: "white", border: "1px solid rgba(253,164,175,0.3)", boxShadow: "0 8px 30px rgba(244,63,94,0.15)" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {CHAT_EMOJIS.map((emoji) => {
                          const active = (msg.reactions?.[emoji] ?? []).includes("hala");
                          return (
                            <button key={emoji} onClick={() => handleReact(msg.id, emoji)}
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all hover:scale-125"
                              style={{ background: active ? "rgba(244,63,94,0.12)" : "transparent", transform: active ? "scale(1.15)" : "scale(1)" }}>
                              {emoji}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                {/* Reaction bubbles */}
                {reactionEntries.length > 0 && (
                  <div className={`flex gap-1 mt-1 ${isHala ? "pr-2" : "pl-9"}`}>
                    {reactionEntries.map(([emoji, senders]) => (
                      <button
                        key={emoji}
                        onClick={() => handleReact(msg.id, emoji)}
                        className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs transition-all hover:scale-110"
                        style={{ background: senders.includes("hala") ? "rgba(244,63,94,0.1)" : "rgba(0,0,0,0.05)", border: senders.includes("hala") ? "1px solid rgba(244,63,94,0.3)" : "1px solid rgba(0,0,0,0.08)" }}
                      >
                        <span>{emoji}</span>
                        {senders.length > 1 && <span className="text-gray-500" style={{ fontFamily: "var(--font-jost)", fontSize: "10px" }}>{senders.length}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {/* Tap hint — only shown if no reactions yet */}
                {reactionEntries.length === 0 && !isPickingReaction && (
                  <p className={`text-[10px] text-gray-300 mt-0.5 ${isHala ? "pr-2" : "pl-9"} opacity-0 group-hover:opacity-100 transition-opacity`}
                    style={{ fontFamily: "var(--font-jost)" }}>
                    double-tap to react
                  </p>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 flex items-center gap-2 flex-shrink-0" style={{ borderTop: "1px solid rgba(253,164,175,0.2)" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Write something sweet…"
            rows={1}
            className="flex-1 resize-none outline-none text-sm py-2.5 px-4 rounded-2xl"
            style={{ fontFamily: "var(--font-jost)", background: "rgba(253,164,175,0.08)", border: "1.5px solid rgba(253,164,175,0.25)", color: "#9f1239", maxHeight: "100px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0"
            style={{ background: input.trim() && !sending ? "linear-gradient(135deg,#f43f5e,#be123c)" : "rgba(253,164,175,0.2)", boxShadow: input.trim() ? "0 3px 12px rgba(244,63,94,0.3)" : "none" }}
          >
            <Send size={16} className={input.trim() && !sending ? "text-white" : "text-rose-300"} />
          </button>
        </div>
      </div>
    </div>
  );
}
