import { fish, platformer } from "@/engine/assets";
import { drawPopups, drawSprite, drawTileRow, fillWithTile, updatePopups, type Popup } from "@/engine/draw";
import { Keys } from "@/engine/input";
import { clamp, pick, randRange, wrap } from "@/engine/math";
import type { GameContext, GameInstance } from "../types";
import type { SwimmerSettings } from "./index";

export const SWIMMER_WIDTH = 960;
export const SWIMMER_HEIGHT = 540;
const FLOOR_TOP = SWIMMER_HEIGHT - 72;
const SAND_TILE = 64;
const PLAYER_X_MIN = 70;
const PLAYER_X_MAX = SWIMMER_WIDTH * 0.55;
const PLAYER_RADIUS = 26;
const ENEMY_RADIUS = 28;
const GEM_RADIUS = 22;
const RISE_KEYS = [...Keys.up, ...Keys.action];

const FISH_COLORS = ["yellow", "blue"] as const;
const swimFrames = (color: string) => [platformer.enemy(`fish_${color}_swim_a`), platformer.enemy(`fish_${color}_swim_b`)];
const GEMS = ["gem_blue", "gem_green", "gem_red", "gem_yellow"].map(platformer.tile);
const BACK_PLANTS = ["a", "b", "c", "d", "e", "f", "g", "h"].map((l) => fish(`background_seaweed_${l}`));
const BACK_ROCKS = [fish("background_rock_a"), fish("background_rock_b")];
const FRONT_PLANTS = [
  ...["a", "b", "c", "d"].map((l) => fish(`seaweed_green_${l}`)),
  ...["a", "b", "c", "d"].map((l) => fish(`seaweed_pink_${l}`)),
  fish("seaweed_orange_a"),
  fish("seaweed_orange_b"),
  fish("rock_a"),
  fish("rock_b"),
];
const BUBBLES = [fish("bubble_a"), fish("bubble_b"), fish("bubble_c")];
const SAND_TOP = ["a", "b", "c", "d"].map((l) => fish(`terrain_sand_top_${l}`));
const SAND = fish("terrain_sand_a");

export const swimmerSprites = [
  ...FISH_COLORS.flatMap(swimFrames),
  ...FISH_COLORS.map((c) => platformer.enemy(`fish_${c}_rest`)),
  platformer.enemy("fish_purple_up"),
  platformer.enemy("fish_purple_down"),
  ...GEMS,
  ...BACK_PLANTS,
  ...BACK_ROCKS,
  ...FRONT_PLANTS,
  ...BUBBLES,
  ...SAND_TOP,
  SAND,
];

interface Enemy {
  kind: "swimmer" | "bobber";
  x: number;
  baseY: number;
  y: number;
  vy: number;
  speed: number;
  phase: number;
}
interface Gem {
  x: number;
  y: number;
  sprite: string;
}
interface Bubble {
  x: number;
  y: number;
  size: number;
  rise: number;
  sprite: string;
}
interface Prop {
  sprite: string;
  x: number;
  size: number;
}

const DECOR_LENGTH = 1600;

export function createSwimmer(s: SwimmerSettings, { width, height, images, input, session, sound }: GameContext): GameInstance {
  const enemyColor = s.fish === "yellow" ? "blue" : "yellow";
  const player = { x: 200, y: height / 2, vx: 0, vy: 0 };
  let speed = s.startSpeed;
  let distance = 0;
  let bonus = 0;
  let untilEnemy = 400;
  let bubbleTimer = 0;
  let enemies: Enemy[] = [];
  let gems: Gem[] = [];
  let popups: Popup[] = [];
  let bubbles: Bubble[] = [];
  // Two looping parallax strips of reef decoration.
  const backProps: Prop[] = Array.from({ length: 14 }, (_, i) => ({
    sprite: Math.random() < 0.25 ? pick(BACK_ROCKS) : pick(BACK_PLANTS),
    x: i * (DECOR_LENGTH / 14) + randRange(-30, 30),
    size: randRange(90, 150),
  }));
  const frontProps: Prop[] = Array.from({ length: 12 }, (_, i) => ({
    sprite: pick(FRONT_PLANTS),
    x: i * (DECOR_LENGTH / 12) + randRange(-40, 40),
    size: randRange(70, 110),
  }));

  function spawnEnemy() {
    const bobber = Math.random() < 0.35;
    const y = randRange(70, FLOOR_TOP - 60);
    enemies.push({
      kind: bobber ? "bobber" : "swimmer",
      x: width + 60,
      baseY: y,
      y,
      vy: 0,
      speed: bobber ? randRange(20, 60) : randRange(60, 160),
      phase: randRange(0, Math.PI * 2),
    });
    if (Math.random() < s.gemChance) {
      gems.push({ x: width + 60 + s.enemyGap / 2, y: randRange(70, FLOOR_TOP - 50), sprite: pick(GEMS) });
    }
  }

  return {
    update(dt) {
      // Floaty water physics: thrust, constant sink, exponential drag.
      player.vx += input.axis(Keys.left, Keys.right) * s.swimPower * dt;
      player.vy += (-input.axis(Keys.down, RISE_KEYS) * s.swimPower + s.sinkRate) * dt;
      const damping = Math.exp(-s.drag * dt);
      player.vx *= damping;
      player.vy *= damping;
      player.x += player.vx * dt;
      player.y += player.vy * dt;
      if (player.x < PLAYER_X_MIN || player.x > PLAYER_X_MAX) {
        player.x = clamp(player.x, PLAYER_X_MIN, PLAYER_X_MAX);
        player.vx = 0;
      }
      if (player.y < 40 || player.y > FLOOR_TOP - PLAYER_RADIUS) {
        player.y = clamp(player.y, 40, FLOOR_TOP - PLAYER_RADIUS);
        player.vy = 0;
      }

      speed = Math.min(s.maxSpeed, speed + s.acceleration * dt);
      const dx = speed * dt;
      distance += dx;
      untilEnemy -= dx;
      if (untilEnemy <= 0) {
        spawnEnemy();
        untilEnemy = s.enemyGap * randRange(0.7, 1.3);
      }

      enemies = enemies.filter((e) => {
        e.x -= dx + e.speed * dt;
        const previous = e.y;
        e.y = e.kind === "bobber" ? e.baseY + Math.sin(distance / 90 + e.phase) * 90 : e.baseY + Math.sin(distance / 60 + e.phase) * 12;
        e.y = clamp(e.y, 50, FLOOR_TOP - 40);
        e.vy = e.y - previous;
        if (Math.hypot(e.x - player.x, e.y - player.y) < ENEMY_RADIUS + PLAYER_RADIUS - 6) {
          sound("hurt");
          session.end();
        }
        return e.x > -80;
      });
      gems = gems.filter((gem) => {
        gem.x -= dx;
        if (Math.hypot(gem.x - player.x, gem.y - player.y) < GEM_RADIUS + PLAYER_RADIUS) {
          bonus += s.gemValue;
          sound("gem", 0.4);
          popups.push({ text: `+${s.gemValue}`, x: gem.x, y: gem.y - 20, life: 0.8, color: "#7dd3fc" });
          return false;
        }
        return gem.x > -40;
      });

      // Trail of bubbles from the player plus ambient ones from the reef.
      bubbleTimer -= dt;
      if (bubbleTimer <= 0) {
        bubbleTimer = 0.25;
        bubbles.push({ x: player.x + 30, y: player.y - 6, size: randRange(10, 18), rise: randRange(60, 110), sprite: pick(BUBBLES) });
        if (Math.random() < 0.5) {
          bubbles.push({ x: randRange(0, width), y: FLOOR_TOP, size: randRange(12, 26), rise: randRange(40, 90), sprite: pick(BUBBLES) });
        }
      }
      bubbles = bubbles.filter((b) => {
        b.y -= b.rise * dt;
        b.x -= dx * 0.6;
        return b.y > -20 && b.x > -20;
      });

      popups = updatePopups(popups, dt);
      session.setScore(distance / 50 + bonus);
    },

    draw(ctx, time) {
      // Water: lighter near the surface, deeper below.
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, s.waterColor);
      gradient.addColorStop(1, "#0b2e4f");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 5; i++) {
        const x = wrap(i * 230 - distance * 0.05, width + 200) - 100;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 70, 0);
        ctx.lineTo(x + 180, height);
        ctx.lineTo(x + 60, height);
        ctx.fill();
      }
      ctx.restore();

      for (const prop of backProps) {
        const x = wrap(prop.x - distance * 0.4, DECOR_LENGTH) - 100;
        drawSprite(ctx, images, prop.sprite, x, FLOOR_TOP - prop.size / 2 + 10, prop.size, prop.size, { alpha: 0.7 });
      }
      for (const prop of frontProps) {
        const x = wrap(prop.x - distance, DECOR_LENGTH) - 100;
        drawSprite(ctx, images, prop.sprite, x, FLOOR_TOP - prop.size / 2 + 6, prop.size, prop.size);
      }
      drawTileRow(ctx, images, SAND_TOP[0], distance, FLOOR_TOP, SAND_TILE, width);
      fillWithTile(ctx, images, SAND, distance, FLOOR_TOP + SAND_TILE, height, SAND_TILE, width);

      for (const b of bubbles) drawSprite(ctx, images, b.sprite, b.x, b.y, b.size, b.size, { alpha: 0.8 });
      for (const gem of gems) {
        drawSprite(ctx, images, gem.sprite, gem.x, gem.y + Math.sin(time * 3 + gem.x / 50) * 6, 48, 48);
      }
      for (const e of enemies) {
        const sprite =
          e.kind === "bobber"
            ? platformer.enemy(e.vy < 0 ? "fish_purple_up" : "fish_purple_down")
            : swimFrames(enemyColor)[Math.floor(time * 8 + e.phase) % 2];
        drawSprite(ctx, images, sprite, e.x, e.y, 76, 76);
      }

      const over = session.status === "over";
      const sprite = over ? platformer.enemy(`fish_${s.fish}_rest`) : swimFrames(s.fish)[Math.floor(time * 10) % 2];
      // Sprites face left; flip so the player swims right, tilt with vertical speed, belly-up when caught.
      drawSprite(ctx, images, sprite, player.x, player.y, 84, 84, {
        flipX: true,
        rotation: over ? Math.PI : clamp(player.vy / 900, -0.45, 0.45),
      });

      drawPopups(ctx, popups);
    },
  };
}
