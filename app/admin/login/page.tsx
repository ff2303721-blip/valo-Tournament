"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid username or password.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Unable to connect to the login service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen text-[#f1f5f9] flex items-center justify-center px-4 py-12 sm:px-6">
      {/* ── Ambient Neon Glow Orbs ────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 h-[500px] w-[500px] rounded-full bg-[#7c3aed]/15 blur-[160px]" />
        <div className="absolute top-1/3 -right-32 h-[500px] w-[500px] rounded-full bg-[#ff2d55]/12 blur-[160px]" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 h-[400px] w-[400px] rounded-full bg-[#06b6d4]/10 blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        {/* ── Header / Brand ─────────────────────────────────────────────── */}
        <div className="mb-8 text-center">
          {/* Logo Badge */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#ff2d55]/40 bg-[#ff2d55]/10 text-2xl font-black text-[#ff2d55] shadow-[0_0_24px_rgba(255,45,85,0.25)] transition hover:scale-105 hover:border-[#ff2d55]/80">
            V
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#ff2d55]">
            <span className="live-dot h-2 w-2 flex-shrink-0" />
            COMMAND ACCESS // VALORANT ESPORTS
          </div>

          <h1 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-[#e2e8f0] to-[#9d63ff]">
            Admin Portal
          </h1>

          <p className="mt-1.5 text-xs text-[#64748b]">
            Secure command center authentication
          </p>
        </div>

        {/* ── Modern Glassmorphism Card ───────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_30px_rgba(124,58,237,0.12)] backdrop-blur-2xl transition hover:border-[#2e2e5a]">
          {/* Card Top Banner */}
          <div className="flex items-center justify-between border-b border-[#1e1e3a] bg-[#030308]/60 px-6 py-3.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
              <span className="text-[10px] font-black tracking-widest uppercase text-[#94a3b8]">
                SECURE TERMINAL
              </span>
            </div>
            <span className="rounded-md border border-[#7c3aed]/30 bg-[#7c3aed]/10 px-2 py-0.5 text-[9px] font-black tracking-widest text-[#9d63ff]">
              ENCRYPTED
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-7">
            {/* Username field */}
            <div>
              <label
                htmlFor="username"
                className="mb-2 flex items-center justify-between text-[10px] font-black tracking-widest uppercase text-[#64748b]"
              >
                <span>ADMIN USERNAME</span>
                <span className="text-[9px] text-[#475569]">REQUIRED</span>
              </label>

              <div className="relative">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  required
                  placeholder="Enter administrator username"
                  className="w-full rounded-xl border border-[#1e1e3a] bg-[#030308]/90 px-4 py-3 text-sm text-[#f1f5f9] placeholder:text-[#334155] outline-none transition duration-200 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 flex items-center justify-between text-[10px] font-black tracking-widest uppercase text-[#64748b]"
              >
                <span>PASSWORD</span>
                <span className="text-[9px] text-[#475569]">SECURE</span>
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="Enter administrator password"
                  className="w-full rounded-xl border border-[#1e1e3a] bg-[#030308]/90 px-4 py-3 pr-11 text-sm text-[#f1f5f9] placeholder:text-[#334155] outline-none transition duration-200 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#475569] hover:text-[#94a3b8] transition p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 rounded-xl border border-[#ff2d55]/40 bg-[#ff2d55]/10 p-3.5 text-xs font-bold text-[#ff4d6a] animate-in fade-in slide-in-from-top-1 duration-200">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ff2d55]/20 text-[11px] font-black text-[#ff2d55]">
                  !
                </span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#ff2d55] via-[#ff4d6a] to-[#7c3aed] py-3.5 text-xs font-black tracking-widest uppercase text-white shadow-[0_4px_20px_rgba(255,45,85,0.35)] transition-all duration-200 hover:shadow-[0_4px_28px_rgba(255,45,85,0.55)] hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>AUTHENTICATING PROTOCOL...</span>
                </>
              ) : (
                <>
                  <span>LOGIN TO COMMAND HUB</span>
                  <span className="text-sm transition-transform duration-200 group-hover:translate-x-0.5">
                    →
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Card Footer */}
          <div className="border-t border-[#1e1e3a] bg-[#030308]/50 px-6 py-4 text-center">
            <Link
              href="/tournament"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#64748b] transition hover:text-[#22d3ee]"
            >
              <span>←</span>
              <span>RETURN TO TOURNAMENT HUB</span>
            </Link>
          </div>
        </div>

        {/* Security badge at bottom */}
        <div className="mt-6 text-center text-[10px] text-[#475569]">
          VALORANT ESPORTS CONTROL SYSTEM • CLOUD SYNC ACTIVE
        </div>
      </div>
    </main>
  );
}