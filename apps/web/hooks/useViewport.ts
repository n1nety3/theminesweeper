'use client';

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { ViewportTransform, WorldClick } from '@/contexts/ViewportContext';
import { ZONE_STRIDE } from '@/lib/boardConstants';

const MIN_SCALE = 0.75;
const MAX_SCALE = 1.90;
const BUFFER    = 1;

const RESISTANCE_RADIUS = 1400;
const SPRING_K  = 0.018;
const DAMPING   = 0.88;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function zoneRange(t: ViewportTransform, w: number, h: number) {
  return {
    minGX: Math.floor(-t.x / t.scale / ZONE_STRIDE) - BUFFER,
    maxGX: Math.ceil((-t.x + w) / t.scale / ZONE_STRIDE) + BUFFER,
    minGY: Math.floor(-t.y / t.scale / ZONE_STRIDE) - BUFFER,
    maxGY: Math.ceil((-t.y + h) / t.scale / ZONE_STRIDE) + BUFFER,
  };
}

export type UnlockedBounds = { minX: number; maxX: number; minY: number; maxY: number };

export function useViewport(
  anchorWorldX: number,
  anchorWorldY: number,
  worldRef: RefObject<HTMLDivElement | null>,
  unlockedBoundsRef: RefObject<UnlockedBounds | null>,
) {
  const anchorRef    = useRef({ x: anchorWorldX, y: anchorWorldY });
  const containerRef = useRef<HTMLDivElement>(null);

  // transform is React state ONLY for zone-range or scale changes — not every pixel
  const [transform, setTransform] = useState<ViewportTransform>({ x: 0, y: 0, scale: 1 });
  const transformRef = useRef<ViewportTransform>({ x: 0, y: 0, scale: 1 });
  const lastRange    = useRef({ minGX: 0, maxGX: 0, minGY: 0, maxGY: 0 });

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerSizeRef = useRef({ width: 0, height: 0 });

  const [worldClick, setWorldClick] = useState<WorldClick | null>(null);
  const clickSeq = useRef(0);

  const computeHome = (w: number, h: number, scale: number) => {
    const bounds = unlockedBoundsRef.current;
    const cx = bounds ? (bounds.minX + bounds.maxX) / 2 : anchorRef.current.x;
    const cy = bounds ? (bounds.minY + bounds.maxY) / 2 : anchorRef.current.y;
    return { x: w / 2 - cx * scale, y: h / 2 - cy * scale };
  };

  // Core: apply transform without going through React state every frame.
  // Directly mutates the world div's CSS transform, then only calls setState
  // when the visible zone range or scale actually changes.
  const applyTransform = (t: ViewportTransform) => {
    const safe: ViewportTransform = { ...t, scale: clamp(t.scale, MIN_SCALE, MAX_SCALE) };
    transformRef.current = safe;

    // Instant DOM update — no React render
    if (worldRef.current) {
      worldRef.current.style.transform =
        `translate(${safe.x}px,${safe.y}px) scale(${safe.scale})`;
    }

    // React state update only when zones or scale change
    const { width, height } = containerSizeRef.current;
    const r = zoneRange(safe, width, height);
    const p = lastRange.current;
    if (
      r.minGX !== p.minGX || r.maxGX !== p.maxGX ||
      r.minGY !== p.minGY || r.maxGY !== p.maxGY ||
      safe.scale !== transformRef.current.scale // always sync scale for zoom indicator
    ) {
      lastRange.current = r;
      setTransform(safe);
    }
  };

  // Interaction state
  const isDragging      = useRef(false);
  const lastMouse       = useRef({ x: 0, y: 0 });
  const totalDragDist   = useRef(0);
  const lastPinchDist   = useRef<number | null>(null);
  const lastPinchMid    = useRef({ x: 0, y: 0 });

  // Spring
  const springRafRef = useRef<number | null>(null);
  const springVel    = useRef({ x: 0, y: 0 });

  const stopSpring = () => {
    if (springRafRef.current !== null) {
      cancelAnimationFrame(springRafRef.current);
      springRafRef.current = null;
    }
    springVel.current = { x: 0, y: 0 };
  };

  // Returns the spring target ONLY when viewport centre is outside unlocked bounds.
  // Returns null when inside bounds → no spring needed.
  // Pass forceTo to always spring to a specific screen-space position (e.g. zone selection).
  const getEdgeTarget = (
    t: ViewportTransform, w: number, h: number,
  ): { x: number; y: number } | null => {
    const bounds = unlockedBoundsRef.current;
    if (!bounds) return computeHome(w, h, t.scale); // no bounds → spring to anchor
    const cx = (-t.x + w / 2) / t.scale;
    const cy = (-t.y + h / 2) / t.scale;
    if (cx >= bounds.minX && cx <= bounds.maxX && cy >= bounds.minY && cy <= bounds.maxY) {
      return null; // inside — no spring
    }
    // Clamp to nearest point on unlocked bounds
    const tcx = Math.max(bounds.minX, Math.min(bounds.maxX, cx));
    const tcy = Math.max(bounds.minY, Math.min(bounds.maxY, cy));
    return { x: w / 2 - tcx * t.scale, y: h / 2 - tcy * t.scale };
  };

  const startSpring = (forceTo?: { x: number; y: number }) => {
    stopSpring();
    const tick = () => {
      const curr = transformRef.current;
      const { width, height } = containerSizeRef.current;
      const target = forceTo ?? getEdgeTarget(curr, width, height);

      if (!target) {
        springRafRef.current = null; // inside bounds — stop
        return;
      }

      springVel.current.x = (springVel.current.x + (target.x - curr.x) * SPRING_K) * DAMPING;
      springVel.current.y = (springVel.current.y + (target.y - curr.y) * SPRING_K) * DAMPING;

      applyTransform({
        ...curr,
        x: curr.x + springVel.current.x,
        y: curr.y + springVel.current.y,
      });

      if (Math.abs(springVel.current.x) > 0.3 || Math.abs(springVel.current.y) > 0.3) {
        springRafRef.current = requestAnimationFrame(tick);
      } else {
        const snap = forceTo ?? getEdgeTarget(transformRef.current, width, height);
        if (snap) {
          applyTransform({ ...transformRef.current, x: snap.x, y: snap.y });
          setTransform({ ...transformRef.current, x: snap.x, y: snap.y });
        }
        springRafRef.current = null;
      }
    };
    springRafRef.current = requestAnimationFrame(tick);
  };

  // Container size + initial centering
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      containerSizeRef.current = { width, height };
      setContainerSize({ width, height });

      if (transformRef.current.x === 0 && transformRef.current.y === 0) {
        const home = computeHome(width, height, 1);
        const t: ViewportTransform = { x: home.x, y: home.y, scale: 1 };
        transformRef.current = t;
        if (worldRef.current)
          worldRef.current.style.transform = `translate(${t.x}px,${t.y}px) scale(1)`;
        lastRange.current = zoneRange(t, width, height);
        setTransform(t);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getResistance = (t: ViewportTransform): number => {
      const { width, height } = containerSizeRef.current;
      const bounds = unlockedBoundsRef.current;
      if (bounds) {
        const cx = (-t.x + width / 2) / t.scale;
        const cy = (-t.y + height / 2) / t.scale;
        const dx = Math.max(0, bounds.minX - cx, cx - bounds.maxX);
        const dy = Math.max(0, bounds.minY - cy, cy - bounds.maxY);
        const dist = Math.hypot(dx, dy);
        if (dist === 0) return 1; // inside bounds — full freedom, no resistance
        return 1 / (1 + dist / 180); // outside — rubber band slows you down
      }
      return 1;
    };

    // Wheel zoom
    let zoomTarget = 1;
    let zoomCx = 0, zoomCy = 0;
    let zoomRaf: number | null = null;

    const tickZoom = () => {
      const curr = transformRef.current;
      const diff = zoomTarget - curr.scale;
      if (Math.abs(diff) < 0.001) {
        applyTransform({
          ...curr, scale: zoomTarget,
          x: zoomCx - (zoomTarget / curr.scale) * (zoomCx - curr.x),
          y: zoomCy - (zoomTarget / curr.scale) * (zoomCy - curr.y),
        });
        setTransform(transformRef.current); // sync zoom indicator
        zoomRaf = null;
        return;
      }
      const ns    = curr.scale + diff * 0.18;
      const ratio = ns / curr.scale;
      applyTransform({ x: zoomCx - ratio * (zoomCx - curr.x), y: zoomCy - ratio * (zoomCy - curr.y), scale: ns });
      zoomRaf = requestAnimationFrame(tickZoom);
    };

    const onWheel = (e: WheelEvent) => {
      if ((e.target as Element).closest('[data-no-cursor]')) return;
      e.preventDefault();
      stopSpring();
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const rect   = el.getBoundingClientRect();
      zoomCx = e.clientX - rect.left;
      zoomCy = e.clientY - rect.top;
      zoomTarget = clamp(
        (zoomRaf ? zoomTarget : transformRef.current.scale) * factor,
        MIN_SCALE, MAX_SCALE,
      );
      if (zoomRaf === null) zoomRaf = requestAnimationFrame(tickZoom);
    };

    // Mouse drag
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      // Ignore clicks that originate inside any UI overlay panel
      if ((e.target as Element).closest('[data-no-cursor]')) return;
      stopSpring();
      isDragging.current    = true;
      lastMouse.current     = { x: e.clientX, y: e.clientY };
      totalDragDist.current = 0;
      el.style.cursor = 'grabbing';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      totalDragDist.current += Math.hypot(dx, dy);
      lastMouse.current = { x: e.clientX, y: e.clientY };
      // Don't pan until movement clearly exceeds click threshold
      if (totalDragDist.current < 6) return;
      const curr = transformRef.current;
      const r = getResistance(curr);
      applyTransform({ ...curr, x: curr.x + dx * r, y: curr.y + dy * r });
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      el.style.cursor = '';

      if (totalDragDist.current < 5) {
        const rect   = el.getBoundingClientRect();
        const curr   = transformRef.current;
        const worldX = (e.clientX - rect.left - curr.x) / curr.scale;
        const worldY = (e.clientY - rect.top  - curr.y) / curr.scale;
        setWorldClick({ x: worldX, y: worldY, seq: ++clickSeq.current });
      } else {
        startSpring();
      }
    };

    // Touch
    const onTouchStart = (e: TouchEvent) => {
      // Let UI overlay elements (buttons, panels) receive clicks normally.
      // Only intercept touches that land on the game world itself.
      if ((e.target as Element).closest('[data-no-cursor]')) return;

      e.preventDefault();
      stopSpring();
      totalDragDist.current = 0;

      if (e.touches.length === 1) {
        isDragging.current    = true;
        lastMouse.current     = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        lastPinchDist.current = null;
      } else if (e.touches.length === 2) {
        isDragging.current    = false;
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        lastPinchDist.current = Math.hypot(dx, dy);
        lastPinchMid.current  = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if ((e.target as Element).closest('[data-no-cursor]')) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const curr = transformRef.current;

      if (e.touches.length === 1 && isDragging.current && lastPinchDist.current === null) {
        const dx = e.touches[0].clientX - lastMouse.current.x;
        const dy = e.touches[0].clientY - lastMouse.current.y;
        totalDragDist.current += Math.hypot(dx, dy);
        lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        applyTransform({ ...curr, x: curr.x + dx * getResistance(curr), y: curr.y + dy * getResistance(curr) });
      } else if (e.touches.length === 2) {
        const dx   = e.touches[1].clientX - e.touches[0].clientX;
        const dy   = e.touches[1].clientY - e.touches[0].clientY;
        const dist = Math.hypot(dx, dy);
        const mid  = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
        if (lastPinchDist.current !== null) {
          const factor   = dist / lastPinchDist.current;
          const cx       = mid.x - rect.left;
          const cy       = mid.y - rect.top;
          const newScale = clamp(curr.scale * factor, MIN_SCALE, MAX_SCALE);
          const ratio    = newScale / curr.scale;
          applyTransform({
            x: cx - ratio * (cx - curr.x) + (mid.x - lastPinchMid.current.x),
            y: cy - ratio * (cy - curr.y) + (mid.y - lastPinchMid.current.y),
            scale: newScale,
          });
        }
        lastPinchDist.current = dist;
        lastPinchMid.current  = mid;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) lastPinchDist.current = null;

      if (e.touches.length === 0) {
        isDragging.current = false;

        // Tap on the world — fire a worldClick (equivalent to mouse click)
        if (totalDragDist.current < 8 && e.changedTouches.length > 0) {
          const touch  = e.changedTouches[0];
          const rect   = el.getBoundingClientRect();
          const curr   = transformRef.current;
          const worldX = (touch.clientX - rect.left - curr.x) / curr.scale;
          const worldY = (touch.clientY - rect.top  - curr.y) / curr.scale;
          setWorldClick({ x: worldX, y: worldY, seq: ++clickSeq.current });
        } else {
          startSpring();
        }
      } else if (e.touches.length === 1) {
        lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    el.addEventListener('wheel',      onWheel,      { passive: false });
    el.addEventListener('mousedown',  onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove',  onTouchMove,  { passive: false });
    el.addEventListener('touchend',   onTouchEnd);

    return () => {
      el.removeEventListener('wheel',      onWheel);
      el.removeEventListener('mousedown',  onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
      stopSpring();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Active zone change → spring to that zone's centre
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    anchorRef.current = { x: anchorWorldX, y: anchorWorldY };
    const { width, height } = containerSizeRef.current;
    const s = transformRef.current.scale;
    startSpring({ x: width / 2 - anchorWorldX * s, y: height / 2 - anchorWorldY * s });
  }, [anchorWorldX, anchorWorldY]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard pan (WASD / arrows) and zoom (Q / E)
  useEffect(() => {
    const heldKeys  = new Set<string>();
    let   kbRaf: number | null = null;
    const PAN_SPEED = 8;
    const ACCEL     = 0.22;
    const DECEL     = 0.80;
    const kbVel     = { x: 0, y: 0 };

    const kbTick = () => {
      let tx = 0, ty = 0;
      if (heldKeys.has('ArrowLeft')  || heldKeys.has('a') || heldKeys.has('A')) tx += PAN_SPEED;
      if (heldKeys.has('ArrowRight') || heldKeys.has('d') || heldKeys.has('D')) tx -= PAN_SPEED;
      if (heldKeys.has('ArrowUp')    || heldKeys.has('w') || heldKeys.has('W')) ty += PAN_SPEED;
      if (heldKeys.has('ArrowDown')  || heldKeys.has('s') || heldKeys.has('S')) ty -= PAN_SPEED;

      kbVel.x = kbVel.x + (tx - kbVel.x) * ACCEL;
      kbVel.y = kbVel.y + (ty - kbVel.y) * ACCEL;
      if (tx === 0) kbVel.x *= DECEL;
      if (ty === 0) kbVel.y *= DECEL;

      if (Math.abs(kbVel.x) > 0.05 || Math.abs(kbVel.y) > 0.05) {
        const c = transformRef.current;
        applyTransform({ ...c, x: c.x + kbVel.x, y: c.y + kbVel.y });
        kbRaf = requestAnimationFrame(kbTick);
      } else {
        kbVel.x = kbVel.y = 0;
        kbRaf = null;
        startSpring();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as Element)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      switch (e.key) {
        case 'q': case 'Q': {
          e.preventDefault();
          const c = transformRef.current;
          const { width, height } = containerSizeRef.current;
          const ns = clamp(c.scale * 1.1, MIN_SCALE, MAX_SCALE);
          const r  = ns / c.scale;
          applyTransform({ x: width/2 - r*(width/2 - c.x), y: height/2 - r*(height/2 - c.y), scale: ns });
          setTransform(transformRef.current);
          return;
        }
        case 'e': case 'E': {
          e.preventDefault();
          const c = transformRef.current;
          const { width, height } = containerSizeRef.current;
          const ns = clamp(c.scale / 1.1, MIN_SCALE, MAX_SCALE);
          const r  = ns / c.scale;
          applyTransform({ x: width/2 - r*(width/2 - c.x), y: height/2 - r*(height/2 - c.y), scale: ns });
          setTransform(transformRef.current);
          return;
        }
        case 'ArrowLeft': case 'a': case 'A':
        case 'ArrowRight': case 'd': case 'D':
        case 'ArrowUp': case 'w': case 'W':
        case 'ArrowDown': case 's': case 'S':
          e.preventDefault();
          heldKeys.add(e.key);
          stopSpring();
          if (kbRaf === null) kbRaf = requestAnimationFrame(kbTick);
          return;
        default: return;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => { heldKeys.delete(e.key); };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
      if (kbRaf !== null) cancelAnimationFrame(kbRaf);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { containerRef, transform, containerSize, worldClick, transformRef };
}
