"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Settings = {
  tournamentName: string;
  tagline: string;
};

export default function TournamentSettingsPage() {
  const [settings, setSettings] =
    useState<Settings>({
      tournamentName: "",
      tagline: "",
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/settings",
          {
            cache: "no-store",
          },
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Unable to load settings.",
          );
        }

        if (cancelled) {
          return;
        }

        setSettings({
          tournamentName:
            data.tournamentName ?? "",
          tagline:
            data.tagline ?? "",
        });
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load settings.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveSettings(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/settings",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            tournamentName:
              settings.tournamentName,
            tagline:
              settings.tagline,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to save settings.",
        );
      }

      setSettings({
        tournamentName:
          data.tournamentName ?? "",
        tagline:
          data.tagline ?? "",
      });

      setMessage(
        "Tournament settings saved successfully.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#060a12] text-white">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <header className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 transition hover:text-cyan-300"
            >
              ← Admin Hub
            </Link>

            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
              Tournament Configuration
            </p>

            <h1 className="mt-2 text-4xl font-black uppercase">
              Tournament Settings
            </h1>

            <p className="mt-2 text-sm text-white/40">
              Change the tournament identity shown across the
              public website.
            </p>
          </div>

          <Link
            href="/tournament"
            className="rounded-lg border border-cyan-400/20 bg-cyan-400/[0.05] px-5 py-3 text-[10px] font-black uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-400/10"
          >
            View Public Site →
          </Link>
        </header>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-300">
            {message}
          </div>
        )}

        <form
          onSubmit={saveSettings}
          className="overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.06] via-white/[0.03] to-purple-500/[0.06] shadow-[0_0_70px_rgba(34,211,238,0.05)]"
        >
          <div className="border-b border-white/10 p-6 sm:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">
              Public Identity
            </p>

            <h2 className="mt-2 text-2xl font-black uppercase">
              Tournament Name
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/40">
              This is the main name displayed to visitors.
              Changes are stored in Supabase and shared with
              everyone.
            </p>
          </div>

          <div className="space-y-7 p-6 sm:p-8">
            <div>
              <label
                htmlFor="tournamentName"
                className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40"
              >
                Tournament Name
              </label>

              <input
                id="tournamentName"
                type="text"
                maxLength={100}
                value={settings.tournamentName}
                onChange={(event) =>
                  setSettings(
                    (current) => ({
                      ...current,
                      tournamentName:
                        event.target.value,
                    }),
                  )
                }
                disabled={loading || saving}
                placeholder="VALORANT TOURNAMENT"
                className="mt-3 w-full rounded-xl border border-white/10 bg-[#080d17] px-5 py-4 text-lg font-black uppercase text-white outline-none transition placeholder:text-white/15 focus:border-cyan-400/50 disabled:opacity-50"
              />

              <p className="mt-2 text-right text-[10px] font-bold text-white/20">
                {settings.tournamentName.length}/100
              </p>
            </div>

            <div>
              <label
                htmlFor="tagline"
                className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40"
              >
                Tagline
              </label>

              <input
                id="tagline"
                type="text"
                maxLength={160}
                value={settings.tagline}
                onChange={(event) =>
                  setSettings(
                    (current) => ({
                      ...current,
                      tagline:
                        event.target.value,
                    }),
                  )
                }
                disabled={loading || saving}
                placeholder="COMPETITIVE VALORANT"
                className="mt-3 w-full rounded-xl border border-white/10 bg-[#080d17] px-5 py-4 text-sm font-bold uppercase text-white outline-none transition placeholder:text-white/15 focus:border-purple-400/50 disabled:opacity-50"
              />

              <p className="mt-2 text-right text-[10px] font-bold text-white/20">
                {settings.tagline.length}/160
              </p>
            </div>

            <div className="rounded-xl border border-yellow-400/15 bg-yellow-400/[0.04] p-4">
              <p className="text-xs font-bold leading-5 text-yellow-200/70">
                Changes made here are shared through the tournament
                database. Visitors do not need to update their browser
                or local storage.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 bg-black/10 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <Link
              href="/admin"
              className="text-center text-xs font-black uppercase tracking-wider text-white/30 transition hover:text-white"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                loading ||
                saving ||
                !settings.tournamentName.trim()
              }
              className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-8 py-4 text-xs font-black uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving
                ? "Saving..."
                : "Save Tournament Settings"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}