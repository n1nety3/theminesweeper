'use client';

import { GameStatus } from '@/lib/minesweeper';
import { MineSvg } from './icons/FlagSvg';
import { FlagSvg } from './icons/FlagSvg';
import PixelDisplay from './icons/PixelDisplay';

interface Props {
  status: GameStatus;
  elapsed: number;
  minesLeft: number;
  onReset: () => void;
  onShowHelp: () => void;
  onShowHint: () => void;
}

export default function Header({ status, elapsed, minesLeft, onReset, onShowHelp, onShowHint }: Props) {
  const displayMines = Math.max(0, minesLeft);

  return (
    <header className="header w-full bg-[#f0f0f0]">
      {/* Row 1 — title + icon buttons */}
      <div className="header-actions flex items-center justify-between px-4 pt-3 pb-2">
        {/* Logo + title */}
        <button
          className="logo-button flex items-center gap-2 select-none active:opacity-70"
          onClick={onReset}
        >
          {/* 4-square pixel icon mimicking the design logo */}
          <svg className="logo-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="8" height="8" fill="#FF4444"/>
            <rect x="10" y="0" width="8" height="8" fill="#44AA44"/>
            <rect x="0" y="10" width="8" height="8" fill="#4444FF"/>
            <rect x="10" y="10" width="8" height="8" fill="#FFAA00"/>
          </svg>
          <span className="logo-title font-semibold text-gray-800 text-[15px] tracking-wide">My Minesweeper</span>
        </button>

        {/* Action buttons */}
        <div className="icon-buttons-row flex gap-2">
          <button
            className="hint-btn w-9 h-9 rounded-lg border border-gray-300 bg-white flex items-center justify-center shadow-sm active:bg-gray-100"
            onClick={onShowHint}
            title="Hint"
          >
            <svg className="hint-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </button>
          <button
            className="help-btn w-9 h-9 rounded-lg border border-gray-300 bg-white flex items-center justify-center shadow-sm active:bg-gray-100"
            onClick={onShowHelp}
            title="Help"
          >
            <svg className="help-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <circle cx="12" cy="17" r="0.5" fill="#555"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Row 2 — stats bar */}
      <div className="stats-bar flex items-center justify-between px-4 pb-3">
        {/* Mines remaining */}
        <div className="mines-display flex items-center gap-1.5">
          <MineSvg className="mine-icon" style={{ height: 16, width: 'auto' }} />
          <span className="mines-count font-mono font-bold text-gray-700 text-sm tracking-widest">
            {String(displayMines).padStart(3, '0')}
          </span>
        </div>

        {/* 4-digit elapsed-seconds timer in pixel display */}
        <PixelDisplay className="timer-display" value={elapsed} digits={4} digitHeight={20} gap={3} />

        {/* Flags placed */}
        <div className="flags-display flex items-center gap-1.5">
          <FlagSvg className="flag-icon" style={{ height: 16, width: 'auto' }} />
          <span className="flags-count font-mono font-bold text-red-600 text-sm tracking-widest">
            {String(Math.max(0, minesLeft)).padStart(3, '0')}
          </span>
        </div>
      </div>
    </header>
  );
}
