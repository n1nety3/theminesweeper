import { CELLS_PER_ZONE } from './constants';
import type { CellStatus } from './types';

export function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0;
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0;
    return (s ^ (s >>> 16)) >>> 0 / 4294967296;
  };
}

export function sessionToSeed(sid: string): number {
  let h = 5381;
  for (let i = 0; i < sid.length; i++) {
    h = (Math.imul(h, 33) ^ sid.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function generateZoneCells(
  gx: number, gy: number, n: number,
  rand: () => number,
): Array<{ row: number; col: number; status: Extract<CellStatus, 'water-source' | 'weed-hidden'> }> {
  const cells: Array<{ row: number; col: number; status: Extract<CellStatus, 'water-source' | 'weed-hidden'> }> = [];
  const occupied = new Set<number>();

  // Water source blob
  const blobSize  = 3 + Math.floor(rand() * 6);
  const maxOrigin = Math.max(1, n - blobSize - 1);
  const blobR     = 1 + Math.floor(rand() * maxOrigin);
  const blobC     = 1 + Math.floor(rand() * maxOrigin);
  const queue: [number, number][] = [[blobR, blobC]];
  const blobSet = new Set<number>([blobR * n + blobC]);

  while (blobSet.size < blobSize * blobSize && queue.length > 0) {
    const [r, c] = queue.shift()!;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as [number, number][]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      const idx = nr * n + nc;
      if (!blobSet.has(idx) && rand() < 0.75) {
        blobSet.add(idx);
        queue.push([nr, nc]);
        if (blobSet.size >= blobSize * blobSize) break;
      }
    }
  }

  for (const idx of blobSet) {
    const row = Math.floor(idx / n), col = idx % n;
    cells.push({ row, col, status: 'water-source' });
    occupied.add(idx);
  }

  // Hidden weeds
  const weedCount = 1 + Math.floor(rand() * 2);
  let attempts = 0, placed = 0;
  while (placed < weedCount && attempts < 40) {
    attempts++;
    const row = Math.floor(rand() * n);
    const col = Math.floor(rand() * n);
    const idx = row * n + col;
    if (!occupied.has(idx)) {
      cells.push({ row, col, status: 'weed-hidden' });
      occupied.add(idx);
      placed++;
    }
  }

  return cells;
}

// Unused gx/gy kept for future zone-specific overrides
export function makeZoneRand(sessionSeed: number | null, gx: number, gy: number): () => number {
  if (sessionSeed === null) return Math.random.bind(Math);
  return seededRandom(sessionSeed ^ (gx * 73856093) ^ (gy * 19349663));
}

export const ZONE_CELLS_PER = CELLS_PER_ZONE;
