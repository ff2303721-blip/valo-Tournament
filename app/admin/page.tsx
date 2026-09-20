import Link from "next/link";
import { teams } from "../data/teams";

export default function Home() {
  const team1 = teams[0];
  const team2 = teams[1];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#04070f] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_8%_12%,rgba(255,31,91,0.18),transparent_25%),radial-gradient(circle_at_88%_12%,rgba(0,229,255,0.13),transparent_27%),radial-gradient(circle_at_55%_90%,rgba(139,92,246,0.12),transparent_35%)]" />

      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute -left-24 top-28 h-72 w-72 rotate-12 bg-gradient-to-br from-[#ff1f5b]/20 to-transparent blur-3xl" />
        <div className="absolute right-[-80px] top-40 h-80 w-80 -rotate-12 bg-gradient-to-br from-[#00e5ff]/15 to-transparent blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-[#273755] bg-[#070c17]/90 shadow-[0_8px_35px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1700px] flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-7">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#ff2f68]/50 bg-gradient-to-br from-[#ff1f5b] to-[#8b2cff] text-xl font-black shadow-[0_0_28px_rgba(255,31,91,0.25)]">
              V
            </div>

            <div>
              <h1 className="text-lg font-black uppercase tracking-tight sm:text-xl">
                XMD VALORANT TOURNAMENT
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ff3f78]">
                Admin Panel
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin"
              className="rounded-xl border border-[#52e2ff]/35 bg-[#52e2ff]/[0.08] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#72e9ff]"
            >
              Dashboard
            </Link>
            <Link
              href="/matches"
              className="rounded-xl border border-[#ff3158]/60 bg-gradient-to-r from-[#ff3158]/20 to-[#8b2cff]/15 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#ff6b8d] shadow-[0_0_22px_rgba(255,49,88,0.12)]"
            >
              Match Management
            </Link>
            <Link
              href="/teams"
              className="rounded-xl border border-[#263750] bg-[#0a1220] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#a9b8cc] transition hover:border-[#52e2ff]/50 hover:text-[#52e2ff]"
            >
              Teams
            </Link>
            <Link
              href="/tournament/players"
              className="rounded-xl border border-[#263750] bg-[#0a1220] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#a9b8cc] transition hover:border-[#52e2ff]/50 hover:text-[#52e2ff]"
            >
              Players
            </Link>
            <Link
              href="/admin/settings"
              className="rounded-xl border border-[#263750] bg-[#0a1220] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#a9b8cc] transition hover:border-[#52e2ff]/50 hover:text-[#52e2ff]"
            >
              Settings
            </Link>
            <Link
              href="/tournament"
              className="ml-0 rounded-xl border border-[#52e2ff]/40 bg-[#52e2ff]/[0.05] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#72e9ff] transition hover:bg-[#52e2ff]/10"
            >
              ← Back to Website
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-[1700px] gap-5 px-5 py-6 lg:grid-cols-[510px_minmax(0,1fr)] lg:px-7">
        <div className="relative overflow-hidden rounded-2xl border border-[#ff2f68]/70 bg-gradient-to-br from-[#0d1220] via-[#080e19] to-[#0a1320] shadow-[0_20px_70px_rgba(0,0,0,0.38),0_0_35px_rgba(255,31,91,0.08)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ff1f5b] via-[#8b2cff] to-[#00e5ff]" />

          <div className="border-b border-white/[0.08] bg-white/[0.015] p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#ff3158]/50 bg-gradient-to-br from-[#ff3158] to-[#8b2cff] text-xl shadow-[0_0_25px_rgba(255,49,88,0.22)]">
                🎮
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">
                  Record Match & Assign Stats
                </h2>
                <p className="mt-1 text-xs text-[#8195b0]">
                  Enter match results and assign player stats.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <label
              htmlFor="scoreboard"
              className="block cursor-pointer rounded-xl border-2 border-dashed border-[#365879] bg-[#07101c]/70 p-5 text-center transition hover:border-[#ff3158] hover:bg-[#ff3158]/[0.04]"
            >
              <div className="text-[11px] font-black uppercase tracking-wider text-[#72e9ff]">
                ▣ Upload or Paste Scoreboard
              </div>
              <p className="mt-2 text-xs text-emerald-400">
                Upload a scoreboard screenshot and verify the values.
              </p>
              <input
                id="scoreboard"
                type="file"
                accept="image/*"
                className="hidden"
              />
            </label>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-[#52e2ff]">
                Stage
              </label>
              <select className="w-full rounded-xl border border-[#2b3d58] bg-[#060b14] p-3 text-sm text-white outline-none transition focus:border-[#52e2ff] focus:ring-1 focus:ring-[#52e2ff]/15">
                <option>Group Stage Match</option>
                <option>Quarterfinal</option>
                <option>Semifinal</option>
                <option>Final</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[team1, team2].map((team, index) => (
                <div key={team.id}>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-[#52e2ff]">
                    Team {index + 1}
                  </label>
                  <select
                    defaultValue={team.id}
                    className="w-full rounded-xl border border-[#2b3d58] bg-[#060b14] p-3 text-sm text-white outline-none transition focus:border-[#52e2ff] focus:ring-1 focus:ring-[#52e2ff]/15"
                  >
                    {teams.map((optionTeam) => (
                      <option key={optionTeam.id} value={optionTeam.id}>
                        {optionTeam.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[1fr_42px_1fr] items-center gap-2">
              <input
                type="number"
                defaultValue={13}
                className="w-full rounded-xl border border-[#00e5ff]/50 bg-[#06121b] p-3 text-center text-3xl font-black text-[#72e9ff] shadow-[0_0_20px_rgba(0,229,255,0.08)] outline-none"
              />
              <span className="text-center text-[10px] font-black text-[#8195b0]">
                VS
              </span>
              <input
                type="number"
                defaultValue={9}
                className="w-full rounded-xl border border-[#ff3158]/50 bg-[#170a12] p-3 text-center text-3xl font-black text-[#ff6b8d] shadow-[0_0_20px_rgba(255,49,88,0.08)] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[team1, team2].map((team, teamIndex) => (
                <div
                  key={team.id}
                  className={`overflow-hidden rounded-xl border ${
                    teamIndex === 0
                      ? "border-[#8b2cff]/45"
                      : "border-[#ff3158]/45"
                  } bg-[#060b14]`}
                >
                  <div className="border-b border-white/[0.07] bg-white/[0.025] px-3 py-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#c6d5e8]">
                      {team.name} Kills
                    </span>
                  </div>
                  <div className="h-40 space-y-2 overflow-y-auto p-2">
                    {team.players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2 py-1.5"
                      >
                        <span className="truncate text-[10px] text-[#d5dfec]">
                          {player.name}
                        </span>
                        <input
                          type="number"
                          defaultValue={0}
                          className="w-12 rounded-lg border border-[#2b3d58] bg-[#07101a] p-1.5 text-center text-xs text-white outline-none focus:border-[#52e2ff]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-[#ff5d8a]">
                ★ Match MVP
              </label>
              <select className="w-full rounded-xl border border-[#8b2cff]/40 bg-[#0a0b18] p-3 text-sm text-white outline-none focus:border-[#ff5d8a]">
                {team1.players.concat(team2.players).map((player) => (
                  <option key={player.id}>{player.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[team1, team2].map((team, index) => (
                <div key={team.id}>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-[#52e2ff]">
                    Team {index + 1} Top Fragger
                  </label>
                  <select className="w-full rounded-xl border border-[#2b3d58] bg-[#060b14] p-3 text-sm text-white outline-none focus:border-[#52e2ff]">
                    {team.players.map((player) => (
                      <option key={player.id}>{player.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <button className="w-full rounded-xl bg-gradient-to-r from-[#ff1680] via-[#ff3158] to-[#ff6b35] py-3.5 text-[11px] font-black uppercase tracking-wider text-white shadow-[0_0_30px_rgba(255,49,88,0.24)] transition hover:-translate-y-0.5 hover:brightness-110">
              ⤴ Save & Publish to Public Website
            </button>
          </div>
        </div>

        <div className="relative min-h-[760px] overflow-hidden rounded-2xl border border-[#8b2cff]/60 bg-gradient-to-br from-[#08101c] via-[#070d18] to-[#080b19] shadow-[0_20px_70px_rgba(0,0,0,0.38),0_0_35px_rgba(139,92,246,0.08)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#8b2cff] via-[#ff3158] to-[#00e5ff]" />

          <div className="border-b border-white/[0.08] bg-white/[0.015] p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#8b2cff]/50 bg-gradient-to-br from-[#8b2cff] to-[#ff3158] text-xl shadow-[0_0_25px_rgba(139,92,246,0.22)]">
                  ▤
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight">
                    Recorded Match Logs
                  </h2>
                  <p className="mt-1 text-xs text-[#8195b0]">
                    View all recorded matches and statistics.
                  </p>
                </div>
              </div>

              <div className="rounded-full border border-[#00e5ff]/40 bg-[#00e5ff]/[0.06] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#72e9ff]">
                0 Matches
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
              <input
                placeholder="Search by team, player or map..."
                className="rounded-xl border border-[#2b3d58] bg-[#050a12] px-4 py-3 text-sm text-white outline-none placeholder:text-[#5f718a] focus:border-[#52e2ff]"
              />
              <select
                className="rounded-xl border border-[#2b3d58] bg-[#050a12] px-4 py-3 text-sm text-white outline-none focus:border-[#52e2ff]"
                defaultValue="all"
              >
                <option value="all">All Stages</option>
                <option value="group">Group Stage</option>
                <option value="qualifiers">Qualifiers</option>
                <option value="lower-qualifier">Lower Qualifier</option>
                <option value="grand-final">Grand Final</option>
              </select>
              <select
                className="rounded-xl border border-[#2b3d58] bg-[#050a12] px-4 py-3 text-sm text-white outline-none focus:border-[#52e2ff]"
                defaultValue="all"
              >
                <option value="all">All Teams</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <button className="rounded-xl border border-[#2b3d58] bg-[#0a1220] px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#a9b8cc] transition hover:border-[#ff3158]/50 hover:text-[#ff6b8d]">
                × Clear
              </button>
            </div>
          </div>

          <div className="mx-5 mt-5 overflow-hidden rounded-xl border border-[#263750] bg-[#060b14]">
            <div className="grid grid-cols-8 gap-3 bg-gradient-to-r from-[#111b32] via-[#1a1030] to-[#111b32] px-4 py-3 text-[9px] font-black uppercase tracking-wider text-[#72e9ff]">
              <span>#</span>
              <span>Stage</span>
              <span>Teams</span>
              <span>Map</span>
              <span>Score</span>
              <span>MVP</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            <div className="flex min-h-[570px] flex-col items-center justify-center bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.07),transparent_45%)] px-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#8b2cff]/50 bg-[#8b2cff]/10 text-4xl text-[#b56bff] shadow-[0_0_35px_rgba(139,92,246,0.16)]">
                ▤
              </div>
              <h3 className="mt-6 text-xl font-black">
                No matches found
              </h3>
              <p className="mt-2 max-w-sm text-sm text-[#8195b0]">
                Record your first match using the form on the left.
              </p>

              <div className="mt-20">
                <div className="text-3xl font-black text-[#ff2f88]">V</div>
                <p className="mt-3 text-[9px] font-black uppercase tracking-[0.35em] text-[#8b9ab1]">
                  More than a tournament
                </p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.35em] text-[#8b9ab1]">
                  Its a family
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
