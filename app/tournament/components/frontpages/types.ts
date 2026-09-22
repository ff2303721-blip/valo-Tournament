import type { Match, Team, TournamentSettings, Standing } from "@/lib/types";
import type { GameDefinition } from "@/lib/games/types";

export type StandingsView = "overall" | "group" | "qualifiers" | "final";

export type FrontPageProps = {
  settings: TournamentSettings | null;
  teams: Team[];
  matches: Match[];
  standings: Standing[];
  standingsView: StandingsView;
  setStandingsView: (view: StandingsView) => void;
  formatDate: (value?: string | null) => string;
  game: GameDefinition;
};
