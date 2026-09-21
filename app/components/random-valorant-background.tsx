"use client";

import { useEffect } from "react";

const BACKGROUNDS = [
  "https://images5.alphacoders.com/120/thumb-1920-1202339.png",
  "https://images4.alphacoders.com/120/1202336.png",
  "https://wallpapers.com/images/hd/red-valorant-8k-gaming-2h2qxvq2arallyki.jpg",
  "https://cdn.wallpapersafari.com/4/74/XAY3GaV.jpg",
  "https://i.pinimg.com/736x/ea/30/ea/ea30ea61571b1086b5502c4f82a5fb0c.jpg",
  "https://images2.alphacoders.com/119/1195538.jpg",
];

export default function RandomValorantBackground() {
  useEffect(() => {
    const background =
      BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];

    document.documentElement.style.setProperty(
      "--valorant-background",
      `url("${background}")`,
    );
  }, []);

  return null;
}
