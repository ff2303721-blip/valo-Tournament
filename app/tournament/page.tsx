"use client";

import { useEffect, useMemo, useState } from "react";
import { matches as defaultMatches } from "@/app/data/matches";
import { teams as defaultTeams } from "@/app/data/teams";
import { defaultSettings } from "@/lib/api";
import type { Match, Team, TournamentSettings, Standing } from "@/lib/types";
import { TournamentNav } from "./components/tournament-nav";
import { getGameDefinition } from "@/lib/games/registry";
import {
  type StandingsView,
  type FrontPageProps,
  ValorantFrontPage,
  BgmiFrontPage,
  Cs2FrontPage,
  RocketLeagueFrontPage,
  CustomFrontPage,
} from "./components/frontpages";

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function formatDate(value?: string | null) {
  if (!value) return "Not scheduled";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function buildStandings(teams: Team[], matches: Match[]): Standing[] {
  const map = new Map<string, Standing>();
  for (const team of teams) {
    map.set(team.id, {
      team,
      played: 0,
      wins: 0,
      losses: 0,
      points: 0,
      roundDifference: 0,
    });
  }
  for (const m of matches) {
    if (
      m.stage !== "Group Stage" ||
      m.status !== "Completed" ||
      !m.team1Id ||
      !m.team2Id
    )
      continue;
    const t1 = map.get(m.team1Id);
    const t2 = map.get(m.team2Id);
    if (!t1 || !t2) continue;
    t1.played += 1;
    t2.played += 1;
    t1.roundDifference += m.team1Score - m.team2Score;
    t2.roundDifference += m.team2Score - m.team1Score;
    if (m.team1Score > m.team2Score) {
      t1.wins += 1;
      t1.points += 3;
      t2.losses += 1;
    }
    if (m.team2Score > m.team1Score) {
      t2.wins += 1;
      t2.points += 3;
      t1.losses += 1;
    }
  }
  return [...map.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.roundDifference - a.roundDifference ||
      b.wins - a.wins ||
      a.team.seed - b.team.seed,
  );
}

export default function TournamentDashboard() {
  const [teams, setTeams] = useState<Team[]>(defaultTeams);
  const [matches, setMatches] = useState<Match[]>(defaultMatches);
  const [settings, setSettings] = useState<TournamentSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [standingsView, setStandingsView] = useState<StandingsView>("overall");

  const game = useMemo(() => getGameDefinition(settings?.gameId), [settings?.gameId]);

  useEffect(() => {
    let mounted = true;

    // Fast-path: try to read any previously cached session data
    try {
      const s = sessionStorage.getItem("xmd_tournament_settings");
      if (s) setSettings(JSON.parse(s));
      const t = sessionStorage.getItem("xmd_tournament_teams");
      if (t) setTeams(JSON.parse(t));
      const m = sessionStorage.getItem("xmd_tournament_matches");
      if (m) setMatches(JSON.parse(m));
    } catch {}

    async function load() {
      try {
        const [tr, mr, sr] = await Promise.all([
          fetch("/api/teams?lite=1"),
          fetch("/api/matches"),
          fetch("/api/settings"),
        ]);
        const td = tr.ok ? await tr.json() : null;
        const md = mr.ok ? await mr.json() : null;
        const sd = sr.ok ? await sr.json() : null;
        if (!mounted) return;

        if (Array.isArray(td) && td.length > 0) {
          setTeams(td);
          try { sessionStorage.setItem("xmd_tournament_teams", JSON.stringify(td)); } catch {}
        }
        if (Array.isArray(md) && md.length > 0) {
          setMatches(md);
          try { sessionStorage.setItem("xmd_tournament_matches", JSON.stringify(md)); } catch {}
        }
        if (sd?.tournamentName) {
          setSettings(sd);
          try { sessionStorage.setItem("xmd_tournament_settings", JSON.stringify(sd)); } catch {}
        }
      } catch (err) {
        if (!mounted) return;
        console.warn("Using offline fallback data:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const standings = useMemo(
    () => buildStandings(teams, matches),
    [teams, matches],
  );

  const frontPageProps: FrontPageProps = {
    settings,
    teams,
    matches,
    standings,
    standingsView,
    setStandingsView,
    formatDate,
    game,
  };

  function renderGameFrontPage() {
    switch (game.id) {
      case "bgmi":
        return <BgmiFrontPage {...frontPageProps} />;
      case "cs2":
        return <Cs2FrontPage {...frontPageProps} />;
      case "rocket_league":
        return <RocketLeagueFrontPage {...frontPageProps} />;
      case "custom":
        return <CustomFrontPage {...frontPageProps} />;
      case "valorant":
      default:
        return <ValorantFrontPage {...frontPageProps} />;
    }
  }

  return (
    <main className="relative min-h-screen text-[#f1f5f9] pb-24">
      {/* ── Ambient Neon Glow Orbs ────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#7c3aed]/12 blur-[180px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-[#ff2d55]/10 blur-[160px]" />
        <div className="absolute bottom-10 left-1/3 h-[500px] w-[500px] rounded-full bg-[#06b6d4]/8 blur-[160px]" />
      </div>

      <TournamentNav />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-6 sm:px-8 space-y-8">
        {/* Error banner */}
        {error && (
          <div className="rounded-2xl border border-[#ff2d55]/40 bg-[#ff2d55]/10 p-4 backdrop-blur-xl">
            <div className="font-black text-[#ff4d6a]">
              Unable to load tournament telemetry
            </div>
            <div className="mt-1 text-xs text-[#ff6080]">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-24 text-center backdrop-blur-xl">
            <div className="text-sm font-black uppercase tracking-widest text-[#64748b]">
              Loading tournament arena…
            </div>
          </div>
        ) : (
          renderGameFrontPage()
        )}
      </div>
    </main>
  );
}
