import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGame } from '../contexts/GameContext';
import { useTheme } from '../contexts/ThemeContext';
import type { Tool } from '@farm/game-core';

const TOOL_EMOJI: Record<Tool, string> = {
  water:   '💧',
  seed:    '🌱',
  harvest: '🌾',
  laser:   '⚡',
  pump:    '⛽',
};

const TOOL_ACCENT: Record<Tool, string> = {
  water:   '#60b8d8',
  seed:    '#70be50',
  harvest: '#f9c424',
  laser:   '#f08020',
  pump:    '#60c8e8',
};

const TOOLS: Tool[] = ['water', 'seed', 'harvest', 'laser', 'pump'];

interface Props {
  paddingBottom: number;
  onOpenMarket: () => void;
}

export default function ItemPanel({ paddingBottom, onOpenMarket }: Props) {
  const { selectedTool, selectTool, seeds, water, grain, laserBattery, pumps, hasHarvestable } = useGame();
  const { theme } = useTheme();

  const getBadge = (id: Tool): string | null => {
    switch (id) {
      case 'water':   return String(water);
      case 'seed':    return String(seeds);
      case 'harvest': return null;
      case 'laser':   return `${laserBattery}%`;
      case 'pump':    return String(pumps);
    }
  };

  const isDisabled = (id: Tool): boolean => {
    if (id === 'harvest' && !hasHarvestable) return true;
    if (id === 'laser'   && laserBattery <= 0) return true;
    if (id === 'pump'    && pumps <= 0) return true;
    return false;
  };

  const isBadgeLow = (id: Tool): boolean => {
    if (id === 'water')   return water <= 2;
    if (id === 'seed')    return seeds <= 2;
    if (id === 'laser')   return laserBattery <= 20;
    if (id === 'pump')    return pumps <= 0;
    return false;
  };

  const handleSelect = (id: Tool) => {
    if (isDisabled(id)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectTool(id);
  };

  return (
    <View style={[s.panel, { paddingBottom: paddingBottom + 8, backgroundColor: theme.barBg, borderTopColor: theme.btnIconRing }]}>
      <View style={s.row}>
        {TOOLS.map(id => {
          const active   = selectedTool === id;
          const disabled = isDisabled(id);
          const badge    = getBadge(id);
          const badgeLow = isBadgeLow(id);
          return (
            <TouchableOpacity
              key={id}
              style={[
                s.tool,
                { backgroundColor: theme.btnIconBg, borderColor: theme.btnIconRing },
                active   && { borderColor: TOOL_ACCENT[id], backgroundColor: theme.barBg },
                disabled && { opacity: 0.4 },
              ]}
              onPress={() => handleSelect(id)}
              activeOpacity={0.8}
            >
              <Text style={s.emoji}>{TOOL_EMOJI[id]}</Text>
              {badge !== null && (
                <View style={[s.badge, { backgroundColor: badgeLow ? '#c03020' : theme.btnIconBg }]}>
                  <Text style={[s.badgeText, { color: badgeLow ? '#fff' : theme.textMuted }]}>{badge}</Text>
                </View>
              )}
              {active && <View style={[s.activeDot, { backgroundColor: TOOL_ACCENT[id] }]} />}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[s.tool, s.marketBtn, { backgroundColor: theme.btnIconBg, borderColor: theme.btnIconRing }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onOpenMarket(); }}
          activeOpacity={0.8}
        >
          <Text style={s.emoji}>🏪</Text>
          <Text style={[s.marketLabel, { color: theme.textMuted }]}>
            {grain}g
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  panel: {
    paddingTop: 10, paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tool: {
    width: 52, height: 52, borderRadius: 10, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 22 },
  badge: {
    position: 'absolute', top: -4, right: -4,
    borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1, minWidth: 16, alignItems: 'center',
  },
  badgeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 8, fontWeight: '700',
  },
  activeDot: {
    position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2,
  },
  marketBtn: { width: 52, height: 52, borderRadius: 10, borderWidth: 1.5 },
  marketLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 8, marginTop: 2,
  },
});
