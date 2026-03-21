import { View, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import Animated, { useAnimatedStyle, withRepeat, withSequence, withTiming, useSharedValue } from 'react-native-reanimated';
import { useGame } from '../contexts/GameContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  CELL_SIZE, CELL_GAP, ZONE_SIZE, ZONE_STRIDE, CELLS_PER_ZONE, CELL_COLORS,
  coordToKey, type CellState, type PlacedPump,
} from '@farm/game-core';
import PumpOverlay from './PumpOverlay';

interface Props {
  gx: number;
  gy: number;
  cellStates: Map<string, CellState>;
  pumpedKeys: Set<string>;
  placedPumps: PlacedPump[];
}

function Cell({ cellKey, state, isPumped }: { cellKey: string; state: CellState | undefined; isPumped: boolean }) {
  const { theme } = useTheme();
  const color = state ? CELL_COLORS[state.status] : theme.pageBg;
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isPumped) {
      scale.value = withRepeat(
        withSequence(
          withTiming(0.84, { duration: 560 }),
          withTiming(1,    { duration: 560 }),
        ),
        -1,
        false,
      );
    } else {
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [isPumped]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.cell, { backgroundColor: color }, animStyle]} />
  );
}

export default function Zone({ gx, gy, cellStates, pumpedKeys, placedPumps }: Props) {
  const { pickupPump } = useGame();

  const left = gx * ZONE_STRIDE;
  const top  = gy * ZONE_STRIDE;

  const cells = [];
  for (let row = 0; row < CELLS_PER_ZONE; row++) {
    for (let col = 0; col < CELLS_PER_ZONE; col++) {
      const key   = coordToKey({ gx, gy, row, col });
      const state = cellStates.get(key);
      const isPumped = pumpedKeys.has(key);
      cells.push(
        <Cell key={key} cellKey={key} state={state} isPumped={isPumped} />
      );
    }
  }

  return (
    <View style={[styles.zone, { left, top, width: ZONE_SIZE, height: ZONE_SIZE }]}>
      <View style={styles.grid}>{cells}</View>
      {placedPumps.map(pump => (
        <PumpOverlay key={pump.id} pump={pump} onPickup={() => pickupPump(pump.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    position: 'absolute',
    overflow: 'visible',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CELL_GAP,
    width: ZONE_SIZE,
    height: ZONE_SIZE,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 1,
  },
});
