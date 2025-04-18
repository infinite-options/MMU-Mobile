import React, { useState, useEffect } from "react";
import { SafeAreaView, Platform, StatusBar, View, Text, TouchableOpacity, Pressable, StyleSheet, ScrollView, TextInput, Alert, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import CustomSingleSlider from "../src/components/CustomSingleSlider";
import { __DEV_MODE__ } from "../config";

const Preferences = () => {
  const [maxDistance, setMaxDistance] = useState(80);
  const [ageRange, setAgeRange] = useState([18, 99]);
  const [heightRange, setHeightRange] = useState([122, 213]);
  const [numChildren, setNumChildren] = useState(3);

  // Body types selected with a checkbox-like circle
  const [bodyType, setBodyType] = useState(["Slim", "Athletic", "Curvy"]);

  // Smoking/Drinking toggles become black pills when selected
  const [smokingHabit, setSmokingHabit] = useState("No");
  const [drinkingHabit, setDrinkingHabit] = useState("No");

  const [religiousPreference, setReligiousPreference] = useState("Any");
  const navigation = useNavigation();

  // Load saved preferences when component mounts
  useEffect(() => {
    const loadSavedPreferences = async () => {
      console.log("------------------- IN PREFERENCES ----------------");
      try {
        const uid = await AsyncStorage.getItem("user_uid");
        if (!uid) return;

        // Fetch user preferences from the API
        const response = await axios.get(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${uid}`);

        const preferences = response.data.result[0];
        // console.log("Preferences: ", preferences);
        // console.log("Height Preference: ", preferences.user_prefer_height_min);

        // Update state with saved preferences if they exist
        if (preferences.user_prefer_distance) {
          setMaxDistance(parseInt(preferences.user_prefer_distance));
        }
        if (preferences.user_prefer_age_min && preferences.user_prefer_age_max) {
          setAgeRange([parseInt(preferences.user_prefer_age_min), parseInt(preferences.user_prefer_age_max)]);
        }
        // if (preferences.user_prefer_height_min && preferences.user_prefer_height_max) {
        //   setHeightRange([parseInt(preferences.user_prefer_height_min), parseInt(preferences.user_prefer_height_max)]);
        // }
        if (preferences.user_prefer_height_min) {
          setHeightRange([parseInt(preferences.user_prefer_height_min), 210]);
        }
        if (preferences.user_prefer_kids) {
          setNumChildren(parseInt(preferences.user_prefer_kids));
        }
        if (preferences.user_prefer_body_type) {
          setBodyType(JSON.parse(preferences.user_prefer_body_type));
        }
        if (preferences.user_prefer_smoking) {
          setSmokingHabit(preferences.user_prefer_smoking);
        }
        if (preferences.user_prefer_drinking) {
          setDrinkingHabit(preferences.user_prefer_drinking);
        }
        if (preferences.user_prefer_religion) {
          setReligiousPreference(preferences.user_prefer_religion);
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    };

    loadSavedPreferences();
  }, []);

  const handleAgeValueChange = (values) => setAgeRange(values);
  const handleHeightValueChange = (values) => setHeightRange(values);

  const screenWidth = Dimensions.get("window").width;

  const toggleSelection = (category, value) => {
    switch (category) {
      case "BodyType":
        setBodyType((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
        break;
      case "Smoking":
        setSmokingHabit(value);
        break;
      case "Drinking":
        setDrinkingHabit(value);
        break;
      default:
        break;
    }
  };

  const storePreferencesLocally = async () => {
    try {
      await AsyncStorage.setItem("user_prefer_body_type", JSON.stringify(bodyType));
      await AsyncStorage.setItem("user_prefer_smoking", smokingHabit);
      await AsyncStorage.setItem("user_prefer_drinking", drinkingHabit);
      await AsyncStorage.setItem("user_prefer_religion", religiousPreference);
    } catch (error) {
      console.error("Error storing preferences:", error);
    }
  };

  const handleFindMatch = async () => {
    try {
      const uid = await AsyncStorage.getItem("user_uid");
      const email = await AsyncStorage.getItem("user_email_id");

      if (!uid || !email) {
        console.error("Missing user credentials");
        return;
      }

      // Example FormData
      const formData = new FormData();
      formData.append("user_uid", uid);
      formData.append("user_email_id", email);
      formData.append("user_prefer_distance", maxDistance.toString());
      formData.append("user_prefer_age_min", ageRange[0].toString());
      formData.append("user_prefer_age_max", ageRange[1].toString());
      formData.append("user_prefer_height_min", heightRange[0].toString());
      formData.append("user_prefer_kids", numChildren.toString());
      // formData.append("user_prefer_gender", "Female");

      // Store preferences locally first
      await storePreferencesLocally();

      console.log("Form data for PUT Call", formData);
      const response = await axios.put("https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // console.log("Put response", response);

      // After updating preferences, check if there are matches available
      try {
        console.log(`Checking matches: https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/matches/${uid}`);
        const matchesResponse = await axios.get(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/matches/${uid}`);

        // Check if there are no matches
        if (matchesResponse.data["message"].startsWith("No matches found")) {
          Alert.alert("No matches found", "Please adjust your preferences.", [{ text: "OK" }]);
          // Stay on the preferences page (no navigation)
        } else {
          // Navigate to MatchProfileDisplay since matches were found
          console.log("Number of matches:", matchesResponse.data.result.length);
          navigation.navigate("MatchProfileDisplay");
        }
      } catch (matchError) {
        console.error("Error fetching matches:", matchError);
        Alert.alert("Error", "Unable to retrieve matches. Please adjust your preferences and try again.", [{ text: "OK" }]);
      }
    } catch (error) {
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Alert.alert("Error", "Unable to update preferences. Please try again later.", [{ text: "OK" }]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Row with arrow on left and gear on right */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name='arrow-back' size={28} color='#E4423F' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Preferences</Text>
        {__DEV_MODE__ && (
          <TouchableOpacity style={styles.headerButton} onPress={() => console.log("Settings clicked!")}>
            <Ionicons name='settings-outline' size={24} color='#E4423F' />
          </TouchableOpacity>
        )}
        {!__DEV_MODE__ && <View style={{ width: 40, height: 40 }} />}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.content}>
          {/* Distance */}
          <View style={styles.rowLabelContainer}>
            <Text style={styles.label}>Maximum distance from you (km)</Text>
            <Text style={styles.valueText}>{maxDistance} km</Text>
          </View>
          <View style={styles.sliderContainer}>
            <CustomSingleSlider
              value={maxDistance}
              onValueChange={setMaxDistance}
              minimumValue={1}
              maximumValue={300}
              step={1}
              sliderLength={screenWidth * 0.9}
              thumbStyle={styles.sliderThumb}
              minimumTrackTintColor='#E4423F'
              maximumTrackTintColor='#E5E5E5'
              trackStyle={styles.trackStyle}
            />
          </View>

          {/* Age Range */}
          <View style={styles.rowLabelContainer}>
            <Text style={styles.label}>Age Range</Text>
            <Text style={styles.valueText}>
              {ageRange[0]} - {ageRange[1]}
            </Text>
          </View>
          <View style={styles.sliderContainer}>
            <MultiSlider
              values={ageRange}
              onValuesChange={handleAgeValueChange}
              min={18}
              max={99}
              sliderLength={screenWidth * 0.9}
              selectedStyle={{ backgroundColor: "#E4423F", height: 5 }}
              trackStyle={[styles.trackStyle, { height: 5 }]}
              markerStyle={styles.sliderThumb}
              unselectedStyle={{ backgroundColor: "#E5E5E5", height: 5 }}
            />
            {/* <Text style={styles.placeholderText}>Slider temporarily hidden</Text> */}
          </View>

          {/* Height Range - changed to Minimum Height */}
          <View style={styles.rowLabelContainer}>
            <Text style={styles.label}>Minimum Height (cm)</Text>
            <Text style={styles.valueText}>{heightRange[0]} cm</Text>
          </View>
          <View style={styles.sliderContainer}>
            <CustomSingleSlider
              value={heightRange[0]}
              onValueChange={(value) => setHeightRange([value, 213])}
              minimumValue={122}
              maximumValue={213}
              step={1}
              sliderLength={screenWidth * 0.9}
              thumbStyle={styles.sliderThumb}
              minimumTrackTintColor='#E4423F'
              maximumTrackTintColor='#E5E5E5'
              trackStyle={styles.trackStyle}
              inverted={true}
            />
          </View>

          {/* # of Children */}
          <View style={styles.rowLabelContainer}>
            <Text style={styles.label}>Maximum # of children</Text>
            <Text style={styles.valueText}>{numChildren}</Text>
          </View>
          <View style={styles.sliderContainer}>
            <CustomSingleSlider
              value={numChildren}
              onValueChange={setNumChildren}
              minimumValue={0}
              maximumValue={10}
              step={1}
              sliderLength={screenWidth * 0.9}
              thumbStyle={styles.sliderThumb}
              minimumTrackTintColor='#E4423F'
              maximumTrackTintColor='#E5E5E5'
              trackStyle={styles.trackStyle}
            />
          </View>

          {/* Body Type – using circle checkmarks */}
          <Text style={[styles.label, { marginTop: 15, color: "#AAAAAA" }]}>Body Type</Text>
          <View style={styles.interestsContainer}>
            {["Slim", "Athletic", "Curvy", "Plus Sized", "Few Extra Pounds"].map((type) => {
              const isSelected = bodyType.includes(type);
              return (
                <TouchableOpacity
                  key={type}
                  disabled={true}
                  style={[
                    styles.bodyTypeButton,
                    {
                      borderColor: "#CCCCCC",
                      opacity: 0.6,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.circle,
                      {
                        backgroundColor: isSelected ? "#AAAAAA" : "transparent",
                        borderColor: "#CCCCCC",
                      },
                    ]}
                  >
                    {isSelected && <Ionicons name='checkmark' size={14} color='#FFF' />}
                  </View>
                  <Text style={[styles.bodyTypeText, { color: "#AAAAAA" }]}>{type}</Text>
                </TouchableOpacity>
              );
            })}
            <View style={styles.premiumFeatureOverlay}>
              <Text style={styles.premiumFeatureText}>Available in live version</Text>
            </View>
          </View>

          {/* Smoking Habits – black pill for selected */}
          <Text style={[styles.label, { color: "#AAAAAA" }]}>Smoking Habits</Text>
          <View style={styles.pillsContainer}>
            {["Yes", "No", "Either"].map((option) => {
              const isSelected = smokingHabit === option;
              return (
                <TouchableOpacity
                  key={option}
                  disabled={true}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isSelected ? "#AAAAAA" : "#F5F5F5",
                      borderColor: "#CCCCCC",
                      opacity: 0.6,
                    },
                  ]}
                >
                  <Text style={[styles.pillText, { color: isSelected ? "#FFF" : "#AAAAAA" }]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
            <View style={styles.premiumFeatureOverlay}>
              <Text style={styles.premiumFeatureText}>Available in live version</Text>
            </View>
          </View>

          {/* Drinking Habits – black pill for selected */}
          <Text style={[styles.label, { color: "#AAAAAA" }]}>Drinking Habits</Text>
          <View style={styles.pillsContainer}>
            {["Yes", "No", "Either"].map((option) => {
              const isSelected = drinkingHabit === option;
              return (
                <TouchableOpacity
                  key={option}
                  disabled={true}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isSelected ? "#AAAAAA" : "#F5F5F5",
                      borderColor: "#CCCCCC",
                      opacity: 0.6,
                    },
                  ]}
                >
                  <Text style={[styles.pillText, { color: isSelected ? "#FFF" : "#AAAAAA" }]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
            <View style={styles.premiumFeatureOverlay}>
              <Text style={styles.premiumFeatureText}>Available in live version</Text>
            </View>
          </View>

          {/* Religious Preference */}
          <Text style={[styles.label, { color: "#AAAAAA" }]}>Religious Preference</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { borderColor: "#CCCCCC", backgroundColor: "#F5F5F5", color: "#AAAAAA" }]}
              value={religiousPreference}
              onChangeText={setReligiousPreference}
              placeholder='Any'
              placeholderTextColor='#CCCCCC'
              editable={false}
            />
            <View style={styles.premiumFeatureOverlay}>
              <Text style={styles.premiumFeatureText}>Available in live version</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Pressable style={styles.continueButton} onPress={handleFindMatch}>
        <Text style={styles.continueButtonText}>Find My Match!</Text>
      </Pressable>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 20,
  },
  headerButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  content: {
    marginHorizontal: 20,
    marginTop: 20,
  },

  // Label row with text on the left and the dynamic value on the right
  rowLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    color: "#666",
  },
  valueText: {
    fontSize: 16,
    color: "#000",
  },

  // Sliders
  sliderContainer: {
    marginBottom: 25,
    alignSelf: "center",
    // Keep all sliders the same width
    width: "100%",
  },
  sliderThumb: {
    width: 19,
    height: 19,
    backgroundColor: "#E4423F",
    borderRadius: 10,
    borderWidth: 0,
  },
  trackStyle: {
    height: 5,
    borderRadius: 2.5,
  },

  // Body Type toggles (circle checkmarks), full width usage
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between", // Distribute horizontally
    marginBottom: 20,
  },
  bodyTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 30,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: "48%", // let two items fit per row
  },
  circle: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bodyTypeText: {
    color: "#000",
    marginLeft: 6,
    fontSize: 15,
    flexShrink: 1,
  },

  // Pill toggles for Smoking/Drinking
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  pill: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 30,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    width: "30%", // three items in one row
    justifyContent: "center",
    alignItems: "center",
  },
  pillText: {
    fontSize: 16,
  },

  // Religious preference
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    padding: 12,
    marginBottom: 25,
    fontSize: 16,
    backgroundColor: "#F8F8F8",
  },

  // Bottom button
  continueButton: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E4423F",
    borderRadius: 30,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  continueButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  // Add these new styles to the StyleSheet
  premiumFeatureOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    zIndex: 1,
  },
  premiumFeatureText: {
    color: "#E4423F",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  inputContainer: {
    position: "relative",
    marginBottom: 25,
  },
  placeholderText: {
    textAlign: "center",
    color: "#999",
    paddingVertical: 10,
  },
});

export default Preferences;
