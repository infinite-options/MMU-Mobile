import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LandingPage5 = () => {
  const navigation = useNavigation();

  const handleStart = async () => {
    try {
      // Mark onboarding as completed
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      navigation.navigate('AccountSetup2Create');
    } catch (error) {
      console.warn('Error saving onboarding status:', error);
      // Still navigate even if saving fails
      navigation.navigate('AccountSetup2Create');
    }
  };

  const handleLogin = async () => {
    try {
      // Mark onboarding as completed for users who login
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      navigation.navigate('Login');
    } catch (error) {
      console.warn('Error saving onboarding status:', error);
      // Still navigate even if saving fails
      navigation.navigate('Login');
    }
  };

  return (
    <ImageBackground source={require('../assets/image4.png')} style={styles.backgroundImage}>
      {/* Red Tint Overlay */}
      <View style={styles.redTint} />

      {/* White Card Overlay */}
      <View style={styles.overlay}>
        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.activeDot} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Meet Me</Text>

        {/* Description */}
        <Text style={styles.description}>Meet the missing piece that compliments you.</Text>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleStart}>
          <Text style={styles.continueButtonText}>Start</Text>
        </TouchableOpacity>

        {/* Log In Link */}
        <Text style={styles.loginText}>
          Already have an account?{' '}
          <Text style={styles.loginLink} onPress={handleLogin}>
            Log In
          </Text>
        </Text>
      </View>
    </ImageBackground>
  );
};

export const styles = StyleSheet.create({
  activeDot: {
    backgroundColor: '#E4423F',
    width: 16, // Elongated active dot
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'relative',
    resizeMode: 'cover',
  },
  continueButton: {
    backgroundColor: '#E4423F',
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: 'center',
    width: '60%', // Reduced button width
    marginBottom: 15,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  description: {
    color: '#666666',
    fontSize: 16,
    marginBottom: 50,
    textAlign: 'center',
  },
  dot: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    height: 8,
    marginHorizontal: 4,
    width: 8,
  },
  dotsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
    position: 'absolute',
    top: 15, // Moves dots to the top of the white card
  },
  loginLink: {
    color: '#E4423F',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Slightly translucent white card
    borderRadius: 25,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '95%', // Adjusted width
    height: '38%', // Slightly increased height
    alignSelf: 'center',
    position: 'absolute',
    bottom: '2.5%', // Moves the card higher
  },
  redTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(228, 66, 63, 0.3)', // Red tint overlay
  },

  title: {
    color: '#1A1A1A',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    padding: 10,
    textAlign: 'center',
  },
});

export default LandingPage5;
