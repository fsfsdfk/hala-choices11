"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X, Heart, ThumbsDown, ChevronLeft, ChevronRight,
  Leaf, CheckCircle2, RotateCcw, Pencil, SmilePlus,
} from "lucide-react";
import Image from "next/image";
import type { ItemWithChoice, Choice, ItemReaction } from "@/types";
import { ITEM_EMOJIS } from "@/types";
import { submitChoice, removeChoice, upsertItemReaction, removeItemReaction } from "@/lib/actions";
import { getRandomFlirtyMessage } from "@/types";

interface Props {
  item: ItemWithChoice;
  onClose: () => void;
  onChoiceUpdate: (itemId: string, choices: Choice[], reaction?: ItemReaction | null) => void;
}

export default function HalaItemModal({ item, onClose, onChoiceUpdate }: Props) {
  const [currentImage, setCurrentImage] = useState(0);
  const [flirtyMsg, setFlirtyMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [localChoices, setLocalChoices] = useState<Choice[]>(item.choices ?? []);
  const [localReaction, setLocalReaction] = useState<ItemReaction | null>(item.reaction ?? null);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  // Note / emoji panel state
  const [showNotePanel, setShowNotePanel] = useState(false);
  const [noteInput, setNoteInput] = useState(item.reaction?.note ?? "");
  const [savingNote, setSavingNote] = useState(false);

  // Sync when parent refreshes
  useEffect(() => {
    setLocalChoices(item.choices ?? []);
    setLocalReaction(item.reaction ?? null);
    setNoteInput(item.reaction?.note ?? "");
  }, [item.choices, item.reaction]);

  const hasVariants = item.variants && item.variants.length > 0;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const spawnHearts = useCallback(() => {
    const newHearts = Array.from({ length: 15 }, (_, i) => ({
      id: Date.now() + i,
      x: 30 + Math.random() * 40,
      y: 40 + Math.random() * 30,
    }));
    setHearts(newHearts);
    setTimeout(() => setHearts([]), 1800);
  }, []);

  // ── Helpers ──
  function getVariantChoice(variantId: string): Choice | undefined {
    return localChoices.find((c) => c.variant_id === variantId);
  }
  function getBaseChoice(): Choice | undefined {
    return localChoices.find((c) => c.variant_id === null);
  }
  function isVariantChosen(variantId: string) { return getVariantChoice(variantId)?.hala_approved === true; }
  function isVariantDisliked(variantId: string) { return getVariantChoice(variantId)?.hala_approved === false; }
  function isItemChosen() { return getBaseChoice()?.hala_approved === true; }
  function isItemDisliked() { return getBaseChoice()?.hala_approved === false; }
  function hasItemChoice() { return getBaseChoice() !== undefined; }

  function applyChoices(updated: Choice[], reaction?: ItemReaction | null) {
    setLocalChoices(updated);
    onChoiceUpdate(item.id, updated, reaction !== undefined ? reaction : localReaction);
  }

  // ── Variant actions — 3-state cycle: unchosen → ❤️ → ✗ → unchosen ──
  async function handleVariantCycle(variantId: string) {
    setLoading(variantId);
    const currentChoice = getVariantChoice(variantId);
    try {
      if (!currentChoice) {
        // unchosen → ❤️
        await submitChoice(item.id, true, variantId);
        const without = localChoices.filter((c) => c.variant_id !== variantId);
        applyChoices([...without, { id: "tmp-" + variantId, item_id: item.id, variant_id: variantId, hala_approved: true, chosen_at: new Date().toISOString() }]);
        setFlirtyMsg(getRandomFlirtyMessage()); spawnHearts();
      } else if (currentChoice.hala_approved) {
        // ❤️ → ✗
        await submitChoice(item.id, false, variantId);
        const without = localChoices.filter((c) => c.variant_id !== variantId);
        applyChoices([...without, { id: "tmp-" + variantId, item_id: item.id, variant_id: variantId, hala_approved: false, chosen_at: new Date().toISOString() }]);
        setFlirtyMsg(null);
      } else {
        // ✗ → unchosen
        await removeChoice(item.id, variantId);
        applyChoices(localChoices.filter((c) => c.variant_id !== variantId));
        setFlirtyMsg(null);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(null); }
  }

  async function handleVariantUndo(variantId: string) {
    setLoading("undo-" + variantId);
    try {
      await removeChoice(item.id, variantId);
      applyChoices(localChoices.filter((c) => c.variant_id !== variantId));
      setFlirtyMsg(null);
    } catch (e) { console.error(e); }
    finally { setLoading(null); }
  }

  // ── Item-level actions ──
  async function handleApprove() {
    setLoading("item");
    try {
      await submitChoice(item.id, true, null);
      const withoutBase = localChoices.filter((c) => c.variant_id !== null);
      applyChoices([...withoutBase, { id: "tmp-item", item_id: item.id, variant_id: null, hala_approved: true, chosen_at: new Date().toISOString() }]);
      setFlirtyMsg(getRandomFlirtyMessage()); spawnHearts();
    } catch (e) { console.error(e); }
    finally { setLoading(null); }
  }

  async function handleDisapprove() {
    setLoading("item");
    try {
      await submitChoice(item.id, false, null);
      const withoutBase = localChoices.filter((c) => c.variant_id !== null);
      applyChoices([...withoutBase, { id: "tmp-item", item_id: item.id, variant_id: null, hala_approved: false, chosen_at: new Date().toISOString() }]);
      setFlirtyMsg(null);
    } catch (e) { console.error(e); }
    finally { setLoading(null); }
  }

  async function handleUndo() {
    setLoading("undo");
    try {
      await removeChoice(item.id, null);
      applyChoices(localChoices.filter((c) => c.variant_id !== null));
      setFlirtyMsg(null);
    } catch (e) { console.error(e); }
    finally { setLoading(null); }
  }

  // ── Emoji reaction on item ──
  async function handleEmojiReact(emoji: string) {
    const isSame = localReaction?.emoji === emoji && !localReaction?.note;
    try {
      if (isSame) {
        await removeItemReaction(item.id);
        setLocalReaction(null);
        onChoiceUpdate(item.id, localChoices, null);
      } else {
        await upsertItemReaction(item.id, emoji, localReaction?.note ?? null);
        const updated = { id: localReaction?.id ?? "tmp-r", item_id: item.id, emoji, note: localReaction?.note ?? null, created_at: localReaction?.created_at ?? new Date().toISOString(), updated_at: new Date().toISOString() };
        setLocalReaction(updated);
        onChoiceUpdate(item.id, localChoices, updated);
      }
    } catch (e) { console.error(e); }
  }

  // ── Note save ──
  async function handleSaveNote() {
    setSavingNote(true);
    try {
      const trimmed = noteInput.trim();
      if (!trimmed && !localReaction?.emoji) {
        await removeItemReaction(item.id);
        setLocalReaction(null);
        onChoiceUpdate(item.id, localChoices, null);
      } else {
        await upsertItemReaction(item.id, localReaction?.emoji ?? null, trimmed || null);
        const updated = { id: localReaction?.id ?? "tmp-r", item_id: item.id, emoji: localReaction?.emoji ?? null, note: trimmed || null, created_at: localReaction?.created_at ?? new Date().toISOString(), updated_at: new Date().toISOString() };
        setLocalReaction(updated);
        onChoiceUpdate(item.id, localChoices, updated);
      }
      setShowNotePanel(false);
    } catch (e) { console.error(e); }
    finally { setSavingNote(false); }
  }

  const images = item.image_urls && item.image_urls.length > 0 ? item.image_urls : [];
  const chosenVariantCount = localChoices.filter((c) => c.variant_id !== null && c.hala_approved).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[95vh] overflow-y-auto animate-slide-up"
        style={{ background: "white", borderRadius: "28px 28px 0 0", boxShadow: "0 -8px 60px rgba(251,113,133,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image carousel */}
        <div className="relative w-full aspect-[4/3] bg-rose-50" style={{ borderRadius: "28px 28px 0 0", overflow: "hidden" }}>
          {images.length > 0 ? (
            <>
              <Image src={images[currentImage]} alt={item.name} fill className="object-cover" sizes="(max-width:640px) 100vw,512px" priority />
              {images.length > 1 && (
                <>
                  <button onClick={() => setCurrentImage((i) => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(4px)" }}>
                    <ChevronLeft size={18} className="text-rose-700" />
                  </button>
                  <button onClick={() => setCurrentImage((i) => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(4px)" }}>
                    <ChevronRight size={18} className="text-rose-700" />
                  </button>
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setCurrentImage(i)} className="rounded-full transition-all" style={{ width: i === currentImage ? "18px" : "6px", height: "6px", background: i === currentImage ? "#f43f5e" : "rgba(255,255,255,0.6)" }} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Heart size={64} className="text-rose-200" fill="currentColor" strokeWidth={0} />
            </div>
          )}
          <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.80)", backdropFilter: "blur(4px)" }}>
            <X size={18} className="text-rose-700" />
          </button>
          {hearts.map((h) => (
            <div key={h.id} className="absolute pointer-events-none text-2xl" style={{ left: `${h.x}%`, top: `${h.y}%`, animation: "floatUp 1.5s ease-out forwards" }}>❤️</div>
          ))}
        </div>

        <div className="px-6 py-5">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3">
            <span className="badge badge-rose" style={{ fontFamily: "var(--font-jost)" }}>{item.category}</span>
            {item.healthy && (
              <span className="badge badge-green flex items-center gap-1" style={{ fontFamily: "var(--font-jost)" }}>
                <Leaf size={10} /> Healthy
              </span>
            )}
          </div>

          {/* Name */}
          <h2 className="font-display text-3xl font-semibold mb-3 leading-tight" style={{ fontFamily: "var(--font-cormorant)", color: "#9f1239" }}>
            {item.name}
          </h2>

          {/* Description */}
          {item.description && (
            <p className="text-sm leading-relaxed mb-5 text-rose-900/70" style={{ fontFamily: "var(--font-jost)", fontWeight: 300 }}>
              {item.description}
            </p>
          )}

          {/* Flirty message */}
          {flirtyMsg && (
            <div className="mb-5 px-5 py-4 rounded-2xl animate-scale-in" style={{ background: "linear-gradient(135deg,rgba(244,63,94,0.08),rgba(251,207,232,0.15))", border: "1px solid rgba(244,63,94,0.2)" }}>
              <p className="text-rose-600 text-sm leading-relaxed font-medium text-center" style={{ fontFamily: "var(--font-jost)" }}>{flirtyMsg}</p>
            </div>
          )}

          {/* ── Existing note display ── */}
          {localReaction?.note && !showNotePanel && (
            <div className="mb-4 px-4 py-3 rounded-2xl flex items-start gap-3" style={{ background: "rgba(253,164,175,0.08)", border: "1.5px solid rgba(253,164,175,0.3)" }}>
              <span className="text-lg flex-shrink-0">{localReaction.emoji ?? "💭"}</span>
              <p className="text-sm text-rose-800 flex-1 leading-relaxed" style={{ fontFamily: "var(--font-jost)", fontWeight: 300 }}>{localReaction.note}</p>
              <button onClick={() => { setNoteInput(localReaction.note ?? ""); setShowNotePanel(true); }} className="flex-shrink-0 text-rose-300 hover:text-rose-500 transition-colors">
                <Pencil size={13} />
              </button>
            </div>
          )}

          {/* ── VARIANT PICKER ── */}
          {hasVariants ? (
            <div className="mb-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-jost)" }}>
                Pick your options
                <span className="ml-2 normal-case text-rose-400 font-normal">(tap to cycle ❤️ / ✗ / undo)</span>
              </p>
              <div className="flex flex-col gap-2">
                {item.variants!.map((variant) => {
                  const chosen = isVariantChosen(variant.id);
                  const disliked = isVariantDisliked(variant.id);
                  const hasChoice = chosen || disliked;
                  const isCycling = loading === variant.id;
                  const isUndoing = loading === "undo-" + variant.id;

                  return (
                    <div key={variant.id} className="flex items-center gap-2">
                      <button
                        onClick={() => handleVariantCycle(variant.id)}
                        disabled={isCycling || isUndoing}
                        className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all"
                        style={{
                          background: chosen ? "linear-gradient(135deg,rgba(244,63,94,0.08),rgba(251,207,232,0.12))" : disliked ? "rgba(0,0,0,0.03)" : "rgba(0,0,0,0.025)",
                          border: chosen ? "2px solid rgba(244,63,94,0.4)" : disliked ? "1.5px solid rgba(0,0,0,0.12)" : "1.5px solid rgba(0,0,0,0.08)",
                          boxShadow: chosen ? "0 2px 12px rgba(244,63,94,0.15)" : "none",
                          opacity: (isCycling || isUndoing) ? 0.6 : 1,
                        }}
                      >
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all" style={{ background: chosen ? "#f43f5e" : disliked ? "rgba(0,0,0,0.08)" : "white", border: chosen ? "none" : disliked ? "none" : "1.5px solid rgba(0,0,0,0.15)" }}>
                          {chosen ? <CheckCircle2 size={14} className="text-white" /> : disliked ? <span className="text-[10px] text-gray-500">✗</span> : null}
                        </div>
                        <span className="flex-1 text-sm font-medium" style={{ fontFamily: "var(--font-jost)", color: chosen ? "#be123c" : disliked ? "#9ca3af" : "#374151" }}>
                          {variant.label}
                        </span>
                        {isCycling && <span className="w-3 h-3 border-2 border-rose-400 border-t-transparent rounded-full animate-spin inline-block" />}
                        {!isCycling && chosen && <span className="text-xs text-rose-400" style={{ fontFamily: "var(--font-jost)" }}>❤️</span>}
                        {!isCycling && disliked && <span className="text-xs text-gray-400" style={{ fontFamily: "var(--font-jost)" }}>not for me</span>}
                      </button>
                      {hasChoice && (
                        <button
                          onClick={() => handleVariantUndo(variant.id)}
                          disabled={isUndoing || isCycling}
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:bg-rose-50"
                          style={{ border: "1.5px solid rgba(244,63,94,0.2)", color: "#f43f5e", opacity: isUndoing ? 0.5 : 1 }}
                          title="Clear this option"
                        >
                          {isUndoing ? <span className="w-3 h-3 border-2 border-rose-400 border-t-transparent rounded-full animate-spin inline-block" /> : <RotateCcw size={14} />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {chosenVariantCount > 0 && (
                <p className="text-xs text-rose-500 mt-3 text-center" style={{ fontFamily: "var(--font-jost)" }}>
                  {chosenVariantCount === 1 ? "1 option selected ✨" : `${chosenVariantCount} options selected ✨`}
                </p>
              )}
            </div>
          ) : (
            /* ── NO VARIANTS ── */
            <div className="flex flex-col gap-3 pb-2">
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={loading === "item" || loading === "undo"}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-medium text-sm transition-all"
                  style={{ fontFamily: "var(--font-jost)", background: "linear-gradient(135deg,#f43f5e,#be123c)", boxShadow: isItemChosen() ? "0 6px 20px rgba(244,63,94,0.5)" : "0 4px 16px rgba(244,63,94,0.3)", opacity: (loading === "item" || loading === "undo") ? 0.7 : 1, border: isItemChosen() ? "2px solid #f43f5e" : "none", outline: isItemChosen() ? "2px solid rgba(244,63,94,0.3)" : "none", outlineOffset: "2px" }}
                >
                  <Heart size={16} fill={isItemChosen() ? "currentColor" : "none"} strokeWidth={isItemChosen() ? 0 : 2} />
                  I want this ❤️
                </button>
                <button
                  onClick={handleDisapprove}
                  disabled={loading === "item" || loading === "undo"}
                  className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-medium text-sm transition-all"
                  style={{ fontFamily: "var(--font-jost)", background: isItemDisliked() ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.04)", color: isItemDisliked() ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.45)", border: isItemDisliked() ? "1.5px solid rgba(0,0,0,0.2)" : "1.5px solid rgba(0,0,0,0.08)", opacity: (loading === "item" || loading === "undo") ? 0.7 : 1 }}
                >
                  <ThumbsDown size={15} />
                  Not for me
                </button>
              </div>
              {hasItemChoice() && (
                <button
                  onClick={handleUndo}
                  disabled={loading === "undo" || loading === "item"}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm transition-all hover:bg-rose-50"
                  style={{ fontFamily: "var(--font-jost)", color: "#f43f5e", border: "1.5px dashed rgba(244,63,94,0.35)", opacity: loading === "undo" ? 0.6 : 1 }}
                >
                  {loading === "undo" ? <span className="w-3 h-3 border-2 border-rose-400 border-t-transparent rounded-full animate-spin inline-block" /> : <RotateCcw size={13} />}
                  Undo my choice
                </button>
              )}
            </div>
          )}

          {/* ── EMOJI REACTIONS + NOTE ── */}
          <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(253,164,175,0.2)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider" style={{ fontFamily: "var(--font-jost)" }}>
                How does it make you feel?
              </p>
              <button
                onClick={() => { setNoteInput(localReaction?.note ?? ""); setShowNotePanel((v) => !v); }}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-600 transition-colors"
                style={{ fontFamily: "var(--font-jost)" }}
              >
                <Pencil size={11} />
                {localReaction?.note ? "Edit note" : "Add a note"}
              </button>
            </div>

            {/* Emoji row */}
            <div className="flex gap-2 flex-wrap mb-1">
              {ITEM_EMOJIS.map((emoji) => {
                const active = localReaction?.emoji === emoji;
                return (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiReact(emoji)}
                    className="w-10 h-10 rounded-2xl text-xl flex items-center justify-center transition-all hover:scale-110"
                    style={{
                      background: active ? "linear-gradient(135deg,rgba(244,63,94,0.12),rgba(251,207,232,0.2))" : "rgba(0,0,0,0.03)",
                      border: active ? "2px solid rgba(244,63,94,0.4)" : "1.5px solid rgba(0,0,0,0.06)",
                      boxShadow: active ? "0 2px 10px rgba(244,63,94,0.2)" : "none",
                      transform: active ? "scale(1.15)" : "scale(1)",
                    }}
                  >
                    {emoji}
                  </button>
                );
              })}
              {!localReaction?.emoji && (
                <button
                  onClick={() => { setNoteInput(localReaction?.note ?? ""); setShowNotePanel(true); }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:bg-rose-50"
                  style={{ border: "1.5px dashed rgba(253,164,175,0.5)", color: "#fda4af" }}
                  title="Add a note"
                >
                  <SmilePlus size={16} />
                </button>
              )}
            </div>

            {/* Note panel */}
            {showNotePanel && (
              <div className="mt-3 animate-scale-in">
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Leave him a little note about this… 💕"
                  rows={3}
                  className="w-full resize-none outline-none text-sm py-3 px-4 rounded-2xl"
                  style={{ fontFamily: "var(--font-jost)", background: "rgba(253,164,175,0.06)", border: "1.5px solid rgba(253,164,175,0.3)", color: "#9f1239", fontWeight: 300 }}
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setShowNotePanel(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 transition-all hover:bg-gray-50"
                    style={{ fontFamily: "var(--font-jost)", border: "1px solid rgba(0,0,0,0.07)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNote}
                    disabled={savingNote}
                    className="flex-1 py-2.5 rounded-xl text-sm text-white font-medium transition-all"
                    style={{ fontFamily: "var(--font-jost)", background: "linear-gradient(135deg,#f43f5e,#be123c)", boxShadow: "0 3px 12px rgba(244,63,94,0.3)", opacity: savingNote ? 0.7 : 1 }}
                  >
                    {savingNote ? "Saving…" : "Save note 💕"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
