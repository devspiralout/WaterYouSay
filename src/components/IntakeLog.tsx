import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { WaterEntry, UnitSystem } from '../types';
import { mlToDisplay } from '../utils/units';
import { useTheme } from '../context/ThemeContext';

interface IntakeLogProps {
  entries: WaterEntry[];
  unitSystem: UnitSystem;
  onRemoveEntry: (entryId: string) => void;
}

export function IntakeLog({ entries, unitSystem, onRemoveEntry }: IntakeLogProps) {
  const { colors } = useTheme();
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  if (entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No entries yet</Text>
        <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>Tap a button above to log water</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>Activity</Text>
      <FlatList
        data={sortedEntries}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.entry}>
            <View style={styles.entryLeft}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <View>
                <Text style={[styles.entryAmount, { color: colors.text }]}>
                  {mlToDisplay(item.amountMl, unitSystem)}
                </Text>
                <Text style={[styles.entryTime, { color: colors.textTertiary }]}>{formatTime(item.timestamp)}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemoveEntry(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.removeText, { color: colors.textTertiary }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  entry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  entryAmount: {
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  entryTime: {
    fontSize: 14,
    marginTop: 2,
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  removeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  separator: {
    height: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 15,
    marginTop: 6,
  },
});
