import type { GameDefinition } from "./types";

export const GAMES: Record<string, GameDefinition> = {
  valorant: {
    id: "valorant",
    name: "Valorant",
    shortName: "VALORANT",
    tagline: "5v5 Character-Based Tactical Shooter",
    icon: "V",
    category: "tactical_fps",
    scoringType: "rounds",
    scoreLabel: "Rounds",
    defaultTeamSize: 5,
    supportsRiotApi: true,
    maps: [
      {
        id: "lotus",
        name: "Lotus",
        splashUrl: "https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/splash.png",
      },
      {
        id: "sunset",
        name: "Sunset",
        splashUrl: "https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/splash.png",
      },
      {
        id: "haven",
        name: "Haven",
        splashUrl: "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/splash.png",
      },
      {
        id: "ascent",
        name: "Ascent",
        splashUrl: "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png",
      },
      {
        id: "split",
        name: "Split",
        splashUrl: "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png",
      },
      {
        id: "bind",
        name: "Bind",
        splashUrl: "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png",
      },
      {
        id: "breeze",
        name: "Breeze",
        splashUrl: "https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png",
      },
      {
        id: "icebox",
        name: "Icebox",
        splashUrl: "https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/splash.png",
      },
      {
        id: "pearl",
        name: "Pearl",
        splashUrl: "https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/splash.png",
      },
      {
        id: "abyss",
        name: "Abyss",
        splashUrl: "https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/splash.png",
      },
    ],
    wallpapers: [
      "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png",
      "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png",
      "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png",
      "https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png",
      "https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/splash.png",
      "https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/splash.png",
      "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/splash.png",
      "https://images5.alphacoders.com/120/thumb-1920-1202339.png",
      "https://images4.alphacoders.com/120/1202336.png",
    ],
    statColumns: [
      { key: "acs", label: "ACS", tooltip: "Average Combat Score per round", isPrimary: true },
      { key: "kills", label: "K", tooltip: "Total Kills" },
      { key: "deaths", label: "D", tooltip: "Total Deaths" },
      { key: "assists", label: "A", tooltip: "Total Assists" },
      { key: "kd", label: "K/D", tooltip: "Kill to Death Ratio" },
      { key: "adr", label: "ADR", tooltip: "Average Damage per Round" },
      { key: "kast", label: "KAST%", tooltip: "Percentage of rounds with Kill, Assist, Survive, or Trade" },
      { key: "wins", label: "W", tooltip: "Matches Won" },
      { key: "mvps", label: "MVP", tooltip: "Match MVP Accolades" },
    ],
    podiumLabels: {
      ratingLeader: "Rating King (ACS)",
      topFragger: "Top Fragger (Kills)",
      mvp: "Tournament MVP",
    },
  },

  cs2: {
    id: "cs2",
    name: "Counter-Strike 2",
    shortName: "CS2",
    tagline: "Premier 5v5 Tactical FPS by Valve",
    icon: "💣",
    category: "tactical_fps",
    scoringType: "rounds",
    scoreLabel: "Rounds",
    defaultTeamSize: 5,
    supportsRiotApi: false,
    maps: [
      {
        id: "mirage",
        name: "Mirage",
        splashUrl: "https://cdn.cloudflare.steamstatic.com/apps/csgo/images/csgo_react/social/cs2.jpg",
      },
      {
        id: "inferno",
        name: "Inferno",
        splashUrl: "https://cdn.cloudflare.steamstatic.com/apps/csgo/images/csgo_react/social/cs2.jpg",
      },
      {
        id: "nuke",
        name: "Nuke",
        splashUrl: "https://cdn.cloudflare.steamstatic.com/apps/csgo/images/csgo_react/social/cs2.jpg",
      },
      {
        id: "dust2",
        name: "Dust II",
        splashUrl: "https://cdn.cloudflare.steamstatic.com/apps/csgo/images/csgo_react/social/cs2.jpg",
      },
      {
        id: "ancient",
        name: "Ancient",
        splashUrl: "https://cdn.cloudflare.steamstatic.com/apps/csgo/images/csgo_react/social/cs2.jpg",
      },
      {
        id: "anubis",
        name: "Anubis",
        splashUrl: "https://cdn.cloudflare.steamstatic.com/apps/csgo/images/csgo_react/social/cs2.jpg",
      },
      {
        id: "vertigo",
        name: "Vertigo",
        splashUrl: "https://cdn.cloudflare.steamstatic.com/apps/csgo/images/csgo_react/social/cs2.jpg",
      },
    ],
    wallpapers: [
      "https://cdn.cloudflare.steamstatic.com/apps/csgo/images/csgo_react/social/cs2.jpg",
      "https://cdn.cloudflare.steamstatic.com/steam/apps/730/capsule_616x353.jpg",
      "https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg",
    ],
    statColumns: [
      { key: "acs", label: "Rating 2.0", tooltip: "HLTV 2.0 Performance Rating", isPrimary: true },
      { key: "kills", label: "K", tooltip: "Total Kills" },
      { key: "deaths", label: "D", tooltip: "Total Deaths" },
      { key: "assists", label: "A", tooltip: "Total Assists" },
      { key: "kd", label: "K/D", tooltip: "Kill to Death Ratio" },
      { key: "adr", label: "ADR", tooltip: "Average Damage per Round" },
      { key: "kast", label: "HS%", tooltip: "Headshot Accuracy Percentage" },
      { key: "wins", label: "W", tooltip: "Matches Won" },
      { key: "mvps", label: "MVP", tooltip: "Match MVP Accolades" },
    ],
    podiumLabels: {
      ratingLeader: "Top Rated (2.0)",
      topFragger: "Top Fragger",
      mvp: "Major MVP",
    },
  },

  bgmi: {
    id: "bgmi",
    name: "BGMI / PUBG Mobile",
    shortName: "BGMI",
    tagline: "Squad Battle Royale Championship",
    icon: "🪂",
    category: "battle_royale",
    scoringType: "points",
    scoreLabel: "Points",
    defaultTeamSize: 4,
    supportsRiotApi: false,
    maps: [
      {
        id: "erangel",
        name: "Erangel",
        splashUrl: "/maps/erangel.jpg",
      },
      {
        id: "miramar",
        name: "Miramar",
        splashUrl: "/maps/miramar.jpg",
      },
      {
        id: "sanhok",
        name: "Sanhok",
        splashUrl: "/maps/sanhok.jpg",
      },
      {
        id: "vikendi",
        name: "Vikendi",
        splashUrl: "/maps/vikendi.jpg",
      },
    ],
    wallpapers: [
      "/maps/erangel.jpg",
      "/maps/miramar.jpg",
      "/maps/sanhok.jpg",
      "/maps/vikendi.jpg",
    ],
    statColumns: [
      { key: "acs", label: "Points", tooltip: "Total Tournament Placement + Finish Points", isPrimary: true },
      { key: "kills", label: "Finishes", tooltip: "Total Confirmed Finishes (Kills)" },
      { key: "deaths", label: "Falls", tooltip: "Eliminations suffered" },
      { key: "assists", label: "Assists", tooltip: "Squad Assists" },
      { key: "kd", label: "F/D", tooltip: "Finishes to Death Ratio" },
      { key: "adr", label: "Damage", tooltip: "Average Damage Inflicted" },
      { key: "wins", label: "WWCD", tooltip: "Winner Winner Chicken Dinner (Victories)" },
      { key: "mvps", label: "MVP", tooltip: "Match MVP Honors" },
    ],
    podiumLabels: {
      ratingLeader: "Points Leader",
      topFragger: "Top Finisher",
      mvp: "Tournament MVP",
    },
  },

  rocket_league: {
    id: "rocket_league",
    name: "Rocket League",
    shortName: "ROCKET LEAGUE",
    tagline: "High-Powered Vehicular Soccer by Psyonix",
    icon: "⚽",
    category: "sports",
    scoringType: "goals",
    scoreLabel: "Goals",
    defaultTeamSize: 3,
    supportsRiotApi: false,
    maps: [
      { id: "champions_field", name: "Champions Field" },
      { id: "dfh_stadium", name: "DFH Stadium" },
      { id: "mannfield", name: "Mannfield" },
      { id: "utopia_coliseum", name: "Utopia Coliseum" },
      { id: "neo_tokyo", name: "Neo Tokyo" },
    ],
    wallpapers: [
      "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1920&q=80",
    ],
    statColumns: [
      { key: "acs", label: "Goals", tooltip: "Total Goals Scored", isPrimary: true },
      { key: "assists", label: "Assists", tooltip: "Goal Assists" },
      { key: "deaths", label: "Saves", tooltip: "Goal Line Saves" },
      { key: "kills", label: "Shots", tooltip: "Shots on Target" },
      { key: "kd", label: "Shot%", tooltip: "Shooting Conversion Percentage" },
      { key: "wins", label: "W", tooltip: "Matches Won" },
      { key: "mvps", label: "MVP", tooltip: "Match MVP Accolades" },
    ],
    podiumLabels: {
      ratingLeader: "Golden Striker",
      topFragger: "Playmaker",
      mvp: "RLCS MVP",
    },
  },

  custom: {
    id: "custom",
    name: "Custom Game",
    shortName: "CUSTOM ESPORTS",
    tagline: "Community & Universal Tournament Discipline",
    icon: "⚔️",
    category: "custom",
    scoringType: "points",
    scoreLabel: "Score",
    defaultTeamSize: 5,
    supportsRiotApi: false,
    maps: [
      { id: "map_1", name: "Arena 1" },
      { id: "map_2", name: "Arena 2" },
      { id: "map_3", name: "Arena 3" },
      { id: "decider", name: "Decider Arena" },
    ],
    wallpapers: [
      "https://images5.alphacoders.com/120/thumb-1920-1202339.png",
      "https://images4.alphacoders.com/120/1202336.png",
    ],
    statColumns: [
      { key: "acs", label: "Score", tooltip: "Overall Match Performance Score", isPrimary: true },
      { key: "kills", label: "Kills", tooltip: "Total Eliminations / Points" },
      { key: "deaths", label: "Deaths", tooltip: "Total Falls" },
      { key: "assists", label: "Assists", tooltip: "Team Assists" },
      { key: "kd", label: "K/D", tooltip: "Kill / Death Ratio" },
      { key: "wins", label: "Wins", tooltip: "Matches Won" },
      { key: "mvps", label: "MVP", tooltip: "Match MVP Honors" },
    ],
    podiumLabels: {
      ratingLeader: "Score Leader",
      topFragger: "Top Contender",
      mvp: "Match MVP",
    },
  },
};

export function getGameDefinition(gameId?: string | null): GameDefinition {
  if (!gameId) return GAMES.valorant;
  const key = gameId.toLowerCase().trim();
  return GAMES[key] || GAMES.valorant;
}

export function getAllGames(): GameDefinition[] {
  return Object.values(GAMES);
}
