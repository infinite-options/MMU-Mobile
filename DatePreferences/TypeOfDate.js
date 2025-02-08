// TypeOfDate.js

import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Example function for decrementing step. Adapt or remove if you use a different approach.
import { decrementStepCount } from '../Profile/profileStepsState';

import ProgressBar from '../src/Assets/Components/ProgressBar';

export default function TypeOfDate() {
  const navigation = useNavigation();
  const route = useRoute();
  const stepIndex = route.params?.stepIndex ?? null;

  // Example progress for the second step
  const progress = 70;

  // We have multiple date types, including "Other"
  const [dateTypes, setDateTypes] = useState([
    { label: 'Lunch', selected: false, isOther: false, otherText: '' },
    { label: 'Dinner', selected: false, isOther: false, otherText: '' },
    { label: 'Coffee', selected: false, isOther: false, otherText: '' },
    { label: 'Drinks', selected: false, isOther: false, otherText: '' },
    { label: 'Movies', selected: false, isOther: false, otherText: '' },
    { label: 'Surprise Me', selected: false, isOther: false, otherText: '' },
    { label: 'Other', selected: false, isOther: true, otherText: '' },
  ]);

  // Toggle an option on/off
  const handleToggle = (index) => {
    setDateTypes((prev) => {
      const newArr = [...prev];
      newArr[index] = {
        ...newArr[index],
        selected: !newArr[index].selected,
      };
      return newArr;
    });
  };

  // Handle text input for the "Other" field
  const handleOtherTextChange = (index, text) => {
    setDateTypes((prev) => {
      const newArr = [...prev];
      newArr[index] = { ...newArr[index], otherText: text };
      return newArr;
    });
  };

  // Check if the "Save & Return" button should be enabled
  // We require at least one selected item. If "Other" is selected, must have text.
  const isSaveEnabled = () => {
    // Filter out selected items
    const selectedItems = dateTypes.filter((item) => item.selected);
    if (selectedItems.length === 0) return false;

    // If "Other" is among selected, ensure otherText is non-empty
    for (let item of selectedItems) {
      if (item.isOther) {
        if (!item.otherText.trim()) {
          return false;
        }
      }
    }
    return true;
  };

  const saveDateInterestsToAPI = async (chosenTypes) => {
    try {
      const user_uid = await AsyncStorage.getItem('user_uid');
      const user_email_id = await AsyncStorage.getItem('user_email_id');
      if (!user_uid) {
        Alert.alert('Error', 'User not logged in');
        return;
      }
      const uploadData = new FormData();
    uploadData.append('user_uid', user_uid);
    uploadData.append('user_email_id', user_email_id);
    uploadData.append('user_date_interests', JSON.stringify(chosenTypes));
    const response = await axios.put(
      'https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo',
      uploadData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
  );

    if (response.status === 200) {
            console.log('date interests uploaded successfully:', response.data);
            Alert.alert('Success', 'date interests  uploaded successfully!');
        } else {
            console.error('Failed to upload date interests:', response);
            Alert.alert('Error', 'Failed to upload date interests to the server.');
        }
    } catch (error) {
      Alert.alert('Error', error.message);
      console.error('API Error:', error);
      throw error; // Re-throw to handle in calling function
    }
  };

  // Modify handleSaveAndReturn to use the API call
  const handleSaveAndReturn = async () => {
    if (!isSaveEnabled()) return;

    const chosenTypes = dateTypes
      .filter((item) => item.selected)
      .map((item) =>
        item.isOther && item.otherText
          ? `Other: ${item.otherText}`
          : item.label
      );

    try {
      await saveDateInterestsToAPI(chosenTypes);
      decrementStepCount(stepIndex);
      navigation.navigate('MyProfile');
    } catch (error) {
      // Error already handled in saveDateInterestsToAPI
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="red" />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <ProgressBar startProgress={80} endProgress={90}/>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <Text style={styles.title}>What kind of dates do you enjoy?</Text>
        <Text style={styles.subtitle}>
          Your matches can only ask for dates for the ones you choose.
        </Text>

        {dateTypes.map((item, index) => {
          const isSelected = item.selected;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionContainer,
                isSelected && styles.optionSelected,
              ]}
              activeOpacity={0.8}
              // Tapping the entire row toggles selection
              onPress={() => handleToggle(index)}
            >
              {/* Radio Circle */}
              <View style={styles.radioCircle}>
                {isSelected && <View style={styles.radioCircleFilled} />}
              </View>

              {/* If 'Other' is selected, show text input */}
              {item.isOther && isSelected ? (
                <View style={styles.otherContainer}>
                  <Text style={[styles.optionLabel, { marginRight: 10 }]}>
                    Other:
                  </Text>
                  <TextInput
                    style={styles.otherInput}
                    placeholder="Please specify"
                    placeholderTextColor="#999"
                    value={item.otherText}
                    onChangeText={(text) =>
                      handleOtherTextChange(index, text)
                    }
                  />
                </View>
              ) : (
                !item.isOther && (
                  <Text style={styles.optionLabel}>{item.label}</Text>
                )
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            !isSaveEnabled() && { backgroundColor: '#eee' },
          ]}
          onPress={handleSaveAndReturn}
          disabled={!isSaveEnabled()}
        >
          <Text
            style={[
              styles.saveButtonText,
              !isSaveEnabled() && { color: '#aaa' },
            ]}
          >
            Save & Return to Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ---------------- Styles ----------------
const styles = StyleSheet.create({
  bottomContainer: {
    backgroundColor: '#FFF',
    bottom: 0,
    padding: 20,
    position: 'absolute',
    width: '100%',
  },
  container: {
    backgroundColor: '#FFF',
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  optionContainer: {
    alignItems: 'center',
    borderColor: '#ccc',
    borderRadius: 25,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 10,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  optionLabel: {
    color: '#333',
    fontSize: 16,
  },
  optionSelected: {
    borderColor: '#000',
  },
  otherContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1, // so the input can expand
  },
  otherInput: {
    backgroundColor: '#F9F9F9',
    borderColor: '#eee',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
  },
  radioCircle: {
    alignItems: 'center',
    borderColor: '#666',
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    marginRight: 12,
    width: 20,
  },
  radioCircleFilled: {
    backgroundColor: '#000',
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: 'red',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'gray',
    fontSize: 14,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    marginHorizontal: 20,
  },
});
