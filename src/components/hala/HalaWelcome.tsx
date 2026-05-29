"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Sparkles, Gift } from "lucide-react";

// Floating petals config
const PETALS = ["🌸", "💕", "✨", "🌹", "💗", "⭐", "🌺"];

function FloatingPetal({ emoji, style }: { emoji: string; style: React.CSSProperties }) {
  return (
    <span
      className="fixed pointer-events-none select-none z-0"
      style={{
        fontSize: `${Math.random() * 0.8 + 0.8}rem`,
        ...style,
      }}
    >
      {emoji}
    </span>
  );
}

export default function HalaWelcome() {
  const router = useRouter();
  const [petals, setPetals] = useState<{ id: number; emoji: string; style: React.CSSProperties }[]>([]);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    const generated = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      emoji: PETALS[i % PETALS.length],
      style: {
        left: `${Math.random() * 100}%`,
        bottom: "-20px",
        animationDuration: `${8 + Math.random() * 10}s`,
        animationDelay: `${Math.random() * 8}s`,
        animationName: "petalFloat",
        animationTimingFunction: "linear",
        animationIterationCount: "infinite",
      },
    }));
    setPetals(generated);
  }, []);

  const handleEnter = () => {
    setClicked(true);
    setTimeout(() => router.push("/hala/gifts"), 700);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-romantic">
      {/* Floating petals */}
      {petals.map((p) => (
        <FloatingPetal key={p.id} emoji={p.emoji} style={p.style} />
      ))}

      {/* Decorative circles */}
      <div
        className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(253,164,175,0.25) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[-5%] left-[-5%] w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(250,204,21,0.15) 0%, transparent 70%)",
        }}
      />

      {/* Main content card */}
      <div
        className={`relative z-10 flex flex-col items-center text-center px-8 py-12 max-w-lg mx-4 transition-all duration-700 ${
          clicked ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        style={{
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "32px",
          border: "1px solid rgba(253,205,211,0.5)",
          boxShadow: "0 8px 60px rgba(251,113,133,0.15), 0 2px 20px rgba(0,0,0,0.04)",
        }}
      >
        {/* Animated heart */}
        <div
          className="mb-6 animate-bounce-gentle"
          style={{ animationDuration: "2.5s" }}
        >
          <div className="relative inline-flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "rgba(244,63,94,0.12)",
                transform: "scale(1.4)",
                animation: "heartBeat 2s ease-in-out infinite",
              }}
            />
            <Heart
              className="relative text-rose-500"
              size={56}
              fill="currentColor"
              strokeWidth={0}
            />
          </div>
        </div>

        {/* Greeting */}
        <div className="animate-fade-in stagger-1" style={{ opacity: 0 }}>
          <p
            className="font-script text-rose-400 text-xl mb-2"
            style={{ fontFamily: "var(--font-dancing)" }}
          >
            just for you
          </p>
          <h1
            className="font-display text-5xl md:text-6xl font-semibold leading-tight mb-3"
            style={{
              fontFamily: "var(--font-cormorant)",
              background: "linear-gradient(135deg, #be123c 0%, #f43f5e 50%, #e11d48 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Welcome,
            <br />
            Beautiful Hala
          </h1>
          <Sparkles
            className="inline-block text-gold-500 ml-2 animate-twinkle"
            size={24}
            style={{ color: "#eab308" }}
          />
        </div>

        {/* Divider */}
        <div className="animate-fade-in stagger-2 w-24 h-px my-5" style={{
          opacity: 0,
          background: "linear-gradient(90deg, transparent, #fda4af, transparent)",
        }} />

        {/* Message */}
        <p
          className="animate-fade-in stagger-3 font-body text-rose-700/80 text-base leading-relaxed max-w-xs"
          style={{ opacity: 0, fontFamily: "var(--font-jost)", fontWeight: 300 }}
        >
          I made this little space just for you, habibi.
          <br />
          Pick everything that catches your eye — nothing is off limits. 💕
        </p>

        {/* CTA button */}
        <button
          onClick={handleEnter}
          className="animate-fade-in stagger-4 mt-8 flex items-center gap-3 px-8 py-4 rounded-full text-white font-body font-medium text-base transition-all duration-300"
          style={{
            opacity: 0,
            fontFamily: "var(--font-jost)",
            background: "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)",
            boxShadow: "0 6px 24px rgba(244,63,94,0.40)",
            letterSpacing: "0.03em",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 10px 32px rgba(244,63,94,0.50)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 24px rgba(244,63,94,0.40)";
          }}
        >
          <Gift size={18} />
          See your list babe
          <Heart size={14} fill="currentColor" strokeWidth={0} className="opacity-80" />
        </button>

        {/* Footer note */}
        <p
          className="animate-fade-in stagger-5 mt-5 text-xs text-rose-400/70 font-body"
          style={{ opacity: 0, fontFamily: "var(--font-jost)", fontWeight: 300 }}
        >
          Made with love, only for you ❤️
        </p>
      </div>
    </div>
  );
}
