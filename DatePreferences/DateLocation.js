import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  Platform,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Keyboard,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { REACT_APP_GOOGLE_API_KEY } from '@env'; // or however you store your key
import { useNavigation, useRoute } from '@react-navigation/native';
// Example hearts images
// import heartUser from '../src/Assets/Images/heartUser.png';
// import heartMatch from '../src/Assets/Images/heartMatch.png';

const GOOGLE_API_KEY = REACT_APP_GOOGLE_API_KEY;

export default function DateLocation({ navigation}) {
  const route = useRoute();
  const matchedUserId = route.params?.matchedUserId || null;
  // Input text in the search bar
  const [searchText, setSearchText] = useState('');
  // If user has chosen a specific location => { latitude, longitude }
  const [location, setLocation] = useState(null);

  // Default map region
  const [region, setRegion] = useState({
    latitude: 37.7749, // example: San Francisco
    longitude: -122.4194,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  });

  // Store autocomplete suggestions
  const [suggestions, setSuggestions] = useState([]);

  // You may or may not need user credentials from AsyncStorage
  const [userUid, setUserUid] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  // For the "Ask Gemma Out!" button: enabled only if we have a chosen location
  const isFormComplete = !!location;

  // Optional: on mount, fetch user ID/email (if needed)
  useEffect(() => {
    const fetchUserCredentials = async () => {
      try {
        const uid = await AsyncStorage.getItem('user_uid');
        const email = await AsyncStorage.getItem('user_email_id');
        if (uid && email) {
          setUserUid(uid);
          setUserEmail(email);
        }
      } catch (error) {
        console.error('Error fetching user credentials:', error);
      }
    };
    fetchUserCredentials();
  }, []);

  // Autocomplete function
  const fetchAutocompleteSuggestions = async (input) => {
    if (!input) {
      setSuggestions([]);
      return;
    }
    try {
      const endpoint = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&key=${GOOGLE_API_KEY}&components=country:us`;
      const resp = await fetch(endpoint);
      const data = await resp.json();

      if (data.status === 'OK') {
        setSuggestions(data.predictions);
      } else {
        setSuggestions([]);
        console.warn('Autocomplete request error:', data.status, data.error_message);
      }
    } catch (error) {
      console.error('Error fetching autocomplete:', error);
    }
  };

  // On typing in search input
  const handleSearchTextChange = (text) => {
    setSearchText(text);
    fetchAutocompleteSuggestions(text);
  };

  // Tap on a suggestion => fetch lat/lng
  const handleSuggestionPress = async (suggestion) => {
    Keyboard.dismiss();
    setSearchText(suggestion.description);
    setSuggestions([]);

    try {
      const detailsEndpoint = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.place_id}&key=${GOOGLE_API_KEY}`;
      const detailsResp = await fetch(detailsEndpoint);
      const detailsData = await detailsResp.json();

      if (detailsData.status === 'OK') {
        const { lat, lng } = detailsData.result.geometry.location;
        setLocation({ latitude: lat, longitude: lng });
        setRegion((prev) => ({ ...prev, latitude: lat, longitude: lng }));

        // Store the location name and coordinates in AsyncStorage
        await AsyncStorage.setItem('selected_location_name', suggestion.description);
        await AsyncStorage.setItem('selected_date_location_lat', lat.toString()); // Convert to string
        await AsyncStorage.setItem('selected_date_location_lng', lng.toString()); // Convert to string

        console.log('selected_location_name', suggestion.description);
        console.log('selected_date_location_lat', lat);
        console.log('selected_date_location_lng', lng);
      } else {
        console.warn('Place Details error:', detailsData.status, detailsData.error_message);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      Alert.alert('Error', 'Could not fetch place details. Please try again.');
    }
  };

  // Optional: user presses search icon
  const handleSearch = () => {
    if (!searchText.trim()) {
      Alert.alert('Warning', 'Please enter a location or pick from suggestions.');
      return;
    }
    // For demonstration, you could trigger a direct search or do nothing
    console.log('Search icon pressed with text:', searchText);
  };

  // Called after the map stops moving
  const handleRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);
  };

  // Confirm location => optionally store on server or just proceed
  const handleAskGemmaOut = async () => {
    if (location) {
      // Example: Save to your server or AsyncStorage
      console.log('Location chosen:', location, 'for user:', userUid);
      // Navigate onward
      navigation.navigate('DateFinal', { location, matchedUserId: matchedUserId });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginHorizontal: 20 }}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="red" />
        </TouchableOpacity>

        {/* Hearts at top */}
        <View style={styles.heartsContainer}>
          <Image
            source={require('../src/Assets/Images/match1.png')} // replace with your paths
            style={styles.heartImage}
          />
          <Image
            source={require('../src/Assets/Images/match2.png')} // replace with your paths
            style={[styles.heartImage, styles.heartOverlap]}
          />
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.title}>Where will the date occur?</Text>
        <Text style={styles.subtitle}>Please search for a dinner location.</Text>

        {/* Search Row */}
        <View style={styles.searchRow}>
          <View style={styles.searchWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search a location..."
              value={searchText}
              onChangeText={handleSearchTextChange}
            />
          </View>
          <TouchableOpacity onPress={handleSearch} style={styles.searchIconWrapper}>
            <Ionicons name="search" size={24} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Suggestions List */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress(item)}
                >
                  <Text numberOfLines={1}>{item.description}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={handleRegionChangeComplete}
        >
          {/* Show a Marker if user selected a location */}
          {location && (
            <Marker
              coordinate={location}
              title="Selected Location"
              description={searchText || 'Location'}
              pinColor="red"
            />
          )}
        </MapView>
      </View>

      {/* "Ask Gemma Out" Button */}
      <Pressable
        style={[
          styles.askButton,
          { backgroundColor: isFormComplete ? '#E4423F' : '#ccc' },
        ]}
        onPress={handleAskGemmaOut}
        disabled={!isFormComplete}
      >
        <Text style={styles.askButtonText}>Confirm Date Details</Text>
      </Pressable>

      {/* Progress Dots (example: second dot in red) */}
      <View style={styles.progressDotsContainer}>
        <View style={[styles.dot, { backgroundColor: '#ccc' }]} />
        <View style={[styles.dot, { backgroundColor: '#E4423F' }]} />
        <View style={[styles.dot, { backgroundColor: '#ccc' }]} />
      </View>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 8,
    marginTop: 30,
    marginBottom: 20,
  },
  heartsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heartImage: {
    width: 60,
    height: 60,
    resizeMode: 'cover',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FF4081',
  },
  heartOverlap: {
    marginLeft: -20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 25,
    paddingHorizontal: 15,
  },
  searchInput: {
    height: 48,
    fontSize: 16,
    color: '#000',
  },
  searchIconWrapper: {
    position: 'absolute',
    right: 15,
    // top or bottom if needed for alignment
  },
  suggestionsContainer: {
    backgroundColor: '#FFF',
    borderColor: '#CCC',
    borderWidth: 1,
    borderRadius: 5,
    marginTop: 5,
    marginBottom: 15,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  askButton: {
    height: 50,
    marginHorizontal: 20,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  askButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
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
