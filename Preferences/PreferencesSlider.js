import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import axios from "axios";

const PreferenceSlider = ({ preference, measurement, start, min, max }) => {
  const [value, setValue] = useState(start);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [userUID, setUserUID] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Extra state for handling age range (min and max)
  const [ageRange, setAgeRange] = useState({ minAge: 20, maxAge: 60 });

  // Function to load user data from AsyncStorage
  const loadUserData = async () => {
    try {
      const uid = await AsyncStorage.getItem("user_uid");
      const email = await AsyncStorage.getItem("user_email_id");
      setUserUID(uid || "");
      setUserEmail(email || "");
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  // Function to load saved preferences from AsyncStorage
  const loadStoredValue = async () => {
    try {
      const savedValue = await AsyncStorage.getItem(`preference_${preference}`);
      if (savedValue) {
        setValue(JSON.parse(savedValue));
      }
    } catch (error) {
      console.error("Error loading stored value:", error);
    }
  };

  // Save the new value to AsyncStorage
  const saveValue = async (newValue) => {
    try {
      await AsyncStorage.setItem(`preference_${preference}`, JSON.stringify(newValue));
    } catch (error) {
      console.error("Error saving value:", error);
    }
  };

  useEffect(() => {
    // Load user data and stored value on component mount
    loadUserData();
    loadStoredValue();
  }, []);

  const handleChange = (newValue) => {
    const roundedValue = Math.round(newValue); // For single value sliders
    setValue(roundedValue);
    saveValue(roundedValue); // Save the rounded value to AsyncStorage
  };

  const handleAgeChange = (ageType, newValue) => {
    const roundedValue = Math.round(newValue);
    setAgeRange((prevRange) => ({
      ...prevRange,
      [ageType]: roundedValue,
    }));
  };

  const displayValue = (value) => {
    if (Array.isArray(value)) {
      return `${value[0]}-${value[1]}`;
    }
    return value;
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [value]);

  useEffect(() => {
    if (!userUID || !userEmail) return; // Prevent unnecessary API calls until user data is loaded

    const formData = new FormData();
    formData.append("user_uid", userUID);
    formData.append("user_email_id", userEmail);

    // Handle different preferences based on the type
    if (preference === "Height in centimetres") {
      formData.append("user_prefer_height_min", debouncedValue.toString());
    } else if (preference === "Maximum distance") {
      formData.append("user_prefer_distance", debouncedValue);
    } else if (preference === "Age range") {
      // Send age range values
      formData.append("user_prefer_age_min", ageRange.minAge);
      formData.append("user_prefer_age_max", ageRange.maxAge);
    }

    // formData.append('user_prefer_gender', "Female");

    axios
      .put("https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo", formData)
      .then((response) => console.log("Slider value updated:", response))
      .catch((error) => console.error("Error updating slider value:", error));
  }, [debouncedValue, ageRange, userUID, userEmail]);

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{preference}</Text>
        <Text>
          {displayValue(value)} {measurement}
        </Text>
      </View>
      {preference === "Age range" ? (
        <View>
          <Text>Min Age: {ageRange.minAge}</Text>
          <Slider
            style={styles.slider}
            value={ageRange.minAge}
            minimumValue={min}
            maximumValue={max}
            onValueChange={(newValue) => handleAgeChange("minAge", newValue)}
            step={1}
            minimumTrackTintColor='#E4423F'
            maximumTrackTintColor='#CECECE'
            thumbTintColor='#ffffff'
          />
          <Text>Max Age: {ageRange.maxAge}</Text>
          <Slider
            style={styles.slider}
            value={ageRange.maxAge}
            minimumValue={min}
            maximumValue={max}
            onValueChange={(newValue) => handleAgeChange("maxAge", newValue)}
            step={1}
            minimumTrackTintColor='#E4423F'
            maximumTrackTintColor='#CECECE'
            thumbTintColor='#ffffff'
          />
        </View>
      ) : (
        <Slider
          style={styles.slider}
          value={Array.isArray(value) ? value[0] : value} // Display the first value if it's an array (for range)
          minimumValue={min}
          maximumValue={max}
          onValueChange={handleChange}
          step={1}
          minimumTrackTintColor='#E4423F'
          maximumTrackTintColor='#CECECE'
          thumbTintColor='#ffffff'
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  label: {
    fontSize: 18,
    fontFamily: "Lexend",
  },
  slider: {
    width: "100%",
    height: 40,
  },
});

export default PreferenceSlider;
