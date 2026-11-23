import { platformer } from "@/engine/assets";
import { drawPopups, drawSprite, updatePopups, type Popup } from "@/engine/draw";
import { Keys } from "@/engine/input";
import { drawBackdrop, drawGround } from "@/engine/landscape";
import { clamp, overlaps, pick, randRange } from "@/engine/math";
import type { GameContext, GameInstance } from "../types";
import type { DropperSettings } from "./index";

export const DROPPER_WIDTH = 600;
export const DROPPER_HEIGHT = 800;
const GROUND_TOP = DROPPER_HEIGHT - 96;
const PLAYER_SIZE = 120;
const PLAYER_BOX = { w: 58, h: 78 };
const INVULNERABLE_TIME = 1.4;

type ItemKind = "coin" | "gem" | "heart" | "bomb" | "saw";

interface Item {
  kind: ItemKind;
  sprite: string;
  x: number;
  y: number;
  vy: number;
  size: number;
  rotation: number;
  spin: number;
}

const GEMS = ["gem_blue", "gem_green", "gem_red", "gem_yellow"].map(platformer.tile);
const COIN = platformer.tile("coin_gold");
const HEART = platformer.tile("heart");
const BOMB = platformer.tile("bomb_active");
const SAW = [platformer.enemy("saw_a"), platformer.enemy("saw_b")];

/** Static ground props per background theme. */
const DECOR: Record<string, string[]> = {
  hills: ["bush", "grass", "bush"],
  trees: ["bush", "mushroom_brown", "grass"],
  desert: ["cactus", "rock", "cactus"],
  mushrooms: ["mushroom_red", "mushroom_brown", "grass_purple"],
};

export const dropperSprites = [
  ...GEMS,
  COIN,
  HEART,
  BOMB,
  ...SAW,
  platformer.tile("hud_heart_empty"),
  ...Object.values(DECOR).flat().map(platformer.tile),
];

export function createDropper(s: DropperSettings, { width, images, input, session, sound }: GameContext): GameInstance {
  const player = { x: width / 2, facing: 1, moving: false };
  let items: Item[] = [];
  let popups: Popup[] = [];
  let lives = s.lives;
  let score = 0;
  let elapsed = 0;
  let spawnTimer = 0.6;
  let invulnerable = 0;
  let shake = 0;

  const playerBox = () => ({ x: player.x, y: GROUND_TOP - PLAYER_BOX.h / 2, ...PLAYER_BOX });

  function spawn() {
    const roll = Math.random();
    let kind: ItemKind = "coin";
    if (roll < s.badChance) kind = Math.random() < 0.6 ? "bomb" : "saw";
    else if (roll < s.badChance + s.heartChance) kind = "heart";
    else if (roll < s.badChance + s.heartChance + s.gemChance) kind = "gem";

    const sprite = kind === "coin" ? COIN : kind === "gem" ? pick(GEMS) : kind === "heart" ? HEART : kind === "bomb" ? BOMB : SAW[0];
    const size = kind === "coin" ? 56 : kind === "saw" ? 72 : 64;
    items.push({
      kind,
      sprite,
      size,
      x: randRange(size, width - size),
      y: -size,
      vy: (s.fallSpeed + s.acceleration * elapsed) * randRange(0.85, 1.2),
      rotation: 0,
      spin: kind === "saw" ? 8 : kind === "bomb" ? randRange(-1.5, 1.5) : 0,
    });
  }

  function collect(item: Item) {
    if (item.kind === "heart") {
      lives = Math.min(9, lives + 1);
      sound("magic");
      popups.push({ text: "+1 ♥", x: item.x, y: item.y, life: 1, color: "#ff6b8b" });
    } else {
      const value = item.kind === "gem" ? 5 : 1;
      score += value;
      sound(item.kind === "gem" ? "gem" : "coin", 0.4);
      popups.push({ text: `+${value}`, x: item.x, y: item.y, life: 0.8, color: item.kind === "gem" ? "#7dd3fc" : "#ffd84d" });
    }
  }

  function hurt(item: Item) {
    if (invulnerable > 0) return;
    lives -= 1;
    invulnerable = INVULNERABLE_TIME;
    shake = 0.35;
    sound("hurt");
    popups.push({ text: "Ouch!", x: item.x, y: item.y, life: 1, color: "#ff5a5a" });
    if (lives <= 0) session.end();
  }

  return {
    update(dt) {
      elapsed += dt;
      invulnerable = Math.max(0, invulnerable - dt);
      shake = Math.max(0, shake - dt);

      const direction = input.axis(Keys.left, Keys.right);
      player.moving = direction !== 0;
      if (direction) player.facing = direction;
      player.x = clamp(player.x + direction * s.playerSpeed * dt, PLAYER_BOX.w, width - PLAYER_BOX.w);

      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawn();
        // Drops come a little faster the longer you survive.
        spawnTimer = (s.spawnInterval * randRange(0.7, 1.3)) / (1 + elapsed / 90);
      }

      const box = playerBox();
      items = items.filter((item) => {
        item.y += item.vy * dt;
        item.rotation += item.spin * dt;
        if (overlaps(box, { x: item.x, y: item.y, w: item.size * 0.6, h: item.size * 0.6 })) {
          if (item.kind === "bomb" || item.kind === "saw") hurt(item);
          else collect(item);
          return false;
        }
        return item.y < GROUND_TOP - item.size * 0.25;
      });

      popups = updatePopups(popups, dt);
      session.setScore(score);
    },

    draw(ctx, time) {
      ctx.save();
      if (shake > 0) ctx.translate(randRange(-6, 6) * shake * 3, randRange(-6, 6) * shake * 3);

      drawBackdrop(ctx, images, s.theme, time * 12, GROUND_TOP + 60, 320, width);
      drawGround(ctx, images, s.theme, 0, GROUND_TOP, DROPPER_HEIGHT + 20, width);
      (DECOR[s.theme] ?? DECOR.hills).forEach((name, i) => {
        const x = [70, 300, 520][i];
        drawSprite(ctx, images, platformer.tile(name), x, GROUND_TOP - 30, 64, 64);
      });

      for (const item of items) {
        const sprite = item.kind === "saw" ? SAW[Math.floor(time * 12) % 2] : item.sprite;
        drawSprite(ctx, images, sprite, item.x, item.y, item.size, item.size, { rotation: item.rotation });
      }

      const over = session.status === "over";
      const pose = over ? "hit" : player.moving ? (Math.floor(time * 10) % 2 ? "walk_a" : "walk_b") : "idle";
      const blink = invulnerable > 0 && !over && Math.floor(time * 12) % 2 === 0;
      drawSprite(ctx, images, platformer.character(s.character, pose), player.x, GROUND_TOP - PLAYER_SIZE / 2 + 4, PLAYER_SIZE, PLAYER_SIZE, {
        flipX: player.facing < 0,
        alpha: blink ? 0.35 : 1,
      });

      // Lives, centered at the top.
      const slots = Math.max(lives, s.lives);
      for (let i = 0; i < slots; i++) {
        const x = width / 2 + (i - (slots - 1) / 2) * 44;
        drawSprite(ctx, images, platformer.tile(i < lives ? "hud_heart" : "hud_heart_empty"), x, 40, 40, 40);
      }

      drawPopups(ctx, popups);
      ctx.restore();
    },
  };
}
