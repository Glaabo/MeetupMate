import type { MeetupTheme } from "@/generated/prisma/enums";

export type ThemeDefinition = {
  id: MeetupTheme;
  label: string;
  description: string;
  emoji: string;
  requiresBoardGame: boolean;
  requiresPenAndPaper: boolean;
  allowsNotes: boolean;
};

export const MEETUP_THEMES: ThemeDefinition[] = [
  {
    id: "GENERAL",
    label: "General hangout",
    description: "No specific activity — just find a time to meet.",
    emoji: "👋",
    requiresBoardGame: false,
    requiresPenAndPaper: false,
    allowsNotes: true,
  },
  {
    id: "BOARD_GAMES",
    label: "Board games",
    description: "Pick a game from the catalog so everyone knows what to expect.",
    emoji: "🎲",
    requiresBoardGame: true,
    requiresPenAndPaper: false,
    allowsNotes: true,
  },
  {
    id: "PEN_AND_PAPER",
    label: "Pen & paper RPG",
    description: "Tabletop roleplaying — choose a system or adventure style.",
    emoji: "📜",
    requiresBoardGame: false,
    requiresPenAndPaper: true,
    allowsNotes: true,
  },
  {
    id: "COFFEE_SOCIAL",
    label: "Coffee & chat",
    description: "Café, tea, or casual drinks.",
    emoji: "☕",
    requiresBoardGame: false,
    requiresPenAndPaper: false,
    allowsNotes: true,
  },
  {
    id: "OUTDOOR",
    label: "Outdoor",
    description: "Hike, park meetup, picnic, or walk.",
    emoji: "🌲",
    requiresBoardGame: false,
    requiresPenAndPaper: false,
    allowsNotes: true,
  },
  {
    id: "VIDEO_GAMES",
    label: "Video games",
    description: "Online or couch co-op — note the game in optional details.",
    emoji: "🎮",
    requiresBoardGame: false,
    requiresPenAndPaper: false,
    allowsNotes: true,
  },
  {
    id: "COOKING_POTLUCK",
    label: "Cooking / potluck",
    description: "Shared meal at someone's place or a cook-together session.",
    emoji: "🍳",
    requiresBoardGame: false,
    requiresPenAndPaper: false,
    allowsNotes: true,
  },
  {
    id: "SPORTS",
    label: "Sports & active",
    description: "Match watch, pickup game, climbing, or gym session.",
    emoji: "⚽",
    requiresBoardGame: false,
    requiresPenAndPaper: false,
    allowsNotes: true,
  },
];

export function getThemeDefinition(theme: MeetupTheme): ThemeDefinition {
  return (
    MEETUP_THEMES.find((t) => t.id === theme) ??
    MEETUP_THEMES[0]
  );
}
