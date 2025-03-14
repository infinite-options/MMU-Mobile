// AdditionalDetailsOne.js
import React, { useState } from 'react';
import {
  StatusBar,
  Platform,
  SafeAreaView,
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../src/Assets/Components/ProgressBar';

// Our shared state for step counts
import { decrementStepCount } from '../Profile/profileStepsState'; // Adjust path if needed

export default function AdditionalDetailsOne({ navigation, route }) {
  // If we’re in a multi-step flow, we have stepIndex from MyProfile
  const stepIndex = route.params?.stepIndex ?? null;

  // Form state
  const [formData, setFormData] = useState({
    nationality: '',
    ethnicity: '',
  });

  // Let user continue if at least one field is filled
  const isFormComplete =
    formData.nationality.trim().length > 0 &&
    formData.ethnicity.trim().length > 0;

  // Example progress: if each page is 1/8 => ~12.5%
  const progress = 85;

  // If user taps "Continue"
  const handleContinue = () => {
    if (!isFormComplete) {
      Alert.alert(
        'Incomplete',
        'Please fill in your nationality or ethnicity.'
      );
      return;
    }
    // 1) Decrement from 8 to 7
    if (stepIndex !== null) {
      decrementStepCount(stepIndex);
    }
    // 2) Navigate to next page
    navigation.navigate('AdditionalDetailsTwo', { stepIndex });
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

      {/* Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.content}>
          <Text style={styles.title}>What’s your origin?</Text>
          <Text style={styles.subtitle}>
            Both your ethnicity and nationality will be public.
          </Text>

          {/* Nationality */}
          <TextInput
            label="Nationality"
            mode="outlined"
            value={formData.nationality}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, nationality: text }))
            }
            style={styles.input}
            outlineStyle={styles.textInputOutline}
            placeholder="e.g. American"
            placeholderTextColor="#999"
          />

          {/* Ethnicity */}
          <TextInput
            label="Ethnicity"
            mode="outlined"
            value={formData.ethnicity}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, ethnicity: text }))
            }
            style={styles.input}
            outlineStyle={styles.textInputOutline}
            placeholder="e.g. Half-German Half-Irish"
            placeholderTextColor="#999"
          />
        </View>
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

// ----------------- STYLES -----------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    alignItems: 'stretch',
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
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'left',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'left',
    marginBottom: 20,
  },
  input: {
    marginBottom: 15, // Space between input fields
  },
  textInputOutline: {
    borderWidth: 0,
    borderColor: '#F9F9F9',
    borderRadius: 25,
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 60,
  },
  continueButton: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E4423F',
    borderRadius: 25,
    marginBottom: 20,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
