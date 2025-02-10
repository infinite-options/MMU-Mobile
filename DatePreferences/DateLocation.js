import React, { useState, useEffect } from "react";
import { SafeAreaView, Platform, StatusBar, View, Text, TouchableOpacity, StyleSheet, Pressable, Keyboard, Alert, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { REACT_APP_GOOGLE_API_KEY } from "@env";
import { useNavigation, useRoute } from "@react-navigation/native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
// Example hearts images
// import heartUser from '../src/Assets/Images/heartUser.png';
// import heartMatch from '../src/Assets/Images/heartMatch.png';

const GOOGLE_API_KEY = REACT_APP_GOOGLE_API_KEY;

export default function DateLocation({ navigation }) {
  const route = useRoute();
  const matchedUserId = route.params?.matchedUserId || null;
  const [location, setLocation] = useState(null);

  // Default map region
  const [region, setRegion] = useState({
    latitude: 37.7749, // example: San Francisco
    longitude: -122.4194,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  });

  const [userUid, setUserUid] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  // For the "Ask Gemma Out!" button: enabled only if we have a chosen location
  const isFormComplete = !!location;

  // Optional: on mount, fetch user ID/email (if needed)
  useEffect(() => {
    const fetchUserCredentials = async () => {
      try {
        const uid = await AsyncStorage.getItem("user_uid");
        const email = await AsyncStorage.getItem("user_email_id");
        if (uid && email) {
          setUserUid(uid);
          setUserEmail(email);
        }
      } catch (error) {
        console.error("Error fetching user credentials:", error);
      }
    };
    fetchUserCredentials();
  }, []);

  const handleRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);
  };

  // Confirm location => optionally store on server or just proceed
  const handleAskGemmaOut = async () => {
    if (location) {
      // Example: Save to your server or AsyncStorage
      console.log("Location chosen:", location, "for user:", userUid);
      // Navigate onward
      navigation.navigate("DateFinal", { location, matchedUserId: matchedUserId });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginHorizontal: 20 }}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name='arrow-back' size={28} color='red' />
        </TouchableOpacity>

        {/* Hearts at top */}
        <View style={styles.heartsContainer}>
          <Image source={require("../src/Assets/Images/match1.png")} style={styles.heartImage} />
          <Image source={require("../src/Assets/Images/match2.png")} style={[styles.heartImage, styles.heartOverlap]} />
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.title}>Where will the date occur?</Text>
        <Text style={styles.subtitle}>Please search for a dinner location.</Text>

        {/* Google Places Autocomplete */}
        <GooglePlacesAutocomplete
          placeholder='Search a location...'
          fetchDetails={true}
          onPress={(data, details = null) => {
            if (details) {
              const { lat, lng } = details.geometry.location;
              setLocation({
                latitude: lat,
                longitude: lng,
              });
              setRegion({
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.06,
                longitudeDelta: 0.06,
              });
            }
          }}
          query={{
            key: GOOGLE_API_KEY,
            language: "en",
            components: "country:us",
          }}
          styles={{
            container: {
              flex: 0,
            },
            textInputContainer: {
              width: "100%",
              backgroundColor: "rgba(0,0,0,0)",
              borderTopWidth: 0,
              borderBottomWidth: 0,
            },
            textInput: {
              marginLeft: 0,
              marginRight: 0,
              height: 48,
              color: "#000",
              fontSize: 16,
              borderWidth: 1,
              borderColor: "#CCC",
              borderRadius: 25,
              paddingHorizontal: 15,
            },
            listView: {
              backgroundColor: "#FFF",
              borderWidth: 1,
              borderColor: "#DDD",
              borderRadius: 5,
              marginTop: 5,
            },
            row: {
              padding: 13,
              height: 44,
            },
          }}
        />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView style={styles.map} region={region} onRegionChangeComplete={handleRegionChangeComplete}>
          {/* Show a Marker if user selected a location */}
          {/* {location && <Marker coordinate={location} title='Selected Location' description={searchText || "Location"} pinColor='red' />} */}
          {location && <Marker coordinate={location} title='Selected Location' pinColor='red' />}
        </MapView>
      </View>

      {/* "Ask Gemma Out" Button */}
      <Pressable style={[styles.askButton, { backgroundColor: isFormComplete ? "#E4423F" : "#ccc" }]} onPress={handleAskGemmaOut} disabled={!isFormComplete}>
        <Text style={styles.askButtonText}>Confirm Date Details</Text>
      </Pressable>

      {/* Progress Dots (example: second dot in red) */}
      <View style={styles.progressDotsContainer}>
        <View style={[styles.dot, { backgroundColor: "#ccc" }]} />
        <View style={[styles.dot, { backgroundColor: "#E4423F" }]} />
        <View style={[styles.dot, { backgroundColor: "#ccc" }]} />
      </View>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    padding: 8,
    marginTop: 30,
    marginBottom: 20,
  },
  heartsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  heartImage: {
    width: 60,
    height: 60,
    resizeMode: "cover",
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#FF4081",
  },
  heartOverlap: {
    marginLeft: -20,
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
  mapContainer: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  askButton: {
    height: 50,
    marginHorizontal: 20,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  askButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  progressDotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
