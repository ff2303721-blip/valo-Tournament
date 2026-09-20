"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const BACKGROUND_IMAGES = [
  "https://images5.alphacoders.com/120/thumb-1920-1202339.png",
  "https://images4.alphacoders.com/120/1202336.png",
  "https://wallpapers.com/images/hd/red-valorant-8k-gaming-2h2qxvq2arallyki.jpg",
  "https://cdn.wallpapersafari.com/4/74/XAY3GaV.jpg",
  "https://i.pinimg.com/736x/ea/30/ea/ea30ea61571b1086b5502c4f82a5fb0c.jpg",
];

export function TournamentBackground() {
  const pathname = usePathname();
  const [backgroundImage, setBackgroundImage] = useState(
    BACKGROUND_IMAGES[0],
  );

  useEffect(() => {
    const randomIndex = Math.floor(
      Math.random() * BACKGROUND_IMAGES.length,
    );

    setBackgroundImage(BACKGROUND_IMAGES[randomIndex]);
  }, [pathname]);

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("${backgroundImage}")`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] bg-[#02050b]/56"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[2] bg-[radial-gradient(circle_at_15%_15%,rgba(255,49,88,0.24),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(39,217,255,0.22),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(139,92,246,0.20),transparent_38%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[3] bg-gradient-to-b from-[#02050b]/10 via-transparent to-[#02050b]/45"
      />
    </>
  );
}
