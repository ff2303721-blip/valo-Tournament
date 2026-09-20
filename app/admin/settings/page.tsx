"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Settings = {
  tournamentName: string;
  tagline: string;
  organizerName: string;
  prizePool: string;
  startDate: string;
  endDate: string;
  tournamentStatus: "Upcoming" | "Live" | "Completed";
  announcement: string;
  logoUrl: string;
  bannerUrl: string;
};

type DateTimeParts = {
  date: string;
  hour: string;
  minute: string;
  meridiem: "AM" | "PM";
};

const EMPTY_DATE_TIME: DateTimeParts = {
  date: "",
  hour: "12",
  minute: "00",
  meridiem: "AM",
};

const HOURS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);

const MINUTES = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);

function toDateTimeParts(value: string | null | undefined): DateTimeParts {
  if (!value) return EMPTY_DATE_TIME;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return EMPTY_DATE_TIME;
  }

  const hours = date.getHours();

  return {
    date: [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-"),
    hour: String(hours % 12 || 12).padStart(2, "0"),
    minute: String(date.getMinutes()).padStart(2, "0"),
    meridiem: hours >= 12 ? "PM" : "AM",
  };
}

function partsToIso(parts: DateTimeParts) {
  if (!parts.date) return "";

  const [year, month, day] =
    parts.date.split("-").map(Number);

  let hour = Number(parts.hour);

  if (parts.meridiem === "AM") {
    if (hour === 12) hour = 0;
  } else if (hour !== 12) {
    hour += 12;
  }

  const date = new Date(
    year,
    month - 1,
    day,
    hour,
    Number(parts.minute),
  );

  return Number.isNaN(date.getTime())
    ? ""
    : date.toISOString();
}

function formatDatePreview(parts: DateTimeParts) {
  const iso = partsToIso(parts);

  if (!iso) return "Not set";

  return new Date(iso).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const EMPTY_SETTINGS: Settings = {
  tournamentName: "",
  tagline: "",
  organizerName: "",
  prizePool: "",
  startDate: "",
  endDate: "",
  tournamentStatus: "Upcoming",
  announcement: "",
  logoUrl: "",
  bannerUrl: "",
};

function toDateInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

export default function TournamentSettingsPage() {
  const [settings, setSettings] = useState<Settings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [startDateTime, setStartDateTime] =
    useState<DateTimeParts>(EMPTY_DATE_TIME);

  const [endDateTime, setEndDateTime] =
    useState<DateTimeParts>(EMPTY_DATE_TIME);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/settings", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Unable to load settings.");
        }

        if (cancelled) return;

        setSettings({
          tournamentName: data.tournamentName ?? "",
          tagline: data.tagline ?? "",
          organizerName: data.organizerName ?? "",
          prizePool: data.prizePool ?? "",
          startDate: toDateInput(data.startDate),
          endDate: toDateInput(data.endDate),
          tournamentStatus: data.tournamentStatus ?? "Upcoming",
          announcement: data.announcement ?? "",
          logoUrl: data.logoUrl ?? "",
          bannerUrl: data.bannerUrl ?? "",
        });

        setStartDateTime(
          toDateTimeParts(data.startDate),
        );

        setEndDateTime(
          toDateTimeParts(data.endDate),
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load settings.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          startDate: partsToIso(startDateTime),
          endDate: partsToIso(endDateTime),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to save settings.");
      }

      setSettings({
        tournamentName: data.tournamentName ?? "",
        tagline: data.tagline ?? "",
        organizerName: data.organizerName ?? "",
        prizePool: data.prizePool ?? "",
        startDate: toDateInput(data.startDate),
        endDate: toDateInput(data.endDate),
        tournamentStatus: data.tournamentStatus ?? "Upcoming",
        announcement: data.announcement ?? "",
        logoUrl: data.logoUrl ?? "",
        bannerUrl: data.bannerUrl ?? "",
      });

      setStartDateTime(
        toDateTimeParts(data.startDate),
      );

      setEndDateTime(
        toDateTimeParts(data.endDate),
      );

      setMessage("Tournament settings saved successfully.");
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

  const inputClass =
    "mt-3 w-full rounded-xl border border-[#263750] bg-[#060b14] px-5 py-4 text-sm font-bold text-white outline-none transition placeholder:text-white/15 focus:border-[#52e2ff]/50 disabled:opacity-50";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#04070f] text-white">
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(4,7,15,0.76), rgba(4,7,15,0.91)), url("https://images5.alphacoders.com/120/thumb-1920-1202339.png")`,
          backgroundAttachment: "fixed",
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_12%_30%,rgba(255,31,91,0.16),transparent_28%),radial-gradient(circle_at_88%_30%,rgba(0,229,255,0.12),transparent_30%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(255,49,88,0.14),transparent_25%),radial-gradient(circle_at_90%_15%,rgba(39,217,255,0.10),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(139,92,246,0.10),transparent_35%)]" />

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <header className="mb-8 flex flex-col gap-5 border-b border-[#263750] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-xs font-bold uppercase tracking-[0.2em] text-[#8195b0] transition hover:text-cyan-300"
            >
              ← Admin Hub
            </Link>

            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.3em] text-[#52e2ff]">
              Tournament Configuration
            </p>

            <h1 className="mt-2 text-4xl font-black uppercase">
              Tournament Settings
            </h1>

            <p className="mt-2 text-sm text-[#8195b0]">
              Control the tournament identity and public information shown across the website.
            </p>
          </div>

          <Link
            href="/tournament"
            className="rounded-lg border border-cyan-400/20 bg-cyan-400/[0.05] px-5 py-3 text-[10px] font-black uppercase tracking-wider text-cyan-200 transition hover:bg-[#52e2ff]/[0.06]"
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

        <form onSubmit={saveSettings} className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.06] via-white/[0.03] to-purple-500/[0.06]">
            <div className="border-b border-[#263750] p-6 sm:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#52e2ff]">
                Public Identity
              </p>
              <h2 className="mt-2 text-2xl font-black uppercase">Tournament Branding</h2>
            </div>

            <div className="grid gap-7 p-6 sm:grid-cols-2 sm:p-8">
              <div className="sm:col-span-2">
                <label htmlFor="tournamentName" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8195b0]">
                  Tournament Name
                </label>
                <input
                  id="tournamentName"
                  type="text"
                  maxLength={100}
                  value={settings.tournamentName}
                  onChange={(e) => update("tournamentName", e.target.value)}
                  disabled={loading || saving}
                  placeholder="VALORANT TOURNAMENT"
                  className={inputClass}
                />
                <p className="mt-2 text-right text-[10px] font-bold text-white/20">{settings.tournamentName.length}/100</p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="tagline" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8195b0]">
                  Tagline
                </label>
                <input
                  id="tagline"
                  type="text"
                  maxLength={160}
                  value={settings.tagline}
                  onChange={(e) => update("tagline", e.target.value)}
                  disabled={loading || saving}
                  placeholder="COMPETITIVE VALORANT"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="organizerName" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8195b0]">
                  Organizer
                </label>
                <input
                  id="organizerName"
                  type="text"
                  maxLength={100}
                  value={settings.organizerName}
                  onChange={(e) => update("organizerName", e.target.value)}
                  disabled={loading || saving}
                  placeholder="Tournament organizer"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="prizePool" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8195b0]">
                  Prize Pool
                </label>
                <input
                  id="prizePool"
                  type="text"
                  maxLength={100}
                  value={settings.prizePool}
                  onChange={(e) => update("prizePool", e.target.value)}
                  disabled={loading || saving}
                  placeholder="₹10,000"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-purple-400/20 bg-purple-400/[0.04]">
            <div className="border-b border-[#263750] p-6 sm:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-300">
                Tournament Schedule
              </p>
              <h2 className="mt-2 text-2xl font-black uppercase">Dates & Status</h2>
            </div>

            <div className="grid gap-7 p-6 sm:grid-cols-2 sm:p-8">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8195b0]">
                  Start Date & Time
                </label>

                <input
                  type="date"
                  value={startDateTime.date}
                  onChange={(e) =>
                    setStartDateTime((current) => ({
                      ...current,
                      date: e.target.value,
                    }))
                  }
                  disabled={loading || saving}
                  className={inputClass}
                />

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <select
                    value={startDateTime.hour}
                    onChange={(e) =>
                      setStartDateTime((current) => ({
                        ...current,
                        hour: e.target.value,
                      }))
                    }
                    disabled={loading || saving}
                    className={inputClass}
                  >
                    {HOURS.map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>

                  <select
                    value={startDateTime.minute}
                    onChange={(e) =>
                      setStartDateTime((current) => ({
                        ...current,
                        minute: e.target.value,
                      }))
                    }
                    disabled={loading || saving}
                    className={inputClass}
                  >
                    {MINUTES.map((minute) => (
                      <option key={minute} value={minute}>
                        {minute}
                      </option>
                    ))}
                  </select>

                  <select
                    value={startDateTime.meridiem}
                    onChange={(e) =>
                      setStartDateTime((current) => ({
                        ...current,
                        meridiem: e.target.value as "AM" | "PM",
                      }))
                    }
                    disabled={loading || saving}
                    className={inputClass}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>

                <p className="mt-2 text-[10px] font-bold text-white/25">
                  12-hour time · {formatDatePreview(startDateTime)}
                </p>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8195b0]">
                  End Date & Time
                </label>

                <input
                  type="date"
                  value={endDateTime.date}
                  onChange={(e) =>
                    setEndDateTime((current) => ({
                      ...current,
                      date: e.target.value,
                    }))
                  }
                  disabled={loading || saving}
                  className={inputClass}
                />

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <select
                    value={endDateTime.hour}
                    onChange={(e) =>
                      setEndDateTime((current) => ({
                        ...current,
                        hour: e.target.value,
                      }))
                    }
                    disabled={loading || saving}
                    className={inputClass}
                  >
                    {HOURS.map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>

                  <select
                    value={endDateTime.minute}
                    onChange={(e) =>
                      setEndDateTime((current) => ({
                        ...current,
                        minute: e.target.value,
                      }))
                    }
                    disabled={loading || saving}
                    className={inputClass}
                  >
                    {MINUTES.map((minute) => (
                      <option key={minute} value={minute}>
                        {minute}
                      </option>
                    ))}
                  </select>

                  <select
                    value={endDateTime.meridiem}
                    onChange={(e) =>
                      setEndDateTime((current) => ({
                        ...current,
                        meridiem: e.target.value as "AM" | "PM",
                      }))
                    }
                    disabled={loading || saving}
                    className={inputClass}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>

                <p className="mt-2 text-[10px] font-bold text-white/25">
                  12-hour time · {formatDatePreview(endDateTime)}
                </p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="tournamentStatus" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8195b0]">
                  Status
                </label>
                <select
                  id="tournamentStatus"
                  value={settings.tournamentStatus}
                  onChange={(e) =>
                    update(
                      "tournamentStatus",
                      e.target.value as Settings["tournamentStatus"],
                    )
                  }
                  disabled={loading || saving}
                  className={inputClass}
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Live">Live</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-yellow-400/20 bg-yellow-400/[0.03]">
            <div className="border-b border-[#263750] p-6 sm:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-yellow-300">
                Public Communication
              </p>
              <h2 className="mt-2 text-2xl font-black uppercase">Announcement</h2>
            </div>

            <div className="p-6 sm:p-8">
              <label htmlFor="announcement" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8195b0]">
                Public Announcement
              </label>
              <textarea
                id="announcement"
                maxLength={500}
                rows={5}
                value={settings.announcement}
                onChange={(e) => update("announcement", e.target.value)}
                disabled={loading || saving}
                placeholder="Enter an announcement for tournament visitors..."
                className={inputClass + " resize-y leading-6"}
              />
              <p className="mt-2 text-right text-[10px] font-bold text-white/20">{settings.announcement.length}/500</p>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-pink-400/20 bg-pink-400/[0.03]">
            <div className="border-b border-[#263750] p-6 sm:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-pink-300">
                Media
              </p>
              <h2 className="mt-2 text-2xl font-black uppercase">Logo & Banner URLs</h2>
            </div>

            <div className="grid gap-7 p-6 sm:grid-cols-2 sm:p-8">
              <div>
                <label htmlFor="logoUrl" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8195b0]">Logo URL</label>
                <input id="logoUrl" type="url" value={settings.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} disabled={loading || saving} placeholder="https://..." className={inputClass} />
              </div>

              <div>
                <label htmlFor="bannerUrl" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8195b0]">Banner URL</label>
                <input id="bannerUrl" type="url" value={settings.bannerUrl} onChange={(e) => update("bannerUrl", e.target.value)} disabled={loading || saving} placeholder="https://..." className={inputClass} />
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 border-t border-[#263750] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/admin" className="text-center text-xs font-black uppercase tracking-wider text-white/30 transition hover:text-white">
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading || saving || !settings.tournamentName.trim()}
              className="rounded-xl border border-cyan-400/30 bg-[#52e2ff]/[0.06] px-8 py-4 text-xs font-black uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Saving..." : "Save Tournament Settings"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
