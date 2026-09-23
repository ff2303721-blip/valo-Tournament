import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "./status-badge";

type MatchStatus = "Scheduled" | "Live" | "Completed" | "Cancelled";

type Team = {
  id: string;
  name: string;
  tag: string;
  logo?: string;
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
};

type MatchCardProps = {
  match: Match;
  teams: Team[];
  /** Compact variant for bracket / sidebar */
  compact?: boolean;
  /** Disable link wrapping */
  noLink?: boolean;
};

function getTeam(teams: Team[], id: string) {
  return teams.find((t) => t.id === id);
}

function formatScheduledAt(value: string) {
  if (!value) return "TBD";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function phaseLabel(matchNumber: number) {
  if (matchNumber === 13) return "Q1";
  if (matchNumber === 14) return "ELIMINATION";
  if (matchNumber === 15) return "Q2";
  if (matchNumber === 16) return "GRAND FINAL";
  return `M${String(matchNumber).padStart(2, "0")}`;
}

function TeamAvatar({ team, size = 32 }: { team?: Team; size?: number }) {
  if (!team) return null;
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#1e1e3a] bg-[#030308]"
      style={{ width: size, height: size }}
    >
      {team.logo ? (
        <Image
          src={team.logo}
          alt={team.name}
          width={size}
          height={size}
          unoptimized
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="text-[11px] font-black text-[#94a3b8]">
          {team.tag.slice(0, 3).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function MatchCardInner({
  match,
  teams,
  compact,
}: Omit<MatchCardProps, "noLink">) {
  const t1 = getTeam(teams, match.team1Id);
  const t2 = getTeam(teams, match.team2Id);

  const isCompleted = match.status === "Completed";
  const t1Wins = isCompleted && match.team1Score > match.team2Score;
  const t2Wins = isCompleted && match.team2Score > match.team1Score;

  const isGrandFinal = match.matchNumber === 16;
  const borderClass = isGrandFinal
    ? "border-[#f59e0b]/40 hover:border-[#f59e0b]/70"
    : "border-[#1e1e3a] hover:border-[#2e2e5a]";

  const avatarSize = compact ? 28 : 36;

  return (
    <div
      className={`rounded-xl border ${borderClass} bg-[#0c0c18] transition-all duration-200 ${compact ? "p-3" : "p-5"}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-black uppercase tracking-widest text-[#64748b]">
          {phaseLabel(match.matchNumber)}
          {match.map && match.map !== "TBD" && (
            <span className="ml-2 opacity-60">· {match.map}</span>
          )}
        </span>
        <StatusBadge status={match.status} />
      </div>

      {/* Teams vs Score */}
      <div className={`mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 ${compact ? "" : "mt-4"}`}>
        {/* Team 1 — right-aligned with logo on the right */}
        <div className="flex items-center justify-end gap-2">
          <div className="text-right">
            <div
              className={`font-black tracking-tight ${compact ? "text-sm" : "text-base"} ${
                t1Wins ? "text-[#f1f5f9]" : t2Wins ? "text-[#334155]" : "text-[#f1f5f9]"
              }`}
            >
              {t1?.tag ?? "TBD"}
            </div>
            {!compact && (
              <div className="mt-0.5 text-[11px] text-[#475569]">{t1?.name ?? ""}</div>
            )}
          </div>
          <TeamAvatar team={t1} size={avatarSize} />
        </div>

        {/* Score / VS */}
        <div className="text-center">
          {isCompleted ? (
            <div
              className={`font-black tracking-tight ${compact ? "text-sm" : "text-base"} ${
                isGrandFinal ? "text-[#f59e0b]" : "text-[#f1f5f9]"
              }`}
            >
              <span className={t1Wins ? "text-[#34d399]" : "text-[#334155]"}>
                {match.team1Score}
              </span>
              <span className="mx-1 text-[#1e1e3a]">:</span>
              <span className={t2Wins ? "text-[#34d399]" : "text-[#334155]"}>
                {match.team2Score}
              </span>
            </div>
          ) : (
            <span
              className={`font-black ${compact ? "text-sm" : "text-sm"} ${
                match.status === "Live" ? "text-[#ff2d55]" : "text-[#334155]"
              }`}
            >
              VS
            </span>
          )}
        </div>

        {/* Team 2 — left-aligned with logo on the left */}
        <div className="flex items-center gap-2">
          <TeamAvatar team={t2} size={avatarSize} />
          <div>
            <div
              className={`font-black tracking-tight ${compact ? "text-sm" : "text-base"} ${
                t2Wins ? "text-[#f1f5f9]" : t1Wins ? "text-[#334155]" : "text-[#f1f5f9]"
              }`}
            >
              {t2?.tag ?? "TBD"}
            </div>
            {!compact && (
              <div className="mt-0.5 text-[11px] text-[#475569]">{t2?.name ?? ""}</div>
            )}
          </div>
        </div>
      </div>

      {/* Footer: date */}
      {!compact && match.scheduledAt && (
        <div className="mt-3 text-center text-[11px] text-[#475569]">
          {formatScheduledAt(match.scheduledAt)}
        </div>
      )}
    </div>
  );
}

export function MatchCard({ match, teams, compact, noLink }: MatchCardProps) {
  if (noLink) {
    return <MatchCardInner match={match} teams={teams} compact={compact} />;
  }

  return (
    <Link
      href={`/tournament/matches/${encodeURIComponent(match.id)}`}
      className="block"
    >
      <MatchCardInner match={match} teams={teams} compact={compact} />
    </Link>
  );
}
