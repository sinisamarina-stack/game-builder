import { platformer, type ImageMap } from "./assets";
import { drawTileRow, fillWithTile } from "./draw";

/** Kenney background themes and the terrain set that matches each. */
export const THEMES = {
  hills: { label: "Green hills", ground: "grass" },
  trees: { label: "Forest", ground: "grass" },
  desert: { label: "Desert", ground: "sand" },
  mushrooms: { label: "Mushroom land", ground: "dirt" },
} as const;

export type ThemeId = keyof typeof THEMES;

export const themeOptions = Object.entries(THEMES).map(([value, theme]) => ({ value, label: theme.label }));

const themeOf = (id: string) => THEMES[id as ThemeId] ?? THEMES.hills;

export const landscapeSprites = () => [
  platformer.background("background_solid_sky"),
  platformer.background("background_clouds"),
  ...Object.keys(THEMES).map((id) => platformer.background(`background_color_${id}`)),
  ...Object.values(THEMES).flatMap(({ ground }) => [
    platformer.tile(`terrain_${ground}_block_top`),
    platformer.tile(`terrain_${ground}_block_center`),
  ]),
];

/**
 * Layered parallax backdrop: sky → clouds → themed hills, stacked so the hills' bottom edge
 * sits at `bottom`. `scroll` is the distance travelled; far layers move slower.
 */
export function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  images: ImageMap,
  theme: string,
  scroll: number,
  bottom: number,
  size: number,
  width: number,
) {
  // Both tiles have a plain white band (top of the hills, bottom of the clouds); crop most of it.
  const hillsCrop = { from: 0.32, to: 1 };
  const cloudsCrop = { from: 0, to: 0.86 };
  const hillsTop = bottom - size * (hillsCrop.to - hillsCrop.from);
  const cloudsTop = hillsTop - size * (cloudsCrop.to - cloudsCrop.from);
  fillWithTile(ctx, images, platformer.background("background_solid_sky"), 0, cloudsTop - size * Math.ceil(cloudsTop / size), cloudsTop + 1, size, width);
  drawTileRow(ctx, images, platformer.background("background_clouds"), scroll * 0.08, cloudsTop, size, width, cloudsCrop);
  const id = theme in THEMES ? theme : "hills";
  drawTileRow(ctx, images, platformer.background(`background_color_${id}`), scroll * 0.3, hillsTop, size, width, hillsCrop);
}

/** Solid ground made of the theme's terrain tiles, from `top` to the bottom of the view. */
export function drawGround(
  ctx: CanvasRenderingContext2D,
  images: ImageMap,
  theme: string,
  scroll: number,
  top: number,
  height: number,
  width: number,
  tile = 64,
) {
  const { ground } = themeOf(theme);
  drawTileRow(ctx, images, platformer.tile(`terrain_${ground}_block_top`), scroll, top, tile, width);
  fillWithTile(ctx, images, platformer.tile(`terrain_${ground}_block_center`), scroll, top + tile, height, tile, width);
}
