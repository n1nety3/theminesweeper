'use client';

import { useEffect, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useTheme } from '@/contexts/ThemeContext';

interface LeaderboardEntry {
  name: string;
  score: number;
  session_id: string;
}

export default function GameOverModal() {
  const { score, playerName, sessionId, saveSession, startNewFarm } = useGame();
  const { theme } = useTheme();
  const folder = theme === 'light' ? 'Light' : 'Dark';

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [villageName, setVillageName] = useState('');
  const [nameError, setNameError] = useState('');

  // Save final state then load leaderboard
  useEffect(() => {
    saveSession().then(() =>
      fetch('/api/leaderboard')
        .then(r => r.json())
        .then(d => setEntries(d.entries ?? []))
        .catch(() => {})
        .finally(() => setLoading(false))
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const rank = entries.findIndex(e => e.session_id === sessionId);
  const rankDisplay = rank >= 0 ? rank + 1 : null;

  const handleNewFarm = async () => {
    const name = villageName.trim();
    if (name.length < 2) { setNameError('Village name must be at least 2 characters'); return; }
    setNameError('');
    setStarting(true);
    await startNewFarm(name);
  };

  const MEDAL: Record<number, string> = { 0: 'medal-gold', 1: 'medal-silver', 2: 'medal-bronze' };

  return (
    <div
      data-no-cursor=""
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 900, padding: 16,
      }}
    >
      <div style={{
        backgroundColor: 'var(--bar-bg)',
        border: '1px solid var(--bar-border)',
        borderRadius: 14,
        padding: '28px 24px',
        width: 'calc(100% - 32px)',
        maxWidth: 360,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 0,
      }}>
        {/* Icon */}
        <svg width="40" height="40" viewBox="0 0 44 44" fill="none">
          <circle cx="22" cy="22" r="16" fill="#2a1008" />
          <line x1="22" y1="38" x2="22" y2="6" stroke="#c04010" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="15" cy="20" rx="6" ry="4" transform="rotate(-35 15 20)" fill="#903010" opacity="0.7" />
          <ellipse cx="30" cy="18" rx="6" ry="4" transform="rotate(35 30 18)" fill="#903010" opacity="0.7" />
        </svg>

        <div style={{
          fontFamily: 'var(--font-vt323)', fontSize: 26,
          letterSpacing: '0.1em', color: '#e05030',
          marginTop: 14, marginBottom: 2,
        }}>
          GAME OVER
        </div>

        <div style={{
          fontFamily: 'var(--font-vt323)', fontSize: 16,
          color: 'var(--text-muted)', letterSpacing: '0.08em',
          marginBottom: 18,
        }}>
          {playerName ?? 'YOUR FARM'}
        </div>

        {/* Score + rank */}
        <div style={{
          display: 'flex', gap: 24, marginBottom: 20,
          alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-vt323)', fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              FINAL SCORE
            </div>
            <div style={{ fontFamily: 'var(--font-vt323)', fontSize: 36, color: 'var(--text-score)', lineHeight: 1 }}>
              {score.toLocaleString()}
            </div>
          </div>
          {rankDisplay && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-vt323)', fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                GLOBAL RANK
              </div>
              <div style={{ fontFamily: 'var(--font-vt323)', fontSize: 36, color: rankDisplay <= 3 ? '#e8b830' : 'var(--text-primary)', lineHeight: 1 }}>
                #{rankDisplay}
              </div>
            </div>
          )}
        </div>

        {/* Top 10 leaderboard */}
        <div style={{
          width: '100%',
          backgroundColor: 'var(--btn-icon-bg)',
          borderRadius: 8,
          padding: '10px 12px',
          marginBottom: 18,
        }}>
          <div style={{
            fontFamily: 'var(--font-vt323)', fontSize: 13,
            letterSpacing: '0.1em', color: 'var(--text-muted)',
            marginBottom: 8,
          }}>
            TOP 10 FARMS
          </div>
          {loading ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
              Loading...
            </div>
          ) : entries.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
              No scores yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {entries.map((e, i) => {
                const isMe = e.session_id === sessionId;
                return (
                  <div key={e.session_id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '4px 6px',
                    borderRadius: 5,
                    backgroundColor: isMe ? 'rgba(224,176,48,0.12)' : 'transparent',
                    border: isMe ? '1px solid rgba(224,176,48,0.3)' : '1px solid transparent',
                  }}>
                    <div style={{ minWidth: 20, display: 'flex', alignItems: 'center' }}>
                      {MEDAL[i] ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={`/assets/${folder}/${MEDAL[i]}.svg`} width={16} height={16} alt={`#${i+1}`} draggable={false} />
                      ) : (
                        <span style={{ fontFamily: 'var(--font-vt323)', fontSize: 13, color: 'var(--text-muted)' }}>
                          {i + 1}.
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: isMe ? '#e8b830' : 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-vt323)', fontSize: 15, color: isMe ? '#e8b830' : 'var(--text-score)' }}>
                      {e.score.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Village name input */}
        <input
          type="text"
          value={villageName}
          onChange={e => { setVillageName(e.target.value); setNameError(''); }}
          placeholder="New village name"
          maxLength={24}
          disabled={starting}
          style={{
            width: '100%', padding: '10px 14px', boxSizing: 'border-box',
            backgroundColor: 'var(--btn-icon-bg)',
            border: nameError ? '1px solid #e05030' : '1px solid var(--btn-icon-ring)',
            borderRadius: 8, color: 'var(--text-primary)',
            fontFamily: 'monospace', fontSize: 14, outline: 'none',
            marginBottom: nameError ? 4 : 10,
          }}
        />
        {nameError && (
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#e05030', letterSpacing: '0.04em', paddingLeft: 2, marginBottom: 8, width: '100%' }}>
            {nameError}
          </div>
        )}

        {/* New farm button */}
        <button
          onClick={handleNewFarm}
          disabled={starting}
          style={{
            width: '100%',
            padding: '11px',
            backgroundColor: starting ? 'var(--btn-icon-bg)' : '#1a4a28',
            border: 'none',
            borderRadius: 8,
            color: starting ? 'var(--text-muted)' : '#7acc50',
            fontFamily: 'var(--font-vt323)',
            fontSize: 18,
            letterSpacing: '0.08em',
            cursor: starting ? 'not-allowed' : 'pointer',
          }}
        >
          {starting ? 'STARTING...' : 'START NEW FARM'}
        </button>
      </div>
    </div>
  );
}
