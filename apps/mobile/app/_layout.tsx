import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { GameProvider } from '../contexts/GameContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <GameProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
        </GameProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
