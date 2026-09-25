export type MatchStatus =
  | "Scheduled"
  | "Live"
  | "Completed"
  | "Cancelled";

export type TournamentStatusId =
  | "registration_open"
  | "upcoming"
  | "ongoing_group_stage"
  | "ongoing_playoffs"
  | "ongoing_grand_finals"
  | "concluded";

export type PlayerStat = {
  playerId: string;
  playerName: string;
  teamId: string;
  kills: number;
  deaths: number;
  assists: number;
  acs: number;
  adr: number;
  kast: number;
};

export type Match = {
  id: string;
  matchNumber: number;
  stage: string;
  team1Id: string;
  team2Id: string;
  scheduledAt: string;
  map: string;
  bestOf: number;
  team1Score: number;
  team2Score: number;
  status: MatchStatus;
  winnerId?: string;
  mvpPlayerId?: string;
  topFraggerPlayerId?: string;
  playerStats: PlayerStat[];
  createdAt: string;
};

export type Player = {
  id: string;
  name: string;
  role?: string;
};

export type Team = {
  id: string;
  name: string;
  tag: string;
  seed: number;
  logo?: string;
  wins: number;
  losses: number;
  captainRank?: string;
  players: Player[];
};

export type Caster = {
  name: string;
  logoUrl: string;
  youtubeUrl: string;
};

export type TournamentSettings = {
  tournamentName: string;
  tagline: string;
  organizerName: string;
  prizePool: string;
  startDate: string | null;
  endDate: string | null;
  tournamentStatus: TournamentStatusId;
  announcement: string;
  logoUrl: string;
  bannerUrl: string;
  liveStreamUrl?: string;
  casters?: Caster[];
  gameId?: string;
  gameCustomName?: string;
  gameCustomMaps?: string[];
};

export type Standing = {
  team: Team;
  played: number;
  wins: number;
  losses: number;
  points: number;
  roundDifference: number;
};

export function formatStartingSide(
  startingSide?: string | null,
  team1Tag?: string | null,
  team2Tag?: string | null,
): string | null {
  if (!startingSide) return null;
  const s = startingSide.trim();
  if (s.toLowerCase() === "attack") {
    return team1Tag ? `@${team1Tag} Attack` : "Attack";
  }
  if (s.toLowerCase() === "defend") {
    return team2Tag ? `@${team2Tag} Attack` : "Defend";
  }
  if (s.toLowerCase().includes("attack") || s.toLowerCase().includes("defend")) {
    return s.startsWith("@") ? s : `@${s}`;
  }
  return s;
}
