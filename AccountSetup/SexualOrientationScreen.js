import React, { useState } from 'react';
import {
  SafeAreaView,
  Platform,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProgressBar from '../src/Assets/Components/ProgressBar';

export default function SexualOrientationScreen({ navigation }) {
  // Track which option is currently selected (if any)
  const [selectedOption, setSelectedOption] = useState(null);

  // The list of sexual orientation options
  const orientationOptions = [
    'Straight',
    'Gay',
    'Bisexual',
    'Asexual',
    'Pansexual',
    'Queer',
    'Questioning',
    'Other',
  ];

  const handleOptionPress = (option) => {
    setSelectedOption(option);
  };

  // The Continue button is enabled only if there's a selection
  const isFormComplete = selectedOption !== null;

  const handleContinue = async () => {
    if (isFormComplete) {
      try {
        // Store the selected orientation in AsyncStorage
        await AsyncStorage.setItem('user_sexuality', selectedOption);
        console.log('User sexuality stored:', selectedOption);
      } catch (error) {
        console.error('Error storing user_sexuality:', error);
      }

      // Move to the next screen
      navigation.navigate('OpenToScreen', { orientation: selectedOption });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView> 
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="red" />
      </TouchableOpacity>

      {/* Progress Bar (adjust progress as needed) */}
      <ProgressBar startProgress={40} endProgress={50} />

      {/* Title / Subtitle */}
      <View style={styles.content}>
      <Text style={styles.title}>What’s your sexual orientation?</Text>
      <Text style={styles.subtitle}>Your sexual orientation will be public.</Text>

      {/* Options list */}
      {orientationOptions.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.optionButton,
            {
              backgroundColor: selectedOption === option ? '#000' : '#FFF',
              // You can keep the border color #CCC for consistency
              borderColor: '#CCC',
            },
          ]}
          onPress={() => handleOptionPress(option)}
        >
          <Text style={{ color: selectedOption === option ? '#FFF' : '#000' }}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
      </View>
      
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

const styles = StyleSheet.create({
  // Overall container
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    // Align content to the top
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingHorizontal: 20,
    // Add top padding for Android
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  // Back button style
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 8,
    marginBottom: 20,
    marginTop: 30,
  },
  // Title
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
  // Each option button (pill-shaped)
  optionButton: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 30,
    marginVertical: 10,
    alignItems: 'center',
  },
  // Continue button styling
  continueButton: {
    justifyContent: 'flex-end',
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
