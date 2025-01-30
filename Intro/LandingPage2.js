import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const LandingPage2 = () => {
  const navigation = useNavigation();

  return (
    <ImageBackground source={require('../assets/image2.png')} style={styles.backgroundImage}>
      {/* Red Tint Overlay */}
      <View style={styles.redTint} />

      {/* White Card Overlay */}
      <View style={styles.overlay}>
        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>

          <View style={styles.dot} />
          <View style={styles.activeDot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Remove Awkwardness</Text>

        {/* Description */}
        <Text style={styles.description}>
          Asking for the first date shouldn’t be awkward.{'\n'}
          MeetMeUp eases up the process with{'\n'}
          automated prompting.
        </Text>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={() => navigation.navigate('LandingPage3')}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <TouchableOpacity onPress={() => navigation.navigate('AccountSetup2Create')}>
          <Text style={styles.signUpText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

export const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  redTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(228, 66, 63, 0.3)', // Red tint overlay
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
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    padding: 10,
    top: 15, // Moves dots to the top of the white card
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#E4423F',
    width: 16, // Elongated active dot
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 10,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 50,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  signUpText: {
    fontSize: 18,
    textDecorationLine: 'underline',
    color: '#1A1A1A',
  },
});

export default LandingPage2;
