import { LevelData, NinjaType } from './types';

// Player
export const PLAYER_HORIZONTAL_SPEED = 6;
export const PLAYER_JUMP_FORCE = 16;
export const PLAYER_DOUBLE_JUMP_FORCE = 13;
export const PLAYER_HEALTH = 100;
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 50;
export const INITIAL_AMMO = 50;
export const PLAYER_DASH_SPEED = 25;
export const PLAYER_DASH_DURATION = 150; // ms
export const PLAYER_DASH_COOLDOWN = 1000; // ms
export const PLAYER_MELEE_RANGE = 70;
export const PLAYER_MELEE_DAMAGE = 2;
export const PLAYER_MELEE_DURATION = 200; // ms
export const PLAYER_MELEE_COOLDOWN = 500; // ms


// Physics
export const GRAVITY = 0.7;
export const MAX_FALL_SPEED = 15;
export const FRICTION = 0.8;

// Shuriken
export const BULLET_SPEED = 18;
export const BULLET_SIZE = 15;
export const SHOOT_COOLDOWN = 200; // ms

// Items
export const HEALTH_PACK_HEAL_AMOUNT = 30;

// Bomb
export const BOMB_FUSE_TIME = 2000; // ms
export const BOMB_THROW_VELOCITY = { x: 6, y: -12 };
export const EXPLOSION_RADIUS = 80;
export const EXPLOSION_DURATION = 400; // ms
export const EXPLOSION_DAMAGE = 25;


export const NINJA_STATS = {
  [NinjaType.Patroller]: { health: 2, speed: 1.5, width: 40, height: 50, value: 10, color: 'bg-red-600' },
  [NinjaType.Chaser]: { health: 3, speed: 2.5, width: 40, height: 50, value: 20, color: 'bg-blue-600' },
  [NinjaType.Brute]: { health: 8, speed: 1, width: 60, height: 70, value: 50, color: 'bg-gray-800' },
  [NinjaType.Specter]: { health: 4, speed: 3, width: 45, height: 55, value: 35, color: 'bg-purple-700' },
  [NinjaType.Oni]: { health: 15, speed: 0.8, width: 80, height: 90, value: 100, color: 'bg-green-800' },
  [NinjaType.Bomber]: { health: 5, speed: 1.2, width: 45, height: 55, value: 40, color: 'bg-orange-600' },
  [NinjaType.Sniper]: { health: 3, speed: 0, width: 40, height: 50, value: 50, color: 'bg-cyan-500' },
  [NinjaType.Stealth]: { health: 4, speed: 3.5, width: 40, height: 50, value: 60, color: 'bg-gray-500' },
};

export const SURVIVAL_LEVEL: Omit<LevelData, 'level' | 'enemies' | 'ammoPacks' | 'healthPacks'> = {
    mapDimensions: { width: 1800, height: 900 },
    initialPlayerPosition: { x: 900, y: 750 },
    platforms: [
        { position: { x: 0, y: 850 }, width: 1800, height: 50 },
        { position: { x: 200, y: 700 }, width: 300, height: 30 },
        { position: { x: 1300, y: 700 }, width: 300, height: 30 },
        { position: { x: 700, y: 550 }, width: 400, height: 30 },
        { position: { x: 400, y: 400 }, width: 200, height: 30 },
        { position: { x: 1200, y: 400 }, width: 200, height: 30 },
    ],
};

export const LEVELS: LevelData[] = [
  // Level 1: Basic Introduction
  {
    level: 1,
    mapDimensions: { width: 1600, height: 800 },
    initialPlayerPosition: { x: 200, y: 650 },
    enemies: [
      { type: NinjaType.Patroller, position: { x: 800, y: 700 } },
      { type: NinjaType.Patroller, position: { x: 1200, y: 500 } },
    ],
    platforms: [
      { position: { x: 0, y: 750 }, width: 1600, height: 50 },
      { position: { x: 500, y: 600 }, width: 250, height: 30 },
      { position: { x: 1000, y: 550 }, width: 300, height: 30 },
      { position: { x: 600, y: 400 }, width: 200, height: 30 },
    ],
    ammoPacks: [{ position: { x: 650, y: 350 }, amount: 25 }],
  },
  // Level 2: More complex platforming and enemies
  {
    level: 2,
    mapDimensions: { width: 2000, height: 1000 },
    initialPlayerPosition: { x: 150, y: 850 },
    enemies: [
      { type: NinjaType.Patroller, position: { x: 700, y: 800 } },
      { type: NinjaType.Chaser, position: { x: 1000, y: 600 } },
      { type: NinjaType.Patroller, position: { x: 1500, y: 800 } },
      { type: NinjaType.Chaser, position: { x: 1800, y: 400 } },
    ],
    platforms: [
      { position: { x: 0, y: 950 }, width: 2000, height: 50 },
      { position: { x: 400, y: 850 }, width: 200, height: 30 },
      { position: { x: 800, y: 750 }, width: 300, height: 30 },
      { position: { x: 1200, y: 650 }, width: 250, height: 30 },
      { position: { x: 1600, y: 550 }, width: 150, height: 30 },
      { position: { x: 1750, y: 450 }, width: 250, height: 30 },
    ],
    ammoPacks: [
      { position: { x: 1300, y: 600 }, amount: 20 },
      { position: { x: 1900, y: 400 }, amount: 20 },
    ],
  },
    // Level 3: Brute and Bomber introduction
  {
    level: 3,
    mapDimensions: { width: 2400, height: 1200 },
    initialPlayerPosition: { x: 100, y: 1050 },
    enemies: [
      { type: NinjaType.Brute, position: { x: 2200, y: 1000 } },
      { type: NinjaType.Chaser, position: { x: 800, y: 900 } },
      { type: NinjaType.Chaser, position: { x: 1500, y: 700 } },
      { type: NinjaType.Patroller, position: { x: 500, y: 600 } },
      { type: NinjaType.Bomber, position: { x: 1800, y: 400 } },
    ],
    platforms: [
      { position: { x: 0, y: 1150 }, width: 2400, height: 50 },
      { position: { x: 300, y: 1050 }, width: 150, height: 30 },
      { position: { x: 600, y: 950 }, width: 150, height: 30 },
      { position: { x: 800, y: 850 }, width: 800, height: 40 },
      { position: { x: 400, y: 650 }, width: 300, height: 30 },
      { position: { x: 900, y: 550 }, width: 150, height: 30 },
      { position: { x: 1200, y: 450 }, width: 400, height: 30 },
      { position: { x: 1700, y: 450 }, width: 500, height: 30 },
    ],
    ammoPacks: [{ position: { x: 1000, y: 500 }, amount: 50 }],
    healthPacks: [{ position: { x: 100, y: 1100 }, amount: HEALTH_PACK_HEAL_AMOUNT }],
  },
];
