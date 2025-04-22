import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import TodaysList from './TodaysList.js';

const Stack = createStackNavigator();

function LoginScreen({ navigation }) {
  const [locationCode, setLocationCode] = useState('');
  const [passcode, setPasscode] = useState('');

  const handleLogin = () => {
    if (locationCode === 'LOC001' && passcode === '1234') {
      // Pass the required parameters to TodaysList
      navigation.navigate('TodaysList', {
        role: 'Employee',  // You can set this to 'Admin' if needed
        location: 'Waimea' // Or whatever location name corresponds to LOC001
      });
    } else {
      Alert.alert('Error', 'Invalid location code or passcode.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>JoJo's Shave Ice</Text>
      <TextInput
        style={styles.input}
        placeholder="Location Code (e.g., LOC001)"
        placeholderTextColor="#87CEEB"
        value={locationCode}
        onChangeText={setLocationCode}
      />
      <TextInput
        style={styles.input}
        placeholder="Passcode (e.g., 1234)"
        placeholderTextColor="#87CEEB"
        value={passcode}
        onChangeText={setPasscode}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Go</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TodaysList" component={TodaysList} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFD60A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#87CEEB',
    marginBottom: 40,
  },
  input: {
    width: '80%',
    height: 50,
    backgroundColor: '#2F2F2F',
    color: '#FFFFFF',
    borderColor: '#87CEEB',
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF4040',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});