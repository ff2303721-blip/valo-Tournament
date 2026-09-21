import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  const key = serviceRoleKey || publishableKey;
  if (!key) throw new Error("Missing SUPABASE KEY");
  return createClient(supabaseUrl, key);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // 1. Check local static file first
    const pngPath = path.join(process.cwd(), "public", "logos", `${id}.png`);
    if (fs.existsSync(pngPath)) {
      const buffer = fs.readFileSync(pngPath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    }

    const jpgPath = path.join(process.cwd(), "public", "logos", `${id}.jpg`);
    if (fs.existsSync(jpgPath)) {
      const buffer = fs.readFileSync(jpgPath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    }

    // 2. Fetch from Supabase
    const client = getSupabase();
    const { data: team, error } = await client
      .from("teams")
      .select("logo")
      .eq("id", id)
      .maybeSingle();

    if (error || !team || !team.logo) {
      return new NextResponse("Logo not found", { status: 404 });
    }

    if (team.logo.startsWith("http://") || team.logo.startsWith("https://")) {
      return NextResponse.redirect(team.logo, 302);
    }

    const match = team.logo.match(/^data:([a-zA-Z0-9\/\+]+);base64,(.+)$/);
    if (match) {
      const contentType = match[1];
      const buffer = Buffer.from(match[2], "base64");

      // Cache locally for next time
      try {
        const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
        const targetPath = path.join(process.cwd(), "public", "logos", `${id}.${ext}`);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, buffer);
      } catch {
        // Ignore write error if read-only filesystem
      }

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    }

    return new NextResponse("Invalid logo format", { status: 400 });
  } catch (err) {
    return new NextResponse(err instanceof Error ? err.message : "Error", { status: 500 });
  }
}
