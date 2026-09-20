"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Team,
  teams as initialTeams,
} from "../../data/teams";

const TEAMS_STORAGE_KEY = "tournament-teams";

function loadTeams(): Team[] {
  if (typeof window === "undefined") {
    return initialTeams;
  }

  const stored = window.localStorage.getItem(
    TEAMS_STORAGE_KEY,
  );

  if (!stored) {
    return initialTeams;
  }

  try {
    const parsed = JSON.parse(stored);

    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Use defaults.
  }

  return initialTeams;
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "TM"
  );
}

export default function PublicTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    setTeams(loadTeams());
  }, []);

  const sortedTeams = [...teams].sort(
    (a, b) => a.seed - b.seed,
  );

  return (
    <main className="min-h-screen bg-[#080c12] text-white">
      <div className="mx-auto max-w-[1300px] px-5 py-8 sm:px-8">
        <header className="mb-8 border-b border-white/10 pb-6">
          <Link
            href="/admin"
            className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 transition hover:text-white"
          >
            ← ADMIN HUB
          </Link>

          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">
            Tournament Management
          </p>

          <h1 className="mt-2 text-4xl font-black uppercase">
            Registered Teams
          </h1>

          <p className="mt-3 text-sm text-white/40">
            Manage registered rosters, players, team logos and tournament
            seeds.
          </p>
        </header>

        {sortedTeams.length === 0 ? (
          <div className="border border-dashed border-white/10 py-20 text-center">
            <p className="text-xs font-black uppercase tracking-wider text-white/25">
              No teams registered
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {sortedTeams.map((team) => (
              <Link
                key={team.id}
                href={`/tournament/teams/${team.id}`}
                className="border border-white/10 bg-white/[0.03] transition hover:border-cyan-400/30 hover:bg-white/[0.045]"
              >
                <div className="flex items-center gap-4 border-b border-white/10 p-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-black/20">
                    {team.logo ? (
                      <img
                        src={team.logo}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-lg font-black text-white/30">
                        {initials(team.name)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400">
                      Seed {team.seed}
                    </p>

                    <h2 className="mt-1 truncate text-xl font-black uppercase">
                      {team.name}
                    </h2>

                    <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/25">
                      {team.tag}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 border-b border-white/10">
                  <TeamStat
                    label="Wins"
                    value={team.wins}
                  />

                  <TeamStat
                    label="Losses"
                    value={team.losses}
                  />

                  <TeamStat
                    label="Players"
                    value={team.players.length}
                  />
                </div>

                <div className="p-5">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                    Captain / Rank
                  </p>

                  <p className="mt-2 text-xs font-bold text-white/60">
                    {team.captainRank || "Not specified"}
                  </p>

                  <div className="mt-4 space-y-1.5">
                    {team.players.slice(0, 6).map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between border border-white/[0.06] bg-black/20 px-3 py-2"
                      >
                        <span className="truncate text-xs font-bold text-white/60">
                          {player.name}
                        </span>

                        <span className="ml-3 text-[8px] font-black text-white/15">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-right text-[9px] font-black uppercase tracking-wider text-cyan-400/60">
                    View Roster →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function TeamStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="border-r border-white/10 p-4 text-center last:border-r-0">
      <p className="text-[8px] font-black uppercase tracking-wider text-white/20">
        {label}
      </p>

      <p className="mt-1 text-lg font-black">
        {value}
      </p>
    </div>
  );
}