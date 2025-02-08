// AdditionalDetailsFive.js

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
// Shared step logic
import { decrementStepCount } from '../Profile/profileStepsState'; // Adjust path if needed

export default function AdditionalDetailsFive({ navigation, route }) {
  // If we come from AdditionalDetailsFour:
  const stepIndex = route.params?.stepIndex ?? null;

  // Single-select options for smoking frequency
  const options = [
    'I don’t smoke',
    'I smoke socially',
    'I smoke casually',
    'I smoke regularly',
  ];

  // Keep track of user’s choice
  const [selectedOption, setSelectedOption] = useState('');

  // Only enable "Continue" if something is selected
  const isFormComplete = !!selectedOption;

  // Example progress for page 5 of 8 → 62.5%. Adjust as needed.
  const progress = 62.5; 

  const handleContinue = () => {
    if (!isFormComplete) {
      Alert.alert(
        'Select an option',
        'Please select how often you smoke before continuing.'
      );
      return;
    }
    // Decrement the step from 4 → 3, for example
    if (stepIndex !== null) {
      decrementStepCount(stepIndex);
    }
    // Go to next page (AdditionalDetailsSix)
    navigation.navigate('AdditionalDetailsSix', { stepIndex });
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
      <ProgressBar startProgress={85} endProgress={85} />

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <Text style={styles.title}>How often do you smoke?</Text>
        <Text style={styles.subtitle}>
          How often you smoke will be public.
        </Text>

        {/* List of single-select options */}
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

      {/* Continue Button */}
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
