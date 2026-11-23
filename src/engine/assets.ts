/**
 * Sprite loading. An asset key is a path under /public/assets without the extension,
 * e.g. "platformer/tiles/coin_gold" → /assets/platformer/tiles/coin_gold.png.
 * Assets are Kenney packs (CC0) — see public/assets/<pack>/License.txt.
 */
export type ImageMap = ReadonlyMap<string, HTMLImageElement>;

const cache = new Map<string, Promise<HTMLImageElement>>();

function loadImage(key: string) {
  let promise = cache.get(key);
  if (!promise) {
    promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Missing sprite: ${key}`));
      image.src = `/assets/${key}.png`;
    });
    cache.set(key, promise);
  }
  return promise;
}

/** Loads every key; a missing file is logged and skipped so one bad path doesn't break the game. */
export async function loadImages(keys: readonly string[]): Promise<ImageMap> {
  const entries = await Promise.all(
    [...new Set(keys)].map((key) =>
      loadImage(key).then(
        (image) => [key, image] as const,
        (error: Error) => {
          console.warn(error.message);
          return null;
        },
      ),
    ),
  );
  return new Map(entries.filter((entry) => entry !== null));
}

/** Shorthands for the two bundled packs. */
export const platformer = {
  character: (color: string, pose: string) => `platformer/characters/character_${color}_${pose}`,
  tile: (name: string) => `platformer/tiles/${name}`,
  enemy: (name: string) => `platformer/enemies/${name}`,
  background: (name: string) => `platformer/backgrounds/${name}`,
};
export const fish = (name: string) => `fish/${name}`;

export const CHARACTER_COLORS = ["beige", "green", "pink", "purple", "yellow"] as const;
export const CHARACTER_POSES = ["idle", "walk_a", "walk_b", "jump", "hit", "front", "duck"] as const;

export const characterOptions = CHARACTER_COLORS.map((color) => ({
  value: color,
  label: color[0].toUpperCase() + color.slice(1),
}));

export const allCharacterSprites = () =>
  CHARACTER_COLORS.flatMap((color) => CHARACTER_POSES.map((pose) => platformer.character(color, pose)));
