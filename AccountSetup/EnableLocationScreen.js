import React, { useState } from 'react';
import {
  Image,
  SafeAreaView,
  Platform,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Import your function to update user data
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EnableLocationScreen({ navigation }) {
  const [location, setLocation] = useState(null);

  // Called when user taps "Yes, enable my location"
  const handleEnableLocation = async () => {
    try {
      // 1) Ask permission to use location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // If they deny, just store "False" in user_location_service
        await updateLocationServiceInDB('False');
        navigation.navigate('EnableNotificationsScreen');
        return;
      }

      // 2) If granted, get current position (optional)
      const currentPosition = await Location.getCurrentPositionAsync({});
      setLocation(currentPosition.coords);

      // 3) user_location_service => "True"
      await updateLocationServiceInDB('True');

      // 4) Navigate to the next screen
      navigation.navigate('EnableNotificationsScreen');
    } catch (error) {
      console.error('Error enabling location:', error);
      // If there's an error, still store "False" or handle differently
      await updateLocationServiceInDB('False');
      navigation.navigate('EnableNotificationsScreen');
    }
  };

  // Called if user taps "Maybe Later"
  const handleMaybeLater = async () => {
    // user_location_service => "False"
    await updateLocationServiceInDB('False');
    navigation.navigate('EnableNotificationsScreen');
  };

  // Helper to store user_location_service in DB
  const updateLocationServiceInDB = async (value) => {
    // Build a FormData with user_location_service = True or False
    const url = 'https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo';
    const formData = new FormData();
    const uid = await AsyncStorage.getItem('user_uid');
    const email = await AsyncStorage.getItem('user_email_id');
    formData.append('user_uid', uid); // Example user ID
    formData.append('user_email_id', email);
    formData.append('user_location_service', value);
    try {
      const response = await fetch(url, {
        method: 'PUT',
        body: formData,
      });
      if (response.ok) {
        const result = await response.json();
        console.log('Response from server:', result);
      }
    } catch (error) {
      console.log('Error updating user data:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="red" />
      </TouchableOpacity>

      {/* Main content container */}
      <View style={styles.content}>
        {/* Big location icon */}
        <Image
          source={require('../assets/map_location.png')}
          style={styles.locationIcon}
        />

        {/* Title */}
        <Text style={styles.title}>Enable Location?</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Discover matches within your preferred distance and set up your dates through our direct
          messaging feature
        </Text>

        {/* Big red button */}
        <TouchableOpacity style={styles.enableButton} onPress={handleEnableLocation}>
          <Text style={styles.enableButtonText}>Yes, enable my location</Text>
        </TouchableOpacity>

        {/* Maybe Later link */}
        <TouchableOpacity onPress={handleMaybeLater}>
          <Text style={styles.maybeLaterText}>Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// STYLES
const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 30,
    padding: 8,
  },
  container: {
    alignItems: 'stretch',
    backgroundColor: '#FFF',
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  enableButton: {
    backgroundColor: '#E4423F',
    borderRadius: 25,
    marginBottom: 20,
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  enableButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationIcon: {
    height: 100,
    marginBottom: 30,
    tintColor: '#CCC',
    width: 100,
  },
  maybeLaterText: {
    color: '#000',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  subtitle: {
    color: 'gray',
    fontSize: 14,
    marginBottom: 50,
    marginHorizontal: 40,
    textAlign: 'center',
  },
  title: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
