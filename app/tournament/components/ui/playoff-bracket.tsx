import Image from "next/image";
import Link from "next/link";
import type { Match, Team } from "@/lib/types";

function normalizeStage(stage: string) {
  return stage.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

function findStageMatch(matches: Match[], names: string[]): Match | undefined {
  const normalized = names.map(normalizeStage);
  return matches.find((m) => normalized.includes(normalizeStage(m.stage)));
}

function getWinnerId(match?: Match): string | undefined {
  if (!match) return undefined;
  if (match.winnerId) return match.winnerId;
  if (match.status !== "Completed" || match.team1Score === match.team2Score) return undefined;
  return match.team1Score > match.team2Score ? match.team1Id : match.team2Id;
}

function getLoserId(match?: Match): string | undefined {
  const winnerId = getWinnerId(match);
  if (!match || !winnerId) return undefined;
  return match.team1Id === winnerId ? match.team2Id : match.team1Id;
}

function getTeam(teams: Team[], id?: string): Team | undefined {
  return id ? teams.find((t) => t.id === id) : undefined;
}

function formatShortDate(value?: string) {
  if (!value) return "Schedule TBD";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Schedule TBD";
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const REQUIRED_GROUP_MATCHES = 12;

function calculateStandings(teams: Team[], matches: Match[]) {
  const groupMatches = matches.filter((m) => normalizeStage(m.stage) === "group stage");
  const completed = groupMatches.filter((m) => m.status === "Completed");
  if (completed.length < REQUIRED_GROUP_MATCHES) return [];

  const table = teams.map((team) => ({ team, wins: 0, losses: 0, roundDiff: 0 }));
  completed.forEach((m) => {
    const t1 = table.find((e) => e.team.id === m.team1Id);
    const t2 = table.find((e) => e.team.id === m.team2Id);
    if (!t1 || !t2) return;
    if (m.team1Score > m.team2Score) { t1.wins += 1; t2.losses += 1; }
    else if (m.team2Score > m.team1Score) { t2.wins += 1; t1.losses += 1; }
    t1.roundDiff += m.team1Score - m.team2Score;
    t2.roundDiff += m.team2Score - m.team1Score;
  });

  return table
    .sort((a, b) => (b.wins !== a.wins ? b.wins - a.wins : b.roundDiff !== a.roundDiff ? b.roundDiff - a.roundDiff : a.team.seed - b.team.seed))
    .map((e) => e.team);
}

type SlotProps = { team?: Team; score?: number; label: string; winner: boolean; anyScore: boolean };

function TeamRow({ team, score, label, winner, anyScore }: SlotProps) {
  return (
    <div className={`flex items-center justify-between gap-2 px-3 py-2.5 ${winner ? "bg-[#ff2d55]/[0.06]" : ""}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#1e1e3a] bg-[#030308]">
          {team?.logo ? (
            <Image src={team.logo} alt={team.name} width={28} height={28} unoptimized className="h-full w-full object-cover" />
          ) : team ? (
            <span className="text-[9px] font-black text-[#94a3b8]">{team.tag.slice(0, 2).toUpperCase()}</span>
          ) : (
            <span className="text-[10px] font-black text-[#334155]">?</span>
          )}
        </div>
        <span className={`truncate text-[13px] font-black uppercase ${team ? (winner ? "text-white" : "text-[#94a3b8]") : "text-[#334155]"}`}>
          {team?.name ?? label}
        </span>
      </div>
      <span className={`text-sm font-black ${anyScore ? (winner ? "text-white" : "text-[#475569]") : "text-[#334155]"}`}>
        {anyScore ? score : "-"}
      </span>
    </div>
  );
}

function BracketBox({
  title,
  match,
  team1,
  team2,
  team1Label,
  team2Label,
  matchHref,
  accentClass,
}: {
  title: string;
  match?: Match;
  team1?: Team;
  team2?: Team;
  team1Label: string;
  team2Label: string;
  matchHref?: string;
  accentClass: string;
}) {
  const winnerId = getWinnerId(match);
  const anyScore = !!match && match.status !== "Scheduled";

  const inner = (
    <div className={`w-full overflow-hidden rounded-lg border bg-[#0c0c18] transition ${accentClass} ${matchHref ? "hover:border-white/30" : ""}`}>
      <TeamRow team={team1} score={match?.team1Score} label={team1Label} winner={!!winnerId && winnerId === team1?.id} anyScore={anyScore} />
      <div className="border-t border-[#1e1e3a]" />
      <TeamRow team={team2} score={match?.team2Score} label={team2Label} winner={!!winnerId && winnerId === team2?.id} anyScore={anyScore} />
    </div>
  );

  return (
    <div className="w-full max-w-[260px]">
      <div className="mb-1.5 text-[11px] font-black uppercase tracking-[0.15em] text-[#64748b]">{title}</div>
      {matchHref ? (
        <Link href={matchHref} className="block">
          {inner}
        </Link>
      ) : (
        inner
      )}
      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-[#475569]">
        <span>{match?.scheduledAt ? formatShortDate(match.scheduledAt) : "Awaiting seeding"}</span>
        {match?.map && <span>🎥</span>}
      </div>
    </div>
  );
}

export function PlayoffBracket({ teams, matches }: { teams: Team[]; matches: Match[] }) {
  const groupStageComplete =
    matches.filter((m) => normalizeStage(m.stage) === "group stage" && m.status === "Completed").length >= REQUIRED_GROUP_MATCHES;

  const standings = groupStageComplete ? calculateStandings(teams, matches) : [];
  const [rank1, rank2, rank3, rank4] = standings;

  const qualifier1 = findStageMatch(matches, ["Qualifier 1", "Qualifier1", "Q1"]);
  const eliminator = findStageMatch(matches, ["Eliminator"]);
  const qualifier2 = findStageMatch(matches, ["Qualifier 2", "Qualifier2", "Q2"]);
  const grandFinal = findStageMatch(matches, ["Grand Final", "Grand Final 1"]);

  const q1Team1 = getTeam(teams, qualifier1?.team1Id) ?? rank1;
  const q1Team2 = getTeam(teams, qualifier1?.team2Id) ?? rank2;
  const elimTeam1 = getTeam(teams, eliminator?.team1Id) ?? rank3;
  const elimTeam2 = getTeam(teams, eliminator?.team2Id) ?? rank4;

  const q1WinnerId = getWinnerId(qualifier1);
  const q1LoserId = getLoserId(qualifier1);
  const elimWinnerId = getWinnerId(eliminator);

  const q2Team1 = getTeam(teams, qualifier2?.team1Id) ?? getTeam(teams, q1LoserId);
  const q2Team2 = getTeam(teams, qualifier2?.team2Id) ?? getTeam(teams, elimWinnerId);

  const q1WinnerTeam = getTeam(teams, q1WinnerId);
  const q2WinnerId = getWinnerId(qualifier2);
  const q2WinnerTeam = getTeam(teams, q2WinnerId);

  const gfTeam1 = getTeam(teams, grandFinal?.team1Id) ?? q1WinnerTeam;
  const gfTeam2 = getTeam(teams, grandFinal?.team2Id) ?? q2WinnerTeam;

  const champion = grandFinal?.status === "Completed" ? getTeam(teams, getWinnerId(grandFinal)) : undefined;

  return (
    <section className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/90 p-6 backdrop-blur-xl sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e1e3a] pb-5">
        <div>
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#ff4d6a]">Phase 2</span>
          <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-white">Playoff Bracket</h2>
        </div>
        {!groupStageComplete && (
          <span className="rounded-full border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-3 py-1 text-[11px] font-black uppercase text-[#fbbf24]">
            Seeding locks in after Group Stage
          </span>
        )}
        {champion && (
          <span className="rounded-full border border-[#fbbf24]/60 bg-[#fbbf24]/15 px-3 py-1 text-[11px] font-black uppercase text-[#fbbf24]">
            🏆 Champion: {champion.name}
          </span>
        )}
      </div>

      {/* ── Desktop: connected bracket tree ─────────────────────────── */}
      <div className="relative mt-8 hidden lg:block">
        <div className="relative mx-auto" style={{ width: 940, height: 360 }}>
        <svg viewBox="0 0 940 360" className="pointer-events-none absolute inset-0 h-[360px] w-[940px]">
          {/* Q1 -> Q2 stub */}
          <path d="M260 70 H300" stroke="#2e2e5a" strokeWidth="2" fill="none" />
          {/* Eliminator -> Q2 stub */}
          <path d="M260 290 H300" stroke="#2e2e5a" strokeWidth="2" fill="none" />
          {/* merge vertical + into Q2 */}
          <path d="M300 70 V290 M300 180 H340" stroke="#2e2e5a" strokeWidth="2" fill="none" />
          {/* Q2 -> Grand Final */}
          <path d="M600 180 H680" stroke="#2e2e5a" strokeWidth="2" fill="none" />
          {/* Q1 winner bye -> Grand Final (direct path) */}
          <path d="M260 70 H272 V12 H676 V150" stroke="#ff2d55" strokeWidth="2" fill="none" strokeDasharray="4 4" />
        </svg>

        <div className="relative" style={{ height: 360 }}>
          <div className="absolute" style={{ left: 0, top: 20 }}>
            <BracketBox
              title="QUALIFIER 1 · RANK #1 VS #2"
              match={qualifier1}
              team1={q1Team1}
              team2={q1Team2}
              team1Label="Rank #1 TBD"
              team2Label="Rank #2 TBD"
              matchHref={qualifier1 ? `/tournament/matches/${qualifier1.id}` : undefined}
              accentClass="border-[#2e2e5a]/50"
            />
          </div>
          <div className="absolute" style={{ left: 0, top: 240 }}>
            <BracketBox
              title="ELIMINATOR · RANK #3 VS #4"
              match={eliminator}
              team1={elimTeam1}
              team2={elimTeam2}
              team1Label="Rank #3 TBD"
              team2Label="Rank #4 TBD"
              matchHref={eliminator ? `/tournament/matches/${eliminator.id}` : undefined}
              accentClass="border-[#ff2d55]/40"
            />
          </div>
          <div className="absolute" style={{ left: 340, top: 130 }}>
            <BracketBox
              title="QUALIFIER 2 · LOSER Q1 VS WINNER ELIM"
              match={qualifier2}
              team1={q2Team1}
              team2={q2Team2}
              team1Label="Loser Q1"
              team2Label="Winner Eliminator"
              matchHref={qualifier2 ? `/tournament/matches/${qualifier2.id}` : undefined}
              accentClass="border-[#f59e0b]/40"
            />
          </div>
          <div className="absolute" style={{ left: 680, top: 130 }}>
            <BracketBox
              title="GRAND FINAL"
              match={grandFinal}
              team1={gfTeam1}
              team2={gfTeam2}
              team1Label="Winner Q1"
              team2Label="Winner Q2"
              matchHref={grandFinal ? `/tournament/matches/${grandFinal.id}` : undefined}
              accentClass="border-[#10b981]/50"
            />
          </div>
        </div>
        </div>
      </div>

      {/* ── Mobile/tablet: stacked fallback ─────────────────────────── */}
      <div className="mt-6 space-y-5 lg:hidden">
        <BracketBox
          title="QUALIFIER 1 · RANK #1 VS #2"
          match={qualifier1}
          team1={q1Team1}
          team2={q1Team2}
          team1Label="Rank #1 TBD"
          team2Label="Rank #2 TBD"
          matchHref={qualifier1 ? `/tournament/matches/${qualifier1.id}` : undefined}
          accentClass="border-[#2e2e5a]/50"
        />
        <BracketBox
          title="ELIMINATOR · RANK #3 VS #4"
          match={eliminator}
          team1={elimTeam1}
          team2={elimTeam2}
          team1Label="Rank #3 TBD"
          team2Label="Rank #4 TBD"
          matchHref={eliminator ? `/tournament/matches/${eliminator.id}` : undefined}
          accentClass="border-[#ff2d55]/40"
        />
        <BracketBox
          title="QUALIFIER 2 · LOSER Q1 VS WINNER ELIM"
          match={qualifier2}
          team1={q2Team1}
          team2={q2Team2}
          team1Label="Loser Q1"
          team2Label="Winner Eliminator"
          matchHref={qualifier2 ? `/tournament/matches/${qualifier2.id}` : undefined}
          accentClass="border-[#f59e0b]/40"
        />
        <BracketBox
          title="GRAND FINAL"
          match={grandFinal}
          team1={gfTeam1}
          team2={gfTeam2}
          team1Label="Winner Q1"
          team2Label="Winner Q2"
          matchHref={grandFinal ? `/tournament/matches/${grandFinal.id}` : undefined}
          accentClass="border-[#10b981]/50"
        />
      </div>
    </section>
  );
}
