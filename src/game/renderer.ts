import {
  Asteroid,
  Bullet,
  COLORS,
  Enemy,
  GAME_HEIGHT,
  GAME_WIDTH,
  Particle,
  Player,
  Star,
} from '../types/game';

export function createCosmicBackground(dpr: number): HTMLCanvasElement {
  const bg = document.createElement('canvas');
  bg.width = Math.round(GAME_WIDTH * dpr);
  bg.height = Math.round(GAME_HEIGHT * dpr);

  const ctx = bg.getContext('2d');
  if (!ctx) return bg;

  ctx.save();
  ctx.scale(dpr, dpr);

  // Dark cosmic base
  ctx.fillStyle = COLORS.darkBg;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Purple nebula glows
  ctx.fillStyle = 'rgba(70, 15, 130, 0.18)';
  ctx.beginPath();
  ctx.arc(40, 280, 200, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(100, 25, 170, 0.14)';
  ctx.beginPath();
  ctx.arc(340, 140, 140, 0, Math.PI * 2);
  ctx.fill();

  // Left large planet (offset at -35, 155 in a 260x260 local space)
  ctx.save();
  ctx.translate(-35, 155);

  ctx.fillStyle = 'rgba(138, 43, 226, 0.16)';
  ctx.beginPath();
  ctx.arc(90, 130, 125, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgb(45, 12, 85)';
  ctx.beginPath();
  ctx.arc(85, 130, 115, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgb(22, 6, 45)';
  ctx.beginPath();
  ctx.arc(70, 135, 108, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(180, 90, 255, 0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(85, 130, 115, -1.1, 1.1);
  ctx.stroke();
  ctx.restore();

  // Right small planet (offset at 305, 195 in a 90x90 local space)
  ctx.save();
  ctx.translate(305, 195);

  ctx.fillStyle = 'rgba(138, 43, 226, 0.18)';
  ctx.beginPath();
  ctx.arc(45, 45, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgb(28, 10, 55)';
  ctx.beginPath();
  ctx.arc(45, 45, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgb(15, 5, 30)';
  ctx.beginPath();
  ctx.arc(40, 48, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
  return bg;
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
): void {
  if (points.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.closePath();
}

export function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size = 9,
): void {
  const r = Math.floor(size / 2) + 1;

  ctx.save();
  // Glow
  ctx.fillStyle = 'rgba(190, 50, 230, 0.30)';
  ctx.beginPath();
  ctx.arc(x - r + 1, y - 2, r + 3, 0, Math.PI * 2);
  ctx.arc(x + r - 1, y - 2, r + 3, 0, Math.PI * 2);
  ctx.fill();

  // Solid heart body
  ctx.fillStyle = COLORS.heart;
  ctx.beginPath();
  ctx.arc(x - r + 1, y - 2, r, 0, Math.PI * 2);
  ctx.arc(x + r - 1, y - 2, r, 0, Math.PI * 2);
  ctx.fill();

  drawPolygon(ctx, [
    [x - size, y - 1],
    [x + size, y - 1],
    [x, y + size + 1],
  ]);
  ctx.fill();
  ctx.restore();
}

export function getEnemyPoints(enemy: Enemy): Array<[number, number]> {
  const angle = Math.atan2(enemy.vy, enemy.vx);
  const offsets = [0, 2.35, -2.35];
  const radii = [enemy.size + 2, enemy.size, enemy.size];
  return offsets.map((off, idx) => [
    enemy.x + Math.cos(angle + off) * radii[idx],
    enemy.y + Math.sin(angle + off) * radii[idx],
  ]);
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  bgCanvas: HTMLCanvasElement,
  dpr: number,
  params: {
    stars: Star[];
    asteroids: Asteroid[];
    particles: Particle[];
    bullets: Bullet[];
    enemies: Enemy[];
    player: Player;
    score: number;
    lives: number;
    isGameOver: boolean;
    upgradeBannerTimer: number;
  },
): void {
  const {
    stars,
    asteroids,
    particles,
    bullets,
    enemies,
    player,
    score,
    lives,
    isGameOver,
    upgradeBannerTimer,
  } = params;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(bgCanvas, 0, 0);
  ctx.scale(dpr, dpr);

  // Stars
  ctx.fillStyle = 'rgb(200, 180, 255)';
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Asteroids
  for (const ast of asteroids) {
    const pts: Array<[number, number]> = ast.offsets.map((o) => [ast.x + o.x, ast.y + o.y]);
    drawPolygon(ctx, pts);
    ctx.fillStyle = 'rgb(20, 10, 40)';
    ctx.fill();
    ctx.strokeStyle = 'rgb(110, 50, 180)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Particles (glow + core)
  for (const p of particles) {
    if (p.life <= 0) continue;
    const ratio = p.life / p.maxLife;
    const alpha = Math.max(0, Math.min(1, ratio));
    const r = Math.max(1, Math.floor(p.radius * ratio));

    ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${(alpha * 0.5).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r + 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 220, 220, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bullets (outer purple glow -> lavender glow -> crisp white core)
  ctx.lineCap = 'round';
  for (const b of bullets) {
    ctx.strokeStyle = 'rgba(138, 43, 226, 0.58)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x, b.y + 16);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(200, 160, 255, 0.82)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x, b.y + 14);
    ctx.stroke();

    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y + 1);
    ctx.lineTo(b.x, b.y + 13);
    ctx.stroke();
  }

  // Enemies
  for (const e of enemies) {
    const pts = getEnemyPoints(e);

    drawPolygon(ctx, pts);
    ctx.strokeStyle = 'rgba(255, 30, 50, 0.35)';
    ctx.lineWidth = 7;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 70, 90, 0.72)';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.strokeStyle = 'rgb(255, 170, 180)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Player starship
  if (!isGameOver && !(player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 0)) {
    const { x, y } = player;
    const hull: Array<[number, number]> = [
      [x, y - 24],
      [x - 10, y + 6],
      [x, y + 12],
      [x + 10, y + 6],
    ];
    const leftWing: Array<[number, number]> = [
      [x - 7, y - 4],
      [x - 20, y + 12],
      [x - 8, y + 9],
    ];
    const rightWing: Array<[number, number]> = [
      [x + 7, y - 4],
      [x + 20, y + 12],
      [x + 8, y + 9],
    ];
    const flameLen = 10 + Math.random() * 7;
    const flame: Array<[number, number]> = [
      [x - 4, y + 11],
      [x, y + 11 + flameLen],
      [x + 4, y + 11],
    ];

    // Neon glow strokes
    drawPolygon(ctx, hull);
    ctx.strokeStyle = 'rgba(138, 43, 226, 0.52)';
    ctx.lineWidth = 7;
    ctx.stroke();

    drawPolygon(ctx, leftWing);
    ctx.strokeStyle = 'rgba(138, 43, 226, 0.48)';
    ctx.lineWidth = 5;
    ctx.stroke();

    drawPolygon(ctx, rightWing);
    ctx.strokeStyle = 'rgba(138, 43, 226, 0.48)';
    ctx.lineWidth = 5;
    ctx.stroke();

    drawPolygon(ctx, flame);
    ctx.strokeStyle = 'rgba(180, 120, 255, 0.72)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Crisp ship fills & outlines
    drawPolygon(ctx, hull);
    ctx.fillStyle = 'rgb(25, 15, 50)';
    ctx.fill();
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = 2;
    ctx.stroke();

    drawPolygon(ctx, leftWing);
    ctx.fillStyle = 'rgb(35, 20, 65)';
    ctx.fill();
    ctx.strokeStyle = COLORS.neonBlue;
    ctx.lineWidth = 2;
    ctx.stroke();

    drawPolygon(ctx, rightWing);
    ctx.fillStyle = 'rgb(35, 20, 65)';
    ctx.fill();
    ctx.strokeStyle = COLORS.neonBlue;
    ctx.lineWidth = 2;
    ctx.stroke();

    drawPolygon(ctx, flame);
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cockpit dot
    ctx.fillStyle = COLORS.neonBlue;
    ctx.beginPath();
    ctx.arc(x, y - 3, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Twin-laser unlocked notification banner (brief & unobtrusive)
  if (upgradeBannerTimer > 0) {
    const alpha = Math.min(1, upgradeBannerTimer / 25);
    ctx.save();
    ctx.fillStyle = `rgba(180, 160, 255, ${alpha.toFixed(3)})`;
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TWIN LASER UNLOCKED', GAME_WIDTH / 2, 54);
    ctx.restore();
  }

  // Outer Neon Purple Frame
  ctx.strokeStyle = COLORS.purple;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, GAME_WIDTH - 4, GAME_HEIGHT - 4);

  ctx.strokeStyle = 'rgb(200, 120, 255)';
  ctx.lineWidth = 1;
  ctx.strokeRect(1.5, 1.5, GAME_WIDTH - 3, GAME_HEIGHT - 3);

  // Canvas HUD: SCORE & LIVES
  ctx.fillStyle = COLORS.white;
  ctx.font = '700 17px "JetBrains Mono", Consolas, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`SCORE: ${score}`, 14, 13);

  ctx.fillText('LIVES:', GAME_WIDTH - 145, 13);
  for (let i = 0; i < lives; i++) {
    drawHeart(ctx, GAME_WIDTH - 65 + i * 22, 22, 9);
  }

  ctx.restore();
}
