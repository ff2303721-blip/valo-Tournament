function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return parsed.pathname.slice(1) || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
      const liveMatch = parsed.pathname.match(/^\/(live|embed|shorts)\/([^/]+)/);
      if (liveMatch) return liveMatch[2];
    }

    return null;
  } catch {
    return null;
  }
}

export function LiveStreamEmbed({ url }: { url?: string | null }) {
  if (!url) return null;

  const videoId = extractYouTubeId(url.trim());
  if (!videoId) return null;

  return (
    <section className="overflow-hidden rounded-3xl border border-[#ff2d55]/40 bg-[#0c0c18]/90 shadow-[0_0_40px_rgba(255,45,85,0.12)]">
      <div className="flex items-center gap-2.5 border-b border-[#1e1e3a] px-5 py-3.5">
        <span className="live-dot h-2 w-2 flex-shrink-0" />
        <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#ff4d6a]">
          Live Broadcast
        </span>
      </div>
      <div className="relative aspect-video w-full bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=0`}
          title="Live tournament broadcast"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </section>
  );
}
