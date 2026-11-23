import { allCharacterSprites, characterOptions } from "@/engine/assets";
import { landscapeSprites, themeOptions } from "@/engine/landscape";
import { defineTemplate } from "../types";
import { createRunner, RUNNER_HEIGHT, RUNNER_WIDTH, runnerSprites } from "./game";

export type RunnerSettings = {
  character: string;
  theme: string;
  startSpeed: number;
  acceleration: number;
  maxSpeed: number;
  jumpPower: number;
  gravity: number;
  doubleJump: boolean;
  obstacleGap: number;
  flyingChance: number;
  coinChance: number;
};

export const runner = defineTemplate<RunnerSettings>({
  id: "runner",
  name: "Runner",
  description: "Side-scrolling endless runner. Jump over enemies, grab coins.",
  controls: "Space / ↑ / W jump (twice for a double jump)",
  accent: "#2ecc71",
  width: RUNNER_WIDTH,
  height: RUNNER_HEIGHT,
  sprites: [...allCharacterSprites(), ...landscapeSprites(), ...runnerSprites],
  defaults: {
    character: "beige",
    theme: "hills",
    startSpeed: 330,
    acceleration: 6,
    maxSpeed: 800,
    jumpPower: 900,
    gravity: 2600,
    doubleJump: true,
    obstacleGap: 560,
    flyingChance: 0.25,
    coinChance: 0.6,
  },
  params: [
    { key: "character", label: "Character", group: "Look", type: "select", options: characterOptions },
    { key: "theme", label: "Background", group: "Look", type: "select", options: themeOptions },
    { key: "startSpeed", label: "Start speed", group: "Gameplay", type: "number", min: 150, max: 700, step: 10 },
    { key: "acceleration", label: "Speed-up per second", group: "Gameplay", type: "number", min: 0, max: 40, step: 1 },
    { key: "maxSpeed", label: "Max speed", group: "Gameplay", type: "number", min: 300, max: 1400, step: 10 },
    { key: "jumpPower", label: "Jump power", group: "Gameplay", type: "number", min: 500, max: 1400, step: 10 },
    { key: "gravity", label: "Gravity", group: "Gameplay", type: "number", min: 1000, max: 5000, step: 50 },
    { key: "doubleJump", label: "Double jump", group: "Gameplay", type: "boolean" },
    { key: "obstacleGap", label: "Obstacle spacing", group: "Gameplay", type: "number", min: 250, max: 1400, step: 10 },
    { key: "flyingChance", label: "Flying enemy chance", group: "Gameplay", type: "number", min: 0, max: 1, step: 0.05 },
    { key: "coinChance", label: "Coin chance", group: "Gameplay", type: "number", min: 0, max: 1, step: 0.05 },
  ],
  create: createRunner,
});
