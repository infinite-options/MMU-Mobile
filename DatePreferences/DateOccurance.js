import React, { useState, useEffect } from "react";
import { SafeAreaView, Platform, StatusBar, View, Text, TouchableOpacity, Pressable, StyleSheet, ScrollView, Image, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import MaskedView from "@react-native-masked-view/masked-view";
import { Picker } from "@react-native-picker/picker";

export default function DateOccurance({ navigation }) {
  const route = useRoute();
  const [matchedUserId, setMatchedUserId] = useState(route.params?.matchedUserId || null);
  useEffect(() => {
    const initMatchedUserId = async () => {
      if (!matchedUserId) {
        const storedId = await AsyncStorage.getItem("matchedUserId");
        if (storedId) setMatchedUserId(storedId);
      } else {
        await AsyncStorage.setItem("matchedUserId", matchedUserId);
      }
    };
    initMatchedUserId();
  }, []);
  // Track selected day (index or null)
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);

  // Enhanced time state with formatting
  const [timeState, setTimeState] = useState({
    hour: 12,
    minute: 0,
    ampm: "AM",
  });

  // Days array with single letters for display
  const days = ["S", "M", "T", "W", "T", "F", "S"];

  // Full day names for storage and API
  const fullDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Add state for user info
  const [matchedUserName, setMatchedUserName] = useState("");
  const [matchedUserAvailability, setMatchedUserAvailability] = useState([]);

  // Add state for user images
  const [matchedUserImage, setMatchedUserImage] = useState(null);
  const [currentUserImage, setCurrentUserImage] = useState(null);

  // Add useEffect to load previously selected day and time
  useEffect(() => {
    const loadSavedDayAndTime = async () => {
      try {
        // Load previously saved day
        const savedDay = await AsyncStorage.getItem("user_date_day");
        if (savedDay) {
          // Find the index of the saved day in the fullDayNames array
          const dayIndex = fullDayNames.findIndex((day) => day === savedDay);
          if (dayIndex !== -1) {
            setSelectedDayIndex(dayIndex);
          }
        }

        // Load previously saved time
        const savedTime = await AsyncStorage.getItem("user_date_time");
        if (savedTime) {
          // Parse the time format (e.g., "7:30 PM")
          const timeParts = savedTime.split(" ");
          if (timeParts.length === 2) {
            const [timeString, periodStr] = timeParts;
            const [hourStr, minuteStr] = timeString.split(":");

            // Set time values
            const hour = parseInt(hourStr, 10);
            const minute = parseInt(minuteStr, 10);

            setTimeState({
              hour: hour,
              minute: minute,
              ampm: periodStr,
            });
          }
        }
      } catch (error) {
        console.error("Error loading saved day and time:", error);
      }
    };

    loadSavedDayAndTime();
  }, []);

  // Helper function to format time string for display and storage
  const formatTime = () => {
    const hour = timeState.hour || 12; // Default to 12 if hour is 0
    const minute = timeState.minute.toString().padStart(2, "0");
    return `${hour}:${minute} ${timeState.ampm}`;
  };

  // Fetch user info when component mounts
  useEffect(() => {
    const fetchMatchedUserInfo = async () => {
      try {
        if (matchedUserId) {
          const response = await fetch(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${matchedUserId}`);
          const data = await response.json();
          const userData = data.result[0];
          console.log("--- userData ---", userData);
          setMatchedUserName(userData?.user_first_name || "Your match");
          const rawAvailability = userData?.user_available_time;
          const availability = rawAvailability ? JSON.parse(rawAvailability).map((slot) => `${slot.day}, ${slot.start_time} to ${slot.end_time}`) : [];
          setMatchedUserAvailability(availability);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };
    fetchMatchedUserInfo();
  }, [matchedUserId]);

  // Fetch both users' images
  useEffect(() => {
    const fetchUserImages = async () => {
      try {
        // Get current user ID from storage
        const currentUserId = await AsyncStorage.getItem("user_uid");

        // Fetch current user's image
        if (currentUserId) {
          const currentUserResponse = await fetch(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${currentUserId}`);
          const currentUserData = await currentUserResponse.json();
          console.log("\n=== Current User Photo Debug (DateOccurance) ===");
          console.log("User ID:", currentUserId);
          console.log("Favorite photo:", currentUserData.result[0]?.user_favorite_photo);
          const currentUserPhotoUrls = currentUserData.result[0]?.user_photo_url ? JSON.parse(currentUserData.result[0].user_photo_url.replace(/\\"/g, '"')) || [] : [];
          console.log("Photo URLs array:", currentUserPhotoUrls);
          console.log("Photo URLs type:", typeof currentUserPhotoUrls);
          // Use favorite photo if available, otherwise use first photo
          const userPhotoToShow = currentUserData.result[0]?.user_favorite_photo?.toString() || (currentUserPhotoUrls.length > 0 ? currentUserPhotoUrls[0].toString() : null);
          console.log("Selected photo to show:", userPhotoToShow);
          console.log("===============================\n");
          setCurrentUserImage(userPhotoToShow);
        }

        // Fetch matched user's image
        if (matchedUserId) {
          const matchedUserResponse = await fetch(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${matchedUserId}`);
          const matchedUserData = await matchedUserResponse.json();
          console.log("\n=== Matched User Photo Debug (DateOccurance) ===");
          console.log("User ID:", matchedUserId);
          console.log("Favorite photo:", matchedUserData.result[0]?.user_favorite_photo);
          const matchedUserPhotoUrls = matchedUserData.result[0]?.user_photo_url ? JSON.parse(matchedUserData.result[0].user_photo_url.replace(/\\"/g, '"')) || [] : [];
          console.log("Photo URLs array:", matchedUserPhotoUrls);
          console.log("Photo URLs type:", typeof matchedUserPhotoUrls);
          // Use favorite photo if available, otherwise use first photo
          const matchedPhotoToShow = matchedUserData.result[0]?.user_favorite_photo?.toString() || (matchedUserPhotoUrls.length > 0 ? matchedUserPhotoUrls[0].toString() : null);
          console.log("Selected photo to show:", matchedPhotoToShow);
          console.log("===============================\n");
          setMatchedUserImage(matchedPhotoToShow);
        }
      } catch (error) {
        console.error("Error fetching user images:", error);
      }
    };

    fetchUserImages();
  }, [matchedUserId]);

  // Handler to pick a single day
  const handleDayPress = (index) => {
    setSelectedDayIndex(index);
  };

  // Handler to pick AM/PM
  const handleAmPmPress = (val) => {
    setTimeState((prev) => ({
      ...prev,
      ampm: val,
    }));
  };

  // Improved validation logic
  const isFormComplete = () => {
    // Day selected
    const hasDaySelected = selectedDayIndex !== null;

    // Valid time entered
    const hasValidTime = timeState.hour > 0 || timeState.minute > 0;

    // AM/PM selected
    const hasAmPmSelected = timeState.ampm !== null;

    return hasDaySelected && hasValidTime && hasAmPmSelected;
  };

  // Continue button behavior
  const handleContinue = async () => {
    if (isFormComplete()) {
      try {
        // Get the full day name instead of just the letter
        const dayLetter = days[selectedDayIndex];
        const dayFullName = fullDayNames[selectedDayIndex];
        const selectedTime = formatTime();

        await AsyncStorage.setItem("user_date_day", dayFullName);
        await AsyncStorage.setItem("user_date_time", selectedTime);

        console.log("Day stored:", dayFullName);
        console.log("Time stored:", selectedTime);
      } catch (error) {
        console.error("Error storing date info:", error);
      }
      // Navigate to the next screen with full day name
      navigation.navigate("DateLocation", {
        selectedDayIndex,
        selectedDay: fullDayNames[selectedDayIndex],
        startTime: formatTime(),
        amPm: timeState.ampm,
        matchedUserId: matchedUserId,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={require("../assets/icons/backarrow.png")} />
        </TouchableOpacity>

        {/* Hearts at top with masked view approach */}
        <View style={styles.heartsContainer}>
          {/* First heart using MaskedView */}
          <View style={styles.heartWrapper}>
            <MaskedView style={styles.maskedView} maskElement={<Image source={require("../assets/icons/Primaryheart.png")} style={styles.maskImage} resizeMode='contain' />}>
              <Image
                source={currentUserImage ? { uri: currentUserImage } : require("../src/Assets/Images/account.png")}
                style={styles.fullImage}
                defaultSource={require("../src/Assets/Images/account.png")}
              />
            </MaskedView>
            <Image source={require("../assets/icons/primaryheartoutline.png")} style={styles.heartOutline} resizeMode='contain' />
          </View>

          {/* Second heart using MaskedView */}
          <View style={[styles.heartWrapper, styles.secondHeartWrapper]}>
            <MaskedView style={styles.maskedView} maskElement={<Image source={require("../assets/icons/Secondaryheart.png")} style={styles.maskImage} resizeMode='contain' />}>
              <Image
                source={matchedUserImage ? { uri: matchedUserImage } : require("../src/Assets/Images/account.png")}
                style={styles.fullImage}
                defaultSource={require("../src/Assets/Images/account.png")}
              />
            </MaskedView>
            <Image source={require("../assets/icons/secondaryheartoutline.png")} style={styles.heartOutline} resizeMode='contain' />
          </View>
        </View>

        {/* Title and availability info */}
        <View style={styles.content}>
          <Text style={styles.title}>When will the date occur?</Text>

          <Text style={styles.subtitle}>{matchedUserName}'s available times are:</Text>
          <View style={{ marginLeft: 16, marginBottom: 20 }}>
            {matchedUserAvailability.length > 0 ? (
              matchedUserAvailability.map((time, index) => (
                <Text key={index} style={styles.bulletItem}>
                  • {time}
                </Text>
              ))
            ) : (
              <Text style={styles.bulletItem}>No availability times set yet</Text>
            )}
          </View>

          {/* Gray box for day/time selection */}
          <View style={styles.selectionContainer}>
            {/* Days row */}
            <View style={styles.daysRow}>
              {days.map((day, index) => {
                const isSelected = selectedDayIndex === index;
                return (
                  <TouchableOpacity key={index} style={[styles.dayCircle, isSelected && { backgroundColor: "#000" }]} onPress={() => handleDayPress(index)}>
                    <Text style={[styles.dayText, isSelected && { color: "#FFF" }]}>{day}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Start Time section matches DateAvailability.js */}
            <View style={styles.timeContainer}>
              <View style={styles.timeTitleRow}>
                <Text style={styles.timeLabel}>Start Time</Text>
              </View>
              <View style={styles.timePickerRow}>
                <View style={styles.pickerBox}>
                  <Picker
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                    selectedValue={timeState.hour}
                    onValueChange={(value) => {
                      setTimeState((prev) => ({
                        ...prev,
                        hour: value,
                      }));
                    }}
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const hour = i === 0 ? 12 : i;
                      return <Picker.Item key={i} label={hour.toString()} value={hour} />;
                    })}
                  </Picker>
                </View>
                <Text style={styles.timeSeparator}>:</Text>
                <View style={styles.pickerBox}>
                  <Picker
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                    selectedValue={timeState.minute}
                    onValueChange={(value) => {
                      setTimeState((prev) => ({
                        ...prev,
                        minute: value,
                      }));
                    }}
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <Picker.Item key={i} label={i.toString().padStart(2, "0")} value={i} />
                    ))}
                  </Picker>
                </View>
                <View style={styles.ampmButtonsVertical}>
                  <Pressable onPress={() => handleAmPmPress("AM")} style={[styles.ampmButtonStacked, timeState.ampm === "AM" && styles.ampmButtonStackedActive]}>
                    <View style={styles.radioButton}>{timeState.ampm === "AM" && <View style={styles.radioButtonSelected} />}</View>
                    <Text style={styles.ampmButtonStackedText}>AM</Text>
                  </Pressable>
                  <Pressable onPress={() => handleAmPmPress("PM")} style={[styles.ampmButtonStacked, timeState.ampm === "PM" && styles.ampmButtonStackedActive]}>
                    <View style={styles.radioButton}>{timeState.ampm === "PM" && <View style={styles.radioButtonSelected} />}</View>
                    <Text style={styles.ampmButtonStackedText}>PM</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <Pressable style={[styles.continueButton, { backgroundColor: isFormComplete() ? "#E4423F" : "#ccc" }]} onPress={handleContinue} disabled={!isFormComplete()}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>

      {/* Three progress dots (2nd one highlighted) */}
      <View style={styles.progressDotsContainer}>
        <View style={[styles.dot, { backgroundColor: "#ccc" }]} />
        <View style={[styles.dot, { backgroundColor: "#E4423F" }]} />
        <View style={[styles.dot, { backgroundColor: "#ccc" }]} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },

  // Back button
  backButton: {
    alignSelf: "flex-start",
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 30,
  },

  // Hearts
  heartsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  // Heart images using MaskedView
  heartWrapper: {
    width: 60,
    height: 60,
    position: "relative",
  },
  secondHeartWrapper: {
    marginLeft: -20,
  },
  maskedView: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  maskImage: {
    width: 60,
    height: 60,
  },
  fullImage: {
    width: 60,
    height: 60,
    resizeMode: "cover",
  },
  heartOutline: {
    position: "absolute",
    width: 60,
    height: 60,
    top: 0,
    left: 0,
  },

  // Content area
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
    marginBottom: 5,
  },
  bulletItem: {
    fontSize: 14,
    color: "#888",
    marginBottom: 5,
  },

  // Gray box container
  selectionContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 20,
  },

  // Days row
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: {
    color: "#000",
    fontWeight: "600",
  },

  // Time row
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 20,
    paddingHorizontal: 5,
  },
  timeLabel: {
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
    width: 90,
    marginRight: 5,
  },
  timePickerRow: {
    flexDirection: "row",
    alignItems: Platform.OS === "ios" ? "flex-start" : "center",
    justifyContent: "center",
    minHeight: Platform.OS === "ios" ? 120 : 40,
  },
  timeSeparator: {
    fontSize: 18,
    color: "#333",
    fontWeight: "500",
    marginHorizontal: 2,
    alignSelf: Platform.OS === "ios" ? "center" : "center",
    marginTop: Platform.OS === "ios" ? 40 : 0,
    minWidth: 8,
  },
  pickerBox: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    width: 90, // wider for two digits
    height: Platform.OS === "ios" ? 120 : 50,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
  },
  picker: {
    width: "100%",
    height: Platform.OS === "ios" ? 120 : 50,
    color: "#222",
    fontSize: 22,
    textAlign: "center",
  },
  pickerItem: {
    fontSize: 16,
    color: "#222",
    fontWeight: "600",
    textAlign: "center",
    height: 120,
  },
  ampmButtonsVertical: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: 45,
    marginLeft: 8,
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

  // Continue button
  continueButton: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
    marginBottom: 10,
  },
  continueButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  // Progress dots
  progressDotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },

  // Add missing styles if needed:
  timeContainer: {
    flexDirection: "column",
    marginBottom: 10,
  },
  timeTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
});
