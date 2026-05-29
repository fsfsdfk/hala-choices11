"use client";

import { useState } from "react";
import { Heart, Lock } from "lucide-react";

interface Props {
  loginAction: (formData: FormData) => Promise<{ error?: string }>;
}

export default function HalaPasswordGate({ loginAction }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-romantic flex items-center justify-center px-4">
      <div
        className="w-full max-w-sm p-10 text-center"
        style={{
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(20px)",
          borderRadius: "28px",
          border: "1px solid rgba(253,205,211,0.5)",
          boxShadow: "0 8px 40px rgba(251,113,133,0.12)",
        }}
      >
        <Heart
          className="mx-auto mb-5 text-rose-400 animate-heart-beat"
          size={40}
          fill="currentColor"
          strokeWidth={0}
        />
        <h1
          className="font-display text-3xl font-semibold mb-2"
          style={{
            fontFamily: "var(--font-cormorant)",
            color: "#be123c",
          }}
        >
          This is for you, Hala
        </h1>
        <p className="text-rose-500/70 text-sm mb-7" style={{ fontFamily: "var(--font-jost)", fontWeight: 300 }}>
          Enter your secret code to see your gifts 💕
        </p>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-300" size={16} />
            <input
              name="password"
              type="password"
              placeholder="Your secret code..."
              autoComplete="off"
              required
              className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none transition-all"
              style={{
                fontFamily: "var(--font-jost)",
                background: "rgba(255,241,242,0.8)",
                border: "1.5px solid rgba(253,164,175,0.5)",
                color: "#be123c",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#f43f5e";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(244,63,94,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(253,164,175,0.5)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {error && (
            <p className="text-rose-500 text-xs mb-4" style={{ fontFamily: "var(--font-jost)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl text-white text-sm font-medium transition-all"
            style={{
              fontFamily: "var(--font-jost)",
              background: loading
                ? "rgba(244,63,94,0.5)"
                : "linear-gradient(135deg, #f43f5e, #be123c)",
              boxShadow: loading ? "none" : "0 4px 20px rgba(244,63,94,0.35)",
            }}
          >
            {loading ? "Opening…" : "Enter ❤️"}
          </button>
        </form>
      </div>
    </div>
  );
}
