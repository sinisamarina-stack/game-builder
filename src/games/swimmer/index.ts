import { defineTemplate } from "../types";
import { createSwimmer, SWIMMER_HEIGHT, SWIMMER_WIDTH, swimmerSprites } from "./game";

export type SwimmerSettings = {
  fish: string;
  waterColor: string;
  swimPower: number;
  drag: number;
  sinkRate: number;
  startSpeed: number;
  acceleration: number;
  maxSpeed: number;
  enemyGap: number;
  gemChance: number;
  gemValue: number;
};

export const swimmer = defineTemplate<SwimmerSettings>({
  id: "swimmer",
  name: "Swimmer",
  description: "Swim through the reef with floaty water physics. Dodge fish, grab gems.",
  controls: "↑ / Space swim up · ↓ dive · ← → move",
  accent: "#00b4d8",
  width: SWIMMER_WIDTH,
  height: SWIMMER_HEIGHT,
  sprites: swimmerSprites,
  defaults: {
    fish: "yellow",
    waterColor: "#2f9fd8",
    swimPower: 1500,
    drag: 2.4,
    sinkRate: 350,
    startSpeed: 240,
    acceleration: 5,
    maxSpeed: 560,
    enemyGap: 300,
    gemChance: 0.5,
    gemValue: 25,
  },
  params: [
    {
      key: "fish",
      label: "Player fish",
      group: "Look",
      type: "select",
      options: [
        { value: "yellow", label: "Yellow" },
        { value: "blue", label: "Blue" },
      ],
    },
    { key: "waterColor", label: "Water", group: "Look", type: "color" },
    { key: "swimPower", label: "Swim power", group: "Gameplay", type: "number", min: 400, max: 3000, step: 50 },
    { key: "drag", label: "Water drag", group: "Gameplay", type: "number", min: 0.3, max: 8, step: 0.1 },
    { key: "sinkRate", label: "Sink rate", group: "Gameplay", type: "number", min: 0, max: 1200, step: 10 },
    { key: "startSpeed", label: "Start speed", group: "Gameplay", type: "number", min: 80, max: 600, step: 10 },
    { key: "acceleration", label: "Speed-up per second", group: "Gameplay", type: "number", min: 0, max: 30, step: 1 },
    { key: "maxSpeed", label: "Max speed", group: "Gameplay", type: "number", min: 200, max: 1200, step: 10 },
    { key: "enemyGap", label: "Enemy spacing", group: "Gameplay", type: "number", min: 120, max: 1000, step: 10 },
    { key: "gemChance", label: "Gem chance", group: "Gameplay", type: "number", min: 0, max: 1, step: 0.05 },
    { key: "gemValue", label: "Gem value", group: "Gameplay", type: "number", min: 0, max: 200, step: 5 },
  ],
  create: createSwimmer,
});
