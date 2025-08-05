export interface Vector2D {
  x: number;
  y: number;
}

export interface Controls {
  keys: Set<string>;
  mouse: {
    position: Vector2D;
    isDown: boolean;
    isRightDown: boolean;
  };
}

export enum NinjaType {
  Patroller,
  Chaser,
  Brute,
  Specter,
  Oni,
  Sniper,
  Stealth,
  Bomber,
}

export interface GameObject {
  id: string;
  position: Vector2D;
  width: number;
  height: number;
}

export interface DynamicGameObject extends GameObject {
  velocity: Vector2D;
  onGround: boolean;
}

export interface Player extends DynamicGameObject {
  angle: number; // for aiming
  facing: 'left' | 'right';
  health: number;
  // New player state
  doubleJumpUsed: boolean;
  isDashing: boolean;
  dashTimer: number; // For duration
  dashCooldown: number;
  isMeleeAttacking: boolean;
  meleeTimer: number; // For duration
  meleeCooldown: number;
}

export interface Enemy extends DynamicGameObject {
  type: NinjaType;
  health: number;
  speed: number;
  value: number;
  facing: 'left' | 'right';
  attackCooldown?: number;
}

export interface Bullet extends GameObject {
  angle: number;
}

export interface Bomb extends DynamicGameObject {
  fuse: number;
  health: number;
}

export interface Explosion extends GameObject {
  lifetime: number;
  radius: number;
}

export interface Platform {
  id: string;
  position: Vector2D;
  width: number;
  height: number;
}

export interface AmmoPack extends GameObject {
  amount: number;
}

export interface HealthPack extends GameObject {
  amount: number;
}

export interface LevelData {
  level: number;
  mapDimensions: { width: number; height: number };
  initialPlayerPosition: Vector2D;
  enemies: Array<{ type: NinjaType; position: Vector2D }>;
  platforms: Array<{ position: Vector2D; width: number; height: number }>;
  ammoPacks: Array<{ position: Vector2D; amount: number }>;
  healthPacks?: Array<{ position: Vector2D; amount: number }>;
}

export enum GameState {
  StartScreen,
  Playing,
  LevelComplete,
  GameOver,
}

export enum GameMode {
  Campaign,
  Survival,
}