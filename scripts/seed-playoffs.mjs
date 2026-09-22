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

const PLAYOFF_MATCHES = [
  {
    id: "M13",
    match_number: 13,
    stage: "Qualifier 1",
    team1_id: null,
    team2_id: null,
    scheduled_at: null,
    map: "Ascent",
    best_of: 1,
    team1_score: 0,
    team2_score: 0,
    status: "Scheduled",
    winner_id: null,
    mvp_player_id: null,
    top_fragger_player_id: null,
  },
  {
    id: "M14",
    match_number: 14,
    stage: "Eliminator",
    team1_id: null,
    team2_id: null,
    scheduled_at: null,
    map: "Lotus",
    best_of: 1,
    team1_score: 0,
    team2_score: 0,
    status: "Scheduled",
    winner_id: null,
    mvp_player_id: null,
    top_fragger_player_id: null,
  },
  {
    id: "M15",
    match_number: 15,
    stage: "Qualifier 2",
    team1_id: null,
    team2_id: null,
    scheduled_at: null,
    map: "Sunset",
    best_of: 1,
    team1_score: 0,
    team2_score: 0,
    status: "Scheduled",
    winner_id: null,
    mvp_player_id: null,
    top_fragger_player_id: null,
  },
  {
    id: "M16",
    match_number: 16,
    stage: "Grand Final",
    team1_id: null,
    team2_id: null,
    scheduled_at: null,
    map: "Decider",
    best_of: 3,
    team1_score: 0,
    team2_score: 0,
    status: "Scheduled",
    winner_id: null,
    mvp_player_id: null,
    top_fragger_player_id: null,
  },
];

async function seedPlayoffs() {
  console.log("Upserting Playoff Matches (M13 to M16)...");

  const { data, error } = await supabase
    .from("matches")
    .upsert(PLAYOFF_MATCHES, { onConflict: "id" })
    .select();

  if (error) {
    console.error("Error inserting playoff matches:", error);
    process.exit(1);
  }

  console.log(`Successfully seeded ${data.length} playoff fixtures!`);
  data.forEach((m) => {
    console.log(`- ${m.id} (${m.stage}): map=${m.map}, BO${m.best_of}, status=${m.status}`);
  });
}

seedPlayoffs();
