"use client";

import Link from "next/link";
import { TournamentBrand } from "../../components/tournament-brand";
import { useEffect, useMemo, useState } from "react";

type MatchStatus =
  | "Scheduled"
  | "Live"
  | "Completed"
  | "Cancelled";

type PlayerStat = {
  playerId: string;
  playerName: string;
  teamId: string;
  kills: number;
  deaths: number;
  assists: number;
  acs: number;
  adr: number;
  kast: number;
};

type Match = {
  id: string;
  matchNumber: number;
  stage: string;
  team1Id: string;
  team2Id: string;
  scheduledAt: string;
  map: string;
  bestOf: number;
  team1Score: number;
  team2Score: number;
  status: MatchStatus;
  winnerId?: string;
  mvpPlayerId?: string;
  topFraggerPlayerId?: string;
  playerStats: PlayerStat[];
  createdAt: string;
};

type Team = {
  id: string;
  name: string;
  tag: string;
  seed: number;
  logo?: string;
  wins: number;
  losses: number;
  captainRank?: string;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

const BACKGROUND_IMAGES = [
  "https://images5.alphacoders.com/120/thumb-1920-1202339.png",
  "https://images4.alphacoders.com/120/1202336.png",
  "https://wallpapers.com/images/hd/red-valorant-8k-gaming-2h2qxvq2arallyki.jpg",
  "https://cdn.wallpapersafari.com/4/74/XAY3GaV.jpg",
  "https://i.pinimg.com/736x/ea/30/ea/ea30ea61571b1086b5502c4f82a5fb0c.jpg",
];

function getTeam(teams: Team[], id?: string) {
  return teams.find((team) => team.id === id);
}

function getPlayerName(stats: PlayerStat[], id?: string) {
  return (
    stats.find((player) => player.playerId === id)?.playerName ??
    "—"
  );
}

function formatDate(value: string) {
  if (!value) return "TBD";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string) {
  if (!value) return "TBD";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function statusStyles(status: MatchStatus) {
  if (status === "Live") {
    return "border-[#ff3158]/60 bg-[#ff3158]/15 text-[#ff7691]";
  }

  if (status === "Completed") {
    return "border-emerald-400/50 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "Cancelled") {
    return "border-slate-400/40 bg-slate-400/10 text-slate-300";
  }

  return "border-[#52e2ff]/40 bg-[#52e2ff]/10 text-[#72e9ff]";
}

function StatTable({
  title,
  tag,
  stats,
  accent,
  mvpPlayerId,
  topFraggerPlayerId,
}: {
  title: string;
  tag: string;
  stats: PlayerStat[];
  accent: "pink" | "cyan";
  mvpPlayerId?: string;
  topFraggerPlayerId?: string;
}) {
  const pink = accent === "pink";

  return (
    <section
      className={[
        "overflow-hidden rounded-2xl border bg-[#070d16]/90 backdrop-blur-md",
        pink
          ? "border-[#ff3158]/35"
          : "border-[#52e2ff]/35",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center justify-between border-b px-5 py-4",
          pink
            ? "border-[#ff3158]/15 bg-[#ff3158]/[0.06]"
            : "border-[#52e2ff]/15 bg-[#52e2ff]/[0.06]",
        ].join(" ")}
      >
        <div>
          <div
            className={[
              "text-[9px] font-black uppercase tracking-[0.25em]",
              pink ? "text-[#ff5275]" : "text-[#52e2ff]",
            ].join(" ")}
          >
            PLAYER STATS
          </div>
          <h3 className="mt-1 text-base font-black uppercase">
            {title}
          </h3>
        </div>
        <div
          className={[
            "text-[10px] font-black uppercase tracking-wider",
            pink ? "text-[#ff8da5]" : "text-[#72e9ff]",
          ].join(" ")}
        >
          {tag}
        </div>
      </div>

      {stats.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-[#7188a5]">
          Player statistics will appear after the result is recorded.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead className="bg-black/20 text-[9px] font-black uppercase tracking-[0.16em] text-[#6e829c]">
              <tr>
                <th className="px-5 py-3">Player</th>
                <th className="px-3 py-3">K</th>
                <th className="px-3 py-3">D</th>
                <th className="px-3 py-3">A</th>
                <th className="px-3 py-3">ACS</th>
                <th className="px-3 py-3">ADR</th>
                <th className="px-3 py-3">KAST</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((stat) => {
                const mvp = stat.playerId === mvpPlayerId;
                const topFrag = stat.playerId === topFraggerPlayerId;

                return (
                  <tr
                    key={stat.playerId}
                    className="border-t border-white/[0.06]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white">
                        {stat.playerName}
                      </div>
                      {(mvp || topFrag) && (
                        <div className="mt-1 flex gap-1">
                          {mvp && (
                            <span className="rounded border border-yellow-400/30 bg-yellow-400/10 px-1.5 py-0.5 text-[8px] font-black text-yellow-300">
                              MVP
                            </span>
                          )}
                          {topFrag && (
                            <span className="rounded border border-purple-400/30 bg-purple-400/10 px-1.5 py-0.5 text-[8px] font-black text-purple-300">
                              TOP FRAG
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3.5 font-black">{stat.kills}</td>
                    <td className="px-3 py-3.5 text-[#9aabc0]">{stat.deaths}</td>
                    <td className="px-3 py-3.5 text-[#9aabc0]">{stat.assists}</td>
                    <td className="px-3 py-3.5 font-bold">{stat.acs}</td>
                    <td className="px-3 py-3.5">{Number(stat.adr).toFixed(1)}</td>
                    <td className="px-3 py-3.5">{Number(stat.kast).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function PublicMatchDetailPage({ params }: PageProps) {
  const [match, setMatch] = useState<Match | null>(null);
  const [backgroundImage, setBackgroundImage] = useState(
    BACKGROUND_IMAGES[0],
  );
  const [teams, setTeams] = useState<Team[]>([]);
  const [matchId, setMatchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const resolved = await params;
        if (!active) return;

        setMatchId(resolved.id);

        const randomBackground =
          BACKGROUND_IMAGES[
            Math.floor(
              Math.random() * BACKGROUND_IMAGES.length,
            )
          ];

        setBackgroundImage(randomBackground);

        const [matchResponse, teamsResponse] = await Promise.all([
          fetch(`/api/matches/${encodeURIComponent(resolved.id)}`, {
            cache: "no-store",
          }),
          fetch("/api/teams", {
            cache: "no-store",
          }),
        ]);

        const matchData = await matchResponse.json();
        const teamsData = await teamsResponse.json();

        if (!matchResponse.ok) {
          throw new Error(matchData.error || "Failed to load match.");
        }

        if (!teamsResponse.ok) {
          throw new Error(teamsData.error || "Failed to load teams.");
        }

        if (!active) return;

        setMatch(matchData);
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load match.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [params]);

  const team1 = useMemo(
    () => getTeam(teams, match?.team1Id),
    [teams, match?.team1Id],
  );

  const team2 = useMemo(
    () => getTeam(teams, match?.team2Id),
    [teams, match?.team2Id],
  );

  const team1Stats = useMemo(
    () =>
      (match?.playerStats ?? []).filter(
        (stat) => stat.teamId === match?.team1Id,
      ),
    [match],
  );

  const team2Stats = useMemo(
    () =>
      (match?.playerStats ?? []).filter(
        (stat) => stat.teamId === match?.team2Id,
      ),
    [match],
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#02050b] text-white">
        <div className="rounded-2xl border border-[#52e2ff]/30 bg-[#07101b] px-8 py-6 text-xs font-black uppercase tracking-[0.2em] text-[#72e9ff]">
          Loading match...
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="min-h-screen bg-[#02050b] px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#ff3158]/40 bg-[#0b111b] p-8">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff5275]">
            MATCH ERROR
          </div>
          <h1 className="mt-3 text-3xl font-black">Match not found</h1>
          <p className="mt-2 text-sm text-[#a8b5c8]">
            {error || `No match exists for ${matchId}.`}
          </p>
          <Link
            href="/tournament/matches"
            className="mt-6 inline-flex rounded-xl border border-[#52e2ff]/30 bg-[#07131c] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#72e9ff]"
          >
            ← All Matches
          </Link>
        </div>
      </main>
    );
  }

  const dateLabel = formatDate(match.scheduledAt);
  const timeLabel = formatTime(match.scheduledAt);
  const mapName = match.map || "TBD";
  const team1Won =
    match.status === "Completed" &&
    match.winnerId === match.team1Id;
  const team2Won =
    match.status === "Completed" &&
    match.winnerId === match.team2Id;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#02050b] text-white">
      {/* Real page background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("${backgroundImage}")`,
          transform: "scale(1.02)",
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[#02050b]/45" />
      <div className="pointer-events-none fixed inset-0 z-[2] bg-[linear-gradient(90deg,rgba(255,15,79,0.14),transparent_34%,transparent_66%,rgba(23,224,255,0.14)),linear-gradient(180deg,rgba(2,5,11,0.25),rgba(2,5,11,0.68))]" />
      <div className="pointer-events-none fixed inset-0 z-[3] bg-[radial-gradient(circle_at_12%_42%,rgba(255,20,79,0.16),transparent_25%),radial-gradient(circle_at_88%_42%,rgba(35,230,255,0.14),transparent_27%)]" />

      <header className="relative z-10 border-t border-[#8b2cff]/40 bg-[#030812]/55 backdrop-blur-[2px]">
        <div className="mx-auto max-w-[1280px] px-5 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-5">
            <div>
              <Link
                href="/tournament/matches"
                className="text-[10px] font-black uppercase tracking-[0.18em] text-[#52e2ff] hover:text-white"
              >
                ← All Matches
              </Link>
              <div className="mt-3">
                <TournamentBrand compact />
              </div>
            </div>

            <div
              className={[
                "rounded-xl border px-4 py-2.5",
                statusStyles(match.status),
              ].join(" ")}
            >
              <div className="text-[9px] font-black uppercase tracking-[0.18em] opacity-70">
                Status
              </div>
              <div className="mt-0.5 text-xs font-black uppercase">
                {match.status}
              </div>
            </div>
          </div>

          <div className="pb-3 pt-7">
            <div className="text-[10px] font-black uppercase tracking-[0.32em] text-[#52e2ff]">
              Match {String(match.matchNumber).padStart(2, "0")}
            </div>
            <h1 className="mt-2 text-[46px] font-black uppercase leading-[0.92] tracking-tight sm:text-[56px]">
              <span className="text-white">
                {match.stage.split(" ")[0]}
              </span>{" "}
              <span className="text-[#ff5275]">
                {match.stage.split(" ").slice(1).join(" ") ||
                  match.stage}
              </span>
            </h1>
            <div className="mt-3 text-xs font-bold text-[#a6b6ca]">
              Best of {match.bestOf} (BO{match.bestOf})
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[1280px] px-5 py-7 sm:px-8">
        {/* Main match hero */}
        <section className="relative overflow-hidden rounded-[22px] border border-[#3b5a78] bg-[#060b14]/72 shadow-[0_25px_90px_rgba(0,0,0,0.58)] backdrop-blur-[3px]">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#ff174f] via-[#ff5b9b] to-[#27e4ff]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(255,20,79,0.20),transparent_35%),radial-gradient(circle_at_85%_50%,rgba(35,230,255,0.20),transparent_35%)]" />

          <div className="relative grid items-center gap-5 px-6 py-8 sm:px-10 lg:grid-cols-[1fr_1.2fr_1fr] lg:py-10">
            <div className="text-center lg:text-left">
              {team1?.logo ? (
                <img
                  src={team1.logo}
                  alt=""
                  className="mx-auto h-24 w-24 rounded-2xl border border-[#ff3158]/50 bg-[#080b12] object-contain p-2 shadow-[0_0_35px_rgba(255,49,88,0.22)] lg:mx-0"
                />
              ) : (
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border border-[#ff3158]/50 bg-[#160812] text-xl font-black text-[#ff6685] lg:mx-0">
                  {(team1?.tag || "TBD").slice(0, 3)}
                </div>
              )}
              <div className="mt-4 text-xl font-black uppercase">
                {team1?.name || "TBD"}
              </div>
              <div className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#7389a4]">
                {team1?.tag || "TBD"}
                {team1Won ? " · WINNER" : ""}
              </div>
            </div>

            <div className="text-center">
              <div className="text-[9px] font-black uppercase tracking-[0.32em] text-[#7389a4]">
                Match Score
              </div>
              <div className="mt-1 text-[68px] font-black leading-none tracking-tight sm:text-[76px]">
                {match.team1Score}
                <span className="mx-2 text-[#ff5275]">-</span>
                {match.team2Score}
              </div>
              <div className="mx-auto mt-3 h-px w-36 bg-gradient-to-r from-transparent via-[#52e2ff] to-transparent" />

              <div className="mx-auto mt-5 max-w-[390px] overflow-hidden rounded-xl border border-[#52e2ff]/35 bg-[#07101a]/90">
                <div className="border-b border-white/[0.07] px-4 py-2 text-[9px] font-black uppercase tracking-[0.28em] text-[#52e2ff]">
                  Map
                </div>
                <div className="relative flex h-[104px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_24%_40%,rgba(255,20,79,0.35),transparent_34%),radial-gradient(circle_at_78%_62%,rgba(35,230,255,0.30),transparent_38%),linear-gradient(135deg,#190b1a,#07141e)]">
                  <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,transparent_24%,rgba(255,255,255,0.14)_25%,transparent_26%),linear-gradient(315deg,transparent_24%,rgba(255,255,255,0.08)_25%,transparent_26%)] [background-size:34px_34px]" />
                  <span className="relative text-3xl font-black uppercase tracking-[0.12em]">
                    {mapName}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center lg:text-right">
              {team2?.logo ? (
                <img
                  src={team2.logo}
                  alt=""
                  className="mx-auto h-24 w-24 rounded-2xl border border-[#52e2ff]/50 bg-[#071018] object-contain p-2 shadow-[0_0_35px_rgba(39,217,255,0.22)] lg:ml-auto lg:mr-0"
                />
              ) : (
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border border-[#52e2ff]/50 bg-[#06131a] text-xl font-black text-[#72e9ff] lg:ml-auto lg:mr-0">
                  {(team2?.tag || "TBD").slice(0, 3)}
                </div>
              )}
              <div className="mt-4 text-xl font-black uppercase">
                {team2?.name || "TBD"}
              </div>
              <div className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#7389a4]">
                {team2?.tag || "TBD"}
                {team2Won ? " · WINNER" : ""}
              </div>
            </div>
          </div>

          <div className="grid border-t border-white/[0.08] bg-black/25 sm:grid-cols-3">
            <div className="border-b border-white/[0.07] px-5 py-3.5 text-center sm:border-b-0 sm:border-r">
              <div className="text-[8px] font-black uppercase tracking-[0.22em] text-[#7188a5]">
                Date
              </div>
              <div className="mt-1 text-xs font-black">{dateLabel}</div>
            </div>
            <div className="border-b border-white/[0.07] px-5 py-3.5 text-center sm:border-b-0 sm:border-r">
              <div className="text-[8px] font-black uppercase tracking-[0.22em] text-[#7188a5]">
                Time
              </div>
              <div className="mt-1 text-xs font-black">{timeLabel}</div>
            </div>
            <div className="px-5 py-3.5 text-center">
              <div className="text-[8px] font-black uppercase tracking-[0.22em] text-[#7188a5]">
                Format
              </div>
              <div className="mt-1 text-xs font-black">
                Best of {match.bestOf} (BO{match.bestOf})
              </div>
            </div>
          </div>
        </section>

        {/* Target-style information area */}
        <section className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-[#ff3158]/30 bg-[#070d16]/82 p-5 backdrop-blur-md">
            <div className="text-[9px] font-black uppercase tracking-[0.24em] text-[#ff5275]">
              Match Details
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08]">
              {[
                ["Tournament Stage", match.stage],
                ["Match Number", `M${String(match.matchNumber).padStart(2, "0")}`],
                ["Map", mapName],
                ["Format", `Best of ${match.bestOf} (BO${match.bestOf})`],
                ["Status", match.status],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-2 border-b border-white/[0.07] px-4 py-3 text-xs last:border-0"
                >
                  <span className="font-bold text-[#7188a5]">{label}</span>
                  <span className="text-right font-black">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#52e2ff]/30 bg-[#071019]/82 p-5 backdrop-blur-md">
            <div className="text-[9px] font-black uppercase tracking-[0.24em] text-[#52e2ff]">
              Map & Schedule
            </div>

            <div className="relative mt-4 min-h-[188px] overflow-hidden rounded-xl border border-[#52e2ff]/20 bg-[radial-gradient(circle_at_25%_30%,rgba(255,20,79,0.22),transparent_30%),radial-gradient(circle_at_75%_65%,rgba(35,230,255,0.20),transparent_35%),linear-gradient(135deg,#111928,#071019)]">
              <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(135deg,transparent_24%,rgba(255,255,255,0.08)_25%,transparent_26%),linear-gradient(315deg,transparent_24%,rgba(255,255,255,0.06)_25%,transparent_26%)] [background-size:38px_38px]" />
              <div className="relative flex h-full min-h-[188px] items-center justify-center text-center">
                <div>
                  <div className="text-[8px] font-black uppercase tracking-[0.3em] text-[#52e2ff]">
                    Selected Map
                  </div>
                  <div className="mt-2 text-4xl font-black uppercase tracking-[0.08em]">
                    {mapName}
                  </div>
                  <div className="mt-3 text-xs font-bold text-[#91a4bc]">
                    {dateLabel} · {timeLabel}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#ff3158]/25 bg-[#070d16]/82 p-5 backdrop-blur-md">
            <div className="text-[9px] font-black uppercase tracking-[0.24em] text-[#ff5275]">
              Match Notes
            </div>
            <p className="mt-4 text-sm leading-6 text-[#9eafc3]">
              {match.status === "Completed"
                ? "Official result recorded. Player performance data is shown below."
                : "This match is scheduled. Official result and player statistics will appear after the match is recorded by the tournament admin."}
            </p>
          </div>

          <div className="rounded-2xl border border-[#8b2cff]/30 bg-[#0a0914]/82 p-5 backdrop-blur-md">
            <div className="text-[9px] font-black uppercase tracking-[0.24em] text-[#b78cff]">
              Match Recognition
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/[0.05] p-4">
                <div className="text-[8px] font-black uppercase tracking-[0.2em] text-yellow-300">
                  MVP
                </div>
                <div className="mt-1 font-black">
                  {getPlayerName(match.playerStats, match.mvpPlayerId)}
                </div>
              </div>
              <div className="rounded-xl border border-purple-400/20 bg-purple-400/[0.05] p-4">
                <div className="text-[8px] font-black uppercase tracking-[0.2em] text-purple-300">
                  Top Fragger
                </div>
                <div className="mt-1 font-black">
                  {getPlayerName(
                    match.playerStats,
                    match.topFraggerPlayerId,
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.25em] text-[#52e2ff]">
                Player Statistics
              </div>
              <h2 className="mt-1 text-2xl font-black uppercase">
                Team Performance
              </h2>
            </div>
            <div className="hidden text-[9px] font-black uppercase tracking-[0.2em] text-[#7188a5] sm:block">
              K / D / A · ACS · ADR · KAST
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <StatTable
              title={team1?.name || "TBD"}
              tag={team1?.tag || "TBD"}
              stats={team1Stats}
              accent="pink"
              mvpPlayerId={match.mvpPlayerId}
              topFraggerPlayerId={match.topFraggerPlayerId}
            />
            <StatTable
              title={team2?.name || "TBD"}
              tag={team2?.tag || "TBD"}
              stats={team2Stats}
              accent="cyan"
              mvpPlayerId={match.mvpPlayerId}
              topFraggerPlayerId={match.topFraggerPlayerId}
            />
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-3 pb-4">
          <Link
            href="/tournament/matches"
            className="rounded-xl border border-[#52e2ff]/25 bg-[#07111b]/90 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#9bdff0] hover:border-[#52e2ff]/60 hover:text-white"
          >
            ← All Matches
          </Link>
          <Link
            href="/tournament/teams"
            className="rounded-xl border border-[#ff3158]/25 bg-[#110912]/90 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#ff9ab0] hover:border-[#ff3158]/60 hover:text-white"
          >
            View Teams
          </Link>
        </div>
      </div>
    </main>
  );
}
