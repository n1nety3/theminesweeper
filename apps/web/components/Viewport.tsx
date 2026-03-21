'use client';

import { useRef, useEffect } from 'react';
import { useViewport, type UnlockedBounds } from '@/hooks/useViewport';
import { ViewportContext } from '@/contexts/ViewportContext';
import ItemPanel from './ItemPanel';
import StatusBar from './StatusBar';
import DayNightStrip from './DayNightStrip';
import { useGame } from '@/contexts/GameContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  ZONE_STRIDE, ZONE_SIZE,
  CELL_SIZE, CELL_GAP, CELLS_PER_ZONE,
} from '@/lib/boardConstants';

// Tool icon filenames for the cursor follower on the playground
const TOOL_ICON: Record<string, string> = {
  water:   'tool-water.svg',
  seed:    'tool-seed.svg',
  harvest: 'tool-harvest.svg',
  laser:   'tool-target.svg',  // target crosshair on playground (laser icon used in inventory)
  pump:    'tool-pump.svg',
};

// Hover highlight colour per tool
const TOOL_HOVER_COLOR: Record<string, string> = {
  water:   'rgba(80, 160, 220, 0.22)',
  seed:    'rgba(80, 200, 80, 0.22)',
  harvest: 'rgba(240, 200, 40, 0.22)',
  laser:   'rgba(220, 80, 60, 0.22)',
  pump:    'rgba(80, 180, 220, 0.30)',
};

function worldToCell(wx: number, wy: number) {
  const gx = Math.floor(wx / ZONE_STRIDE);
  const gy = Math.floor(wy / ZONE_STRIDE);
  const lx = wx - gx * ZONE_STRIDE;
  const ly = wy - gy * ZONE_STRIDE;
  if (lx < 0 || lx >= ZONE_SIZE || ly < 0 || ly >= ZONE_SIZE) return null;
  const col = Math.floor(lx / (CELL_SIZE + CELL_GAP));
  const row = Math.floor(ly / (CELL_SIZE + CELL_GAP));
  if (col >= CELLS_PER_ZONE || row >= CELLS_PER_ZONE) return null;
  return { gx, gy, row, col };
}

export default function Viewport({ children }: { children: React.ReactNode }) {
  const { selectedTool, activeZone, unlockedZones, deselectTool } = useGame();
  const { theme } = useTheme();
  const folder = theme === 'light' ? 'Light' : 'Dark';

  const anchorX = activeZone.gx * ZONE_STRIDE + ZONE_SIZE / 2;
  const anchorY = activeZone.gy * ZONE_STRIDE + ZONE_SIZE / 2;

  // Unlocked bounding box — updated each render, read from event handlers via ref
  const unlockedBoundsRef = useRef<UnlockedBounds | null>(null);
  {
    let minGX = Infinity, maxGX = -Infinity, minGY = Infinity, maxGY = -Infinity;
    for (const zk of unlockedZones) {
      const [gx, gy] = zk.split(',').map(Number);
      if (gx < minGX) minGX = gx; if (gx > maxGX) maxGX = gx;
      if (gy < minGY) minGY = gy; if (gy > maxGY) maxGY = gy;
    }
    unlockedBoundsRef.current = unlockedZones.size > 0 ? {
      minX: minGX * ZONE_STRIDE,
      maxX: (maxGX + 1) * ZONE_STRIDE,
      minY: minGY * ZONE_STRIDE,
      maxY: (maxGY + 1) * ZONE_STRIDE,
    } : null;
  }

  const worldRef  = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const hoverRef  = useRef<HTMLDivElement>(null);

  // Keep selectedTool accessible inside the effect without stale closure
  const selectedToolRef = useRef(selectedTool);
  selectedToolRef.current = selectedTool;

  const { containerRef, transform, containerSize, worldClick, transformRef } =
    useViewport(anchorX, anchorY, worldRef, unlockedBoundsRef);

  // Mouse tracking — drives both cursor follower and hover highlight
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      // Hide cursor + hover when mouse is over a UI overlay (header / inventory)
      const overUI = !!(e.target as Element).closest('[data-no-cursor]');
      if (overUI) {
        if (cursorRef.current) cursorRef.current.style.visibility = 'hidden';
        if (hoverRef.current)  hoverRef.current.style.display = 'none';
        return;
      }

      // ── Cursor follower (screen space) ──────────────────────────
      if (cursorRef.current) {
        const tool = selectedToolRef.current;
        // Default cursor: tip is at SVG (0,0) → no offset needed
        // Tool icons are 32×32, center them under the pointer
        const ox = tool ? -16 : 0;
        const oy = tool ? -16 : 0;
        cursorRef.current.style.transform = `translate(${sx + ox}px, ${sy + oy}px)`;
        cursorRef.current.style.visibility = 'visible';
      }

      // ── Hover highlight (world space) ────────────────────────────
      const tool = selectedToolRef.current;
      if (!hoverRef.current || !tool) {
        if (hoverRef.current) hoverRef.current.style.display = 'none';
        return;
      }

      const t  = transformRef.current;
      const wx = (sx - t.x) / t.scale;
      const wy = (sy - t.y) / t.scale;
      const cell = worldToCell(wx, wy);

      if (!cell) { hoverRef.current.style.display = 'none'; return; }

      const { gx, gy, row, col } = cell;
      const isWater = tool === 'water';
      const size = isWater ? 3 : 1;
      const half = Math.floor(size / 2);

      let sr = row - half, sc = col - half;
      let sgx = gx, sgy = gy;
      while (sr < 0) { sgy--; sr += CELLS_PER_ZONE; }
      while (sc < 0) { sgx--; sc += CELLS_PER_ZONE; }

      const px = sgx * ZONE_STRIDE + sc * (CELL_SIZE + CELL_GAP);
      const py = sgy * ZONE_STRIDE + sr * (CELL_SIZE + CELL_GAP);
      const pw = size * CELL_SIZE + (size - 1) * CELL_GAP;
      const ph = size * CELL_SIZE + (size - 1) * CELL_GAP;

      hoverRef.current.style.display          = 'block';
      hoverRef.current.style.left             = `${px}px`;
      hoverRef.current.style.top              = `${py}px`;
      hoverRef.current.style.width            = `${pw}px`;
      hoverRef.current.style.height           = `${ph}px`;
      hoverRef.current.style.backgroundColor  = TOOL_HOVER_COLOR[tool] ?? 'rgba(255,255,255,0.15)';
    };

    const onLeave = () => {
      if (cursorRef.current) cursorRef.current.style.visibility = 'hidden';
      if (hoverRef.current)  hoverRef.current.style.display = 'none';
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ViewportContext.Provider
      value={{ transform, containerWidth: containerSize.width, containerHeight: containerSize.height, worldClick }}
    >
      <div
        ref={containerRef}
        onContextMenu={e => { e.preventDefault(); deselectTool(); }}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
          cursor: 'none',
          touchAction: 'none',
          backgroundColor: 'var(--page-bg)',
        }}
      >
        {/* World layer */}
        <div
          ref={worldRef}
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            position: 'absolute',
            top: 0,
            left: 0,
            willChange: 'transform',
          }}
        >
          {children}

          {/* Hover highlight — world space, hidden when no tool */}
          <div
            ref={hoverRef}
            style={{
              position: 'absolute',
              display: 'none',
              pointerEvents: 'none',
              borderRadius: 3,
              border: '1.5px solid rgba(255,255,255,0.35)',
              zIndex: 5,
            }}
          />
        </div>

        {/* Zoom indicator */}
        <div style={{
          position: 'absolute', bottom: 12, right: 14,
          fontFamily: 'var(--font-vt323)', fontSize: 16,
          color: '#3a5a7a', letterSpacing: '0.05em',
          pointerEvents: 'none', userSelect: 'none',
        }}>
          {Math.round(transform.scale * 100)}%
        </div>

        <StatusBar />
        <DayNightStrip />
        <ItemPanel />

        {/* Custom cursor follower — screen space, on top of everything */}
        <div
          ref={cursorRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            visibility: 'hidden',
            zIndex: 30,
            willChange: 'transform',
          }}
        >
          {selectedTool && TOOL_ICON[selectedTool] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/assets/${folder}/${TOOL_ICON[selectedTool]}`}
              width={32} height={32}
              draggable={false} alt=""
              style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.6))' }}
            />
          ) : (
            // Default cursor — render at natural proportions, tip at (0,0)
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/assets/${folder}/icon-cursor.svg`}
              width={28} height={46}
              draggable={false} alt=""
            />
          )}
        </div>
      </div>
    </ViewportContext.Provider>
  );
}
