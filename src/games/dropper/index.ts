import { allCharacterSprites, characterOptions, platformer } from "@/engine/assets";
import { landscapeSprites, themeOptions } from "@/engine/landscape";
import { defineTemplate } from "../types";
import { createDropper, DROPPER_HEIGHT, DROPPER_WIDTH, dropperSprites } from "./game";

export type DropperSettings = {
  character: string;
  theme: string;
  playerSpeed: number;
  fallSpeed: number;
  acceleration: number;
  spawnInterval: number;
  badChance: number;
  gemChance: number;
  heartChance: number;
  lives: number;
};

export const dropper = defineTemplate<DropperSettings>({
  id: "dropper",
  name: "Dropper",
  description: "Things fall from the sky. Catch coins and gems, dodge bombs and saws.",
  controls: "← → / A D move",
  accent: "#f4b400",
  width: DROPPER_WIDTH,
  height: DROPPER_HEIGHT,
  sprites: [...allCharacterSprites(), ...landscapeSprites(), ...dropperSprites, platformer.tile("hud_heart")],
  defaults: {
    character: "green",
    theme: "hills",
    playerSpeed: 520,
    fallSpeed: 240,
    acceleration: 5,
    spawnInterval: 0.8,
    badChance: 0.3,
    gemChance: 0.15,
    heartChance: 0.03,
    lives: 3,
  },
  params: [
    { key: "character", label: "Character", group: "Look", type: "select", options: characterOptions },
    { key: "theme", label: "Background", group: "Look", type: "select", options: themeOptions },
    { key: "playerSpeed", label: "Player speed", group: "Gameplay", type: "number", min: 200, max: 1000, step: 10 },
    { key: "fallSpeed", label: "Fall speed", group: "Gameplay", type: "number", min: 80, max: 700, step: 10 },
    { key: "acceleration", label: "Speed-up over time", group: "Gameplay", type: "number", min: 0, max: 30, step: 1 },
    { key: "spawnInterval", label: "Seconds between drops", group: "Gameplay", type: "number", min: 0.2, max: 2.5, step: 0.05 },
    { key: "badChance", label: "Bomb / saw chance", group: "Gameplay", type: "number", min: 0, max: 0.9, step: 0.05 },
    { key: "gemChance", label: "Gem chance", group: "Gameplay", type: "number", min: 0, max: 0.6, step: 0.05 },
    { key: "heartChance", label: "Extra-life chance", group: "Gameplay", type: "number", min: 0, max: 0.2, step: 0.01 },
    { key: "lives", label: "Lives", group: "Gameplay", type: "number", min: 1, max: 9, step: 1 },
  ],
  create: createDropper,
});
