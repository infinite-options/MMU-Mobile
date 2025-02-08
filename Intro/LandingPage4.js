import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const LandingPage4 = () => {
  const navigation = useNavigation();

  return (
    <ImageBackground source={require('../assets/image5.png')} style={styles.backgroundImage}>
      {/* Red Tint Overlay */}
      <View style={styles.redTint} />

      {/* White Card Overlay */}
      <View style={styles.overlay}>
        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.activeDot} />
          <View style={styles.dot} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Never Be Stood Up</Text>

        {/* Description */}
        <Text style={styles.description}>
          We keep track of each person’s attendance{'\n'}
          rating on their dates through generated{'\n'}
          codes exchanged by both parties.
        </Text>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={() => navigation.navigate('LandingPage5')}>
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

const styles = StyleSheet.create({
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
    textAlign: 'center'
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
    top: 15, // Moves dots to the top
  },
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Slightly translucent white card
    borderRadius: 25,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '95%', // Adjusted width
    height: '38%', // Increased height
    alignSelf: 'center',
    position: 'absolute',
    bottom: '2.5%', // Moves the card higher
  },
  redTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(228, 66, 63, 0.3)', // Red tint overlay
  },
  signUpText: {
    color: '#1A1A1A',
    fontSize: 18,
    textDecorationLine: 'underline',
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

export default LandingPage4;
