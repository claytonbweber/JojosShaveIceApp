import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function BottomCancelBanner({ onPress, text = "Cancel" }) {
  return (
    <View style={styles.bottomBannerContainer}>
      <TouchableOpacity 
        style={styles.bottomBanner}
        onPress={onPress}
      >
        <Text style={styles.bottomBannerText}>{text}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    alignItems: 'center',
    zIndex: 1000, // Ensure it's on top of everything
    elevation: 10, // For Android
  },
  bottomBanner: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.5,
    elevation: 6,
  },
  bottomBannerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
});