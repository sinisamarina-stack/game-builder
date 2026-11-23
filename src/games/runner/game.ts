import { platformer } from "@/engine/assets";
import { drawPopups, drawSprite, updatePopups, type Popup } from "@/engine/draw";
import { Keys } from "@/engine/input";
import { drawBackdrop, drawGround } from "@/engine/landscape";
import { overlaps, pick, randRange, type Box } from "@/engine/math";
import type { GameContext, GameInstance } from "../types";
import type { RunnerSettings } from "./index";

export const RUNNER_WIDTH = 960;
export const RUNNER_HEIGHT = 540;
const GROUND_TOP = RUNNER_HEIGHT - 96;
const PLAYER_X = 200;
const PLAYER_SIZE = 120;
const PLAYER_BOX = { w: 54, h: 76 };
const COIN_VALUE = 10;
const JUMP_KEYS = [...Keys.action, ...Keys.up];

interface EnemyType {
  frames: string[];
  size: number;
  box: { w: number; h: number };
  /** Extra leftward speed on top of the scrolling world (walkers move toward you). */
  speed: number;
  /** Height of the hitbox center above the ground. */
  lift: number;
  spin?: boolean;
  flying?: boolean;
}

const enemy = (...names: string[]) => names.map(platformer.enemy);

const GROUND_ENEMIES: EnemyType[] = [
  { frames: enemy("slime_normal_walk_a", "slime_normal_walk_b"), size: 72, box: { w: 54, h: 38 }, speed: 60, lift: 19 },
  { frames: enemy("slime_spike_walk_a", "slime_spike_walk_b"), size: 72, box: { w: 54, h: 46 }, speed: 40, lift: 23 },
  { frames: enemy("snail_walk_a", "snail_walk_b"), size: 72, box: { w: 56, h: 42 }, speed: 20, lift: 21 },
  { frames: enemy("saw_a", "saw_b"), size: 84, box: { w: 60, h: 60 }, speed: 0, lift: 30, spin: true },
  { frames: [platformer.tile("spikes")], size: 64, box: { w: 50, h: 26 }, speed: 0, lift: 13 },
];
const BEE: EnemyType = { frames: enemy("bee_a", "bee_b"), size: 64, box: { w: 44, h: 36 }, speed: 80, lift: 0, flying: true };

const COIN_FRAMES = [platformer.tile("coin_gold"), platformer.tile("coin_gold_side")];

const DECOR: Record<string, string[]> = {
  hills: ["bush", "grass", "fence", "bush"],
  trees: ["bush", "grass", "mushroom_brown", "sign"],
  desert: ["cactus", "rock", "cactus"],
  mushrooms: ["mushroom_red", "mushroom_brown", "grass_purple"],
};

export const runnerSprites = [
  ...GROUND_ENEMIES.flatMap((e) => e.frames),
  ...BEE.frames,
  ...COIN_FRAMES,
  ...Object.values(DECOR).flat().map(platformer.tile),
];

interface Enemy {
  type: EnemyType;
  x: number;
  phase: number;
}
interface Coin {
  x: number;
  y: number;
}
interface Decoration {
  sprite: string;
  x: number;
}

export function createRunner(s: RunnerSettings, { width, images, input, session, sound }: GameContext): GameInstance {
  const player = { feet: GROUND_TOP, vy: 0, airJumps: 0 };
  let speed = s.startSpeed;
  let distance = 0;
  let coins = 0;
  let untilSpawn = 500;
  let untilDecor = 0;
  let time = 0;
  let enemies: Enemy[] = [];
  let coinList: Coin[] = [];
  let popups: Popup[] = [];
  // Pre-fill the ground with props so the first frame isn't empty.
  let decorations: Decoration[] = Array.from({ length: 6 }, (_, i) => ({
    sprite: pick(DECOR[s.theme] ?? DECOR.hills),
    x: 120 + i * 170 + randRange(-40, 40),
  }));

  const onGround = () => player.feet >= GROUND_TOP;
  const playerBox = (): Box => ({ x: PLAYER_X, y: player.feet - PLAYER_BOX.h / 2, ...PLAYER_BOX });

  const enemyY = (e: Enemy) =>
    e.type.flying
      ? GROUND_TOP - 70 - (Math.sin(time * 3 + e.phase) * 0.5 + 0.5) * 110 // bobs between knee and jump height
      : GROUND_TOP - e.type.lift;

  function spawn() {
    const flying = Math.random() < s.flyingChance;
    const type = flying ? BEE : pick(GROUND_ENEMIES);
    const x = width + 80;
    enemies.push({ type, x, phase: randRange(0, Math.PI * 2) });
    if (Math.random() < s.coinChance) {
      // An arc of coins that rewards jumping over ground enemies; a low line under flyers.
      for (let i = -2; i <= 2; i++) {
        const t = i / 2;
        coinList.push(
          flying
            ? { x: x + i * 48, y: GROUND_TOP - 40 }
            : { x: x + i * 48, y: GROUND_TOP - 120 - (1 - t * t) * 80 },
        );
      }
    }
  }

  return {
    update(dt) {
      time += dt;
      speed = Math.min(s.maxSpeed, speed + s.acceleration * dt);
      const dx = speed * dt;
      distance += dx;

      if (input.consumePress(JUMP_KEYS)) {
        if (onGround()) {
          player.vy = -s.jumpPower;
          player.airJumps = s.doubleJump ? 1 : 0;
          sound("jump", 0.35);
        } else if (player.airJumps > 0) {
          player.vy = -s.jumpPower * 0.85;
          player.airJumps -= 1;
          sound("jump-high", 0.35);
        }
      }
      player.vy += s.gravity * dt;
      player.feet += player.vy * dt;
      if (player.feet >= GROUND_TOP) {
        player.feet = GROUND_TOP;
        player.vy = 0;
      }

      untilSpawn -= dx;
      if (untilSpawn <= 0) {
        spawn();
        untilSpawn = s.obstacleGap * randRange(0.8, 1.5) * Math.sqrt(speed / s.startSpeed);
      }
      untilDecor -= dx;
      if (untilDecor <= 0) {
        decorations.push({ sprite: pick(DECOR[s.theme] ?? DECOR.hills), x: width + 64 });
        untilDecor = randRange(140, 420);
      }

      const box = playerBox();
      enemies = enemies.filter((e) => {
        e.x -= dx + e.type.speed * dt;
        if (overlaps(box, { x: e.x, y: enemyY(e), ...e.type.box })) {
          sound("hurt");
          session.end();
        }
        return e.x > -100;
      });
      coinList = coinList.filter((coin) => {
        coin.x -= dx;
        if (overlaps(box, { x: coin.x, y: coin.y, w: 36, h: 36 })) {
          coins += 1;
          sound("coin", 0.35);
          popups.push({ text: `+${COIN_VALUE}`, x: coin.x, y: coin.y - 20, life: 0.7, color: "#ffd84d" });
          return false;
        }
        return coin.x > -50;
      });
      decorations = decorations.filter((d) => (d.x -= dx) > -80);
      popups = updatePopups(popups, dt);

      session.setScore(distance / 50 + coins * COIN_VALUE);
    },

    draw(ctx, now) {
      drawBackdrop(ctx, images, s.theme, distance, GROUND_TOP + 50, 256, width);
      for (const d of decorations) drawSprite(ctx, images, platformer.tile(d.sprite), d.x, GROUND_TOP - 32, 64, 64);
      drawGround(ctx, images, s.theme, distance, GROUND_TOP, RUNNER_HEIGHT, width);

      for (const coin of coinList) {
        drawSprite(ctx, images, COIN_FRAMES[Math.floor(now * 6 + coin.x / 100) % 2], coin.x, coin.y, 44, 44);
      }
      for (const e of enemies) {
        const frame = e.type.frames[Math.floor(now * 8) % e.type.frames.length];
        const y = e.type.flying ? enemyY(e) : GROUND_TOP - e.type.size / 2 + e.type.size * 0.06;
        drawSprite(ctx, images, frame, e.x, e.type.spin ? GROUND_TOP - e.type.lift : y, e.type.size, e.type.size, {
          rotation: e.type.spin ? -now * 10 : 0,
        });
      }

      const status = session.status;
      const pose =
        status === "over" ? "hit" : status === "ready" ? "idle" : !onGround() ? "jump" : Math.floor(distance / 45) % 2 ? "walk_a" : "walk_b";
      drawSprite(ctx, images, platformer.character(s.character, pose), PLAYER_X, player.feet - PLAYER_SIZE / 2 + 4, PLAYER_SIZE, PLAYER_SIZE);

      drawPopups(ctx, popups);
    },
  };
}
