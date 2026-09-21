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

export const teams: Team[] = [
  {
    id: "naadan-legacy",
    name: "NAADAN LEGACY",
    tag: "NDL",
    seed: 1,
    logo: "/logos/naadan-legacy.png",
    wins: 0,
    losses: 0,
    captainRank: "Captain - Silver 3",
    players: [
      { id: "5a9389e9-5811-4276-bf19-5a149e19fca2", name: "OUTLAWS", role: "Player" },
      { id: "6d1d0cdf-60c0-4699-aa8c-59684761d4c8", name: "DOMINIC TORETTO", role: "Captain" },
      { id: "1273a112-965c-47c6-bfce-add826e12843", name: "Light yagami", role: "Player" },
      { id: "42171848-9fdc-4ab8-97b2-742bde17e767", name: "TRICKY", role: "Player" },
      { id: "13db3db9-2650-41f2-80e9-452be7051020", name: "zippaz007", role: "Player" },
      { id: "2d039a43-7177-41a1-a733-fab7108f520a", name: "DRAIVEN", role: "Player" },
    ],
  },
  {
    id: "aetrix",
    name: "AETRIX",
    tag: "ATX",
    seed: 2,
    logo: "/logos/aetrix.png",
    wins: 0,
    losses: 0,
    captainRank: "AEGON XD - Captain - Bronze 2",
    players: [
      { id: "449b378b-c247-4f45-9327-a48b5bf9bf07", name: "AEGON XD", role: "Captain" },
      { id: "c8edbc7b-4db3-49d5-99c7-c683d61a2ede", name: "Luxy", role: "Player" },
      { id: "77826af3-2c09-449c-84dc-902b9aca7646", name: "Thakudu Scarlet", role: "Player" },
      { id: "44845f87-7c6f-455e-aa37-7ae28b5d841b", name: "SHREYA", role: "Player" },
      { id: "cd94e727-6e0b-4cc6-95ae-199afad60c1d", name: "PorottaBeef", role: "Player" },
      { id: "179c9788-dd60-406d-8325-ac33dae9a343", name: "NANDU", role: "Player" },
    ],
  },
  {
    id: "bitter-blade-z",
    name: "BITTER BLADE Z",
    tag: "BBZ",
    seed: 3,
    logo: "/logos/bitter-blade-z.png",
    wins: 0,
    losses: 0,
    captainRank: "Nishku - Captain - Bronze 1",
    players: [
      { id: "d9ebddae-effa-4bd5-8fad-b695a6f4c2f9", name: "Nishku", role: "Captain" },
      { id: "9d42711c-f430-4cd6-9e4c-7ef6c5efe8c4", name: "ASG UnniyAppam", role: "Player" },
      { id: "a35aa96c-977c-40c2-99af-606ec559007a", name: "Axel Blaze", role: "Player" },
      { id: "631d4f9d-658c-4a3d-8bf5-4c79daca7843", name: "CUTEKIDxT", role: "Player" },
      { id: "59e971dd-5edb-4ce8-8101-b62abd528174", name: "デヴィカ", role: "Player" },
      { id: "ea871ad0-7d3e-4bba-aa6c-5040ad2ccae1", name: "Kakashi", role: "Player" },
    ],
  },
  {
    id: "veyron",
    name: "VEYRON",
    tag: "VRN",
    seed: 4,
    logo: "/logos/veyron.png",
    wins: 0,
    losses: 0,
    captainRank: "DEVILDOM - Captain",
    players: [
      { id: "a7c7ef32-1226-4211-b15d-659658bea57c", name: "DEVILDOM", role: "Captain" },
      { id: "d97145d3-33be-45a4-9552-3c3b8e47f430", name: "Denver", role: "Player" },
      { id: "098599b4-3518-4812-8410-43b26b9b36c2", name: "yrr", role: "Player" },
      { id: "84187f02-3474-4960-ac30-6227b51e87c7", name: "KM PRABHU", role: "Player" },
      { id: "3cba5b9b-047d-4758-8360-636526052114", name: "BEEMA", role: "Player" },
      { id: "ad85f803-7a6f-47fd-adde-f93bb8ee8563", name: "STEPHAN", role: "Player" },
    ],
  },
];