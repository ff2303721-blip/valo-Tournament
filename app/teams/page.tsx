"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type Player = {
  id: string;
  name: string;
  role?: string;
};

type Team = {
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

const EMPTY_PLAYER = (): Player => ({
  id: crypto.randomUUID(),
  name: "",
  role: "",
});

const EMPTY_TEAM = (): Team => ({
  id: "",
  name: "",
  tag: "",
  seed: 1,
  logo: "",
  wins: 0,
  losses: 0,
  captainRank: "",
  players: Array.from(
    { length: 6 },
    EMPTY_PLAYER,
  ),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeTeam(
  team: Team,
): Team {
  return {
    id: team.id,
    name: team.name,
    tag: team.tag,
    seed: Number(team.seed),
    logo: team.logo ?? "",
    wins: Number(team.wins ?? 0),
    losses: Number(team.losses ?? 0),
    captainRank:
      team.captainRank ?? "",
    players: Array.isArray(
      team.players,
    )
      ? team.players.map(
          (player) => ({
            id:
              player.id ||
              crypto.randomUUID(),
            name:
              player.name ?? "",
            role:
              player.role ?? "",
          }),
        )
      : [],
  };
}

export default function TeamsAdminPage() {
  const [teams, setTeams] =
    useState<Team[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");
  const [notice, setNotice] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<Team>(
      EMPTY_TEAM(),
    );

  const filteredTeams =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return teams;
      }

      return teams.filter(
        (team) =>
          team.name
            .toLowerCase()
            .includes(query) ||
          team.tag
            .toLowerCase()
            .includes(query) ||
          team.id
            .toLowerCase()
            .includes(query),
      );
    }, [teams, search]);

  async function loadTeams(isRefresh = false) {
    if (isRefresh) {
      setLoading(true);
    }
    setError("");

    try {
      const response =
        await fetch(
          "/api/teams",
          {
            cache: "no-store",
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load teams.",
        );
      }

      setTeams(
        Array.isArray(data)
          ? data.map(normalizeTeam)
          : [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load teams.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function initialFetch() {
      try {
        const response = await fetch("/api/teams", { cache: "no-store" });
        const data = response.ok ? await response.json() : null;

        if (!mounted) {
          setLoading(false);
          return;
        }

        if (Array.isArray(data) && data.length > 0) {
          setTeams(data.map(normalizeTeam));
        } else {
          setTeams([]);
        }
      } catch (err) {
        if (!mounted) {
          setLoading(false);
          return;
        }
        setTeams(defaultTeams.map(normalizeTeam));
        setError(err instanceof Error ? err.message : "Failed to load teams.");
      } finally {
        setLoading(false);
      }
    }

    initialFetch();

    return () => {
      mounted = false;
    };
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(
      EMPTY_TEAM(),
    );
    setNotice("");
    setError("");
  }

  function startEdit(
    team: Team,
  ) {
    setEditingId(team.id);
    setForm(
      normalizeTeam(team),
    );
    setNotice("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function updatePlayer(
    index: number,
    field: keyof Player,
    value: string,
  ) {
    setForm((current) => {
      const players = [
        ...current.players,
      ];

      players[index] = {
        ...players[index],
        [field]: value,
      };

      return {
        ...current,
        players,
      };
    });
  }

  function addPlayer() {
    setForm((current) => ({
      ...current,
      players: [
        ...current.players,
        EMPTY_PLAYER(),
      ],
    }));
  }

  function removePlayer(
    index: number,
  ) {
    setForm((current) => ({
      ...current,
      players:
        current.players.filter(
          (_, i) => i !== index,
        ),
    }));
  }

  function handleLogoUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/",
      )
    ) {
      setError(
        "Please select an image file.",
      );
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      setForm((current) => ({
        ...current,
        logo:
          typeof reader.result ===
          "string"
            ? reader.result
            : "",
      }));
    };

    reader.readAsDataURL(file);
  }

  async function saveTeam(
    event: FormEvent,
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const cleanPlayers =
        form.players
          .filter(
            (player) =>
              player.name.trim(),
          )
          .map((player) => ({
            id:
              player.id ||
              crypto.randomUUID(),
            name:
              player.name.trim(),
            role:
              player.role?.trim() ||
              "",
          }));

      const payload = {
        ...form,
        id:
          form.id.trim() ||
          slugify(form.name),
        name:
          form.name.trim(),
        tag:
          form.tag.trim(),
        seed:
          Number(form.seed),
        wins:
          Number(form.wins),
        losses:
          Number(form.losses),
        captainRank:
          form.captainRank?.trim() ||
          "",
        players:
          cleanPlayers,
      };

      if (!payload.id) {
        throw new Error(
          "Team name is required.",
        );
      }

      const isEditing =
        Boolean(editingId);

      const response =
        await fetch(
          isEditing
            ? `/api/teams/${encodeURIComponent(
                editingId!,
              )}`
            : "/api/teams",
          {
            method: isEditing
              ? "PUT"
              : "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify(
                payload,
              ),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to save team.",
        );
      }

      await loadTeams();

      setNotice(
        isEditing
          ? "Team updated successfully."
          : "Team created successfully.",
      );

      setEditingId(null);
      setForm(
        EMPTY_TEAM(),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save team.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteTeam(
    team: Team,
  ) {
    const confirmed =
      window.confirm(
        `Delete ${team.name}? This will also delete all players belonging to this team.`,
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setNotice("");

    try {
      const response =
        await fetch(
          `/api/teams/${encodeURIComponent(
            team.id,
          )}`,
          {
            method: "DELETE",
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to delete team.",
        );
      }

      setTeams(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              team.id,
          ),
      );

      if (
        editingId ===
        team.id
      ) {
        startCreate();
      }

      setNotice(
        "Team deleted successfully.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete team.",
      );
    }
  }

  function exportCsv() {
    const rows = [
      [
        "team_id",
        "team_name",
        "tag",
        "seed",
        "captain_rank",
        "player_1",
        "player_2",
        "player_3",
        "player_4",
        "player_5",
        "player_6",
      ],
      ...teams.map(
        (team) => [
          team.id,
          team.name,
          team.tag,
          String(team.seed),
          team.captainRank ??
            "",
          ...Array.from(
            {
              length: 6,
            },
            (_, index) =>
              team.players[
                index
              ]?.name ?? "",
          ),
        ],
      ),
    ];

    const csv =
      rows
        .map((row) =>
          row
            .map(
              (cell) =>
                `"${String(
                  cell,
                ).replaceAll(
                  '"',
                  '""',
                )}"`,
            )
            .join(","),
        )
        .join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type: "text/csv;charset=utf-8;",
        },
      );

    const url =
      URL.createObjectURL(
        blob,
      );

    const anchor =
      document.createElement(
        "a",
      );

    anchor.href = url;
    anchor.download =
      "valorant-teams.csv";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  function parseCsvLine(
    line: string,
  ) {
    const values: string[] = [];
    let current = "";
    let quoted = false;

    for (
      let i = 0;
      i < line.length;
      i++
    ) {
      const char =
        line[i];

      if (
        char === '"' &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i++;
        continue;
      }

      if (char === '"') {
        quoted =
          !quoted;
        continue;
      }

      if (
        char === "," &&
        !quoted
      ) {
        values.push(
          current.trim(),
        );
        current = "";
        continue;
      }

      current += char;
    }

    values.push(
      current.trim(),
    );

    return values;
  }

  async function importCsv(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setNotice("");

    try {
      const text =
        await file.text();

      const lines =
        text
          .split(/\r?\n/)
          .filter(
            (line) =>
              line.trim(),
          );

      if (
        lines.length <
        2
      ) {
        throw new Error(
          "CSV must contain a header and at least one team.",
        );
      }

      const headers =
        parseCsvLine(
          lines[0],
        ).map(
          (header) =>
            header
              .toLowerCase()
              .trim(),
        );

      const findIndex =
        (
          names: string[],
        ) =>
          names
            .map((name) =>
              headers.indexOf(
                name,
              ),
            )
            .find(
              (index) =>
                index !== -1,
            ) ??
          -1;

      const idIndex =
        findIndex([
          "team_id",
          "id",
        ]);

      const nameIndex =
        findIndex([
          "team_name",
          "name",
        ]);

      const tagIndex =
        findIndex([
          "tag",
        ]);

      const seedIndex =
        findIndex([
          "seed",
        ]);

      const captainIndex =
        findIndex([
          "captain_rank",
          "captainrank",
        ]);

      if (
        nameIndex === -1 ||
        tagIndex === -1
      ) {
        throw new Error(
          "CSV must contain team_name/name and tag columns.",
        );
      }

      const importedTeams =
        lines
          .slice(1)
          .map(
            (line) =>
              parseCsvLine(
                line,
              ),
          )
          .filter(
            (row) =>
              row[nameIndex]
                ?.trim(),
          )
          .map(
            (row, rowIndex) => {
              const name =
                row[
                  nameIndex
                ].trim();

              const id =
                (
                  idIndex !==
                  -1
                    ? row[
                        idIndex
                      ]
                    : ""
                )?.trim() ||
                slugify(name);

              const players =
                Array.from(
                  {
                    length: 6,
                  },
                  (_, index) => ({
                    id:
                      crypto.randomUUID(),
                    name:
                      row[
                        captainIndex +
                          1 +
                          index
                      ]?.trim() ||
                      "",
                    role: "",
                  }),
                ).filter(
                  (
                    player,
                  ) =>
                    player.name,
                );

              return {
                id,
                name,
                tag:
                  row[
                    tagIndex
                  ]?.trim() ||
                  name,
                seed:
                  Number(
                    row[
                      seedIndex
                    ],
                  ) ||
                  rowIndex +
                    1,
                logo: "",
                wins: 0,
                losses: 0,
                captainRank:
                  captainIndex !==
                  -1
                    ? row[
                        captainIndex
                      ]?.trim() ||
                      ""
                    : "",
                players,
              };
            },
          );

      for (
        const team of importedTeams
      ) {
        const existing =
          teams.find(
            (item) =>
              item.id ===
              team.id,
          );

        const response =
          await fetch(
            existing
              ? `/api/teams/${encodeURIComponent(
                  team.id,
                )}`
              : "/api/teams",
            {
              method:
                existing
                  ? "PUT"
                  : "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify(
                  team,
                ),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              `Failed to import ${team.name}.`,
          );
        }
      }

      await loadTeams();

      setNotice(
        `${importedTeams.length} team(s) imported successfully.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to import CSV.",
      );
    } finally {
      event.target.value =
        "";
    }
  }

  return (
    <main className="valorant-page min-h-screen bg-[#080c12] text-white">
      <header className="border-b border-[#1c2938] bg-[#0b1119]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <div className="text-[11px] font-bold tracking-[0.35em] text-[#7890ad]">
              VALORANT ESPORTS
            </div>

            <h1 className="mt-1 text-2xl font-black tracking-tight">
              TEAM MANAGEMENT
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin"
              className="rounded border border-[#38506d] bg-[#111b29] px-4 py-2 text-xs font-bold text-[#bcd0e8]"
            >
              ADMIN HUB ↗
            </Link>

            <Link
              href="/matches"
              className="rounded border border-[#38506d] bg-[#111b29] px-4 py-2 text-xs font-bold text-[#bcd0e8]"
            >
              MATCH CENTER ↗
            </Link>

            <Link
              href="/tournament"
              className="rounded border border-[#38506d] bg-[#111b29] px-4 py-2 text-xs font-bold text-[#bcd0e8]"
            >
              PUBLIC SITE ↗
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {error && (
          <div className="mb-5 rounded border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {notice && (
          <div className="mb-5 rounded border border-emerald-900/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
            {notice}
          </div>
        )}

        <section className="mb-8 rounded-xl border border-[#1d2a3a] bg-[#0d141e] p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#6f87a4]">
                {editingId
                  ? "EDIT TEAM"
                  : "CREATE TEAM"}
              </div>

              <h2 className="mt-1 text-xl font-black">
                {editingId
                  ? form.name ||
                    "Edit Team"
                  : "Add Tournament Team"}
              </h2>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={
                  startCreate
                }
                className="rounded border border-[#384b61] px-4 py-2 text-xs font-bold text-[#b7c8dc]"
              >
                CANCEL EDIT
              </button>
            )}
          </div>

          <form
            onSubmit={
              saveTeam
            }
            className="space-y-6"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#7188a5]">
                  Team ID
                </span>

                <input
                  value={
                    form.id
                  }
                  onChange={(event) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        id:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  disabled={
                    Boolean(
                      editingId,
                    )
                  }
                  placeholder="example-team"
                  className="w-full rounded border border-[#2b3b4f] bg-[#080e16] px-3 py-3 text-sm outline-none focus:border-[#5d7da3] disabled:opacity-50"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#7188a5]">
                  Team Name
                </span>

                <input
                  value={
                    form.name
                  }
                  onChange={(event) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        name:
                          event
                            .target
                            .value,
                        id:
                          editingId
                            ? current.id
                            : current.id ||
                              slugify(
                                event
                                  .target
                                  .value,
                              ),
                      }),
                    )
                  }
                  placeholder="Team name"
                  className="w-full rounded border border-[#2b3b4f] bg-[#080e16] px-3 py-3 text-sm outline-none focus:border-[#5d7da3]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#7188a5]">
                  Tag
                </span>

                <input
                  value={
                    form.tag
                  }
                  onChange={(event) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        tag:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  placeholder="TAG"
                  className="w-full rounded border border-[#2b3b4f] bg-[#080e16] px-3 py-3 text-sm uppercase outline-none focus:border-[#5d7da3]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#7188a5]">
                  Seed
                </span>

                <input
                  type="number"
                  min="1"
                  value={
                    form.seed
                  }
                  onChange={(event) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        seed:
                          Number(
                            event
                              .target
                              .value,
                          ),
                      }),
                    )
                  }
                  className="w-full rounded border border-[#2b3b4f] bg-[#080e16] px-3 py-3 text-sm outline-none focus:border-[#5d7da3]"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#7188a5]">
                  Captain Rank
                </span>

                <input
                  value={
                    form.captainRank ??
                    ""
                  }
                  onChange={(event) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        captainRank:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  placeholder="Captain - Bronze 1"
                  className="w-full rounded border border-[#2b3b4f] bg-[#080e16] px-3 py-3 text-sm outline-none focus:border-[#5d7da3]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#7188a5]">
                  Wins
                </span>

                <input
                  type="number"
                  min="0"
                  value={
                    form.wins
                  }
                  onChange={(event) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        wins:
                          Number(
                            event
                              .target
                              .value,
                          ),
                      }),
                    )
                  }
                  className="w-full rounded border border-[#2b3b4f] bg-[#080e16] px-3 py-3 text-sm outline-none focus:border-[#5d7da3]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#7188a5]">
                  Losses
                </span>

                <input
                  type="number"
                  min="0"
                  value={
                    form.losses
                  }
                  onChange={(event) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        losses:
                          Number(
                            event
                              .target
                              .value,
                          ),
                      }),
                    )
                  }
                  className="w-full rounded border border-[#2b3b4f] bg-[#080e16] px-3 py-3 text-sm outline-none focus:border-[#5d7da3]"
                />
              </label>
            </div>

            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#7188a5]">
                Team Logo
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {form.logo ? (
                  <Image
                    src={
                      form.logo
                    }
                    alt=""
                    width={80}
                    height={80}
                    unoptimized
                    className="h-20 w-20 rounded border border-[#30435a] bg-[#080e16] object-contain p-2"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded border border-dashed border-[#30435a] bg-[#080e16] text-[10px] font-bold text-[#5f748f]">
                    NO LOGO
                  </div>
                )}

                <label className="cursor-pointer rounded border border-[#38506d] bg-[#111b29] px-4 py-3 text-xs font-bold text-[#c1d1e5]">
                  UPLOAD LOGO
                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      handleLogoUpload
                    }
                    className="hidden"
                  />
                </label>

                {form.logo && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          logo: "",
                        }),
                      )
                    }
                    className="rounded border border-red-900/60 px-4 py-3 text-xs font-bold text-red-300"
                  >
                    REMOVE LOGO
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#7188a5]">
                    ROSTER
                  </div>

                  <div className="mt-1 text-sm text-[#8fa2ba]">
                    Add players belonging to this team.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    addPlayer
                  }
                  className="rounded border border-[#38506d] bg-[#111b29] px-4 py-2 text-xs font-bold text-[#c1d1e5]"
                >
                  + ADD PLAYER
                </button>
              </div>

              <div className="space-y-3">
                {form.players.map(
                  (
                    player,
                    index,
                  ) => (
                    <div
                      key={
                        player.id
                      }
                      className="grid gap-3 rounded border border-[#202e3f] bg-[#090f17] p-3 md:grid-cols-[1fr_180px_auto]"
                    >
                      <input
                        value={
                          player.name
                        }
                        onChange={(
                          event,
                        ) =>
                          updatePlayer(
                            index,
                            "name",
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder={`Player ${
                          index +
                          1
                        }`}
                        className="rounded border border-[#2b3b4f] bg-[#080e16] px-3 py-2 text-sm outline-none focus:border-[#5d7da3]"
                      />

                      <input
                        value={
                          player.role ??
                          ""
                        }
                        onChange={(
                          event,
                        ) =>
                          updatePlayer(
                            index,
                            "role",
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder="Role"
                        className="rounded border border-[#2b3b4f] bg-[#080e16] px-3 py-2 text-sm outline-none focus:border-[#5d7da3]"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removePlayer(
                            index,
                          )
                        }
                        className="rounded border border-red-900/60 px-3 py-2 text-xs font-bold text-red-300"
                      >
                        REMOVE
                      </button>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={
                  saving
                }
                className="rounded bg-[#d7e3f0] px-6 py-3 text-xs font-black tracking-wider text-[#08101a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "SAVING..."
                  : editingId
                    ? "UPDATE TEAM"
                    : "CREATE TEAM"}
              </button>

              <button
                type="button"
                onClick={
                  startCreate
                }
                className="rounded border border-[#35485f] px-6 py-3 text-xs font-bold text-[#b6c7da]"
              >
                CLEAR
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-[#1d2a3a] bg-[#0d141e]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1d2a3a] p-5">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#6f87a4]">
                DATABASE
              </div>

              <h2 className="mt-1 text-xl font-black">
                Tournament Teams
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                value={
                  search
                }
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event
                      .target
                      .value,
                  )
                }
                placeholder="Search teams..."
                className="rounded border border-[#2b3b4f] bg-[#080e16] px-3 py-2 text-sm outline-none focus:border-[#5d7da3]"
              />

              <label className="cursor-pointer rounded border border-[#38506d] bg-[#111b29] px-4 py-2 text-xs font-bold text-[#c1d1e5]">
                IMPORT CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={
                    importCsv
                  }
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={
                  exportCsv
                }
                className="rounded border border-[#38506d] bg-[#111b29] px-4 py-2 text-xs font-bold text-[#c1d1e5]"
              >
                EXPORT CSV
              </button>

              <button
                type="button"
                onClick={() => loadTeams(true)}
                className="rounded border border-[#38506d] bg-[#111b29] px-4 py-2 text-xs font-bold text-[#c1d1e5]"
              >
                REFRESH
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-[#7188a5]">
              Loading teams from database...
            </div>
          ) : filteredTeams.length ===
            0 ? (
            <div className="p-10 text-center">
              <div className="text-lg font-black">
                No teams found
              </div>

              <div className="mt-2 text-sm text-[#7188a5]">
                Create a team above or import a CSV.
              </div>
            </div>
          ) : (
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {filteredTeams.map(
                (team) => (
                  <article
                    key={
                      team.id
                    }
                    className="rounded-lg border border-[#223145] bg-[#090f17] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        {team.logo ? (
                          <Image
                            src={
                              team.logo
                            }
                            alt=""
                            width={64}
                            height={64}
                            unoptimized
                            className="h-16 w-16 shrink-0 rounded border border-[#2d4056] bg-[#080e16] object-contain p-2"
                          />
                        ) : (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded border border-[#2d4056] bg-[#080e16] text-xs font-black text-[#647991]">
                            {team.tag
                              .slice(
                                0,
                                3,
                              )
                              .toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#627994]">
                            SEED{" "}
                            {
                              team.seed
                            }
                          </div>

                          <h3 className="truncate text-lg font-black">
                            {
                              team.name
                            }
                          </h3>

                          <div className="text-xs font-bold text-[#7188a5]">
                            {
                              team.tag
                            }{" "}
                            ·{" "}
                            {
                              team.id
                            }
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-xs">
                        <div className="font-black text-emerald-400">
                          {
                            team.wins
                          }{" "}
                          W
                        </div>

                        <div className="font-black text-red-400">
                          {
                            team.losses
                          }{" "}
                          L
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-[#1c2938] pt-4">
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#627994]">
                        PLAYERS
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {team.players.map(
                          (
                            player,
                          ) => (
                            <div
                              key={
                                player.id
                              }
                              className="rounded border border-[#1b2837] bg-[#0c131d] px-3 py-2"
                            >
                              <div className="text-sm font-bold">
                                {
                                  player.name
                                }
                              </div>

                              {player.role && (
                                <div className="text-[10px] uppercase tracking-wider text-[#647a94]">
                                  {
                                    player.role
                                  }
                                </div>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          startEdit(
                            team,
                          )
                        }
                        className="flex-1 rounded border border-[#38506d] bg-[#111b29] px-4 py-2 text-xs font-bold text-[#c1d1e5]"
                      >
                        EDIT
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteTeam(
                            team,
                          )
                        }
                        className="rounded border border-red-900/60 px-4 py-2 text-xs font-bold text-red-300"
                      >
                        DELETE
                      </button>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}