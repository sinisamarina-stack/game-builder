export const Keys = {
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  up: ["ArrowUp", "KeyW"],
  down: ["ArrowDown", "KeyS"],
  action: ["Space"],
} as const;

export const GAME_KEYS: ReadonlySet<string> = new Set(Object.values(Keys).flat());

type Codes = readonly string[];

/**
 * Keyboard state polled by scenes from inside useFrame.
 * `isDown` is for held keys (steering), `consumePress` for one-shot actions (jump, lane switch).
 */
export class InputState {
  private down = new Set<string>();
  private pressed = new Set<string>();

  keyDown(code: string) {
    if (!this.down.has(code)) this.pressed.add(code);
    this.down.add(code);
  }

  keyUp(code: string) {
    this.down.delete(code);
  }

  clear() {
    this.down.clear();
    this.pressed.clear();
  }

  isDown(codes: Codes) {
    return codes.some((code) => this.down.has(code));
  }

  /** True once per key press; the press stays buffered until a scene consumes it. */
  consumePress(codes: Codes) {
    let hit = false;
    for (const code of codes) if (this.pressed.delete(code)) hit = true;
    return hit;
  }

  /** -1, 0 or 1 depending on which side is held. */
  axis(negative: Codes, positive: Codes) {
    return (this.isDown(positive) ? 1 : 0) - (this.isDown(negative) ? 1 : 0);
  }
}
