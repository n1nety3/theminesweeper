'use client';

import { useMemo } from 'react';
import { GameState } from '@/lib/minesweeper';
import Cell from './Cell';

interface Props {
  game: GameState;
  flagMode: boolean;
  onReveal: (row: number, col: number) => void;
  onFlag: (row: number, col: number) => void;
  onChord: (row: number, col: number) => void;
}

export default function Board({ game, flagMode, onReveal, onFlag, onChord }: Props) {
  const gameOver = game.status === 'won' || game.status === 'lost';
  const cols = game.board[0]?.length ?? 9;

  const gridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
  }), [cols]);

  return (
    <div className="board-wrapper w-full overflow-x-auto">
      <div
        className="board-grid mx-auto border border-gray-300 rounded"
        style={{
          ...gridStyle,
          maxWidth: `${cols * 36}px`,
          minWidth: `${cols * 28}px`,
        }}
      >
        {game.board.map(row =>
          row.map(cell => (
            <div
              key={`${cell.row}-${cell.col}`}
              className="board-cell-wrapper"
              style={{ aspectRatio: '1 / 1' }}
            >
              <Cell
                cell={cell}
                gameOver={gameOver}
                flagMode={flagMode}
                onReveal={onReveal}
                onFlag={onFlag}
                onChord={onChord}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
