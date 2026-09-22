import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Read .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      process.env[key] = val;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const GROUP_FIXTURES = [
  { matchNumber: 1, team1Seed: 1, team2Seed: 2, map: "Lotus" },
  { matchNumber: 2, team1Seed: 1, team2Seed: 3, map: "Sunset" },
  { matchNumber: 3, team1Seed: 1, team2Seed: 4, map: "Haven" },
  { matchNumber: 4, team1Seed: 2, team2Seed: 3, map: "Split" },
  { matchNumber: 5, team1Seed: 2, team2Seed: 4, map: "Ascent" },
  { matchNumber: 6, team1Seed: 3, team2Seed: 4, map: "Bind" },
  { matchNumber: 7, team1Seed: 2, team2Seed: 1, map: "Breeze" },
  { matchNumber: 8, team1Seed: 3, team2Seed: 1, map: "Bind" },
  { matchNumber: 9, team1Seed: 4, team2Seed: 1, map: "Lotus" },
  { matchNumber: 10, team1Seed: 3, team2Seed: 2, map: "Sunset" },
  { matchNumber: 11, team1Seed: 4, team2Seed: 2, map: "Haven" },
  { matchNumber: 12, team1Seed: 4, team2Seed: 3, map: "Ascent" },
];

async function seed() {
  console.log("Fetching teams...");
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, seed, name");

  if (teamsError || !teams || teams.length < 4) {
    console.error("Failed to load 4 seeded teams:", teamsError);
    process.exit(1);
  }

  const teamBySeed = new Map(teams.map((t) => [t.seed, t]));
  console.log("Teams mapped by seed:", Array.from(teamBySeed.entries()).map(([seed, t]) => `#${seed}: ${t.name}`));

  const fixturesToInsert = GROUP_FIXTURES.map((fixture) => {
    const t1 = teamBySeed.get(fixture.team1Seed);
    const t2 = teamBySeed.get(fixture.team2Seed);
    const matchId = `M${String(fixture.matchNumber).padStart(2, "0")}`;

    return {
      id: matchId,
      match_number: fixture.matchNumber,
      stage: "Group Stage",
      team1_id: t1?.id || null,
      team2_id: t2?.id || null,
      scheduled_at: null,
      map: fixture.map,
      best_of: 1,
      team1_score: 0,
      team2_score: 0,
      status: "Scheduled",
      winner_id: null,
      mvp_player_id: null,
      top_fragger_player_id: null,
    };
  });

  console.log(`Inserting ${fixturesToInsert.length} fixtures into Supabase...`);

  // Upsert matches so if any already exist, they are preserved or updated
  const { data, error } = await supabase
    .from("matches")
    .upsert(fixturesToInsert, { onConflict: "id" })
    .select();

  if (error) {
    console.error("Error inserting fixtures:", error);
    process.exit(1);
  }

  console.log(`Successfully seeded ${data.length} group stage fixtures!`);
  data.forEach((m) => {
    console.log(`- ${m.id}: ${m.team1_id} vs ${m.team2_id} on ${m.map} (${m.status})`);
  });
}

seed();
