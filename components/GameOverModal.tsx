import React, { useEffect, useState } from 'react';
import { RefreshCw, Play, Trophy } from 'lucide-react';
import { GameState, AICommentary } from '../types';
import { getGameCommentary } from '../services/geminiService';

interface GameOverModalProps {
  gameState: GameState;
  onRestart: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ gameState, onRestart }) => {
  const [commentary, setCommentary] = useState<AICommentary>({ text: '', loading: true });

  useEffect(() => {
    let isMounted = true;
    
    const fetchCommentary = async () => {
      setCommentary({ text: '', loading: true });
      const text = await getGameCommentary(gameState.score, gameState.deathReason);
      if (isMounted) {
        setCommentary({ text, loading: false });
      }
    };

    fetchCommentary();

    return () => { isMounted = false; };
  }, [gameState.score, gameState.deathReason]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center">
        <h2 className="text-4xl font-display text-red-500 mb-2 drop-shadow-md">GAME OVER</h2>
        
        <div className="my-6 space-y-2">
          <div className="flex justify-center items-end gap-2 text-slate-300">
             <span className="text-sm uppercase tracking-wider">Score</span>
             <span className="text-4xl font-bold text-white leading-none">{gameState.score}</span>
          </div>
          {gameState.score >= gameState.highScore && gameState.score > 0 && (
             <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm font-semibold animate-bounce">
                <Trophy size={16} /> New High Score!
             </div>
          )}
        </div>

        {/* AI Commentary Section */}
        <div className="bg-slate-800/50 rounded-lg p-4 mb-6 min-h-[80px] flex items-center justify-center relative overflow-hidden border border-slate-700/50">
           {commentary.loading ? (
             <div className="flex flex-col items-center gap-2">
               <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
               <span className="text-xs text-green-500/80 animate-pulse">Gemini is analyzing your defeat...</span>
             </div>
           ) : (
             <div className="relative z-10">
               <p className="text-sm text-slate-200 italic">"{commentary.text}"</p>
               <div className="absolute -bottom-6 -right-6 text-[4rem] text-slate-700/20 rotate-12 font-serif">”</div>
               <div className="absolute -top-6 -left-6 text-[4rem] text-slate-700/20 rotate-12 font-serif">“</div>
             </div>
           )}
           {/* Decorative sheen */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/20 to-transparent"></div>
        </div>

        <button
          onClick={onRestart}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-green-900/50"
        >
          <RefreshCw size={24} />
          <span>Play Again</span>
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;