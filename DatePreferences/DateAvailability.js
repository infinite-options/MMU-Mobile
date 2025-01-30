// DatePreferences.js

import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Pressable,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ProgressBar from '../src/Assets/Components/ProgressBar'; // or your placeholder
import { decrementStepCount } from '../Profile/profileStepsState';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
// Days of the week for toggles
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Helper for turning [true, false, false, ...] into 'Mon-Fri' or similar
function summarizeDays(dayStates) {
  // Example naive approach: you can handle more advanced summarizing if you like.
  const activeDayNames = [];
  for (let i = 0; i < dayStates.length; i++) {
    if (dayStates[i]) {
      // We might map indexes to day names. 
      // i=0 => Sunday, i=1 => Monday, etc.
      let name = '';
      switch (i) {
        case 0: name = 'Sun'; break;
        case 1: name = 'Mon'; break;
        case 2: name = 'Tue'; break;
        case 3: name = 'Wed'; break;
        case 4: name = 'Thu'; break;
        case 5: name = 'Fri'; break;
        case 6: name = 'Sat'; break;
        default: name = '';
      }
      activeDayNames.push(name);
    }
  }
  return activeDayNames.join(', ');
}

// Simple helper to show times in a nice format (e.g. "05:30 pm")
function formatTime({ hour, minute, ampm }) {
  // Convert if needed to standard 12-hour format
  const hh = hour.toString().padStart(2, '0');
  const mm = minute.toString().padStart(2, '0');
  return `${hh}:${mm} ${ampm}`;
}

const saveAvailabilityToAPI = async (availabilityData) => {
  try {
    const user_uid = await AsyncStorage.getItem('user_uid');
    const user_email_id = await AsyncStorage.getItem('user_email_id');
    const uploadData = new FormData();
    uploadData.append("user_uid", user_uid);
    uploadData.append("user_email_id", user_email_id);
    uploadData.append("user_available_time", JSON.stringify(availabilityData));
    
    if (!user_uid) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    const response = await axios.put(
      "https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo",
      uploadData,
      { headers: { "Content-Type": "multipart/form-data" } }
  );

    if (response.status === 200) {
            console.log("date uploaded successfully:", response.data);
            Alert.alert("Success", "date uploaded successfully!");
        } else {
            console.error("Failed to upload date:", response);
            Alert.alert("Error", "Failed to upload date to the server.");
        }
  } catch (error) {
    Alert.alert('Error', error.message);
    console.error('API Error:', error);
  }
};

export default function DateAvailability() {
  const navigation = useNavigation();
  const route = useRoute();

  // If you passed in how many date prefs are "required" from MyProfile:
  const stepIndex = route.params?.stepIndex ?? null;

  // We keep an array of time windows in local state. Each item can be:
  // {
  //   days: [true, false, ...], // 7 booleans for S, M, T, W, T, F, S
  //   start: { hour: 0-11, minute: 0-59, ampm: 'AM' or 'PM' },
  //   end: { hour: 0-11, minute: 0-59, ampm: 'AM' or 'PM' },
  //   isEditing: boolean
  // }
  const [timeWindows, setTimeWindows] = useState([]);

  // We only enable "Continue" if there's at least one *saved* window
  // (meaning not currently in edit mode with unsaved data)
  const savedWindows = timeWindows.filter((tw) => !tw.isEditing);

  // For demonstration, we show a progress bar at ~30% or so for your step
  // Or adapt it if this step is 1 out of 2 required date preferences, etc.
  // This is a local progress just for the UI mock. Adjust as needed.
  const progress = 50; // or something dynamic

  const handleAddWindow = () => {
    // Add a new blank window in "edit mode"
    setTimeWindows((prev) => [
      ...prev,
      {
        days: [false, false, false, false, false, false, false],
        start: { hour: 0, minute: 0, ampm: 'AM' },
        end: { hour: 0, minute: 0, ampm: 'PM' },
        isEditing: true,
      },
    ]);
  };

  const handleToggleDay = (windowIndex, dayIndex) => {
    setTimeWindows((prev) => {
      const newArr = [...prev];
      const win = { ...newArr[windowIndex] };
      const newDays = [...win.days];
      newDays[dayIndex] = !newDays[dayIndex];
      win.days = newDays;
      newArr[windowIndex] = win;
      return newArr;
    });
  };

  // For demonstration, we're using text inputs for hour/minute. 
  // In a real app, consider a time picker or numeric up/down.
  const handleTimeChange = (
    windowIndex,
    field, // 'start' or 'end'
    subField, // 'hour' or 'minute'
    value
  ) => {
    setTimeWindows((prev) => {
      const newArr = [...prev];
      const win = { ...newArr[windowIndex] };
      const newTime = { ...win[field] };

      // Convert to number, clamp 0-59 for minutes, 0-11 for hour if using 12h, etc.
      const numericValue = parseInt(value, 10) || 0;

      if (subField === 'hour') {
        // we clamp between 0 and 11 in 12h style
        newTime.hour = Math.max(0, Math.min(11, numericValue));
      } else {
        // minute
        newTime.minute = Math.max(0, Math.min(59, numericValue));
      }

      win[field] = newTime;
      newArr[windowIndex] = win;
      return newArr;
    });
  };

  const handleToggleAmPm = (windowIndex, field) => {
    setTimeWindows((prev) => {
      const newArr = [...prev];
      const win = { ...newArr[windowIndex] };
      const newTime = { ...win[field] };
      newTime.ampm = newTime.ampm === 'AM' ? 'PM' : 'AM';
      win[field] = newTime;
      newArr[windowIndex] = win;
      return newArr;
    });
  };

  const handleDeleteWindow = (windowIndex) => {
    // Confirm?
    Alert.alert(
      'Delete this schedule?',
      'Are you sure you want to delete this availability range?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setTimeWindows((prev) => {
              const newArr = [...prev];
              newArr.splice(windowIndex, 1);
              return newArr;
            });
          },
        },
      ]
    );
  };

  const handleSaveWindow = (windowIndex) => {
    // Basic validation: at least one day selected, start != end, etc.
    const { days, start, end } = timeWindows[windowIndex];

    if (!days.includes(true)) {
      Alert.alert('Please select at least one day.');
      return;
    }
    // Example check if times are the same
    if (
      start.hour === end.hour &&
      start.minute === end.minute &&
      start.ampm === end.ampm
    ) {
      Alert.alert('Start and end time cannot be the same.');
      return;
    }

    // Mark as saved
    setTimeWindows((prev) => {
      const newArr = [...prev];
      newArr[windowIndex] = { ...newArr[windowIndex], isEditing: false };
      return newArr;
    });
    
    // If you want to say "each saved window is one completion chunk," then:
    // Call onComplete if it still has incomplete tasks in MyProfile
    
  };

  const handleExpandCollapse = (windowIndex) => {
    // Toggle isEditing
    setTimeWindows((prev) => {
      const newArr = [...prev];
      const win = { ...newArr[windowIndex] };
      win.isEditing = !win.isEditing;
      newArr[windowIndex] = win;
      return newArr;
    });
  };

  const handleContinue = async () => {
    if (savedWindows.length === 0) {
      Alert.alert('Please add and save at least one availability window.');
      return;
    }

    // Convert saved windows to API format
    const availabilityData = savedWindows.map(window => ({
      day: summarizeDays(window.days),
      start_time: formatTime(window.start),
      end_time: formatTime(window.end)
    }));

    // Add debug log
    console.log('Sending availability data:', JSON.stringify(availabilityData, null, 2));

    try {
      await saveAvailabilityToAPI(availabilityData);
      decrementStepCount(stepIndex);
      navigation.navigate('TypeOfDate', { stepIndex });
    } catch (error) {
      // Error already handled in saveAvailabilityToAPI
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header (Back button) */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="red" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <ProgressBar startProgress={80} endProgress={80} />

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Title */}
        <Text style={styles.title}>When are you usually available?</Text>
        <Text style={styles.subtitle}>
          Help us pinpoint when both you and your match are free.
        </Text>

        {/* List of availability windows */}
        {timeWindows.map((tw, index) => {
          if (tw.isEditing) {
            // Show the expanded card
            return (
              <View key={index} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeaderText}>
                    Select days & times
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleExpandCollapse(index)}
                  >
                    <Ionicons
                      name="chevron-up-outline"
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>

                {/* Days row */}
                <View style={styles.daysRow}>
                  {DAYS.map((dayLabel, dayIdx) => {
                    const active = tw.days[dayIdx];
                    return (
                      <TouchableOpacity
                        key={dayIdx}
                        onPress={() => handleToggleDay(index, dayIdx)}
                        style={[
                          styles.dayCircle,
                          active && styles.dayCircleActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayLabel,
                            active && styles.dayLabelActive,
                          ]}
                        >
                          {dayLabel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Time pickers */}
                <View style={styles.timeRow}>
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeLabel}>Start Time</Text>
                    <View style={styles.timeInputRow}>
                      {/* Hour / minute */}
                      <TextInput
                        style={[styles.timeInput, { marginRight: 5 }]}
                        keyboardType="number-pad"
                        value={tw.start.hour.toString()}
                        onChangeText={(val) =>
                          handleTimeChange(index, 'start', 'hour', val)
                        }
                      />
                      <Text style={styles.colon}>:</Text>
                      <TextInput
                        style={[styles.timeInput, { marginLeft: 5 }]}
                        keyboardType="number-pad"
                        value={tw.start.minute.toString()}
                        onChangeText={(val) =>
                          handleTimeChange(index, 'start', 'minute', val)
                        }
                      />
                    </View>
                    {/* AM/PM toggle */}
                    <View style={styles.ampmRow}>
                      <Pressable
                        onPress={() => handleToggleAmPm(index, 'start')}
                        style={[
                          styles.ampmButton,
                          tw.start.ampm === 'AM' && styles.ampmButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.ampmButtonText,
                            tw.start.ampm === 'AM' &&
                              styles.ampmButtonTextActive,
                          ]}
                        >
                          AM
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleToggleAmPm(index, 'start')}
                        style={[
                          styles.ampmButton,
                          tw.start.ampm === 'PM' && styles.ampmButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.ampmButtonText,
                            tw.start.ampm === 'PM' &&
                              styles.ampmButtonTextActive,
                          ]}
                        >
                          PM
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.timeColumn}>
                    <Text style={styles.timeLabel}>End Time</Text>
                    <View style={styles.timeInputRow}>
                      {/* Hour / minute */}
                      <TextInput
                        style={[styles.timeInput, { marginRight: 5 }]}
                        keyboardType="number-pad"
                        value={tw.end.hour.toString()}
                        onChangeText={(val) =>
                          handleTimeChange(index, 'end', 'hour', val)
                        }
                      />
                      <Text style={styles.colon}>:</Text>
                      <TextInput
                        style={[styles.timeInput, { marginLeft: 5 }]}
                        keyboardType="number-pad"
                        value={tw.end.minute.toString()}
                        onChangeText={(val) =>
                          handleTimeChange(index, 'end', 'minute', val)
                        }
                      />
                    </View>
                    {/* AM/PM toggle */}
                    <View style={styles.ampmRow}>
                      <Pressable
                        onPress={() => handleToggleAmPm(index, 'end')}
                        style={[
                          styles.ampmButton,
                          tw.end.ampm === 'AM' && styles.ampmButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.ampmButtonText,
                            tw.end.ampm === 'AM' &&
                              styles.ampmButtonTextActive,
                          ]}
                        >
                          AM
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleToggleAmPm(index, 'end')}
                        style={[
                          styles.ampmButton,
                          tw.end.ampm === 'PM' && styles.ampmButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.ampmButtonText,
                            tw.end.ampm === 'PM' &&
                              styles.ampmButtonTextActive,
                          ]}
                        >
                          PM
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* Action buttons: Delete / Save */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => handleDeleteWindow(index)}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => handleSaveWindow(index)}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          } else {
            // Collapsed card
            // Summarize days + times in a single line
            const daySummary = summarizeDays(tw.days);
            const startStr = formatTime(tw.start);
            const endStr = formatTime(tw.end);
            return (
              <Pressable
                key={index}
                style={styles.collapsedCard}
                onPress={() => handleExpandCollapse(index)}
              >
                <Text style={styles.collapsedText}>
                  {daySummary || 'No days selected'}, {startStr} to {endStr}
                </Text>
                <Ionicons
                  name="chevron-down-outline"
                  size={20}
                  color="#666"
                  style={{ marginLeft: 'auto' }}
                />
              </Pressable>
            );
          }
        })}

        {/* Add button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddWindow}
        >
          <Ionicons name="add-outline" size={20} color="red" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Continue button at bottom */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            savedWindows.length === 0 && { backgroundColor: '#eee' },
          ]}
          onPress={handleContinue}
          disabled={savedWindows.length === 0}
        >
          <Text
            style={[
              styles.continueButtonText,
              savedWindows.length === 0 && { color: '#bbb' },
            ]}
          >
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// -------------------- STYLES --------------------
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
    marginTop: 15,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginHorizontal: 20,
    marginTop: 5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'gray',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#F9F9F9',
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  daysRow: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  dayLabel: {
    fontSize: 12,
    color: '#333',
  },
  dayLabelActive: {
    color: '#FFF',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  timeColumn: {
    flex: 1,
    marginRight: 15,
  },
  timeLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 5,
    width: 50,
    textAlign: 'center',
    backgroundColor: '#FFF',
  },
  colon: {
    fontSize: 20,
    color: '#333',
  },
  ampmRow: {
    flexDirection: 'row',
    marginTop: 5,
  },
  ampmButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  ampmButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  ampmButtonText: {
    color: '#333',
  },
  ampmButtonTextActive: {
    color: '#FFF',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  deleteText: {
    color: 'red',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: 'red',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  collapsedCard: {
    backgroundColor: '#F9F9F9',
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  collapsedText: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  addButton: {
    borderWidth: 1,
    borderColor: 'red',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'red',
    fontSize: 16,
    marginLeft: 4,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
    backgroundColor: '#FFF',
  },
  continueButton: {
    backgroundColor: 'red',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

