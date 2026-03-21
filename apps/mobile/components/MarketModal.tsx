import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useGame } from '../contexts/GameContext';
import { useTheme } from '../contexts/ThemeContext';
import { PUMP_GRAIN_COST, INITIAL_BATTERY } from '@farm/game-core';

interface TradeRowProps {
  label: string;
  from: string;
  to: string;
  canAfford: boolean;
  onTrade: () => void;
}

function TradeRow({ label, from, to, canAfford, onTrade }: TradeRowProps) {
  const { theme } = useTheme();
  return (
    <View style={[tr.row, { borderColor: theme.btnIconRing }]}>
      <View style={tr.info}>
        <Text style={[tr.label, { color: theme.textMuted }]}>{label}</Text>
        <Text style={[tr.exchange, { color: theme.textPrimary }]}>{from} → {to}</Text>
      </View>
      <TouchableOpacity
        style={[tr.btn, { backgroundColor: canAfford ? '#1a4a28' : theme.btnIconBg }]}
        onPress={() => {
          if (!canAfford) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onTrade();
        }}
        activeOpacity={0.8}
      >
        <Text style={[tr.btnText, { color: canAfford ? '#7acc50' : theme.textMuted }]}>
          {canAfford ? 'TRADE' : 'NEED'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const tr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, paddingVertical: 10 },
  info: { flex: 1 },
  label: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 9, letterSpacing: 0.5, marginBottom: 2 },
  exchange: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13, fontWeight: '700' },
  btn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 6, marginLeft: 12 },
  btnText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
});

interface Props { onClose: () => void; }

export default function MarketModal({ onClose }: Props) {
  const { grain, seeds, water, laserBattery,
    tradeGrainForSeeds, tradeGrainForWater, tradeSeedsForGrain, tradeWaterForGrain,
    buyLaserBattery, buyPump,
  } = useGame();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={[s.overlay, { backgroundColor: '#000a' }]}>
        <View style={[s.sheet, { backgroundColor: theme.barBg, paddingBottom: insets.bottom + 16 }]}>
          <View style={s.handle} />
          <View style={s.header}>
            <Text style={[s.title, { color: theme.textPrimary }]}>MARKET</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={[s.closeText, { color: theme.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={[s.grain, { color: '#f9c424' }]}>Grain: {grain}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TradeRow label="SEEDS" from="1 grain" to="2 seeds" canAfford={grain >= 1} onTrade={tradeGrainForSeeds} />
            <TradeRow label="WATER" from="4 grain" to="1 water" canAfford={grain >= 4} onTrade={tradeGrainForWater} />
            <TradeRow label="GRAIN" from="2 seeds" to="1 grain" canAfford={seeds >= 2} onTrade={tradeSeedsForGrain} />
            <TradeRow label="GRAIN" from="1 water" to="4 grain" canAfford={water >= 1} onTrade={tradeWaterForGrain} />
            <TradeRow
              label="LASER BATTERY"
              from={`${BATTERY_GRAIN_COST}g`}
              to="100% charge"
              canAfford={grain >= BATTERY_GRAIN_COST && laserBattery < 100}
              onTrade={buyLaserBattery}
            />
            <TradeRow
              label="PUMP"
              from={`${PUMP_GRAIN_COST} grain`}
              to="+1 pump"
              canAfford={grain >= PUMP_GRAIN_COST}
              onTrade={buyPump}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const BATTERY_GRAIN_COST = 5;

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 12 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#444', alignSelf: 'center', marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 18 },
  grain: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13, fontWeight: '700', marginBottom: 8 },
});
