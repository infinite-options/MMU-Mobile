import React, { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  Platform,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import ProgressBar from '../src/Assets/Components/ProgressBar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <-- Import AsyncStorage

export default function GenderIdentity({ navigation }) {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleContinue = async () => {
    if (selectedOption) {
      try {
        // Store the user's gender identity in AsyncStorage
        await AsyncStorage.setItem('user_gender_identity', selectedOption);
        console.log('Gender identity stored:', selectedOption);
      } catch (error) {
        console.error('Error storing user_gender_identity:', error);
      }

      // Navigate to the next screen
      navigation.navigate('SexualOrientationScreen', { selectedGender: selectedOption });
    }
  };

  const genderOptions = [
    'Man',
    'Woman',
    'Man (transgender)',
    'Female (transgender)',
    'Non-binary',
    'Genderqueer',
    'Other',
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="red" />
      </TouchableOpacity>

      {/* Progress Bar (adjust progress as needed) */}
      <ProgressBar startProgress={35} endProgress={40} />

      {/* Title / Subtitle */}
      <View style={styles.content}>
      <Text style={styles.title}>What gender do you identify as?</Text>
      <Text style={styles.subtitle}>Your gender will be public.</Text>

      {/* Options List */}
      {genderOptions.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.optionButton,
            {
              backgroundColor: selectedOption === option ? '#000' : '#FFF',
              borderColor: '#CCC',
            },
          ]}
          onPress={() => setSelectedOption(option)}
        >
          <Text style={{ color: selectedOption === option ? '#FFF' : '#000' }}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
</View>
      {/* Continue Button */}
      <Pressable
        style={[
          styles.continueButton,
          { backgroundColor: selectedOption ? '#E4423F' : '#ccc' },
        ]}
        onPress={handleContinue}
        disabled={!selectedOption}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        backgroundColor: '#FFF',
        justifyContent: 'flex-start', // Align content to the top
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
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 20,
  },
  optionButton: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 30,
    marginVertical: 10,
    alignItems: 'center',
  },
  continueButton: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E4423F",
    borderRadius: 30,
    marginBottom: 20,
  },
  continueButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
