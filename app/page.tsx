import Link from "next/link";
import { teams } from "./data/teams";

export default function Home() {
  const team1 = teams[0];
  const team2 = teams[1];

  return (
    <main className="min-h-screen bg-[#080c12] text-white">
      <header className="border-b border-[#273244] px-10 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-wide">
              TOURNAMENT MANAGEMENT{" "}
              <span className="text-[#ff4655]">// ADMIN HUB</span>
            </h1>

            <p className="mt-2 text-xs text-[#88a0bd]">
              Tournament Management System • Online Cloud Sync
            </p>
          </div>

          <div className="flex gap-3">
            <button className="rounded border border-[#38506d] bg-[#111b29] px-4 py-2 text-xs font-bold text-[#bcd0e8]">
              RESET TOURNAMENT DATA
            </button>

            <Link
              href="/teams"
              className="rounded border border-[#38506d] bg-[#111b29] px-4 py-2 text-xs font-bold text-[#bcd0e8]"
            >
              REGISTERED TEAMS ↗
            </Link>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 p-10 lg:grid-cols-[460px_1fr]">
        <div className="overflow-hidden rounded border border-[#2a3749] bg-[#0e141e]">
          <div className="border-b border-[#2b3748] px-4 py-4 text-sm font-bold tracking-wide">
            RECORD MATCH & ASSIGN STATS
          </div>

          <div className="space-y-5 p-4">
            <label
              htmlFor="scoreboard"
              className="block cursor-pointer rounded border-2 border-dashed border-[#385878] p-5 text-center transition hover:border-[#ff4655]"
            >
              <div className="text-xs font-bold">
                ▣ UPLOAD OR PASTE SCOREBOARD
              </div>

              <p className="mt-2 text-xs text-green-400">
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
              <label className="mb-2 block text-xs font-bold text-[#8da5c1]">
                STAGE
              </label>

              <select className="w-full rounded border border-[#31445c] bg-[#080d14] p-3 text-sm text-white">
                <option>Group Stage Match</option>
                <option>Quarterfinal</option>
                <option>Semifinal</option>
                <option>Final</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-xs font-bold text-[#8da5c1]">
                  TEAM 1
                </label>

                <select className="w-full rounded border border-[#31445c] bg-[#080d14] p-3 text-sm text-white">
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[#8da5c1]">
                  TEAM 2
                </label>

                <select className="w-full rounded border border-[#31445c] bg-[#080d14] p-3 text-sm text-white">
                  {teams.map((team, index) => (
                    <option
                      key={team.id}
                      value={team.id}
                      selected={index === 1}
                    >
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_40px_1fr] items-center gap-2">
              <input
                type="number"
                defaultValue={13}
                className="w-full rounded border border-[#31445c] bg-[#080d14] p-4 text-center text-2xl font-bold text-white"
              />

              <span className="text-center text-xs font-bold text-[#8da5c1]">
                VS
              </span>

              <input
                type="number"
                defaultValue={9}
                className="w-full rounded border border-[#31445c] bg-[#080d14] p-4 text-center text-2xl font-bold text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-xs font-bold text-[#8da5c1]">
                  {team1.name} KILLS
                </label>

                <div className="h-40 space-y-2 overflow-y-auto rounded border border-[#31445c] bg-[#080d14] p-2">
                  {team1.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="truncate text-[10px]">
                        {player.name}
                      </span>

                      <input
                        type="number"
                        defaultValue={0}
                        className="w-14 rounded border border-[#31445c] bg-[#080d14] p-1.5 text-center text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[#8da5c1]">
                  {team2.name} KILLS
                </label>

                <div className="h-40 space-y-2 overflow-y-auto rounded border border-[#31445c] bg-[#080d14] p-2">
                  {team2.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="truncate text-[10px]">
                        {player.name}
                      </span>

                      <input
                        type="number"
                        defaultValue={0}
                        className="w-14 rounded border border-[#31445c] bg-[#080d14] p-1.5 text-center text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[#8da5c1]">
                MATCH MVP
              </label>

              <select className="w-full rounded border border-[#31445c] bg-[#080d14] p-3 text-sm text-white">
                {team1.players.concat(team2.players).map((player) => (
                  <option key={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-xs font-bold text-[#8da5c1]">
                  TEAM 1 TOP FRAGGER
                </label>

                <select className="w-full rounded border border-[#31445c] bg-[#080d14] p-3 text-sm text-white">
                  {team1.players.map((player) => (
                    <option key={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[#8da5c1]">
                  TEAM 2 TOP FRAGGER
                </label>

                <select className="w-full rounded border border-[#31445c] bg-[#080d14] p-3 text-sm text-white">
                  {team2.players.map((player) => (
                    <option key={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button className="w-full rounded bg-[#ff4655] py-3 text-xs font-extrabold tracking-wide text-white transition hover:bg-[#e63d4d]">
              SAVE & PUBLISH TO PUBLIC WEBSITE
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded border border-[#2a3749] bg-[#0e141e]">
          <div className="flex justify-between border-b border-[#2b3748] px-4 py-4 text-sm font-bold tracking-wide">
            <span>RECORDED MATCH LOGS</span>

            <span className="text-xs text-[#91a6c0]">
              0 LOGGED
            </span>
          </div>

          <div className="flex min-h-[700px] items-center justify-center text-sm text-[#8da5c1]">
            No matches found.
          </div>
        </div>
      </section>
    </main>
  );
}