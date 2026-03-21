import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useGame } from '../contexts/GameContext';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  paddingTop: number;
  onOpenScore: () => void;
}

function ResourcePill({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  const { theme } = useTheme();
  return (
    <View style={[pill.wrap, { backgroundColor: theme.btnIconBg, borderColor: theme.btnIconRing }]}>
      <Text style={[pill.label, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[pill.value, { color: accent ?? theme.textPrimary }]}>{value}</Text>
    </View>
  );
}

const pill = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 6, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4 },
  label: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 9, letterSpacing: 0.5, marginRight: 3 },
  value: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11, fontWeight: '700' },
});

export default function MobileStatusBar({ paddingTop, onOpenScore }: Props) {
  const { seeds, water, grain, score, laserBattery, playerName } = useGame();
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <View style={[s.bar, { paddingTop: paddingTop + 8, backgroundColor: theme.barBg, borderBottomColor: theme.btnIconRing }]}>
      <View style={s.left}>
        <Text style={[s.farm, { color: theme.accent }]} numberOfLines={1}>{playerName ?? 'FARM'}</Text>
      </View>
      <View style={s.center}>
        <ResourcePill label="S" value={seeds} />
        <ResourcePill label="W" value={water} accent="#60b8d8" />
        <ResourcePill label="G" value={grain} accent="#f9c424" />
        <ResourcePill label="⚡" value={`${laserBattery}%`} accent="#f08020" />
      </View>
      <View style={s.right}>
        <TouchableOpacity onPress={toggleTheme} style={s.iconBtn}>
          <Text style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onOpenScore} style={s.iconBtn}>
          <Text style={[s.scoreText, { color: theme.textPrimary }]}>{score}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingBottom: 8,
    borderBottomWidth: 1,
  },
  left: { flex: 1 },
  center: { flexDirection: 'row', alignItems: 'center' },
  right: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  farm: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13, fontWeight: '700', letterSpacing: 1, maxWidth: 90,
  },
  iconBtn: { padding: 4, marginLeft: 4 },
  scoreText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12, fontWeight: '700',
  },
});
