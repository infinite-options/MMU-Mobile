import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../src/Assets/Components/ProgressBar'; // Update this path as per your project structure

export default function VerifyPhoneNumber1({ navigation, route }) {
    const stepIndex = route.params?.stepIndex ?? null;
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleContinue = () => {
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/; // Validates phone number format (123) 456-7890
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert('Please enter a valid phone number.');
      return;
    }
    // Navigate to the next step or save the data
    navigation.navigate('VerifyPhoneNumber2', { stepIndex});
  };

  const formatPhoneNumber = (input) => {
    const cleaned = input.replace(/\D+/g, ''); // Remove non-numeric characters
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return input;
    const formatted = [
      match[1] && `(${match[1]}`,
      match[2] && `${match[2] ? ') ' + match[2] : ''}`,
      match[3] && `-${match[3]}`,
    ]
      .filter(Boolean)
      .join('');
    return formatted;
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
        <Text style={styles.title}>Add your phone number.</Text>
        <Text style={styles.subtitle}>
          We’ll send you a code to verify your phone number.
        </Text>

        {/* Phone Number Input */}
        <TextInput
          style={styles.input}
          placeholder="(___) ___-____"
          placeholderTextColor="#999"
          value={phoneNumber}
          keyboardType="number-pad"
          maxLength={14}
          onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
        />
      </View>

      {/* Continue Button */}
      <Pressable
        style={[
          styles.continueButton,
          { backgroundColor: phoneNumber.length === 14 ? 'red' : '#ccc' },
        ]}
        onPress={handleContinue}
        disabled={phoneNumber.length !== 14}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>
    </SafeAreaView>
  );
}

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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  continueButton: {
    alignItems: 'center',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    margin: 20,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderColor: '#ddd',
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    padding: 15,
  },
  subtitle: {
    color: 'gray',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'left',
  },
  title: {
    color: '#000',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'left',
  },
});
