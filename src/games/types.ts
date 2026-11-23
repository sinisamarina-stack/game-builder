import type { ImageMap } from "@/engine/assets";
import type { SoundName } from "@/engine/audio";
import type { InputState } from "@/engine/input";
import type { GameSession } from "@/engine/session";

export type SettingValue = number | string | boolean;
/** Settings are flat and JSON-serializable so games can be saved, exported and shared by URL. */
export type GameSettings = Record<string, SettingValue>;

export type ParamGroup = "Gameplay" | "Look";

interface ParamBase<K extends string> {
  key: K;
  label: string;
  group: ParamGroup;
}
export interface NumberParam<K extends string = string> extends ParamBase<K> {
  type: "number";
  min: number;
  max: number;
  step: number;
}
export interface ColorParam<K extends string = string> extends ParamBase<K> {
  type: "color";
}
export interface BooleanParam<K extends string = string> extends ParamBase<K> {
  type: "boolean";
}
/** A choice between fixed values, e.g. which character sprite or background theme to use. */
export interface SelectParam<K extends string = string> extends ParamBase<K> {
  type: "select";
  options: readonly { value: string; label: string }[];
}

export type AnyParamDef = NumberParam | ColorParam | BooleanParam | SelectParam;

/** Editor field description for one setting; the param type is inferred from the setting's value type. */
export type ParamDef<S extends GameSettings> = {
  [K in keyof S & string]: S[K] extends number
    ? NumberParam<K>
    : S[K] extends boolean
      ? BooleanParam<K>
      : ColorParam<K> | SelectParam<K>;
}[keyof S & string];

/** Everything a running game gets from the player. */
export interface GameContext {
  /** Logical canvas size; the player scales it to fit and letterboxes. */
  width: number;
  height: number;
  images: ImageMap;
  input: InputState;
  session: GameSession;
  sound: (name: SoundName, volume?: number) => void;
}

/** One run of a game. Created fresh for every run, so it can keep its state in plain fields. */
export interface GameInstance {
  /** Advance the simulation; only called while the session is playing. */
  update(dt: number): void;
  /** Render the current state; called every frame (also on the ready and game-over screens). */
  draw(ctx: CanvasRenderingContext2D, time: number): void;
}

export interface GameTemplate<S extends GameSettings> {
  id: string;
  name: string;
  description: string;
  controls: string;
  accent: string;
  width: number;
  height: number;
  /** Sprite keys to preload (see engine/assets). */
  sprites: readonly string[];
  defaults: S;
  params: ParamDef<S>[];
  create(settings: S, context: GameContext): GameInstance;
}

export interface AnyGameTemplate extends Omit<GameTemplate<GameSettings>, "params" | "create"> {
  params: AnyParamDef[];
  create(settings: GameSettings, context: GameContext): GameInstance;
}

/** Type-checks a template against its own settings, then erases it for the registry. */
export function defineTemplate<S extends GameSettings>(template: GameTemplate<S>): AnyGameTemplate {
  return template as unknown as AnyGameTemplate;
}
