import fs from "fs";

const content = fs.readFileSync("lib/games/registry.ts", "utf8");
const urls = Array.from(new Set(content.match(/https:\/\/[^"']+/g) || []));

async function main() {
  console.log("Checking", urls.length, "URLs...");
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      console.log(res.status, url);
    } catch (err) {
      console.log("ERR", err.message, url);
    }
  }
}

main();
