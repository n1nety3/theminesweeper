'use client';

import { useEffect, useState } from 'react';
import { Difficulty, DIFFICULTY_CONFIGS, ScoreEntry, getScores } from '@/lib/minesweeper';
import { NUMBER_SVGS } from './icons/NumberSvg';

// ──────────────────────────────────────────────────
// Help modal (also houses difficulty selector)
// ──────────────────────────────────────────────────
interface HelpModalProps {
  difficulty: Difficulty;
  onClose: () => void;
  onChangeDifficulty: (d: Difficulty) => void;
}

export function HelpModal({ difficulty, onClose, onChangeDifficulty }: HelpModalProps) {
  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-xs mx-4">
        <h2 className="font-bold text-lg text-gray-800 mb-4 text-center">How to Play</h2>

        <ul className="text-sm text-gray-600 space-y-2 mb-4">
          <li><span className="font-medium">Tap</span> a cell to reveal it.</li>
          <li><span className="font-medium">Long-press</span> (or right-click) to place a 🚩 flag.</li>
          <li>Use <span className="font-medium">Flag OFF/ON</span> in the footer to tap-to-flag.</li>
          <li>Numbers = mines in surrounding 8 cells.</li>
          <li><span className="font-medium">Chord</span> — tap a revealed number with all mines flagged to auto-reveal neighbors.</li>
        </ul>

        {/* Number color reference using real SVGs */}
        <div className="grid grid-cols-8 gap-0.5 mb-4">
          {[1,2,3,4,5,6,7,8].map(n => {
            const Svg = NUMBER_SVGS[n];
            return (
              <div key={n} className="flex items-center justify-center border border-gray-100 bg-white rounded py-1.5 h-10">
                {Svg && <Svg style={{ height: 20, width: 'auto' }} />}
              </div>
            );
          })}
        </div>

        {/* Difficulty selector */}
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Difficulty</p>
        <div className="flex gap-1 mb-4">
          {(Object.keys(DIFFICULTY_CONFIGS) as Difficulty[]).map(d => (
            <button
              key={d}
              onClick={() => { onChangeDifficulty(d); onClose(); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                difficulty === d
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {DIFFICULTY_CONFIGS[d].label}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-gray-800 text-white rounded-lg text-sm font-medium"
        >
          Got it!
        </button>
      </div>
    </Overlay>
  );
}

// ──────────────────────────────────────────────────
// Scoreboard modal
// ──────────────────────────────────────────────────
interface ScoreboardModalProps {
  onClose: () => void;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function ScoreboardModal({ onClose }: ScoreboardModalProps) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [tab, setTab] = useState<Difficulty>('easy');

  useEffect(() => {
    setScores(getScores());
  }, []);

  const filtered = scores
    .filter(s => s.difficulty === tab)
    .sort((a, b) => a.time - b.time)
    .slice(0, 10);

  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-xs mx-4">
        <h2 className="font-bold text-lg text-gray-800 mb-3 text-center">🏆 Scoreboard</h2>

        <div className="flex gap-1 mb-3">
          {(Object.keys(DIFFICULTY_CONFIGS) as Difficulty[]).map(d => (
            <button
              key={d}
              onClick={() => setTab(d)}
              className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${
                tab === d ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {DIFFICULTY_CONFIGS[d].label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No scores yet. Win a game!</p>
        ) : (
          <ol className="space-y-1">
            {filtered.map((s, i) => (
              <li key={i} className="flex items-center justify-between text-sm px-2 py-1 rounded bg-gray-50">
                <span className="text-gray-400 font-mono w-5">{i + 1}.</span>
                <span className="font-mono font-bold text-gray-800">{formatTime(s.time)}</span>
                <span className="text-gray-400 text-xs">{new Date(s.date).toLocaleDateString()}</span>
              </li>
            ))}
          </ol>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-gray-800 text-white rounded-lg text-sm font-medium"
        >
          Close
        </button>
      </div>
    </Overlay>
  );
}

// ──────────────────────────────────────────────────
// Game over overlay
// ──────────────────────────────────────────────────
interface GameOverProps {
  won: boolean;
  elapsed: number;
  onReset: () => void;
  onShowScoreboard: () => void;
}

export function GameOverBanner({ won, elapsed, onReset, onShowScoreboard }: GameOverProps) {
  return (
    <Overlay onClose={onReset} dimmed={false}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-xs mx-4 text-center shadow-2xl">
        <div className="text-5xl mb-3">{won ? '🎉' : '💥'}</div>
        <h2 className="font-bold text-xl text-gray-800 mb-1">
          {won ? 'You won!' : 'Game over!'}
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          {won ? `Cleared in ${formatTime(elapsed)}` : 'Better luck next time!'}
        </p>
        <div className="flex gap-2">
          {won && (
            <button
              onClick={onShowScoreboard}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700"
            >
              Scores
            </button>
          )}
          <button
            onClick={onReset}
            className="flex-1 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium"
          >
            Play again
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ──────────────────────────────────────────────────
// Shared overlay backdrop
// ──────────────────────────────────────────────────
function Overlay({ children, onClose, dimmed = true }: { children: React.ReactNode; onClose: () => void; dimmed?: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${dimmed ? 'bg-black/40' : 'bg-black/20'}`}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}
