export type MatchStatus =
  | "Scheduled"
  | "Live"
  | "Completed"
  | "Cancelled";

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

export type TournamentSettings = {
  tournamentName: string;
  tagline: string;
  organizerName: string;
  prizePool: string;
  startDate: string | null;
  endDate: string | null;
  tournamentStatus: "Upcoming" | "Live" | "Completed";
  announcement: string;
  logoUrl: string;
  bannerUrl: string;
};

export type Standing = {
  team: Team;
  played: number;
  wins: number;
  losses: number;
  points: number;
  roundDifference: number;
};
