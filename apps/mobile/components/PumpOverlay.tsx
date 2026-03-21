import { View, Text, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { CELL_SIZE, CELL_GAP, type PlacedPump } from '@farm/game-core';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  pump: PlacedPump;
  onPickup: () => void;
}

const HOLD_MS = 500;

export default function PumpOverlay({ pump, onPickup }: Props) {
  const { theme } = useTheme();

  const x = pump.col * (CELL_SIZE + CELL_GAP);
  const y = pump.row * (CELL_SIZE + CELL_GAP);

  const longPress = Gesture.LongPress()
    .minDuration(HOLD_MS)
    .onStart(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onPickup();
    });

  return (
    <GestureDetector gesture={longPress}>
      <View
        style={[
          s.pump,
          {
            left: x, top: y,
            backgroundColor: '#60b8d880',
            borderColor: '#60c8e8',
          },
        ]}
      >
        <Text style={s.icon}>⛽</Text>
      </View>
    </GestureDetector>
  );
}

const s = StyleSheet.create({
  pump: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  icon: { fontSize: 14 },
});
