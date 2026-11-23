# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

A builder for **2D** mini-games: Runner (side-scroller), Dropper (avatar at the bottom, items fall from the top), Swimmer (underwater). Users pick a template, adjust its settings (including character and background picked from sprites) in a React UI with a live preview, then save, export or share the game. The target is the web now; desktop is planned, for example by wrapping the `/play` page in Tauri or Electron. The 3D/three.js version was dropped at the user's request, so don't reintroduce three.js. There is no test framework configured.

## Commands

- `npm run dev`: dev server at http://localhost:3000. It also regenerates the Next.js agent-rules block in `AGENTS.md`.
- `npm run build`: production build. `npx tsc --noEmit` is a quick type-check.
- `npm run lint`: ESLint with a flat config, `eslint-config-next` core-web-vitals plus typescript, including the React Compiler rules.

## Architecture

Three decoupled layers:

- **`src/engine/`**: shared code that does not depend on React.
  - `session.ts`: `GameSession` is an external store (`useSyncExternalStore`) that bridges the game loop and the React HUD. It only emits when the status or score changes.
  - `input.ts`: `InputState` is polled by games. `isDown` is for held keys, `consumePress` for one-shot actions.
  - `assets.ts`: preloads sprites.
  - `draw.ts`: sprite drawing, tile rows with parallax offset and optional crop, outlined text, "+N" popups.
  - `landscape.ts`: the layered Kenney sky, clouds and hills backdrop, plus themed ground.
  - `audio.ts`: plays sound effects and keeps the mute setting in localStorage.
  - `math.ts`: `Box` / `overlaps` collision helpers.
- **`src/games/<id>/`**: one folder per template.
  - `index.ts` declares the settings type and calls `defineTemplate<Settings>()` with the logical `width`/`height`, the `sprites` to preload, `defaults`, `params` and `create`. `params` is the editor form schema. A setting's param type follows its value type: number → slider, boolean → checkbox, string → `color` or `select`.
  - `game.ts` exports `create(settings, context)`, which returns `{ update(dt), draw(ctx, time) }`.
  - Templates are registered in `registry.ts`.
  - `definition.ts` defines `GameDefinition` (template id plus flat JSON settings). This is the unit that is saved to localStorage (`storage.ts`), exported or imported as JSON, and encoded into share links (`/play#<base64url>`). All external data goes through `sanitizeDefinition`, which validates against `params` (including select options).
- **`src/components/`**:
  - `player/GameCanvas` preloads the sprites, letterboxes the logical resolution into the container (DPR-aware) and runs the requestAnimationFrame loop.
  - `player/GamePlayer` adds keyboard routing and the HUD. Both the builder preview and `/play` use it.
  - `builder/` is the editor UI.
  - Both pages are client-only, using `next/dynamic({ ssr: false })` loaders.

### Game conventions (follow these when adding a template)

- A new game instance is created for every run (`runId`) and on every settings change, so `create()` keeps its state in plain closure variables. No React is involved inside games.
- `update` runs only while `session.status === "playing"`. `draw` runs every frame, including the ready and game-over screens, so draw a sensible idle state.
- Work in logical pixels (for example 960×540 or 600×800). `GameCanvas` handles scaling.
- Report progress with `session.setScore()` and `session.end()`. Play effects with `context.sound(name)`.
- Every sprite a game draws must be listed in its template's `sprites`. Missing keys are skipped silently, so a typo shows up as an invisible object.

## Assets

`public/assets/` holds Kenney packs (CC0, license files alongside). An asset key is the path without `.png`; use the helpers in `engine/assets.ts` (`platformer.character(color, pose)`, `platformer.tile()`, `platformer.enemy()`, `platformer.background()`, `fish()`).

- `platformer/`: the "New Platformer Pack", double resolution. It has 5 characters (beige/green/pink/purple/yellow) with idle, walk_a/b, jump, hit, duck, climb and front poses, enemies, tiles, items and backgrounds, plus `sounds/sfx_*.ogg`. Characters and enemies face right and left respectively. Character frames are 256px with the feet at the bottom edge. Background tiles are opaque and have white bands, which `drawBackdrop` crops.
- `fish/`: the "Fish Pack", double resolution. It has seaweed, rocks, bubbles and sand terrain.

To add more packs, fetch from kenney.nl: the download link comes from `GET https://kenney.nl/download-link/<hex("assets/<slug>")>`, sent with a `Referer` header. Copy the `Double` PNGs together with `License.txt`.

## Checking visuals

Take headless screenshots with Edge:

`"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --window-size=1280,800 --virtual-time-budget=15000 --screenshot=out.png "http://localhost:3000/play#<code>"`

`<code>` is the base64url of `{"name":"x","templateId":"dropper","settings":{}}`. Unspecified settings fall back to defaults.

## Stack notes

- **Next.js 16.4 / React 19.3, App Router** under `src/app/`. Check `node_modules/next/dist/docs/` before using Next APIs.
- **React Compiler is enabled**, so manual memoization is generally unnecessary. Its lint rules forbid mutating hook values or reading refs during render.
- **Tailwind CSS v4** through the `@tailwindcss/turbopack` loader configured in `next.config.ts`. The UI is dark-only.
- Import alias `@/*` → `src/*`.
