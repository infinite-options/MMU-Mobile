import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Image,
  Pressable,
  Keyboard,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TextInput, Text } from "react-native-paper";
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import MapView, { Marker } from 'react-native-maps';
import { REACT_APP_GOOGLE_API_KEY } from '@env';

const GOOGLE_API_KEY = REACT_APP_GOOGLE_API_KEY;

export default function EditProfile() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [userData, setUserData] = useState({});
  const [photos, setPhotos] = useState([null, null, null]); // array of photo URIs
  const [videoUri, setVideoUri] = useState(null); // single video URI
  const [imageLicense, setImageLicense] = useState(null);
  const videoRef = useRef(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  // Default map region
  const [region, setRegion] = useState({
    latitude: 37.7749, // e.g., SF
    longitude: -122.4194,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  });

  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [formValues, setFormValues] = useState({
    firstName: 'Lachlan',
    lastName: 'Collis',
    phoneNumber: '(123) 456-7890',
    bio: "Hi! I'm Lachlan and I enjoy outdoor activities. I have a pet dog named Cat. I hope we get to know each other!",
    interests: ['Cooking / Baking', 'Gaming', 'Sports', 'Music', 'Animals & Wildlife'],
    dateTypes: ['Dinner', 'Playing video games'],
    availableTimes: ['Mon-Fri, 5:50 pm to 10:00 pm', 'Sat & Sun, all day'],
    birthdate: '26/04/2001',
    height: { feet: 5, inches: 11 },
    children: 0,
    gender: 'Male',
    identity: 'Man',
    orientation: 'Bisexual',
    openTo: 'Men & Women',
    address: '123 Main St, Anytown, USA',
    nationality: 'American',
    // ethnicity: 'Half-German Half-Irish',
    bodyType: 'Curvy',
    education: "Bachelor's Degree",
    job: 'UI/UX Designer & Graphic Designer',
    smoking: "I don't smoke",
    drinking: "I don't drink",
    religion: 'I do not practice any religion',
    starSign: 'Taurus',
    latitude: null,
    longitude: null,
  });

  const [searchText, setSearchText] = useState(formValues.address || '');

  useFocusEffect(
    React.useCallback(() => {
      // Runs on every focus
      if (videoRef.current) {
        // Pause & reset the playback to 0 if you want a fresh start
        videoRef.current.setPositionAsync(0); // optional: jump to start
        videoRef.current.pauseAsync();
        setIsVideoPlaying(false);
      }
    }, [])
  );
  // Fetch user data from the server when this screen is opened
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setIsLoading(true);
        const uid = await AsyncStorage.getItem('user_uid');
        if (!uid) {
          console.log('No user_uid in AsyncStorage');
          return;
        }
        const response = await axios.get(
          `https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${uid}`
        );
        const fetched = response.data.result[0];

        // Update the form fields with the current user data
        setUserData(fetched || {});
        setFormValues({
          firstName: fetched.user_first_name || '',
          lastName: fetched.user_last_name || '',
          phoneNumber: fetched.user_phone_number || '',
          bio: fetched.user_profile_bio || '',
          interests: fetched.user_general_interests ? JSON.parse(fetched.user_general_interests) : [],
          dateTypes: fetched.user_date_interests ? JSON.parse(fetched.user_date_interests) : [],
          availableTimes: fetched.user_available_time ? JSON.parse(fetched.user_available_time) : [],
          birthdate: fetched.user_birthdate || '',
          height: fetched.user_height || '',
          children: fetched.user_kids || 0,
          gender: fetched.user_gender || '',
          identity: fetched.user_identity || '',
          orientation: fetched.user_sexuality || '',
          openTo: fetched.user_open_to || '',
          address: fetched.user_address || '',
          nationality: fetched.user_nationality || '',
          // ethnicity: fetched.user_ethnicity || '',
          bodyType: fetched.user_body_composition || '',
          education: fetched.user_education || '',
          job: fetched.user_job || '',
          smoking: fetched.user_smoking || '',
          drinking: fetched.user_drinking || '',
          religion: fetched.user_religion || '',
          starSign: fetched.user_star_sign || '',
          latitude: fetched.user_latitude || null,
          longitude: fetched.user_longitude || null,
        });
        if (fetched.user_photo_url) {
          const photoArray = JSON.parse(fetched.user_photo_url);
          const newPhotos = [null, null, null];
          photoArray.forEach((uri, idx) => {
            if (idx < 3) newPhotos[idx] = uri;
          });
          setPhotos(newPhotos);
        }

        if (fetched.user_video_url) {
          let rawVideoUrl = fetched.user_video_url;
          try {
            rawVideoUrl = JSON.parse(rawVideoUrl);
          } catch (err) {
            console.warn('Could not JSON-parse user_video_url. Using as-is:', err);
          }
          if (
            typeof rawVideoUrl === 'string' &&
            rawVideoUrl.startsWith('"') &&
            rawVideoUrl.endsWith('"')
          ) {
            rawVideoUrl = rawVideoUrl.slice(1, -1);
          }
          setVideoUri(rawVideoUrl);
        }
      } catch (error) {
        console.log('Error fetching user info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isFocused) {
      fetchUserInfo();
    }
  }, [isFocused]);
  useEffect(() => {
    console.log('Form Values Updated:', formValues);
  }, [formValues]);
  // Sync search text with form values
  useEffect(() => {
    setSearchText(formValues.address);
  }, [formValues.address]);
  // Handle picking images
  const handlePickImage = async (slotIndex) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const newPhotos = [...photos];
      newPhotos[slotIndex] = result.assets[0].uri;
      setPhotos(newPhotos);
    }
  };
  const handleRemovePhoto = (slotIndex) => {
    const newPhotos = photos.map((photo, index) =>
      index === slotIndex ? null : photo
    );
    setPhotos(newPhotos);
  };
  // Handle picking a video
  const handleVideoUpload = async () => {
    try {
      // If you want library instead of camera, un-comment below:
      // const result = await ImagePicker.launchImageLibraryAsync({
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.5,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setVideoUri(result.assets[0].uri);
        setIsVideoPlaying(false);
      }
    } catch (error) {
      console.error("Error picking video:", error);
      Alert.alert("Error", "There was an issue processing the video.");
    }
  };
  const handleRemoveVideo = () => {
    setVideoUri(null);
    setIsVideoPlaying(false);
  };
  // Toggle video play/pause
  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      await videoRef.current.pauseAsync();
      setIsVideoPlaying(false);
    } else {
      await videoRef.current.playAsync();
      setIsVideoPlaying(true);
    }
  };
  const handleLicenseUpload = async () => {
    // Ask for permission to access media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'You need to allow access to your media library to upload a file.');
      return;
    }

    // Pick an image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageLicense(result.assets[0]); // Save the selected image
    }
  };
  const handleRemoveImage = () => {
    setImageLicense(null); // Remove the uploaded image
  };
  const fetchAutocompleteSuggestions = async (input) => {
    if (!input) {
      setSuggestions([]);
      return;
    }

    try {
      const endpoint = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&key=${GOOGLE_API_KEY}&components=country:us`;
      const response = await fetch(endpoint);
      const data = await response.json();

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
  const handleSearchTextChange = (text) => {
    setSearchText(text);
    fetchAutocompleteSuggestions(text);
  };
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
        
        // Update form values with address and coordinates
        setFormValues(prev => ({
          ...prev,
          address: suggestion.description,
          latitude: lat,
          longitude: lng
        }));
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };
  const handleSearch = async () => {
    if (!searchText.trim()) {
      Alert.alert('Warning', 'Please enter a location or pick from suggestions.');
      return;
    }

    try {
      const geocodeEndpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchText)}&key=${GOOGLE_API_KEY}`;
      const response = await fetch(geocodeEndpoint);
      const data = await response.json();

      if (data.status === 'OK' && data.results[0]) {
        const { lat, lng } = data.results[0].geometry.location;
        setFormValues(prev => ({
          ...prev,
          address: searchText,
          latitude: lat,
          longitude: lng
        }));
        setRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };
  // Handle saving the changes
  const handleSaveChanges = async () => {
    if (!formValues.firstName || !formValues.lastName) {
      Alert.alert('Error', 'Please fill in your full name and phone number.');
      return;
    }

    setIsLoading(true);
    await AsyncStorage.setItem('user_uid', userData.user_uid);
    const uploadData = new FormData();
    uploadData.append('user_uid', userData.user_uid);
    uploadData.append('user_email_id', userData.user_email_id);

    // Append each photo if it exists
    // photos.forEach((uri, index) => {
    //   if (uri) {
    //     uploadData.append(`img_${index}`, {
    //       uri,
    //       type: 'image/jpeg',
    //       name: `img_${index}.jpg`,
    //     });
    //   }
    // });

    // Append video if it exists
    if (videoUri) {
      uploadData.append('user_video', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'video_filename.mp4',
      });
    }

    // Append other form data
    uploadData.append('user_first_name', formValues.firstName || '');
    uploadData.append('user_last_name', formValues.lastName || '');
    uploadData.append('user_profile_bio', formValues.bio);
    uploadData.append('user_general_interests', JSON.stringify(formValues.interests));
    uploadData.append('user_date_interests', JSON.stringify(formValues.dateTypes));
    uploadData.append('user_available_time', JSON.stringify(formValues.availableTimes));
    uploadData.append('user_birthdate', formValues.birthdate);
    uploadData.append('user_height', formValues.height);
    uploadData.append('user_kids', formValues.children.toString());
    uploadData.append('user_gender', formValues.gender);
    uploadData.append('user_identity', formValues.identity);
    uploadData.append('user_sexuality', formValues.orientation);
    uploadData.append('user_open_to', formValues.openTo);
    uploadData.append('user_address', formValues.address);
    uploadData.append('user_nationality', formValues.nationality);
    uploadData.append('user_body_composition', formValues.bodyType);
    uploadData.append('user_education', formValues.education);
    uploadData.append('user_job', formValues.job);
    uploadData.append('user_smoking', formValues.smoking);
    uploadData.append('user_drinking', formValues.drinking);
    uploadData.append('user_religion', formValues.religion);
    uploadData.append('user_star_sign', formValues.starSign);
    uploadData.append('user_latitude', formValues.latitude?.toString() || '');
    uploadData.append('user_longitude', formValues.longitude?.toString() || '');
    console.log('uploadData', uploadData);
    try {
      const response = await axios.put(
        'https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo',
        uploadData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.status === 200) {
        Alert.alert('Success', 'Your profile has been updated!');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to update your profile.');
      }
    } catch (error) {
      console.log('Error uploading profile:', error.response ? error.response.data : error);
      Alert.alert('Error', 'There was an issue updating your profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E4423F" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Editing My Profile</Text>
          </View>

          {/* Profile Media */}
          <View style={styles.mediaContainer}>
            {videoUri ? (
              <View style={styles.videoWrapper}>
                <Video
                  ref={videoRef}
                  source={{ uri: videoUri }}
                  style={styles.video}
                  resizeMode="cover"
                  useNativeControls
                  shouldPlay={false}
                  onPlaybackStatusUpdate={(status) => {
                    if (!status.isLoaded) return;
                    setIsVideoPlaying(status.isPlaying);
                  }}
                  onError={(err) => console.log('VIDEO ERROR:', err)}
                />
                {/* Center play overlay if paused */}
                {!isVideoPlaying && (
                  <TouchableOpacity style={styles.playOverlay} onPress={handlePlayPause}>
                    <Ionicons name="play" size={48} color="#FFF" />
                  </TouchableOpacity>
                )}
                {/* "X" in top-right */}
                <TouchableOpacity onPress={handleRemoveVideo} style={styles.removeIconTopRight}>
                  <View style={styles.removeIconBackground}>
                    <Ionicons name="close" size={20} color="#FFF" />
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={handleVideoUpload} style={styles.uploadVideoButton}>
                <Ionicons name="cloud-upload-outline" size={20} color="#E4423F" />
                <Text style={styles.uploadVideoText}>Upload Video</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Photos Section */}
          <View style={styles.photoBoxesRow}>
            {photos.map((photoUri, idx) => (
              <View key={idx} style={styles.photoBox}>
                {photoUri ? (
                  <>
                    <Image source={{ uri: photoUri }} style={styles.photoImage} />
                    <TouchableOpacity
                      onPress={() => handleRemovePhoto(idx)}
                      style={styles.removeIconTopRight}
                    >
                      <View style={styles.removeIconBackground}>
                        <Ionicons name="close" size={20} color="#FFF" />
                      </View>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Pressable style={styles.emptyPhotoBox} onPress={() => handlePickImage(idx)}>
                    <Ionicons name="add" size={24} color="red" />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
          {/* drivers license */}
          <TouchableOpacity style={styles.uploadButton} onPress={handleLicenseUpload}>
            <Ionicons name="cloud-upload-outline" size={24} color="red" />
            <Text style={styles.uploadButtonText}>Upload Picture File</Text>
          </TouchableOpacity>

          {/* Uploaded Image Preview */}
          {imageLicense && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageLicense.uri }} style={styles.image} />
              <View style={styles.imageDetails}>
                <Text style={styles.imageFilename}>{imageLicense.uri.split('/').pop()}</Text>
                <Text style={styles.imageSize}>~{(imageLicense.fileSize / 1024 / 1024).toFixed(2)} MB</Text>
                <TouchableOpacity onPress={handleRemoveImage}>
                  <Ionicons name="trash-outline" size={24} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Form Section */}
          <View style={styles.formContainer}>
            <TextInput
              label="First Name"
              mode="outlined"
              style={styles.inputField}
              placeholder="Full Name"
              value={formValues.firstName}
              onChangeText={(text) => setFormValues({ ...formValues, firstName: text })}
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label="Last Name"
              mode="outlined"
              style={styles.inputField}
              placeholder="Last Name"
              value={formValues.lastName}
              onChangeText={(text) => setFormValues({ ...formValues, lastName: text })}
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label="Phone Number"
              mode="outlined"
              style={styles.inputField}
              placeholder="Phone Number"
              value={formValues.phoneNumber}
              onChangeText={(text) => setFormValues({ ...formValues, phoneNumber: text })}
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label="Bio"
              mode="outlined"
              style={styles.inputField}
              placeholder="Bio"
              value={formValues.bio}
              onChangeText={(text) => setFormValues({ ...formValues, bio: text })}
              outlineStyle={styles.textInputOutline}
              multiline
            />
            <TextInput
              label="Interests"
              mode="outlined"
              style={styles.inputField}
              placeholder="Interests"
              value={formValues.interests.join(', ')}
              onChangeText={(text) => setFormValues({ ...formValues, interests: text.split(',').map(i => i.trim()) })}
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label="Date Interests"
              mode="outlined"
              style={styles.inputField}
              placeholder="Date Interests"
              value={formValues.dateTypes.join(', ')}
              onChangeText={(text) => setFormValues({ ...formValues, dateTypes: text.split(',').map(i => i.trim()) })}
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label="My Availability"
              mode="outlined"
              style={styles.inputField}
              placeholder="Example: Mon: 9 AM - 5 PM, Tue: 10 AM - 6 PM"
              value={formValues.availableTimes.map(t => `${t.day}: ${t.start_time} - ${t.end_time}`).join(', ')}
              onChangeText={(text) => {
                const times = text.split(', ').map(entry => {
                  const [dayPart, timeRange] = entry.split(': ');
                  const [start, end] = timeRange?.split(' - ') || [];
                  return {
                    day: dayPart?.trim() || '',
                    start_time: start?.trim() || '',
                    end_time: end?.trim() || ''
                  };
                });
                setFormValues({ ...formValues, availableTimes: times });
              }}
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label="Birthdate"
              mode="outlined"
              style={styles.inputField}
              placeholder="Birthdate"
              value={formValues.birthdate}
              onChangeText={(text) => setFormValues({ ...formValues, birthdate: text })}
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label="Height"
              mode="outlined"
              style={styles.inputField}
              placeholder="Height"
              value={formValues.height}
              onChangeText={(text) => setFormValues({ ...formValues, height: text })}
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label="No of Children"
              mode="outlined"
              style={styles.inputField}
              placeholder="No of Children"
              value={formValues.children.toString()}
              onChangeText={(text) => setFormValues({ ...formValues, children: parseInt(text) })}
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label="Gender"
              mode="outlined"
              style={styles.inputField}
              placeholder="Gender"
              value={formValues.gender}
              onChangeText={(text) => setFormValues({ ...formValues, gender: text })}
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label="Identity"
              mode="outlined"
              style={styles.inputField}
              placeholder="Identity"
              value={formValues.identity}
              onChangeText={(text) => setFormValues({ ...formValues, identity: text })}
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label="Sexual Orientation"
              mode="outlined"
              style={styles.inputField}
              placeholder="Sexual Orientation"
              value={formValues.orientation}
              onChangeText={(text) => setFormValues({ ...formValues, orientation: text })}
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label="Open To"
              mode="outlined"
              style={styles.inputField}
              placeholder="Open To"
              value={formValues.openTo}
              onChangeText={(text) => setFormValues({ ...formValues, openTo: text })}
              outlineStyle={styles.textInputOutline}
            />
            {/* <TextInput
              label="Address"
              mode="outlined"
              style={styles.inputField}
              placeholder="Address"
              value={formValues.address}
              onChangeText={(text) => setFormValues({ ...formValues, address: text })}
              outlineStyle={styles.textInputOutline}
            /> */}
            <View style={styles.searchRow}>
              <View style={styles.searchWrapper}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search your location..."
                  value={searchText}
                  onChangeText={handleSearchTextChange}
                />
              </View>
              <TouchableOpacity onPress={handleSearch} style={styles.searchIconWrapper}>
                <Ionicons name="search" size={24} color="#888" />
              </TouchableOpacity>
            </View>
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
                  scrollEnabled={false}
                />
              </View>
            )}
            <TextInput
              label="Nationality"
              mode="outlined"
              style={styles.inputField}
              placeholder="Nationality"
              value={formValues.nationality}
              onChangeText={(text) => setFormValues({ ...formValues, nationality: text })}
              outlineStyle={styles.textInputOutline}
            />
            {/* <TextInput
              label="Ethnicity"
              mode="outlined"
              style={styles.inputField}
              placeholder="Ethnicity"
              value={formValues.ethnicity}
              onChangeText={(text) => setFormValues({ ...formValues, ethnicity: text })}
              outlineStyle={styles.textInputOutline}
            /> */}
            <TextInput
              label="Body Type"
              mode="outlined"
              style={styles.inputField}
              placeholder="Body Type"
              value={formValues.bodyType}
              onChangeText={(text) => setFormValues({ ...formValues, bodyType: text })}
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label="Education Level"
              mode="outlined"
              style={styles.inputField}
              placeholder="Education Level"
              value={formValues.education}
              onChangeText={(text) => setFormValues({ ...formValues, education: text })}
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label="Job"
              mode="outlined"
              style={styles.inputField}
              placeholder="Job"
              value={formValues.job}
              onChangeText={(text) => setFormValues({ ...formValues, job: text })}
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label="Smoking Habits"
              mode="outlined"
              style={styles.inputField}
              placeholder="Smoking Habits"
              value={formValues.smoking}
              onChangeText={(text) => setFormValues({ ...formValues, smoking: text })}
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label="Drinking Habits"
              mode="outlined"
              style={styles.inputField}
              placeholder="Drinking Habits"
              value={formValues.drinking}
              onChangeText={(text) => setFormValues({ ...formValues, drinking: text })}
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label="Religion"
              mode="outlined"
              style={styles.inputField}
              placeholder="Religion"
              value={formValues.religion}
              onChangeText={(text) => setFormValues({ ...formValues, religion: text })}
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label="Star Sign"
              mode="outlined"
              style={styles.inputField}
              placeholder="Star Sign"
              value={formValues.starSign}
              onChangeText={(text) => setFormValues({ ...formValues, starSign: text })}
              outlineStyle={styles.textInputOutline}
            />
          </View>

          {/* Save Changes Button */}
          <TouchableOpacity onPress={handleSaveChanges} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  headerContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  mediaContainer: {
    marginBottom: 20,
  },
  videoWrapper: {
    position: "relative",
    width: "100%",
    aspectRatio: 0.76,
    backgroundColor: "#000",
    marginBottom: 15,
    borderRadius: 10,
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -24 }, { translateY: -24 }],
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 50,
    padding: 10,
  },
  removeIconTopRight: {
    position: "absolute",
    top: 5,
    right: 5,
  },
  removeIconBackground: {
    backgroundColor: "#E4423F",
    borderRadius: 20,
    padding: 4,
  },
  uploadVideoButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#E4423F",
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  uploadVideoText: {
    color: "#E4423F",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },

  // Photo boxes in a row (3 boxes)
  photoBoxesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  photoBox: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
    overflow: "hidden",
    position: "relative",
  },
  emptyPhotoBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  inputField: {
    marginBottom: 15,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'red',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
  },
  uploadButtonText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  imageContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 200,
    height: 120,
    borderRadius: 10,
    marginBottom: 10,
  },
  imageDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '80%',
  },
  imageFilename: {
    fontSize: 14,
    color: '#333',
  },
  imageSize: {
    fontSize: 14,
    color: 'gray',
  },
  saveButton: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E4423F",
    borderRadius: 30,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  textInputOutline: {
    borderWidth: 0,
    borderColor: "#F9F9F9",
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 50,
  },
  suggestionsContainer: {
    marginTop: 20,
    padding: 10,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchWrapper: {
    flex: 1,
  },
  searchInput: {
    padding: 10,
  },
  searchIconWrapper: {
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
