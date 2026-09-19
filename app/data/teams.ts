export type Player = {
  id: string;
  name: string;
  role: string;
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
    id: "team-devildom",
    name: "DEVILDOM",
    tag: "DEVILDOM",
    seed: 1,
    logo: "",
    wins: 0,
    losses: 0,
    captainRank: "Captain - Silver 3",
    players: [
      {
        id: "devildom",
        name: "DEVILDOM",
        role: "Captain",
      },
      {
        id: "denver",
        name: "Denver",
        role: "Player",
      },
      {
        id: "tharippan",
        name: "THARIPPAN",
        role: "Player",
      },
      {
        id: "stephan",
        name: "STEPHAN",
        role: "Player",
      },
      {
        id: "beema-appapan",
        name: "BEEMA APPAPAN",
        role: "Player",
      },
      {
        id: "km-prabhu",
        name: "KM PRABHU",
        role: "Player",
      },
    ],
  },
  {
    id: "team-lord-mahendra",
    name: "LORD MAHENDRA",
    tag: "LORD MAHENDRA",
    seed: 2,
    logo: "",
    wins: 0,
    losses: 0,
    captainRank: "Nishku - Captain - Bronze 1",
    players: [
      {
        id: "lord-mahendra",
        name: "LORD MAHENDRA",
        role: "Player",
      },
      {
        id: "axel-blaze",
        name: "Axel Blaze",
        role: "Player",
      },
      {
        id: "asg-uniyappam",
        name: "ASG UniyAppam",
        role: "Player",
      },
      {
        id: "cutiekidxi",
        name: "CUTIEKIDXI",
        role: "Player",
      },
      {
        id: "devi-kan",
        name: "デヴィ カン",
        role: "Player",
      },
      {
        id: "kakashi",
        name: "Kakashi",
        role: "Player",
      },
    ],
  },
  {
    id: "team-aegon",
    name: "AEGON",
    tag: "ATX",
    seed: 3,
    logo: "",
    wins: 0,
    losses: 0,
    captainRank: "AEGON XD - Captain - Bronze 2",
    players: [
      {
        id: "aegon-xd",
        name: "AEGON XD",
        role: "Captain",
      },
      {
        id: "luxy",
        name: "Luxy",
        role: "Player",
      },
      {
        id: "thakudu-scarlet",
        name: "THAKUDU SCARLET",
        role: "Player",
      },
      {
        id: "shreya",
        name: "SHREYA",
        role: "Player",
      },
      {
        id: "porotta-beef",
        name: "PorottaBeef",
        role: "Player",
      },
      {
        id: "berlin",
        name: "Berlin",
        role: "Player",
      },
    ],
  },
  {
    id: "team-dominic",
    name: "DOMINIC",
    tag: "DOMINIC",
    seed: 4,
    logo: "",
    wins: 0,
    losses: 0,
    captainRank: "DOMINIC TORETTO - Captain - Bronze 1",
    players: [
      {
        id: "dominic-toretto",
        name: "DOMINIC TORETTO",
        role: "Captain",
      },
      {
        id: "gkr",
        name: "GKR",
        role: "Player",
      },
      {
        id: "zippaz",
        name: "Zippaz",
        role: "Player",
      },
      {
        id: "draiven",
        name: "Draiven",
        role: "Player",
      },
      {
        id: "tricky",
        name: "TRICKY",
        role: "Player",
      },
      {
        id: "light-yagami",
        name: "LIGHT YAGAMI",
        role: "Player",
      },
    ],
  },
];