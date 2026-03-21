'use client';

import { useEffect, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Logo icon (no asset equivalent — keep inline) ────────────────────────────

function LogoIcon() {
  return (
    <svg className="logo-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="16" r="2.5" fill="#5a9e40" />
      <line x1="10" y1="14" x2="10" y2="6" stroke="#5a9e40" strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="7.5" cy="9" rx="3.2" ry="2" transform="rotate(-35 7.5 9)" fill="#70be50" />
      <ellipse cx="13" cy="8" rx="3.2" ry="2" transform="rotate(35 13 8)" fill="#60ae40" />
    </svg>
  );
}

// ─── Icon button ──────────────────────────────────────────────────────────────

function IconBtn({ title, onClick, color, children }: { title: string; onClick: () => void; color: string; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      className="icon-btn"
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 30, height: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: hover ? 'var(--btn-icon-hover)' : 'var(--btn-icon-bg)',
        border: '1px solid var(--btn-icon-ring)',
        borderRadius: 6,
        color,
        cursor: 'pointer',
        transition: 'background-color 0.12s',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

// ─── Info modal ───────────────────────────────────────────────────────────────

function InfoModal({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const folder = theme === 'light' ? 'Light' : 'Dark';
  const rows: [string, string][] = [
    ['Water', 'Click any cell to make a 3×3 area fertile. Costs 1 water.'],
    ['Seed', 'Click a fertile (blue) cell to plant. Costs 1 seed.'],
    ['Harvest', 'Click a gold cell to collect 1 coin. Active only when gold cells exist.'],
    ['Laser', 'Click any non-dry cell. Clears weed/infection → fertile. Scorches fertile → dry. Destroys planted crops → fertile. 5 hits on water source → dries it out.'],
    ['Market', 'Spend coins to buy seeds, water, battery charges, or pumps.'],
    ['Prices', '1 coin → 2 seeds   |   1 coin → 2 water   |   10 coins → battery   |   100 coins → pump'],
    ['Growth', 'Planted → Harvestable in 2 min. Harvest within 5 min or it dies.'],
    ['Decay', 'Fertile dries in 5 min. Dead rots in 10 min and spreads.'],
    ['Zones', 'Water near a locked zone border (3+ fertile border cells) to unlock it.'],
    ['Controls', 'WASD / Arrow keys to pan   |   Q zoom in   |   E zoom out'],
    ['Score', 'Watering 19 pts   |   Seeding 2 pts   |   Harvesting 5 pts'],
  ];

  return (
    <div
      className="info-modal-overlay"
      data-no-cursor=""
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
    >
      <div
        className="info-modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bar-bg)',
          border: '1px solid var(--bar-border)',
          borderRadius: 10,
          maxWidth: 460, width: '100%',
          maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Fixed header */}
        <div className="info-modal-header" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 22px 12px',
          borderBottom: '1px solid var(--bar-border)',
          flexShrink: 0,
        }}>
          <span className="info-modal-title" style={{ fontFamily: 'var(--font-vt323)', fontSize: 20, color: 'var(--text-primary)', letterSpacing: '0.06em' }}>
            HOW TO PLAY
          </span>
          <button
            className="info-modal-close-btn"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', opacity: 0.6 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/assets/${folder}/icon-close.svg`} width={18} height={18} alt="close" draggable={false} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="info-modal-body" style={{ overflowY: 'auto', padding: '16px 22px', flex: 1 }}>
          <div className="info-modal-rules" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map(([label, desc]) => (
              <div key={label} className="info-modal-rule" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span className="info-modal-rule-label" style={{
                  fontFamily: 'var(--font-vt323)',
                  fontSize: 15, color: 'var(--text-score)',
                  letterSpacing: '0.04em', minWidth: 72,
                  lineHeight: 1.3, flexShrink: 0,
                }}>
                  {label}
                </span>
                <span className="info-modal-rule-desc" style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, opacity: 0.85 }}>
                  {desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Fixed footer */}
        <div className="info-modal-footer" style={{
          padding: '12px 22px',
          borderTop: '1px solid var(--bar-border)',
          flexShrink: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span className="info-modal-footer-text" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Start with 8 seeds, 5 water, and 5 coins. +1 water every 10 min.
          </span>
          <span className="info-modal-version" style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.6, flexShrink: 0, marginLeft: 12 }}>
            v0.1.0
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Leaderboard modal ────────────────────────────────────────────────────────

interface LeaderboardEntry { name: string; score: number; session_id: string; }

const MEDAL: Record<number, string> = { 0: 'medal-gold', 1: 'medal-silver', 2: 'medal-bronze' };

function ScoreModal({ score, onClose }: { score: number; onClose: () => void }) {
  const { theme } = useTheme();
  const folder = theme === 'light' ? 'Light' : 'Dark';
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => setEntries(d.entries ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      className="score-modal-overlay"
      data-no-cursor=""
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
    >
      <div
        className="score-modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bar-bg)',
          border: '1px solid var(--bar-border)',
          borderRadius: 10,
          padding: '22px 26px',
          width: 'calc(100% - 32px)',
          maxWidth: 340,
        }}
      >
        <div className="score-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span className="score-modal-title" style={{ fontFamily: 'var(--font-vt323)', fontSize: 20, letterSpacing: '0.08em', color: 'var(--text-primary)' }}>
            LEADERBOARD
          </span>
          <div className="score-modal-user-score">
            <div className="score-modal-user-score-label" style={{ fontFamily: 'var(--font-vt323)', fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>YOUR SCORE</div>
            <div className="score-modal-user-score-value" style={{ fontFamily: 'var(--font-vt323)', fontSize: 26, color: 'var(--text-score)', lineHeight: 1.1 }}>
              {score.toLocaleString()}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="score-modal-loading" style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>Loading...</div>
        ) : entries.length === 0 ? (
          <div className="score-modal-empty" style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>No scores yet</div>
        ) : (
          <div className="score-modal-entries" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {entries.map((e, i) => (
              <div key={e.session_id} className={`score-modal-entry ${i === 0 ? 'score-modal-entry-top' : ''}`} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '5px 8px',
                backgroundColor: i === 0 ? 'rgba(249,196,36,0.08)' : 'transparent',
                borderRadius: 5,
              }}>
                <div className="score-modal-entry-rank" style={{ minWidth: 22, display: 'flex', alignItems: 'center' }}>
                  {MEDAL[i] ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={`/assets/${folder}/${MEDAL[i]}.svg`} width={18} height={18} alt={`rank ${i+1}`} draggable={false} />
                  ) : (
                    <span className="score-modal-entry-rank-number" style={{ fontFamily: 'var(--font-vt323)', fontSize: 15, color: 'var(--text-muted)' }}>
                      {i + 1}.
                    </span>
                  )}
                </div>
                <span className="score-modal-entry-name" style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>
                  {e.name}
                </span>
                <span className="score-modal-entry-score" style={{ fontFamily: 'var(--font-vt323)', fontSize: 16, color: 'var(--text-score)' }}>
                  {e.score.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          className="score-modal-close-btn"
          onClick={onClose}
          style={{
            marginTop: 18, width: '100%', padding: '9px',
            backgroundColor: 'var(--btn-icon-bg)',
            border: '1px solid var(--btn-icon-ring)',
            borderRadius: 6, color: 'var(--text-primary)',
            fontSize: 13, cursor: 'pointer', letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/assets/${folder}/icon-close.svg`} width={14} height={14} alt="" draggable={false} style={{ opacity: 0.7 }} />
          Close
        </button>
      </div>
    </div>
  );
}

// ─── StatusBar ────────────────────────────────────────────────────────────────

export default function StatusBar() {
  const { score, playerName } = useGame();
  const { theme, toggleTheme } = useTheme();
  const [showInfo, setShowInfo] = useState(false);
  const [showScore, setShowScore] = useState(false);

  // Hardcoded per-theme so icon colour is never ambiguous regardless of CSS cascade
  const iconColor = theme === 'light' ? '#1a1208' : '#b8cfe0';
  const folder    = theme === 'light' ? 'Light' : 'Dark';

  return (
    <>
      <div className="status-bar" data-no-cursor="" style={{
        position: 'absolute',
        top: 8, left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: 512, minWidth: 300,
        backgroundColor: 'var(--bar-bg)',
        borderRadius: 10,
        padding: '8px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
        pointerEvents: 'auto', zIndex: 10,
        cursor: 'default',
      }}>
        {/* Left — logo + farm name */}
        <div className="status-bar-left" style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 70, overflow: 'hidden' }}>
          <LogoIcon />
          <span className="status-bar-farm-name" style={{
            fontFamily: 'var(--font-vt323)',
            fontSize: 18,
            letterSpacing: '0.12em',
            color: 'var(--text-logo)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 120,
          }}>
            {playerName ?? 'FARM'}
          </span>
        </div>

        {/* Center — score */}
        <div className="status-bar-center" style={{ flex: 1, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 5 }}>
          <span className="status-bar-score-value" style={{
            fontFamily: 'var(--font-vt323)',
            fontSize: 28,
            color: 'var(--text-score)',
            letterSpacing: '0.03em',
            lineHeight: 1,
          }}>
            {score.toLocaleString()}
          </span>
          <span className="status-bar-score-label" style={{
            fontFamily: 'var(--font-vt323)',
            fontSize: 14,
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
          }}>
            PTS
          </span>
        </div>

        {/* Right — action buttons */}
        <div className="status-bar-right" style={{ display: 'flex', gap: 5, alignItems: 'center', minWidth: 70, justifyContent: 'flex-end' }}>
          <IconBtn title="How to play" onClick={() => setShowInfo(true)} color={iconColor}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/assets/${folder}/icon-info.svg`} width={18} height={18} alt="info" draggable={false} />
          </IconBtn>
          <IconBtn
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
            color={iconColor}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/assets/${folder}/${theme === 'dark' ? 'icon-sun' : 'icon-moon'}.svg`} width={18} height={18} alt="theme" draggable={false} />
          </IconBtn>
          <IconBtn title="Scoreboard" onClick={() => setShowScore(true)} color={iconColor}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/assets/${folder}/icon-scoreboard.svg`} width={18} height={18} alt="scoreboard" draggable={false} />
          </IconBtn>
        </div>
      </div>

      {showInfo  && <InfoModal  onClose={() => setShowInfo(false)} />}
      {showScore && <ScoreModal score={score} onClose={() => setShowScore(false)} />}
    </>
  );
}
