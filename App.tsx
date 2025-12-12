import React, { useState, useEffect, useCallback } from 'react';
import { GameState, GameStatus, Direction, Coordinate } from './types';
import { GRID_SIZE, INITIAL_SPEED, MIN_SPEED, SPEED_DECREMENT } from './constants';
import { useInterval } from './hooks/useInterval';
import GameBoard from './components/GameBoard';
import GameOverModal from './components/GameOverModal';
import { Play, Pause, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Trophy, Zap } from 'lucide-react';

const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];

const INITIAL_STATE: GameState = {
  snake: INITIAL_SNAKE,
  food: { x: 5, y: 5 },
  direction: Direction.UP,
  score: 0,
  highScore: 0,
  status: GameStatus.IDLE,
  speed: INITIAL_SPEED,
  deathReason: null,
};

// Helper to check if coordinate is in array
const isAtCoordinate = (coord: Coordinate, arr: Coordinate[]) => {
  return arr.some(seg => seg.x === coord.x && seg.y === coord.y);
};

// Helper to generate random food not on snake
const generateFood = (snake: Coordinate[]): Coordinate => {
  let newFood: Coordinate;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    if (!isAtCoordinate(newFood, snake)) {
      break;
    }
  }
  return newFood;
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('snake-highscore');
    return {
      ...INITIAL_STATE,
      highScore: saved ? parseInt(saved, 10) : 0,
    };
  });

  // Track next direction to prevent quick double-turn bugs
  const [nextDirection, setNextDirection] = useState<Direction>(Direction.UP);

  const startGame = () => {
    setGameState(prev => ({
      ...INITIAL_STATE,
      highScore: prev.highScore,
      status: GameStatus.PLAYING,
      food: generateFood(INITIAL_SNAKE), // Regenerate food to be safe
    }));
    setNextDirection(Direction.UP);
  };

  const pauseGame = () => {
    if (gameState.status === GameStatus.PLAYING) {
      setGameState(prev => ({ ...prev, status: GameStatus.PAUSED }));
    } else if (gameState.status === GameStatus.PAUSED) {
      setGameState(prev => ({ ...prev, status: GameStatus.PLAYING }));
    }
  };

  const handleDirectionChange = useCallback((newDir: Direction) => {
    setGameState(current => {
      // Prevent 180 turns on current state
      const isOpposite = 
        (newDir === Direction.UP && current.direction === Direction.DOWN) ||
        (newDir === Direction.DOWN && current.direction === Direction.UP) ||
        (newDir === Direction.LEFT && current.direction === Direction.RIGHT) ||
        (newDir === Direction.RIGHT && current.direction === Direction.LEFT);
      
      if (isOpposite) return current;

      // Queue the direction change for the next tick
      setNextDirection(newDir);
      return current;
    });
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          handleDirectionChange(Direction.UP);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          handleDirectionChange(Direction.DOWN);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          handleDirectionChange(Direction.LEFT);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          handleDirectionChange(Direction.RIGHT);
          break;
        case ' ':
          if (gameState.status === GameStatus.GAME_OVER || gameState.status === GameStatus.IDLE) {
            startGame();
          } else {
            pauseGame();
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.status, handleDirectionChange]);

  // Game Loop
  useInterval(() => {
    setGameState(prev => {
      if (prev.status !== GameStatus.PLAYING) return prev;

      const head = prev.snake[0];
      const currentDir = nextDirection; // Use the queued direction
      const newHead = { ...head };

      switch (currentDir) {
        case Direction.UP: newHead.y -= 1; break;
        case Direction.DOWN: newHead.y += 1; break;
        case Direction.LEFT: newHead.x -= 1; break;
        case Direction.RIGHT: newHead.x += 1; break;
      }

      // Check Walls
      if (
        newHead.x < 0 || 
        newHead.x >= GRID_SIZE || 
        newHead.y < 0 || 
        newHead.y >= GRID_SIZE
      ) {
        return { ...prev, status: GameStatus.GAME_OVER, deathReason: 'WALL' };
      }

      // Check Self Collision
      // We check against all segments except the tail, because the tail will move away unless we just ate
      // Actually simpler: just check all current segments. If we hit one, it's a crash.
      // Exception: If we are not eating, the tail moves, so hitting the *current* tail is fine if it moves away.
      // But standard simplified logic: check all.
      if (isAtCoordinate(newHead, prev.snake)) {
         // Rare edge case: if we are chasing our tail and don't eat, head goes into tail's old spot, which is safe.
         // But `isAtCoordinate` checks against current state. 
         // Let's keep it strict: if you hit any part of your body (even tail), you die. 
         // Most snake games allow following tail exactly, but it's tricky to code perfectly without separate phase.
         // Strict check:
         // If newHead equals the very last segment AND we are not eating, it's technically safe? 
         // Let's stick to standard strict collision for simplicity and robustness.
         // We must remove the LAST element from collision check if we aren't eating?
         // Let's just do strict check on snake excluding the very last segment if we are moving (not eating).
         
         // Actually, let's just do strict collision with current body.
         if (newHead.x !== prev.snake[prev.snake.length - 1].x || newHead.y !== prev.snake[prev.snake.length - 1].y) {
            return { ...prev, status: GameStatus.GAME_OVER, deathReason: 'SELF' };
         }
      }

      const newSnake = [newHead, ...prev.snake];
      let newScore = prev.score;
      let newFood = prev.food;
      let newSpeed = prev.speed;
      let newHighScore = prev.highScore;

      // Check Food
      if (newHead.x === prev.food.x && newHead.y === prev.food.y) {
        // Ate food: don't pop tail
        newScore += 1;
        newFood = generateFood(newSnake);
        newSpeed = Math.max(MIN_SPEED, prev.speed - SPEED_DECREMENT);
        
        if (newScore > newHighScore) {
          newHighScore = newScore;
          localStorage.setItem('snake-highscore', newHighScore.toString());
        }
      } else {
        // Didn't eat: pop tail
        newSnake.pop();
        
        // Post-pop collision check (for self-collision safety regarding tail)
        // If we didn't eat, and the new head hits the *remaining* body (which we just calculated by popping), we die.
        // But we already added head. So we check if head exists twice in newSnake.
        // Index 0 is head.
        const isSelfCollision = newSnake.slice(1).some(seg => seg.x === newHead.x && seg.y === newHead.y);
        if (isSelfCollision) {
           return { ...prev, status: GameStatus.GAME_OVER, deathReason: 'SELF' };
        }
      }

      return {
        ...prev,
        snake: newSnake,
        food: newFood,
        score: newScore,
        speed: newSpeed,
        highScore: newHighScore,
        direction: currentDir, // Update actual direction to match what we just moved
      };
    });
  }, gameState.status === GameStatus.PLAYING ? gameState.speed : null);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-green-900 rounded-full blur-[100px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] bg-blue-900 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-900/50 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="flex flex-col">
            <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Current Score</span>
            <span className="text-3xl font-display font-bold text-white">{gameState.score}</span>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex flex-col items-end">
                <span className="text-slate-400 text-xs font-bold tracking-wider uppercase flex items-center gap-1">
                  High Score <Trophy size={10} className="text-yellow-500" />
                </span>
                <span className="text-xl font-display font-bold text-yellow-500">{gameState.highScore}</span>
             </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="relative group">
           <GameBoard 
              gameState={gameState} 
              onDirectionChange={handleDirectionChange}
           />
           
           {/* Start Overlay (Idle) */}
           {gameState.status === GameStatus.IDLE && (
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-6 text-center">
               <h1 className="text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-2">NEON SNAKE</h1>
               <p className="text-slate-300 mb-8 max-w-[200px]">Use arrow keys or swipe to move. Eat the red orbs.</p>
               <button 
                 onClick={startGame}
                 className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-all hover:scale-110 shadow-[0_0_20px_rgba(34,197,94,0.5)]"
               >
                 <Play size={20} fill="currentColor" /> START GAME
               </button>
             </div>
           )}

           {/* Game Over Modal */}
           {gameState.status === GameStatus.GAME_OVER && (
             <GameOverModal gameState={gameState} onRestart={startGame} />
           )}
        </div>

        {/* Controls / Info */}
        <div className="flex justify-between items-center">
           <div className="text-slate-500 text-sm flex items-center gap-2">
              <Zap size={16} className={gameState.status === GameStatus.PLAYING ? "text-green-500 animate-pulse" : ""} />
              <span>Speed: {Math.max(1, Math.floor((INITIAL_SPEED - gameState.speed + 10) / 2))}</span>
           </div>

           <button 
             onClick={pauseGame}
             disabled={gameState.status === GameStatus.IDLE || gameState.status === GameStatus.GAME_OVER}
             className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
           >
             {gameState.status === GameStatus.PAUSED ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
           </button>
        </div>

        {/* Mobile D-Pad (Visible only on small screens usually, but we keep it responsive) */}
        <div className="grid grid-cols-3 gap-2 sm:hidden max-w-[200px] mx-auto pt-4">
           <div />
           <button 
             className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center active:bg-green-600 transition-colors"
             onPointerDown={(e) => { e.preventDefault(); handleDirectionChange(Direction.UP); }}
           >
             <ChevronUp size={28} />
           </button>
           <div />
           
           <button 
             className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center active:bg-green-600 transition-colors"
             onPointerDown={(e) => { e.preventDefault(); handleDirectionChange(Direction.LEFT); }}
           >
             <ChevronLeft size={28} />
           </button>
           <button 
             className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center active:bg-green-600 transition-colors"
             onPointerDown={(e) => { e.preventDefault(); handleDirectionChange(Direction.DOWN); }}
           >
             <ChevronDown size={28} />
           </button>
           <button 
             className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center active:bg-green-600 transition-colors"
             onPointerDown={(e) => { e.preventDefault(); handleDirectionChange(Direction.RIGHT); }}
           >
             <ChevronRight size={28} />
           </button>
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
           AI Commentary powered by Google Gemini
        </p>

      </div>
    </div>
  );
}