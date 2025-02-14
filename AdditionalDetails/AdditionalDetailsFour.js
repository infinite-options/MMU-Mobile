// AdditionalDetailsFour.js

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

export default function AdditionalDetailsFour({ navigation, route }) {
  // If we’re continuing from AdditionalDetailsThree
  const stepIndex = route.params?.stepIndex ?? null;

  // We store a list of job titles. Each item is a string representing one job title.
  const [jobTitles, setJobTitles] = useState(['']); 

  // We consider the form complete if at least one non-empty title is present
  const hasAtLeastOneTitle = jobTitles.some(
    (title) => title.trim().length > 0
  );

  // Example progress: if this is page 4 of 8 => 50%
  const progress = 50;

  const handleAddJobTitle = () => {
    // Append a new empty string to the array
    setJobTitles((prev) => [...prev, '']);
  };

  // Update a specific job title in the array
  const handleTitleChange = (index, newValue) => {
    setJobTitles((prev) => {
      const newArr = [...prev];
      newArr[index] = newValue;
      return newArr;
    });
  };

  // If you want to allow removing titles, you can define a handleRemoveTitle function

  const handleContinue = () => {
    if (!hasAtLeastOneTitle) {
      Alert.alert(
        'Missing job title',
        'Please enter at least one job title before continuing.'
      );
      return;
    }

    // Decrement the step from 5→4 (for example)
    if (stepIndex !== null) {
      decrementStepCount(stepIndex);
    }
    // Navigate to next screen
    navigation.navigate('AdditionalDetailsFive', { stepIndex });
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
        <Text style={styles.title}>What do you do for work?</Text>
        <Text style={styles.subtitle}>
          Your job title(s) will be public.
        </Text>

        {/* Render job title inputs */}
        {jobTitles.map((title, index) => (
          <View key={index} style={styles.jobTitleWrapper}>
            <TextInput
              label="Job Title"
              mode="outlined"
              value={title}
              onChangeText={(text) => handleTitleChange(index, text)}
              style={styles.input}
              outlineStyle={styles.textInputOutline}
              placeholder="e.g. Software Engineer"
              placeholderTextColor="#999"
            />
          </View>
        ))}

        {/* Add Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddJobTitle}>
          <Ionicons name="add-outline" size={20} color="red" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Continue button */}
      <Pressable
        style={[
          styles.continueButton,
          { backgroundColor: hasAtLeastOneTitle ? '#E4423F' : '#ccc' },
        ]}
        onPress={handleContinue}
        disabled={!hasAtLeastOneTitle}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>
    </SafeAreaView>
  );
}

// -------------------- STYLES --------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    alignItems: 'stretch',
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
  jobTitleWrapper: {
    marginBottom: 15,
  },
  input: {
    marginBottom: 5,
  },
  textInputOutline: {
    borderWidth: 0,
    borderColor: '#F9F9F9',
    borderRadius: 25,
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 15,
    height: 60,
  },
  addButton: {
    borderWidth: 1,
    borderColor: 'red',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: 'red',
    fontSize: 16,
    marginLeft: 4,
  },
  continueButton: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginBottom: 20,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
