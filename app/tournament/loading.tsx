export default function Loading() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050810] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(255,49,88,0.12),transparent_25%),radial-gradient(circle_at_85%_20%,rgba(39,217,255,0.10),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(139,92,246,0.10),transparent_35%)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-8">
        <div className="h-3 w-44 animate-pulse rounded bg-[#52e2ff]/20" />
        <div className="mt-4 h-10 w-80 animate-pulse rounded bg-white/10" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-white/5" />

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-44 animate-pulse rounded-2xl border border-[#263750] bg-gradient-to-br from-[#0d1522] to-[#0a1019]"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
