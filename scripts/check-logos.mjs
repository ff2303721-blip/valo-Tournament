import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const client = createClient(supabaseUrl, serviceKey);

async function main() {
  const { data, error } = await client.from("teams").select("id, name, logo");
  if (error) {
    console.error("Error:", error);
    return;
  }
  for (const t of data) {
    console.log(t.id, t.name, t.logo ? `${t.logo.substring(0, 40)}... totalLen=${t.logo.length}` : "null");
  }
}

main();
