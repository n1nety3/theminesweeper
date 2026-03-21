import { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { API_BASE_URL } from '../constants/api';

interface Entry { name: string; score: number; session_id: string; }
const MEDALS = ['🥇', '🥈', '🥉'];

interface Props { onClose: () => void; }

export default function ScoreboardModal({ onClose }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/leaderboard`)
      .then(r => r.json())
      .then(d => setEntries(d.entries ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={[s.overlay, { backgroundColor: '#000a' }]}>
        <View style={[s.sheet, { backgroundColor: theme.barBg, paddingBottom: insets.bottom + 16 }]}>
          <View style={s.handle} />
          <View style={s.header}>
            <Text style={[s.title, { color: theme.textPrimary }]}>SCOREBOARD</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={[s.closeText, { color: theme.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator color={theme.accent} style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              data={entries}
              keyExtractor={item => item.session_id}
              renderItem={({ item, index }) => (
                <View style={[s.row, { borderColor: theme.btnIconRing }]}>
                  <Text style={[s.medal, { width: 28 }]}>{MEDALS[index] ?? `${index + 1}.`}</Text>
                  <Text style={[s.name, { color: theme.textPrimary, flex: 1 }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[s.score, { color: '#f9c424' }]}>{item.score}</Text>
                </View>
              )}
              ListEmptyComponent={
                <Text style={[s.empty, { color: theme.textMuted }]}>No scores yet</Text>
              }
              style={{ maxHeight: 360 }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 12 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#444', alignSelf: 'center', marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 18 },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 10 },
  medal: { fontSize: 16, textAlign: 'center' },
  name: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13 },
  score: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13, fontWeight: '700' },
  empty: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, textAlign: 'center', marginTop: 24 },
});
