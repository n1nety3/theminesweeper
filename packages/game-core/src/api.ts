import type { CellState, PlacedPump } from './types';

export interface SessionPayload {
  sessionId: string;
  score: number;
  seeds: number;
  water: number;
  grain: number;
  activeGx: number;
  activeGy: number;
  laserBattery: number;
  pumps: number;
  placedPumps: PlacedPump[];
  cells: Array<{
    cell_key: string;
    status: string;
    ts: number;
    harvests: number;
    laser_hits: number;
    pumped_ms: number;
  }>;
  zones: Array<{ gx: number; gy: number }>;
}

export interface SessionResponse {
  session: {
    id: string;
    score: number;
    seeds: number;
    water: number;
    grain: number;
    active_gx: number;
    active_gy: number;
    laser_battery: number;
    pumps: number;
    placed_pumps: PlacedPump[];
    name: string;
  };
  cells: Array<{
    cell_key: string;
    status: string;
    ts: number | string;
    harvests: number;
    laser_hits: number;
    pumped_ms: number;
  }>;
  zones: Array<{ gx: number; gy: number }>;
}

/** Base URL for API — empty string on web (same origin), full URL on mobile. */
let _apiBase = '';

export function setApiBase(url: string) {
  _apiBase = url.replace(/\/$/, '');
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${_apiBase}${path}`, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function apiSendOtp(email: string): Promise<void> {
  await request('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
}

export async function apiVerifyOtp(
  email: string,
  code: string,
): Promise<{ sessionId: string; farmName: string }> {
  return request('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
}

export async function apiLoadSession(id: string): Promise<SessionResponse> {
  return request(`/api/session?id=${encodeURIComponent(id)}`);
}

export async function apiSaveSession(
  payload: SessionPayload,
  keepalive = false,
): Promise<void> {
  await fetch(`${_apiBase}/api/session/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive,
  });
}

export function buildSessionPayload(
  sessionId: string,
  state: {
    score: number; seeds: number; water: number; grain: number;
    activeGx: number; activeGy: number; laserBattery: number;
    pumps: number; placedPumps: PlacedPump[];
    cellStates: Map<string, CellState>;
    unlockedZones: Set<string>;
  },
): SessionPayload {
  return {
    sessionId,
    score:        state.score,
    seeds:        state.seeds,
    water:        state.water,
    grain:        state.grain,
    activeGx:     state.activeGx,
    activeGy:     state.activeGy,
    laserBattery: state.laserBattery,
    pumps:        state.pumps,
    placedPumps:  state.placedPumps,
    cells: Array.from(state.cellStates.entries()).map(([key, s]) => ({
      cell_key:   key,
      status:     s.status,
      ts:         s.timestamp,
      harvests:   s.harvests   ?? 0,
      laser_hits: s.laserHits  ?? 0,
      pumped_ms:  s.pumpedMs   ?? 0,
    })),
    zones: Array.from(state.unlockedZones).map(zk => {
      const [gx, gy] = zk.split(',').map(Number);
      return { gx, gy };
    }),
  };
}
