import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

const SESSION_COOKIE = ADMIN_SESSION_COOKIE;
const GAME_SETTINGS_PATH = path.join(process.cwd(), "app", "data", "game-settings.json");

function readGameSettings() {
  try {
    if (fs.existsSync(GAME_SETTINGS_PATH)) {
      const raw = fs.readFileSync(GAME_SETTINGS_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch {}
  return { gameId: "valorant", gameCustomName: "", gameCustomMaps: [] };
}

function writeGameSettings(data: { gameId?: string; gameCustomName?: string; gameCustomMaps?: string[] }) {
  try {
    const current = readGameSettings();
    const updated = {
      ...current,
      gameId: data.gameId ?? current.gameId ?? "valorant",
      gameCustomName: data.gameCustomName ?? current.gameCustomName ?? "",
      gameCustomMaps: data.gameCustomMaps ?? current.gameCustomMaps ?? [],
    };
    fs.writeFileSync(GAME_SETTINGS_PATH, JSON.stringify(updated, null, 2), "utf-8");
    return updated;
  } catch (err) {
    console.warn("Failed to write game-settings.json:", err);
    return { gameId: data.gameId || "valorant" };
  }
}

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase public environment variables.");
  }

  return createClient(url, key);
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase service role environment variable.");
  }

  return createClient(url, serviceRoleKey);
}

function isAdmin(request: NextRequest) {
  return verifyAdminSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDate(value: unknown) {
  const text = cleanString(value);
  if (!text) return null;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

const VALID_TOURNAMENT_STATUSES = [
  "registration_open",
  "upcoming",
  "ongoing_group_stage",
  "ongoing_playoffs",
  "ongoing_grand_finals",
  "concluded",
];

function validateStatus(value: string) {
  return VALID_TOURNAMENT_STATUSES.includes(value);
}

export async function GET() {
  try {
    const supabase = getPublicClient();

    const { data, error } = await supabase
      .from("tournament_settings")
      .select(
        "id,tournament_name,tagline,organizer_name,prize_pool,start_date,end_date,tournament_status,announcement,logo_url,banner_url,updated_at",
      )
      .eq("id", 1)
      .single();

    if (error) {
      console.error("GET /api/settings error:", error);
      return NextResponse.json(
        { error: "Unable to load tournament settings." },
        { status: 500 },
      );
    }

    const gameConfig = readGameSettings();

    return NextResponse.json(
      {
        id: data.id,
        tournamentName: data.tournament_name,
        tagline: data.tagline,
        organizerName: data.organizer_name ?? "",
        prizePool: data.prize_pool ?? "",
        startDate: data.start_date,
        endDate: data.end_date,
        tournamentStatus: data.tournament_status ?? "upcoming",
        announcement: data.announcement ?? "",
        logoUrl: data.logo_url ?? "",
        bannerUrl: data.banner_url ?? "",
        gameId: gameConfig.gameId || "valorant",
        gameCustomName: gameConfig.gameCustomName || "",
        gameCustomMaps: gameConfig.gameCustomMaps || [],
        updatedAt: data.updated_at,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/settings exception:", error);
    return NextResponse.json(
      { error: "Unable to load tournament settings." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();

    const tournamentName = cleanString(body.tournamentName);
    const tagline = cleanString(body.tagline);
    const organizerName = cleanString(body.organizerName);
    const prizePool = cleanString(body.prizePool);
    const announcement = cleanString(body.announcement);
    const tournamentStatus = cleanString(body.tournamentStatus);
    const startDate = normalizeDate(body.startDate);
    const endDate = normalizeDate(body.endDate);
    const logoUrl = cleanString(body.logoUrl);
    const bannerUrl = cleanString(body.bannerUrl);

    if (!tournamentName) {
      return NextResponse.json(
        { error: "Tournament name is required." },
        { status: 400 },
      );
    }

    if (tournamentName.length > 100) {
      return NextResponse.json(
        { error: "Tournament name must be 100 characters or fewer." },
        { status: 400 },
      );
    }

    if (tagline.length > 160) {
      return NextResponse.json(
        { error: "Tagline must be 160 characters or fewer." },
        { status: 400 },
      );
    }

    if (organizerName.length > 100) {
      return NextResponse.json(
        { error: "Organizer name must be 100 characters or fewer." },
        { status: 400 },
      );
    }

    if (prizePool.length > 100) {
      return NextResponse.json(
        { error: "Prize pool must be 100 characters or fewer." },
        { status: 400 },
      );
    }

    if (announcement.length > 500) {
      return NextResponse.json(
        { error: "Announcement must be 500 characters or fewer." },
        { status: 400 },
      );
    }

    if (!validateStatus(tournamentStatus)) {
      return NextResponse.json(
        { error: "Invalid tournament status." },
        { status: 400 },
      );
    }

    if (body.startDate && !startDate) {
      return NextResponse.json(
        { error: "Invalid start date." },
        { status: 400 },
      );
    }

    if (body.endDate && !endDate) {
      return NextResponse.json(
        { error: "Invalid end date." },
        { status: 400 },
      );
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return NextResponse.json(
        { error: "End date cannot be before the start date." },
        { status: 400 },
      );
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("tournament_settings")
      .upsert(
        {
          id: 1,
          tournament_name: tournamentName,
          tagline,
          organizer_name: organizerName,
          prize_pool: prizePool,
          start_date: startDate,
          end_date: endDate,
          tournament_status: tournamentStatus,
          announcement,
          logo_url: logoUrl,
          banner_url: bannerUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      )
      .select(
        "id,tournament_name,tagline,organizer_name,prize_pool,start_date,end_date,tournament_status,announcement,logo_url,banner_url,updated_at",
      )
      .single();

    if (error) {
      console.error("PUT /api/settings error:", error);
      return NextResponse.json(
        { error: "Unable to save tournament settings." },
        { status: 500 },
      );
    }

    const savedGameConfig = writeGameSettings({
      gameId: body.gameId,
      gameCustomName: body.gameCustomName,
      gameCustomMaps: body.gameCustomMaps,
    });

    return NextResponse.json({
      id: data.id,
      tournamentName: data.tournament_name,
      tagline: data.tagline,
      organizerName: data.organizer_name ?? "",
      prizePool: data.prize_pool ?? "",
      startDate: data.start_date,
      endDate: data.end_date,
      tournamentStatus: data.tournament_status ?? "upcoming",
      announcement: data.announcement ?? "",
      logoUrl: data.logo_url ?? "",
      bannerUrl: data.banner_url ?? "",
      gameId: savedGameConfig.gameId || "valorant",
      gameCustomName: savedGameConfig.gameCustomName || "",
      gameCustomMaps: savedGameConfig.gameCustomMaps || [],
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error("PUT /api/settings exception:", error);
    return NextResponse.json(
      { error: "Unable to save tournament settings." },
      { status: 500 },
    );
  }
}
