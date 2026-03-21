export type CellState = 'hidden' | 'revealed' | 'flagged';

export interface Cell {
  isMine: boolean;
  state: CellState;
  adjacentMines: number;
  row: number;
  col: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  rows: number;
  cols: number;
  mines: number;
  label: string;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { rows: 9, cols: 9, mines: 10, label: 'Easy' },
  medium: { rows: 16, cols: 16, mines: 40, label: 'Medium' },
  hard: { rows: 16, cols: 30, mines: 99, label: 'Hard' },
};

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

export interface GameState {
  board: Cell[][];
  status: GameStatus;
  minesLeft: number;
  flagsPlaced: number;
  cellsRevealed: number;
  totalSafe: number;
  startTime: number | null;
  elapsedTime: number;
  difficulty: Difficulty;
}

function createEmptyBoard(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      isMine: false,
      state: 'hidden' as CellState,
      adjacentMines: 0,
      row: r,
      col: c,
    }))
  );
}

function placeMines(
  board: Cell[][],
  rows: number,
  cols: number,
  mines: number,
  safeRow: number,
  safeCol: number
): Cell[][] {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  let placed = 0;

  // Create safe zone around first click (3x3)
  const safeZone = new Set<string>();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = safeRow + dr;
      const c = safeCol + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        safeZone.add(`${r},${c}`);
      }
    }
  }

  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!newBoard[r][c].isMine && !safeZone.has(`${r},${c}`)) {
      newBoard[r][c].isMine = true;
      placed++;
    }
  }

  // Calculate adjacent mine counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!newBoard[r][c].isMine) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) {
              count++;
            }
          }
        }
        newBoard[r][c].adjacentMines = count;
      }
    }
  }

  return newBoard;
}

function floodReveal(board: Cell[][], row: number, col: number, rows: number, cols: number): { board: Cell[][], revealed: number } {
  const newBoard = board.map(r => r.map(c => ({ ...c })));
  let revealed = 0;
  const queue: [number, number][] = [[row, col]];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const cell = newBoard[r][c];
    if (cell.state === 'flagged' || cell.state === 'revealed') continue;

    cell.state = 'revealed';
    revealed++;

    if (cell.adjacentMines === 0 && !cell.isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(`${nr},${nc}`)) {
            queue.push([nr, nc]);
          }
        }
      }
    }
  }

  return { board: newBoard, revealed };
}

export function createGame(difficulty: Difficulty): GameState {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const board = createEmptyBoard(config.rows, config.cols);
  return {
    board,
    status: 'idle',
    minesLeft: config.mines,
    flagsPlaced: 0,
    cellsRevealed: 0,
    totalSafe: config.rows * config.cols - config.mines,
    startTime: null,
    elapsedTime: 0,
    difficulty,
  };
}

export function revealCell(state: GameState, row: number, col: number): GameState {
  const config = DIFFICULTY_CONFIGS[state.difficulty];
  let board = state.board;
  let status = state.status;
  let startTime = state.startTime;
  let cellsRevealed = state.cellsRevealed;

  const cell = board[row][col];
  if (cell.state !== 'hidden') return state;

  // First click — place mines
  if (status === 'idle') {
    board = placeMines(board, config.rows, config.cols, config.mines, row, col);
    status = 'playing';
    startTime = Date.now();
  }

  if (board[row][col].isMine) {
    // Hit a mine — reveal all mines
    const newBoard = board.map(r =>
      r.map(c => ({
        ...c,
        state: (c.isMine ? 'revealed' : c.state) as CellState,
      }))
    );
    newBoard[row][col] = { ...newBoard[row][col], state: 'revealed' };
    return { ...state, board: newBoard, status: 'lost', startTime };
  }

  const result = floodReveal(board, row, col, config.rows, config.cols);
  cellsRevealed = state.cellsRevealed + result.revealed;

  const won = cellsRevealed >= state.totalSafe;

  return {
    ...state,
    board: result.board,
    status: won ? 'won' : status,
    cellsRevealed,
    startTime,
  };
}

export function toggleFlag(state: GameState, row: number, col: number): GameState {
  if (state.status === 'idle' || state.status === 'won' || state.status === 'lost') return state;

  const cell = state.board[row][col];
  if (cell.state === 'revealed') return state;

  const newBoard = state.board.map(r => r.map(c => ({ ...c })));
  const newCell = newBoard[row][col];

  if (newCell.state === 'hidden') {
    newCell.state = 'flagged';
    return { ...state, board: newBoard, minesLeft: state.minesLeft - 1, flagsPlaced: state.flagsPlaced + 1 };
  } else {
    newCell.state = 'hidden';
    return { ...state, board: newBoard, minesLeft: state.minesLeft + 1, flagsPlaced: state.flagsPlaced - 1 };
  }
}

export function chordReveal(state: GameState, row: number, col: number): GameState {
  if (state.status !== 'playing') return state;
  const config = DIFFICULTY_CONFIGS[state.difficulty];
  const cell = state.board[row][col];
  if (cell.state !== 'revealed' || cell.adjacentMines === 0) return state;

  // Count flags around this cell
  let flagCount = 0;
  const neighbors: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
        if (state.board[nr][nc].state === 'flagged') flagCount++;
        else if (state.board[nr][nc].state === 'hidden') neighbors.push([nr, nc]);
      }
    }
  }

  if (flagCount !== cell.adjacentMines) return state;

  // Reveal all unflagged hidden neighbors
  let newState = state;
  for (const [r, c] of neighbors) {
    newState = revealCell(newState, r, c);
    if (newState.status === 'lost') return newState;
  }
  return newState;
}

export interface ScoreEntry {
  difficulty: Difficulty;
  time: number;
  date: string;
}

export function getScores(): ScoreEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('minesweeper_scores') || '[]');
  } catch {
    return [];
  }
}

export function saveScore(difficulty: Difficulty, time: number): void {
  if (typeof window === 'undefined') return;
  const scores = getScores();
  scores.push({ difficulty, time, date: new Date().toISOString() });
  // Keep top 10 per difficulty
  const filtered = scores
    .filter(s => s.difficulty === difficulty)
    .sort((a, b) => a.time - b.time)
    .slice(0, 10);
  const others = scores.filter(s => s.difficulty !== difficulty);
  localStorage.setItem('minesweeper_scores', JSON.stringify([...others, ...filtered]));
}
