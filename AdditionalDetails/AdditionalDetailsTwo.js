// AdditionalDetailsTwo.js

import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../src/Assets/Components/ProgressBar';
// If you use a shared step state, import your decrement function:
import { decrementStepCount } from '../Profile/profileStepsState';

export default function AdditionalDetailsTwo({ navigation, route }) {
  // The stepIndex from AdditionalDetailsOne
  const stepIndex = route.params?.stepIndex ?? null;

  // Options for body composition
  const options = [
    'Slim',
    'Athletic',
    'Curvy',
    'Plus Sized',
    'Few Extra Pounds',
  ];

  // Keep track of which one is selected
  const [selectedOption, setSelectedOption] = useState('');

  // Enable "Continue" only if an option is selected
  const isFormComplete = !!selectedOption;

  // Example progress if each page is ~12.5% of an 8-page flow
  // (This is page 2, so maybe 25%. Adjust as you like.)
  const progress = 25; 

  const handleContinue = () => {
    if (!isFormComplete) {
      Alert.alert(
        'Select an option',
        'Please select a body composition before continuing.'
      );
      return;
    }
    // Decrement from 7 → 6
    if (stepIndex !== null) {
      decrementStepCount(stepIndex);
    }
    // Navigate to the next page in your flow
    navigation.navigate('AdditionalDetailsThree', { stepIndex });
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
      <ProgressBar startProgress={80} endProgress={80} />

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Title & Subtitle */}
        <Text style={styles.title}>What is your body composition?</Text>
        <Text style={styles.subtitle}>
          Your body composition will be public.
        </Text>

        {/* List of Options */}
        {options.map((option, index) => {
          const isSelected = selectedOption === option;
          return (
            <Pressable
              key={index}
              onPress={() => setSelectedOption(option)}
              style={[
                styles.optionContainer,
                isSelected && styles.optionSelected,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Continue button */}
      <Pressable
        style={[
          styles.continueButton,
          { backgroundColor: isFormComplete ? '#E4423F' : '#ccc' },
        ]}
        onPress={handleContinue}
        disabled={!isFormComplete}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>
    </SafeAreaView>
  );
}

// -------------------- STYLES --------------------
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
  continueButton: {
    alignItems: 'center',
    borderRadius: 25,
    height: 60,
    justifyContent: 'center',
    marginBottom: 20,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionContainer: {
    borderColor: '#ccc',
    borderRadius: 25,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  optionText: {
    color: '#333',
    fontSize: 16,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#FFF',
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
