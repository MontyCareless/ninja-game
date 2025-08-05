import React, { useState, useCallback, useEffect } from 'react';
import { GameState, GameMode, NinjaType, LevelData } from './types';
import { LEVELS, INITIAL_AMMO, PLAYER_HEALTH, SURVIVAL_LEVEL, PLAYER_DASH_COOLDOWN, PLAYER_MELEE_COOLDOWN } from './constants';
import GameScreen from './components/GameScreen';
import HUD from './components/HUD';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.StartScreen);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.Campaign);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentWave, setCurrentWave] = useState(1);
  const [maxLevelReached, setMaxLevelReached] = useState(() => {
    try {
      const savedMaxLevel = localStorage.getItem('maxLevelReached');
      return savedMaxLevel ? parseInt(savedMaxLevel, 10) : 1;
    } catch (error) {
      console.error("Could not parse maxLevelReached from localStorage", error);
      return 1;
    }
  });
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  
  const [hudStats, setHudStats] = useState({
    health: PLAYER_HEALTH,
    ammo: INITIAL_AMMO,
    score: 0,
    dashCooldown: 0,
    meleeCooldown: 0,
  });
  
  useEffect(() => {
      try {
        localStorage.setItem('maxLevelReached', maxLevelReached.toString());
      } catch(error) {
        console.error("Could not save maxLevelReached to localStorage", error);
      }
  }, [maxLevelReached]);

  const startGame = (mode: GameMode, level = 1) => {
    setGameMode(mode);
    setScore(0);
    setGameWon(false);
    setHudStats({ health: PLAYER_HEALTH, ammo: INITIAL_AMMO, score: 0, dashCooldown: 0, meleeCooldown: 0 });

    if (mode === GameMode.Campaign) {
      setCurrentLevel(level);
    } else {
      setCurrentWave(1);
    }
    setGameState(GameState.Playing);
  };
  
  const startNextLevel = () => {
     if (gameMode === GameMode.Campaign) {
        setGameState(GameState.Playing);
     }
  };

  const handleLevelComplete = useCallback((newScore: number) => {
    setScore(newScore);
    if (gameMode === GameMode.Campaign) {
        const nextLevel = currentLevel + 1;
        if (nextLevel > maxLevelReached) {
          setMaxLevelReached(nextLevel);
        }
        
        if (currentLevel < LEVELS.length) {
          setCurrentLevel(prev => prev + 1);
          setGameState(GameState.LevelComplete);
        } else {
          setFinalScore(newScore);
          setGameWon(true);
          setGameState(GameState.GameOver);
        }
    } else { // Survival Mode
        setCurrentWave(prev => prev + 1);
        setHudStats(prev => ({...prev, ammo: prev.ammo + 20})); // bonus ammo
        setGameState(GameState.Playing); // Immediately start next wave
    }
  }, [currentLevel, maxLevelReached, gameMode]);
  
  const handleGameOver = useCallback((finalScoreValue: number) => {
    setFinalScore(finalScoreValue);
    setGameWon(false);
    setGameState(GameState.GameOver);
  }, []);
  
  const updateStats = useCallback((stats: { health: number; ammo: number; score: number; dashCooldown: number; meleeCooldown: number; }) => {
    setHudStats(stats);
  }, []);
  
  const goToMenu = () => {
    setGameState(GameState.StartScreen);
  }

  const generateSurvivalEnemies = (wave: number): LevelData['enemies'] => {
      const enemies = [];
      const { width, height } = SURVIVAL_LEVEL.mapDimensions;
      
      const patrollerCount = Math.floor(wave * 1.2);
      const chaserCount = Math.floor(wave / 1.5);
      const specterCount = Math.floor(wave / 3);
      const bruteCount = Math.floor(wave / 4);
      const oniCount = Math.floor(wave / 6);
      const bomberCount = wave > 2 ? Math.floor((wave-2) / 2) : 0;

      for(let i=0; i < patrollerCount; i++) enemies.push({type: NinjaType.Patroller, position: {x: Math.random() * (width - 100) + 50, y: height - 100}});
      for(let i=0; i < chaserCount; i++) enemies.push({type: NinjaType.Chaser, position: {x: Math.random() * (width - 100) + 50, y: height - 100}});
      for(let i=0; i < specterCount; i++) enemies.push({type: NinjaType.Specter, position: {x: Math.random() * (width - 100) + 50, y: Math.random() * (height - 200)}});
      for(let i=0; i < bruteCount; i++) enemies.push({type: NinjaType.Brute, position: {x: Math.random() * (width - 100) + 50, y: height - 120}});
      for(let i=0; i < oniCount; i++) enemies.push({type: NinjaType.Oni, position: {x: Math.random() * (width - 100) + 50, y: height - 150}});
      for(let i=0; i < bomberCount; i++) enemies.push({type: NinjaType.Bomber, position: {x: Math.random() * (width - 100) + 50, y: height - 100}});
      
      return enemies;
  }

  const renderContent = () => {
    switch (gameState) {
      case GameState.StartScreen:
        return (
          <div className="text-center text-white">
            <h1 className="text-6xl font-bold font-mono mb-4 text-red-500 drop-shadow-[0_4px_2px_rgba(0,0,0,0.5)]">NINJA RAMPAGE</h1>
            <p className="text-xl mb-6 max-w-2xl mx-auto">
                <span className="font-bold">CONTROLS:</span><br/>
                <span className="text-yellow-300 font-bold">A/D</span> or <span className="text-yellow-300 font-bold">←/→</span> to Move. <span className="text-yellow-300 font-bold">W</span> or <span className="text-yellow-300 font-bold">↑</span> to Jump/Double Jump.<br/>
                <span className="text-yellow-300 font-bold">Shift</span> to Dash. <span className="text-yellow-300 font-bold">Mouse</span> to Aim.<br/>
                <span className="text-yellow-300 font-bold">Left-Click</span> to Throw. <span className="text-yellow-300 font-bold">Right-Click</span> for Melee.
            </p>
            <div className="flex justify-center gap-8">
                <button
                  onClick={() => startGame(GameMode.Survival)}
                  className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-2xl rounded-lg shadow-lg transform hover:scale-105 transition-transform"
                >
                  Survival Mode
                </button>
            </div>
            <div className="mt-8">
              <h2 className="text-3xl font-mono mb-4">Campaign Mode</h2>
              <div className="flex justify-center gap-4 flex-wrap">
                {LEVELS.map(level => (
                  <button
                    key={level.level}
                    disabled={level.level > maxLevelReached}
                    onClick={() => startGame(GameMode.Campaign, level.level)}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold text-xl rounded-lg shadow-md transform hover:scale-105 transition-transform disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Level {level.level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case GameState.LevelComplete:
        return (
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold font-mono mb-4 text-blue-400">Level {currentLevel - 1} Complete!</h1>
            <p className="text-2xl mb-2">Current Score: {score}</p>
            <p className="text-xl mb-8">The next challenge awaits...</p>
            <button
              onClick={startNextLevel}
              className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold text-2xl rounded-lg shadow-lg transform hover:scale-105 transition-transform mr-4"
            >
              Next Level
            </button>
            <button
              onClick={goToMenu}
              className="px-8 py-4 bg-gray-500 hover:bg-gray-600 text-white font-bold text-2xl rounded-lg shadow-lg transform hover:scale-105 transition-transform"
            >
              Main Menu
            </button>
          </div>
        );
      case GameState.GameOver:
        return (
          <div className="text-center text-white">
            <h1 className="text-6xl font-bold font-mono mb-4 text-red-500">
                {gameWon ? "VICTORY!" : "YOU DIED"}
            </h1>
            <p className="text-3xl mb-2">Final Score: <span className="font-bold text-yellow-300">{finalScore}</span></p>
            {gameMode === GameMode.Survival && <p className="text-2xl mb-8">You survived until Wave: <span className="font-bold text-red-400">{currentWave}</span></p>}
            <button
              onClick={goToMenu}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-2xl rounded-lg shadow-lg transform hover:scale-105 transition-transform"
            >
              Main Menu
            </button>
          </div>
        );
      case GameState.Playing:
        let levelData: LevelData;
        if (gameMode === GameMode.Campaign) {
            levelData = LEVELS[currentLevel - 1];
        } else {
            levelData = {
                ...SURVIVAL_LEVEL,
                level: currentWave,
                enemies: generateSurvivalEnemies(currentWave),
                ammoPacks: currentWave % 3 === 0 ? [{ position: { x: SURVIVAL_LEVEL.mapDimensions.width / 2, y: SURVIVAL_LEVEL.mapDimensions.height / 2 }, amount: 25 }] : [],
                healthPacks: currentWave > 1 && currentWave % 4 === 0 ? [{ position: { x: Math.random() * (SURVIVAL_LEVEL.mapDimensions.width - 200) + 100, y: SURVIVAL_LEVEL.mapDimensions.height - 100 }, amount: 25 }] : [],
            }
        }
        
        if (!levelData) {
            handleGameOver(score);
            return null;
        }
        return (
          <>
            <HUD
              health={hudStats.health}
              ammo={hudStats.ammo}
              score={hudStats.score}
              level={currentLevel}
              wave={currentWave}
              gameMode={gameMode}
              dashCooldown={hudStats.dashCooldown}
              meleeCooldown={hudStats.meleeCooldown}
            />
            <GameScreen
              key={gameMode === GameMode.Campaign ? currentLevel : `survival-${currentWave}`}
              levelData={levelData}
              initialAmmo={hudStats.ammo}
              initialScore={score}
              onLevelComplete={handleLevelComplete}
              onGameOver={handleGameOver}
              updateStats={updateStats}
            />
          </>
        );
    }
  };

  return (
    <main className="w-screen h-screen bg-gray-900 flex items-center justify-center font-sans overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20"></div>
        {renderContent()}
        <div className="absolute inset-0 pointer-events-nonecrt-lines"></div>
        <style>{`
          .crt-lines::before {
            content: " ";
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            z-index: 2;
            background-size: 100% 4px, 3px 100%;
            pointer-events: none;
          }
           @keyframes spin {
               from { transform: rotate(0deg); }
               to { transform: rotate(360deg); }
           }
           .shuriken {
              display: inline-block;
              animation: spin 0.4s linear infinite;
           }
           @keyframes flicker {
            0% { opacity: 0.27861; } 5% { opacity: 0.34769; } 10% { opacity: 0.23604; } 15% { opacity: 0.90626; } 20% { opacity: 0.18128; } 25% { opacity: 0.83891; } 30% { opacity: 0.65583; } 35% { opacity: 0.67807; } 40% { opacity: 0.26559; } 45% { opacity: 0.84693; } 50% { opacity: 0.96019; } 55% { opacity: 0.08594; } 60% { opacity: 0.20313; } 65% { opacity: 0.71988; } 70% { opacity: 0.53455; } 75% { opacity: 0.37288; } 80% { opacity: 0.71428; } 85% { opacity: 0.70428; } 90% { opacity: 0.7003; } 95% { opacity: 0.36108; } 100% { opacity: 0.24387; }
          }
          .bg-grid-pattern {
            background-image:
              linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
            background-size: 50px 50px;
          }
        `}</style>
    </main>
  );
};

export default App;
