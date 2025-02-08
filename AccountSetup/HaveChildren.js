import React, { useState } from 'react';
import {
  View,
  Text,
  StatusBar,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <-- Import AsyncStorage
import ProgressBar from '../src/Assets/Components/ProgressBar';

export default function HaveChildren({ navigation }) {
  // We only need numChildren on this screen
  const [numChildren, setNumChildren] = useState(0);

  // Increment/Decrement logic
  const handleIncrement = () => setNumChildren((prev) => prev + 1);
  const handleDecrement = () => setNumChildren((prev) => (prev > 0 ? prev - 1 : 0));

  // Check if form is complete (e.g., if user has chosen a number)
  const isFormComplete = numChildren !== null; // or numChildren >= 0

  // On Continue, store in AsyncStorage and move on
  const handleContinue = async () => {
    if (!isFormComplete) return;

    try {
      await AsyncStorage.setItem('user_kids', numChildren.toString());
      console.log('Number of children saved to AsyncStorage:', numChildren);
    } catch (error) {
      console.error('Error saving user_kids:', error);
    }

    // Navigate to the next screen
    navigation.navigate('AssignedSex');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Image source={require('../assets/icons/backarrow.png')} />
      </TouchableOpacity>

      {/* Progress Bar */}
      <ProgressBar startProgress={30} endProgress={30} style={styles.progressBar} />

      {/* Title and Subtitle */}
      <View style={styles.content}>
        <Text style={styles.title}>How many children do you have?</Text>
        <Text style={styles.subtitle}>The number of children you have will be public.</Text>

        {/* Number of Children Section */}
        <View style={styles.fieldWrapperFull}>
          <Text style={styles.fieldLabel}># of Children</Text>
          <View style={styles.field}>
            {/* Display the current number of children */}
            <Text style={styles.fieldValue}>{numChildren}</Text>

            {/* Decrement Button */}
            <TouchableOpacity onPress={handleDecrement} style={styles.fieldButton}>
              <Text style={styles.fieldButtonText}>−</Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Increment Button */}
            <TouchableOpacity onPress={handleIncrement} style={styles.fieldButton}>
              <Text style={styles.fieldButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Continue Button */}
      <Pressable
        style={[styles.continueButton, { backgroundColor: isFormComplete ? '#E4423F' : '#F5F5F5' }]}
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
  field: {
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'flex-end',
    paddingHorizontal: 15,
  },
  fieldButton: {
    paddingHorizontal: 10,
  },
  fieldButtonText: {
    color: '#888',
    fontSize: 20,
  },
  fieldLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 5,
  },
  fieldValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  fieldWrapperFull: {
    marginBottom: 20,
    width: '100%',
  },
  progressBar: {
    marginBottom: 30,
  },
  separator: {
    backgroundColor: '#ccc',
    height: '60%',
    width: 1,
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
