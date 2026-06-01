import { getThemeDefinition } from "@/lib/themes";
import type { MeetupTheme } from "@/generated/prisma/enums";

type BoardGame = {
  name: string;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number;
  description: string | null;
} | null;

type PenAndPaper = {
  name: string;
  system: string;
  description: string | null;
} | null;

export function ThemeSummary({
  theme,
  boardGame,
  penAndPaper,
  themeNotes,
}: {
  theme: MeetupTheme;
  boardGame: BoardGame;
  penAndPaper: PenAndPaper;
  themeNotes: string | null;
}) {
  const def = getThemeDefinition(theme);

  return (
    <section className="mb-6 rounded-lg border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-zinc-700">Meetup theme</h2>
      <p className="mt-1 text-sm">
        {def.emoji} <span className="font-medium">{def.label}</span>
      </p>
      {boardGame && (
        <div className="mt-2 text-sm text-zinc-700">
          <p className="font-medium">🎲 {boardGame.name}</p>
          <p className="text-xs text-zinc-500">
            {boardGame.minPlayers}–{boardGame.maxPlayers} players · ~
            {boardGame.playTimeMinutes} min
          </p>
          {boardGame.description && (
            <p className="mt-1 text-xs text-zinc-600">{boardGame.description}</p>
          )}
        </div>
      )}
      {penAndPaper && (
        <div className="mt-2 text-sm text-zinc-700">
          <p className="font-medium">📜 {penAndPaper.name}</p>
          <p className="text-xs text-zinc-500">{penAndPaper.system}</p>
          {penAndPaper.description && (
            <p className="mt-1 text-xs text-zinc-600">{penAndPaper.description}</p>
          )}
        </div>
      )}
      {themeNotes && (
        <p className="mt-2 text-xs text-zinc-600">
          <span className="font-medium">Details:</span> {themeNotes}
        </p>
      )}
    </section>
  );
}
