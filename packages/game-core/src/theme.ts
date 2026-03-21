import type { CellStatus } from './types';

export const CELL_COLORS: Record<CellStatus, string> = {
  dry:            '#4a2c14',
  fertile:        '#1a3f8a',
  planted:        '#1e5022',
  harvestable:    'rgb(249, 196, 36)',
  dead:           '#c04010',
  rotten:         '#1e0e06',
  'water-source': '#1a6090',
  'weed-hidden':  '#4a2c14',
  weed:           '#2a4a10',
};

// Named design tokens — platform-agnostic (JS values, no CSS vars)
export const DARK_THEME = {
  pageBg:      '#0e1a0e',
  barBg:       '#111e11',
  textPrimary: '#c8e0a0',
  textMuted:   '#5a7a50',
  btnIconBg:   '#1a2e1a',
  btnIconRing: '#2a4a28',
  accent:      '#70be50',
  accentGlow:  '#3a7030',
} as const;

export const LIGHT_THEME = {
  pageBg:      '#f0ead6',
  barBg:       '#e8e0c4',
  textPrimary: '#1a2e10',
  textMuted:   '#5a6040',
  btnIconBg:   '#dcd4b8',
  btnIconRing: '#c0b890',
  accent:      '#3a7020',
  accentGlow:  '#6a9840',
} as const;

export type AppTheme = typeof DARK_THEME;
