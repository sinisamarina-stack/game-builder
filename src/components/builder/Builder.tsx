"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { GameSession } from "@/engine/session";
import { GamePlayer } from "@/components/player/GamePlayer";
import {
  createDefinition,
  encodeDefinition,
  sanitizeDefinition,
  type GameDefinition,
} from "@/games/definition";
import { getTemplate, templates } from "@/games/registry";
import { deleteGame, loadSavedGames, saveGame } from "@/games/storage";
import type { AnyGameTemplate, SettingValue } from "@/games/types";
import { SettingsPanel } from "./SettingsPanel";
import { Sidebar } from "./Sidebar";

const buttonClass =
  "rounded-md border border-white/10 px-3 py-1.5 text-sm text-zinc-200 transition hover:bg-white/5 disabled:opacity-50";

const fileName = (name: string) => `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "game"}.json`;

export default function Builder() {
  const [definition, setDefinition] = useState<GameDefinition>(() => createDefinition(templates[0]));
  const [saved, setSaved] = useState<GameDefinition[]>(loadSavedGames);
  const [notice, setNotice] = useState<string | null>(null);
  const [session] = useState(() => new GameSession());
  const importInput = useRef<HTMLInputElement>(null);

  const template = getTemplate(definition.templateId) ?? templates[0];
  const isSaved = saved.some((game) => game.id === definition.id && game.updatedAt === definition.updatedAt);

  function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(null), 2500);
  }

  /** Swap in a different game or new settings; the preview restarts from the ready screen. */
  function replace(next: GameDefinition) {
    setDefinition(next);
    session.reset();
  }

  function changeSetting(key: string, value: SettingValue) {
    replace({ ...definition, settings: { ...definition.settings, [key]: value }, updatedAt: Date.now() });
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(definition, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName(definition.name);
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const imported = sanitizeDefinition(JSON.parse(await file.text()));
      if (!imported) throw new Error("invalid");
      replace(imported);
      flash(`Imported “${imported.name}”`);
    } catch {
      flash("That file isn't a valid game.");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-zinc-100 lg:h-dvh">
      <header className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-2.5">
        <span className="font-semibold">Game Builder</span>
        <input
          value={definition.name}
          maxLength={60}
          onChange={(event) => setDefinition({ ...definition, name: event.target.value, updatedAt: Date.now() })}
          aria-label="Game name"
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-sky-400 sm:max-w-xs"
        />
        {notice && <span className="text-sm text-sky-300">{notice}</span>}
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            className={buttonClass}
            disabled={isSaved}
            onClick={() => setSaved(saveGame(definition))}
          >
            {isSaved ? "Saved" : "Save"}
          </button>
          <button type="button" className={buttonClass} onClick={exportJson}>
            Export
          </button>
          <button type="button" className={buttonClass} onClick={() => importInput.current?.click()}>
            Import
          </button>
          <input ref={importInput} type="file" accept="application/json,.json" hidden onChange={importJson} />
          <a
            href={`/play#${encodeDefinition(definition)}`}
            target="_blank"
            rel="noopener"
            className="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            Play ↗
          </a>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
        <aside className="order-2 border-white/10 lg:order-none lg:overflow-y-auto lg:border-r">
          <Sidebar
            current={definition}
            saved={saved}
            onNew={(t: AnyGameTemplate) => replace(createDefinition(t))}
            onLoad={replace}
            onDelete={(id) => setSaved(deleteGame(id))}
          />
        </aside>
        <main className="order-1 h-[60vh] lg:order-none lg:h-auto">
          <GamePlayer definition={definition} session={session} />
        </main>
        <aside className="order-3 border-white/10 lg:order-none lg:overflow-y-auto lg:border-l">
          <SettingsPanel
            template={template}
            settings={definition.settings}
            onChange={changeSetting}
            onReset={() => replace({ ...definition, settings: { ...template.defaults }, updatedAt: Date.now() })}
          />
        </aside>
      </div>
    </div>
  );
}
