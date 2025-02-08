// AdditionalDetailsSeven.js

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
import { TextInput } from 'react-native-paper';
import ProgressBar from '../src/Assets/Components/ProgressBar';
import { decrementStepCount } from '../Profile/profileStepsState'; // Adjust path if needed

export default function AdditionalDetailsSeven({ navigation, route }) {
  // If coming from AdditionalDetailsSix:
  const stepIndex = route.params?.stepIndex ?? null;

  // Track user’s religion text
  const [religion, setReligion] = useState('');

  // The form is complete if religion has some text
  const isFormComplete = religion.trim().length > 0;

  // Example: if this is page 7 of 8 => ~87.5%. Adjust as you like.
  const progress = 87.5;

  const handleContinue = () => {
    if (!isFormComplete) {
      Alert.alert(
        'Missing Info',
        'Please enter your religious preference before continuing.'
      );
      return;
    }
    // Decrement step from 2 → 1, for example
    if (stepIndex !== null) {
      decrementStepCount(stepIndex);
    }
    // Navigate to the next (and final) page: AdditionalDetailsEight
    navigation.navigate('AdditionalDetailsEight', { stepIndex });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={28} color="red" />
      </TouchableOpacity>

      {/* Progress Bar */}
      <ProgressBar startProgress={90} endProgress={90} />

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <Text style={styles.title}>Do you practice a religion?</Text>
        <Text style={styles.subtitle}>
          Your religious preference will be public.
        </Text>

        {/* Single text input for religious preference */}
        <TextInput
          label="Religious Preference"
          mode="outlined"
          value={religion}
          onChangeText={setReligion}
          style={styles.input}
          outlineStyle={styles.textInputOutline}
          placeholder="e.g. Christianity, Buddhism, etc."
          placeholderTextColor="#999"
        />
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
  input: {
    marginBottom: 20,
  },
  subtitle: {
    color: 'gray',
    fontSize: 14,
    marginBottom: 20,
  },
  textInputOutline: {
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderColor: '#F9F9F9',
    borderRadius: 25,
    borderWidth: 0,
    flex: 1,
    height: 60,
    paddingHorizontal: 15,
  },
  title: {
    color: '#000',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
