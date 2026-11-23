import type { ImageMap } from "./assets";
import { wrap } from "./math";

export interface SpriteOptions {
  flipX?: boolean;
  rotation?: number;
  alpha?: number;
}

/** Draws a sprite centered on (x, y). Unknown keys are skipped silently. */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  images: ImageMap,
  key: string,
  x: number,
  y: number,
  w: number,
  h: number,
  { flipX = false, rotation = 0, alpha = 1 }: SpriteOptions = {},
) {
  const image = images.get(key);
  if (!image || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  if (rotation) ctx.rotate(rotation);
  if (flipX) ctx.scale(-1, 1);
  ctx.drawImage(image, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/**
 * Repeats a square tile horizontally across the view, scrolled by `offset`
 * (parallax: pass distance × layer factor). `top` is the tile row's top edge.
 * `crop` keeps only a vertical slice of the tile (fractions 0–1), e.g. to drop a plain band.
 */
export function drawTileRow(
  ctx: CanvasRenderingContext2D,
  images: ImageMap,
  key: string,
  offset: number,
  top: number,
  size: number,
  viewWidth: number,
  crop: { from: number; to: number } = { from: 0, to: 1 },
) {
  const image = images.get(key);
  if (!image) return;
  const sy = image.height * crop.from;
  const sh = image.height * (crop.to - crop.from);
  const height = size * (crop.to - crop.from);
  const start = -wrap(offset, size);
  // +1px overlap on both axes hides seams from fractional scaling.
  for (let x = start; x < viewWidth; x += size) {
    ctx.drawImage(image, 0, sy, image.width, sh, Math.floor(x), Math.floor(top), size + 1, height + 1);
  }
}

/** Fills a rectangle by tiling a sprite (for sky or ground bodies). */
export function fillWithTile(
  ctx: CanvasRenderingContext2D,
  images: ImageMap,
  key: string,
  offset: number,
  top: number,
  bottom: number,
  size: number,
  viewWidth: number,
) {
  for (let y = top; y < bottom; y += size) drawTileRow(ctx, images, key, offset, y, size, viewWidth);
}

/** Outlined game text (scores, "+5" popups). */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  { size = 28, color = "#ffffff", alpha = 1, align = "center" as CanvasTextAlign } = {},
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `800 ${size}px var(--font-geist-sans), system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = size / 5;
  ctx.strokeStyle = "rgba(30, 30, 50, 0.85)";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export interface Popup {
  text: string;
  x: number;
  y: number;
  life: number;
  color: string;
}

/** Floating "+1" style feedback; call `updatePopups` from update and `drawPopups` from draw. */
export function updatePopups(popups: Popup[], dt: number) {
  for (const popup of popups) {
    popup.life -= dt;
    popup.y -= 50 * dt;
  }
  return popups.filter((popup) => popup.life > 0);
}

export function drawPopups(ctx: CanvasRenderingContext2D, popups: Popup[]) {
  for (const popup of popups) {
    drawText(ctx, popup.text, popup.x, popup.y, { size: 26, color: popup.color, alpha: Math.min(1, popup.life * 2) });
  }
}
