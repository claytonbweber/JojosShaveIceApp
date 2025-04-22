import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LocationHeader({ variant = 'default' }) {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerText}>
        Setting Location
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#4CAF50', // Green color
    borderRadius: 10,
    marginTop: 60, // Increased from 44 to 60 to position it lower
    marginBottom: 20, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.5,
    elevation: 6,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
});