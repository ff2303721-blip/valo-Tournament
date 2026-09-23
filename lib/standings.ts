import type { Match, Standing, Team } from "./types";

export function buildStandings(teams: Team[], matches: Match[]): Standing[] {
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

export function isGroupStageComplete(matches: Match[], requiredMatches = 12) {
  return (
    matches.filter((m) => m.stage === "Group Stage" && m.status === "Completed")
      .length >= requiredMatches
  );
}
