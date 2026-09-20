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

export type MatchStatus =
  | "Scheduled"
  | "Live"
  | "Completed"
  | "Cancelled";

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
  startingSide?: "Attack" | "Defend";
  playerStats: PlayerStat[];
  createdAt: string;
};

export const matches: Match[] = [];