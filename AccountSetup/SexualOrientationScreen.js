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
  Image,
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
        <Image source={require('../assets/icons/backarrow.png')} />
      </TouchableOpacity>

      {/* Progress Bar (adjust progress as needed) */}
      <ProgressBar startProgress={40} endProgress={50} style={styles.progressBar} />

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
              borderColor: 'rgba(26, 26, 26, 0.5)',
            },
          ]}
          onPress={() => handleOptionPress(option)}
        >
          <Text style={[styles.optionText, { color: selectedOption === option ? '#F5F5F5' : 'rgba(26, 26, 26, 0.5)' }]}>
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
          { backgroundColor: isFormComplete ? '#E4423F' : '#F5F5F5' },
        ]}
        onPress={handleContinue}
        disabled={!isFormComplete}
      >
        <Text style={[styles.continueButtonText, { color: isFormComplete ? '#FFF' : 'rgba(26, 26, 26, 0.25)' }]}>Continue</Text>
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
    paddingHorizontal: 25,
    // Add top padding for Android
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  // Back button style
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 30,
  },
  progressBar: {
    marginBottom: 30,
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
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 50,
  },
  // Each option button (pill-shaped)
  optionButton: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 30,
    marginVertical: 5,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: 500,
  },
  // Continue button styling
  continueButton: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E4423F",
    borderRadius: 30,
    marginBottom: 50,
  },
  continueButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
