import type { TournamentStatusId } from "./types";

export type TournamentStatusMeta = {
  id: TournamentStatusId;
  label: string;
  sublabel: string;
  /** Full display text, e.g. "ONGOING · GROUP STAGE" */
  display: string;
  isLive: boolean;
  dotClass: string;
  badgeClass: string;
};

const STATUS_META: Record<TournamentStatusId, TournamentStatusMeta> = {
  registration_open: {
    id: "registration_open",
    label: "Registration Open",
    sublabel: "",
    display: "REGISTRATION OPEN",
    isLive: false,
    dotClass: "bg-[#94a3b8]",
    badgeClass: "border-[#1e1e3a] bg-[#080812] text-[#94a3b8]",
  },
  upcoming: {
    id: "upcoming",
    label: "Upcoming",
    sublabel: "Scheduled",
    display: "UPCOMING · SCHEDULED",
    isLive: false,
    dotClass: "bg-[#94a3b8]",
    badgeClass: "border-[#1e1e3a] bg-[#080812] text-[#94a3b8]",
  },
  ongoing_group_stage: {
    id: "ongoing_group_stage",
    label: "Ongoing",
    sublabel: "Group Stage",
    display: "ONGOING · GROUP STAGE",
    isLive: true,
    dotClass: "bg-[#ff2d55]",
    badgeClass: "border-[#ff2d55]/40 bg-[#ff2d55]/10 text-[#ff4d6a]",
  },
  ongoing_playoffs: {
    id: "ongoing_playoffs",
    label: "Ongoing",
    sublabel: "Playoffs",
    display: "ONGOING · PLAYOFFS",
    isLive: true,
    dotClass: "bg-[#ff2d55]",
    badgeClass: "border-[#ff2d55]/40 bg-[#ff2d55]/10 text-[#ff4d6a]",
  },
  ongoing_grand_finals: {
    id: "ongoing_grand_finals",
    label: "Ongoing",
    sublabel: "Grand Finals",
    display: "ONGOING · GRAND FINALS",
    isLive: true,
    dotClass: "bg-[#ff2d55]",
    badgeClass: "border-[#ff2d55]/40 bg-[#ff2d55]/10 text-[#ff4d6a]",
  },
  concluded: {
    id: "concluded",
    label: "Concluded",
    sublabel: "Champions Crowned",
    display: "CONCLUDED · CHAMPIONS CROWNED",
    isLive: false,
    dotClass: "bg-[#34d399]",
    badgeClass: "border-[#10b981]/40 bg-[#10b981]/10 text-[#34d399]",
  },
};

export const TOURNAMENT_STATUS_LIST: TournamentStatusMeta[] = [
  STATUS_META.registration_open,
  STATUS_META.upcoming,
  STATUS_META.ongoing_group_stage,
  STATUS_META.ongoing_playoffs,
  STATUS_META.ongoing_grand_finals,
  STATUS_META.concluded,
];

export function isTournamentStatusId(value: unknown): value is TournamentStatusId {
  return typeof value === "string" && value in STATUS_META;
}

export function getTournamentStatusMeta(
  id: string | null | undefined,
): TournamentStatusMeta {
  if (id && isTournamentStatusId(id)) return STATUS_META[id];
  return STATUS_META.upcoming;
}
