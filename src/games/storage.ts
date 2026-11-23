import { sanitizeDefinition, type GameDefinition } from "./definition";

const STORAGE_KEY = "game-builder:games";

export function loadSavedGames(): GameDefinition[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(sanitizeDefinition)
      .filter((game): game is GameDefinition => game !== null)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

function write(games: GameDefinition[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  } catch {
    // Storage unavailable (private mode, quota) — the builder keeps working in memory.
  }
  return games;
}

export function saveGame(game: GameDefinition) {
  return write([game, ...loadSavedGames().filter((g) => g.id !== game.id)]);
}

export function deleteGame(id: string) {
  return write(loadSavedGames().filter((g) => g.id !== id));
}
