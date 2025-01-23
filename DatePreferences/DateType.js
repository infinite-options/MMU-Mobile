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

export default function DateType({ navigation }) {
  // Track which date type is selected
  const [selectedDateType, setSelectedDateType] = useState(null);

  // List of date type options
  const dateOptions = ['Lunch', 'Dinner', 'Coffee', 'Drinks', 'Movies', 'Other'];

  // When an option is pressed, update state
  const handleOptionPress = (option) => {
    setSelectedDateType(option);
  };

  // "Continue" enabled only if there's a selection
  const isFormComplete = selectedDateType !== null;

  const handleContinue = async () => {
    if (isFormComplete) {
      try {
        // Optional: store selection in AsyncStorage
        await AsyncStorage.setItem('user_date_type', selectedDateType);
        console.log('User date type stored:', selectedDateType);
      } catch (error) {
        console.error('Error storing user_date_type:', error);
      }
      // Navigate to the next screen
      navigation.navigate('DateOccurance', { dateType: selectedDateType });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color="red" />
        </TouchableOpacity>

        {/* Hearts at top (replace source with your actual images) */}
        <View style={styles.heartsContainer}>
          <Image
            source={require('../src/Assets/Images/match2.png')} 
            style={styles.heartImage}
          />
          <Image
            source={require('../src/Assets/Images/match1.png')} 
            style={[styles.heartImage, styles.heartOverlap]}
          />
        </View>

        {/* Title and subtitle */}
        <View style={styles.content}>
          <Text style={styles.title}>What type of date will it be?</Text>
          <Text style={styles.subtitle}>
            Gemma’s preferences are dinner, coffee, drinks, & movies.
          </Text>

          {/* Options list */}
          {dateOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                {
                  backgroundColor: selectedDateType === option ? '#000' : '#FFF',
                  borderColor: '#CCC',
                },
              ]}
              onPress={() => handleOptionPress(option)}
            >
              <Text
                style={{ color: selectedDateType === option ? '#FFF' : '#000' }}
              >
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

      {/* Three progress dots below the Continue button */}
      <View style={styles.progressDotsContainer}>
        {/* For illustration, we’ll highlight the middle dot as “active” */}
        <View style={[styles.dot, { backgroundColor: '#E4423F' }]} />
        <View style={[styles.dot, { backgroundColor: '#ccc' }]} />
        <View style={[styles.dot, { backgroundColor: '#ccc' }]} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Overall container
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
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
  // Hearts container
  heartsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  // Heart images
  heartImage: {
    width: 60,
    height: 60,
    resizeMode: 'cover',
    borderRadius: 30, // If you use a heart-shaped PNG, you can remove this
    borderWidth: 2,
    borderColor: '#FC6767',
  },
  // Slight overlap for the second heart
  heartOverlap: {
    marginLeft: -20,
  },
  // Body content
  content: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  // Title
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  // Subtitle
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  // Option buttons (pill shape)
  optionButton: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 30,
    marginVertical: 10,
    alignItems: 'center',
  },
  // Continue button
  continueButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    marginBottom: 10, // so there’s space for the dots
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Three dots container
  progressDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20, 
  },
  // Single dot
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
