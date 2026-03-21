export type Tool = 'water' | 'seed' | 'harvest' | 'laser' | 'pump';

export type CellStatus =
  | 'dry'
  | 'fertile'
  | 'planted'
  | 'harvestable'
  | 'dead'
  | 'rotten'
  | 'water-source'
  | 'weed-hidden'
  | 'weed';

export interface CellState {
  status: CellStatus;
  timestamp: number;
  harvests?: number;
  laserHits?: number;
  pumpedMs?: number;
}

export interface PlacedPump {
  id: string;
  gx: number;
  gy: number;
  row: number;
  col: number;
}

export type Coord = { gx: number; gy: number; row: number; col: number };
