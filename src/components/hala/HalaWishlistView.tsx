"use client";

import { useState, useEffect } from "react";
import { X, Heart } from "lucide-react";
import Image from "next/image";
import type { ItemWithChoice } from "@/types";

const LOVE_POEMS = [
  "In a world of infinite stars,\nyou are the one I keep reaching for.",
  "Every choice you make\nis a piece of the life I dream to build with you.",
  "You deserve every beautiful thing\nthat has ever existed — and then some.",
  "My heart knows your name\nbefore my mind can even think it.",
  "To love you is the easiest thing\nI have ever done.",
  "You are not just someone I want —\nyou are someone I choose, every single day.",
  "The universe conspired beautifully\nthe day it decided to put you in my path.",
  "I look at everything you love\nand fall in love with you all over again.",
];

interface FloatingHeart {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  emoji: string;
}

interface Props {
  items: ItemWithChoice[];
  onClose: () => void;
}

function chosenVariantLabels(item: ItemWithChoice): string[] {
  return (item.choices ?? [])
    .filter((c) => c.variant_id !== null && c.hala_approved)
    .map((c) => item.variants?.find((v) => v.id === c.variant_id)?.label ?? "")
    .filter(Boolean);
}

export default function HalaWishlistView({ items, onClose }: Props) {
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [poemIndex, setPoemIndex] = useState(0);

  const approved = items.filter((i) => {
    const hasApprovedVariant = (i.choices ?? []).some((c) => c.variant_id !== null && c.hala_approved);
    const hasApprovedItem = i.choice?.hala_approved === true;
    return hasApprovedVariant || hasApprovedItem;
  });

  // Spawn floating hearts continuously
  useEffect(() => {
    const emojis = ["❤️", "💕", "💖", "💗", "💝", "🌹", "✨", "💫"];
    let counter = 0;
    const interval = setInterval(() => {
      const newHearts: FloatingHeart[] = Array.from({ length: 3 }, (_, i) => ({
        id: counter + i,
        x: Math.random() * 100,
        size: 16 + Math.random() * 20,
        duration: 4 + Math.random() * 4,
        delay: Math.random() * 2,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
      }));
      counter += 3;
      setHearts((prev) => [...prev.slice(-30), ...newHearts]);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Rotate poems
  useEffect(() => {
    const interval = setInterval(() => {
      setPoemIndex((i) => (i + 1) % LOVE_POEMS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #1a0a0f 0%, #2d0718 40%, #1a0a0f 100%)",
      }}
    >
      {/* Floating hearts layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {hearts.map((h) => (
          <div
            key={h.id}
            className="absolute"
            style={{
              left: `${h.x}%`,
              bottom: "-50px",
              fontSize: `${h.size}px`,
              animation: `floatHeart ${h.duration}s ease-out ${h.delay}s forwards`,
              opacity: 0,
            }}
          >
            {h.emoji}
          </div>
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all"
        style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(6px)" }}
      >
        <X size={18} className="text-rose-200" />
      </button>

      {/* Content */}
      <div className="h-full overflow-y-auto">
        {/* Header */}
        <div className="text-center pt-14 pb-8 px-6">
          <div className="flex justify-center gap-3 mb-4">
            {["❤️", "💖", "❤️"].map((e, i) => (
              <span key={i} className="text-3xl animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                {e}
              </span>
            ))}
          </div>
          <h1
            className="text-4xl sm:text-5xl font-semibold mb-2"
            style={{
              fontFamily: "var(--font-cormorant)",
              background: "linear-gradient(135deg, #fda4af, #f43f5e, #fda4af)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Hala&apos;s Wishes
          </h1>
          <p className="text-rose-300 text-sm" style={{ fontFamily: "var(--font-jost)", fontWeight: 300 }}>
            {approved.length} treasures chosen with love
          </p>

          {/* Rotating poem */}
          <div
            className="mt-6 mx-auto max-w-sm px-6 py-4 rounded-2xl"
            style={{
              background: "rgba(244,63,94,0.12)",
              border: "1px solid rgba(244,63,94,0.2)",
            }}
          >
            <p
              className="text-rose-200 text-sm leading-relaxed italic text-center whitespace-pre-line"
              style={{ fontFamily: "var(--font-cormorant)", fontSize: "1rem" }}
            >
              &quot;{LOVE_POEMS[poemIndex]}&quot;
            </p>
          </div>
        </div>

        {/* Items grid */}
        {approved.length === 0 ? (
          <div className="text-center py-20">
            <Heart size={48} className="mx-auto mb-4 text-rose-800" fill="currentColor" strokeWidth={0} />
            <p className="text-rose-400 text-xl" style={{ fontFamily: "var(--font-cormorant)" }}>
              No wishes yet, my love...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-4 sm:px-6 pb-16">
            {approved.map((item, i) => {
              const labels = chosenVariantLabels(item);
              return (
                <div
                  key={item.id}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(244,63,94,0.3)",
                    boxShadow: "0 4px 24px rgba(244,63,94,0.15)",
                    animation: `fadeInUp 0.5s ease-out ${i * 0.05}s both`,
                  }}
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-rose-950 overflow-hidden">
                    {item.image_urls && item.image_urls.length > 0 ? (
                      <Image
                        src={item.image_urls[0]}
                        alt={item.name}
                        fill
                        className="object-cover opacity-80"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Heart size={32} className="text-rose-700" fill="currentColor" strokeWidth={0} />
                      </div>
                    )}
                    {/* Heart overlay */}
                    <div
                      className="absolute top-2 right-2 text-lg"
                      style={{ filter: "drop-shadow(0 0 6px rgba(244,63,94,0.8))" }}
                    >
                      ❤️
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p
                      className="text-sm font-medium text-rose-100 leading-snug line-clamp-2 mb-1"
                      style={{ fontFamily: "var(--font-jost)" }}
                    >
                      {item.name}
                    </p>
                    {labels.length > 0 && (
                      <p className="text-xs text-rose-400 mt-0.5 line-clamp-1" style={{ fontFamily: "var(--font-jost)", fontWeight: 300 }}>
                        {labels.join(", ")}
                      </p>
                    )}
                    <p className="text-xs text-rose-500/60 mt-1" style={{ fontFamily: "var(--font-jost)", fontWeight: 300 }}>
                      {item.category}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom poem */}
        <div className="text-center pb-10 px-6">
          <p
            className="text-rose-700 text-sm italic"
            style={{ fontFamily: "var(--font-cormorant)", fontSize: "1rem" }}
          >
            &quot;Everything you desire, I desire to give you.&quot;
          </p>
        </div>
      </div>

      <style>{`
        @keyframes floatHeart {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-110vh) rotate(20deg); opacity: 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
