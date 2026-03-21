'use client';

import { useRef } from 'react';
import { Cell as CellType } from '@/lib/minesweeper';
import { NUMBER_SVGS } from './icons/NumberSvg';
import { FlagSvg, MineSvg } from './icons/FlagSvg';

interface Props {
  cell: CellType;
  gameOver: boolean;
  flagMode: boolean;
  onReveal: (row: number, col: number) => void;
  onFlag: (row: number, col: number) => void;
  onChord: (row: number, col: number) => void;
}

export default function Cell({ cell, gameOver, flagMode, onReveal, onFlag, onChord }: Props) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const handleTouchStart = () => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      if (cell.state === 'hidden' || cell.state === 'flagged') {
        onFlag(cell.row, cell.col);
      } else if (cell.state === 'revealed') {
        onChord(cell.row, cell.col);
      }
    }, 400);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!didLongPress.current) {
      handleTap();
    }
    didLongPress.current = false;
  };

  const handleTap = () => {
    if (gameOver) return;
    if (flagMode) {
      if (cell.state === 'hidden' || cell.state === 'flagged') {
        onFlag(cell.row, cell.col);
      }
    } else {
      if (cell.state === 'hidden') {
        onReveal(cell.row, cell.col);
      } else if (cell.state === 'revealed') {
        onChord(cell.row, cell.col);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (gameOver) return;
    if (cell.state === 'hidden' || cell.state === 'flagged') {
      onFlag(cell.row, cell.col);
    } else if (cell.state === 'revealed') {
      onChord(cell.row, cell.col);
    }
  };

  const handleClick = () => {
    if (gameOver) return;
    if (flagMode) {
      if (cell.state === 'hidden' || cell.state === 'flagged') {
        onFlag(cell.row, cell.col);
      }
    } else {
      if (cell.state === 'hidden') {
        onReveal(cell.row, cell.col);
      } else if (cell.state === 'revealed') {
        onChord(cell.row, cell.col);
      }
    }
  };

  const renderContent = () => {
    if (cell.state === 'flagged') {
      return <FlagSvg style={{ width: '55%', height: '55%' }} />;
    }

    if (cell.state === 'hidden') {
      return null;
    }

    // Revealed
    if (cell.isMine) {
      return <MineSvg style={{ width: '65%', height: '65%' }} />;
    }

    if (cell.adjacentMines === 0) return null;

    const NumSvg = NUMBER_SVGS[cell.adjacentMines];
    if (!NumSvg) return null;
    return <NumSvg style={{ width: 'auto', height: '55%', maxWidth: '70%' }} />;
  };

  const isExplodedMine = cell.isMine && cell.state === 'revealed' && gameOver;

  let cellClass = 'flex items-center justify-center border border-gray-300 select-none touch-none transition-colors w-full h-full ';

  if (cell.state === 'hidden') {
    cellClass += 'bg-gray-100 active:bg-gray-200 cursor-pointer hover:bg-gray-200 ';
  } else if (cell.state === 'flagged') {
    cellClass += 'bg-gray-100 cursor-pointer ';
  } else if (isExplodedMine) {
    cellClass += 'bg-red-200 ';
  } else if (cell.isMine) {
    cellClass += 'bg-gray-50 ';
  } else {
    cellClass += 'bg-white ';
  }

  return (
    <div
      className={`cell ${cellClass}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={() => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }}
    >
      <div className="cell-content">
        {renderContent()}
      </div>
    </div>
  );
}
