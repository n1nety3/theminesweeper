// Re-export from shared package so the web app stays in sync with mobile
export {
  CELL_SIZE,
  CELL_GAP,
  ZONE_GAP,
  CELLS_PER_ZONE,
  ZONE_SIZE,
  ZONE_STRIDE,
  HOME_GX as ACTIVE_GX,
  HOME_GY as ACTIVE_GY,
} from '@farm/game-core';

import { ZONE_SIZE, HOME_GX, HOME_GY, ZONE_STRIDE } from '@farm/game-core';

export const ACTIVE_WORLD_CENTER_X = HOME_GX * ZONE_STRIDE + ZONE_SIZE / 2;
export const ACTIVE_WORLD_CENTER_Y = HOME_GY * ZONE_STRIDE + ZONE_SIZE / 2;
