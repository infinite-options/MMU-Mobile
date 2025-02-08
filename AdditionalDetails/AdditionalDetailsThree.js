// AdditionalDetailsThree.js

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
// If you have a shared step state
import { decrementStepCount } from '../Profile/profileStepsState'; // Adjust path if needed

export default function AdditionalDetailsThree({ navigation, route }) {
  // The stepIndex from AdditionalDetailsTwo
  const stepIndex = route.params?.stepIndex ?? null;

  // Single-select options for education level
  const options = [
    'Did not finish high school',
    'High school diploma or GED',
    'Did not finish college',
    'Associate’s Degree',
    'Bachelor’s Degree',
    'Graduate Degree',
  ];

  // Keep track of which one the user selected
  const [selectedOption, setSelectedOption] = useState('');

  // We only enable "Continue" if an option has been chosen
  const isFormComplete = !!selectedOption;

  // Example: If each page is ~12.5% in an 8-page flow, 
  // this might be page 3 → ~37.5%. Adjust as needed:
  const progress = 37.5;  

  const handleContinue = () => {
    if (!isFormComplete) {
      Alert.alert(
        'Select an option',
        'Please select an education level before continuing.'
      );
      return;
    }
    // Decrement from 6 → 5, for example
    if (stepIndex !== null) {
      decrementStepCount(stepIndex);
    }
    // Then navigate to page 4 in your flow:
    navigation.navigate('AdditionalDetailsFour', { stepIndex });
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
      <ProgressBar startProgress={80} endProgress={85} />

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <Text style={styles.title}>What’s your education level?</Text>
        <Text style={styles.subtitle}>Your education level will be public.</Text>

        {/* List of round-cornered options */}
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
