import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const StartPage = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* App Title */}
      <Text style={styles.title}>meet me up</Text>

      {/* Get Started Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('LandingPage')}>
          <Text style={styles.buttonText}>Get Started!</Text>
        </TouchableOpacity>

        {/* Log In Link */}
        <Text style={styles.loginText}>
          Already have an account?{' '}
          <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            Log In
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomContainer: {
    position: 'absolute',
    bottom: 50, // Positions the container near the bottom
    alignItems: 'center',
    width: '100%',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 15,
    width: '100%',
  },
  buttonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#E4423F',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loginLink: {
    color: '#F5F5F5',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  loginText: {
    color: '#1A1A1A',
    fontSize: 16,
    marginTop: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
    position: 'absolute',
    textAlign: 'center',
    top: '35%', // Moves the text higher
  },
});

export default StartPage;
