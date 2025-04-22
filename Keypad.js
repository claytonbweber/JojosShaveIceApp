import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function Keypad({ onKeyPress, onDelete, onSubmit }) {
  const renderKey = (number) => (
    <TouchableOpacity
      style={styles.key}
      onPress={() => onKeyPress(number)}
    >
      <Text style={styles.keyText}>{number}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.keypad}>
      <View style={styles.row}>
        {renderKey('1')}
        {renderKey('2')}
        {renderKey('3')}
      </View>
      <View style={styles.row}>
        {renderKey('4')}
        {renderKey('5')}
        {renderKey('6')}
      </View>
      <View style={styles.row}>
        {renderKey('7')}
        {renderKey('8')}
        {renderKey('9')}
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={styles.key} onPress={onDelete}>
          <Text style={styles.keyText}>←</Text>
        </TouchableOpacity>
        {renderKey('0')}
        <TouchableOpacity style={styles.key} onPress={onSubmit}>
          <Text style={styles.keyText}>✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  keypad: {
    width: '80%',
    aspectRatio: 3/4,
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  key: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: 'rgba(135, 206, 235, 0.1)',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 32,
    color: '#87CEEB',
    fontWeight: 'bold',
  },
});