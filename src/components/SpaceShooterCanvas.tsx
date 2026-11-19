import { useCallback, useEffect, useRef } from 'react';
import { createCosmicBackground, renderFrame } from '../game/renderer';
import {
  Asteroid,
  Bullet,
  DOUBLE_SHOT_SCORE,
  Enemy,
  GAME_HEIGHT,
  GAME_WIDTH,
  GameStatus,
  HudSnapshot,
  MAX_LIVES,
  Particle,
  Player,
  Star,
} from '../types/game';
import { arcadeSound } from '../utils/sound';

interface SpaceShooterCanvasProps {
  status: GameStatus;
  autoFire: boolean;
  currentScore: number;
  highScore: number;
  resetNonce: number;
  onStatusChange: (status: GameStatus) => void;
  onSnapshot: (snapshot: HudSnapshot) => void;
}

function createAsteroid(): Asteroid {
  const radius = 12 + Math.floor(Math.random() * 17);
  const numPts = 6 + Math.floor(Math.random() * 4);
  const offsets: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < numPts; i++) {
    const angle = (2 * Math.PI * i) / numPts;
    const scale1 = 0.7 + Math.random() * 0.45;
    const scale2 = 0.7 + Math.random() * 0.45;
    offsets.push({
      x: Math.cos(angle) * radius * scale1,
      y: Math.sin(angle) * radius * scale2,
    });
  }
  return {
    x: Math.random() * GAME_WIDTH,
    y: -50 + Math.random() * (GAME_HEIGHT + 50),
    speed: 0.3 + Math.random() * 0.6,
    radius,
    offsets,
  };
}

function createStars(): Star[] {
  return Array.from({ length: 45 }, () => ({
    x: Math.random() * GAME_WIDTH,
    y: Math.random() * GAME_HEIGHT,
    speed: 0.3 + Math.random() * 0.9,
  }));
}

function createParticle(
  x: number,
  y: number,
  rgb: [number, number, number],
  speedMin: number,
  speedMax: number,
  life: number,
  radius: number,
): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = speedMin + Math.random() * (speedMax - speedMin);
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life,
    maxLife: life,
    r: rgb[0],
    g: rgb[1],
    b: rgb[2],
    radius,
  };
}

function createEnemy(score: number): Enemy {
  const size = 15;
  const isStraight = Math.random() < 2 / 3;
  const speedBoost = Math.min(score * 0.03, 2.0);
  if (isStraight) {
    return {
      x: 30 + Math.random() * (GAME_WIDTH - 60),
      y: -25,
      vx: -0.4 + Math.random() * 0.8,
      vy: 2.0 + Math.random() * 1.2 + speedBoost,
      size,
      trailTimer: 0,
    };
  }
  const side = Math.random() < 0.5 ? -1 : 1;
  return {
    x: GAME_WIDTH / 2 + side * (80 + Math.random() * 90),
    y: -25,
    vx: -side * (1.0 + Math.random() * 1.0),
    vy: 2.2 + Math.random() * 1.1 + speedBoost,
    size,
    trailTimer: 0,
  };
}

function createInitialPlayer(): Player {
  return {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 68,
    speed: 5,
    cooldown: 0,
    invincible: 0,
  };
}

export function SpaceShooterCanvas({
  status,
  autoFire,
  currentScore,
  highScore,
  resetNonce,
  onStatusChange,
  onSnapshot,
}: SpaceShooterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const statusRef = useRef<GameStatus>(status);
  const autoFireRef = useRef<boolean>(autoFire);
  const highScoreRef = useRef<number>(highScore);

  statusRef.current = status;
  autoFireRef.current = autoFire;
  highScoreRef.current = highScore;

  const keysRef = useRef<Set<string>>(new Set());
  const pointerRef = useRef<{ active: boolean; x: number; y: number }>({
    active: false,
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 68,
  });

  const simRef = useRef({
    stars: createStars(),
    asteroids: Array.from({ length: 5 }, () => createAsteroid()),
    player: createInitialPlayer(),
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    score: 0,
    lives: MAX_LIVES,
    spawnTimer: 0,
    upgradeBannerTimer: 0,
    doubleShotAnnounced: false,
  });

  const emitSnapshot = useCallback(
    (nextStatus: GameStatus) => {
      const sim = simRef.current;
      const nextHigh = Math.max(highScoreRef.current, sim.score);
      onSnapshot({
        status: nextStatus,
        score: sim.score,
        lives: sim.lives,
        highScore: nextHigh,
        enemiesDestroyed: sim.score,
        doubleShotUnlocked: sim.score >= DOUBLE_SHOT_SCORE,
      });
    },
    [onSnapshot],
  );

  const resetSimulation = useCallback(() => {
    simRef.current.player = createInitialPlayer();
    simRef.current.bullets = [];
    simRef.current.enemies = [];
    simRef.current.particles = [];
    simRef.current.score = 0;
    simRef.current.lives = MAX_LIVES;
    simRef.current.spawnTimer = 0;
    simRef.current.upgradeBannerTimer = 0;
    simRef.current.doubleShotAnnounced = false;
  }, []);

  // Reset simulation whenever parent bumps resetNonce
  useEffect(() => {
    resetSimulation();
    emitSnapshot(statusRef.current);
  }, [resetNonce, resetSimulation, emitSnapshot]);

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight' ||
        e.code === 'Space'
      ) {
        e.preventDefault();
      }

      keysRef.current.add(e.code);

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (statusRef.current === 'PLAYING') {
          onStatusChange('PAUSED');
        } else if (statusRef.current === 'PAUSED') {
          onStatusChange('PLAYING');
        }
      }

      if (e.code === 'KeyR' && statusRef.current === 'GAME_OVER') {
        resetSimulation();
        onStatusChange('PLAYING');
        emitSnapshot('PLAYING');
      }

      if ((e.code === 'Enter' || e.code === 'Space') && statusRef.current === 'TITLE_MENU') {
        resetSimulation();
        onStatusChange('PLAYING');
        emitSnapshot('PLAYING');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    const handleBlur = () => {
      keysRef.current.clear();
      pointerRef.current.active = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [onStatusChange, resetSimulation, emitSnapshot]);

  // Fixed 60 FPS simulation & render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(GAME_WIDTH * dpr);
    canvas.height = Math.round(GAME_HEIGHT * dpr);

    const bgCanvas = createCosmicBackground(dpr);

    let animId = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    const STEP_MS = 1000 / 60;

    const stepSimulation = () => {
      const sim = simRef.current;
      const currentStatus = statusRef.current;

      // Always drift stars & asteroids on TITLE_MENU and PLAYING (freeze when PAUSED)
      if (currentStatus !== 'PAUSED') {
        for (const s of sim.stars) {
          s.y += s.speed;
          if (s.y > GAME_HEIGHT) {
            s.y = 0;
            s.x = Math.random() * GAME_WIDTH;
          }
        }

        for (const ast of sim.asteroids) {
          ast.y += ast.speed;
          if (ast.y - ast.radius > GAME_HEIGHT) {
            ast.y = -ast.radius - 10;
            ast.x = Math.random() * GAME_WIDTH;
          }
        }

        for (let i = sim.particles.length - 1; i >= 0; i--) {
          const p = sim.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.95;
          p.vy *= 0.95;
          p.life -= 1;
          if (p.life <= 0) {
            sim.particles.splice(i, 1);
          }
        }
      }

      if (currentStatus !== 'PLAYING') {
        return;
      }

      const keys = keysRef.current;
      const p = sim.player;

      // Keyboard movement
      if (keys.has('ArrowLeft') || keys.has('KeyA')) p.x -= p.speed;
      if (keys.has('ArrowRight') || keys.has('KeyD')) p.x += p.speed;
      if (keys.has('ArrowUp') || keys.has('KeyW')) p.y -= p.speed * 0.8;
      if (keys.has('ArrowDown') || keys.has('KeyS')) p.y += p.speed * 0.8;

      // Pointer/touch direct smooth follow
      if (pointerRef.current.active) {
        const dx = pointerRef.current.x - p.x;
        const dy = pointerRef.current.y - p.y;
        p.x += dx * 0.28;
        p.y += dy * 0.28;
      }

      p.x = Math.max(28, Math.min(GAME_WIDTH - 28, p.x));
      p.y = Math.max(GAME_HEIGHT / 2, Math.min(GAME_HEIGHT - 40, p.y));

      if (p.cooldown > 0) p.cooldown -= 1;
      if (p.invincible > 0) p.invincible -= 1;
      if (sim.upgradeBannerTimer > 0) sim.upgradeBannerTimer -= 1;

      // Shooting
      const wantsShoot =
        keys.has('Space') || pointerRef.current.active || autoFireRef.current;
      if (wantsShoot && p.cooldown === 0) {
        const doubleShot = sim.score >= DOUBLE_SHOT_SCORE;
        if (doubleShot) {
          sim.bullets.push({ x: p.x - 8, y: p.y - 22, speed: 9 });
          sim.bullets.push({ x: p.x + 8, y: p.y - 22, speed: 9 });
        } else {
          sim.bullets.push({ x: p.x, y: p.y - 26, speed: 9 });
        }
        p.cooldown = 12;
        arcadeSound.playShoot(doubleShot);
      }

      // Enemy spawn
      sim.spawnTimer += 1;
      const spawnRate = Math.max(22, 48 - Math.floor(sim.score / 2));
      if (sim.spawnTimer >= spawnRate) {
        sim.enemies.push(createEnemy(sim.score));
        sim.spawnTimer = 0;
      }

      // Update bullets
      for (let i = sim.bullets.length - 1; i >= 0; i--) {
        const b = sim.bullets[i];
        b.y -= b.speed;
        if (b.y < -20) {
          sim.bullets.splice(i, 1);
        }
      }

      let hudDirty = false;

      // Update enemies & collisions
      for (let i = sim.enemies.length - 1; i >= 0; i--) {
        const e = sim.enemies[i];
        e.x += e.vx;
        e.y += e.vy;

        if (e.x < 22 || e.x > GAME_WIDTH - 22) {
          e.vx *= -1;
        }

        e.trailTimer += 1;
        if (e.trailTimer % 3 === 0) {
          sim.particles.push(
            createParticle(
              e.x + (-2 + Math.random() * 4),
              e.y - 10,
              [255, 50, 50],
              0.1,
              0.5,
              14,
              2,
            ),
          );
        }

        if (e.y > GAME_HEIGHT + 30) {
          sim.enemies.splice(i, 1);
          continue;
        }

        // Bullet hit check
        let hit = false;
        for (let j = sim.bullets.length - 1; j >= 0; j--) {
          const b = sim.bullets[j];
          if (Math.hypot(e.x - b.x, e.y - b.y) < e.size + 6) {
            sim.bullets.splice(j, 1);
            sim.enemies.splice(i, 1);
            sim.score += 1;
            hudDirty = true;

            if (sim.score >= DOUBLE_SHOT_SCORE && !sim.doubleShotAnnounced) {
              sim.doubleShotAnnounced = true;
              sim.upgradeBannerTimer = 110;
              arcadeSound.playUpgrade();
            } else {
              arcadeSound.playExplosion();
            }

            for (let k = 0; k < 28; k++) {
              const color: [number, number, number] =
                Math.random() < 0.5 ? [255, 50, 50] : [255, 90, 160];
              sim.particles.push(createParticle(e.x, e.y, color, 1.5, 6.0, 26, 3));
            }
            hit = true;
            break;
          }
        }

        if (hit) continue;

        // Player collision check
        if (p.invincible === 0 && Math.hypot(e.x - p.x, e.y - p.y) < e.size + 14) {
          sim.enemies.splice(i, 1);
          sim.lives -= 1;
          p.invincible = 90;
          hudDirty = true;

          for (let k = 0; k < 30; k++) {
            sim.particles.push(createParticle(p.x, p.y, [255, 90, 160], 2.0, 6.5, 28, 3));
          }

          if (sim.lives <= 0) {
            arcadeSound.playGameOver();
            onStatusChange('GAME_OVER');
            emitSnapshot('GAME_OVER');
            return;
          } else {
            arcadeSound.playPlayerHit();
          }
        }
      }

      if (hudDirty) {
        emitSnapshot('PLAYING');
      }
    };

    const tick = (now: number) => {
      const elapsed = Math.min(now - lastTime, 100);
      lastTime = now;
      accumulator += elapsed;

      while (accumulator >= STEP_MS) {
        stepSimulation();
        accumulator -= STEP_MS;
      }

      const sim = simRef.current;
      renderFrame(ctx, bgCanvas, dpr, {
        stars: sim.stars,
        asteroids: sim.asteroids,
        particles: sim.particles,
        bullets: sim.bullets,
        enemies: sim.enemies,
        player: sim.player,
        score: sim.score,
        lives: sim.lives,
        isGameOver: statusRef.current === 'GAME_OVER',
        upgradeBannerTimer: sim.upgradeBannerTimer,
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [emitSnapshot, onStatusChange]);

  const mapPointerToGame = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * GAME_WIDTH,
      y: ((clientY - rect.top) / rect.height) * GAME_HEIGHT,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (statusRef.current !== 'PLAYING') return;
    const coords = mapPointerToGame(e.clientX, e.clientY);
    if (!coords) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerRef.current = { active: true, x: coords.x, y: coords.y };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointerRef.current.active) return;
    const coords = mapPointerToGame(e.clientX, e.clientY);
    if (!coords) return;
    pointerRef.current.x = coords.x;
    pointerRef.current.y = coords.y;
  };

  const handlePointerUp = () => {
    pointerRef.current.active = false;
  };

  const handleStart = () => {
    resetSimulation();
    onStatusChange('PLAYING');
    emitSnapshot('PLAYING');
  };

  return (
    <div className="relative mx-auto w-full max-w-[440px] select-none overflow-hidden rounded-lg shadow-[0_0_45px_rgba(138,43,226,0.22)]">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="block aspect-[2/3] w-full touch-none cursor-crosshair bg-[#080414]"
        aria-label="Space Shooter Neon game arena"
      />

      {status === 'TITLE_MENU' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080414]/65 px-6 text-center backdrop-blur-[2px]">
          <p className="text-xs font-medium tracking-wider text-purple-300 uppercase">
            Arcade Sector 01
          </p>
          <h2 className="font-display mt-2 text-4xl font-bold tracking-tight text-white">
            Space Shooter
          </h2>
          <p className="mt-3 max-w-[280px] text-sm leading-relaxed text-slate-300">
            Pilot your neon interceptor, dodge crimson squadrons, and unlock twin lasers at 5 points.
          </p>

          <button
            type="button"
            onClick={handleStart}
            className="mt-7 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-purple-600 px-7 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 whitespace-nowrap"
          >
            Start Game
          </button>

          <p className="mt-4 text-xs text-slate-400">
            Press Enter or Space to launch
          </p>
        </div>
      )}

      {status === 'PAUSED' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080414]/75 px-6 text-center backdrop-blur-[2px]">
          <h2 className="font-display text-3xl font-bold text-white">Paused</h2>
          <p className="mt-2 text-sm text-slate-300">Press P or Esc to resume flight</p>
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onStatusChange('PLAYING')}
              className="inline-flex min-h-[42px] items-center justify-center rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 whitespace-nowrap"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={handleStart}
              className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-slate-700 bg-slate-900/90 px-5 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-purple-500/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 whitespace-nowrap"
            >
              Restart
            </button>
          </div>
        </div>
      )}

      {status === 'GAME_OVER' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 px-6 text-center backdrop-blur-[1px]">
          <h2 className="font-display text-4xl font-bold tracking-wide text-[#ff3232]">
            GAME OVER
          </h2>
          <p className="mt-3 font-mono-tabular text-sm text-slate-200">
            Final Score: {currentScore} · Best: {Math.max(highScore, currentScore)}
          </p>
          <button
            type="button"
            onClick={handleStart}
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 whitespace-nowrap"
          >
            Play Again
          </button>
          <p className="mt-3 text-xs text-slate-300">Press R to Restart</p>
        </div>
      )}
    </div>
  );
}
