import fs from "fs";

async function check() {
  const res = await fetch("https://battlegrounds.fandom.com/wiki/Erangel", {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const text = await res.text();
  const allImages = [...text.matchAll(/https:\/\/[^"'\s]+\.(?:jpg|png|webp)/gi)].map(m => m[0]);
  console.log("Found", allImages.length, "images");
  console.log(allImages.slice(0, 10));
}

check();
