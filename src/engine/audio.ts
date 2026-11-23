/** Kenney platformer sound effects in public/assets/platformer/sounds. */
export type SoundName = "coin" | "gem" | "hurt" | "jump" | "jump-high" | "bump" | "magic" | "disappear" | "select" | "throw";

const STORAGE_KEY = "game-builder:muted";
const sources = new Map<SoundName, HTMLAudioElement>();
let muted = readMuted();

function readMuted() {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function isMuted() {
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // ignore unavailable storage
  }
}

export function playSound(name: SoundName, volume = 0.5) {
  if (muted || typeof Audio === "undefined") return;
  let source = sources.get(name);
  if (!source) {
    source = new Audio(`/assets/platformer/sounds/sfx_${name}.ogg`);
    sources.set(name, source);
  }
  // Clone so rapid repeats (e.g. several coins) overlap instead of cutting each other off.
  const sound = source.cloneNode() as HTMLAudioElement;
  sound.volume = volume;
  sound.play().catch(() => {
    // Autoplay blocked or format unsupported — sound is optional.
  });
}
