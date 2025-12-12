import React, { useRef, useEffect } from 'react';
import { GameState, GameStatus, Direction } from '../types';
import { GRID_SIZE, COLORS } from '../constants';

interface GameBoardProps {
  gameState: GameState;
  onDirectionChange: (dir: Direction) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, onDirectionChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);

  // Drawing Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate cell size based on actual canvas display size
    // We rely on the canvas internal resolution matching the logical size props
    const cellSize = canvas.width / GRID_SIZE;

    // Clear
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid (Optional, subtle)
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
    }
    ctx.stroke();

    // Draw Food
    ctx.fillStyle = COLORS.food;
    // Make food a circle
    const foodX = gameState.food.x * cellSize + cellSize / 2;
    const foodY = gameState.food.y * cellSize + cellSize / 2;
    ctx.beginPath();
    ctx.arc(foodX, foodY, cellSize / 2 - 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add a glow to food
    ctx.shadowBlur = 10;
    ctx.shadowColor = COLORS.food;
    ctx.fill();
    ctx.shadowBlur = 0; // Reset shadow

    // Draw Snake
    gameState.snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? COLORS.snakeHead : COLORS.snakeBody;
      
      const x = segment.x * cellSize;
      const y = segment.y * cellSize;
      
      // Slightly smaller than cell for defined segments
      const padding = 1;
      ctx.fillRect(
        x + padding, 
        y + padding, 
        cellSize - padding * 2, 
        cellSize - padding * 2
      );

      // Simple eyes for head
      if (index === 0) {
        ctx.fillStyle = '#000';
        const eyeSize = cellSize / 5;
        // Logic to position eyes based on direction could go here, 
        // sticking to simple center-offset for now
        ctx.fillRect(x + cellSize * 0.2, y + cellSize * 0.2, eyeSize, eyeSize);
        ctx.fillRect(x + cellSize * 0.6, y + cellSize * 0.2, eyeSize, eyeSize);
      }
    });

  }, [gameState]);

  // Touch Controls (Swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };

    const deltaX = touchEnd.x - touchStartRef.current.x;
    const deltaY = touchEnd.y - touchStartRef.current.y;

    // Minimum swipe distance
    if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) return;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal
      if (deltaX > 0) onDirectionChange(Direction.RIGHT);
      else onDirectionChange(Direction.LEFT);
    } else {
      // Vertical
      if (deltaY > 0) onDirectionChange(Direction.DOWN);
      else onDirectionChange(Direction.UP);
    }

    touchStartRef.current = null;
  };

  return (
    <div className="relative w-full max-w-md aspect-square rounded-xl overflow-hidden shadow-2xl shadow-green-900/20 border border-slate-700">
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        className="w-full h-full block"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      
      {/* Pause Overlay */}
      {gameState.status === GameStatus.PAUSED && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <p className="text-3xl font-display text-white tracking-widest animate-pulse">PAUSED</p>
        </div>
      )}
    </div>
  );
};

export default GameBoard;