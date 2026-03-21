import { CELLS_PER_ZONE } from './constants';
import type { Coord } from './types';

export function coordToKey({ gx, gy, row, col }: Coord): string {
  return `${gx},${gy},${row * CELLS_PER_ZONE + col}`;
}

export function keyToCoord(key: string): Coord {
  const [a, b, c] = key.split(',');
  const idx = Number(c);
  return { gx: Number(a), gy: Number(b), row: Math.floor(idx / CELLS_PER_ZONE), col: idx % CELLS_PER_ZONE };
}

export function get8Neighbors({ gx, gy, row, col }: Coord): Coord[] {
  const out: Coord[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      let ngx = gx, ngy = gy, nrow = row + dr, ncol = col + dc;
      if (nrow < 0)                    { ngy--; nrow = CELLS_PER_ZONE - 1; }
      else if (nrow >= CELLS_PER_ZONE) { ngy++; nrow = 0; }
      if (ncol < 0)                    { ngx--; ncol = CELLS_PER_ZONE - 1; }
      else if (ncol >= CELLS_PER_ZONE) { ngx++; ncol = 0; }
      out.push({ gx: ngx, gy: ngy, row: nrow, col: ncol });
    }
  }
  return out;
}

export function get4Cardinals({ gx, gy, row, col }: Coord): Coord[] {
  const deltas: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  return deltas.map(([dr, dc]) => {
    let ngx = gx, ngy = gy, nrow = row + dr, ncol = col + dc;
    if (nrow < 0)                    { ngy--; nrow = CELLS_PER_ZONE - 1; }
    else if (nrow >= CELLS_PER_ZONE) { ngy++; nrow = 0; }
    if (ncol < 0)                    { ngx--; ncol = CELLS_PER_ZONE - 1; }
    else if (ncol >= CELLS_PER_ZONE) { ngx++; ncol = 0; }
    return { gx: ngx, gy: ngy, row: nrow, col: ncol };
  });
}

export function isBorderCell(row: number, col: number): boolean {
  return row === 0 || row === CELLS_PER_ZONE - 1 || col === 0 || col === CELLS_PER_ZONE - 1;
}

export function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}
