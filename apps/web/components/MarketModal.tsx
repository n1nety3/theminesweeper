'use client';

import { useState } from 'react';
import { useGame, PUMP_COIN_COST } from '@/contexts/GameContext';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Quantity stepper ─────────────────────────────────────────────────────────

function Qty({
  value, min, max, onChange,
}: {
  value: number; min: number; max: number; onChange: (n: number) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={{
          width: 28, height: 28, border: 'none', borderRadius: '6px 0 0 6px',
          backgroundColor: 'var(--bar-bg)', color: 'var(--text-primary)',
          fontFamily: 'var(--font-vt323)', fontSize: 20, cursor: value <= min ? 'not-allowed' : 'pointer',
          opacity: value <= min ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >−</button>
      <div style={{
        minWidth: 32, height: 28, backgroundColor: 'var(--bar-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-vt323)', fontSize: 20, color: 'var(--text-primary)',
        borderLeft: '1px solid var(--btn-icon-ring)', borderRight: '1px solid var(--btn-icon-ring)',
        padding: '0 4px',
      }}>
        {value}
      </div>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={{
          width: 28, height: 28, border: 'none', borderRadius: '0 6px 6px 0',
          backgroundColor: 'var(--bar-bg)', color: 'var(--text-primary)',
          fontFamily: 'var(--font-vt323)', fontSize: 20, cursor: value >= max ? 'not-allowed' : 'pointer',
          opacity: value >= max ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >+</button>
    </div>
  );
}

// ─── Row components ───────────────────────────────────────────────────────────

function BuyRow({
  label, iconSrc, unitCost, unitReward, rewardLabel,
  maxQty, canBuyOne, onBuy, accentColor,
}: {
  label: string; iconSrc: string;
  unitCost: number; unitReward: number; rewardLabel: string;
  maxQty: number; canBuyOne: boolean; onBuy: (qty: number) => void; accentColor: string;
}) {
  const [qty, setQty] = useState(1);
  const clampedQty = Math.min(qty, Math.max(1, maxQty));
  const canBuy = canBuyOne && clampedQty >= 1;

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '10px 12px', borderRadius: 8,
      backgroundColor: 'var(--btn-icon-bg)', gap: 10,
    }}>
      <div style={{ width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconSrc} width={28} height={28} alt="" draggable={false} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-vt323)', fontSize: 22, color: 'var(--text-primary)', lineHeight: 1.1 }}>
          {label}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 15, color: 'var(--text-muted)', marginTop: 1 }}>
          {unitCost * clampedQty} coins → {unitReward * clampedQty} {rewardLabel}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        {maxQty > 1 && (
          <Qty value={clampedQty} min={1} max={maxQty} onChange={setQty} />
        )}
        <button
          onClick={canBuy ? () => onBuy(clampedQty) : undefined}
          style={{
            padding: '5px 14px', borderRadius: 6, border: 'none',
            fontFamily: 'var(--font-vt323)', fontSize: 20, letterSpacing: '0.05em',
            cursor: canBuy ? 'pointer' : 'not-allowed',
            backgroundColor: canBuy ? accentColor : 'var(--btn-icon-bg)',
            color: canBuy ? '#fff' : 'var(--text-muted)',
            opacity: canBuy ? 1 : 0.45,
            transition: 'opacity 0.12s',
            whiteSpace: 'nowrap',
          }}
        >
          BUY
        </button>
      </div>
    </div>
  );
}

function SellRow({
  label, iconSrc, unitNeed, needLabel, unitEarn,
  maxQty, canSellOne, onSell, accentColor,
}: {
  label: string; iconSrc: string;
  unitNeed: number; needLabel: string; unitEarn: number;
  maxQty: number; canSellOne: boolean; onSell: (qty: number) => void; accentColor: string;
}) {
  const [qty, setQty] = useState(1);
  const clampedQty = Math.min(qty, Math.max(1, maxQty));
  const canSell = canSellOne && clampedQty >= 1;

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '10px 12px', borderRadius: 8,
      backgroundColor: 'var(--btn-icon-bg)', gap: 10,
    }}>
      <div style={{ width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconSrc} width={28} height={28} alt="" draggable={false} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-vt323)', fontSize: 22, color: 'var(--text-primary)', lineHeight: 1.1 }}>
          {label}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 15, color: 'var(--text-muted)', marginTop: 1 }}>
          {unitNeed * clampedQty} {needLabel} → {unitEarn * clampedQty} coin{unitEarn * clampedQty !== 1 ? 's' : ''}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        {maxQty > 1 && (
          <Qty value={clampedQty} min={1} max={maxQty} onChange={setQty} />
        )}
        <button
          onClick={canSell ? () => onSell(clampedQty) : undefined}
          style={{
            padding: '5px 14px', borderRadius: 6, border: 'none',
            fontFamily: 'var(--font-vt323)', fontSize: 20, letterSpacing: '0.05em',
            cursor: canSell ? 'pointer' : 'not-allowed',
            backgroundColor: canSell ? accentColor : 'var(--btn-icon-bg)',
            color: canSell ? '#fff' : 'var(--text-muted)',
            opacity: canSell ? 1 : 0.45,
            transition: 'opacity 0.12s',
            whiteSpace: 'nowrap',
          }}
        >
          SELL
        </button>
      </div>
    </div>
  );
}

// ─── Stats Modal ──────────────────────────────────────────────────────────────

export default function MarketModal({ onClose }: { onClose: () => void }) {
  const {
    coins, maxCoins, seeds, water, crops, laserBattery, pumps,
    buySeeds, buyWater, buyLaserBattery, buyPump,
    sellSeeds, sellWater, sellCrops,
  } = useGame();
  const { theme } = useTheme();
  const folder = theme === 'light' ? 'Light' : 'Dark';

  const [tab, setTab] = useState<'buy' | 'sell'>('buy');

  const walletFull = coins >= maxCoins;
  const walletSpace = maxCoins - coins;

  const icon = (name: string, size = 28) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/assets/${folder}/${name}`} width={size} height={size} alt="" draggable={false} />
  );

  const tabBtn = (t: 'buy' | 'sell'): React.CSSProperties => ({
    flex: 1, padding: '9px 0', border: 'none', borderRadius: 7,
    fontFamily: 'var(--font-vt323)', fontSize: 22, letterSpacing: '0.08em',
    cursor: 'pointer',
    backgroundColor: tab === t ? (t === 'buy' ? '#1a4a28' : '#4a1a10') : 'transparent',
    color: tab === t ? (t === 'buy' ? '#7acc50' : '#e07040') : 'var(--text-muted)',
    transition: 'background-color 0.15s, color 0.15s',
  });

  // Max quantities (capped by what the player can afford / has)
  const maxBuySeeds  = Math.min(coins, 20);            // 1 coin each
  const maxBuyWater  = Math.min(coins, 20);            // 1 coin each
  const maxBuyCrops  = laserBattery < 100 ? 1 : 0;    // battery is all-or-nothing
  const maxSellSeeds = Math.floor(seeds / 2);          // 2 seeds per coin
  const maxSellWater = Math.floor(water / 2);          // 2 water per coin
  const maxSellCrops = Math.min(crops, walletSpace);   // 1 crop per coin

  return (
    <div
      data-no-cursor=""
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bar-bg)',
          border: '1px solid var(--bar-border)',
          borderRadius: 14,
          padding: '18px 20px',
          width: 'calc(100% - 32px)',
          maxWidth: 400,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {icon('icon-market.svg', 24)}
            <span style={{ fontFamily: 'var(--font-vt323)', fontSize: 26, letterSpacing: '0.1em', color: 'var(--text-primary)' }}>
              STATS
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', opacity: 0.6 }}
          >
            {icon('icon-close.svg', 20)}
          </button>
        </div>

        {/* Top resource row: Silo | Water Tank | Wallet */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{
            backgroundColor: 'var(--btn-icon-bg)', borderRadius: 10,
            padding: '12px 8px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 6,
          }}>
            {icon('icon-silo.svg', 32)}
            <div style={{ fontFamily: 'var(--font-vt323)', fontSize: 30, color: '#ffffff', lineHeight: 1 }}>{crops}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 15, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>SILO</div>
          </div>
          <div style={{
            backgroundColor: 'var(--btn-icon-bg)', borderRadius: 10,
            padding: '12px 8px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 6,
          }}>
            {icon('icon-watertank.svg', 32)}
            <div style={{ fontFamily: 'var(--font-vt323)', fontSize: 30, color: '#ffffff', lineHeight: 1 }}>{water}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 15, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>WATER TANK</div>
          </div>
          <div style={{
            backgroundColor: 'var(--btn-icon-bg)', borderRadius: 10,
            padding: '12px 8px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 6,
          }}>
            {icon('icon-currency.svg', 32)}
            <div style={{ fontFamily: 'var(--font-vt323)', fontSize: 30, color: walletFull ? '#ff6040' : '#ffffff', lineHeight: 1 }}>{coins}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 15, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>WALLET</div>
          </div>
        </div>

        {walletFull && (
          <div style={{ fontFamily: 'monospace', fontSize: 15, color: '#ff6040', textAlign: 'center' }}>
            Wallet full — sell crops to make room
          </div>
        )}

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 6, backgroundColor: 'var(--btn-icon-bg)', borderRadius: 9, padding: 4 }}>
          <button style={tabBtn('buy')} onClick={() => setTab('buy')}>BUY</button>
          <button style={tabBtn('sell')} onClick={() => setTab('sell')}>SELL</button>
        </div>

        {/* BUY tab */}
        {tab === 'buy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <BuyRow
              label="Seeds" iconSrc={`/assets/${folder}/tool-seed.svg`}
              unitCost={1} unitReward={2} rewardLabel="seeds"
              maxQty={maxBuySeeds} canBuyOne={coins >= 1}
              onBuy={qty => buySeeds(qty)}
              accentColor="#3a7a28"
            />
            <BuyRow
              label="Water" iconSrc={`/assets/${folder}/tool-water.svg`}
              unitCost={1} unitReward={2} rewardLabel="water"
              maxQty={maxBuyWater} canBuyOne={coins >= 1}
              onBuy={qty => buyWater(qty)}
              accentColor="#1a6090"
            />
            <BuyRow
              label="Battery" iconSrc={`/assets/${folder}/tool-laser.svg`}
              unitCost={10} unitReward={1} rewardLabel="recharge"
              maxQty={maxBuyCrops} canBuyOne={coins >= 10 && laserBattery < 100}
              onBuy={() => buyLaserBattery()}
              accentColor="#b07820"
            />
            <BuyRow
              label="Water Pump" iconSrc={`/assets/${folder}/tool-pump.svg`}
              unitCost={PUMP_COIN_COST} unitReward={1} rewardLabel="pump"
              maxQty={Math.floor(coins / PUMP_COIN_COST)} canBuyOne={coins >= PUMP_COIN_COST}
              onBuy={qty => buyPump(qty)}
              accentColor="#4080a0"
            />
          </div>
        )}

        {/* SELL tab */}
        {tab === 'sell' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Silo crops → coins */}
            <SellRow
              label="Sell Crops" iconSrc={`/assets/${folder}/icon-silo.svg`}
              unitNeed={1} needLabel="crops" unitEarn={1}
              maxQty={maxSellCrops} canSellOne={crops > 0 && !walletFull}
              onSell={qty => sellCrops(qty)}
              accentColor="#b07820"
            />
            {/* Seeds → coins */}
            <SellRow
              label="Seeds" iconSrc={`/assets/${folder}/tool-seed.svg`}
              unitNeed={2} needLabel="seeds" unitEarn={1}
              maxQty={maxSellSeeds} canSellOne={seeds >= 2 && !walletFull}
              onSell={qty => sellSeeds(qty)}
              accentColor="#7a5010"
            />
            {/* Water → coins */}
            <SellRow
              label="Water" iconSrc={`/assets/${folder}/tool-water.svg`}
              unitNeed={2} needLabel="water" unitEarn={1}
              maxQty={maxSellWater} canSellOne={water >= 2 && !walletFull}
              onSell={qty => sellWater(qty)}
              accentColor="#106080"
            />
          </div>
        )}

        {/* Bottom strip: seeds | battery | pumps */}
        <div style={{
          display: 'flex', gap: 16, justifyContent: 'center',
          padding: '8px 12px',
          backgroundColor: 'var(--btn-icon-bg)', borderRadius: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {icon('tool-seed.svg', 20)}
            <span style={{ fontFamily: 'var(--font-vt323)', fontSize: 22, color: '#7acc50' }}>{seeds}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {icon('tool-laser.svg', 20)}
            <span style={{ fontFamily: 'var(--font-vt323)', fontSize: 22, color: '#e0a040' }}>{laserBattery}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {icon('tool-pump.svg', 20)}
            <span style={{ fontFamily: 'var(--font-vt323)', fontSize: 22, color: '#60c8e8' }}>{pumps}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
