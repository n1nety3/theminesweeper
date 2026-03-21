import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type Tool, type PlacedPump, type CellState, type CellStatus,
  CELLS_PER_ZONE, FERTILE_TIMEOUT, GROWTH_DURATION, HARVEST_WINDOW,
  ROT_DURATION, WATER_INCOME_MS, WEED_SPREAD_MS, GAME_TICK_MS,
  PUMP_GRAIN_COST, PUMP_WATER_PER_MIN, PUMP_TICK_MS, PUMP_EXHAUST_MS,
  INITIAL_SEEDS, INITIAL_WATER, INITIAL_BATTERY, INITIAL_SILO, INITIAL_PUMPS,
  BATTERY_PER_USE, BATTERY_GRAIN_COST,
  coordToKey, keyToCoord, get8Neighbors, get4Cardinals, setsEqual,
  checkZoneUnlocks, checkZoneRelocking,
  generateZoneCells, seededRandom, sessionToSeed, makeZoneRand,
  apiSendOtp, apiVerifyOtp, apiLoadSession, apiSaveSession, buildSessionPayload, setApiBase,
} from '@farm/game-core';
import { API_BASE_URL } from '../constants/api';

// Point the shared API client at the deployed server
setApiBase(API_BASE_URL);

interface GameCtxType {
  seeds: number; water: number; grain: number; score: number;
  siloCapacity: number; laserBattery: number;
  pumps: number; placedPumps: PlacedPump[];
  sessionId: string | null; playerName: string | null; isLoadingSession: boolean;
  selectedTool: Tool | null;
  selectTool:   (t: Tool) => void;
  deselectTool: () => void;
  cellStates: Map<string, CellState>;
  unlockedZones: Set<string>;
  activeZone: { gx: number; gy: number };
  setActiveZone: (gx: number, gy: number) => void;
  hasHarvestable: boolean; hasLaserTarget: boolean; isGameOver: boolean;
  applyWater:   (gx: number, gy: number, row: number, col: number) => void;
  applySeed:    (gx: number, gy: number, row: number, col: number) => void;
  applyHarvest: (gx: number, gy: number, row: number, col: number) => void;
  applyLaser:   (gx: number, gy: number, row: number, col: number) => void;
  placePump:    (gx: number, gy: number, row: number, col: number) => void;
  pickupPump:   (id: string) => void;
  buyPump:      () => void;
  tradeGrainForSeeds: () => void; tradeGrainForWater: () => void;
  tradeSeedsForGrain: () => void; tradeWaterForGrain: () => void;
  buyLaserBattery: () => void;
  sendOtp:     (email: string) => Promise<void>;
  initSession: (email: string, code: string) => Promise<void>;
  saveSession: () => Promise<void>;
}

const GameContext = createContext<GameCtxType>({
  seeds: INITIAL_SEEDS, water: INITIAL_WATER, grain: 0, score: 0,
  siloCapacity: INITIAL_SILO, laserBattery: INITIAL_BATTERY,
  pumps: INITIAL_PUMPS, placedPumps: [],
  sessionId: null, playerName: null, isLoadingSession: true,
  selectedTool: null, selectTool: () => {}, deselectTool: () => {},
  cellStates: new Map(), unlockedZones: new Set(['0,0']),
  activeZone: { gx: 0, gy: 0 }, setActiveZone: () => {},
  hasHarvestable: false, hasLaserTarget: false, isGameOver: false,
  applyWater: () => {}, applySeed: () => {}, applyHarvest: () => {}, applyLaser: () => {},
  placePump: () => {}, pickupPump: () => {}, buyPump: () => {},
  tradeGrainForSeeds: () => {}, tradeGrainForWater: () => {},
  tradeSeedsForGrain: () => {}, tradeWaterForGrain: () => {},
  buyLaserBattery: () => {},
  sendOtp: async () => {}, initSession: async () => {}, saveSession: async () => {},
});

export const useGame = () => useContext(GameContext);

export function GameProvider({ children }: { children: ReactNode }) {
  const [seeds, setSeeds]               = useState(INITIAL_SEEDS);
  const [water, setWater]               = useState(INITIAL_WATER);
  const [grain, setGrain]               = useState(0);
  const [score, setScore]               = useState(0);
  const [laserBattery, setLaserBattery] = useState(INITIAL_BATTERY);
  const [pumps, setPumps]               = useState(INITIAL_PUMPS);
  const [placedPumps, setPlacedPumps]   = useState<PlacedPump[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [cellStates, setCellStates]     = useState<Map<string, CellState>>(new Map());
  const [unlockedZones, setUnlockedZones] = useState<Set<string>>(new Set(['0,0']));
  const [activeZone, setActiveZoneState]  = useState({ gx: 0, gy: 0 });
  const [sessionId, setSessionId]       = useState<string | null>(null);
  const [playerName, setPlayerName]     = useState<string | null>(null);
  const [isLoadingSession, setIsLoading]  = useState(true);

  // Refs for use in timers
  const cellStatesRef    = useRef(cellStates);
  const unlockedZonesRef = useRef(unlockedZones);
  const activeZoneRef    = useRef(activeZone);
  const seedsRef         = useRef(seeds);
  const waterRef         = useRef(water);
  const grainRef         = useRef(grain);
  const scoreRef         = useRef(score);
  const laserBatteryRef  = useRef(laserBattery);
  const pumpsRef         = useRef(pumps);
  const placedPumpsRef   = useRef(placedPumps);
  const sessionIdRef     = useRef<string | null>(null);
  const sessionSeedRef   = useRef<number | null>(null);
  const isDirtyRef       = useRef(false);
  const initializedZones = useRef<Set<string>>(new Set());
  const isLoadingRef     = useRef(isLoadingSession);

  useEffect(() => { cellStatesRef.current    = cellStates;    }, [cellStates]);
  useEffect(() => { unlockedZonesRef.current = unlockedZones; }, [unlockedZones]);
  useEffect(() => { activeZoneRef.current    = activeZone;    }, [activeZone]);
  useEffect(() => { seedsRef.current         = seeds;         }, [seeds]);
  useEffect(() => { waterRef.current         = water;         }, [water]);
  useEffect(() => { grainRef.current         = grain;         }, [grain]);
  useEffect(() => { scoreRef.current         = score;         }, [score]);
  useEffect(() => { laserBatteryRef.current  = laserBattery;  }, [laserBattery]);
  useEffect(() => { pumpsRef.current         = pumps;         }, [pumps]);
  useEffect(() => { placedPumpsRef.current   = placedPumps;   }, [placedPumps]);
  useEffect(() => { isLoadingRef.current     = isLoadingSession; }, [isLoadingSession]);

  useEffect(() => {
    if (sessionIdRef.current) isDirtyRef.current = true;
  }, [cellStates, seeds, water, grain, score, laserBattery, pumps, placedPumps, unlockedZones, activeZone]);

  // Zone init — gated on session load
  const initZone = (gx: number, gy: number) => {
    const rand = makeZoneRand(sessionSeedRef.current, gx, gy);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlockedZones, isLoadingSession]);

  // ── Session helpers ─────────────────────────────────────────────────────────

  const saveSession = async (keepalive = false) => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    if (!keepalive && !isDirtyRef.current) return;
    isDirtyRef.current = false;

    const payload = buildSessionPayload(sid, {
      score: scoreRef.current, seeds: seedsRef.current,
      water: waterRef.current, grain: grainRef.current,
      activeGx: activeZoneRef.current.gx, activeGy: activeZoneRef.current.gy,
      laserBattery: laserBatteryRef.current,
      pumps: pumpsRef.current, placedPumps: placedPumpsRef.current,
      cellStates: cellStatesRef.current,
      unlockedZones: unlockedZonesRef.current,
    });

    try {
      await apiSaveSession(payload, keepalive);
    } catch {
      isDirtyRef.current = true;
    }
  };

  const loadSession = async (sid: string) => {
    try {
      const data = await apiLoadSession(sid);
      setSeeds(data.session.seeds);
      setWater(data.session.water);
      setGrain(data.session.grain);
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
      initializedZones.current = new Set(loadedZones);
      setUnlockedZones(loadedZones);
    } catch {
      // Session not found — clear storage
      await AsyncStorage.removeItem('farm_session_id');
      await AsyncStorage.removeItem('farm_player_name');
      setSessionId(null);
    } finally {
      setIsLoading(false);
      isDirtyRef.current = false;
    }
  };

  const sendOtp = async (email: string): Promise<void> => {
    await apiSendOtp(email.trim().toLowerCase());
  };

  const initSession = async (email: string, code: string): Promise<void> => {
    const { sessionId: sid, farmName } = await apiVerifyOtp(
      email.trim().toLowerCase(),
      code.trim(),
    );
    await AsyncStorage.setItem('farm_session_id',  sid);
    await AsyncStorage.setItem('farm_player_name', farmName);
    sessionIdRef.current   = sid;
    sessionSeedRef.current = sessionToSeed(sid);
    setSessionId(sid);
    setPlayerName(farmName);
    isDirtyRef.current = false;
    await loadSession(sid);
  };

  // On mount: resume stored session
  useEffect(() => {
    AsyncStorage.getItem('farm_session_id').then(sid => {
      if (sid) {
        sessionIdRef.current   = sid;
        sessionSeedRef.current = sessionToSeed(sid);
        setSessionId(sid);
        AsyncStorage.getItem('farm_player_name').then(n => { if (n) setPlayerName(n); });
        loadSession(sid);
      } else {
        setIsLoading(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save every 30 s
  useEffect(() => {
    const id = setInterval(saveSession, 30_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save when app goes to background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') saveSession(false);
    });
    return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived state ───────────────────────────────────────────────────────────

  const hasHarvestable = useMemo(() => {
    for (const s of cellStates.values()) if (s.status === 'harvestable') return true;
    return false;
  }, [cellStates]);

  const hasLaserTarget = useMemo(() => {
    for (const s of cellStates.values())
      if (s.status === 'dead' || s.status === 'rotten' || s.status === 'weed') return true;
    return false;
  }, [cellStates]);

  const isGameOver = useMemo(() => {
    if (seeds > 0 || grain > 0) return false;
    for (const s of cellStates.values())
      if (s.status === 'planted' || s.status === 'harvestable') return false;
    return true;
  }, [seeds, grain, cellStates]);

  // ── Tool selection ──────────────────────────────────────────────────────────

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

  // ── Actions ─────────────────────────────────────────────────────────────────

  const applyWater = (gx: number, gy: number, row: number, col: number) => {
    if (waterRef.current <= 0) return;
    const now = Date.now();
    const targets = [{ gx, gy, row, col }, ...get8Neighbors({ gx, gy, row, col })];
    const prev = cellStatesRef.current;
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
      if (s === 'water-source') continue;
      if (s === 'weed-hidden') next.set(key, { status: 'weed', timestamp: now });
      else if (s === 'dry' || s === 'dead' || s === 'rotten')
        next.set(key, { status: 'fertile', timestamp: now });
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
    if (grainRef.current >= INITIAL_SILO) return;
    const key  = coordToKey({ gx, gy, row, col });
    const prev = cellStatesRef.current;
    const cell = prev.get(key);
    if ((cell?.status ?? 'dry') !== 'harvestable') return;
    setGrain(g => g + 1);
    setScore(s => s + 5);
    const next  = new Map(prev);
    const count = (cell?.harvests ?? 0) + 1;
    if (count >= 5) next.delete(key);
    else next.set(key, { status: 'fertile', timestamp: Date.now(), harvests: count });
    setCellStates(next);
  };

  const applyLaser = (gx: number, gy: number, row: number, col: number) => {
    if (laserBatteryRef.current <= 0) return;
    const key    = coordToKey({ gx, gy, row, col });
    const prev   = cellStatesRef.current;
    const cell   = prev.get(key);
    const status = cell?.status ?? 'dry';
    if (status === 'dry' || status === 'weed-hidden') return;
    const now = Date.now();
    const next = new Map(prev);
    let scoreGain = 0;
    if (status === 'water-source') {
      const hits = (cell!.laserHits ?? 0) + 1;
      if (hits >= 5) next.delete(key);
      else next.set(key, { ...cell!, laserHits: hits });
    } else if (status === 'fertile') {
      next.delete(key);
    } else if (status === 'weed' || status === 'dead' || status === 'rotten') {
      next.set(key, { status: 'fertile', timestamp: now });
      scoreGain = 1;
    } else if (status === 'planted' || status === 'harvestable') {
      next.set(key, { status: 'fertile', timestamp: now });
    }
    setCellStates(next);
    if (scoreGain) setScore(s => s + scoreGain);
    setLaserBattery(b => Math.max(0, b - BATTERY_PER_USE));
  };

  const placePump = (gx: number, gy: number, row: number, col: number) => {
    if (pumpsRef.current <= 0) return;
    setPumps(p => p - 1);
    setPlacedPumps(prev => [...prev, { id: Math.random().toString(36).slice(2), gx, gy, row, col }]);
    setSelectedTool(null);
  };

  const pickupPump = (id: string) => {
    setPlacedPumps(prev => prev.filter(p => p.id !== id));
    setPumps(p => p + 1);
  };

  const buyPump = () => {
    if (grainRef.current < PUMP_GRAIN_COST) return;
    setGrain(g => g - PUMP_GRAIN_COST);
    setPumps(p => p + 1);
  };

  const tradeGrainForSeeds = () => { if (grain < 1)  return; setGrain(g => g - 1); setSeeds(s => s + 2); };
  const tradeGrainForWater = () => { if (grain < 4)  return; setGrain(g => g - 4); setWater(w => w + 1); };
  const tradeSeedsForGrain = () => { if (seeds < 2)  return; setSeeds(s => s - 2); setGrain(g => g + 1); };
  const tradeWaterForGrain = () => { if (water < 1)  return; setWater(w => w - 1); setGrain(g => g + 4); };
  const buyLaserBattery    = () => {
    if (grainRef.current < BATTERY_GRAIN_COST) return;
    setGrain(g => g - BATTERY_GRAIN_COST);
    setLaserBattery(INITIAL_BATTERY);
  };

  // ── Timers ──────────────────────────────────────────────────────────────────

  // Game tick (5 s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isLoadingRef.current) return;
      const now  = Date.now();
      const prev = cellStatesRef.current;
      let next: Map<string, CellState> | null = null;
      const newlyRotten: ReturnType<typeof keyToCoord>[] = [];

      for (const [key, state] of prev) {
        const elapsed = now - state.timestamp;
        if (state.status === 'fertile' && elapsed >= FERTILE_TIMEOUT) {
          if (!next) next = new Map(prev); next.delete(key);
        } else if (state.status === 'planted' && elapsed >= GROWTH_DURATION) {
          if (!next) next = new Map(prev); next.set(key, { status: 'harvestable', timestamp: now });
        } else if (state.status === 'harvestable' && elapsed >= HARVEST_WINDOW) {
          if (!next) next = new Map(prev); next.set(key, { status: 'dead', timestamp: now });
        } else if (state.status === 'dead' && elapsed >= ROT_DURATION) {
          if (!next) next = new Map(prev); next.set(key, { status: 'rotten', timestamp: now });
          newlyRotten.push(keyToCoord(key));
        } else if (state.status === 'weed' && elapsed >= WEED_SPREAD_MS) {
          if (!next) next = new Map(prev);
          next.set(key, { status: 'weed', timestamp: now });
          for (const nb of get8Neighbors(keyToCoord(key))) {
            const nbKey = coordToKey(nb);
            const nbStatus = (next.get(nbKey) ?? prev.get(nbKey))?.status ?? 'dry';
            if (['dry', 'fertile', 'planted', 'harvestable'].includes(nbStatus))
              next.set(nbKey, { status: 'weed', timestamp: now });
          }
        }
      }

      if (next && newlyRotten.length > 0) {
        for (const coord of newlyRotten) {
          for (const nb of get4Cardinals(coord)) {
            const nbKey = coordToKey(nb);
            if ((next.get(nbKey) ?? prev.get(nbKey))?.status !== 'rotten')
              next.set(nbKey, { status: 'rotten', timestamp: now });
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
    }, GAME_TICK_MS);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pump tick (60 s)
  useEffect(() => {
    const id = setInterval(() => {
      if (isLoadingRef.current || placedPumpsRef.current.length === 0) return;
      const prev = cellStatesRef.current;
      let next: Map<string, CellState> | null = null;
      let waterGained = 0;
      for (const pump of placedPumpsRef.current) {
        let pumpHasSource = false;
        for (const nb of get8Neighbors(pump)) {
          const nbKey = coordToKey(nb);
          const cell  = (next ?? prev).get(nbKey);
          if (cell?.status !== 'water-source') continue;
          pumpHasSource = true;
          if (!next) next = new Map(prev);
          const pumped = (cell.pumpedMs ?? 0) + PUMP_TICK_MS;
          if (pumped >= PUMP_EXHAUST_MS) next.delete(nbKey);
          else next.set(nbKey, { ...cell, pumpedMs: pumped });
        }
        if (pumpHasSource) waterGained += PUMP_WATER_PER_MIN;
      }
      if (waterGained > 0) setWater(w => w + waterGained);
      if (next) setCellStates(next);
    }, PUMP_TICK_MS);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Passive water income
  useEffect(() => {
    const id = setInterval(() => setWater(w => w + 1), WATER_INCOME_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <GameContext.Provider value={{
      seeds, water, grain, score, siloCapacity: INITIAL_SILO, laserBattery,
      pumps, placedPumps, sessionId, playerName, isLoadingSession,
      selectedTool, selectTool, deselectTool,
      cellStates, unlockedZones, activeZone, setActiveZone,
      hasHarvestable, hasLaserTarget, isGameOver,
      applyWater, applySeed, applyHarvest, applyLaser,
      placePump, pickupPump, buyPump,
      tradeGrainForSeeds, tradeGrainForWater, tradeSeedsForGrain, tradeWaterForGrain,
      buyLaserBattery,
      sendOtp, initSession, saveSession,
    }}>
      {children}
    </GameContext.Provider>
  );
}
