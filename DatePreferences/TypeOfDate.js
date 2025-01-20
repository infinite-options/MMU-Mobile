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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';

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

  // Save and return to profile
  const handleSaveAndReturn = () => {
    if (!isSaveEnabled()) return;

    // Gather the final chosen date types
    // (You might want to store these in backend or pass them somewhere)
    const chosenTypes = dateTypes
      .filter((item) => item.selected)
      .map((item) =>
        item.isOther && item.otherText
          ? `Other: ${item.otherText}`
          : item.label
      );

    // Decrement the step only once user completes
    decrementStepCount(stepIndex);

    // Navigate back to MyProfile (or wherever needed)
    navigation.navigate('MyProfile');
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
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'gray',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  optionSelected: {
    borderColor: '#000',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#666',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleFilled: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#000',
  },
  optionLabel: {
    fontSize: 16,
    color: '#333',
  },
  otherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // so the input can expand
  },
  otherInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F9F9F9',
    height: 40,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#FFF',
    padding: 20,
  },
  saveButton: {
    backgroundColor: 'red',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
