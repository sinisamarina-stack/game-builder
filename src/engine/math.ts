export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const randRange = (min: number, max: number) => min + Math.random() * (max - min);

export const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

/** Positive modulo, for looping scrolling layers. */
export const wrap = (value: number, length: number) => ((value % length) + length) % length;

/** Frame-rate independent exponential smoothing toward `target`. */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

/** Axis-aligned box, positioned by its center. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const overlaps = (a: Box, b: Box) =>
  Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;
