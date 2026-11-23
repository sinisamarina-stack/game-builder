"use client";

import { useEffect, useRef, useState } from "react";
import { loadImages, type ImageMap } from "@/engine/assets";
import { playSound } from "@/engine/audio";
import type { InputState } from "@/engine/input";
import type { GameSession } from "@/engine/session";
import type { AnyGameTemplate, GameSettings } from "@/games/types";

interface GameCanvasProps {
  template: AnyGameTemplate;
  settings: GameSettings;
  session: GameSession;
  input: InputState;
  /** Changing it starts a fresh game instance (restart). */
  runId: number;
}

/**
 * Hosts a 2D game: preloads its sprites, scales the logical resolution to fit the container
 * (letterboxed, crisp on high-DPI screens) and drives update/draw with requestAnimationFrame.
 */
export function GameCanvas({ template, settings, session, input, runId }: GameCanvasProps) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState<{ templateId: string; images: ImageMap } | null>(null);
  const images = loaded?.templateId === template.id ? loaded.images : null;

  useEffect(() => {
    let cancelled = false;
    loadImages(template.sprites).then((result) => {
      if (!cancelled) setLoaded({ templateId: template.id, images: result });
    });
    return () => {
      cancelled = true;
    };
  }, [template]);

  useEffect(() => {
    const element = canvas.current;
    const box = container.current;
    const ctx = element?.getContext("2d");
    if (!images || !element || !box || !ctx) return;

    const { width, height } = template;
    const game = template.create(settings, { width, height, images, input, session, sound: playSound });

    const resize = () => {
      const scale = Math.min(box.clientWidth / width, box.clientHeight / height);
      const dpr = window.devicePixelRatio || 1;
      element.style.width = `${Math.floor(width * scale)}px`;
      element.style.height = `${Math.floor(height * scale)}px`;
      element.width = Math.floor(width * scale * dpr);
      element.height = Math.floor(height * scale * dpr);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(box);
    resize();

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (session.status === "playing") game.update(dt);
      ctx.setTransform(element.width / width, 0, 0, element.height / height, 0, 0);
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, width, height);
      game.draw(ctx, now / 1000);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [images, template, settings, session, input, runId]);

  return (
    <div ref={container} className="grid h-full w-full place-items-center overflow-hidden">
      <canvas ref={canvas} className="rounded-sm shadow-2xl shadow-black/50" />
      {!images && <p className="absolute text-sm text-zinc-400">Loading sprites…</p>}
    </div>
  );
}
