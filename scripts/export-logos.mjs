import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const client = createClient(supabaseUrl, serviceKey);

async function exportLogos() {
  const logosDir = path.join(process.cwd(), "public", "logos");
  if (!fs.existsSync(logosDir)) {
    fs.mkdirSync(logosDir, { recursive: true });
  }

  const { data, error } = await client.from("teams").select("id, name, logo");
  if (error) {
    console.error("Error fetching teams:", error);
    return;
  }

  for (const team of data) {
    if (!team.logo) continue;
    const match = team.logo.match(/^data:([a-zA-Z0-9\/\+]+);base64,(.+)$/);
    if (match) {
      const ext = match[1].includes("jpeg") || match[1].includes("jpg") ? "jpg" : "png";
      const filePath = path.join(logosDir, `${team.id}.${ext}`);
      const buffer = Buffer.from(match[2], "base64");
      fs.writeFileSync(filePath, buffer);
      console.log(`Saved ${team.name} logo to ${filePath} (${buffer.length} bytes)`);
    }
  }
}

exportLogos();
