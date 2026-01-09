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
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No water logged yet today</Text>
        <Text style={styles.emptySubtext}>Tap the buttons above to add water</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Log</Text>
      <FlatList
        data={sortedEntries}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.entry}>
            <View style={styles.entryInfo}>
              <Text style={styles.entryAmount}>
                {mlToDisplay(item.amountMl, unitSystem)}
              </Text>
              <Text style={styles.entryTime}>{formatTime(item.timestamp)}</Text>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemoveEntry(item.id)}
            >
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  entry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  entryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  entryTime: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  removeButton: {
    padding: 6,
  },
  removeText: {
    color: COLORS.error,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
});
