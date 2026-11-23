import { useState } from "react";
import { isMuted, setMuted } from "@/engine/audio";
import type { SessionSnapshot } from "@/engine/session";

interface HudProps {
  title: string;
  controls: string;
  snapshot: SessionSnapshot;
  onPlay: () => void;
}

export function Hud({ title, controls, snapshot, onPlay }: HudProps) {
  const { status, score, best } = snapshot;
  const [muted, setMutedState] = useState(isMuted);

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      <div className="flex items-start justify-between gap-2 p-5 text-sm font-semibold text-white">
        <span className="rounded-md bg-black/50 px-3 py-1.5 tabular-nums">Score {score}</span>
        <span className="flex gap-2">
          {best > 0 && <span className="rounded-md bg-black/50 px-3 py-1.5 tabular-nums">Best {best}</span>}
          <button
            type="button"
            onClick={() => {
              setMuted(!muted);
              setMutedState(!muted);
            }}
            aria-label={muted ? "Unmute sound" : "Mute sound"}
            className="pointer-events-auto rounded-md bg-black/50 px-2.5 py-1.5 hover:bg-black/70"
          >
            {muted ? "🔇" : "🔊"}
          </button>
        </span>
      </div>

      {/* Ready: compact card at the bottom so the scene stays visible while editing. */}
      {status === "ready" && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center p-4">
          <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-xl bg-black/60 px-5 py-3 text-white backdrop-blur-md">
            <div className="min-w-0">
              <h2 className="truncate font-bold">{title}</h2>
              <p className="text-xs text-zinc-300">{controls}</p>
            </div>
            <button
              type="button"
              onClick={onPlay}
              className="rounded-lg bg-white px-4 py-1.5 font-semibold text-zinc-900 transition hover:bg-zinc-200"
            >
              Start <span className="font-normal text-zinc-500">· Space</span>
            </button>
          </div>
        </div>
      )}

      {status === "over" && (
        <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/45 p-4 backdrop-blur-[2px]">
          <div className="max-w-sm text-center text-white">
            <h2 className="text-2xl font-bold">Game over</h2>
            <p className="mt-2 text-sm text-zinc-300">
              Score {score} · Best {best}
            </p>
            <button
              type="button"
              onClick={onPlay}
              className="mt-5 rounded-lg bg-white px-5 py-2 font-semibold text-zinc-900 transition hover:bg-zinc-200"
            >
              Play again
            </button>
            <p className="mt-2 text-xs text-zinc-400">or press Space</p>
          </div>
        </div>
      )}
    </div>
  );
}
