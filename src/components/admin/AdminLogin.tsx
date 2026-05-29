"use client";

import { useState } from "react";
import { Lock, Heart } from "lucide-react";

interface Props {
  loginAction: (formData: FormData) => Promise<{ error?: string }>;
}

export default function AdminLogin({ loginAction }: Props) {
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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0f0f1a" }}>
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(244,63,94,0.08) 0%, transparent 60%)",
        }}
      />

      <div
        className="relative w-full max-w-sm p-10 text-center rounded-3xl"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 8px 60px rgba(0,0,0,0.4)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <Heart size={20} className="text-rose-500" fill="currentColor" strokeWidth={0} />
          <span
            className="font-display text-2xl text-white/90 font-medium"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            Admin Access
          </span>
        </div>

        <p className="text-white/40 text-sm mb-6" style={{ fontFamily: "var(--font-jost)", fontWeight: 300 }}>
          Enter your admin password
        </p>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={15} />
            <input
              name="password"
              type="password"
              placeholder="Admin password"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
              style={{
                fontFamily: "var(--font-jost)",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "white",
              }}
            />
          </div>

          {error && (
            <p className="text-rose-400 text-xs mb-4" style={{ fontFamily: "var(--font-jost)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white text-sm font-medium transition-all"
            style={{
              fontFamily: "var(--font-jost)",
              background: loading ? "rgba(244,63,94,0.4)" : "rgba(244,63,94,0.85)",
              boxShadow: loading ? "none" : "0 4px 20px rgba(244,63,94,0.25)",
            }}
          >
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
