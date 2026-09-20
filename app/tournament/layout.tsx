import { TournamentBackground } from "./components/tournament-background";

export default function TournamentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen bg-[#02050b]">
      <TournamentBackground />
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
}
