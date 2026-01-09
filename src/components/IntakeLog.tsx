import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { WaterEntry, UnitSystem } from '../types';
import { mlToDisplay } from '../utils/units';
import { COLORS } from '../constants';

interface IntakeLogProps {
  entries: WaterEntry[];
  unitSystem: UnitSystem;
  onRemoveEntry: (entryId: string) => void;
}

export function IntakeLog({ entries, unitSystem, onRemoveEntry }: IntakeLogProps) {
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
        <Text style={styles.emptyText}>No entries yet</Text>
        <Text style={styles.emptySubtext}>Tap a button above to log water</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity</Text>
      <FlatList
        data={sortedEntries}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.entry}>
            <View style={styles.entryLeft}>
              <View style={styles.dot} />
              <View>
                <Text style={styles.entryAmount}>
                  {mlToDisplay(item.amountMl, unitSystem)}
                </Text>
                <Text style={styles.entryTime}>{formatTime(item.timestamp)}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemoveEntry(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.primary,
  },
  entryAmount: {
    fontSize: 17,
    fontWeight: '500',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  entryTime: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  removeText: {
    color: COLORS.textTertiary,
    fontSize: 14,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 17,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 15,
    color: COLORS.textTertiary,
    marginTop: 6,
  },
});
