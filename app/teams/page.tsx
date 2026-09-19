"use client";

import Link from "next/link";
import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Team,
  Player,
  teams as initialTeams,
} from "../data/teams";

const STORAGE_KEY = "tournament-teams";

type CsvRow = {
  roster: string;
  player: string;
  captainRank: string;
};

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function normalizeTeam(
  team: Partial<Team>,
  index: number
): Team {
  return {
    id:
      team.id ||
      createId(`team-${index + 1}`),
    name:
      team.name?.trim() ||
      `TEAM ${index + 1}`,
    tag:
      team.tag?.trim() ||
      team.name?.trim() ||
      `TEAM${index + 1}`,
    seed:
      Number(team.seed) ||
      index + 1,
    logo: team.logo || "",
    wins:
      Number(team.wins) || 0,
    losses:
      Number(team.losses) || 0,
    captainRank:
      team.captainRank?.trim() || "",
    players:
      Array.isArray(team.players)
        ? team.players
            .filter(
              (player): player is Player =>
                Boolean(player)
            )
            .map(
              (
                player,
                playerIndex
              ) => ({
                id:
                  player.id ||
                  createId(
                    `player-${index}-${playerIndex}`
                  ),
                name:
                  player.name?.trim() ||
                  `PLAYER ${playerIndex + 1}`,
              })
            )
        : [],
  };
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") ||
    "team"
  );
}

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];

  let row: string[] = [];
  let cell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      if (
        insideQuotes &&
        text[i + 1] === '"'
      ) {
        cell += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (char === "," && !insideQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if (
      (char === "\n" ||
        char === "\r") &&
      !insideQuotes
    ) {
      if (
        char === "\r" &&
        text[i + 1] === "\n"
      ) {
        i += 1;
      }

      row.push(cell);
      cell = "";

      if (
        row.some(
          (value) =>
            value.trim() !== ""
        )
      ) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    cell += char;
  }

  if (
    cell.length > 0 ||
    row.length > 0
  ) {
    row.push(cell);

    if (
      row.some(
        (value) =>
          value.trim() !== ""
      )
    ) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((header) =>
    header
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase()
  );

  const rosterIndex =
    headers.indexOf("roster");
  const playerIndex =
    headers.indexOf("player");
  const captainRankIndex =
    headers.indexOf(
      "captain / rank"
    );

  if (
    rosterIndex === -1 ||
    playerIndex === -1
  ) {
    throw new Error(
      'CSV must contain "Roster" and "Player" columns.'
    );
  }

  return rows
    .slice(1)
    .map((values) => ({
      roster:
        values[rosterIndex]
          ?.trim() || "",
      player:
        values[playerIndex]
          ?.trim() || "",
      captainRank:
        captainRankIndex === -1
          ? ""
          : values[
              captainRankIndex
            ]?.trim() || "",
    }))
    .filter(
      (row) =>
        row.roster &&
        row.player
    );
}

function csvEscape(value: string) {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(
      /"/g,
      '""'
    )}"`;
  }

  return value;
}

function teamsToCsv(
  teams: Team[]
) {
  const lines: string[] = [];

  lines.push(
    "Roster,Player,Captain / Rank"
  );

  teams.forEach((team) => {
    if (team.players.length === 0) {
      lines.push(
        [
          csvEscape(team.name),
          "",
          csvEscape(
            team.captainRank || ""
          ),
        ].join(",")
      );

      return;
    }

    team.players.forEach(
      (player, index) => {
        lines.push(
          [
            csvEscape(team.name),
            csvEscape(player.name),
            csvEscape(
              index === 0
                ? team.captainRank ||
                    ""
                : ""
            ),
          ].join(",")
        );
      }
    );
  });

  return lines.join("\r\n");
}

function csvRowsToTeams(
  rows: CsvRow[]
): Team[] {
  const teamMap =
    new Map<string, Team>();

  rows.forEach(
    (row, rowIndex) => {
      const teamKey =
        row.roster
          .trim()
          .toLowerCase();

      if (!teamKey) {
        return;
      }

      let team =
        teamMap.get(teamKey);

      if (!team) {
        team = {
          id: createId(
            `team-${slugify(
              row.roster
            )}`
          ),
          name: row.roster.trim(),
          tag: row.roster.trim(),
          seed:
            teamMap.size + 1,
          logo: "",
          wins: 0,
          losses: 0,
          captainRank:
            row.captainRank ||
            "",
          players: [],
        };

        teamMap.set(
          teamKey,
          team
        );
      }

      if (
        row.captainRank
      ) {
        team.captainRank =
          row.captainRank;
      }

      const duplicate =
        team.players.some(
          (player) =>
            player.name
              .trim()
              .toLowerCase() ===
            row.player
              .trim()
              .toLowerCase()
        );

      if (!duplicate) {
        team.players.push({
          id: createId(
            `player-${rowIndex}`
          ),
          name: row.player.trim(),
        });
      }
    }
  );

  return Array.from(
    teamMap.values()
  );
}

export default function TeamsPage() {
  const [teamList, setTeamList] =
    useState<Team[]>([]);

  const [search, setSearch] =
    useState("");

  const [editorOpen, setEditorOpen] =
    useState(false);

  const [
    editingTeam,
    setEditingTeam,
  ] = useState<Team | null>(null);

  const [
    importOpen,
    setImportOpen,
  ] = useState(false);

  const [
    importPreview,
    setImportPreview,
  ] = useState<Team[] | null>(null);

  const [
    importError,
    setImportError,
  ] = useState("");

  useEffect(() => {
    const stored =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (stored) {
      try {
        const parsed =
          JSON.parse(stored);

        if (Array.isArray(parsed)) {
          setTeamList(
            parsed.map(
              normalizeTeam
            )
          );

          return;
        }
      } catch {
        // Ignore invalid local storage.
      }
    }

    setTeamList(
      initialTeams.map(
        normalizeTeam
      )
    );
  }, []);

  function saveTeams(
    nextTeams: Team[]
  ) {
    setTeamList(nextTeams);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(nextTeams)
    );
  }

  function openAddTeam() {
    setEditingTeam({
      id: "",
      name: "",
      tag: "",
      seed:
        teamList.length + 1,
      logo: "",
      wins: 0,
      losses: 0,
      captainRank: "",
      players: [],
    });

    setEditorOpen(true);
  }

  function openEditTeam(
    team: Team
  ) {
    setEditingTeam({
      ...team,
      players: team.players.map(
        (player) => ({
          ...player,
        })
      ),
    });

    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditingTeam(null);
  }

  function handleSaveTeam(
    team: Team
  ) {
    const cleaned: Team =
      normalizeTeam(
        {
          ...team,
          name: team.name.trim(),
          tag:
            team.tag.trim() ||
            team.name.trim(),
        },
        teamList.length
      );

    const existing =
      teamList.some(
        (item) =>
          item.id === cleaned.id
      );

    const nextTeams = existing
      ? teamList.map((item) =>
          item.id === cleaned.id
            ? cleaned
            : item
        )
      : [
          ...teamList,
          {
            ...cleaned,
            id:
              cleaned.id ||
              createId("team"),
          },
        ];

    saveTeams(nextTeams);
    closeEditor();
  }

  function handleDeleteTeam(
    team: Team
  ) {
    const confirmed =
      window.confirm(
        `Delete ${team.name}? This will remove the team from the tournament list.`
      );

    if (!confirmed) {
      return;
    }

    const nextTeams =
      teamList.filter(
        (item) =>
          item.id !== team.id
      );

    saveTeams(nextTeams);
    closeEditor();
  }

  function handleReset() {
    const confirmed =
      window.confirm(
        "Reset all teams to the original roster data?"
      );

    if (!confirmed) {
      return;
    }

    const resetTeams =
      initialTeams.map(
        normalizeTeam
      );

    saveTeams(resetTeams);
  }

  function handleExport() {
    const csv =
      teamsToCsv(teamList);

    const blob =
      new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement(
        "a"
      );

    link.href = url;
    link.download =
      "tournament-teams.csv";

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  function handleImportFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setImportError("");
    setImportPreview(null);

    const reader =
      new FileReader();

    reader.onload = () => {
      try {
        const text =
          String(
            reader.result || ""
          );

        const rows =
          parseCsv(text);

        if (rows.length === 0) {
          throw new Error(
            "No roster rows were found in the CSV."
          );
        }

        const importedTeams =
          csvRowsToTeams(rows);

        if (
          importedTeams.length === 0
        ) {
          throw new Error(
            "No valid teams were found in the CSV."
          );
        }

        setImportPreview(
          importedTeams
        );
      } catch (error) {
        setImportError(
          error instanceof Error
            ? error.message
            : "Could not read the CSV file."
        );
      }
    };

    reader.onerror = () => {
      setImportError(
        "Could not read the selected file."
      );
    };

    reader.readAsText(file);
  }

  function confirmImport() {
    if (
      !importPreview ||
      importPreview.length === 0
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Import ${importPreview.length} team${
          importPreview.length === 1
            ? ""
            : "s"
        } and replace the current team list?`
      );

    if (!confirmed) {
      return;
    }

    const normalized =
      importPreview.map(
        normalizeTeam
      );

    saveTeams(normalized);

    setImportPreview(null);
    setImportError("");
    setImportOpen(false);
  }

  function closeImport() {
    setImportOpen(false);
    setImportPreview(null);
    setImportError("");
  }

  const filteredTeams =
    teamList.filter((team) => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return true;
      }

      return (
        team.name
          .toLowerCase()
          .includes(query) ||
        team.tag
          .toLowerCase()
          .includes(query) ||
        team.players.some(
          (player) =>
            player.name
              .toLowerCase()
              .includes(query)
        )
      );
    });

  return (
    <main className="min-h-screen bg-[#080c12] text-white">
      <div className="mx-auto max-w-[1500px] px-6 py-8">
        <header className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/"
              className="mb-4 inline-block text-xs font-bold uppercase tracking-[0.2em] text-white/40 transition hover:text-white"
            >
              ← Admin Hub
            </Link>

            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
              Tournament Management
            </p>

            <h1 className="mt-2 text-4xl font-black uppercase tracking-tight">
              Registered Teams
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Manage registered rosters,
              players, team logos and
              tournament seeds.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleReset}
              className="border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black uppercase tracking-wider text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              Reset
            </button>

            <button
              onClick={handleExport}
              className="border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-400/20"
            >
              Export CSV
            </button>

            <button
              onClick={() =>
                setImportOpen(true)
              }
              className="border border-violet-400/30 bg-violet-400/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-violet-300 transition hover:bg-violet-400/20"
            >
              Import CSV
            </button>

            <button
              onClick={openAddTeam}
              className="bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-black transition hover:bg-cyan-300"
            >
              + Add Team
            </button>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              Registered Teams
            </p>

            <p className="mt-2 text-3xl font-black">
              {teamList.length}
            </p>
          </div>

          <div className="border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              Total Players
            </p>

            <p className="mt-2 text-3xl font-black">
              {teamList.reduce(
                (total, team) =>
                  total +
                  team.players.length,
                0
              )}
            </p>
          </div>

          <div className="border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              Search
            </p>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Team or player..."
              className="mt-2 w-full border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-400/50"
            />
          </div>
        </section>

        {teamList.length === 0 ? (
          <div className="border border-dashed border-white/15 py-20 text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-white/40">
              No teams registered
            </p>

            <button
              onClick={openAddTeam}
              className="mt-4 bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-black"
            >
              Add First Team
            </button>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="border border-dashed border-white/15 py-20 text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-white/40">
              No teams match your search
            </p>
          </div>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredTeams.map(
              (team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onEdit={() =>
                    openEditTeam(
                      team
                    )
                  }
                />
              )
            )}
          </section>
        )}
      </div>

      {editorOpen &&
        editingTeam && (
          <TeamEditor
            team={editingTeam}
            isNew={!editingTeam.id}
            onClose={closeEditor}
            onSave={handleSaveTeam}
            onDelete={
              editingTeam.id
                ? () =>
                    handleDeleteTeam(
                      editingTeam
                    )
                : undefined
            }
          />
        )}

      {importOpen && (
        <ImportTeamsModal
          preview={importPreview}
          error={importError}
          onFileChange={
            handleImportFile
          }
          onConfirm={
            confirmImport
          }
          onClose={closeImport}
          onClearPreview={() =>
            setImportPreview(null)
          }
        />
      )}
    </main>
  );
}

function TeamCard({
  team,
  onEdit,
}: {
  team: Team;
  onEdit: () => void;
}) {
  const initials =
    team.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) =>
        word[0]?.toUpperCase()
      )
      .join("") || "TM";

  return (
    <article className="overflow-hidden border border-white/10 bg-white/[0.03]">
      <div className="flex items-start justify-between border-b border-white/10 p-5">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-black/30">
            {team.logo ? (
              <img
                src={team.logo}
                alt={`${team.name} logo`}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-xl font-black text-white/50">
                {initials}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
              Seed {team.seed}
            </p>

            <h2 className="mt-1 truncate text-xl font-black uppercase">
              {team.name}
            </h2>

            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-white/35">
              {team.tag}
            </p>
          </div>
        </div>

        <button
          onClick={onEdit}
          className="border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white/50 transition hover:border-white/30 hover:text-white"
        >
          Edit
        </button>
      </div>

      <div className="grid grid-cols-2 border-b border-white/10">
        <div className="border-r border-white/10 p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/30">
            Record
          </p>

          <p className="mt-1 text-lg font-black">
            {team.wins}W -{" "}
            {team.losses}L
          </p>
        </div>

        <div className="p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/30">
            Players
          </p>

          <p className="mt-1 text-lg font-black">
            {team.players.length}
          </p>
        </div>
      </div>

      <div className="p-5">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
          Captain / Rank
        </p>

        <p className="mt-2 min-h-5 text-xs font-bold text-white/70">
          {team.captainRank ||
            "Not specified"}
        </p>

        <div className="mt-4 space-y-1.5">
          {team.players.map(
            (player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between border border-white/[0.06] bg-black/20 px-3 py-2"
              >
                <span className="truncate text-xs font-bold text-white/70">
                  {player.name}
                </span>

                <span className="ml-3 shrink-0 text-[9px] font-black text-white/20">
                  {String(
                    index + 1
                  ).padStart(2, "0")}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </article>
  );
}

function TeamEditor({
  team,
  isNew,
  onClose,
  onSave,
  onDelete,
}: {
  team: Team;
  isNew: boolean;
  onClose: () => void;
  onSave: (team: Team) => void;
  onDelete?: () => void;
}) {
  const [form, setForm] =
    useState<Team>(() => ({
      ...team,
      players: team.players.map(
        (player) => ({
          ...player,
        })
      ),
    }));

  const logoInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  function updateField<
    K extends keyof Team
  >(
    field: K,
    value: Team[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addPlayer() {
    setForm((current) => ({
      ...current,
      players: [
        ...current.players,
        {
          id: createId(
            "player"
          ),
          name: "",
        },
      ],
    }));
  }

  function updatePlayer(
    playerId: string,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      players:
        current.players.map(
          (player) =>
            player.id ===
            playerId
              ? {
                  ...player,
                  name: value,
                }
              : player
        ),
    }));
  }

  function removePlayer(
    playerId: string
  ) {
    setForm((current) => ({
      ...current,
      players:
        current.players.filter(
          (player) =>
            player.id !==
            playerId
        ),
    }));
  }

  function handleLogoUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      window.alert(
        "Please select an image file."
      );

      return;
    }

    if (
      file.size >
      2 * 1024 * 1024
    ) {
      window.alert(
        "Logo must be smaller than 2 MB."
      );

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      setForm((current) => ({
        ...current,
        logo: String(
          reader.result || ""
        ),
      }));
    };

    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!form.name.trim()) {
      window.alert(
        "Team name is required."
      );

      return;
    }

    const cleanedPlayers =
      form.players
        .map((player) => ({
          ...player,
          name: player.name.trim(),
        }))
        .filter(
          (player) =>
            player.name.length > 0
        );

    onSave({
      ...form,
      name: form.name.trim(),
      tag:
        form.tag.trim() ||
        form.name.trim(),
      captainRank:
        form.captainRank?.trim() ||
        "",
      players:
        cleanedPlayers,
    });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="mx-auto my-8 max-w-4xl border border-white/10 bg-[#0c1119] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">
              {isNew
                ? "New Registration"
                : "Team Editor"}
            </p>

            <h2 className="mt-1 text-2xl font-black uppercase">
              {isNew
                ? "Add Team"
                : form.name ||
                  "Edit Team"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-2xl text-white/40 transition hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="grid gap-8 p-6 lg:grid-cols-[220px_1fr]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
              Team Logo
            </p>

            <div className="mt-3 flex aspect-square items-center justify-center overflow-hidden border border-white/10 bg-black/30">
              {form.logo ? (
                <img
                  src={form.logo}
                  alt="Team logo preview"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-4xl font-black text-white/10">
                  LOGO
                </span>
              )}
            </div>

            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={
                handleLogoUpload
              }
              className="hidden"
            />

            <button
              onClick={() =>
                logoInputRef.current?.click()
              }
              className="mt-3 w-full border border-white/10 bg-white/[0.04] px-4 py-3 text-[10px] font-black uppercase tracking-wider text-white/60 transition hover:bg-white/[0.08] hover:text-white"
            >
              Upload Logo
            </button>

            {form.logo && (
              <button
                onClick={() =>
                  updateField(
                    "logo",
                    ""
                  )
                }
                className="mt-2 w-full text-[10px] font-black uppercase tracking-wider text-red-400"
              >
                Remove Logo
              </button>
            )}

            <p className="mt-3 text-[10px] leading-4 text-white/25">
              PNG, JPG, WEBP.
              Maximum 2 MB.
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="block md:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-white/35">
                  Team Name
                </span>

                <input
                  value={form.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400/50"
                  placeholder="DEVILDOM"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-wider text-white/35">
                  Seed
                </span>

                <input
                  type="number"
                  min="1"
                  value={form.seed}
                  onChange={(event) =>
                    updateField(
                      "seed",
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className="mt-2 w-full border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400/50"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/35">
                Tag
              </span>

              <input
                value={form.tag}
                onChange={(event) =>
                  updateField(
                    "tag",
                    event.target.value
                  )
                }
                className="mt-2 w-full border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400/50"
                placeholder="DEVILDOM"
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/35">
                Captain / Rank
              </span>

              <input
                value={
                  form.captainRank ||
                  ""
                }
                onChange={(event) =>
                  updateField(
                    "captainRank",
                    event.target.value
                  )
                }
                className="mt-2 w-full border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400/50"
                placeholder="Captain - Silver 3"
              />
            </label>

            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                    Players
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    {form.players.length}{" "}
                    player
                    {form.players.length ===
                    1
                      ? ""
                      : "s"}
                  </p>
                </div>

                <button
                  onClick={addPlayer}
                  className="border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-cyan-300"
                >
                  + Add Player
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {form.players.length ===
                0 ? (
                  <div className="border border-dashed border-white/10 px-4 py-8 text-center text-xs text-white/25">
                    No players added
                  </div>
                ) : (
                  form.players.map(
                    (
                      player,
                      index
                    ) => (
                      <div
                        key={
                          player.id
                        }
                        className="flex gap-2"
                      >
                        <div className="flex w-10 shrink-0 items-center justify-center border border-white/10 bg-black/30 text-[10px] font-black text-white/20">
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </div>

                        <input
                          value={
                            player.name
                          }
                          onChange={(
                            event
                          ) =>
                            updatePlayer(
                              player.id,
                              event
                                .target
                                .value
                            )
                          }
                          placeholder="Player name"
                          className="min-w-0 flex-1 border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400/50"
                        />

                        <button
                          onClick={() =>
                            removePlayer(
                              player.id
                            )
                          }
                          className="w-11 border border-red-400/10 bg-red-400/[0.04] text-red-400/60 transition hover:bg-red-400/10 hover:text-red-400"
                        >
                          ×
                        </button>
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {!isNew &&
              onDelete && (
                <button
                  onClick={onDelete}
                  className="border border-red-400/20 bg-red-400/[0.04] px-4 py-3 text-[10px] font-black uppercase tracking-wider text-red-400 transition hover:bg-red-400/10"
                >
                  Delete Team
                </button>
              )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="border border-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-wider text-white/50 hover:text-white"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="bg-white px-6 py-3 text-[10px] font-black uppercase tracking-wider text-black transition hover:bg-cyan-300"
            >
              Save Team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImportTeamsModal({
  preview,
  error,
  onFileChange,
  onConfirm,
  onClose,
  onClearPreview,
}: {
  preview: Team[] | null;
  error: string;
  onFileChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
  onConfirm: () => void;
  onClose: () => void;
  onClearPreview: () => void;
}) {
  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="mx-auto my-8 max-w-5xl border border-white/10 bg-[#0c1119] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-400">
              CSV Import
            </p>

            <h2 className="mt-1 text-2xl font-black uppercase">
              Import Registered Teams
            </h2>

            <p className="mt-2 text-xs text-white/35">
              Use the same structure as
              your spreadsheet:
              Roster, Player,
              Captain / Rank.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-2xl text-white/40 transition hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="border border-dashed border-white/15 bg-black/20 p-8 text-center">
            <p className="text-xs font-black uppercase tracking-wider text-white/40">
              Select CSV File
            </p>

            <p className="mt-2 text-xs text-white/25">
              Example:
              tournament-rosters.csv
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={
                onFileChange
              }
              className="hidden"
            />

            <button
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="mt-5 bg-white px-6 py-3 text-[10px] font-black uppercase tracking-wider text-black transition hover:bg-violet-300"
            >
              Choose CSV
            </button>
          </div>

          {error && (
            <div className="mt-4 border border-red-400/20 bg-red-400/[0.05] p-4">
              <p className="text-xs font-bold text-red-400">
                {error}
              </p>
            </div>
          )}

          {preview && (
            <div className="mt-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400">
                    Import Preview
                  </p>

                  <p className="mt-1 text-sm font-bold text-white/70">
                    {preview.length} teams
                    detected
                  </p>
                </div>

                <button
                  onClick={
                    onClearPreview
                  }
                  className="text-[10px] font-black uppercase tracking-wider text-white/30 hover:text-white"
                >
                  Clear Preview
                </button>
              </div>

              <div className="max-h-[450px] overflow-auto border border-white/10">
                <table className="w-full min-w-[700px] border-collapse text-left">
                  <thead className="sticky top-0 bg-[#111722]">
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-white/30">
                        Seed
                      </th>

                      <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-white/30">
                        Roster
                      </th>

                      <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-white/30">
                        Captain / Rank
                      </th>

                      <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-white/30">
                        Players
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {preview.map(
                      (team) => (
                        <tr
                          key={
                            team.id
                          }
                          className="border-b border-white/[0.06]"
                        >
                          <td className="px-4 py-3 text-xs font-black text-cyan-400">
                            {team.seed}
                          </td>

                          <td className="px-4 py-3 text-xs font-black uppercase">
                            {team.name}
                          </td>

                          <td className="px-4 py-3 text-xs text-white/50">
                            {team.captainRank ||
                              "—"}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {team.players.map(
                                (
                                  player
                                ) => (
                                  <span
                                    key={
                                      player.id
                                    }
                                    className="border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-bold text-white/60"
                                  >
                                    {
                                      player.name
                                    }
                                  </span>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 p-6 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="border border-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-wider text-white/50 hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={
              !preview ||
              preview.length === 0
            }
            className="bg-white px-6 py-3 text-[10px] font-black uppercase tracking-wider text-black transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Import Teams
          </button>
        </div>
      </div>
    </div>
  );
}