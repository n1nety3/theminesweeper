'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CELLS_PER_ZONE } from '@/lib/boardConstants';

export type Tool = 'water' | 'seed' | 'harvest' | 'laser' | 'pump';

export interface PlacedPump {
  id: string;
  gx: number; gy: number; row: number; col: number;
}

export type CellStatus = 'dry' | 'fertile' | 'planted' | 'harvestable' | 'dead' | 'rotten' | 'water-source' | 'weed-hidden' | 'weed';

export interface CellState {
  status: CellStatus;
  timestamp: number;    // ms when this status was set
  harvests?: number;    // how many times this cell has been harvested (max 5)
  laserHits?: number;   // laser hits on a water-source cell (turns dry at 5)
  pumpedMs?: number;    // total ms this water-source cell has been pumped
}

export const CELL_COLORS: Record<CellStatus, string> = {
  dry:           '#4a2c14',
  fertile:       '#1a3f8a',
  planted:       '#1e5022',
  harvestable:   'rgb(249, 196, 36)',
  dead:          '#c04010',
  rotten:        '#1e0e06',
  'water-source':'#1a6090',
  'weed-hidden': '#4a2c14', // same as dry — hidden
  weed:          '#2a4a10',
};

// ─── Zone generation ──────────────────────────────────────────────────────────

function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0;
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0;
    return ((s ^ (s >>> 16)) >>> 0) / 4294967296;
  };
}

/** Convert a session UUID string into a stable numeric seed. */
function sessionToSeed(sid: string): number {
  let h = 5381;
  for (let i = 0; i < sid.length; i++) {
    h = (Math.imul(h, 33) ^ sid.charCodeAt(i)) >>> 0;
  }
  return h;
}

function generateZoneCells(
  gx: number, gy: number, n: number,
  rand: () => number,
): Array<{ row: number; col: number; status: 'water-source' | 'weed-hidden' }> {
  const cells: Array<{ row: number; col: number; status: 'water-source' | 'weed-hidden' }> = [];
  const occupied = new Set<number>();

  // Distance from origin determines difficulty:
  // further zones have fewer water sources and more weeds.
  const dist = Math.max(Math.abs(gx), Math.abs(gy));

  // Water source blob — guaranteed at least 1 cell, shrinks with distance
  const maxBlob = Math.max(1, 8 - dist);
  const minBlob = Math.max(1, Math.ceil(maxBlob / 2));
  const blobSize = minBlob + Math.floor(rand() * (maxBlob - minBlob + 1));

  const maxOrigin = Math.max(1, n - 3);
  const blobR = 1 + Math.floor(rand() * maxOrigin);
  const blobC = 1 + Math.floor(rand() * maxOrigin);
  const queue: [number, number][] = [[blobR, blobC]];
  const blobSet = new Set<number>([blobR * n + blobC]);

  while (blobSet.size < blobSize && queue.length > 0) {
    const [r, c] = queue.shift()!;
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]] as [number,number][]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      const idx = nr * n + nc;
      if (!blobSet.has(idx) && rand() < 0.75) {
        blobSet.add(idx);
        queue.push([nr, nc]);
        if (blobSet.size >= blobSize) break;
      }
    }
  }

  // Guarantee at least 1 water-source cell even if BFS found nothing
  if (blobSet.size === 0) blobSet.add(blobR * n + blobC);

  for (const idx of blobSet) {
    const row = Math.floor(idx / n), col = idx % n;
    cells.push({ row, col, status: 'water-source' });
    occupied.add(idx);
  }

  // Hidden weeds — guaranteed at least 1, increases with distance
  const minWeeds = 1 + Math.floor(dist * 0.5);
  const maxWeeds = 1 + dist;
  const weedCount = minWeeds + Math.floor(rand() * (maxWeeds - minWeeds + 1));

  let attempts = 0, placed = 0;
  while (placed < weedCount && attempts < 60) {
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

// Timers
const FERTILE_TIMEOUT  =  5 * 60_000;
const GROWTH_DURATION  =  2 * 60_000;
const HARVEST_WINDOW   =  5 * 60_000;
const ROT_DURATION     = 10 * 60_000;
const WATER_INCOME_MS  = 10 * 60_000;

const WEED_SPREAD_MS   =  2 * 60_000;
const INITIAL_SEEDS    = 8;
const INITIAL_WATER    = 5;
const INITIAL_BATTERY  = 100; // laser battery %
const BATTERY_PER_USE  = 10;  // % per laser click
const BATTERY_COIN_COST = 10; // coins to buy 1 full recharge
const UNLOCK_THRESHOLD = 3;
const MAX_COINS        = 100;
const INITIAL_COINS    = 5;
const INITIAL_CROPS    = 0;
const INITIAL_PUMPS    = 1;
export const PUMP_COIN_COST = 100; // coins to buy 1 pump
const PUMP_WATER_PER_MIN = 2;  // water generated per tick
const PUMP_TICK_MS       = 60_000;    // 1 minute
const PUMP_EXHAUST_MS    = 15 * 60_000; // 15 min per water-source cell

// ─── Coordinate helpers ───────────────────────────────────────────────────────

type Coord = { gx: number; gy: number; row: number; col: number };

function coordToKey({ gx, gy, row, col }: Coord): string {
  return `${gx},${gy},${row * CELLS_PER_ZONE + col}`;
}

function keyToCoord(key: string): Coord {
  const [a, b, c] = key.split(',');
  const idx = Number(c);
  return { gx: Number(a), gy: Number(b), row: Math.floor(idx / CELLS_PER_ZONE), col: idx % CELLS_PER_ZONE };
}

function get8Neighbors({ gx, gy, row, col }: Coord): Coord[] {
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

function get4Cardinals({ gx, gy, row, col }: Coord): Coord[] {
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

function isBorderCell(row: number, col: number): boolean {
  return row === 0 || row === CELLS_PER_ZONE - 1 || col === 0 || col === CELLS_PER_ZONE - 1;
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

// ─── Zone logic ───────────────────────────────────────────────────────────────

function checkZoneUnlocks(states: Map<string, CellState>, unlocked: Set<string>): Set<string> {
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

// These statuses represent active soil that the player has worked — keep zone unlocked.
// water-source and weed-hidden are permanent terrain features, not active soil.
const ACTIVE_SOIL: Set<CellStatus> = new Set(['fertile', 'planted', 'harvestable', 'dead', 'rotten', 'weed']);

function checkZoneRelocking(states: Map<string, CellState>, unlocked: Set<string>): Set<string> {
  const result = new Set(unlocked);
  for (const zk of unlocked) {
    const [gx, gy] = zk.split(',').map(Number);
    if (gx === 0 && gy === 0) continue;
    const prefix = `${gx},${gy},`;
    let hasActive = false;
    for (const [key, state] of states) {
      if (key.startsWith(prefix) && ACTIVE_SOIL.has(state.status)) { hasActive = true; break; }
    }
    if (!hasActive) result.delete(zk);
  }
  return result;
}

// ─── Context type ─────────────────────────────────────────────────────────────

interface GameCtxType {
  seeds: number;
  water: number;
  coins: number;
  score: number;
  maxCoins: number;
  laserBattery: number;
  pumps: number;
  placedPumps: PlacedPump[];
  sessionId: string | null;
  playerName: string | null;
  isLoadingSession: boolean;
  selectedTool: Tool | null;
  selectTool:   (t: Tool) => void;
  deselectTool: () => void;
  cellStates: Map<string, CellState>;
  unlockedZones: Set<string>;
  activeZone: { gx: number; gy: number };
  setActiveZone: (gx: number, gy: number) => void;
  hasHarvestable: boolean;
  hasLaserTarget: boolean;
  isGameOver: boolean;
  applyWater:      (gx: number, gy: number, row: number, col: number) => void;
  applySeed:       (gx: number, gy: number, row: number, col: number) => void;
  applyHarvest:    (gx: number, gy: number, row: number, col: number) => void;
  applyLaser:      (gx: number, gy: number, row: number, col: number) => void;
  placePump:       (gx: number, gy: number, row: number, col: number) => void;
  pickupPump:      (id: string) => void;
  crops:           number;
  buyPump:         (qty?: number) => void;
  buySeeds:        (qty?: number) => void;
  buyWater:        (qty?: number) => void;
  buyLaserBattery: () => void;
  sellSeeds:       (qty?: number) => void;
  sellWater:       (qty?: number) => void;
  sellCrops:       (qty?: number) => void;
  bulkHarvest:     () => void;
  harvestableCount: number;
  sendOtp:         (email: string) => Promise<{ isNewUser: boolean }>;
  initSession:     (email: string, code: string, villageName: string) => Promise<void>;
  saveSession:     () => Promise<void>;
  startNewFarm:    (villageName: string) => Promise<void>;
}

const GameContext = createContext<GameCtxType>({
  seeds: INITIAL_SEEDS, water: INITIAL_WATER, coins: INITIAL_COINS, crops: INITIAL_CROPS, score: 0,
  maxCoins: MAX_COINS, laserBattery: INITIAL_BATTERY,
  pumps: INITIAL_PUMPS, placedPumps: [],
  sessionId: null, playerName: null, isLoadingSession: true,
  selectedTool: null, selectTool: () => {}, deselectTool: () => {},
  cellStates: new Map(), unlockedZones: new Set(['0,0']),
  activeZone: { gx: 0, gy: 0 }, setActiveZone: () => {},
  hasHarvestable: false,
  hasLaserTarget: false,
  isGameOver: false,
  applyWater: () => {}, applySeed: () => {}, applyHarvest: () => {}, applyLaser: () => {},
  placePump: () => {}, pickupPump: () => {}, buyPump: () => {},
  buySeeds: () => {}, buyWater: () => {}, buyLaserBattery: () => {},
  sellSeeds: () => {}, sellWater: () => {}, sellCrops: () => {}, bulkHarvest: () => {}, harvestableCount: 0,
  sendOtp: async () => ({ isNewUser: true }), initSession: async () => {}, saveSession: async () => {},
  startNewFarm: async () => {},
});

export const useGame = () => useContext(GameContext);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [seeds, setSeeds]                 = useState(INITIAL_SEEDS);
  const [water, setWater]                 = useState(INITIAL_WATER);
  const [coins, setCoins]                 = useState(INITIAL_COINS);
  const [crops, setCrops]                 = useState(INITIAL_CROPS);
  const [score, setScore]                 = useState(0);
  const [laserBattery, setLaserBattery]   = useState(INITIAL_BATTERY);
  const [pumps, setPumps]                 = useState(INITIAL_PUMPS);
  const [placedPumps, setPlacedPumps]     = useState<PlacedPump[]>([]);
  const [selectedTool, setSelectedTool]   = useState<Tool | null>(null);
  const [cellStates, setCellStates]       = useState<Map<string, CellState>>(new Map());
  const [unlockedZones, setUnlockedZones] = useState<Set<string>>(new Set(['0,0']));
  const [activeZone, setActiveZoneState]  = useState({ gx: 0, gy: 0 });
  const [sessionId, setSessionId]         = useState<string | null>(null);
  const [playerName, setPlayerName]       = useState<string | null>(null);
  const [isLoadingSession, setIsLoading]  = useState(true);

  // Refs kept in sync for use inside timers / rAF / event handlers
  const cellStatesRef     = useRef(cellStates);
  const unlockedZonesRef  = useRef(unlockedZones);
  const activeZoneRef     = useRef(activeZone);
  const seedsRef          = useRef(seeds);
  const waterRef          = useRef(water);
  const coinsRef          = useRef(coins);
  const cropsRef          = useRef(crops);
  const scoreRef          = useRef(score);
  const laserBatteryRef   = useRef(laserBattery);
  const pumpsRef          = useRef(pumps);
  const placedPumpsRef    = useRef(placedPumps);
  // Read session ID synchronously on first render so initZone always uses
  // the correct deterministic seed (not Math.random) even for zone 0,0.
  const _initSid = typeof window !== 'undefined' ? localStorage.getItem('farm_session_id') : null;
  const sessionIdRef   = useRef<string | null>(_initSid);
  const sessionSeedRef = useRef<number | null>(_initSid ? sessionToSeed(_initSid) : null);
  const isDirtyRef        = useRef(false);
  const initializedZones  = useRef<Set<string>>(new Set());

  useEffect(() => { cellStatesRef.current    = cellStates;    }, [cellStates]);
  useEffect(() => { unlockedZonesRef.current = unlockedZones; }, [unlockedZones]);
  useEffect(() => { activeZoneRef.current    = activeZone;    }, [activeZone]);
  useEffect(() => { seedsRef.current         = seeds;         }, [seeds]);
  useEffect(() => { waterRef.current         = water;         }, [water]);
  useEffect(() => { coinsRef.current         = coins;         }, [coins]);
  useEffect(() => { cropsRef.current         = crops;         }, [crops]);
  useEffect(() => { scoreRef.current         = score;         }, [score]);
  useEffect(() => { laserBatteryRef.current  = laserBattery;  }, [laserBattery]);
  useEffect(() => { pumpsRef.current         = pumps;         }, [pumps]);
  useEffect(() => { placedPumpsRef.current   = placedPumps;   }, [placedPumps]);

  // Mark dirty whenever any game state changes
  useEffect(() => {
    if (sessionIdRef.current) isDirtyRef.current = true;
  }, [cellStates, seeds, water, coins, score, laserBattery, pumps, placedPumps, unlockedZones, activeZone]);

  // ── Zone initialisation (water sources + hidden weeds) ───────────────────────

  const initZone = (gx: number, gy: number) => {
    // Use a deterministic seed once the session is named so the world is stable
    // across refreshes. Before naming, fall back to Math.random().
    const seed = sessionSeedRef.current;
    const rand = seed !== null
      ? seededRandom(seed ^ (gx * 73856093) ^ (gy * 19349663))
      : Math.random.bind(Math);
    const cells = generateZoneCells(gx, gy, CELLS_PER_ZONE, rand);
    if (cells.length === 0) return;
    setCellStates(prev => {
      const next = new Map(prev);
      for (const { row, col, status } of cells) {
        const key = coordToKey({ gx, gy, row, col });
        if (!next.has(key)) next.set(key, { status, timestamp: Date.now() });
      }
      return next;
    });
  };

  useEffect(() => {
    if (isLoadingSession) return;
    for (const zk of unlockedZones) {
      if (!initializedZones.current.has(zk)) {
        initializedZones.current.add(zk);
        const [gx, gy] = zk.split(',').map(Number);
        initZone(gx, gy);
      }
    }
  }, [unlockedZones, isLoadingSession]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Session helpers ──────────────────────────────────────────────────────────

  const saveSession = async (keepalive = false) => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    // On forced unload saves always proceed; for auto-saves skip if nothing changed
    if (!keepalive && !isDirtyRef.current) return;
    isDirtyRef.current = false;

    const body = JSON.stringify({
      sessionId:    sid,
      score:        scoreRef.current,
      seeds:        seedsRef.current,
      water:        waterRef.current,
      grain:        coinsRef.current,
      crops:        cropsRef.current,
      activeGx:     activeZoneRef.current.gx,
      activeGy:     activeZoneRef.current.gy,
      laserBattery: laserBatteryRef.current,
      pumps:        pumpsRef.current,
      placedPumps:  placedPumpsRef.current,
      cells: Array.from(cellStatesRef.current.entries()).map(([key, s]) => ({
        cell_key:   key,
        status:     s.status,
        ts:         s.timestamp,
        harvests:   s.harvests   ?? 0,
        laser_hits: s.laserHits  ?? 0,
        pumped_ms:  s.pumpedMs   ?? 0,
      })),
      zones: Array.from(unlockedZonesRef.current).map(zk => {
        const [gx, gy] = zk.split(',').map(Number);
        return { gx, gy };
      }),
    });

    try {
      await fetch('/api/session/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive,  // true on beforeunload so browser completes the request
      });
    } catch {
      isDirtyRef.current = true; // retry next save cycle
    }
  };

  const loadSession = async (sid: string) => {
    try {
      const res = await fetch(`/api/session?id=${sid}`);
      if (res.status === 404) {
        // Session deleted — reset so user can start fresh
        localStorage.removeItem('farm_session_id');
        localStorage.removeItem('farm_player_name');
        setSessionId(null);
        setIsLoading(false);
        return;
      }
      if (!res.ok) {
        // Server/DB error — keep local state, don't kick user out
        setIsLoading(false);
        return;
      }
      const data = await res.json();

      setSeeds(data.session.seeds);
      setWater(data.session.water);
      setCoins(data.session.grain ?? INITIAL_COINS);
      setCrops(data.session.crops ?? INITIAL_CROPS);
      setScore(data.session.score);
      setLaserBattery(data.session.laser_battery ?? 100);
      setPumps(data.session.pumps ?? 1);
      setPlacedPumps(data.session.placed_pumps ?? []);
      setActiveZoneState({ gx: data.session.active_gx, gy: data.session.active_gy });
      setPlayerName(data.session.name);

      const map = new Map<string, CellState>();
      for (const cell of data.cells) {
        map.set(cell.cell_key, {
          status:    cell.status as CellStatus,
          timestamp: Number(cell.ts),
          harvests:  cell.harvests   || undefined,
          laserHits: cell.laser_hits || undefined,
          pumpedMs:  cell.pumped_ms  || undefined,
        });
      }
      setCellStates(map);

      const loadedZones = new Set<string>(
        data.zones.map((z: { gx: number; gy: number }) => `${z.gx},${z.gy}`)
      );
      // Home zone is always unlocked
      loadedZones.add('0,0');

      // Only mark as initialized zones that already have water-source cells.
      // Any zone without water sources will have initZone run to repopulate
      // them — initZone only fills dry (absent) cells, preserving existing ones.
      const zonesWithWater = new Set<string>();
      for (const c of data.cells as { cell_key: string; status: string }[]) {
        if (c.status === 'water-source') {
          const [gx, gy] = c.cell_key.split(',');
          zonesWithWater.add(`${gx},${gy}`);
        }
      }
      initializedZones.current = new Set(
        [...loadedZones].filter(zk => zonesWithWater.has(zk))
      );
      setUnlockedZones(loadedZones);
    } catch {
      // DB unavailable — continue with fresh state
    } finally {
      setIsLoading(false);
      isDirtyRef.current = false;
    }
  };

  const sendOtp = async (email: string): Promise<{ isNewUser: boolean }> => {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? 'Failed to send code');
    }
    const data = await res.json();
    // Returning user — auto-login without OTP
    if (!data.isNewUser && data.sessionId) {
      const { sessionId: sid, farmName } = data;
      localStorage.setItem('farm_session_id',  sid);
      localStorage.setItem('farm_player_name', farmName);
      sessionIdRef.current   = sid;
      sessionSeedRef.current = sessionToSeed(sid);
      setSessionId(sid);
      setPlayerName(farmName);
      await loadSession(sid);
    }
    return { isNewUser: data.isNewUser ?? true };
  };

  const initSession = async (email: string, code: string, villageName: string): Promise<void> => {
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform:  navigator.platform,
      language:  navigator.language,
      screen:    `${screen.width}x${screen.height}`,
      timezone:  Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim(), deviceInfo, villageName }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? 'Verification failed');
    }

    const { sessionId: sid, farmName } = await res.json();
    localStorage.setItem('farm_session_id',   sid);
    localStorage.setItem('farm_player_name',  farmName);
    sessionIdRef.current   = sid;
    sessionSeedRef.current = sessionToSeed(sid);
    setSessionId(sid);
    setPlayerName(farmName);
    isDirtyRef.current = false;
    // Load saved state from DB
    await loadSession(sid);
  };

  // On mount: resume session if stored
  useEffect(() => {
    const sid  = localStorage.getItem('farm_session_id');
    const name = localStorage.getItem('farm_player_name');
    if (sid) {
      sessionIdRef.current   = sid;
      sessionSeedRef.current = sessionToSeed(sid);
      setSessionId(sid);
      if (name) setPlayerName(name);
      loadSession(sid);
    } else {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save every 30 s
  useEffect(() => {
    const id = setInterval(saveSession, 30_000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save on page close — keepalive ensures the fetch completes after unload
  useEffect(() => {
    const handle = () => { saveSession(true); };
    window.addEventListener('beforeunload', handle);
    return () => window.removeEventListener('beforeunload', handle);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived state ────────────────────────────────────────────────────────────

  const hasHarvestable = useMemo(() => {
    for (const s of cellStates.values()) if (s.status === 'harvestable') return true;
    return false;
  }, [cellStates]);

  const hasLaserTarget = useMemo(() => {
    for (const s of cellStates.values())
      if (s.status === 'dead' || s.status === 'rotten' || s.status === 'weed') return true;
    return false;
  }, [cellStates]);

  // Game over: no water, no seeds, no coins (can't buy either), and no growing/harvestable crops
  const isGameOver = useMemo(() => {
    if (water > 0 || seeds > 0 || coins > 0 || crops > 0) return false;
    for (const s of cellStates.values()) {
      if (s.status === 'planted' || s.status === 'harvestable') return false;
    }
    return true;
  }, [water, seeds, coins, crops, cellStates]);

  useEffect(() => {
    if (!hasHarvestable && selectedTool === 'harvest') setSelectedTool(null);
  }, [hasHarvestable, selectedTool]);

  const selectTool = (t: Tool) => {
    if (t === 'harvest' && !hasHarvestable) return;
    if (t === 'laser'   && laserBattery <= 0) return;
    if (t === 'pump'    && pumpsRef.current <= 0) return;
    setSelectedTool(prev => (prev === t ? null : t));
  };

  const deselectTool = () => setSelectedTool(null);

  const setActiveZone = (gx: number, gy: number) => setActiveZoneState({ gx, gy });

  // ── Actions ──────────────────────────────────────────────────────────────────

  const applyWater = (gx: number, gy: number, row: number, col: number) => {
    if (waterRef.current <= 0) return;

    const now = Date.now();
    const targets = [{ gx, gy, row, col }, ...get8Neighbors({ gx, gy, row, col })];
    const prev = cellStatesRef.current;

    // Only charge water if at least one cell would actually change
    const wouldChange = targets.some(c => {
      const s = prev.get(coordToKey(c))?.status ?? 'dry';
      return s === 'dry' || s === 'dead' || s === 'rotten' || s === 'weed-hidden';
    });
    if (!wouldChange) return;

    setWater(w => w - 1);
    setScore(s => s + 19);

    const next = new Map(prev);
    for (const c of targets) {
      const key = coordToKey(c);
      const s = next.get(key)?.status ?? 'dry';
      if (s === 'water-source') continue; // permanent — skip
      if (s === 'weed-hidden') {
        next.set(key, { status: 'weed', timestamp: now }); // reveal hidden weed
      } else if (s === 'dry' || s === 'dead' || s === 'rotten') {
        next.set(key, { status: 'fertile', timestamp: now });
      }
    }

    setCellStates(next);

    const newUnlocked = checkZoneUnlocks(next, unlockedZonesRef.current);
    if (!setsEqual(newUnlocked, unlockedZonesRef.current)) setUnlockedZones(newUnlocked);
  };

  const applySeed = (gx: number, gy: number, row: number, col: number) => {
    if (seedsRef.current <= 0) return;
    const key = coordToKey({ gx, gy, row, col });
    if ((cellStatesRef.current.get(key)?.status ?? 'dry') !== 'fertile') return;

    setSeeds(s => s - 1);
    setScore(s => s + 2);
    const next = new Map(cellStatesRef.current);
    next.set(key, { status: 'planted', timestamp: Date.now() });
    setCellStates(next);
  };

  const applyHarvest = (gx: number, gy: number, row: number, col: number) => {
    const key  = coordToKey({ gx, gy, row, col });
    const prev = cellStatesRef.current;
    const cell = prev.get(key);
    if ((cell?.status ?? 'dry') !== 'harvestable') return;

    setCrops(c => c + 1);  // goes to silo, not wallet
    setScore(s => s + 5);

    const next  = new Map(prev);
    const count = (cell?.harvests ?? 0) + 1;

    if (count >= 5) {
      next.delete(key);
    } else {
      next.set(key, { status: 'fertile', timestamp: Date.now(), harvests: count });
    }
    setCellStates(next);
  };

  const applyLaser = (gx: number, gy: number, row: number, col: number) => {
    if (laserBatteryRef.current <= 0) return;
    const key    = coordToKey({ gx, gy, row, col });
    const prev   = cellStatesRef.current;
    const cell   = prev.get(key);
    const status = cell?.status ?? 'dry';

    // Nothing to do on bare dry soil or hidden weed (looks dry)
    if (status === 'dry' || status === 'weed-hidden') return;

    const now  = Date.now();
    const next = new Map(prev);
    let scoreGain = 0;

    if (status === 'water-source') {
      // Degrades after 5 laser hits
      const hits = (cell!.laserHits ?? 0) + 1;
      if (hits >= 5) {
        next.delete(key); // turns dry
      } else {
        next.set(key, { ...cell!, laserHits: hits });
      }
    } else if (status === 'fertile') {
      // Scorches fertile soil back to dry
      next.delete(key);
    } else if (status === 'weed' || status === 'dead' || status === 'rotten') {
      // Clears threat — soil becomes fertile
      next.set(key, { status: 'fertile', timestamp: now });
      scoreGain = 1;
    } else if (status === 'planted' || status === 'harvestable') {
      // Destroys crop — soil stays fertile
      next.set(key, { status: 'fertile', timestamp: now });
    }

    setCellStates(next);
    if (scoreGain) setScore(s => s + scoreGain);
    setLaserBattery(b => Math.max(0, b - BATTERY_PER_USE));
  };

  // ── Pump actions ─────────────────────────────────────────────────────────────

  const placePump = (gx: number, gy: number, row: number, col: number) => {
    if (pumpsRef.current <= 0) return;
    setPumps(p => p - 1);
    setPlacedPumps(prev => [...prev, { id: crypto.randomUUID(), gx, gy, row, col }]);
    setSelectedTool(null);
  };

  const pickupPump = (id: string) => {
    setPlacedPumps(prev => prev.filter(p => p.id !== id));
    setPumps(p => p + 1);
    // No tool re-selection — user picks from inventory if they want to re-place
  };

  const buyPump = (qty = 1) => {
    const n = Math.min(qty, Math.floor(coinsRef.current / PUMP_COIN_COST));
    if (n < 1) return;
    setCoins(c => c - n * PUMP_COIN_COST);
    setPumps(p => p + n);
  };

  // ── Shop ─────────────────────────────────────────────────────────────────────

  // 1 coin → 2 seeds (qty times)
  const buySeeds = (qty = 1) => {
    const n = Math.min(qty, coinsRef.current);
    if (n < 1) return;
    setCoins(c => c - n);
    setSeeds(s => s + n * 2);
  };

  // 1 coin → 2 water (qty times)
  const buyWater = (qty = 1) => {
    const n = Math.min(qty, coinsRef.current);
    if (n < 1) return;
    setCoins(c => c - n);
    setWater(w => w + n * 2);
  };

  // 10 coins → full battery recharge
  const buyLaserBattery = () => {
    if (coinsRef.current < BATTERY_COIN_COST) return;
    setCoins(c => c - BATTERY_COIN_COST);
    setLaserBattery(INITIAL_BATTERY);
  };

  // 2 seeds → 1 coin (qty batches)
  const sellSeeds = (qty = 1) => {
    const maxBatches = Math.min(qty, Math.floor(seedsRef.current / 2), MAX_COINS - coinsRef.current);
    if (maxBatches < 1) return;
    setSeeds(s => s - maxBatches * 2);
    setCoins(c => Math.min(c + maxBatches, MAX_COINS));
  };

  // 2 water → 1 coin (qty batches)
  const sellWater = (qty = 1) => {
    const maxBatches = Math.min(qty, Math.floor(waterRef.current / 2), MAX_COINS - coinsRef.current);
    if (maxBatches < 1) return;
    setWater(w => w - maxBatches * 2);
    setCoins(c => Math.min(c + maxBatches, MAX_COINS));
  };

  // Harvest all harvestable cells at once → fills silo (crops), not wallet
  const bulkHarvest = () => {
    const prev = cellStatesRef.current;
    const next = new Map(prev);
    let harvested = 0;
    for (const [key, cell] of prev) {
      if (cell.status !== 'harvestable') continue;
      const count = (cell.harvests ?? 0) + 1;
      if (count >= 5) {
        next.delete(key);
      } else {
        next.set(key, { status: 'fertile', timestamp: Date.now(), harvests: count });
      }
      harvested++;
    }
    if (harvested === 0) return;
    setCrops(c => c + harvested);
    setScore(s => s + harvested * 5);
    setCellStates(next);
  };

  // Sell silo crops for coins (1 crop = 1 coin, qty capped by wallet space and stock)
  const sellCrops = (qty = 1) => {
    const earn = Math.min(qty, cropsRef.current, MAX_COINS - coinsRef.current);
    if (earn < 1) return;
    setCrops(c => c - earn);
    setCoins(c => Math.min(c + earn, MAX_COINS));
  };

  const harvestableCount = useMemo(() => {
    let count = 0;
    for (const cell of cellStates.values()) {
      if (cell.status === 'harvestable') count++;
    }
    return count;
  }, [cellStates]);

  const startNewFarm = async (villageName: string): Promise<void> => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    const res = await fetch('/api/session/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sid, villageName, score: scoreRef.current }),
    });
    if (!res.ok) return;
    const { sessionId: newSid, farmName: newName } = await res.json();
    // Reset all local state to initial values
    setCoins(INITIAL_COINS);
    setCrops(INITIAL_CROPS);
    setSeeds(INITIAL_SEEDS);
    setWater(INITIAL_WATER);
    setScore(0);
    setLaserBattery(INITIAL_BATTERY);
    setPumps(INITIAL_PUMPS);
    setPlacedPumps([]);
    setSelectedTool(null);
    setCellStates(new Map());
    setUnlockedZones(new Set(['0,0']));
    setActiveZoneState({ gx: 0, gy: 0 });
    initializedZones.current = new Set();
    sessionIdRef.current   = newSid;
    sessionSeedRef.current = sessionToSeed(newSid);
    setSessionId(newSid);
    setPlayerName(newName);
    localStorage.setItem('farm_session_id',  newSid);
    localStorage.setItem('farm_player_name', newName);
    isDirtyRef.current = false;
  };

  // Keep a ref so the timer can check loading state without being in deps
  const isLoadingRef = useRef(isLoadingSession);
  useEffect(() => { isLoadingRef.current = isLoadingSession; }, [isLoadingSession]);

  // ── Game timer (5 s tick) ────────────────────────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      if (isLoadingRef.current) return; // don't mutate state before session is restored
      const now  = Date.now();
      const prev = cellStatesRef.current;
      let next: Map<string, CellState> | null = null;
      const newlyRotten: Coord[] = [];

      for (const [key, state] of prev) {
        const elapsed = now - state.timestamp;

        if (state.status === 'fertile' && elapsed >= FERTILE_TIMEOUT) {
          if (!next) next = new Map(prev);
          next.delete(key);

        } else if (state.status === 'planted' && elapsed >= GROWTH_DURATION) {
          if (!next) next = new Map(prev);
          next.set(key, { status: 'harvestable', timestamp: now });

        } else if (state.status === 'harvestable' && elapsed >= HARVEST_WINDOW) {
          if (!next) next = new Map(prev);
          next.set(key, { status: 'dead', timestamp: now });

        } else if (state.status === 'dead' && elapsed >= ROT_DURATION) {
          if (!next) next = new Map(prev);
          next.set(key, { status: 'rotten', timestamp: now });
          newlyRotten.push(keyToCoord(key));

        } else if (state.status === 'weed' && elapsed >= WEED_SPREAD_MS) {
          if (!next) next = new Map(prev);
          next.set(key, { status: 'weed', timestamp: now }); // reset spread timer
          for (const nb of get8Neighbors(keyToCoord(key))) {
            const nbKey = coordToKey(nb);
            const nbStatus = (next.get(nbKey) ?? prev.get(nbKey))?.status ?? 'dry';
            if (nbStatus === 'dry' || nbStatus === 'fertile' || nbStatus === 'planted' || nbStatus === 'harvestable') {
              next.set(nbKey, { status: 'weed', timestamp: now });
            }
          }
        }
      }

      if (next && newlyRotten.length > 0) {
        for (const coord of newlyRotten) {
          for (const nb of get4Cardinals(coord)) {
            const nbKey    = coordToKey(nb);
            const nbStatus = (next.get(nbKey) ?? prev.get(nbKey))?.status ?? 'dry';
            if (nbStatus !== 'rotten') {
              next.set(nbKey, { status: 'rotten', timestamp: now });
            }
          }
        }
      }

      if (next) {
        setCellStates(next);
        const newUnlocked = checkZoneRelocking(next, unlockedZonesRef.current);
        if (!setsEqual(newUnlocked, unlockedZonesRef.current)) {
          setUnlockedZones(newUnlocked);
          const activeKey = `${activeZoneRef.current.gx},${activeZoneRef.current.gy}`;
          if (!newUnlocked.has(activeKey)) setActiveZoneState({ gx: 0, gy: 0 });
        }
      }
    }, 5_000);

    return () => clearInterval(interval);
  }, []);

  // Pump water generation — runs every 60 s
  useEffect(() => {
    const id = setInterval(() => {
      if (isLoadingRef.current || placedPumpsRef.current.length === 0) return;
      const prev = cellStatesRef.current;
      let next: Map<string, CellState> | null = null;
      let waterGained = 0;

      for (const pump of placedPumpsRef.current) {
        let pumpHasSource = false;
        for (const nb of get8Neighbors(pump)) {
          const nbKey  = coordToKey(nb);
          const cell   = (next ?? prev).get(nbKey);
          if (cell?.status !== 'water-source') continue;
          pumpHasSource = true;
          if (!next) next = new Map(prev);
          const pumped = (cell.pumpedMs ?? 0) + PUMP_TICK_MS;
          if (pumped >= PUMP_EXHAUST_MS) {
            next.delete(nbKey); // water source exhausted → dry
          } else {
            next.set(nbKey, { ...cell, pumpedMs: pumped });
          }
        }
        if (pumpHasSource) waterGained += PUMP_WATER_PER_MIN;
      }

      if (waterGained > 0) setWater(w => w + waterGained);
      if (next) setCellStates(next);
    }, PUMP_TICK_MS);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Passive water income
  useEffect(() => {
    const id = setInterval(() => setWater(w => w + 1), WATER_INCOME_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <GameContext.Provider value={{
      seeds, water, coins, crops, score,
      maxCoins: MAX_COINS, laserBattery,
      pumps, placedPumps,
      sessionId, playerName, isLoadingSession,
      selectedTool, selectTool, deselectTool,
      cellStates, unlockedZones, activeZone, setActiveZone,
      hasHarvestable, hasLaserTarget, isGameOver,
      applyWater, applySeed, applyHarvest, applyLaser,
      placePump, pickupPump, buyPump,
      buySeeds, buyWater, buyLaserBattery,
      sellSeeds, sellWater, sellCrops, bulkHarvest, harvestableCount,
      sendOtp, initSession, saveSession, startNewFarm,
    }}>
      {children}
    </GameContext.Provider>
  );
}
