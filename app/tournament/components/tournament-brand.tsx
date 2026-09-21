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

export function TournamentBrand({ compact = false }: { compact?: boolean }) {
  const [settings, setSettings] = useState<TournamentSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (!active) return;

        setSettings({
          tournamentName:
            typeof data.tournamentName === "string" && data.tournamentName.trim()
              ? data.tournamentName.trim()
              : DEFAULT_SETTINGS.tournamentName,
          tagline:
            typeof data.tagline === "string"
              ? data.tagline.trim()
              : DEFAULT_SETTINGS.tagline,
        });
      } catch {
        // Keep default branding
      }
    }

    loadSettings();
    return () => { active = false; };
  }, []);

  if (compact) {
    return (
      <div>
        <div className="text-[8px] font-black uppercase tracking-[0.3em] text-[#ff2d55]">
          {settings.tagline || DEFAULT_SETTINGS.tagline}
        </div>
        <div className="mt-0.5 text-sm font-black uppercase tracking-tight text-white">
          {settings.tournamentName || DEFAULT_SETTINGS.tournamentName}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-[9px] font-black uppercase tracking-[0.35em] text-[#ff2d55]">
        {settings.tagline || DEFAULT_SETTINGS.tagline}
      </div>
      <div
        className="mt-1 text-xl font-black uppercase tracking-tight sm:text-2xl"
        style={{
          background: "linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 40%, #9d63ff 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {settings.tournamentName || DEFAULT_SETTINGS.tournamentName}
      </div>
    </div>
  );
}
