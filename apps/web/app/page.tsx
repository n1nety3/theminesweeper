'use client';

import Viewport from '@/components/Viewport';
import InfiniteBoard from '@/components/InfiniteBoard';
import PlayerModal from '@/components/PlayerModal';
import GameOverModal from '@/components/GameOverModal';
import FlyingLeaves from '@/components/FlyingLeaves';
import { GameProvider, useGame } from '@/contexts/GameContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

function PageContent() {
  const { sessionId, isLoadingSession, isGameOver } = useGame();

  if (isLoadingSession) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'var(--page-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid var(--text-muted)',
          borderTopColor: 'var(--text-score)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!sessionId) return <PlayerModal />;

  return (
    <main style={{ width: '100dvw', height: '100dvh', overflow: 'hidden' }}>
      <Viewport>
        <InfiniteBoard />
      </Viewport>
      {isGameOver && <GameOverModal />}
      <FlyingLeaves />
    </main>
  );
}

export default function Page() {
  return (
    <ThemeProvider>
      <GameProvider>
        <PageContent />
      </GameProvider>
    </ThemeProvider>
  );
}
