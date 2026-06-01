import type { MeetupTheme } from "@/generated/prisma/enums";
import { getThemeDefinition } from "@/lib/themes";
import { prisma } from "@/lib/db";

export type ThemeInput = {
  theme: MeetupTheme;
  boardGameId?: string | null;
  penAndPaperId?: string | null;
  themeNotes?: string | null;
};

export async function validateThemeInput(input: ThemeInput): Promise<string | null> {
  const def = getThemeDefinition(input.theme);

  if (def.requiresBoardGame) {
    if (!input.boardGameId) {
      return "Select a board game for this theme.";
    }
    const game = await prisma.boardGame.findUnique({
      where: { id: input.boardGameId },
    });
    if (!game) return "Board game not found.";
  }

  if (def.requiresPenAndPaper) {
    if (!input.penAndPaperId) {
      return "Select a pen & paper system for this theme.";
    }
    const game = await prisma.penAndPaperGame.findUnique({
      where: { id: input.penAndPaperId },
    });
    if (!game) return "Pen & paper system not found.";
  }

  if (input.themeNotes && input.themeNotes.length > 500) {
    return "Theme notes must be 500 characters or fewer.";
  }

  return null;
}

export function themeDataForCreate(input: ThemeInput) {
  const def = getThemeDefinition(input.theme);
  return {
    theme: input.theme,
    boardGameId: def.requiresBoardGame ? input.boardGameId : null,
    penAndPaperId: def.requiresPenAndPaper ? input.penAndPaperId : null,
    themeNotes: input.themeNotes?.trim() || null,
  };
}
