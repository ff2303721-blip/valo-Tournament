"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
    <main className="min-h-screen bg-[#080c12] text-white">
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-4 text-xs font-bold tracking-[0.35em] text-[#ff4655]">
              VALORANT TOURNAMENT
            </div>

            <h1 className="text-3xl font-black tracking-wide">
              ADMIN LOGIN
            </h1>

            <p className="mt-3 text-sm text-[#8298b2]">
              Tournament management access
            </p>
          </div>

          <div className="border border-[#2a3749] bg-[#0e141e] shadow-2xl">
            <div className="border-b border-[#2a3749] px-6 py-4">
              <div className="text-xs font-bold tracking-[0.2em] text-[#8da5c1]">
                SECURE ACCESS
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-xs font-bold tracking-wide text-[#8da5c1]"
                >
                  ADMIN USERNAME
                </label>

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  required
                  className="w-full border border-[#31445c] bg-[#080d14] px-4 py-3 text-sm text-white outline-none transition focus:border-[#ff4655]"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-bold tracking-wide text-[#8da5c1]"
                >
                  PASSWORD
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full border border-[#31445c] bg-[#080d14] px-4 py-3 text-sm text-white outline-none transition focus:border-[#ff4655]"
                  placeholder="Enter password"
                />
              </div>

              {error && (
                <div className="border border-[#71323a] bg-[#241016] px-4 py-3 text-xs font-bold text-[#ff7180]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ff4655] py-3 text-xs font-black tracking-wide text-white transition hover:bg-[#e63d4d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "AUTHENTICATING..." : "LOGIN TO ADMIN PANEL"}
              </button>
            </form>

            <div className="border-t border-[#2a3749] px-6 py-4 text-center">
              <Link
                href="/tournament"
                className="text-xs font-bold text-[#8da5c1] transition hover:text-white"
              >
                ← BACK TO PUBLIC TOURNAMENT
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}