"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { TournamentNav } from "../components/tournament-nav";
import { Team, teams as initialTeams } from "../../data/teams";

function initials(name: string) {
  return (
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "TM"
  );
}

function TeamStatBox({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="border-r border-[#1e1e3a] p-4 text-center last:border-r-0">
      <p className="text-[8px] font-black uppercase tracking-widest text-[#334155]">{label}</p>
      <p className={`mt-1 text-xl font-black ${accent ?? "text-[#f1f5f9]"}`}>{value}</p>
    </div>
  );
}

export default function PublicTeamsPage() {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function fetchTeams() {
      try {
        const res = await fetch("/api/teams?lite=1", { cache: "no-store" });
        if (!res.ok) throw new Error("Unable to load registered teams.");
        const data = await res.json();
        if (active && Array.isArray(data) && data.length > 0) setTeams(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load teams");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchTeams();
    return () => { active = false; };
  }, []);

  const sortedTeams = [...teams].sort((a, b) => a.seed - b.seed);

  return (
    <div className="min-h-screen bg-[#030308] text-[#f1f5f9]">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#7c3aed]/7 blur-[160px]" />
        <div className="absolute -right-40 top-20 h-[400px] w-[400px] rounded-full bg-[#06b6d4]/6 blur-[140px]" />
      </div>

      <TournamentNav />

      <main className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* Page header */}
        <header className="mb-8 border-b border-[#1e1e3a] pb-6">
          <Link
            href="/tournament"
            className="text-[9px] font-black uppercase tracking-widest text-[#334155] transition hover:text-[#f1f5f9]"
          >
            ← Tournament Central
          </Link>
          <div className="mt-5 text-[9px] font-black uppercase tracking-[0.3em] text-[#06b6d4]">
            Registered Rosters
          </div>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight">Teams</h1>
          <p className="mt-2 text-sm text-[#475569]">Official registered tournament rosters.</p>

          {error && (
            <div className="mt-4 rounded-lg border border-[#ff2d55]/30 bg-[#ff2d55]/8 px-4 py-3">
              <p className="text-xs font-bold text-[#ff4d6a]">{error}</p>
            </div>
          )}
        </header>

        {loading ? (
          <div className="rounded-xl border border-[#1e1e3a] py-24 text-center">
            <p className="text-xs font-black uppercase tracking-widest text-[#334155]">Loading registered teams…</p>
          </div>
        ) : sortedTeams.length === 0 ? (
          <div className="rounded-xl border border-[#1e1e3a] py-24 text-center">
            <p className="text-xs font-black uppercase tracking-widest text-[#334155]">No teams registered</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {sortedTeams.map((team) => (
              <Link
                key={team.id}
                href={`/tournament/teams/${team.id}`}
                className="group overflow-hidden rounded-xl border border-[#1e1e3a] bg-[#0c0c18] transition hover:border-[#7c3aed]/50"
                style={{ transition: "border-color 0.2s, box-shadow 0.2s" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px rgba(124,58,237,0.12)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = "")}
              >
                {/* Team header */}
                <div className="flex items-center gap-4 border-b border-[#1e1e3a] p-5">
                  {/* Logo / Avatar */}
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#1e1e3a] bg-[#030308]"
                    style={{ boxShadow: "inset 0 0 12px rgba(124,58,237,0.08)" }}
                  >
                    {team.logo ? (
                      <Image
                        src={team.logo}
                        alt={team.name}
                        width={56}
                        height={56}
                        unoptimized
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-base font-black text-[#7c3aed]">{initials(team.name)}</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#7c3aed]">
                      SEED {team.seed}
                    </p>
                    <h2 className="mt-0.5 truncate text-lg font-black uppercase tracking-tight">{team.name}</h2>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-[#334155]">{team.tag}</p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 border-b border-[#1e1e3a]">
                  <TeamStatBox label="Wins"    value={team.wins}           accent="text-[#34d399]" />
                  <TeamStatBox label="Losses"  value={team.losses}         accent="text-[#ff4d6a]" />
                  <TeamStatBox label="Players" value={team.players.length} />
                </div>

                {/* Roster */}
                <div className="p-5">
                  {team.captainRank && (
                    <div className="mb-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#334155]">Captain / Rank</p>
                      <p className="mt-1 text-xs font-bold text-[#94a3b8]">{team.captainRank}</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {team.players.slice(0, 6).map((player, i) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between rounded-lg border border-[#1e1e3a] bg-[#030308] px-3 py-2"
                      >
                        <span className="truncate text-xs font-bold text-[#94a3b8]">{player.name}</span>
                        <span className="ml-3 text-[8px] font-black text-[#1e1e3a]">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-right text-[9px] font-black uppercase tracking-widest text-[#7c3aed] group-hover:text-[#9d63ff] transition-colors">
                    View Roster →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}