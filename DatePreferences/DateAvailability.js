// DatePreferences.js

import React, { useState, useEffect } from "react";
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, StatusBar, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import ProgressBar from "../src/Assets/Components/ProgressBar"; // or your placeholder
import { decrementStepCount } from "../Profile/profileStepsState";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
// Days of the week for toggles
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

// Helper for turning [true, false, false, ...] into 'Mon-Fri' or similar
function summarizeDays(dayStates) {
  // Example naive approach: you can handle more advanced summarizing if you like.
  const activeDayNames = [];
  for (let i = 0; i < dayStates.length; i++) {
    if (dayStates[i]) {
      // We might map indexes to day names.
      // i=0 => Sunday, i=1 => Monday, etc.
      let name = "";
      switch (i) {
        case 0:
          name = "Sun";
          break;
        case 1:
          name = "Mon";
          break;
        case 2:
          name = "Tue";
          break;
        case 3:
          name = "Wed";
          break;
        case 4:
          name = "Thu";
          break;
        case 5:
          name = "Fri";
          break;
        case 6:
          name = "Sat";
          break;
        default:
          name = "";
      }
      activeDayNames.push(name);
    }
  }
  return activeDayNames.join(", ");
}

// Simple helper to show times in a nice format (e.g. "05:30 pm")
function formatTime({ hour, minute, ampm }) {
  // Convert if needed to standard 12-hour format
  const hh = hour.toString().padStart(2, "0");
  const mm = minute.toString().padStart(2, "0");
  return `${hh}:${mm} ${ampm}`;
}

// Helper function to validate time duration
function validateTimeDuration(startTime, endTime) {
  // Convert 12-hour format to 24-hour for comparison
  const convertTo24Hour = (time) => {
    let { hour, minute, ampm } = time;
    if (ampm === "AM" && hour === 12) hour = 0;
    if (ampm === "PM" && hour !== 12) hour += 12;
    return hour * 60 + minute; // Return total minutes from midnight
  };

  const startMinutes = convertTo24Hour(startTime);
  const endMinutes = convertTo24Hour(endTime);

  // Debug logging
  // console.log("Validating time duration:", {
  //   startTime,
  //   endTime,
  //   startMinutes,
  //   endMinutes,
  //   durationMinutes: endMinutes - startMinutes,
  // });

  // Check if end time is after start time
  if (endMinutes <= startMinutes) {
    // console.log("Validation failed: End time not after start time");
    return { valid: false, message: "End time must be after start time." };
  }

  // Calculate duration in minutes
  const durationMinutes = endMinutes - startMinutes;

  // Check if duration is at least 1 hour (60 minutes)
  if (durationMinutes < 60) {
    // console.log("Validation failed: Duration less than 60 minutes:", durationMinutes);
    return {
      valid: false,
      message: "The duration is less than 1 hour. Please ensure your availability window is at least 1 hour long.",
    };
  }

  // console.log("Validation passed: Duration is", durationMinutes, "minutes");
  return { valid: true };
}

const saveAvailabilityToAPI = async (availabilityData) => {
  try {
    const user_uid = await AsyncStorage.getItem("user_uid");
    const user_email_id = await AsyncStorage.getItem("user_email_id");
    const uploadData = new FormData();
    uploadData.append("user_uid", user_uid);
    uploadData.append("user_email_id", user_email_id);
    uploadData.append("user_available_time", JSON.stringify(availabilityData));

    if (!user_uid) {
      Alert.alert("Error", "User not logged in");
      return;
    }

    const response = await axios.put("https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo", uploadData, { headers: { "Content-Type": "multipart/form-data" } });

    if (response.status === 200) {
      console.log("Availability uploaded successfully:", response.data);
      Alert.alert("Success", "Availability uploaded successfully!");
    } else {
      console.error("Failed to upload date:", response);
      Alert.alert("Error", "Failed to upload date to the server.");
    }
  } catch (error) {
    Alert.alert("Error", error.message);
    console.error("API Error:", error);
  }
};

export default function DateAvailability() {
  const navigation = useNavigation();
  const route = useRoute();
  const { fromEditProfile } = route.params || {};

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

  // We only enable "Continue" if there's at least one *saved* window with valid settings
  const savedWindows = timeWindows.filter((tw) => !tw.isEditing);

  // Improved validation logic
  const hasValidWindow = savedWindows.some((window) => {
    // Check if at least one day is selected
    const hasDaySelected = window.days.some((day) => day === true);

    // Check if times are valid
    const hasValidStartTime = window.start.hour > 0 || window.start.minute > 0;
    const hasValidEndTime = window.end.hour > 0 || window.end.minute > 0;

    // Check if times are different
    const isDifferentTime = window.start.hour !== window.end.hour || window.start.minute !== window.end.minute || window.start.ampm !== window.end.ampm;

    return hasDaySelected && hasValidStartTime && hasValidEndTime && isDifferentTime;
  });

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
        start: { hour: 12, minute: 0, ampm: "AM" },
        end: { hour: 12, minute: 0, ampm: "PM" },
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

      if (subField === "hour") {
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
      newTime.ampm = newTime.ampm === "AM" ? "PM" : "AM";
      win[field] = newTime;
      newArr[windowIndex] = win;
      return newArr;
    });
  };

  const handleDeleteWindow = (windowIndex) => {
    // Confirm?
    Alert.alert("Delete this schedule?", "Are you sure you want to delete this availability range?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setTimeWindows((prev) => {
            const newArr = [...prev];
            newArr.splice(windowIndex, 1);
            return newArr;
          });
        },
      },
    ]);
  };

  const handleSaveWindow = (windowIndex) => {
    // Basic validation: at least one day selected, start != end, etc.
    const { days, start, end } = timeWindows[windowIndex];

    if (!days.includes(true)) {
      Alert.alert("Please select at least one day.");
      return;
    }

    // Validate time duration
    const timeValidation = validateTimeDuration(start, end);
    if (!timeValidation.valid) {
      Alert.alert("Invalid Time Duration", timeValidation.message, [{ text: "OK", style: "default" }]);
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
      Alert.alert("Please add and save at least one availability window.");
      return;
    }

    // Convert saved windows to API format
    const availabilityData = savedWindows.map((window) => ({
      day: summarizeDays(window.days),
      start_time: formatTime(window.start),
      end_time: formatTime(window.end),
    }));

    // Add debug log
    console.log("Sending availability data:", JSON.stringify(availabilityData, null, 2));

    try {
      await saveAvailabilityToAPI(availabilityData);

      if (fromEditProfile) {
        navigation.navigate("EditProfile", { fromDateAvailability: true }); // Pass parameter to refresh data
      } else {
        // Check if we came from MyProfile or from the setup flow
        const previousRoute = navigation.getState().routes[navigation.getState().index - 1];
        if (previousRoute && previousRoute.name === "MyProfile") {
          navigation.navigate("MyProfile", { refreshData: true });
        } else {
          decrementStepCount(stepIndex);
          navigation.navigate("TypeOfDate", { stepIndex });
        }
      }
    } catch (error) {
      // Error already handled in saveAvailabilityToAPI
    }
  };

  // Add useEffect to fetch existing availability
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const user_uid = await AsyncStorage.getItem("user_uid");
        const response = await axios.get(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${user_uid}`);

        const rawData = response.data.result[0]?.user_available_time;
        if (rawData) {
          const parsedData = JSON.parse(rawData).map((item) => ({
            days: convertDayStringToArray(item.day),
            start: parseTimeString(item.start_time),
            end: parseTimeString(item.end_time),
            isEditing: false,
          }));
          setTimeWindows(parsedData);
        }
      } catch (error) {
        console.error("Error fetching availability:", error);
      }
    };

    fetchAvailability();
  }, []);

  // Helper functions
  const convertDayStringToArray = (dayString) => {
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return Array(7)
      .fill(false)
      .map((_, i) => dayString.split(", ").some((day) => dayMap[day] === i));
  };

  const parseTimeString = (timeStr) => {
    const [timePart, ampm] = timeStr.split(" ");
    const [hourStr, minuteStr] = timePart.split(":");
    let hour = parseInt(hourStr, 10);

    // For 12-hour format picker, keep hours 1-12
    if (ampm === "AM" && hour === 12) hour = 12; // 12 AM stays as 12
    if (ampm === "PM" && hour === 12) hour = 12; // 12 PM stays as 12
    // For all other hours, keep them as-is for 12-hour picker

    return {
      hour: hour,
      minute: parseInt(minuteStr, 10),
      ampm: ampm.toUpperCase(),
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header (Back button) */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name='arrow-back' size={28} color='red' />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <ProgressBar startProgress={80} endProgress={80} />

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Title */}
        <Text style={styles.title}>When are you usually available?</Text>
        <Text style={styles.subtitle}>Help us pinpoint when both you and your match are free.</Text>

        {/* List of availability windows */}
        {timeWindows.map((tw, index) => {
          if (tw.isEditing) {
            // Show the expanded card
            return (
              <View key={index} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeaderText}>Select days & times</Text>
                  <TouchableOpacity onPress={() => handleExpandCollapse(index)}>
                    <Ionicons name='chevron-up-outline' size={20} color='#666' />
                  </TouchableOpacity>
                </View>

                {/* Days row */}
                <View style={styles.daysRow}>
                  {DAYS.map((dayLabel, dayIdx) => {
                    const active = tw.days[dayIdx];
                    return (
                      <TouchableOpacity key={dayIdx} onPress={() => handleToggleDay(index, dayIdx)} style={[styles.dayCircle, active && styles.dayCircleActive]}>
                        <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>{dayLabel}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Time pickers */}
                <View style={styles.timeSection}>
                  {/* Start Time - all on one line */}
                  <View style={styles.singleTimeRow}>
                    <Text style={styles.timeLabel}>Start Time</Text>
                    <View style={styles.timePickerContainer}>
                      <Picker
                        style={styles.hourPicker}
                        itemStyle={styles.pickerItem}
                        selectedValue={tw.start.hour}
                        onValueChange={(value) => {
                          // console.log("Hour picker changed - Start time:", value);
                          setTimeWindows((prev) => {
                            const newArr = [...prev];
                            newArr[index] = {
                              ...newArr[index],
                              start: { ...newArr[index].start, hour: value },
                            };
                            return newArr;
                          });
                        }}
                      >
                        {Array.from({ length: 12 }, (_, i) => {
                          const hour = i === 0 ? 12 : i;
                          return <Picker.Item key={i} label={hour.toString()} value={hour} />;
                        })}
                      </Picker>
                      <Text style={styles.timeSeparator}>:</Text>
                      <Picker
                        style={styles.minutePicker}
                        itemStyle={styles.pickerItem}
                        selectedValue={tw.start.minute}
                        onValueChange={(value) => {
                          // console.log("Minute picker changed - Start time:", value);
                          setTimeWindows((prev) => {
                            const newArr = [...prev];
                            newArr[index] = {
                              ...newArr[index],
                              start: { ...newArr[index].start, minute: value },
                            };
                            return newArr;
                          });
                        }}
                      >
                        {Array.from({ length: 60 }, (_, i) => (
                          <Picker.Item key={i} label={i.toString().padStart(2, "0")} value={i} />
                        ))}
                      </Picker>
                    </View>
                    <View style={styles.ampmButtonsVertical}>
                      <Pressable onPress={() => handleToggleAmPm(index, "start")} style={[styles.ampmButtonStacked, tw.start.ampm === "AM" && styles.ampmButtonStackedActive]}>
                        <View style={styles.radioButton}>{tw.start.ampm === "AM" && <View style={styles.radioButtonSelected} />}</View>
                        <Text style={styles.ampmButtonStackedText}>AM</Text>
                      </Pressable>
                      <Pressable onPress={() => handleToggleAmPm(index, "start")} style={[styles.ampmButtonStacked, tw.start.ampm === "PM" && styles.ampmButtonStackedActive]}>
                        <View style={styles.radioButton}>{tw.start.ampm === "PM" && <View style={styles.radioButtonSelected} />}</View>
                        <Text style={styles.ampmButtonStackedText}>PM</Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* End Time - all on one line */}
                  <View style={styles.singleTimeRow}>
                    <Text style={styles.timeLabel}>End Time</Text>
                    <View style={styles.timePickerContainer}>
                      <Picker
                        style={styles.hourPicker}
                        itemStyle={styles.pickerItem}
                        selectedValue={tw.end.hour}
                        onValueChange={(value) => {
                          // console.log("Hour picker changed - End time:", value);
                          setTimeWindows((prev) => {
                            const newArr = [...prev];
                            newArr[index] = {
                              ...newArr[index],
                              end: { ...newArr[index].end, hour: value },
                            };
                            return newArr;
                          });
                        }}
                      >
                        {Array.from({ length: 12 }, (_, i) => {
                          const hour = i === 0 ? 12 : i;
                          return <Picker.Item key={i} label={hour.toString()} value={hour} />;
                        })}
                      </Picker>
                      <Text style={styles.timeSeparator}>:</Text>
                      <Picker
                        style={styles.minutePicker}
                        itemStyle={styles.pickerItem}
                        selectedValue={tw.end.minute}
                        onValueChange={(value) => {
                          // console.log("Minute picker changed - End time:", value);
                          setTimeWindows((prev) => {
                            const newArr = [...prev];
                            newArr[index] = {
                              ...newArr[index],
                              end: { ...newArr[index].end, minute: value },
                            };
                            return newArr;
                          });
                        }}
                      >
                        {Array.from({ length: 60 }, (_, i) => (
                          <Picker.Item key={i} label={i.toString().padStart(2, "0")} value={i} />
                        ))}
                      </Picker>
                    </View>
                    <View style={styles.ampmButtonsVertical}>
                      <Pressable onPress={() => handleToggleAmPm(index, "end")} style={[styles.ampmButtonStacked, tw.end.ampm === "AM" && styles.ampmButtonStackedActive]}>
                        <View style={styles.radioButton}>{tw.end.ampm === "AM" && <View style={styles.radioButtonSelected} />}</View>
                        <Text style={styles.ampmButtonStackedText}>AM</Text>
                      </Pressable>
                      <Pressable onPress={() => handleToggleAmPm(index, "end")} style={[styles.ampmButtonStacked, tw.end.ampm === "PM" && styles.ampmButtonStackedActive]}>
                        <View style={styles.radioButton}>{tw.end.ampm === "PM" && <View style={styles.radioButtonSelected} />}</View>
                        <Text style={styles.ampmButtonStackedText}>PM</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* Action buttons: Delete / Save */}
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => handleDeleteWindow(index)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>

                  {/* Check if the current window has valid data */}
                  {(() => {
                    // Validate current window
                    const hasDaySelected = tw.days.some((day) => day === true);

                    // Fix hour validation - allow 12 (which represents 12 AM/PM)
                    const hasValidStartTime = tw.start.hour >= 1 && tw.start.hour <= 12;
                    const hasValidEndTime = tw.end.hour >= 1 && tw.end.hour <= 12;

                    // Use the same validation function for consistency
                    const timeValidation = validateTimeDuration(tw.start, tw.end);
                    const hasValidDuration = timeValidation.valid;

                    // Debug log to help identify the issue
                    // if (!hasValidDuration) {
                    //   console.log("Validation failed for duration:", {
                    //     start: tw.start,
                    //     end: tw.end,
                    //     timeValidation,
                    //   });
                    // }

                    const isValid = hasDaySelected && hasValidStartTime && hasValidEndTime && hasValidDuration;

                    return (
                      <TouchableOpacity
                        style={[styles.saveButton, isValid ? { backgroundColor: "#E4423F" } : { backgroundColor: "#f2f2f2" }]}
                        onPress={() => handleSaveWindow(index)}
                        disabled={!isValid}
                      >
                        <Text style={[styles.saveButtonText, isValid ? { color: "#FFF" } : { color: "#333" }]}>Save</Text>
                      </TouchableOpacity>
                    );
                  })()}
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
              <Pressable key={index} style={styles.collapsedCard} onPress={() => handleExpandCollapse(index)}>
                <Text style={styles.collapsedText}>
                  {daySummary || "No days selected"}, {startStr} to {endStr}
                </Text>
                <Ionicons name='chevron-down-outline' size={20} color='#666' style={{ marginLeft: "auto" }} />
              </Pressable>
            );
          }
        })}

        {/* Add button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddWindow}>
          <Ionicons name='add-outline' size={20} color='red' />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Continue button at bottom */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={[styles.continueButton, hasValidWindow ? { backgroundColor: "#E4423F" } : { backgroundColor: "#eee" }]} onPress={handleContinue} disabled={!hasValidWindow}>
          <Text style={[styles.continueButtonText, hasValidWindow ? { color: "#FFF" } : { color: "#bbb" }]}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// -------------------- STYLES --------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginHorizontal: 20,
    marginTop: 5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "gray",
    marginHorizontal: 20,
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#F9F9F9",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  cardHeaderText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#444",
  },
  daysRow: {
    flexDirection: "row",
    marginTop: 10,
    marginBottom: 10,
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  dayCircleActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  dayLabel: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  dayLabelActive: {
    color: "#FFF",
  },
  timeSection: {
    flexDirection: "column",
    marginTop: 20,
    marginBottom: 10,
  },
  singleTimeRow: {
    flexDirection: "row",
    alignItems: Platform.OS === "ios" ? "flex-start" : "center",
    marginBottom: 15,
    paddingHorizontal: 5,
    minHeight: Platform.OS === "ios" ? 120 : 40,
    justifyContent: "space-between",
  },
  timeLabel: {
    width: 70,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    marginRight: 8,
    alignSelf: Platform.OS === "ios" ? "center" : "center",
    marginTop: Platform.OS === "ios" ? 40 : 0,
  },
  timePickerContainer: {
    flexDirection: "row",
    alignItems: Platform.OS === "ios" ? "flex-start" : "center",
    flex: 1,
    marginRight: 8,
    minHeight: Platform.OS === "ios" ? 120 : 40,
    maxWidth: Platform.OS === "ios" ? 220 : 180,
  },
  timeSeparator: {
    fontSize: 18,
    color: "#333",
    fontWeight: "500",
    marginHorizontal: 4,
    alignSelf: Platform.OS === "ios" ? "center" : "center",
    marginTop: Platform.OS === "ios" ? 40 : 0,
    minWidth: 8,
  },
  pickerItem: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    height: 120,
  },
  ampmButtonsVertical: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: Platform.OS === "ios" ? "center" : "center",
    width: 50,
    alignSelf: Platform.OS === "ios" ? "center" : "center",
    marginTop: Platform.OS === "ios" ? 40 : 0,
  },
  ampmButtonStacked: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  ampmButtonStackedActive: {
    backgroundColor: "transparent",
  },
  radioButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#333",
    marginRight: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E4423F",
  },
  ampmButtonStackedText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  deleteText: {
    color: "red",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#f2f2f2", // Default disabled color
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  saveButtonText: {
    color: "#333", // Default disabled text color
    fontSize: 16,
    fontWeight: "500",
  },
  collapsedCard: {
    backgroundColor: "#F9F9F9",
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  collapsedText: {
    fontSize: 16,
    color: "#333",
    marginRight: 8,
    flex: 1,
  },
  addButton: {
    borderWidth: 1,
    borderColor: "red",
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 25,
    alignSelf: "flex-start",
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  addButtonText: {
    color: "red",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 20,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  continueButton: {
    backgroundColor: "#eee", // Default disabled color
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  continueButtonText: {
    color: "#bbb", // Default disabled text color
    fontSize: 18,
    fontWeight: "bold",
  },
  hourPicker: {
    flex: 1,
    height: Platform.OS === "ios" ? 120 : 40,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#ddd",
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderRightWidth: 0,
    minWidth: Platform.OS === "ios" ? 90 : 70,
  },
  minutePicker: {
    flex: 1,
    height: Platform.OS === "ios" ? 120 : 40,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#ddd",
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderLeftWidth: 0,
    minWidth: Platform.OS === "ios" ? 90 : 70,
  },
});
