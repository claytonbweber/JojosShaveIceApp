import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import LocationHeader from './components/LocationHeader';

const COLORS = {
  primary: '#1E88E5',
  background: '#FFD60A',
  success: '#4CAF50',
  error: '#FF4040',
  white: '#FFFFFF',
  primaryTransparent: 'rgba(30, 136, 229, 0.1)',
  successTransparent: 'rgba(76, 175, 80, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  adminBackground: 'rgba(30, 136, 229, 0.95)',
};

export default function LocationSetup({ navigation }) {
  const [locationCode, setLocationCode] = useState('');
  const [showAdminVerification, setShowAdminVerification] = useState(false);
  const [adminCode, setAdminCode] = useState('');

  useEffect(() => {
    Alert.alert('Debug', 'LocationSetup v14 Loaded - Positioned in Top Third');
  }, []);

  const handleLocationSubmit = async () => {
    try {
      const uppercaseCode = locationCode.toUpperCase();
      console.log('Attempting to verify location code:', uppercaseCode);
      
      const locationsRef = collection(db, 'locations');
      const querySnapshot = await getDocs(locationsRef);
      
      let locationFound = false;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Checking location:', data);
        if (data.Code === uppercaseCode) {
          console.log('Location verified successfully:', data.Name);
          locationFound = true;
          setShowAdminVerification(true);
        }
      });

      if (!locationFound) {
        console.log('Location verification failed');
        Alert.alert('Error', 'Invalid location code');
      }
    } catch (error) {
      console.error('Detailed error:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      Alert.alert('Error', 'Failed to verify location code');
    }
  };

  const handleAdminVerification = async () => {
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
        await AsyncStorage.setItem('locationCode', locationCode.toUpperCase());
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
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

  const handleKeyPress = (key) => {
    if (adminCode.length < 6) {
      setAdminCode(prev => prev + key);
    }
  };

  const handleDelete = () => {
    setAdminCode(prev => prev.slice(0, -1));
  };

  const handleBackPress = () => {
    console.log('Back button pressed, returning to location code screen');
    Alert.alert('Debug', 'Returning to Location Code Screen');
    setShowAdminVerification(false);
    setAdminCode('');
  };

  return (
    <View style={styles.outerContainer}>
      <SafeAreaView style={styles.container}>
        <LocationHeader />
        
        {!showAdminVerification ? (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inputContainer}>
              <Text style={styles.title}>Enter Location Code</Text>
              <TextInput
                style={styles.locationInput}
                value={locationCode}
                onChangeText={setLocationCode}
                placeholder="Enter Location Code"
                placeholderTextColor={COLORS.primary}
                autoCapitalize="characters"
                maxLength={8}
              />
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleLocationSubmit}
              >
                <Text style={styles.submitButtonText}>Verify Location</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.adminContainer}>
            <View style={styles.inputContainer}>
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
                  onPress={handleAdminVerification}
                >
                  <Text style={styles.keyText}>✓</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.fixedBottomContainer}>
              <TouchableOpacity 
                style={styles.fixedCancelButton} 
                onPress={handleBackPress}
              >
                <Text style={styles.fixedCancelButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start', // Align content at the top
  },
  adminContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inputContainer: {
    marginTop: 5, // Further reduced to position in top third
    justifyContent: 'flex-start', // Align items at the top of the container
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 40,
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
  locationInput: {
    width: '80%',
    height: 50,
    backgroundColor: COLORS.primaryTransparent,
    borderColor: COLORS.primary,
    borderWidth: 2,
    borderRadius: 10,
    padding: 10,
    fontSize: 24,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: COLORS.successTransparent,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    borderColor: COLORS.primary,
    borderWidth: 2,
    marginBottom: 20,
  },
  submitButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  fixedBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    zIndex: 3000,
    minHeight: 80,
    width: '100%',
    alignItems: 'center',
  },
  fixedCancelButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 15,
    width: '80%',
    alignItems: 'center',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.5,
    elevation: 6,
  },
  fixedCancelButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});