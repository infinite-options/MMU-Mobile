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
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <-- Import AsyncStorage

export default function AssignedSex({ navigation }) {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleContinue = async () => {
    if (selectedOption) {
      try {
        // Store the user's assigned sex in AsyncStorage
        await AsyncStorage.setItem('user_gender', selectedOption);
        console.log('Sex assigned at birth stored:', selectedOption);
      } catch (error) {
        console.error('Error storing user_gender:', error);
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
          { backgroundColor: selectedOption ? '#E4423F' : '#F5F5F5' },
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
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 30,
  },
  container: {
    alignItems: 'stretch',
    backgroundColor: '#FFF',
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: '#E4423F',
    borderRadius: 30,
    height: 50,
    justifyContent: 'center',
    marginBottom: 50,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionButton: {
    alignItems: 'center',
    borderColor: '#CCC',
    borderRadius: 30,
    borderWidth: 1,
    marginVertical: 5,
    padding: 15,
  },
  optionText: {
    fontSize: 16,
    fontWeight: 500,
  },
  progressBar: {
    marginBottom: 30,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 50,
  },
  title: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
