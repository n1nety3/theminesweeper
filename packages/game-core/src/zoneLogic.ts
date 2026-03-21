import { UNLOCK_THRESHOLD } from './constants';
import type { CellState } from './types';
import { keyToCoord, isBorderCell, setsEqual } from './coords';

export function checkZoneUnlocks(
  states: Map<string, CellState>,
  unlocked: Set<string>,
): Set<string> {
  const counts = new Map<string, number>();
  for (const [key, state] of states) {
    if (state.status !== 'fertile') continue;
    const coord = keyToCoord(key);
    const zk = `${coord.gx},${coord.gy}`;
    if (unlocked.has(zk)) continue;
    if (!isBorderCell(coord.row, coord.col)) continue;
    counts.set(zk, (counts.get(zk) ?? 0) + 1);
  }
  if (counts.size === 0) return unlocked;
  const result = new Set(unlocked);
  for (const [zk, n] of counts) if (n >= UNLOCK_THRESHOLD) result.add(zk);
  return result;
}

export function checkZoneRelocking(
  states: Map<string, CellState>,
  unlocked: Set<string>,
): Set<string> {
  const result = new Set(unlocked);
  for (const zk of unlocked) {
    const [gx, gy] = zk.split(',').map(Number);
    if (gx === 0 && gy === 0) continue;
    const prefix = `${gx},${gy},`;
    let hasNonDry = false;
    for (const key of states.keys()) {
      if (key.startsWith(prefix)) { hasNonDry = true; break; }
    }
    if (!hasNonDry) result.delete(zk);
  }
  return result;
}

export { setsEqual };
