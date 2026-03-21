'use client';

import { useState } from 'react';
import { useGame, type Tool } from '@/contexts/GameContext';
import { useTheme } from '@/contexts/ThemeContext';
import MarketModal from './MarketModal';

// ─── Tool config ──────────────────────────────────────────────────────────────

const TOOL_ASSET: Record<Tool, string> = {
  water:   'tool-water.svg',
  seed:    'tool-seed.svg',
  harvest: 'tool-harvest.svg',
  laser:   'tool-laser.svg',
  pump:    'tool-pump.svg',
};

const TOOL_ACCENT: Record<Tool, string> = {
  water:   '#50a8e0',
  seed:    '#70c050',
  harvest: '#e0b830',
  laser:   '#e05030',
  pump:    '#60b8d8',
};

const TOOLS: Tool[] = ['water', 'seed', 'harvest', 'laser', 'pump'];

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function ItemPanel() {
  const { seeds, water, coins, laserBattery, pumps, selectedTool, selectTool, hasHarvestable } = useGame();
  const { theme } = useTheme();
  const folder = theme === 'light' ? 'Light' : 'Dark';
  const [showMarket, setShowMarket] = useState(false);

  return (
    <>
      <div
        className="item-panel"
        data-no-cursor=""
        style={{
          position: 'absolute',
          bottom: 16, left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '8px 16px',
          backgroundColor: 'var(--bar-bg)',
          borderRadius: 10,
          pointerEvents: 'auto',
          userSelect: 'none',
          cursor: 'default',
          width: 'calc(100% - 32px)',
          maxWidth: 512,
        }}
      >
        {/* Tool row */}
        <div className="tool-row" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {TOOLS.map(id => {
            const isDisabled =
              (id === 'harvest' && !hasHarvestable) ||
              (id === 'laser'   && laserBattery <= 0) ||
              (id === 'water'   && water <= 0)        ||
              (id === 'seed'    && seeds <= 0)        ||
              (id === 'pump'    && pumps <= 0);
            const isActive = selectedTool === id && !isDisabled;
            const badge    = id === 'water' ? water : id === 'seed' ? seeds : id === 'laser' ? laserBattery : id === 'pump' ? pumps : null;
            const badgeLow = id === 'laser' ? laserBattery <= 30 : (badge !== null && badge <= 0);

            return (
              <div
                key={id}
                className={`tool-btn tool-${id} ${isActive ? 'tool-active' : ''} ${isDisabled ? 'tool-disabled' : ''}`}
                onClick={() => { if (!isDisabled) selectTool(id); }}
                title={
                  isDisabled
                    ? id === 'harvest' ? 'Nothing to harvest'
                    : id === 'laser'   ? 'Battery depleted — buy from stats'
                    : id === 'pump'    ? 'No pump — buy from stats'
                    : `No ${id} left`
                    : id === 'laser' ? 'Laser — clears weeds/infections, scorches soil'
                    : id === 'pump'  ? 'Pump — place near water source for passive water'
                    : id
                }
                style={{
                  position: 'relative',
                  width: 48, height: 48,
                  borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.12s, box-shadow 0.12s',
                  backgroundColor: isActive ? 'var(--btn-icon-hover)' : 'var(--btn-icon-bg)',
                  boxShadow: isActive
                    ? `0 0 0 2px ${TOOL_ACCENT[id]}, inset 0 0 0 1px ${TOOL_ACCENT[id]}40`
                    : 'inset 0 0 0 1px var(--btn-icon-ring)',
                  filter: isDisabled ? 'grayscale(70%)' : 'none',
                  opacity: isDisabled ? 0.45 : 1,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="tool-icon"
                  src={`/assets/${folder}/${TOOL_ASSET[id]}`}
                  width={30} height={30}
                  style={{ display: 'block', opacity: isActive ? 1 : 0.82 }}
                  draggable={false}
                  alt={id}
                />

                {/* Active dot at bottom-centre */}
                {isActive && (
                  <div className="tool-active-dot" style={{
                    position: 'absolute', bottom: 3, left: '50%',
                    transform: 'translateX(-50%)',
                    width: 5, height: 5, borderRadius: '50%',
                    backgroundColor: TOOL_ACCENT[id],
                    boxShadow: `0 0 4px 1px ${TOOL_ACCENT[id]}`,
                  }} />
                )}

                {/* Resource badge — always visible, top-right pill */}
                {badge !== null && (
                  <div className={`tool-badge ${badgeLow ? 'tool-badge-low' : ''}`} style={{
                    position: 'absolute',
                    top: -8, right: -8,
                    minWidth: 22, height: 22,
                    borderRadius: 6,
                    backgroundColor: badgeLow ? '#8b1a1a' : 'var(--bar-bg)',
                    border: `1.5px solid ${badgeLow ? '#c03030' : 'var(--btn-icon-ring)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px',
                    pointerEvents: 'none',
                  }}>
                    <span className="tool-badge-text" style={{
                      fontFamily: 'var(--font-vt323)',
                      fontSize: 18,
                      lineHeight: 1,
                      color: badgeLow ? '#ff8080' : (id === 'water' ? 'var(--badge-water)' : id === 'laser' ? '#e0a040' : id === 'pump' ? '#60c8e8' : 'var(--badge-seed)'),
                    }}>
                      {id === 'laser' ? `${badge}%` : badge}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Divider */}
          <div className="tool-divider" style={{ width: 1, height: 36, backgroundColor: 'var(--btn-icon-ring)', margin: '0 2px' }} />

          {/* Stats — always accessible */}
          <div
            className="market-btn"
            onClick={() => setShowMarket(true)}
            title="Stats"
            style={{
              position: 'relative',
              width: 48, height: 48,
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              backgroundColor: 'var(--btn-icon-bg)',
              boxShadow: 'inset 0 0 0 1px var(--btn-icon-ring)',
              transition: 'background-color 0.12s',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="market-icon"
              src={`/assets/${folder}/icon-market.svg`}
              width={30} height={30}
              style={{ display: 'block', opacity: 0.82 }}
              draggable={false}
              alt="market"
            />
            {/* Coin count badge */}
            {coins > 0 && (
              <div className="coin-badge" style={{
                position: 'absolute', top: -8, right: -8,
                minWidth: 22, height: 22, borderRadius: 6,
                backgroundColor: 'var(--bar-bg)',
                border: '1.5px solid var(--btn-icon-ring)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px', pointerEvents: 'none',
              }}>
                <span className="coin-count" style={{ fontFamily: 'var(--font-vt323)', fontSize: 18, lineHeight: 1, color: '#e8b830' }}>
                  {coins}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showMarket && <MarketModal onClose={() => setShowMarket(false)} />}
    </>
  );
}
