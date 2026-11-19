export type GameStatus = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 600;
export const MAX_LIVES = 3;
export const DOUBLE_SHOT_SCORE = 5;

export const COLORS = {
  white: '#ffffff',
  red: '#ff3232',
  purple: '#8a2be2',
  darkBg: '#080414',
  neonPink: '#ff5aa0',
  neonBlue: '#b4a0ff',
  heart: '#be32e6',
} as const;

export interface Star {
  x: number;
  y: number;
  speed: number;
}

export interface Asteroid {
  x: number;
  y: number;
  speed: number;
  radius: number;
  offsets: Array<{ x: number; y: number }>;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  r: number;
  g: number;
  b: number;
  radius: number;
}

export interface Bullet {
  x: number;
  y: number;
  speed: number;
}

export interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  trailTimer: number;
}

export interface Player {
  x: number;
  y: number;
  speed: number;
  cooldown: number;
  invincible: number;
}

export interface HudSnapshot {
  status: GameStatus;
  score: number;
  lives: number;
  highScore: number;
  enemiesDestroyed: number;
  doubleShotUnlocked: boolean;
}
