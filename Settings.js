import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Settings({ navigation }) {
  const resetLocation = async () => {
    try {
      await AsyncStorage.removeItem('locationCode');
      Alert.alert(
        'Success', 
        'Location has been reset. App will restart.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'LocationSetup' }],
              });
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to reset location');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <TouchableOpacity 
        style={styles.resetButton}
        onPress={resetLocation}
      >
        <Text style={styles.buttonText}>Reset Location</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFD60A',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#87CEEB',
    marginTop: 60,
    marginBottom: 30,
  },
  resetButton: {
    backgroundColor: '#FF4040',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#87CEEB',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});