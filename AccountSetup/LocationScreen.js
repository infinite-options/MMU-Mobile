import React, { useState, useEffect } from "react";
import { SafeAreaView, Platform, StatusBar, View, Text, TouchableOpacity, StyleSheet, TextInput, Pressable, FlatList, Keyboard, Alert, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import ProgressBar from "../src/Assets/Components/ProgressBar";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EXPO_PUBLIC_MMU_GOOGLE_MAPS_API_KEY } from "@env";

const GOOGLE_API_KEY = EXPO_PUBLIC_MMU_GOOGLE_MAPS_API_KEY;

export default function LocationScreen({ navigation }) {
  // Track the text in the search bar
  const [searchText, setSearchText] = useState("");
  // Track location (latitude & longitude). Null if not chosen yet
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);

  // Default map region
  const [region, setRegion] = useState({
    latitude: 37.7749, // e.g., SF
    longitude: -122.4194,
    // latitude: -33.8688, // Sydney, Australia
    // longitude: 151.2093,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  });

  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState([]);

  // Credentials from AsyncStorage (we'll fetch them in `useEffect`)
  const [userUid, setUserUid] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  // Check if location is selected
  const isFormComplete = !!location;

  // On mount, fetch user ID/email from AsyncStorage
  useEffect(() => {
    const fetchUserCredentials = async () => {
      try {
        const uid = await AsyncStorage.getItem("user_uid");
        const email = await AsyncStorage.getItem("user_email_id");
        if (!uid || !email) {
          Alert.alert("Error", "User credentials not found in AsyncStorage.");
          navigation.goBack();
          return;
        }
        setUserUid(uid);
        setUserEmail(email);
      } catch (error) {
        console.error("Error fetching user credentials:", error);
      }
    };
    fetchUserCredentials();
  }, [navigation]);

  // 1) Autocomplete: query Google Places
  const fetchAutocompleteSuggestions = async (input) => {
    if (!input) {
      setSuggestions([]);
      return;
    }

    try {
      const endpoint = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_API_KEY}&components=country:us`;
      // For Australia use au.  For International sites remove &components=country:au
      // const endpoint = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_API_KEY}&components=country:au`;
      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.status === "OK") {
        setSuggestions(data.predictions);
      } else {
        setSuggestions([]);
        console.warn("Autocomplete request error:", data.status, data.error_message);
      }
    } catch (error) {
      console.error("Error fetching autocomplete:", error);
    }
  };

  // 2) On typing in search
  const handleSearchTextChange = (text) => {
    setSearchText(text);
    fetchAutocompleteSuggestions(text);
  };

  // 3) Tapping a suggestion => get lat/lng
  const handleSuggestionPress = async (suggestion) => {
    Keyboard.dismiss();
    setSearchText(suggestion.description);
    setSuggestions([]);

    // Store selected address to AsyncStorage
    try {
      await AsyncStorage.setItem("user_address", suggestion.description);
      setAddress(suggestion.description);
    } catch (error) {
      console.error("Error saving address:", error);
    }

    try {
      const detailsEndpoint = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.place_id}&key=${GOOGLE_API_KEY}`;
      const detailsResp = await fetch(detailsEndpoint);
      const detailsData = await detailsResp.json();

      if (detailsData.status === "OK") {
        const { lat, lng } = detailsData.result.geometry.location;
        setLocation({ latitude: lat, longitude: lng });
        setRegion((prev) => ({ ...prev, latitude: lat, longitude: lng }));
      } else {
        console.warn("Place Details error:", detailsData.status, detailsData.error_message);
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
      Alert.alert("Error", "Could not fetch place details. Please try again.");
    }
  };

  // Optional: user presses search icon
  const handleSearch = () => {
    if (!searchText.trim()) {
      Alert.alert("Warning", "Please enter a location or pick from suggestions.");
      return;
    }
    console.log("Search icon pressed:", searchText);
  };

  // Track map region changes
  const handleRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);
  };

  // Continue => Save lat/long to server
  const handleContinue = async () => {
    if (location) {
      const url = "https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo";
      const fd = new FormData();

      fd.append("user_uid", userUid);
      fd.append("user_email_id", userEmail);
      fd.append("user_latitude", location.latitude);
      fd.append("user_longitude", location.longitude);
      fd.append("user_address", address);

      try {
        const response = await fetch(url, {
          method: "PUT",
          body: fd,
        });
        if (response.ok) {
          const result = await response.json();
          console.log("Response from server:", result);
        }
      } catch (error) {
        console.log("Error updating user data:", error);
      }
      // Then navigate to the next screen
      navigation.navigate("EnableLocationScreen", { location });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Image source={require("../assets/icons/backarrow.png")} />
      </TouchableOpacity>

      {/* Progress Bar */}
      <ProgressBar startProgress={80} endProgress={90} style={styles.progressBar} />

      {/* Title & Subtitle */}
      <Text style={styles.title}>Add your location</Text>
      <Text style={styles.subtitle}>Discover matches within your preferred distance.</Text>

      {/* Trial Version Notice */}
      {/* <View style={styles.trialBox}>
        <Text style={styles.trialHeading}>TRIAL VERSION</Text>
        <Text style={styles.trialBody}>
          For the testing phase, the location function is only available <Text style={styles.link}>here</Text> and the <Text style={styles.link}>map setting</Text> in your profile.
        </Text>
      </View> */}

      {/* Search Row */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrapper}>
          <TextInput style={styles.searchInput} placeholder='Search your location...' value={searchText} onChangeText={handleSearchTextChange} />
        </View>
        <TouchableOpacity onPress={handleSearch} style={styles.searchIconWrapper}>
          <Ionicons name='search' size={24} color='#888' />
        </TouchableOpacity>
      </View>

      {/* Suggestions List */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSuggestionPress(item)}>
                <Text numberOfLines={1}>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView style={styles.map} initialRegion={region} region={region} onRegionChangeComplete={handleRegionChangeComplete}>
          {/* Marker if user has chosen a location */}
          {location && <Marker coordinate={location} title='Selected Location' description={searchText || "Location"} pinColor='red' />}
        </MapView>
      </View>

      {/* Continue Button */}
      <Pressable style={[styles.continueButton, { backgroundColor: isFormComplete ? "#E4423F" : "#F5F5F5" }]} onPress={handleContinue} disabled={!isFormComplete}>
        <Text style={[styles.continueButtonText, { color: isFormComplete ? "#FFF" : "rgba(26, 26, 26, 0.25)" }]}>Continue</Text>
      </Pressable>
    </SafeAreaView>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    justifyContent: "flex-start",
    alignItems: "stretch",
    paddingHorizontal: 25,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  backButton: {
    alignSelf: "flex-start",
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 30,
  },
  progressBar: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: "gray",
    marginBottom: 50,
  },
  trialBox: {
    marginBottom: 20,
  },
  trialHeading: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  trialBody: {
    fontSize: 14,
    color: "#000",
    lineHeight: 20,
  },
  link: {
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  searchWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 25,
    paddingHorizontal: 15,
  },
  searchInput: {
    height: 48,
    fontSize: 16,
    color: "#000",
  },
  searchIconWrapper: {
    position: "absolute",
    right: 15,
  },
  suggestionsContainer: {
    backgroundColor: "#FFF",
    borderColor: "#CCC",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 5,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  mapContainer: {
    width: "100%",
    height: 250,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
  },
  map: {
    flex: 1,
  },
  continueButton: {
    height: 50,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 50,
  },
  continueButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
