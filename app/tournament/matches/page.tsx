"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  Match,
  MatchStatus,
} from "../../data/matches";

import {
  Team,
  teams as initialTeams,
} from "../../data/teams";

const MATCHES_STORAGE_KEY = "tournament-matches";
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

function loadMatches(): Match[] {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = window.localStorage.getItem(
    MATCHES_STORAGE_KEY,
  );

  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);

    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Ignore invalid data.
  }

  return [];
}

function formatDate(value: string) {
  if (!value) {
    return "TBD";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "TBD";
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function teamInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "TM"
  );
}

export default function PublicMatchesPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const [filter, setFilter] =
    useState<"All" | MatchStatus>("All");

  const [search, setSearch] = useState("");

  useEffect(() => {
    setTeams(loadTeams());
    setMatches(loadMatches());
  }, []);

  const filteredMatches = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...matches]
      .filter((match) => {
        if (
          filter !== "All" &&
          match.status !== filter
        ) {
          return false;
        }

        if (!query) {
          return true;
        }

        const team1 = teams.find(
          (team) => team.id === match.team1Id,
        );

        const team2 = teams.find(
          (team) => team.id === match.team2Id,
        );

        return (
          team1?.name.toLowerCase().includes(query) ||
          team2?.name.toLowerCase().includes(query) ||
          match.stage.toLowerCase().includes(query) ||
          `match ${match.matchNumber}`.includes(query)
        );
      })
      .sort(
        (a, b) =>
          a.matchNumber - b.matchNumber,
      );
  }, [matches, teams, filter, search]);

  return (
    <main className="min-h-screen bg-[#080c12] text-white">
      <div className="mx-auto max-w-[1300px] px-5 py-8 sm:px-8">
        <header className="mb-8 border-b border-white/10 pb-6">
          <Link
            href="/tournament"
            className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-white/40 transition hover:text-white"
          >
            ← Tournament Central
          </Link>

          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">
            Tournament Schedule
          </p>

          <h1 className="mt-2 text-4xl font-black uppercase">
            All Matches
          </h1>

          <p className="mt-3 text-sm text-white/35">
            Public tournament match schedule and results.
          </p>
        </header>

        <div className="mb-6 flex flex-col gap-3 border border-white/10 bg-white/[0.03] p-4 lg:flex-row">
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search teams, stage or match..."
            className="flex-1 border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-cyan-400/50"
          />

          <select
            value={filter}
            onChange={(event) =>
              setFilter(
                event.target.value as
                  | "All"
                  | MatchStatus,
              )
            }
            className="border border-white/10 bg-[#0b1017] px-4 py-3 text-sm font-bold outline-none"
          >
            <option value="All">
              All Matches
            </option>

            <option value="Scheduled">
              Scheduled
            </option>

            <option value="Live">
              Live
            </option>

            <option value="Completed">
              Completed
            </option>

            <option value="Cancelled">
              Cancelled
            </option>
          </select>
        </div>

        {filteredMatches.length === 0 ? (
          <div className="border border-dashed border-white/10 py-20 text-center">
            <p className="text-xs font-black uppercase tracking-wider text-white/25">
              No matches found
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((match) => (
              <PublicMatch
                key={match.id}
                match={match}
                teams={teams}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function PublicMatch({
  match,
  teams,
}: {
  match: Match;
  teams: Team[];
}) {
  const team1 = teams.find(
    (team) => team.id === match.team1Id,
  );

  const team2 = teams.find(
    (team) => team.id === match.team2Id,
  );

  return (
    <Link
      href={`/tournament/matches/${match.id}`}
      className="block border border-white/10 bg-white/[0.03] transition hover:border-cyan-400/30 hover:bg-white/[0.045]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <span className="border border-cyan-400/20 bg-cyan-400/[0.05] px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-cyan-300">
            Match #{match.matchNumber}
          </span>

          <span className="border border-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-white/35">
            {match.stage}
          </span>

          <span className="border border-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-white/40">
            {match.status}
          </span>
        </div>

        <span className="text-[9px] font-bold uppercase tracking-wider text-white/25">
          {formatDate(match.scheduledAt)}
        </span>
      </div>

      <div className="grid items-center gap-6 p-6 md:grid-cols-[1fr_140px_1fr]">
        <PublicTeam
          team={team1}
          score={match.team1Score}
          winner={match.winnerId === match.team1Id}
          align="left"
        />

        <div className="text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
            BO{match.bestOf}
          </p>

          <p className="mt-3 text-xs font-black text-white/30">
            {match.map}
          </p>

          <p className="mt-4 text-[9px] font-black uppercase tracking-wider text-cyan-400/60">
            View Details →
          </p>
        </div>

        <PublicTeam
          team={team2}
          score={match.team2Score}
          winner={match.winnerId === match.team2Id}
          align="right"
        />
      </div>
    </Link>
  );
}

function PublicTeam({
  team,
  score,
  winner,
  align,
}: {
  team?: Team;
  score: number;
  winner: boolean;
  align: "left" | "right";
}) {
  if (!team) {
    return (
      <div className="text-xs text-red-400">
        Team unavailable
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-4 ${
        align === "right"
          ? "flex-row-reverse text-right"
          : ""
      }`}
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-black/20">
        {team.logo ? (
          <img
            src={team.logo}
            alt=""
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-xs font-black text-white/30">
            {teamInitials(team.name)}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-lg font-black uppercase ${
            winner
              ? "text-cyan-300"
              : "text-white"
          }`}
        >
          {team.name}
        </p>

        <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/25">
          Seed {team.seed}
        </p>
      </div>

      <span
        className={`text-4xl font-black tabular-nums ${
          winner
            ? "text-cyan-300"
            : "text-white"
        }`}
      >
        {score}
      </span>
    </div>
  );
}