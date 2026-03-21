'use client';

import { useEffect, useState } from 'react';

const SESSION_START = Date.now();
const DAY_MS   = 8 * 60_000;
const NIGHT_MS = 6 * 60_000;
const CYCLE_MS = DAY_MS + NIGHT_MS;
const DAY_FRAC = DAY_MS / CYCLE_MS;

export default function DayNightStrip() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1_000);
    return () => clearInterval(id);
  }, []);

  const elapsed  = (Date.now() - SESSION_START) % CYCLE_MS;
  const progress = elapsed / CYCLE_MS;
  const isDay    = elapsed < DAY_MS;

  const totalSec = Math.floor(elapsed / 1_000);
  const minute   = Math.floor(totalSec / 60) + 1;
  const second   = totalSec % 60;
  const clock    = `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

  return (
    <div
      data-no-cursor=""
      style={{
        position: 'absolute',
        top: 62, left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: 512,
        backgroundColor: 'var(--bar-bg)',
        borderRadius: 10,
        padding: '7px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        pointerEvents: 'auto',
        zIndex: 10,
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      {/* Day / Night label */}
      <span style={{
        fontFamily: 'var(--font-vt323)',
        fontSize: 14,
        letterSpacing: '0.08em',
        color: isDay ? '#c89040' : '#6080c0',
        minWidth: 44,
        lineHeight: 1,
      }}>
        {isDay ? 'DAY' : 'NIGHT'}
      </span>

      {/* Progress bar */}
      <div style={{
        flex: 1,
        position: 'relative',
        height: 5,
        borderRadius: 3,
        backgroundImage: `linear-gradient(to right, ${[
          '#b86010 0%',
          `#d4a030 ${(DAY_FRAC * 45).toFixed(1)}%`,
          `#706090 ${(DAY_FRAC * 100 - 4).toFixed(1)}%`,
          `#1a2878 ${(DAY_FRAC * 100).toFixed(1)}%`,
          '#080e30 100%',
        ].join(', ')})`,
      }}>
        <div style={{
          position: 'absolute',
          left: `${(progress * 100).toFixed(2)}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 9, height: 9, borderRadius: '50%',
          backgroundColor: isDay ? '#ffe080' : '#a0b8ff',
          boxShadow: isDay
            ? '0 0 6px 2px rgba(255,200,50,0.75)'
            : '0 0 5px 2px rgba(140,160,255,0.65)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Clock */}
      <span style={{
        fontFamily: 'var(--font-vt323)',
        fontSize: 16,
        letterSpacing: '0.08em',
        color: isDay ? '#a07030' : '#4060a0',
        minWidth: 36,
        textAlign: 'right',
        lineHeight: 1,
      }}>
        {clock}
      </span>
    </div>
  );
}
