"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Heart, ThumbsDown, ChevronLeft, ChevronRight, Leaf, CheckCircle2, RotateCcw } from "lucide-react";
import Image from "next/image";
import type { ItemWithChoice, Choice } from "@/types";
import { submitChoice, removeChoice } from "@/lib/actions";
import { getRandomFlirtyMessage } from "@/types";

interface Props {
  item: ItemWithChoice;
  onClose: () => void;
  onChoiceUpdate: (itemId: string, choices: Choice[]) => void;
}

export default function HalaItemModal({ item, onClose, onChoiceUpdate }: Props) {
  const [currentImage, setCurrentImage] = useState(0);
  const [flirtyMsg, setFlirtyMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  // Always sync localChoices from the item prop (fixes stale state after DB changes)
  const [localChoices, setLocalChoices] = useState<Choice[]>(item.choices ?? []);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  // Re-sync whenever the parent refreshes item data (e.g. DB deletion)
  useEffect(() => {
    setLocalChoices(item.choices ?? []);
  }, [item.choices]);

  const hasVariants = item.variants && item.variants.length > 0;

  // Close on escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll
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

  function isVariantChosen(variantId: string): boolean {
    return localChoices.some((c) => c.variant_id === variantId && c.hala_approved);
  }

  function isVariantDisliked(variantId: string): boolean {
    return localChoices.some((c) => c.variant_id === variantId && !c.hala_approved);
  }

  function isItemChosen(): boolean {
    return localChoices.some((c) => c.variant_id === null && c.hala_approved);
  }

  function isItemDisliked(): boolean {
    return localChoices.some((c) => c.variant_id === null && !c.hala_approved);
  }

  function hasItemChoice(): boolean {
    return localChoices.some((c) => c.variant_id === null);
  }

  // ── Helpers to update local state and notify parent ──
  function applyChoices(updated: Choice[]) {
    setLocalChoices(updated);
    onChoiceUpdate(item.id, updated);
  }

  // ── Variant actions ──
  async function handleVariantToggle(variantId: string) {
    setLoading(variantId);
    const currentlyChosen = isVariantChosen(variantId);
    const newApproved = !currentlyChosen;
    try {
      await submitChoice(item.id, newApproved, variantId);
      const updated = localChoices.filter((c) => c.variant_id !== variantId);
      updated.push({ id: "temp-" + variantId, item_id: item.id, variant_id: variantId, hala_approved: newApproved, chosen_at: new Date().toISOString() });
      applyChoices(updated);
      if (newApproved) { setFlirtyMsg(getRandomFlirtyMessage()); spawnHearts(); }
      else setFlirtyMsg(null);
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

  // ── Item-level (no variants) actions ──
  async function handleApprove() {
    setLoading("item");
    try {
      await submitChoice(item.id, true, null);
      const updated = [...localChoices.filter((c) => c.variant_id !== null), { id: "temp-item", item_id: item.id, variant_id: null, hala_approved: true, chosen_at: new Date().toISOString() }];
      applyChoices(updated);
      setFlirtyMsg(getRandomFlirtyMessage());
      spawnHearts();
    } catch (e) { console.error(e); }
    finally { setLoading(null); }
  }

  async function handleDisapprove() {
    setLoading("item");
    try {
      await submitChoice(item.id, false, null);
      const updated = [...localChoices.filter((c) => c.variant_id !== null), { id: "temp-item", item_id: item.id, variant_id: null, hala_approved: false, chosen_at: new Date().toISOString() }];
      applyChoices(updated);
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

  const images = item.image_urls && item.image_urls.length > 0 ? item.image_urls : [];
  const chosenVariantCount = localChoices.filter((c) => c.variant_id !== null && c.hala_approved).length;

  return (
    <>
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
                <Image src={images[currentImage]} alt={item.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 512px" priority />
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

            {/* Close button */}
            <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.80)", backdropFilter: "blur(4px)" }}>
              <X size={18} className="text-rose-700" />
            </button>

            {/* Floating hearts */}
            {hearts.map((h) => (
              <div key={h.id} className="absolute pointer-events-none text-rose-500 text-2xl" style={{ left: `${h.x}%`, top: `${h.y}%`, animation: "floatUp 1.5s ease-out forwards" }}>❤️</div>
            ))}
          </div>

          {/* Content */}
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
              <div className="mb-5 px-5 py-4 rounded-2xl animate-scale-in" style={{ background: "linear-gradient(135deg, rgba(244,63,94,0.08), rgba(251,207,232,0.15))", border: "1px solid rgba(244,63,94,0.2)" }}>
                <p className="text-rose-600 text-sm leading-relaxed font-medium text-center" style={{ fontFamily: "var(--font-jost)" }}>
                  {flirtyMsg}
                </p>
              </div>
            )}

            {/* ── VARIANT PICKER ── */}
            {hasVariants ? (
              <div className="mb-5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-jost)" }}>
                  Pick your options
                  <span className="ml-2 normal-case text-rose-400 font-normal">(you can choose more than one! 💕)</span>
                </p>

                <div className="flex flex-col gap-2">
                  {item.variants!.map((variant) => {
                    const chosen = isVariantChosen(variant.id);
                    const disliked = isVariantDisliked(variant.id);
                    const hasChoice = chosen || disliked;
                    const isLoadingThis = loading === variant.id;
                    const isUndoing = loading === "undo-" + variant.id;

                    return (
                      <div key={variant.id} className="flex items-center gap-2">
                        <button
                          onClick={() => handleVariantToggle(variant.id)}
                          disabled={isLoadingThis || isUndoing}
                          className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all"
                          style={{
                            background: chosen ? "linear-gradient(135deg, rgba(244,63,94,0.08), rgba(251,207,232,0.12))" : "rgba(0,0,0,0.025)",
                            border: chosen ? "2px solid rgba(244,63,94,0.4)" : "1.5px solid rgba(0,0,0,0.08)",
                            boxShadow: chosen ? "0 2px 12px rgba(244,63,94,0.15)" : "none",
                          }}
                        >
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all" style={{ background: chosen ? "#f43f5e" : "white", border: chosen ? "none" : "1.5px solid rgba(0,0,0,0.15)" }}>
                            {chosen && <CheckCircle2 size={14} className="text-white" />}
                          </div>
                          <span className="flex-1 text-sm font-medium" style={{ fontFamily: "var(--font-jost)", color: chosen ? "#be123c" : "#374151" }}>
                            {variant.label}
                          </span>
                          {chosen && <span className="text-xs text-rose-400" style={{ fontFamily: "var(--font-jost)" }}>❤️ selected</span>}
                        </button>

                        {/* Undo button for this variant */}
                        {hasChoice && (
                          <button
                            onClick={() => handleVariantUndo(variant.id)}
                            disabled={isUndoing || isLoadingThis}
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:bg-rose-50"
                            style={{ border: "1.5px solid rgba(244,63,94,0.2)", color: "#f43f5e" }}
                            title="Undo this choice"
                          >
                            <RotateCcw size={14} />
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
              /* ── NO VARIANTS: classic approve / disapprove / undo ── */
              <div className="flex flex-col gap-3 pb-2">
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={loading === "item" || loading === "undo"}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-medium text-sm transition-all"
                    style={{
                      fontFamily: "var(--font-jost)",
                      background: "linear-gradient(135deg, #f43f5e, #be123c)",
                      boxShadow: isItemChosen() ? "0 6px 20px rgba(244,63,94,0.5)" : "0 4px 16px rgba(244,63,94,0.3)",
                      opacity: (loading === "item" || loading === "undo") ? 0.7 : 1,
                      border: isItemChosen() ? "2px solid #f43f5e" : "none",
                      outline: isItemChosen() ? "2px solid rgba(244,63,94,0.3)" : "none",
                      outlineOffset: "2px",
                    }}
                  >
                    <Heart size={16} fill={isItemChosen() ? "currentColor" : "none"} strokeWidth={isItemChosen() ? 0 : 2} />
                    I want this ❤️
                  </button>

                  <button
                    onClick={handleDisapprove}
                    disabled={loading === "item" || loading === "undo"}
                    className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-medium text-sm transition-all"
                    style={{
                      fontFamily: "var(--font-jost)",
                      background: isItemDisliked() ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.04)",
                      color: isItemDisliked() ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.45)",
                      border: isItemDisliked() ? "1.5px solid rgba(0,0,0,0.2)" : "1.5px solid rgba(0,0,0,0.08)",
                      opacity: (loading === "item" || loading === "undo") ? 0.7 : 1,
                    }}
                  >
                    <ThumbsDown size={15} />
                    Not for me
                  </button>
                </div>

                {/* Undo row — only shown when a choice exists */}
                {hasItemChoice() && (
                  <button
                    onClick={handleUndo}
                    disabled={loading === "undo" || loading === "item"}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm transition-all hover:bg-rose-50"
                    style={{
                      fontFamily: "var(--font-jost)",
                      color: "#f43f5e",
                      border: "1.5px dashed rgba(244,63,94,0.35)",
                      opacity: loading === "undo" ? 0.6 : 1,
                    }}
                  >
                    <RotateCcw size={13} />
                    Undo my choice
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
