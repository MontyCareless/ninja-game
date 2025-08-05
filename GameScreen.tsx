import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LevelData, Player, Enemy, Bullet, Platform, AmmoPack, HealthPack, Bomb, Explosion, Vector2D, DynamicGameObject, NinjaType, GameObject } from '../types';
import { useGameLoop } from '../hooks/useGameLoop';
import { usePlayerControls } from '../hooks/usePlayerControls';
import { 
    PLAYER_HORIZONTAL_SPEED, PLAYER_JUMP_FORCE, PLAYER_HEALTH, PLAYER_WIDTH, PLAYER_HEIGHT, 
    BULLET_SPEED, BULLET_SIZE, NINJA_STATS, SHOOT_COOLDOWN, GRAVITY, MAX_FALL_SPEED, FRICTION,
    PLAYER_DOUBLE_JUMP_FORCE, PLAYER_DASH_SPEED, PLAYER_DASH_DURATION, PLAYER_DASH_COOLDOWN,
    PLAYER_MELEE_RANGE, PLAYER_MELEE_DAMAGE, PLAYER_MELEE_DURATION, PLAYER_MELEE_COOLDOWN,
    BOMB_FUSE_TIME, BOMB_THROW_VELOCITY, EXPLOSION_RADIUS, EXPLOSION_DURATION, EXPLOSION_DAMAGE, HEALTH_PACK_HEAL_AMOUNT
} from '../constants';

interface GameScreenProps {
  levelData: LevelData;
  initialAmmo: number;
  initialScore: number;
  onLevelComplete: (score: number) => void;
  onGameOver: (score: number) => void;
  updateStats: (stats: { health: number; ammo: number; score: number; dashCooldown: number; meleeCooldown: number; }) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ levelData, initialAmmo, initialScore, onLevelComplete, onGameOver, updateStats }) => {
  const [player, setPlayer] = useState<Player>({
    id: 'player',
    position: levelData.initialPlayerPosition,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    velocity: { x: 0, y: 0 },
    angle: 0,
    facing: 'right',
    health: PLAYER_HEALTH,
    onGround: false,
    doubleJumpUsed: false,
    isDashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    isMeleeAttacking: false,
    meleeTimer: 0,
    meleeCooldown: 0,
  });
  const [enemies, setEnemies] = useState<Enemy[]>(() =>
    levelData.enemies.map((z, i) => ({
      id: `enemy-${i}-${Date.now()}`,
      position: z.position,
      type: z.type,
      velocity: { x: 0, y: 0 },
      facing: 'left',
      onGround: false,
      attackCooldown: 3000 + Math.random() * 2000,
      ...NINJA_STATS[z.type],
    }))
  );
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [bombs, setBombs] = useState<Bomb[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [platforms] = useState<Platform[]>(() =>
    levelData.platforms.map((o, i) => ({ id: `platform-${i}-${Date.now()}`, ...o }))
  );
  const [ammoPacks, setAmmoPacks] = useState<AmmoPack[]>(() =>
    levelData.ammoPacks.map((a, i) => ({ id: `ammo-${i}-${Date.now()}`, position: a.position, amount: a.amount, width: 30, height: 30 }))
  );
  const [healthPacks, setHealthPacks] = useState<HealthPack[]>(() =>
    (levelData.healthPacks || []).map((h, i) => ({ id: `health-${i}-${Date.now()}`, position: h.position, amount: h.amount, width: 30, height: 30 }))
  );

  const [ammo, setAmmo] = useState(initialAmmo);
  const [score, setScore] = useState(initialScore);
  const lastShotTime = useRef(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const controls = usePlayerControls();
  const jumpKeyPressedRef = useRef(false);
  
  const checkAABBCollision = (obj1: GameObject, obj2: GameObject) => {
    return (
        obj1.position.x < obj2.position.x + obj2.width &&
        obj1.position.x + obj1.width > obj2.position.x &&
        obj1.position.y < obj2.position.y + obj2.height &&
        obj1.position.y + obj1.height > obj2.position.y
    );
  };

  const applyPhysics = useCallback((obj: DynamicGameObject, deltaTime: number): DynamicGameObject => {
      let newObj = { ...obj };
      
      const isSpecter = 'type' in newObj && newObj.type === NinjaType.Specter;
      if (!isSpecter) {
        newObj.velocity.y += GRAVITY;
        if (newObj.velocity.y > MAX_FALL_SPEED) newObj.velocity.y = MAX_FALL_SPEED;
      }

      let nextPos = {
        x: newObj.position.x + newObj.velocity.x * (deltaTime / 16.67),
        y: newObj.position.y + newObj.velocity.y * (deltaTime / 16.67)
      };

      newObj.onGround = false;

      if (!isSpecter) {
          for (const platform of platforms) {
              const isColliding = checkAABBCollision({ ...newObj, position: nextPos }, platform);
              if (isColliding) {
                  const prevBottom = newObj.position.y + newObj.height;
                  const isFalling = newObj.velocity.y > 0;
                  if (isFalling && prevBottom <= platform.position.y) {
                      nextPos.y = platform.position.y - newObj.height;
                      newObj.velocity.y = 0;
                      newObj.onGround = true;
                      if('doubleJumpUsed' in newObj) (newObj as Player).doubleJumpUsed = false;
                  } else {
                      if ((newObj.velocity.x > 0 && newObj.position.x + newObj.width <= platform.position.x) || (newObj.velocity.x < 0 && newObj.position.x >= platform.position.x + platform.width)) {
                        nextPos.x = newObj.position.x;
                        if ('type' in newObj && newObj.type === NinjaType.Patroller) {
                            newObj.velocity.x = 0;
                            (newObj as Enemy).facing = (newObj as Enemy).facing === 'left' ? 'right' : 'left';
                        }
                      }
                      if(newObj.velocity.y < 0 && newObj.position.y >= platform.position.y + platform.height){
                         nextPos.y = newObj.position.y;
                         newObj.velocity.y = 0;
                      }
                  }
              }
          }
      }

      newObj.position = nextPos;
      newObj.position.x = Math.max(0, Math.min(levelData.mapDimensions.width - newObj.width, newObj.position.x));
      if (newObj.position.y > levelData.mapDimensions.height) {
          if ('health' in newObj) (newObj as any).health = 0;
      }
      return newObj;
  }, [platforms, levelData.mapDimensions]);
  
  const gameLoopCallback = useCallback((deltaTime: number) => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    // --- Timers ---
    setPlayer(p => ({
        ...p,
        dashCooldown: Math.max(0, p.dashCooldown - deltaTime),
        meleeCooldown: Math.max(0, p.meleeCooldown - deltaTime),
        dashTimer: Math.max(0, p.dashTimer - deltaTime),
        meleeTimer: Math.max(0, p.meleeTimer - deltaTime),
    }));
    
    const isJumpKeyDown = controls.keys.has('w') || controls.keys.has('arrowup');
    const justPressedJump = isJumpKeyDown && !jumpKeyPressedRef.current;
    jumpKeyPressedRef.current = isJumpKeyDown;

    // --- Player Logic ---
    setPlayer(p => {
      let newPlayer = { ...p };

      if (newPlayer.dashTimer > 0) { // Dashing
          newPlayer.velocity.x = (newPlayer.facing === 'right' ? 1 : -1) * PLAYER_DASH_SPEED;
          newPlayer.velocity.y = 0;
      } else { // Normal movement
        if (controls.keys.has('a') || controls.keys.has('arrowleft')) {
            newPlayer.velocity.x = -PLAYER_HORIZONTAL_SPEED;
            newPlayer.facing = 'left';
        } else if (controls.keys.has('d') || controls.keys.has('arrowright')) {
            newPlayer.velocity.x = PLAYER_HORIZONTAL_SPEED;
            newPlayer.facing = 'right';
        } else {
            newPlayer.velocity.x *= FRICTION;
            if (Math.abs(newPlayer.velocity.x) < 0.1) newPlayer.velocity.x = 0;
        }
      }

      // Jump & Double Jump
      if (justPressedJump) {
          if (newPlayer.onGround) {
              newPlayer.velocity.y = -PLAYER_JUMP_FORCE;
              newPlayer.onGround = false;
              newPlayer.doubleJumpUsed = false;
          } else if (!newPlayer.doubleJumpUsed) {
              newPlayer.velocity.y = -PLAYER_DOUBLE_JUMP_FORCE;
              newPlayer.doubleJumpUsed = true;
          }
      }
      
      // Dash
      if (controls.keys.has('shift') && newPlayer.dashCooldown <= 0 && newPlayer.dashTimer <= 0) {
          newPlayer.dashTimer = PLAYER_DASH_DURATION;
          newPlayer.dashCooldown = PLAYER_DASH_COOLDOWN;
      }

      // Aiming
      const rect = gameArea.getBoundingClientRect();
      const playerScreenX = rect.left + rect.width / 2;
      const playerScreenY = rect.top + rect.height / 2;
      newPlayer.angle = Math.atan2(controls.mouse.position.y - playerScreenY, controls.mouse.position.x - playerScreenX);
      
      return applyPhysics(newPlayer, deltaTime) as Player;
    });

    // --- Shooting & Melee ---
    const now = Date.now();
    if (controls.mouse.isDown && ammo > 0 && now - lastShotTime.current > SHOOT_COOLDOWN && player.meleeTimer <= 0) {
      lastShotTime.current = now;
      setAmmo(a => a - 1);
      setBullets(b => [...b, {
        id: `bullet-${now}`,
        position: {x: player.position.x + player.width/2, y: player.position.y + player.height/2},
        width: BULLET_SIZE,
        height: BULLET_SIZE,
        angle: player.angle
      }]);
    }
    if (controls.mouse.isRightDown && player.meleeCooldown <= 0) {
        setPlayer(p => ({...p, meleeTimer: PLAYER_MELEE_DURATION, meleeCooldown: PLAYER_MELEE_COOLDOWN }));

        const meleeHitbox: GameObject = {
            id: `player-melee-hitbox-${Date.now()}`,
            position: { x: player.position.x + (player.facing === 'right' ? player.width : -PLAYER_MELEE_RANGE), y: player.position.y },
            width: PLAYER_MELEE_RANGE,
            height: player.height
        };

        setEnemies(currentEnemies => currentEnemies.map(enemy => {
            if (checkAABBCollision(meleeHitbox, enemy)) {
                return { ...enemy, health: enemy.health - PLAYER_MELEE_DAMAGE };
            }
            return enemy;
        }));
    }
    
    // --- Update Bullets ---
    setBullets(prev => prev.map(b => ({ ...b, position: { x: b.position.x + Math.cos(b.angle) * BULLET_SPEED, y: b.position.y + Math.sin(b.angle) * BULLET_SPEED }})).filter(b => b.position.x > 0 && b.position.x < levelData.mapDimensions.width && b.position.y > 0 && b.position.y < levelData.mapDimensions.height && !platforms.some(p => checkAABBCollision(b, p))));

    // --- Update Bombs & Explosions ---
    setBombs(prev => prev.map(b => applyPhysics(b, deltaTime) as Bomb).filter(b => b.health > 0));
    setBombs(prev => {
        const newExplosions: Explosion[] = [];
        const remainingBombs = prev.filter(b => {
            b.fuse -= deltaTime;
            if (b.fuse <= 0) {
                newExplosions.push({
                    id: `explosion-${Date.now()}`,
                    position: {x: b.position.x + b.width / 2 - EXPLOSION_RADIUS, y: b.position.y + b.height / 2 - EXPLOSION_RADIUS},
                    width: EXPLOSION_RADIUS * 2,
                    height: EXPLOSION_RADIUS * 2,
                    lifetime: EXPLOSION_DURATION,
                    radius: EXPLOSION_RADIUS,
                });
                return false;
            }
            return true;
        });
        if (newExplosions.length > 0) setExplosions(ex => [...ex, ...newExplosions]);
        return remainingBombs;
    });
    setExplosions(prev => prev.map(e => ({...e, lifetime: e.lifetime - deltaTime})).filter(e => e.lifetime > 0));

    // --- Update Enemies ---
    setEnemies(prevEnemies => {
      let newBullets = [...bullets];
      let newScore = score;
      const updatedEnemies = prevEnemies.map(enemy => {
        let newEnemy = { ...enemy };
        if (newEnemy.attackCooldown) newEnemy.attackCooldown -= deltaTime;
        const directionToPlayerX = player.position.x - newEnemy.position.x;
        const distanceToPlayer = Math.abs(directionToPlayerX);
        newEnemy.facing = directionToPlayerX > 0 ? 'right' : 'left';
        
        switch(newEnemy.type) {
            case NinjaType.Chaser:
            case NinjaType.Brute:
            case NinjaType.Oni:
                newEnemy.velocity.x = Math.sign(directionToPlayerX) * newEnemy.speed;
                break;
            case NinjaType.Bomber:
                if (distanceToPlayer > 500) newEnemy.velocity.x = Math.sign(directionToPlayerX) * newEnemy.speed;
                else if (distanceToPlayer < 300) newEnemy.velocity.x = -Math.sign(directionToPlayerX) * newEnemy.speed;
                else newEnemy.velocity.x = 0;
                
                if (newEnemy.attackCooldown != null && newEnemy.attackCooldown <= 0) {
                    setBombs(b => [...b, { id: `bomb-${Date.now()}`, position: {...newEnemy.position}, width: 20, height: 20, velocity: {x: (newEnemy.facing === 'right' ? 1 : -1) * BOMB_THROW_VELOCITY.x, y: BOMB_THROW_VELOCITY.y}, onGround: false, fuse: BOMB_FUSE_TIME, health: 1 }]);
                    newEnemy.attackCooldown = 3000 + Math.random() * 2000;
                }
                break;
            case NinjaType.Specter:
                const dist = Math.sqrt(directionToPlayerX*directionToPlayerX + (player.position.y - newEnemy.position.y)*(player.position.y - newEnemy.position.y));
                if (dist > 0) {
                    newEnemy.velocity.x = (directionToPlayerX / dist) * newEnemy.speed;
                    newEnemy.velocity.y = ((player.position.y - newEnemy.position.y) / dist) * newEnemy.speed;
                }
                break;
            case NinjaType.Patroller:
                if (newEnemy.onGround) newEnemy.velocity.x = newEnemy.facing === 'right' ? newEnemy.speed : -newEnemy.speed;
                break;
        }
        
        newEnemy = applyPhysics(newEnemy, deltaTime) as Enemy;

        if (checkAABBCollision(player, newEnemy) && player.dashTimer <= 0) {
          setPlayer(p => ({ ...p, health: Math.max(0, p.health - 0.5) }));
        }

        return newEnemy;

      }).filter(enemy => {
        if (enemy.health <= 0) { newScore += enemy.value; return false; }
        const hitBulletIndex = newBullets.findIndex(b => checkAABBCollision(b, enemy));
        if (hitBulletIndex > -1) {
          enemy.health -= 1;
          newBullets.splice(hitBulletIndex, 1);
          if (enemy.health <= 0) { newScore += enemy.value; return false; }
        }
        return true;
      });
      setBullets(newBullets);
      setScore(newScore);
      return updatedEnemies;
    });

    // --- Post-Enemy, Pre-Player-Update Collision Checks ---
    setPlayer(p => {
        let newPlayer = {...p};
        // Ammo pack collision
        setAmmoPacks(prev => prev.filter(pack => {
            if(checkAABBCollision(p, pack)) { setAmmo(a => a + pack.amount); return false; } return true;
        }));

        // Health pack collision
        setHealthPacks(prev => prev.filter(pack => {
            if(checkAABBCollision(p, pack)) { newPlayer.health = Math.min(PLAYER_HEALTH, p.health + pack.amount); return false; } return true;
        }));

        // Explosion collision
        explosions.forEach(exp => {
            const playerCenterX = p.position.x + p.width / 2;
            const playerCenterY = p.position.y + p.height / 2;
            const expCenterX = exp.position.x + exp.width / 2;
            const expCenterY = exp.position.y + exp.height / 2;

            const dist = Math.sqrt(Math.pow(playerCenterX - expCenterX, 2) + Math.pow(playerCenterY - expCenterY, 2));
            if(dist < exp.radius + (p.width / 2) && p.dashTimer <= 0) {
                newPlayer.health = Math.max(0, p.health - EXPLOSION_DAMAGE);
            }
        });

        return newPlayer;
    });

  }, [controls, player, ammo, score, bullets, bombs, explosions, levelData, platforms, applyPhysics]);

  useGameLoop(gameLoopCallback);

  useEffect(() => {
    updateStats({ health: Math.round(player.health), ammo, score, dashCooldown: player.dashCooldown, meleeCooldown: player.meleeCooldown });
    if (player.health <= 0) {
      onGameOver(score);
    } else if (enemies.length === 0 && levelData.enemies.length > 0) { // Check initial enemies length to prevent auto-complete on empty levels
      onLevelComplete(score);
    }
  }, [player.health, player.dashCooldown, player.meleeCooldown, ammo, score, enemies.length, onGameOver, onLevelComplete, updateStats, levelData.enemies.length]);

  const viewportWidth = gameAreaRef.current?.clientWidth || window.innerWidth;
  const viewportHeight = gameAreaRef.current?.clientHeight || window.innerHeight;

  const worldStyle = {
    '--world-x': `${-(player.position.x - viewportWidth / 2)}px`,
    '--world-y': `${-(player.position.y - viewportHeight / 2)}px`,
  } as React.CSSProperties;

  return (
    <div ref={gameAreaRef} className="w-full h-full bg-gray-900 cursor-crosshair overflow-hidden relative" style={worldStyle}>
      <div className="absolute top-0 left-0" style={{ transform: `translate(var(--world-x), var(--world-y))` }}>
        <div className="absolute bg-grid-pattern" style={{ width: levelData.mapDimensions.width, height: levelData.mapDimensions.height, background: 'linear-gradient(to bottom, #2c3e50, #34495e)'}}></div>
        
        {platforms.map(o => ( <div key={o.id} className="absolute bg-gray-700 border-b-4 border-gray-800" style={{left: `${o.position.x}px`, top: `${o.position.y}px`, width: `${o.width}px`, height: `${o.height}px`}}></div> ))}
        {ammoPacks.map(a => ( <div key={a.id} className="absolute flex items-center justify-center text-3xl" style={{ left: `${a.position.x}px`, top: `${a.position.y}px`, width: `${a.width}px`, height: `${a.height}px` }}>💰</div> ))}
        {healthPacks.map(h => ( <div key={h.id} className="absolute flex items-center justify-center text-3xl" style={{ left: `${h.position.x}px`, top: `${h.position.y}px`, width: `${h.width}px`, height: `${h.height}px` }}>❤️</div> ))}
        {bombs.map(b => (<div key={b.id} className="absolute rounded-full bg-black border-2 border-gray-400 flex justify-center items-start" style={{ left: `${b.position.x}px`, top: `${b.position.y}px`, width: `${b.width}px`, height: `${b.height}px` }}><div className="h-1/2 w-px bg-yellow-300"></div></div>))}
        {explosions.map(e => (<div key={e.id} className="absolute rounded-full bg-orange-500/50" style={{ left: `${e.position.x}px`, top: `${e.position.y}px`, width: `${e.width}px`, height: `${e.height}px` }}></div>))}
        
        {enemies.map(e => (
          <div key={e.id} className={`absolute flex items-center justify-center rounded-sm border-2 border-black ${NINJA_STATS[e.type].color}`} style={{left: `${e.position.x}px`, top: `${e.position.y}px`, width: `${e.width}px`, height: `${e.height}px`, transform: `scaleX(${e.facing === 'right' ? 1 : -1})`}}>
             <div className="w-1/2 h-4 bg-gray-200" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}></div>
          </div>
        ))}

        {bullets.map(b => ( <div key={b.id} className="absolute text-yellow-400 text-2xl shuriken" style={{left: `${b.position.x}px`, top: `${b.position.y}px`, width: `${b.width}px`, height: `${b.height}px`}}>🌟</div> ))}
        
        {/* Player rendering */}
        <div className="absolute" style={{left: `${player.position.x}px`, top: `${player.position.y}px`, width: `${player.width}px`, height: `${player.height}px`, transform: `scaleX(${player.facing === 'right' ? 1 : -1})`}}>
            {/* Dash trail */}
            {player.dashTimer > 0 && <div className="absolute inset-0 bg-indigo-300/50 rounded-sm" style={{transform: `scaleX(${player.facing === 'right' ? 2 : -2})`, transformOrigin: 'center'}}></div>}
            
            <div className="w-full h-full bg-indigo-500 rounded-sm flex items-center justify-center text-white font-bold text-2xl border-2 border-indigo-300 opacity-100">
                🥷
            </div>

            {/* Melee attack visual */}
            {player.meleeTimer > 0 && (
                <div className="absolute top-0 w-[70px] h-full" style={{ left: player.facing === 'right' ? '100%' : `-${PLAYER_MELEE_RANGE}px` }}>
                    <div className="w-full h-full border-r-4 border-t-4 border-b-4 border-white/80 rounded-r-full" style={{transform: player.facing === 'left' ? 'scaleX(-1)' : ''}}></div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default GameScreen;