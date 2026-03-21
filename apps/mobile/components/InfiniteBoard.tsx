import { useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring, clamp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useGame } from '../contexts/GameContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  CELL_SIZE, CELL_GAP, ZONE_GAP, CELLS_PER_ZONE, ZONE_SIZE, ZONE_STRIDE,
  CELL_COLORS, coordToKey, get8Neighbors, keyToCoord, type PlacedPump,
} from '@farm/game-core';
import Zone from './Zone';

const { width: SW, height: SH } = Dimensions.get('window');

const MIN_SCALE = 0.4;
const MAX_SCALE = 2.0;
const SPRING    = { damping: 20, stiffness: 200, mass: 0.5 };

export default function InfiniteBoard() {
  const { theme } = useTheme();
  const {
    cellStates, unlockedZones, placedPumps,
    selectedTool, applyWater, applySeed, applyHarvest, applyLaser, placePump,
  } = useGame();

  // Camera transform
  const tx = useSharedValue(SW / 2 - ZONE_SIZE / 2);
  const ty = useSharedValue(SH / 2 - ZONE_SIZE / 2 - 80); // 80 ≈ header height
  const sc = useSharedValue(1);

  // Saved values at gesture start
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);
  const savedSc = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: sc.value }],
  }));

  // ── Pan gesture ─────────────────────────────────────────────────────────────
  const panGesture = Gesture.Pan()
    .minDistance(4)
    .onStart(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    })
    .onUpdate(e => {
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(e => {
      tx.value = withSpring(tx.value + e.velocityX * 0.08, SPRING);
      ty.value = withSpring(ty.value + e.velocityY * 0.08, SPRING);
    });

  // ── Pinch gesture ───────────────────────────────────────────────────────────
  const pinchGesture = Gesture.Pinch()
    .onStart(() => { savedSc.value = sc.value; })
    .onUpdate(e => {
      sc.value = clamp(savedSc.value * e.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      sc.value = withSpring(sc.value, SPRING);
    });

  // ── Tap gesture (tool application) ─────────────────────────────────────────
  const tapGesture = Gesture.Tap()
    .onEnd((e, success) => {
      if (!success || !selectedTool) return;
      // Convert screen → world coords
      const worldX = (e.x - tx.value) / sc.value;
      const worldY = (e.y - ty.value) / sc.value;

      const gx  = Math.floor(worldX / ZONE_STRIDE);
      const gy  = Math.floor(worldY / ZONE_STRIDE);
      const lx  = worldX - gx * ZONE_STRIDE;
      const ly  = worldY - gy * ZONE_STRIDE;
      const col = Math.floor(lx / (CELL_SIZE + CELL_GAP));
      const row = Math.floor(ly / (CELL_SIZE + CELL_GAP));

      if (col < 0 || col >= CELLS_PER_ZONE || row < 0 || row >= CELLS_PER_ZONE) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      switch (selectedTool) {
        case 'water':   applyWater(gx, gy, row, col);   break;
        case 'seed':    applySeed(gx, gy, row, col);     break;
        case 'harvest': applyHarvest(gx, gy, row, col);  break;
        case 'laser':   applyLaser(gx, gy, row, col);    break;
        case 'pump':    placePump(gx, gy, row, col);     break;
      }
    });

  const composed = Gesture.Simultaneous(
    panGesture,
    Gesture.Race(pinchGesture, tapGesture),
  );

  // ── Pumped cells set ────────────────────────────────────────────────────────
  const pumpedKeys = useMemo(() => {
    const result = new Set<string>();
    for (const pump of placedPumps) {
      for (const nb of get8Neighbors(pump)) {
        const key = coordToKey(nb);
        if (cellStates.get(key)?.status === 'water-source') result.add(key);
      }
    }
    return result;
  }, [placedPumps, cellStates]);

  // ── Zone list ────────────────────────────────────────────────────────────────
  const zones = useMemo(() =>
    Array.from(unlockedZones).map(zk => {
      const [gx, gy] = zk.split(',').map(Number);
      return { gx, gy };
    }),
    [unlockedZones]
  );

  const handlePumpPickup = useCallback((pump: PlacedPump) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // pickupPump called from Zone via long press
  }, []);

  return (
    <View style={styles.root}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.world, animStyle]}>
          {zones.map(({ gx, gy }) => (
            <Zone
              key={`${gx},${gy}`}
              gx={gx} gy={gy}
              cellStates={cellStates}
              pumpedKeys={pumpedKeys}
              placedPumps={placedPumps.filter(p => p.gx === gx && p.gy === gy)}
            />
          ))}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, overflow: 'hidden' },
  world: { position: 'absolute', top: 0, left: 0 },
});
