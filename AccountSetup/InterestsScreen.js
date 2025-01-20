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
import ProgressBar from '../src/Assets/Components/ProgressBar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function InterestsScreen({ navigation }) {
  // The list of available interests
  const allInterests = [
    'Cooking / Baking',
    'Gaming',
    'Reading',
    'Health & Fitness',
    'Sports',
    'Travelling',
    'DIY',
    'Film & Movies',
    'Drawing',
    'Painting',
    'Music',
    'Dance',
    'Technology',
    'Cars / Vehicles',
    'Shopping',
    'Partying',
    'Animals & Wildlife',
    'Writing',
  ];

  // Keep track of the user’s selected interests
  const [selectedInterests, setSelectedInterests] = useState([]);

  // Toggle a single interest on/off
  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      // If it's already selected, remove it
      setSelectedInterests((prev) => prev.filter((item) => item !== interest));
    } else {
      // Otherwise, add it
      setSelectedInterests((prev) => [...prev, interest]);
    }
  };

  // Enable the Continue button only if at least one interest is selected
  const isFormComplete = selectedInterests.length > 0;

  const handleContinue = async () => {
    if (isFormComplete) {
      // Navigate to next screen, passing the chosen interests
      try {
        // Store the selected options array in AsyncStorage
        await AsyncStorage.setItem('user_general_interests', JSON.stringify(selectedInterests));
        console.log('User Interests stored:', selectedInterests);
      } catch (error) {
        console.error('Error storing user_general_interests:', error);
      }
      await  updateUserInfoServiceInDB();
      navigation.navigate('AddMediaScreen', { interests: selectedInterests });
     
    }
  };
  const handleTemp = async () => {
    if (isFormComplete) {
      // Navigate to next screen, passing the chosen interests
      try {
        // Store the selected options array in AsyncStorage
        await AsyncStorage.setItem('user_general_interests', JSON.stringify(selectedInterests));
        console.log('User Interests stored:', selectedInterests);
      } catch (error) {
        console.error('Error storing user_general_interests:', error);
      }
      // await updateUserInfoServiceInDB();
      navigation.navigate('MyProfile', { interests: selectedInterests });
     
    }
  };
  // Helper to store user_location_service in DB
  const updateUserInfoServiceInDB = async () => {
    // Build a FormData with user_location_service = True or False
    const url = "https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo";
    const formData = new FormData();
    const uid = await AsyncStorage.getItem('user_uid');
    const email = await AsyncStorage.getItem('user_email_id');
    const firstName = await AsyncStorage.getItem('user_first_name');
    const lastName = await AsyncStorage.getItem('user_last_name');  
    const age = await AsyncStorage.getItem('user_age');
    const gender = await AsyncStorage.getItem('user_gender');
    const height = await AsyncStorage.getItem('user_height_cm');
    const kids = await AsyncStorage.getItem('user_kids');
    const sexuality = await AsyncStorage.getItem('user_sexuality');
    const openTo = await AsyncStorage.getItem('user_open_to');
    const interests = await AsyncStorage.getItem('user_general_interests');
    formData.append('user_uid', uid); // Example user ID
    formData.append('user_email_id', email);
    formData.append('user_first_name', firstName);
    formData.append('user_last_name', lastName);
    formData.append('user_age', age);
    formData.append('user_gender', gender);
    formData.append('user_height', height);
    formData.append('user_kids', kids);
    formData.append('user_sexuality', sexuality);
    formData.append('user_open_to', openTo);
    formData.append('user_general_interests', interests);
    try {
      const response = await fetch(url, {
        method: "PUT",
        body: formData,
      });
      if (response.ok) {
        const result = await response.json();
        console.log("Response from server:", result);
      }
    } catch (error) {
      console.log("Error updating user data:", error);
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
      <ProgressBar startProgress={60} endProgress={70} />

      {/* Title / Subtitle */}
      <View style={styles.content}>
      <Text style={styles.title}>What are your interests?</Text>
      <Text style={styles.subtitle}>
        Help us better match you with others of similar interests.
      </Text>

      {/* Interests in a wrap layout */}
      <View style={styles.interestsContainer}>
        {allInterests.map((interest) => {
          const isSelected = selectedInterests.includes(interest);
          return (
            <TouchableOpacity
              key={interest}
              onPress={() => toggleInterest(interest)}
              style={[
                styles.interestButton,
                // We might give a border color for the unselected state
                // or a black border if selected:
                {
                  borderColor: isSelected ? '#000' : '#CCC',
                },
              ]}
            >
              {/* Circle icon on the left (for unselected, just a ring; for selected, a checkmark) */}
              <View
                style={[
                  styles.circle,
                  {
                    backgroundColor: isSelected ? '#000' : 'transparent',
                    borderColor: isSelected ? '#000' : '#CCC',
                  },
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                )}
              </View>
              {/* Interest text */}
              <Text
                style={{
                  color:  '#000',
                  marginLeft: 5,
                  fontSize:16,
                }}
              >
                {interest}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      </View>
    </ScrollView>
    {/* Continue Button */}
    <Pressable
        style={[
          styles.continueButton,
          { backgroundColor: isFormComplete ? '#E4423F' : '#ccc' },
        ]}
        onPress={handleTemp}
        disabled={!isFormComplete}
      >
        <Text style={styles.continueButtonText}>Temp Button to Summary</Text>
      </Pressable>
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
    justifyContent: 'flex-start', // Align content to the top
    alignItems: 'stretch',
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
  // Container for the interests, wrapping them onto multiple lines
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // wrap onto new lines
    justifyContent: 'flex-start',
    // Optionally adjust spacing or margin
  },
  // The pill-shaped interest button
  interestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 30,
    margin: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  // The small circle on the left
  circle: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Continue button
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
