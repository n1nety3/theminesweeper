'use client';

import { GameState } from '@/lib/minesweeper';
import PixelDisplay from './icons/PixelDisplay';

interface Props {
  game: GameState;
  flagMode: boolean;
  onToggleFlagMode: () => void;
  onReset: () => void;
  onShowScoreboard: () => void;
}

export default function Footer({ game, flagMode, onToggleFlagMode, onReset, onShowScoreboard }: Props) {
  const progress = game.totalSafe > 0
    ? Math.round((game.cellsRevealed / game.totalSafe) * 100)
    : 0;

  // mines remaining for the pixel display (clamped 0-999)
  const minesLeft = Math.max(0, game.minesLeft);

  return (
    <footer className="footer w-full bg-[#f0f0f0] px-4 py-3">
      <div className="footer-content flex items-center justify-between gap-2">
        {/* RESET button */}
        <button
          className="reset-btn px-4 py-1.5 text-sm font-medium border border-gray-400 rounded-lg bg-white hover:bg-gray-50 active:bg-gray-200 transition-colors shadow-sm"
          onClick={onReset}
        >
          RESET
        </button>

        {/* Center — pixel mine counter + progress + flag toggle */}
        <div className="footer-center flex flex-col items-center gap-1">
          <div className="progress-section flex items-center gap-2">
            <PixelDisplay className="mine-counter" value={minesLeft} digits={3} digitHeight={18} gap={3} />
            <span className="progress-percent font-mono font-bold text-gray-700 text-sm">{progress}%</span>
          </div>
          {/* Flag mode toggle — small, unobtrusive */}
          <button
            className="flag-toggle text-[10px] font-medium px-2 py-0.5 rounded border transition-colors"
            onClick={onToggleFlagMode}
          >
            🚩 {flagMode ? 'Flag ON' : 'Flag OFF'}
          </button>
        </div>

        {/* Score Board button */}
        <button
          className="scoreboard-btn px-3 py-1.5 text-sm font-medium border border-gray-400 rounded-lg bg-white hover:bg-gray-50 active:bg-gray-200 transition-colors shadow-sm"
          onClick={onShowScoreboard}
        >
          Score Board
        </button>
      </div>
    </footer>
  );
}
