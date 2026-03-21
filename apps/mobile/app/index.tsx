import { useGame } from '../contexts/GameContext';
import AuthScreen from '../components/AuthScreen';
import GameScreen from '../components/GameScreen';

export default function Index() {
  const { sessionId, isLoadingSession } = useGame();

  // Show nothing while checking stored session
  if (isLoadingSession) return null;

  return sessionId ? <GameScreen /> : <AuthScreen />;
}
