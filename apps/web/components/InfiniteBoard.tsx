'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useViewportContext } from '@/contexts/ViewportContext';
import { useGame, type CellState } from '@/contexts/GameContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  CELL_SIZE,
  CELL_GAP,
  CELLS_PER_ZONE,
  ZONE_SIZE,
  ZONE_STRIDE,
} from '@/lib/boardConstants';

const VIEWPORT_BUFFER = 1;
const NEIGHBOR_DELTAS: [number, number][] = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];

// Map each cell status to its SVG filename
const STATUS_ICON: Record<string, string> = {
  dry:            'tile-dry.svg',
  'water-source': 'tile-water-source.svg',
  'weed-hidden':  'tile-dry.svg',        // hidden — looks identical to dry soil
  weed:           'tile-weed.svg',
  fertile:        'tile-fertile.svg',
  planted:        'tile-seeded.svg',
  harvestable:    'tile-harvestable.svg',
  dead:           'tile-dead.svg',
  rotten:         'tile-rotten.svg',
};

function worldToCell(worldX: number, worldY: number) {
  const gx = Math.floor(worldX / ZONE_STRIDE);
  const gy = Math.floor(worldY / ZONE_STRIDE);
  const localX = worldX - gx * ZONE_STRIDE;
  const localY = worldY - gy * ZONE_STRIDE;
  if (localX >= ZONE_SIZE || localY >= ZONE_SIZE) return null;
  const col = Math.floor(localX / (CELL_SIZE + CELL_GAP));
  const row = Math.floor(localY / (CELL_SIZE + CELL_GAP));
  if (col >= CELLS_PER_ZONE || row >= CELLS_PER_ZONE) return null;
  return { gx, gy, row, col };
}

function getZoneStates(
  cellStates: Map<string, CellState>,
  gx: number,
  gy: number,
): Map<number, CellState> {
  const prefix = `${gx},${gy},`;
  const map = new Map<number, CellState>();
  for (const [key, state] of cellStates) {
    if (key.startsWith(prefix)) {
      map.set(Number(key.slice(prefix.length)), state);
    }
  }
  return map;
}

const CELL_INDICES = Array.from({ length: CELLS_PER_ZONE * CELLS_PER_ZONE }, (_, i) => i);

// Animated cells: frame index driven by a shared clock tick
const PLANTED_FRAMES = [
  'tile-planted-01.svg','tile-planted-02.svg','tile-planted-03.svg',
  'tile-planted-04.svg','tile-planted-05.svg','tile-planted-06.svg',
];

type ZoneType = 'active' | 'unlocked' | 'locked';

function Zone({
  type,
  zoneStates,
  folder,
  pumpedIndices,
  animFrame,
}: {
  type: ZoneType;
  zoneStates?: Map<number, CellState>;
  folder: string;
  pumpedIndices?: Set<number>;
  animFrame: number;
}) {
  return (
    <div
      className={`zone zone-${type}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${CELLS_PER_ZONE}, ${CELL_SIZE}px)`,
        gridTemplateRows:    `repeat(${CELLS_PER_ZONE}, ${CELL_SIZE}px)`,
        gap: CELL_GAP,
        width:  ZONE_SIZE,
        height: ZONE_SIZE,
      }}
    >
      {CELL_INDICES.map(i => {
        if (type === 'locked') {
          return (
            <div key={i} className="zone-cell-locked" style={{ borderRadius: 2, overflow: 'hidden', opacity: 0.22 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="zone-cell-image"
                src={`/assets/${folder}/tile-dry.svg`}
                width={CELL_SIZE} height={CELL_SIZE}
                style={{ display: 'block', width: '100%', height: '100%' }}
                draggable={false} alt=""
              />
            </div>
          );
        }

        const status   = zoneStates?.get(i)?.status ?? 'dry';
        const isPumped = status === 'water-source' && (pumpedIndices?.has(i) ?? false);

        // Animated icon selection
        let icon: string;
        if (status === 'planted') {
          // Phase from frame 0→5 over the full 2-minute growth window (no looping)
          const cell = zoneStates?.get(i);
          const elapsed = cell ? Date.now() - cell.timestamp : 0;
          const frameIdx = Math.min(5, Math.floor((elapsed / 120_000) * 6));
          icon = PLANTED_FRAMES[frameIdx];
        } else if (status === 'weed') {
          icon = animFrame % 2 === 0 ? 'tile-weed.svg' : 'tile-weed-move.svg';
        } else if (status === 'water-source') {
          icon = animFrame % 2 === 0 ? 'tile-water-source.svg' : 'tile-water-source-move.svg';
        } else {
          icon = STATUS_ICON[status] ?? 'tile-dry.svg';
        }

        return (
          <div
            key={i}
            className={`zone-cell zone-cell-${status} ${isPumped ? 'zone-cell-pumped' : ''}`}
            style={{
              borderRadius: 2, overflow: 'hidden',
              animation: isPumped ? 'pump-pulse 1.4s ease-in-out infinite' : undefined,
              transformOrigin: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="zone-cell-image"
              src={`/assets/${folder}/${icon}`}
              width={CELL_SIZE} height={CELL_SIZE}
              style={{ display: 'block', width: '100%', height: '100%' }}
              draggable={false} alt=""
            />
          </div>
        );
      })}
    </div>
  );
}

export default function InfiniteBoard() {
  const { transform, containerWidth, containerHeight, worldClick } = useViewportContext();

  // Shared animation frame tick: planted (600 ms/frame), weed+water-source (800 ms)
  const [animFrame, setAnimFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setAnimFrame(f => f + 1), 600);
    return () => clearInterval(id);
  }, []);
  const {
    selectedTool,
    cellStates,
    unlockedZones,
    activeZone,
    setActiveZone,
    applyWater,
    applySeed,
    applyHarvest,
    applyLaser,
    placedPumps,
    placePump,
    pickupPump,
  } = useGame();
  const { theme } = useTheme();
  const folder = theme === 'light' ? 'Light' : 'Dark';

  // Long-press timer for picking up placed pumps
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Click/tap-and-hold on a placed pump returns it to inventory (hold 500 ms)
  const startLongPress = useCallback((pumpId: string) => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
    longPressRef.current = setTimeout(() => {
      longPressRef.current = null;
      pickupPump(pumpId);
    }, 500);
  }, [pickupPump]);
  const cancelLongPress = useCallback(() => {
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
  }, []);

  const handlePumpMouseDown  = useCallback((e: React.MouseEvent,  id: string) => { e.stopPropagation(); startLongPress(id); }, [startLongPress]);
  const handlePumpMouseUp    = useCallback((e: React.MouseEvent)               => { e.stopPropagation(); cancelLongPress(); }, [cancelLongPress]);
  const handlePumpTouchStart = useCallback((e: React.TouchEvent,  id: string) => { e.stopPropagation(); startLongPress(id); }, [startLongPress]);
  const handlePumpTouchEnd   = useCallback((e: React.TouchEvent)               => { e.stopPropagation(); cancelLongPress(); }, [cancelLongPress]);

  const lastSeq = useRef(0);
  useEffect(() => {
    if (!worldClick || worldClick.seq === lastSeq.current) return;
    lastSeq.current = worldClick.seq;

    const cell = worldToCell(worldClick.x, worldClick.y);
    if (!cell) return;

    const { gx, gy, row, col } = cell;
    const zoneKey = `${gx},${gy}`;

    if (!unlockedZones.has(zoneKey)) return;

    if (gx !== activeZone.gx || gy !== activeZone.gy) {
      setActiveZone(gx, gy);
      return;
    }

    if (!selectedTool) return;
    switch (selectedTool) {
      case 'water':   applyWater(gx, gy, row, col);   break;
      case 'seed':    applySeed(gx, gy, row, col);     break;
      case 'harvest': applyHarvest(gx, gy, row, col);  break;
      case 'laser':   applyLaser(gx, gy, row, col);    break;
      case 'pump':    placePump(gx, gy, row, col);     break;
    }
  }, [worldClick]); // eslint-disable-line react-hooks/exhaustive-deps

  // Viewport bounds in world space (for culling)
  const vpMinGX = Math.floor((-transform.x) / transform.scale / ZONE_STRIDE) - VIEWPORT_BUFFER;
  const vpMaxGX = Math.ceil((containerWidth - transform.x) / transform.scale / ZONE_STRIDE) + VIEWPORT_BUFFER;
  const vpMinGY = Math.floor((-transform.y) / transform.scale / ZONE_STRIDE) - VIEWPORT_BUFFER;
  const vpMaxGY = Math.ceil((containerHeight - transform.y) / transform.scale / ZONE_STRIDE) + VIEWPORT_BUFFER;

  const inViewport = (gx: number, gy: number) =>
    gx >= vpMinGX && gx <= vpMaxGX && gy >= vpMinGY && gy <= vpMaxGY;

  // Compute which water-source cell indices (per zone) are adjacent to a placed pump
  const pumpedByZone = new Map<string, Set<number>>();
  for (const pump of placedPumps) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        let ngx = pump.gx, ngy = pump.gy, nr = pump.row + dr, nc = pump.col + dc;
        if (nr < 0)                    { ngy--; nr += CELLS_PER_ZONE; }
        else if (nr >= CELLS_PER_ZONE) { ngy++; nr  = 0; }
        if (nc < 0)                    { ngx--; nc += CELLS_PER_ZONE; }
        else if (nc >= CELLS_PER_ZONE) { ngx++; nc  = 0; }
        const key   = `${ngx},${ngy},${nr * CELLS_PER_ZONE + nc}`;
        const cell  = cellStates.get(key);
        if (cell?.status !== 'water-source') continue;
        const zk    = `${ngx},${ngy}`;
        const idx   = nr * CELLS_PER_ZONE + nc;
        if (!pumpedByZone.has(zk)) pumpedByZone.set(zk, new Set());
        pumpedByZone.get(zk)!.add(idx);
      }
    }
  }

  // Build zone list: unlocked zones + their locked immediate neighbours (hinting what's beyond)
  const renderedKeys = new Set<string>();
  const zonesToRender: { gx: number; gy: number; type: ZoneType }[] = [];

  for (const zk of unlockedZones) {
    const [gx, gy] = zk.split(',').map(Number);
    if (!inViewport(gx, gy)) continue;
    const isActive = gx === activeZone.gx && gy === activeZone.gy;
    zonesToRender.push({ gx, gy, type: isActive ? 'active' : 'unlocked' });
    renderedKeys.add(zk);

    // Adjacent locked neighbours as faint boundary tiles
    for (const [dgx, dgy] of NEIGHBOR_DELTAS) {
      const ngx = gx + dgx, ngy = gy + dgy;
      const nk = `${ngx},${ngy}`;
      if (!unlockedZones.has(nk) && !renderedKeys.has(nk) && inViewport(ngx, ngy)) {
        zonesToRender.push({ gx: ngx, gy: ngy, type: 'locked' });
        renderedKeys.add(nk);
      }
    }
  }

  const zones = zonesToRender.map(({ gx, gy, type }) => (
    <div
      key={`${gx},${gy}`}
      className="zone-container"
      style={{ position: 'absolute', left: gx * ZONE_STRIDE, top: gy * ZONE_STRIDE }}
    >
      <Zone
        type={type}
        zoneStates={type !== 'locked' ? getZoneStates(cellStates, gx, gy) : undefined}
        folder={folder}
        pumpedIndices={pumpedByZone.get(`${gx},${gy}`)}
        animFrame={animFrame}
      />
    </div>
  ));

  // Placed pump overlays (world-space)
  const pumpOverlays = placedPumps.map(pump => {
    const wx = pump.gx * ZONE_STRIDE + pump.col * (CELL_SIZE + CELL_GAP);
    const wy = pump.gy * ZONE_STRIDE + pump.row * (CELL_SIZE + CELL_GAP);
    return (
      <div
        key={pump.id}
        className="pump-overlay"
        onMouseDown={e => handlePumpMouseDown(e, pump.id)}
        onMouseUp={handlePumpMouseUp}
        onMouseLeave={handlePumpMouseUp}
        onTouchStart={e => handlePumpTouchStart(e, pump.id)}
        onTouchEnd={handlePumpTouchEnd}
        onTouchCancel={handlePumpTouchEnd}
        title="Hold to return pump to inventory"
        style={{
          position: 'absolute',
          left: wx, top: wy,
          width: CELL_SIZE, height: CELL_SIZE,
          zIndex: 10,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.7))',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="pump-icon"
          src={`/assets/${folder}/tool-pump.svg`}
          width={CELL_SIZE - 4}
          height={CELL_SIZE - 4}
          draggable={false}
          alt="pump"
        />
      </div>
    );
  });

  return (
    <div className="infinite-board" style={{ position: 'relative', width: 0, height: 0 }}>
      {zones}
      {pumpOverlays}
    </div>
  );
}
