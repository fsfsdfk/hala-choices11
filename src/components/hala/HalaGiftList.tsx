"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Heart, Leaf, Search, ArrowLeft, MessageCircle, Sparkles,
  ThumbsUp, ThumbsDown, Circle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import HalaItemModal from "./HalaItemModal";
import HalaChatPanel from "./HalaChatPanel";
import HalaWishlistView from "./HalaWishlistView";
import type { Choice, ItemWithChoice, LikeFilter } from "@/types";
import { createSupabaseClient } from "@/lib/supabase";

interface Props {
  initialItems: ItemWithChoice[];
  categories: string[];
}

function getItemStatus(item: ItemWithChoice): "liked" | "disliked" | "unchosen" {
  const choices = item.choices ?? [];
  const hasApprovedVariant = choices.some((c) => c.variant_id !== null && c.hala_approved);
  if (hasApprovedVariant || item.choice?.hala_approved === true) return "liked";
  const hasDisapproved = item.choice?.hala_approved === false;
  if (hasDisapproved) return "disliked";
  return "unchosen";
}

function hasMultipleOptions(item: ItemWithChoice): boolean {
  const approvedCount = (item.choices ?? []).filter((c) => c.variant_id !== null && c.hala_approved).length;
  return approvedCount > 1;
}

export default function HalaGiftList({ initialItems, categories }: Props) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [healthyOnly, setHealthyOnly] = useState(false);
  const [likeFilter, setLikeFilter] = useState<LikeFilter>("all");
  const [selectedItem, setSelectedItem] = useState<ItemWithChoice | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [chatUnread, setChatUnread] = useState(false);

  const supabase = useMemo(() => createSupabaseClient(), []);

  // Live updates from Supabase
  const refreshItems = useCallback(async () => {
    try {
      const { data: items } = await supabase.from("items").select("*").order("created_at", { ascending: false });
      const { data: variants } = await supabase.from("item_variants").select("*").order("sort_order", { ascending: true });
      const { data: choices } = await supabase.from("choices").select("*");
      if (!items) return;
      const merged = items.map((item) => {
        const itemVariants = (variants ?? []).filter((v) => v.item_id === item.id);
        const itemChoices = (choices ?? []).filter((c) => c.item_id === item.id);
        return {
          ...item,
          variants: itemVariants,
          choices: itemChoices,
          choice: itemChoices.find((c) => c.variant_id === null) ?? null,
        };
      });
      setItems(merged);
      // Update selected item if open
      if (selectedItem) {
        const updated = merged.find((i) => i.id === selectedItem.id);
        if (updated) setSelectedItem(updated);
      }
    } catch (e) {
      console.error(e);
    }
  }, [supabase, selectedItem]);

  useEffect(() => {
    const channel = supabase
      .channel("hala-items-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, refreshItems)
      .on("postgres_changes", { event: "*", schema: "public", table: "item_variants" }, refreshItems)
      .on("postgres_changes", { event: "*", schema: "public", table: "choices" }, refreshItems)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, refreshItems]);

  // Listen for admin chat messages to show unread badge
  useEffect(() => {
    const channel = supabase
      .channel("hala-chat-notif")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const msg = payload.new as { sender: string };
        if (msg.sender === "admin" && !showChat) {
          setChatUnread(true);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, showChat]);

  const allCategories = ["All", ...categories];

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === "All" || item.category === selectedCategory;
      const matchHealthy = !healthyOnly || item.healthy;
      const status = getItemStatus(item);
      const matchLike =
        likeFilter === "all" ||
        (likeFilter === "liked" && status === "liked") ||
        (likeFilter === "disliked" && status === "disliked") ||
        (likeFilter === "unchosen" && status === "unchosen");
      return matchSearch && matchCat && matchHealthy && matchLike;
    });
  }, [items, search, selectedCategory, healthyOnly, likeFilter]);

  function handleChoiceUpdate(itemId: string, choices: Choice[]) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              choices,
              choice: choices.find((c) => c.variant_id === null) ?? null,
            }
          : item
      )
    );
    if (selectedItem?.id === itemId) {
      setSelectedItem((prev) =>
        prev ? { ...prev, choices, choice: choices.find((c) => c.variant_id === null) ?? null } : null
      );
    }
  }

  const likedCount = items.filter((i) => getItemStatus(i) === "liked").length;

  const LIKE_FILTERS: { key: LikeFilter; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "all", label: "All", icon: <Circle size={12} />, color: "#be123c" },
    { key: "liked", label: "❤️ Liked", icon: <ThumbsUp size={12} />, color: "#f43f5e" },
    { key: "disliked", label: "✗ Nope", icon: <ThumbsDown size={12} />, color: "#6b7280" },
    { key: "unchosen", label: "✨ New", icon: <Sparkles size={12} />, color: "#a855f7" },
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at 20% 0%, rgba(253,164,175,0.18) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(250,204,21,0.10) 0%, transparent 50%), #fefdf8",
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-3"
        style={{
          background: "rgba(255,255,255,0.80)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(253,205,211,0.5)",
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link
            href="/hala"
            className="flex items-center gap-1.5 text-rose-400 hover:text-rose-600 transition-colors text-sm"
            style={{ fontFamily: "var(--font-jost)" }}
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </Link>

          <div className="flex-1 text-center">
            <h1
              className="font-display text-2xl sm:text-3xl"
              style={{
                fontFamily: "var(--font-cormorant)",
                background: "linear-gradient(135deg, #be123c, #f43f5e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: 600,
              }}
            >
              Hala&apos;s Choices
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Wishlist icon */}
            <button
              onClick={() => setShowWishlist(true)}
              className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "linear-gradient(135deg, rgba(244,63,94,0.12), rgba(251,207,232,0.2))" }}
              title="View my wishlist"
            >
              <Heart size={16} className="text-rose-500" fill="currentColor" strokeWidth={0} />
              {likedCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                  style={{ background: "#f43f5e" }}
                >
                  {likedCount}
                </span>
              )}
            </button>

            {/* Chat icon */}
            <button
              onClick={() => { setShowChat(true); setChatUnread(false); }}
              className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "rgba(253,164,175,0.12)" }}
              title="Chat with your knight"
            >
              <MessageCircle size={16} className="text-rose-400" />
              {chatUnread && (
                <span
                  className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white"
                  style={{ background: "#f43f5e" }}
                />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-300" size={16} />
          <input
            type="text"
            placeholder="Search your wishes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none"
            style={{
              fontFamily: "var(--font-jost)",
              background: "rgba(255,255,255,0.9)",
              border: "1.5px solid rgba(253,164,175,0.35)",
              color: "#9f1239",
            }}
          />
        </div>

        {/* Like filter row */}
        <div className="flex flex-wrap gap-2 mb-3">
          {LIKE_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setLikeFilter(key)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                fontFamily: "var(--font-jost)",
                background:
                  likeFilter === key
                    ? key === "disliked"
                      ? "rgba(0,0,0,0.65)"
                      : key === "unchosen"
                      ? "linear-gradient(135deg, #a855f7, #7c3aed)"
                      : "linear-gradient(135deg, #f43f5e, #be123c)"
                    : "rgba(255,255,255,0.9)",
                color:
                  likeFilter === key
                    ? "white"
                    : key === "disliked"
                    ? "#6b7280"
                    : key === "unchosen"
                    ? "#7c3aed"
                    : "#be123c",
                border:
                  likeFilter === key
                    ? "none"
                    : key === "disliked"
                    ? "1.5px solid rgba(0,0,0,0.12)"
                    : key === "unchosen"
                    ? "1.5px solid rgba(168,85,247,0.3)"
                    : "1.5px solid rgba(253,164,175,0.45)",
                boxShadow:
                  likeFilter === key
                    ? key === "liked"
                      ? "0 3px 12px rgba(244,63,94,0.3)"
                      : key === "unchosen"
                      ? "0 3px 12px rgba(168,85,247,0.25)"
                      : "0 3px 12px rgba(0,0,0,0.15)"
                    : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Category + Healthy filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                fontFamily: "var(--font-jost)",
                background:
                  selectedCategory === cat
                    ? "linear-gradient(135deg, #f43f5e, #be123c)"
                    : "rgba(255,255,255,0.9)",
                color: selectedCategory === cat ? "white" : "#be123c",
                border:
                  selectedCategory === cat
                    ? "none"
                    : "1.5px solid rgba(253,164,175,0.45)",
                boxShadow:
                  selectedCategory === cat
                    ? "0 3px 12px rgba(244,63,94,0.3)"
                    : "none",
              }}
            >
              {cat}
            </button>
          ))}

          <button
            onClick={() => setHealthyOnly((v) => !v)}
            className="px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ml-auto"
            style={{
              fontFamily: "var(--font-jost)",
              background: healthyOnly
                ? "linear-gradient(135deg, #22c55e, #16a34a)"
                : "rgba(255,255,255,0.9)",
              color: healthyOnly ? "white" : "#16a34a",
              border: healthyOnly ? "none" : "1.5px solid rgba(34,197,94,0.4)",
              boxShadow: healthyOnly ? "0 3px 12px rgba(34,197,94,0.25)" : "none",
            }}
          >
            <Leaf size={12} />
            Healthy
          </button>
        </div>

        {/* Items grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="mx-auto mb-4 text-rose-200" size={48} fill="currentColor" strokeWidth={0} />
            <p className="text-rose-400 font-display text-2xl" style={{ fontFamily: "var(--font-cormorant)" }}>
              Nothing matches yet…
            </p>
            <p className="text-rose-300 text-sm mt-2" style={{ fontFamily: "var(--font-jost)", fontWeight: 300 }}>
              Try a different filter, habibi
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((item, i) => (
              <GiftCard
                key={item.id}
                item={item}
                index={i}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Item detail modal */}
      {selectedItem && (
        <HalaItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onChoiceUpdate={handleChoiceUpdate}
        />
      )}

      {/* Chat panel */}
      {showChat && (
        <HalaChatPanel
          onClose={() => setShowChat(false)}
          hasNewMessage={chatUnread}
          onRead={() => setChatUnread(false)}
        />
      )}

      {/* Wishlist view */}
      {showWishlist && (
        <HalaWishlistView items={items} onClose={() => setShowWishlist(false)} />
      )}
    </div>
  );
}

function GiftCard({ item, index, onClick }: { item: ItemWithChoice; index: number; onClick: () => void }) {
  const status = getItemStatus(item);
  const multiHighlight = hasMultipleOptions(item);
  const approved = status === "liked";
  const disapproved = status === "disliked";

  return (
    <button
      onClick={onClick}
      className="text-left group animate-fade-in"
      style={{ animationDelay: `${0.05 * index}s`, opacity: 0 }}
    >
      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: "white",
          border: multiHighlight
            ? "2.5px solid #f43f5e"
            : approved
            ? "2px solid rgba(244,63,94,0.6)"
            : disapproved
            ? "2px solid rgba(0,0,0,0.07)"
            : "1.5px solid rgba(253,205,211,0.5)",
          boxShadow: multiHighlight
            ? "0 6px 28px rgba(244,63,94,0.35), 0 0 0 3px rgba(244,63,94,0.1)"
            : approved
            ? "0 6px 24px rgba(244,63,94,0.20)"
            : "0 3px 16px rgba(251,113,133,0.08)",
          opacity: disapproved ? 0.5 : 1,
        }}
      >
        {/* Multi-option sparkle badge */}
        {multiHighlight && (
          <div
            className="absolute top-0 left-0 right-0 z-10 flex justify-center"
            style={{ transform: "translateY(-1px)" }}
          >
            <div
              className="text-[9px] px-3 py-0.5 font-semibold text-white flex items-center gap-1"
              style={{
                background: "linear-gradient(90deg, #f43f5e, #be123c)",
                borderRadius: "0 0 10px 10px",
                fontFamily: "var(--font-jost)",
              }}
            >
              <Sparkles size={8} /> Multiple picks!
            </div>
          </div>
        )}

        {/* Image area */}
        <div className="relative w-full aspect-square overflow-hidden bg-rose-50">
          {item.image_urls && item.image_urls.length > 0 ? (
            <Image
              src={item.image_urls[0]}
              alt={item.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Heart size={32} className="text-rose-200" fill="currentColor" strokeWidth={0} />
            </div>
          )}

          {/* Status badge */}
          {status !== "unchosen" && (
            <div
              className="absolute top-2 right-2 rounded-full text-xs px-2 py-0.5 font-medium"
              style={{
                fontFamily: "var(--font-jost)",
                background: approved ? "rgba(244,63,94,0.9)" : "rgba(0,0,0,0.45)",
                color: "white",
                backdropFilter: "blur(4px)",
              }}
            >
              {approved ? "❤️ Want" : "✗ Nope"}
            </div>
          )}

          {/* Healthy badge */}
          {item.healthy && (
            <div
              className="absolute top-2 left-2 rounded-full text-xs px-2 py-0.5 font-medium flex items-center gap-1"
              style={{
                fontFamily: "var(--font-jost)",
                background: "rgba(34,197,94,0.85)",
                color: "white",
                backdropFilter: "blur(4px)",
              }}
            >
              <Leaf size={9} /> Healthy
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p
            className="font-medium text-sm text-rose-900 leading-snug line-clamp-2 mb-1"
            style={{ fontFamily: "var(--font-jost)" }}
          >
            {item.name}
          </p>
          <span
            className="text-xs text-rose-400/80"
            style={{ fontFamily: "var(--font-jost)", fontWeight: 300 }}
          >
            {item.category}
          </span>
        </div>
      </div>
    </button>
  );
}
