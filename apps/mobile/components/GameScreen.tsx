import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import MobileStatusBar from './MobileStatusBar';
import InfiniteBoard from './InfiniteBoard';
import ItemPanel from './ItemPanel';
import MarketModal from './MarketModal';
import ScoreboardModal from './ScoreboardModal';

export default function GameScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [showMarket, setShowMarket] = useState(false);
  const [showScore, setShowScore]   = useState(false);

  return (
    <View style={[styles.root, { backgroundColor: theme.pageBg }]}>
      <MobileStatusBar
        paddingTop={insets.top}
        onOpenScore={() => setShowScore(true)}
      />
      <InfiniteBoard />
      <ItemPanel
        paddingBottom={insets.bottom}
        onOpenMarket={() => setShowMarket(true)}
      />
      {showMarket && <MarketModal onClose={() => setShowMarket(false)} />}
      {showScore  && <ScoreboardModal onClose={() => setShowScore(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
