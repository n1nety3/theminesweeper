'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GameState,
  Difficulty,
  createGame,
  revealCell,
  toggleFlag,
  chordReveal,
  saveScore,
} from '@/lib/minesweeper';

export function useGame(initialDifficulty: Difficulty = 'easy') {
  const [game, setGame] = useState<GameState>(() => createGame(initialDifficulty));
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (game.status === 'playing' && game.startTime) {
      stopTimer();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - game.startTime!) / 1000));
      }, 1000);
    } else {
      stopTimer();
    }
    return stopTimer;
  }, [game.status, game.startTime, stopTimer]);

  // Save score on win
  useEffect(() => {
    if (game.status === 'won') {
      saveScore(game.difficulty, elapsed);
    }
  }, [game.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const reveal = useCallback((row: number, col: number) => {
    setGame(prev => revealCell(prev, row, col));
  }, []);

  const flag = useCallback((row: number, col: number) => {
    setGame(prev => toggleFlag(prev, row, col));
  }, []);

  const chord = useCallback((row: number, col: number) => {
    setGame(prev => chordReveal(prev, row, col));
  }, []);

  const reset = useCallback((difficulty?: Difficulty) => {
    setElapsed(0);
    setGame(createGame(difficulty ?? game.difficulty));
  }, [game.difficulty]);

  const changeDifficulty = useCallback((difficulty: Difficulty) => {
    setElapsed(0);
    setGame(createGame(difficulty));
  }, []);

  return { game, elapsed, reveal, flag, chord, reset, changeDifficulty };
}
