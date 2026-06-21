# Bullet Heaven — Milestone 1

A 2D top-down survivor-like ("bullet heaven", à la Vampire Survivors / Survivor.io)
built with **Phaser 3 + TypeScript + Vite** using Arcade Physics. This milestone is
the fully-local, single-run **core loop** — no backend, accounts, or meta progression.

## Run it

```bash
npm install
npm run dev      # start the Vite dev server (http://localhost:5173)
npm run build    # type-check (tsc) + production build to dist/
npm run preview  # preview the production build
```

The game targets **portrait 720×1280** and scales to fit any screen
(`Scale.FIT` + `CENTER_BOTH`), so it works on desktop and phone.

## How to play

- **Move** by dragging the on-screen joystick (bottom-center). Drag anywhere in
  the lower half of the screen to steer.
- Your weapon **auto-fires** at the nearest enemy — there is no aiming or tapping
  to shoot.
- Kill enemies to drop **XP gems**; walk near them to vacuum them up.
- Fill the XP bar to **level up**: the game pauses and offers 3 random upgrades.
- Survive as long as you can. At 0 HP you get a **Game Over** screen with your
  score and a Retry button.

## Architecture

```
src/
  main.ts                 Phaser bootstrap (scale, physics, scene list)
  config/GameConfig.ts    ALL tuning values live here (one source of truth)
  types/index.ts          shared interfaces (stats, weapons, upgrades, results)
  scenes/
    BootScene.ts          generates all sprites as colored shapes (no art assets)
    GameScene.ts          arena, camera follow, collisions, run state, level-ups
    HUDScene.ts           overlay: timer, level, XP bar, HP bar, kills
    LevelUpScene.ts       modal: 3 random upgrade cards, pause/resume
    GameOverScene.ts      score breakdown + Retry
  entities/
    Player.ts             single player, mutable stat block, owned weapons
    Enemy.ts              poolable; walks toward player
    Projectile.ts         poolable; straight-line travel + lifespan
    Gem.ts                poolable; magnetises to player within pickup range
  systems/
    Pool.ts               generic typed object pool over an Arcade group
    Spawner.ts            off-screen wave spawning + 60s difficulty ramp
    WeaponSystem.ts       auto-fire at nearest enemy on a timer
    UpgradeSystem.ts      rolls 3 random upgrades and applies the pick
  ui/
    VirtualJoystick.ts    draggable thumb -> normalized move vector
```

### Performance: object pooling

Enemies, projectiles, and gems are **pooled** (`src/systems/Pool.ts`) — sprites are
reused via `obtain()` / `deactivate()` instead of being created and destroyed, so
hundreds can be on screen without GC churn. Pool sizes are capped in `GameConfig.ts`.

### Tuning

Every balance number — spawn cadence, difficulty ramp multipliers, base stats,
projectile damage/speed, the XP curve, upgrade magnitudes, scoring, and colors —
lives in [`src/config/GameConfig.ts`](src/config/GameConfig.ts). No magic numbers
are scattered through the gameplay code.

## Not in this milestone

Accounts, the meta skill tree, leaderboards, and Supabase are intentionally out of
scope and planned for later milestones.
