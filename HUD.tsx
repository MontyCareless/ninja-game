import React from 'react';
import { GameMode } from '../types';
import { PLAYER_DASH_COOLDOWN, PLAYER_MELEE_COOLDOWN } from '../constants';

interface HUDProps {
  health: number;
  ammo: number;
  score: number;
  level: number;
  wave?: number;
  gameMode: GameMode;
  dashCooldown: number;
  meleeCooldown: number;
}

const CooldownIcon: React.FC<{ label: string; icon: string; cooldown: number; maxCooldown: number;}> = ({ label, icon, cooldown, maxCooldown }) => {
    const cooldownPercent = (cooldown / maxCooldown) * 100;
    return (
        <div className="relative w-12 h-12 bg-gray-700 rounded-md flex items-center justify-center text-3xl border-2 border-gray-500">
            <div 
                className="absolute bottom-0 left-0 right-0 bg-black/70 transition-all duration-100"
                style={{ height: `${cooldownPercent}%`}}
            ></div>
            <span role="img" aria-label={label}>{icon}</span>
        </div>
    )
}

const HUD: React.FC<HUDProps> = ({ health, ammo, score, level, wave, gameMode, dashCooldown, meleeCooldown }) => {
  return (
    <div className="absolute top-0 left-0 right-0 p-4 text-white font-mono text-xl z-20 flex justify-between items-center pointer-events-none bg-black bg-opacity-40">
      <div className="flex items-center space-x-4">
        <div>
          <span>HEALTH: </span>
          <span className="font-bold text-green-400">{health}</span>
        </div>
        <div className="w-40 h-6 bg-gray-700 border-2 border-gray-500 rounded-sm overflow-hidden">
          <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${health}%` }}></div>
        </div>
        <div className="flex space-x-2">
            <CooldownIcon label="Dash Cooldown" icon="💨" cooldown={dashCooldown} maxCooldown={PLAYER_DASH_COOLDOWN} />
            <CooldownIcon label="Melee Cooldown" icon="⚔️" cooldown={meleeCooldown} maxCooldown={PLAYER_MELEE_COOLDOWN} />
        </div>
      </div>
      <div className="text-center">
        {gameMode === GameMode.Campaign ? (
            <div>LEVEL: <span className="font-bold text-yellow-400">{level}</span></div>
        ) : (
            <div>WAVE: <span className="font-bold text-red-500">{wave}</span></div>
        )}
        <div>SCORE: <span className="font-bold text-blue-400">{score}</span></div>
      </div>
      <div>
        <span>SHURIKENS: </span>
        <span className="font-bold text-orange-400">{ammo}</span>
      </div>
    </div>
  );
};

export default HUD;
