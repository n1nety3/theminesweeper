// Board layout
export const CELL_SIZE       = 32;
export const CELL_GAP        = 1;
export const ZONE_GAP        = 1;
export const CELLS_PER_ZONE  = 10;
export const ZONE_SIZE       = CELLS_PER_ZONE * CELL_SIZE + (CELLS_PER_ZONE - 1) * CELL_GAP; // 329
export const ZONE_STRIDE     = ZONE_SIZE + ZONE_GAP;                                           // 330

// Game timers (ms)
export const FERTILE_TIMEOUT  =  5 * 60_000;
export const GROWTH_DURATION  =  2 * 60_000;
export const HARVEST_WINDOW   =  5 * 60_000;
export const ROT_DURATION     = 10 * 60_000;
export const WATER_INCOME_MS  = 10 * 60_000;
export const WEED_SPREAD_MS   =  2 * 60_000;
export const GAME_TICK_MS     =  5_000;

// Pump
export const PUMP_GRAIN_COST   = 100;
export const PUMP_WATER_PER_MIN = 2;
export const PUMP_TICK_MS       = 60_000;
export const PUMP_EXHAUST_MS    = 15 * 60_000;

// Starting resources
export const INITIAL_SEEDS   = 8;
export const INITIAL_WATER   = 5;
export const INITIAL_BATTERY = 100;
export const INITIAL_SILO    = 100;
export const INITIAL_PUMPS   = 1;

// Costs
export const BATTERY_PER_USE      = 10;
export const BATTERY_GRAIN_COST   = 5;
export const UNLOCK_THRESHOLD     = 3;

// Home zone
export const HOME_GX = 0;
export const HOME_GY = 0;
