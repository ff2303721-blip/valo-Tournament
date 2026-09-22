export type GameCategory =
  | "tactical_fps"
  | "battle_royale"
  | "sports"
  | "moba"
  | "custom";

export type ScoringType = "rounds" | "goals" | "points";

export type GameStatColumn = {
  key: string;
  label: string;
  tooltip: string;
  isPrimary?: boolean;
};

export type GameMap = {
  id: string;
  name: string;
  splashUrl?: string;
};

export type GameDefinition = {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  icon: string;
  category: GameCategory;
  scoringType: ScoringType;
  scoreLabel: string;
  defaultTeamSize: number;
  maps: GameMap[];
  wallpapers: string[];
  statColumns: GameStatColumn[];
  podiumLabels: {
    ratingLeader: string;
    topFragger: string;
    mvp: string;
  };
  supportsRiotApi: boolean;
};
