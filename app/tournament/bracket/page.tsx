"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The bracket now lives on the Matches page (Matches + Bracket were merged
// into one page). Keep this route alive as a redirect for old links/bookmarks.
export default function TournamentBracketRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/tournament/matches");
  }, [router]);

  return null;
}
