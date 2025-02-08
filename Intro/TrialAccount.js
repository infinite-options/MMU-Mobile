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
  arrowIcon: {
    height: 30,
    width: 30,
  },
  backgroundImage: {
    height: '100%',
    left: 0,
    position: 'absolute',
    resizeMode: 'cover',
    top: 0,
    width: '100%',
  },
  bodyText: {
    color: '#282828',
    fontFamily: 'Lexend',
    fontSize: 14,
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'Lexend',
    fontSize: 18,
  },
  captionText: {
    color: '#282828',
    fontFamily: 'Lexend',
    fontSize: 14,
    marginTop: 10,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  contentContainer: {
    alignItems: 'center',
    marginTop: 100,
    padding: 20,
    width: '100%',
  },
  headerText: {
    color: '#1A1A1A',
    fontFamily: 'Lexend',
    fontSize: 22,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    maxWidth: 378,
    padding: 20,
    width: '90%',
  },
  mainTitle: {
    color: '#282828',
    fontFamily: 'Lexend',
    fontSize: 24,
    fontWeight: 'bold',
  },
  startButton: {
    alignItems: 'center',
    backgroundColor: '#E4423F',
    borderRadius: 20,
    height: 42,
    justifyContent: 'center',
    marginTop: 20,
    width: 172,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 2,
  },
});

export default TrialAccount;
