"use client";

import { useEffect, useState } from "react";

type TournamentSettings = {
  tournamentName: string;
  tagline: string;
};

const DEFAULT_SETTINGS: TournamentSettings = {
  tournamentName: "ESPORTS TOURNAMENT",
  tagline: "COMPETITIVE ESPORTS",
};

export function TournamentBrand({ compact = false }: { compact?: boolean }) {
  const [settings, setSettings] = useState<TournamentSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await fetch("/api/settings");
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
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#ff8fa3]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff2d55]" />
          <span>{settings.tagline || DEFAULT_SETTINGS.tagline}</span>
        </div>
        <div className="text-base font-black uppercase tracking-tight text-white group-hover:text-white/90 transition-colors">
          {settings.tournamentName || DEFAULT_SETTINGS.tournamentName}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-[11px] font-black uppercase tracking-[0.35em] text-[#ff2d55]">
        {settings.tagline || DEFAULT_SETTINGS.tagline}
      </div>
      <div
        className="mt-1 text-xl font-black uppercase tracking-tight sm:text-2xl"
        style={{
          background: "linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 40%, #94a3b8 100%)",
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
