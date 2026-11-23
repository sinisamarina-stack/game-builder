export type GameStatus = "ready" | "playing" | "over";

export interface SessionSnapshot {
  status: GameStatus;
  score: number;
  best: number;
  /** Incremented on every restart; scenes are keyed by it so they remount with fresh state. */
  runId: number;
}

/**
 * Bridge between the game loop (inside the canvas, mutating every frame)
 * and the React UI around it (HUD, overlays). Compatible with useSyncExternalStore.
 * Only emits when something visible changes, so the per-frame loop never forces React renders.
 */
export class GameSession {
  private snapshot: SessionSnapshot = { status: "ready", score: 0, best: 0, runId: 0 };
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  get status() {
    return this.snapshot.status;
  }

  /** Start from the ready screen, or restart after game over. */
  play() {
    const { status, runId } = this.snapshot;
    if (status === "ready") this.set({ status: "playing" });
    else if (status === "over") this.set({ status: "playing", score: 0, runId: runId + 1 });
  }

  setScore(score: number) {
    const value = Math.floor(score);
    if (this.snapshot.status === "playing" && value !== this.snapshot.score) this.set({ score: value });
  }

  end() {
    if (this.snapshot.status !== "playing") return;
    this.set({ status: "over", best: Math.max(this.snapshot.best, this.snapshot.score) });
  }

  /** Back to the ready screen with a fresh scene (used when the game's settings change). */
  reset() {
    this.set({ status: "ready", score: 0, runId: this.snapshot.runId + 1 });
  }

  private set(patch: Partial<SessionSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }
}
