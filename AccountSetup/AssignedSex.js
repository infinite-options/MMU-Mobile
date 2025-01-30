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
  Image
} from 'react-native';
import ProgressBar from '../src/Assets/Components/ProgressBar';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage'; // <-- Import AsyncStorage

export default function AssignedSex({ navigation }) {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleContinue = async () => {
    if (selectedOption) {
      try {
        // Store the user's assigned sex in AsyncStorage
        await AsyncStorage.setItem("user_gender", selectedOption);
        console.log("Sex assigned at birth stored:", selectedOption);
      } catch (error) {
        console.error("Error storing user_gender:", error);
      }

      // Navigate to the next screen
      navigation.navigate('GenderIdentity', { selectedSex: selectedOption });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Image source={require('../assets/icons/backarrow.png')} />
      </TouchableOpacity>

      {/* Progress Bar */}
      <ProgressBar startProgress={30} endProgress={35} style={styles.progressBar} />
      <View style={styles.content}>
      <Text style={styles.title}>What sex were you assigned?</Text>
      <Text style={styles.subtitle}>Your sex assigned at birth will NOT be public.</Text>

      {['Male', 'Female', 'Prefer not to say'].map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.optionButton,
            { backgroundColor: selectedOption === option ? '#000' : '#FFF',
              borderColor: 'rgba(26, 26, 26, 0.5)',
             },
            
          ]}
          onPress={() => setSelectedOption(option)}
        >
          <Text style={[styles.optionText, { color: selectedOption === option ? '#F5F5F5' : 'rgba(26, 26, 26, 0.5)' }]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
      </View>
      {/* Continue Button */}
      <Pressable
        style={[
          styles.continueButton,
          { backgroundColor: selectedOption ? "#E4423F" : "#F5F5F5" },
        ]}
        onPress={handleContinue}
        disabled={!selectedOption}
      >
        <Text style={[styles.continueButtonText, { color: selectedOption ? '#FFF' : 'rgba(26, 26, 26, 0.25)' }]}>Continue</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: '#FFF',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 30,
  },
  progressBar: {
    marginBottom: 30,
  },
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
  optionButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 30,
    marginVertical: 5,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: 500,
  },
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
