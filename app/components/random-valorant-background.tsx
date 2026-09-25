"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getGameDefinition, GAMES } from "@/lib/games/registry";

function getRandomWallpaper(pool: string[], current?: string): string {
  if (!pool || pool.length === 0) return GAMES.valorant.wallpapers[0];
  if (pool.length <= 1) return pool[0];
  let next = current;
  while (next === current) {
    const idx = Math.floor(Math.random() * pool.length);
    next = pool[idx];
  }
  return next || pool[0];
}

export default function RandomValorantBackground() {
  const pathname = usePathname();
  const [wallpaper, setWallpaper] = useState<string>("");
  const [gameId, setGameId] = useState<string>("valorant");

  useEffect(() => {
    let mounted = true;
    async function loadGameSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (mounted && data?.gameId) {
            setGameId(data.gameId);
          }
        }
      } catch {
        // Fallback to valorant default
      }
    }
    loadGameSettings();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const game = getGameDefinition(gameId);
    const pool = game.wallpapers && game.wallpapers.length > 0 ? game.wallpapers : GAMES.valorant.wallpapers;
    setWallpaper((prev) => getRandomWallpaper(pool, prev));
  }, [pathname, gameId]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ backgroundColor: "#030308" }}
    >
      {/* Background Wallpaper Image */}
      {wallpaper ? (
        <div
          key={wallpaper}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
          style={{
            backgroundImage: `url("${wallpaper}")`,
            backgroundAttachment: "fixed",
          }}
        />
      ) : null}

      {/* Dark cinematic gradient overlay - ensures 100% readability of cards and text while showing map art */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(3,3,8,0.72) 0%, rgba(6,10,18,0.64) 40%, rgba(3,3,8,0.85) 100%)",
        }}
      />
    </div>
  );
}
