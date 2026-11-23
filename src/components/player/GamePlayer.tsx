"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { GAME_KEYS, InputState } from "@/engine/input";
import type { GameSession } from "@/engine/session";
import type { GameDefinition } from "@/games/definition";
import { getTemplate } from "@/games/registry";
import { GameCanvas } from "./GameCanvas";
import { Hud } from "./Hud";

interface GamePlayerProps {
  definition: GameDefinition;
  session: GameSession;
}

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/**
 * Runs any game definition: hosts the template's canvas game, routes keyboard input
 * to it, and renders the HUD. Used by both the builder preview and the standalone /play page.
 */
export function GamePlayer({ definition, session }: GamePlayerProps) {
  const template = getTemplate(definition.templateId);
  const [input] = useState(() => new InputState());
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (GAME_KEYS.has(event.code) || event.code === "Enter") event.preventDefault();
      if ((event.code === "Space" || event.code === "Enter") && !event.repeat && session.status !== "playing") {
        input.clear();
        session.play();
        return;
      }
      input.keyDown(event.code);
    };
    const onKeyUp = (event: KeyboardEvent) => input.keyUp(event.code);
    const onBlur = () => input.clear();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [input, session]);

  if (!template) {
    return <div className="grid h-full place-items-center text-zinc-400">Unknown game template.</div>;
  }

  return (
    <div
      ref={container}
      tabIndex={-1}
      // Pull focus off editor inputs so arrow keys reach the game instead of a slider.
      onPointerDown={() => container.current?.focus()}
      className="relative h-full w-full overflow-hidden bg-zinc-900 p-3 outline-none"
    >
      <GameCanvas
        template={template}
        settings={definition.settings}
        session={session}
        input={input}
        runId={snapshot.runId}
      />
      <Hud
        title={definition.name}
        controls={template.controls}
        snapshot={snapshot}
        onPlay={() => {
          input.clear();
          session.play();
          container.current?.focus();
        }}
      />
    </div>
  );
}
