"use client";

import Link from "next/link";
import { useState } from "react";
import { GameSession } from "@/engine/session";
import { decodeDefinition } from "@/games/definition";
import { GamePlayer } from "./GamePlayer";

/** Standalone player for a game shared as `/play#<code>`. Client-only (reads the URL hash). */
export default function PlayView() {
  const [definition] = useState(() => decodeDefinition(window.location.hash.slice(1)));
  const [session] = useState(() => new GameSession());

  if (!definition) {
    return (
      <div className="grid h-dvh place-items-center bg-zinc-950 p-4 text-center text-zinc-300">
        <div>
          <p>This link doesn&apos;t contain a valid game.</p>
          <Link href="/" className="mt-3 inline-block text-sky-400 hover:underline">
            Open the builder
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-sm">
        <span className="font-semibold">{definition.name}</span>
        <Link href="/" className="text-zinc-400 hover:text-white">
          Game Builder
        </Link>
      </header>
      <div className="min-h-0 flex-1">
        <GamePlayer definition={definition} session={session} />
      </div>
    </div>
  );
}
