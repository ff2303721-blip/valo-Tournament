"use client";

import { useEffect, useState } from "react";

type TournamentSettings = {
  tournamentName: string;
  tagline: string;
};

const DEFAULT_SETTINGS: TournamentSettings = {
  tournamentName: "VALORANT TOURNAMENT",
  tagline: "COMPETITIVE VALORANT",
};

export function TournamentBrand({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [settings, setSettings] =
    useState<TournamentSettings>(
      DEFAULT_SETTINGS,
    );

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await fetch(
          "/api/settings",
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        if (!active) {
          return;
        }

        setSettings({
          tournamentName:
            typeof data.tournamentName ===
            "string" &&
            data.tournamentName.trim()
              ? data.tournamentName.trim()
              : DEFAULT_SETTINGS.tournamentName,
          tagline:
            typeof data.tagline ===
            "string"
              ? data.tagline.trim()
              : DEFAULT_SETTINGS.tagline,
        });
      } catch {
        // Keep the safe default branding.
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <div
        className={
          compact
            ? "text-[8px] font-black uppercase tracking-[0.28em] text-cyan-400"
            : "text-[9px] font-black uppercase tracking-[0.32em] text-cyan-400"
        }
      >
        {settings.tagline ||
          DEFAULT_SETTINGS.tagline}
      </div>

      <div
        className={
          compact
            ? "mt-1 text-sm font-black uppercase tracking-tight text-white"
            : "mt-1 bg-gradient-to-r from-white via-[#e8faff] to-[#52e2ff] bg-clip-text text-xl font-black uppercase tracking-tight text-transparent sm:text-2xl"
        }
      >
        {settings.tournamentName ||
          DEFAULT_SETTINGS.tournamentName}
      </div>
    </div>
  );
}
