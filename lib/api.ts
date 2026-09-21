import { Match, Team, TournamentSettings } from "./types";
import { teams as defaultTeams } from "@/app/data/teams";
import { matches as defaultMatches } from "@/app/data/matches";

export const defaultSettings: TournamentSettings = {
  tournamentName: "VALORANT SHOWDOWN",
  tagline: "CHAMPIONSHIP SERIES 2025",
  organizerName: "SRB TOURNAMENT ORG",
  prizePool: "₹50,000 INR",
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  tournamentStatus: "Live",
  announcement: "Welcome to the Valorant Tournament! Group Stage matches are currently ongoing.",
  logoUrl: "",
  bannerUrl: "",
};

export async function fetchTournamentData(): Promise<{
  teams: Team[];
  matches: Match[];
  settings: TournamentSettings;
}> {
  try {
    const [teamsRes, matchesRes, settingsRes] = await Promise.all([
      fetch("/api/teams?lite=1", { cache: "no-store" }),
      fetch("/api/matches", { cache: "no-store" }),
      fetch("/api/settings", { cache: "no-store" }),
    ]);

    let teams: Team[] = defaultTeams;
    let matches: Match[] = defaultMatches;
    let settings: TournamentSettings = defaultSettings;

    if (teamsRes.ok) {
      const data = await teamsRes.json();
      if (Array.isArray(data) && data.length > 0) {
        teams = data;
      }
    }

    if (matchesRes.ok) {
      const data = await matchesRes.json();
      if (Array.isArray(data) && data.length > 0) {
        matches = data;
      }
    }

    if (settingsRes.ok) {
      const data = await settingsRes.json();
      if (data && data.tournamentName) {
        settings = data;
      }
    }

    return { teams, matches, settings };
  } catch (err) {
    console.warn("Using fallback tournament data due to fetch error:", err);
    return {
      teams: defaultTeams,
      matches: defaultMatches,
      settings: defaultSettings,
    };
  }
}

export async function fetchTeams(): Promise<Team[]> {
  try {
    const res = await fetch("/api/teams?lite=1", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn("Failed to fetch teams:", err);
  }
  return defaultTeams;
}

export async function fetchMatches(): Promise<Match[]> {
  try {
    const res = await fetch("/api/matches", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn("Failed to fetch matches:", err);
  }
  return defaultMatches;
}

export async function fetchSettings(): Promise<TournamentSettings> {
  try {
    const res = await fetch("/api/settings", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && data.tournamentName) return data;
    }
  } catch (err) {
    console.warn("Failed to fetch settings:", err);
  }
  return defaultSettings;
}
