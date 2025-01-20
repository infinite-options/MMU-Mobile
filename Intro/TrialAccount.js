import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // React Native equivalent of useNavigate

const TrialAccount = () => {
  const navigation = useNavigation();

  const handleBackClick = () => {
    navigation.goBack(); // React Native's goBack instead of window.history.back()
  };

  const handleCreateProfile = () => {
    navigation.navigate('AccountSetup2Create'); // Navigate to the next screen
  };

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image
        source={require('../assets/background.png')}
        style={styles.backgroundImage}
      />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBackClick}>
          <Image
            source={require('../assets/arrow.png')}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>Trial Account</Text>
        <View style={{ width: 30 }} /> 
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.infoBox}>
          <Text style={styles.mainTitle}>Let's start</Text>
          <Text style={styles.bodyText}>
            by setting up a trial account so you can experience creating a date. If you'd like to continue setting up a real date, you can complete your full profile after the trial experience.
          </Text>
          <Text style={styles.captionText}>This is a preview date.</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={handleCreateProfile}>
        <Text style={styles.buttonText}>Start</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 10,
    position: 'absolute',
    top: 0,
    zIndex: 2,
  },
  arrowIcon: {
    width: 30,
    height: 30,
  },
  headerText: {
    color: '#1A1A1A',
    fontFamily: 'Lexend',
    fontSize: 22,
    fontWeight: 'bold',
  },
  contentContainer: {
    marginTop: 100,
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 378,
  },
  mainTitle: {
    fontFamily: 'Lexend',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#282828',
  },
  bodyText: {
    fontFamily: 'Lexend',
    fontSize: 14,
    marginTop: 10,
    color: '#282828',
  },
  captionText: {
    fontFamily: 'Lexend',
    fontSize: 14,
    marginTop: 10,
    color: '#282828',
  },
  startButton: {
    backgroundColor: '#E4423F',
    borderRadius: 20,
    width: 172,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontFamily: 'Lexend',
    fontSize: 18,
    color: '#FFFFFF',
  },
});

export default TrialAccount;
