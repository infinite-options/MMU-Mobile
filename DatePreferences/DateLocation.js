import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, Platform, StatusBar, View, Text, TouchableOpacity, StyleSheet, Pressable, Keyboard, Alert, Image, ActivityIndicator, TextInput, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { REACT_APP_GOOGLE_API_KEY } from "@env";
import { useNavigation, useRoute } from "@react-navigation/native";
// Remove GooglePlacesAutocomplete
// import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

// Use conditional check to ensure API key is properly loaded
const GOOGLE_API_KEY = REACT_APP_GOOGLE_API_KEY || '';

// Add console log to debug API key (remove in production)
console.log("API Key defined:", !!GOOGLE_API_KEY);

export default function DateLocation({ navigation }) {
  const route = useRoute();
  const [matchedUserId, setMatchedUserId] = useState(route.params?.matchedUserId || null);
  
  // State for custom place search
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  
  // Add a ref for the map
  const mapRef = useRef(null);
  
  useEffect(() => {
    const initMatchedUserId = async () => {
      if (!matchedUserId) {
        const storedId = await AsyncStorage.getItem('matchedUserId');
        if (storedId) setMatchedUserId(storedId);
      }
      else {
        await AsyncStorage.setItem('matchedUserId', matchedUserId);
      }
    };
    initMatchedUserId();
  }, []);
  
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

  // Location loading state
  const [locationLoading, setLocationLoading] = useState(false);

  const handleRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);
  };
  
  // Custom function to search places using fetch
  const searchPlaces = async (query) => {
    if (!query || query.length < 3 || !GOOGLE_API_KEY) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${GOOGLE_API_KEY}&components=country:us`
      );
      
      const data = await response.json();
      if (data.status === 'OK') {
        setSearchResults(data.predictions);
      } else {
        console.error('Place Autocomplete Error:', data.status);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      Alert.alert('Error', 'Failed to search locations. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };
  
  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText.length > 2) {
        searchPlaces(searchText);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchText]);
  
  // Add a useEffect to load previously chosen location
  useEffect(() => {
    const loadSavedLocation = async () => {
      try {
        // Try to load previously saved location
        const savedLocationJSON = await AsyncStorage.getItem('savedLocation');
        if (savedLocationJSON) {
          const savedLocation = JSON.parse(savedLocationJSON);
          setLocation(savedLocation);
          setSearchText(savedLocation.name || '');
          setSelectedPlace(savedLocation.name || '');
          
          // Update the map to show the saved location
          setRegion({
            latitude: savedLocation.latitude,
            longitude: savedLocation.longitude,
            latitudeDelta: 0.06,
            longitudeDelta: 0.06,
          });
          
          // Use setTimeout to ensure the map has rendered before animating
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: savedLocation.latitude,
                longitude: savedLocation.longitude,
                latitudeDelta: 0.06,
                longitudeDelta: 0.06,
              }, 1000);
            }
          }, 500);
        }
      } catch (error) {
        console.error('Error loading saved location:', error);
      }
    };
    
    loadSavedLocation();
  }, []);
  
  // Modify the getPlaceDetails function to make map updates more reliable
  const getPlaceDetails = async (placeId) => {
    if (!placeId || !GOOGLE_API_KEY) return;
    
    setLocationLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry&key=${GOOGLE_API_KEY}`
      );
      
      const data = await response.json();
      if (data.status === 'OK' && data.result) {
        const placeDetails = data.result;
        const newRegion = {
          latitude: placeDetails.geometry.location.lat,
          longitude: placeDetails.geometry.location.lng,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        };
        
        const locationData = {
          latitude: placeDetails.geometry.location.lat,
          longitude: placeDetails.geometry.location.lng,
          name: placeDetails.name,
          address: placeDetails.formatted_address,
          placeId: placeDetails.place_id,
        };
        
        // Update location state
        setLocation(locationData);
        
        // Clear search results after selection
        setSearchResults([]);
        setSelectedPlace(placeDetails.name);
        setSearchText(placeDetails.name);
        
        // Update region state
        setRegion(newRegion);
        
        // Use both methods to ensure map updates:
        // 1. Set region state (above)
        // 2. Directly animate map to new location
        if (mapRef.current) {
          // Immediate update
          mapRef.current.animateToRegion(newRegion, 1000);
          
          // Delayed update as backup
          setTimeout(() => {
            mapRef.current.animateToRegion(newRegion, 500);
          }, 500);
        }
      } else {
        console.error('Place Details Error:', data.status);
        Alert.alert('Error', 'Could not get details for this location.');
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      Alert.alert('Error', 'Failed to get location details. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  // Handle location confirmation
  const handleAskGemmaOut = async () => {
    if (location) {
      try {
        // Save complete location object
        await AsyncStorage.setItem('savedLocation', JSON.stringify(location));
        
        // Also save individual fields for DateFinal.js to access
        if (location.name) {
          await AsyncStorage.setItem('selected_location_name', location.name);
        }
        if (location.address) {
          await AsyncStorage.setItem('selected_location_address', location.address);
        }
        await AsyncStorage.setItem('selected_date_location_lat', String(location.latitude));
        await AsyncStorage.setItem('selected_date_location_lng', String(location.longitude));
        
        console.log("Location chosen:", location, "for user:", userUid);
        
        // Navigate onward with complete location data
        navigation.navigate("DateFinal", { 
          location, 
          matchedUserId: matchedUserId 
        });
      } catch (error) {
        console.error("Error saving location:", error);
        Alert.alert("Error", "There was a problem saving your location. Please try again.");
      }
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

        {/* Custom Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search a location..."
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => setSelectedPlace(null)}
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#E4423F" style={styles.searchLoader} />
          )}
        </View>
        
        {/* Search Results List */}
        {searchResults.length > 0 && !selectedPlace && (
          <View style={styles.resultsContainer}>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.resultItem}
                  onPress={() => getPlaceDetails(item.place_id)}
                >
                  <Ionicons name="location-outline" size={20} color="#666" />
                  <Text style={styles.resultText}>{item.description}</Text>
                </TouchableOpacity>
              )}
              style={styles.resultsList}
            />
          </View>
        )}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView 
          ref={mapRef}
          style={styles.map} 
          region={region} 
          onRegionChangeComplete={handleRegionChangeComplete}
        >
          {location && <Marker coordinate={location} title={location.name} pinColor='red' />}
        </MapView>
      </View>

      {/* "Ask Gemma Out" Button */}
      <Pressable style={[styles.askButton, { backgroundColor: isFormComplete ? "#E4423F" : "#ccc" }]} onPress={handleAskGemmaOut} disabled={!isFormComplete}>
        <Text style={styles.askButtonText}>Confirm Date Details</Text>
      </Pressable>

      {/* Progress Dots */}
      <View style={styles.progressDotsContainer}>
        <View style={[styles.dot, { backgroundColor: "#ccc" }]} />
        <View style={[styles.dot, { backgroundColor: "#E4423F" }]} />
        <View style={[styles.dot, { backgroundColor: "#ccc" }]} />
      </View>
      
      {/* Loading Indicator */}
      {locationLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#E4423F" />
        </View>
      )}
    </SafeAreaView>
  );
}

// Updated Styles
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 25,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  searchLoader: {
    position: 'absolute',
    right: 15,
  },
  resultsContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    marginBottom: 10,
  },
  resultsList: {
    backgroundColor: '#FFF',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  resultText: {
    fontSize: 14,
    marginLeft: 10,
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
