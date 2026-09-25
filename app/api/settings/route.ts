import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { unstable_cache, revalidateTag } from "next/cache";
import fs from "fs";
import path from "path";
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";
import type { Caster } from "@/lib/types";

const SESSION_COOKIE = ADMIN_SESSION_COOKIE;
const GAME_SETTINGS_PATH = path.join(process.cwd(), "app", "data", "game-settings.json");
const MAX_CASTERS = 4;

function sanitizeCasters(value: unknown): Caster[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_CASTERS).map((entry) => {
    const raw = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
    return {
      name: typeof raw.name === "string" ? raw.name.trim().slice(0, 60) : "",
      logoUrl: typeof raw.logoUrl === "string" ? raw.logoUrl.trim() : "",
      youtubeUrl: typeof raw.youtubeUrl === "string" ? raw.youtubeUrl.trim() : "",
    };
  });
}

function readGameSettings() {
  try {
    if (fs.existsSync(GAME_SETTINGS_PATH)) {
      const raw = fs.readFileSync(GAME_SETTINGS_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch {}
  return { gameId: "valorant", gameCustomName: "", gameCustomMaps: [], casters: [] };
}

function writeGameSettings(data: {
  gameId?: string;
  gameCustomName?: string;
  gameCustomMaps?: string[];
  casters?: Caster[];
}) {
  try {
    const current = readGameSettings();
    const updated = {
      ...current,
      gameId: data.gameId ?? current.gameId ?? "valorant",
      gameCustomName: data.gameCustomName ?? current.gameCustomName ?? "",
      gameCustomMaps: data.gameCustomMaps ?? current.gameCustomMaps ?? [],
      casters: data.casters ?? current.casters ?? [],
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

/** Maps the old 3-value status column to the nearest new lifecycle status, for rows saved before the DB migration ran. */
const LEGACY_STATUS_MAP: Record<string, string> = {
  Upcoming: "upcoming",
  Live: "ongoing_group_stage",
  Completed: "concluded",
};

function normalizeStatus(value: string) {
  if (VALID_TOURNAMENT_STATUSES.includes(value)) return value;
  return LEGACY_STATUS_MAP[value] ?? "";
}

/** Reverse-maps a new lifecycle status to the old 3-value column, for DBs where the status migration hasn't run. */
function toLegacyStatus(value: string) {
  if (value === "concluded") return "Completed";
  if (value.startsWith("ongoing_")) return "Live";
  return "Upcoming";
}

/** Check-constraint violation from Postgres (the status migration may not be applied yet). */
function isCheckConstraintError(error: { code?: string } | null) {
  return error?.code === "23514";
}

const CORE_SETTINGS_COLUMNS =
  "id,tournament_name,tagline,organizer_name,prize_pool,start_date,end_date,tournament_status,announcement,logo_url,banner_url,updated_at";

/** Undefined-column error (the live_stream_url migration may not be applied yet). Postgres reports
 *  this as 42703 on SELECT; PostgREST reports PGRST204 on INSERT/UPSERT when its schema cache
 *  doesn't know the column. */
function isUndefinedColumnError(error: { code?: string } | null) {
  return error?.code === "42703" || error?.code === "PGRST204";
}

const getCachedSettings = unstable_cache(
  async () => {
    const supabase = getPublicClient();

    let { data, error } = await supabase
      .from("tournament_settings")
      .select(`${CORE_SETTINGS_COLUMNS},live_stream_url`)
      .eq("id", 1)
      .single();

    let hasLiveStreamColumn = true;

    if (error && isUndefinedColumnError(error)) {
      hasLiveStreamColumn = false;
      ({ data, error } = await supabase
        .from("tournament_settings")
        .select(CORE_SETTINGS_COLUMNS)
        .eq("id", 1)
        .single());
    }

    if (error || !data) {
      throw new Error(error?.message || "Unable to load tournament settings.");
    }

    const gameConfig = readGameSettings();
    const liveStreamUrl = hasLiveStreamColumn
      ? ((data as { live_stream_url?: string }).live_stream_url ?? "")
      : "";

    return {
      id: data.id,
      tournamentName: data.tournament_name,
      tagline: data.tagline,
      organizerName: data.organizer_name ?? "",
      prizePool: data.prize_pool ?? "",
      startDate: data.start_date,
      endDate: data.end_date,
      tournamentStatus: normalizeStatus(data.tournament_status ?? "") || "upcoming",
      announcement: data.announcement ?? "",
      logoUrl: data.logo_url ?? "",
      bannerUrl: data.banner_url ?? "",
      liveStreamUrl,
      casters: sanitizeCasters(gameConfig.casters),
      gameId: gameConfig.gameId || "valorant",
      gameCustomName: gameConfig.gameCustomName || "",
      gameCustomMaps: gameConfig.gameCustomMaps || [],
      updatedAt: data.updated_at,
    };
  },
  ["public-tournament-settings"],
  {
    revalidate: 60,
    tags: ["settings"],
  },
);

export async function GET() {
  try {
    const settings = await getCachedSettings();

    return NextResponse.json(
      settings,
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
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
    const tournamentStatus = normalizeStatus(cleanString(body.tournamentStatus));
    const startDate = normalizeDate(body.startDate);
    const endDate = normalizeDate(body.endDate);
    const logoUrl = cleanString(body.logoUrl);
    const bannerUrl = cleanString(body.bannerUrl);
    const liveStreamUrl = cleanString(body.liveStreamUrl);

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

    if (
      liveStreamUrl &&
      !/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(liveStreamUrl)
    ) {
      return NextResponse.json(
        { error: "Live stream link must be a YouTube URL." },
        { status: 400 },
      );
    }

    const casters = sanitizeCasters(body.casters);
    for (const caster of casters) {
      if (caster.youtubeUrl && !/^https:\/\//i.test(caster.youtubeUrl)) {
        return NextResponse.json(
          { error: "Caster channel links must be a valid https:// URL." },
          { status: 400 },
        );
      }
    }

    if (!tournamentStatus) {
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

    const basePayload = {
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
    };

    let hasLiveStreamColumn = true;

    let { data, error } = await supabase
      .from("tournament_settings")
      .upsert(
        { ...basePayload, live_stream_url: liveStreamUrl },
        { onConflict: "id" },
      )
      .select(`${CORE_SETTINGS_COLUMNS},live_stream_url`)
      .single();

    if (error && isUndefinedColumnError(error)) {
      hasLiveStreamColumn = false;
      ({ data, error } = await supabase
        .from("tournament_settings")
        .upsert(basePayload, { onConflict: "id" })
        .select(CORE_SETTINGS_COLUMNS)
        .single());
    }

    // The status lifecycle migration may not have run yet — fall back to the
    // old 3-value status so the rest of the settings can still be saved.
    if (error && isCheckConstraintError(error)) {
      // status migration not yet applied — retry with legacy value
      const legacyPayload = {
        ...basePayload,
        tournament_status: toLegacyStatus(tournamentStatus),
      };

      if (hasLiveStreamColumn) {
        ({ data, error } = await supabase
          .from("tournament_settings")
          .upsert({ ...legacyPayload, live_stream_url: liveStreamUrl }, { onConflict: "id" })
          .select(`${CORE_SETTINGS_COLUMNS},live_stream_url`)
          .single());
      } else {
        ({ data, error } = await supabase
          .from("tournament_settings")
          .upsert(legacyPayload, { onConflict: "id" })
          .select(CORE_SETTINGS_COLUMNS)
          .single());
      }

      if (error && isUndefinedColumnError(error)) {
        hasLiveStreamColumn = false;
        ({ data, error } = await supabase
          .from("tournament_settings")
          .upsert(legacyPayload, { onConflict: "id" })
          .select(CORE_SETTINGS_COLUMNS)
          .single());
      }
    }

    if (error || !data) {
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
      casters,
    });

    const liveStreamUrlOut = hasLiveStreamColumn
      ? ((data as { live_stream_url?: string }).live_stream_url ?? "")
      : "";

    try {
      revalidateTag("settings", "default");
    } catch (e) {
      console.warn("revalidateTag error:", e);
    }

    return NextResponse.json({
      id: data.id,
      tournamentName: data.tournament_name,
      tagline: data.tagline,
      organizerName: data.organizer_name ?? "",
      prizePool: data.prize_pool ?? "",
      startDate: data.start_date,
      endDate: data.end_date,
      tournamentStatus: normalizeStatus(data.tournament_status ?? "") || "upcoming",
      announcement: data.announcement ?? "",
      logoUrl: data.logo_url ?? "",
      bannerUrl: data.banner_url ?? "",
      liveStreamUrl: liveStreamUrlOut,
      casters: sanitizeCasters(savedGameConfig.casters),
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
