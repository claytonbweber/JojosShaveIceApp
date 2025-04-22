import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const COLORS = {
  primary: '#1E88E5',
  background: '#FFD60A',
  success: '#4CAF50',
  error: '#FF4040',
  white: '#FFFFFF',
  primaryTransparent: 'rgba(30, 136, 229, 0.1)',
  successTransparent: 'rgba(76, 175, 80, 0.1)',
  adminBackground: 'rgba(30, 136, 229, 0.95)',
};

export default function Login({ navigation }) {
  const [passcode, setPasscode] = useState('');
  const [locationCode, setLocationCode] = useState('');
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showAdminCodeEntry, setShowAdminCodeEntry] = useState(false);
  const [adminCode, setAdminCode] = useState('');

  useEffect(() => {
    loadLocationCode();
  }, []);

  const loadLocationCode = async () => {
    try {
      const code = await AsyncStorage.getItem('locationCode');
      if (code) {
        setLocationCode(code);
      }
    } catch (error) {
      console.error('Error loading location code:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('passcode', '==', passcode));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const userLocations = userData.location || [];
        const userRole = userData.role || 'Regular';
        
        if (userLocations.includes(locationCode)) {
          navigation.navigate('TodaysList');
        } else {
          Alert.alert('Error', 'Location code does not match user permissions.');
        }
      } else {
        Alert.alert('Error', 'Invalid passcode.');
      }
      setPasscode('');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to log in: ' + error.message);
    }
  };

  const handleKeyPress = (key) => {
    if (showAdminCodeEntry) {
      if (adminCode.length < 6) {
        setAdminCode(prev => prev + key);
      }
    } else {
      if (passcode.length < 6) {
        setPasscode(prev => prev + key);
      }
    }
  };

  const handleDelete = () => {
    if (showAdminCodeEntry) {
      setAdminCode(prev => prev.slice(0, -1));
    } else {
      setPasscode(prev => prev.slice(0, -1));
    }
  };

  const toggleAdminMenu = () => {
    setShowAdminMenu(!showAdminMenu);
  };

  const handleResetLocation = () => {
    setShowAdminMenu(false);
    setShowAdminCodeEntry(true);
  };

  const handleAdminCodeSubmit = async () => {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      let adminVerified = false;
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.passcode === adminCode && userData.role === "Admin") {
          adminVerified = true;
        }
      });

      if (adminVerified) {
        await AsyncStorage.removeItem('locationCode');
        navigation.reset({
          index: 0,
          routes: [{ name: 'LocationSetup' }],
        });
      } else {
        Alert.alert('Error', 'Invalid admin code');
        setAdminCode('');
      }
    } catch (error) {
      console.error('Admin verification error:', error);
      Alert.alert('Error', 'Failed to verify admin code');
      setAdminCode('');
    }
  };

  const handleCancelAdminCode = () => {
    setShowAdminCodeEntry(false);
    setAdminCode('');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.adminButton}
        onPress={toggleAdminMenu}
      >
        <Text style={styles.adminButtonText}>Admin</Text>
      </TouchableOpacity>

      {showAdminMenu && (
        <View style={styles.adminMenu}>
          <TouchableOpacity 
            style={styles.adminMenuItem}
            onPress={handleResetLocation}
          >
            <Text style={styles.adminMenuText}>Reset Location</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.title}>Log In</Text>
        <View style={styles.codeContainer}>
          {[...Array(6)].map((_, i) => (
            <View key={i} style={styles.codeDot}>
              {i < passcode.length && <View style={styles.filledDot} />}
            </View>
          ))}
        </View>
        <View style={styles.keypad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.key}
              onPress={() => handleKeyPress(num.toString())}
            >
              <Text style={styles.keyText}>{num}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.key} onPress={handleDelete}>
            <Text style={styles.keyText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={() => handleKeyPress('0')}>
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.key, styles.submitKey]} 
            onPress={handleSubmit}
          >
            <Text style={styles.keyText}>✓</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showAdminCodeEntry && (
        <View style={styles.overlay}>
          <View style={styles.adminCodeContainer}>
            <Text style={styles.title}>Enter Admin Code</Text>
            <View style={styles.codeContainer}>
              {[...Array(6)].map((_, i) => (
                <View key={i} style={styles.codeDot}>
                  {i < adminCode.length && <View style={styles.filledDot} />}
                </View>
              ))}
            </View>
            <View style={styles.keypad}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.key}
                  onPress={() => handleKeyPress(num.toString())}
                >
                  <Text style={styles.keyText}>{num}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.key} onPress={handleDelete}>
                <Text style={styles.keyText}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.key} onPress={() => handleKeyPress('0')}>
                <Text style={styles.keyText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.key, styles.submitKey]} 
                onPress={handleAdminCodeSubmit}
              >
                <Text style={styles.keyText}>✓</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelAdminCode}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    zIndex: 1,
  },
  adminButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  adminMenu: {
    position: 'absolute',
    top: 110,
    left: 20,
    backgroundColor: COLORS.adminBackground,
    borderRadius: 10,
    padding: 5,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  adminMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  adminMenuText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  adminCodeContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 40,
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  codeContainer: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  codeDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filledDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  keypad: {
    width: '80%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  key: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: COLORS.primaryTransparent,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1.5%',
  },
  keyText: {
    fontSize: 32,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  submitKey: {
    backgroundColor: COLORS.successTransparent,
  },
  cancelButton: {
    backgroundColor: COLORS.error,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 20,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});