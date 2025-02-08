import React, { useState } from 'react';
import {
  StatusBar,
  Platform,
  SafeAreaView,
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../src/Assets/Components/ProgressBar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NameInput({ navigation }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  });

  const isFormComplete = formData.firstName.trim() !== '' && formData.lastName.trim() !== '';

  /**
   * Store the user's name (firstName, lastName) in AsyncStorage.
   * This will be retrieved later on the final step of profile completion.
   */
  const saveUserName = async (firstName, lastName) => {
    try {
      await AsyncStorage.setItem('user_first_name', firstName);
      await AsyncStorage.setItem('user_last_name', lastName);
      console.log('✅ First Name & Last Name stored successfully');
    } catch (error) {
      console.error('Error saving name', error);
    }
  };

  const handleContinue = async () => {
    if (isFormComplete) {
      // 1) Store the data for future usage
      await saveUserName(formData.firstName, formData.lastName);

      // 2) Navigate to next screen. We'll eventually call the API
      //    from the final screen once all data is collected.
      navigation.navigate('BirthdayInput');
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
      <ProgressBar startProgress={10} endProgress={20} style={styles.progressBar}/>

      {/* Title and Input Fields */}
      <View style={styles.content}>
        <Text style={styles.title}>What should we call you?</Text>
        <Text style={styles.subtitle}>Your full name will be public.</Text>

        <TextInput
          label="First Name"
          mode="outlined"
          value={formData.firstName}
          onChangeText={(text) => setFormData({ ...formData, firstName: text })}
          style={styles.input}
          outlineStyle={styles.textInputOutline}
        />

        <TextInput
          label="Last Name"
          mode="outlined"
          value={formData.lastName}
          onChangeText={(text) => setFormData({ ...formData, lastName: text })}
          style={styles.input}
          outlineStyle={styles.textInputOutline}
        />
      </View>

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
  input: {
    marginBottom: 15,
  },
  progressBar: {
    marginBottom: 30,
  },
  subtitle: {
    color: 'gray',
    fontSize: 14,
    marginBottom: 50,
    textAlign: 'left',
  },
  textInputOutline: {
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderColor: '#F9F9F9',
    borderRadius: 10,
    borderWidth: 0,
    flex: 1,
    height: 50,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  title: {
    color: '#000',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'left',
  },
});
