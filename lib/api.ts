import { Match, Team, TournamentSettings } from "./types";

export const defaultSettings: TournamentSettings = {
  tournamentName: "",
  tagline: "",
  organizerName: "",
  prizePool: "",
  startDate: null,
  endDate: null,
  tournamentStatus: "Upcoming",
  announcement: "",
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
      fetch("/api/teams?lite=1"),
      fetch("/api/matches"),
      fetch("/api/settings"),
    ]);

    let teams: Team[] = [];
    let matches: Match[] = [];
    let settings: TournamentSettings | null = null;

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

    if (!teamsRes.ok || !matchesRes.ok || !settingsRes.ok || !settings) {
      throw new Error("Failed to load tournament data from Supabase.");
    }

    return { teams, matches, settings };
  } catch (err) {
    console.error("Failed to load tournament data:", err);
    return {
      teams: [],
      matches: [],
      settings: null as unknown as TournamentSettings,
    };
  }
}

export async function fetchTeams(): Promise<Team[]> {
  try {
    const res = await fetch("/api/teams?lite=1");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn("Failed to fetch teams:", err);
  }
  return [];
}

export async function fetchMatches(): Promise<Match[]> {
  try {
    const res = await fetch("/api/matches");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn("Failed to fetch matches:", err);
  }
  return [];
}

export async function fetchSettings(): Promise<TournamentSettings> {
  try {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      if (data && data.tournamentName) return data;
    }
  } catch (err) {
    console.warn("Failed to fetch settings:", err);
  }
  return defaultSettings;
}
