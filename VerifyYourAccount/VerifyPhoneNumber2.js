import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Pressable,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../src/Assets/Components/ProgressBar'; // Update the path as per your project structure
import { decrementStepCount } from '../Profile/profileStepsState'; // Adjust path if needed
export default function VerifyPhoneNumber2({ navigation, route }) {
    const stepIndex = route.params?.stepIndex ?? null;
  const [code, setCode] = useState(['', '', '', '']); // For 4-digit input
  const inputs = useRef([]);

  const handleChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;

    setCode(newCode);

    // Move to the next input automatically
    if (text && index < 3) {
      inputs.current[index + 1].focus();
    }

    // If backspacing and the input is empty, move to the previous input
    if (!text && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleContinue = () => {
    const enteredCode = code.join('');
    if (enteredCode.length !== 4) {
      Alert.alert('Please enter a 4-digit code.');
      return;
    }
    if (stepIndex !== null) {
          decrementStepCount(stepIndex);
        }
    // Add your verification logic here
    navigation.navigate('AddDriversLicense', {stepIndex}); // Navigate to the next step
  };

  const handleResendCode = () => {
    // Logic to resend the code
    Alert.alert('Code resent successfully!');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={28} color="red" />
      </TouchableOpacity>

      {/* Progress Bar */}
      <ProgressBar startProgress={90} endProgress={90} />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Please verify your code.</Text>
        <Text style={styles.subtitle}>
          Please enter the 4-digit code we sent to your device.
        </Text>

        {/* Code Input */}
        <View style={styles.codeInputContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              style={styles.codeInput}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              keyboardType="number-pad"
              maxLength={1}
              ref={(input) => (inputs.current[index] = input)}
            />
          ))}
        </View>
      </View>

      {/* Continue Button */}
      <Pressable
        style={[
          styles.continueButton,
          { backgroundColor: code.join('').length === 4 ? 'red' : '#ccc' },
        ]}
        onPress={handleContinue}
        disabled={code.join('').length !== 4}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>

      {/* Resend Code */}
      <TouchableOpacity onPress={handleResendCode}>
        <Text style={styles.resendText}>
          Didn’t receive a code?{' '}
          <Text style={styles.resendTextLink}>Resend code</Text>
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 8,
    marginBottom: 20,
    marginTop: 30,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 20,
    textAlign: 'center',
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 30,
  },
  codeInput: {
    width: 50,
    height: 50,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 18,
    textAlign: 'center',
  },
  continueButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
  resendTextLink: {
    color: 'red',
    fontWeight: 'bold',
  },
});
