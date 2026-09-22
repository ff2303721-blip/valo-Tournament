import type { SupabaseClient } from "@supabase/supabase-js";

export async function syncPlayoffsWithDatabase(client: SupabaseClient) {
  try {
    const [matchesRes, teamsRes] = await Promise.all([
      client.from("matches").select("*").order("match_number", { ascending: true }),
      client.from("teams").select("id, name, seed").order("seed", { ascending: true }),
    ]);

    if (matchesRes.error || teamsRes.error || !matchesRes.data || !teamsRes.data) {
      return;
    }

    const matches = matchesRes.data;
    const teams = teamsRes.data;

    const groupMatches = matches.filter(
      (m) => m.match_number >= 1 && m.match_number <= 12,
    );
    const completedGroups = groupMatches.filter((m) => m.status === "Completed");

    // 1. If all 12 group matches are completed, calculate group standings
    if (completedGroups.length === 12) {
      const table = teams.map((team) => ({
        teamId: team.id,
        played: 0,
        wins: 0,
        losses: 0,
        roundDiff: 0,
        points: 0,
      }));
      const byId = new Map(table.map((row) => [row.teamId, row]));

      for (const m of completedGroups) {
        if (!m.team1_id || !m.team2_id) continue;
        const t1 = byId.get(m.team1_id);
        const t2 = byId.get(m.team2_id);
        if (!t1 || !t2) continue;

        t1.played += 1;
        t2.played += 1;
        const s1 = Number(m.team1_score) || 0;
        const s2 = Number(m.team2_score) || 0;
        t1.roundDiff += s1 - s2;
        t2.roundDiff += s2 - s1;

        if (m.winner_id === m.team1_id || s1 > s2) {
          t1.wins += 1;
          t1.points += 2;
          t2.losses += 1;
        } else if (m.winner_id === m.team2_id || s2 > s1) {
          t2.wins += 1;
          t2.points += 2;
          t1.losses += 1;
        }
      }

      table.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.roundDiff !== a.roundDiff) return b.roundDiff - a.roundDiff;
        return b.wins - a.wins;
      });

      const [rank1, rank2, rank3, rank4] = table.map((r) => r.teamId);

      // M13 (Qualifier 1): Rank 1 vs Rank 2
      const m13 = matches.find((m) => m.match_number === 13);
      if (m13 && (m13.team1_id !== rank1 || m13.team2_id !== rank2)) {
        await client
          .from("matches")
          .update({ team1_id: rank1, team2_id: rank2 })
          .eq("id", m13.id);
        m13.team1_id = rank1;
        m13.team2_id = rank2;
      }

      // M14 (Eliminator): Rank 3 vs Rank 4
      const m14 = matches.find((m) => m.match_number === 14);
      if (m14 && (m14.team1_id !== rank3 || m14.team2_id !== rank4)) {
        await client
          .from("matches")
          .update({ team1_id: rank3, team2_id: rank4 })
          .eq("id", m14.id);
        m14.team1_id = rank3;
        m14.team2_id = rank4;
      }
    }

    // 2. Progression into Qualifier 2 (M15) & Grand Final (M16)
    const m13 = matches.find((m) => m.match_number === 13);
    const m14 = matches.find((m) => m.match_number === 14);
    const m15 = matches.find((m) => m.match_number === 15);
    const m16 = matches.find((m) => m.match_number === 16);

    let loserM13: string | null = null;
    let winnerM13: string | null = null;
    if (m13 && m13.status === "Completed") {
      winnerM13 =
        m13.winner_id ||
        (Number(m13.team1_score) > Number(m13.team2_score)
          ? m13.team1_id
          : m13.team2_id);
      loserM13 = winnerM13 === m13.team1_id ? m13.team2_id : m13.team1_id;
    }

    let winnerM14: string | null = null;
    if (m14 && m14.status === "Completed") {
      winnerM14 =
        m14.winner_id ||
        (Number(m14.team1_score) > Number(m14.team2_score)
          ? m14.team1_id
          : m14.team2_id);
    }

    if (m15 && (loserM13 || winnerM14)) {
      const newTeam1 = loserM13 || m15.team1_id;
      const newTeam2 = winnerM14 || m15.team2_id;
      if (newTeam1 !== m15.team1_id || newTeam2 !== m15.team2_id) {
        await client
          .from("matches")
          .update({ team1_id: newTeam1, team2_id: newTeam2 })
          .eq("id", m15.id);
        m15.team1_id = newTeam1;
        m15.team2_id = newTeam2;
      }
    }

    let winnerM15: string | null = null;
    if (m15 && m15.status === "Completed") {
      winnerM15 =
        m15.winner_id ||
        (Number(m15.team1_score) > Number(m15.team2_score)
          ? m15.team1_id
          : m15.team2_id);
    }

    if (m16 && (winnerM13 || winnerM15)) {
      const newTeam1 = winnerM13 || m16.team1_id;
      const newTeam2 = winnerM15 || m16.team2_id;
      if (newTeam1 !== m16.team1_id || newTeam2 !== m16.team2_id) {
        await client
          .from("matches")
          .update({ team1_id: newTeam1, team2_id: newTeam2 })
          .eq("id", m16.id);
      }
    }
  } catch (err) {
    console.warn("Failed to auto-sync playoffs:", err);
  }
}
