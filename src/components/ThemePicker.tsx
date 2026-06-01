"use client";

import { useCallback, useEffect, useState } from "react";
import type { ThemeDefinition } from "@/lib/themes";

type BoardGame = {
  id: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number;
  description: string | null;
};

type PenAndPaper = {
  id: string;
  name: string;
  system: string;
  description: string | null;
};

export type ThemePickerValue = {
  theme: string;
  boardGameId: string;
  penAndPaperId: string;
  themeNotes: string;
};

type Props = {
  value: ThemePickerValue;
  onChange: (value: ThemePickerValue) => void;
};

export function ThemePicker({ value, onChange }: Props) {
  const [themes, setThemes] = useState<ThemeDefinition[]>([]);
  const [boardGames, setBoardGames] = useState<BoardGame[]>([]);
  const [penGames, setPenGames] = useState<PenAndPaper[]>([]);
  const [boardSearch, setBoardSearch] = useState("");
  const [penSearch, setPenSearch] = useState("");

  useEffect(() => {
    fetch("/api/themes")
      .then((r) => r.json())
      .then((d) => setThemes(d.themes ?? []));
  }, []);

  const loadBoardGames = useCallback(async (q: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const res = await fetch(`/api/board-games?${params}`);
    const data = await res.json();
    if (res.ok) setBoardGames(data.games ?? []);
  }, []);

  const loadPenGames = useCallback(async (q: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const res = await fetch(`/api/pen-and-paper?${params}`);
    const data = await res.json();
    if (res.ok) setPenGames(data.games ?? []);
  }, []);

  const selected = themes.find((t) => t.id === value.theme) ?? themes[0];

  useEffect(() => {
    if (selected?.requiresBoardGame) void loadBoardGames(boardSearch);
  }, [selected?.requiresBoardGame, boardSearch, loadBoardGames]);

  useEffect(() => {
    if (selected?.requiresPenAndPaper) void loadPenGames(penSearch);
  }, [selected?.requiresPenAndPaper, penSearch, loadPenGames]);

  function setTheme(themeId: string) {
    onChange({
      theme: themeId,
      boardGameId: "",
      penAndPaperId: "",
      themeNotes: value.themeNotes,
    });
  }

  return (
    <fieldset className="rounded-lg border border-zinc-200 p-4 text-sm">
      <legend className="px-1 font-medium">Meetup theme</legend>
      <div className="mt-2 grid gap-2">
        {themes.map((t) => (
          <label
            key={t.id}
            className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${
              value.theme === t.id
                ? "border-emerald-600 bg-emerald-50"
                : "border-zinc-200"
            }`}
          >
            <input
              type="radio"
              name="theme"
              className="mt-1"
              checked={value.theme === t.id}
              onChange={() => setTheme(t.id)}
            />
            <span>
              <span className="font-medium">
                {t.emoji} {t.label}
              </span>
              <span className="mt-0.5 block text-xs text-zinc-600">
                {t.description}
              </span>
            </span>
          </label>
        ))}
      </div>

      {selected?.requiresBoardGame && (
        <div className="mt-4">
          <label className="flex flex-col gap-1">
            Search board games
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2"
              value={boardSearch}
              onChange={(e) => setBoardSearch(e.target.value)}
              placeholder="e.g. Catan, Wingspan…"
            />
          </label>
          <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-zinc-200">
            {boardGames.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  className={`w-full px-3 py-2 text-left hover:bg-zinc-50 ${
                    value.boardGameId === g.id ? "bg-emerald-100" : ""
                  }`}
                  onClick={() =>
                    onChange({ ...value, boardGameId: g.id })
                  }
                >
                  <span className="font-medium">{g.name}</span>
                  <span className="block text-xs text-zinc-500">
                    {g.minPlayers}–{g.maxPlayers} players · ~{g.playTimeMinutes}
                    min
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected?.requiresPenAndPaper && (
        <div className="mt-4">
          <label className="flex flex-col gap-1">
            Search systems
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2"
              value={penSearch}
              onChange={(e) => setPenSearch(e.target.value)}
              placeholder="e.g. D&D, Call of Cthulhu…"
            />
          </label>
          <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-zinc-200">
            {penGames.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  className={`w-full px-3 py-2 text-left hover:bg-zinc-50 ${
                    value.penAndPaperId === g.id ? "bg-emerald-100" : ""
                  }`}
                  onClick={() =>
                    onChange({ ...value, penAndPaperId: g.id })
                  }
                >
                  <span className="font-medium">{g.name}</span>
                  <span className="block text-xs text-zinc-500">{g.system}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected?.allowsNotes && (
        <label className="mt-4 flex flex-col gap-1">
          Optional details
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2"
            value={value.themeNotes}
            onChange={(e) =>
              onChange({ ...value, themeNotes: e.target.value })
            }
            maxLength={500}
            placeholder={
              selected.requiresBoardGame
                ? "e.g. expansions, house rules…"
                : "e.g. which park, Discord server, dish to bring…"
            }
          />
        </label>
      )}
    </fieldset>
  );
}
