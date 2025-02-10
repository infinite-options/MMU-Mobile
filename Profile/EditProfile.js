import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, ScrollView, View, StyleSheet, TouchableOpacity, Alert, Platform, StatusBar, Image, Pressable, Keyboard, FlatList, ActivityIndicator, Text as RNText, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TextInput, Text } from "react-native-paper";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import { Picker } from "@react-native-picker/picker"; // <--- ADD THIS
import MapView, { Marker } from "react-native-maps";
import { REACT_APP_GOOGLE_API_KEY } from "@env";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete"; // Fixed import

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
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  });

  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // We'll store height in two separate numeric fields for +/– usage
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(11);

  // Replace these text-based fields with pickers for Gender, Body Type, etc.
  const [genderOptions] = useState(["Male", "Female", "Non-binary", "Other"]);
  const [bodyTypeOptions] = useState(["Slim", "Athletic", "Curvy", "Average", "Other"]);
  const [orientationOptions] = useState(["Straight", "Gay", "Bisexual", "Asexual", "Pansexual", "Queer", "Questioning", "Other"]);
  const [openToOptions] = useState(["Men", "Women", "Men & Women", "Everyone"]);
  const [smokingOptions] = useState(["I don't smoke", "Social smoker", "Regular smoker"]);
  const [drinkingOptions] = useState(["I don't drink", "Social drinker", "Regular drinker"]);
  const [religionOptions] = useState(["No religion", "Christianity", "Islam", "Hinduism", "Buddhism", "Other"]);
  const [starSignOptions] = useState(["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]);
  const [educationOptions] = useState(["", "High School", "Bachelor's Degree", "Master's Degree", "PhD"]);

  // Interests and date interests as arrays of strings => displayed as chips
  const [interests, setInterests] = useState([]);
  const [dateTypes, setDateTypes] = useState([]);

  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    bio: "",
    availableTimes: [],
    birthdate: "26/04/2001",
    children: 0,
    gender: "Male",
    identity: "Man",
    orientation: "Bisexual",
    openTo: "Men & Women",
    address: "123 Main St, Anytown, USA",
    nationality: "American",
    bodyType: "Curvy",
    education: "Bachelor's Degree",
    job: "UI/UX Designer & Graphic Designer",
    smoking: "I don't smoke",
    drinking: "I don't drink",
    religion: "I do not practice any religion",
    starSign: "Taurus",
    latitude: null,
    longitude: null,
  });

  const [searchText, setSearchText] = useState(formValues.address || "");

  const [modalVisible, setModalVisible] = useState(false);
  const [newEntryText, setNewEntryText] = useState("");
  const [entryType, setEntryType] = useState("interest"); // 'interest' or 'dateType'

  useFocusEffect(
    React.useCallback(() => {
      if (videoRef.current) {
        videoRef.current.setPositionAsync(0);
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
        const uid = await AsyncStorage.getItem("user_uid");
        if (!uid) {
          console.log("No user_uid in AsyncStorage");
          return;
        }
        const response = await axios.get(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${uid}`);
        const fetched = response.data.result[0];

        setUserData(fetched || {});
        setFormValues({
          firstName: fetched.user_first_name || "",
          lastName: fetched.user_last_name || "",
          phoneNumber: fetched.user_phone_number || "",
          bio: fetched.user_profile_bio || "",
          availableTimes: fetched.user_available_time ? JSON.parse(fetched.user_available_time) : [],
          birthdate: fetched.user_birthdate || "",
          // We'll store the numeric height into our separate states (example)
          // If your actual data is stored as 5ft 11in or something, parse them:
          // for demonstration, I'm just using 5 and 11 as defaults
          // children:
          children: fetched.user_kids || 0,
          gender: fetched.user_gender || "",
          identity: fetched.user_identity || "",
          orientation: fetched.user_sexuality || "",
          openTo: fetched.user_open_to || "",
          address: fetched.user_address || "",
          nationality: fetched.user_nationality || "",
          bodyType: fetched.user_body_composition || "",
          education: fetched.user_education || "",
          job: fetched.user_job || "",
          smoking: fetched.user_smoking || "",
          drinking: fetched.user_drinking || "",
          religion: fetched.user_religion || "",
          starSign: fetched.user_star_sign || "",
          latitude: fetched.user_latitude || null,
          longitude: fetched.user_longitude || null,
        });

        // If the DB stored interests in a JSON array string
        if (fetched.user_general_interests) {
          setInterests(JSON.parse(fetched.user_general_interests));
        }
        if (fetched.user_date_interests) {
          setDateTypes(JSON.parse(fetched.user_date_interests));
        }

        // Photos
        if (fetched.user_photo_url) {
          const photoArray = JSON.parse(fetched.user_photo_url);
          const newPhotos = [null, null, null];
          photoArray.forEach((uri, idx) => {
            if (idx < 3) newPhotos[idx] = uri;
          });
          setPhotos(newPhotos);
        }

        // Video
        if (fetched.user_video_url) {
          let rawVideoUrl = fetched.user_video_url;
          try {
            rawVideoUrl = JSON.parse(rawVideoUrl);
          } catch (err) {
            console.warn("Could not JSON-parse user_video_url. Using as-is:", err);
          }
          if (typeof rawVideoUrl === "string" && rawVideoUrl.startsWith('"') && rawVideoUrl.endsWith('"')) {
            rawVideoUrl = rawVideoUrl.slice(1, -1);
          }
          setVideoUri(rawVideoUrl);
        }

        // Convert stored cm back to feet/inches
        if (fetched.user_height) {
          const cm = parseInt(fetched.user_height);
          const totalInches = cm / 2.54;
          const feet = Math.floor(totalInches / 12);
          const inches = Math.round(totalInches % 12);

          setHeightFt(feet.toString());
          setHeightIn(inches.toString());
        }
      } catch (error) {
        console.log("Error fetching user info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isFocused) {
      fetchUserInfo();
    }
  }, [isFocused]);

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
    const newPhotos = photos.map((photo, index) => (index === slotIndex ? null : photo));
    setPhotos(newPhotos);
  };

  // Handle picking a video
  const handleVideoUpload = async () => {
    try {
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

  // Driver's license
  const handleLicenseUpload = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "You need to allow access to your media library to upload a file.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImageLicense(result.assets[0]);
    }
  };
  const handleRemoveImage = () => {
    setImageLicense(null);
  };

  // Google Places Autocomplete
  const fetchAutocompleteSuggestions = async (input) => {
    if (!input) {
      setSuggestions([]);
      return;
    }
    try {
      const endpoint = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_API_KEY}&components=country:us`;
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
      if (detailsData.status === "OK") {
        const { lat, lng } = detailsData.result.geometry.location;
        setLocation({ latitude: lat, longitude: lng });
        setRegion((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        setFormValues((prev) => ({
          ...prev,
          address: suggestion.description,
          latitude: lat,
          longitude: lng,
        }));
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
    }
  };
  const handleSearch = async () => {
    if (!searchText.trim()) {
      Alert.alert("Warning", "Please enter a location or pick from suggestions.");
      return;
    }
    try {
      const geocodeEndpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchText)}&key=${GOOGLE_API_KEY}`;
      const response = await fetch(geocodeEndpoint);
      const data = await response.json();
      if (data.status === "OK" && data.results[0]) {
        const { lat, lng } = data.results[0].geometry.location;
        setFormValues((prev) => ({
          ...prev,
          address: searchText,
          latitude: lat,
          longitude: lng,
        }));
        setRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  // Adding and removing "chips" for interests
  const handleAddInterest = () => {
    setEntryType("interest");
    setModalVisible(true);
  };

  // Adding and removing "chips" for date types
  const handleAddDateType = () => {
    setEntryType("dateType");
    setModalVisible(true);
  };
  const handleRemoveInterest = (index) => {
    const updated = [...interests];
    updated.splice(index, 1);
    setInterests(updated);
  };
  const handleRemoveDateType = (index) => {
    const updated = [...dateTypes];
    updated.splice(index, 1);
    setDateTypes(updated);
  };

  // Increment/Decrement Height
  const decrementFeet = () => {
    if (heightFt > 0) setHeightFt(heightFt - 1);
  };
  const incrementFeet = () => {
    setHeightFt(heightFt + 1);
  };
  const decrementInches = () => {
    if (heightIn > 0) setHeightIn(heightIn - 1);
  };
  const incrementInches = () => {
    if (heightIn < 11) setHeightIn(heightIn + 1);
  };

  // Save changes
  const handleSaveChanges = async () => {
    if (!formValues.firstName || !formValues.lastName) {
      Alert.alert("Error", "Please fill in your full name and phone number.");
      return;
    }
    setIsLoading(true);
    await AsyncStorage.setItem("user_uid", userData.user_uid);

    // Convert feet/inches to centimeters
    const totalInches = parseInt(heightFt || 0) * 12 + parseInt(heightIn || 0);
    const heightCm = Math.round(totalInches * 2.54);

    // Convert interests and date interests to JSON
    const userInterestsJSON = JSON.stringify(interests);
    const userDateInterestsJSON = JSON.stringify(dateTypes);

    // We'll combine the feet + inches into a single string or numeric
    const combinedHeight = `${heightFt}' ${heightIn}"`;

    const uploadData = new FormData();
    uploadData.append("user_uid", userData.user_uid);
    uploadData.append("user_email_id", userData.user_email_id);

    // If you want to actually upload photos in form-data, do so here.
    // This is commented out because your code had placeholders:
    // photos.forEach((uri, index) => {
    //   if (uri) {
    //     uploadData.append(`img_${index}`, {
    //       uri,
    //       type: 'image/jpeg',
    //       name: `img_${index}.jpg`,
    //     });
    //   }
    // });

    // Upload video if any
    if (videoUri) {
      uploadData.append("user_video", {
        uri: videoUri,
        type: "video/mp4",
        name: "video_filename.mp4",
      });
    }

    // Append other form data
    uploadData.append("user_first_name", formValues.firstName || "");
    uploadData.append("user_last_name", formValues.lastName || "");
    uploadData.append("user_profile_bio", formValues.bio);
    uploadData.append("user_general_interests", userInterestsJSON);
    uploadData.append("user_date_interests", userDateInterestsJSON);
    uploadData.append("user_available_time", JSON.stringify(formValues.availableTimes));
    uploadData.append("user_birthdate", formValues.birthdate);
    uploadData.append("user_height", heightCm.toString());
    uploadData.append("user_kids", formValues.children.toString());
    uploadData.append("user_gender", formValues.gender || "-");
    uploadData.append("user_identity", formValues.identity);
    uploadData.append("user_sexuality", formValues.orientation);
    uploadData.append("user_open_to", formValues.openTo);
    uploadData.append("user_address", formValues.address);
    uploadData.append("user_nationality", formValues.nationality);
    uploadData.append("user_body_composition", formValues.bodyType);
    uploadData.append("user_education", formValues.education);
    uploadData.append("user_job", formValues.job);
    uploadData.append("user_smoking", formValues.smoking);
    uploadData.append("user_drinking", formValues.drinking);
    uploadData.append("user_religion", formValues.religion);
    uploadData.append("user_star_sign", formValues.starSign);
    uploadData.append("user_latitude", formValues.latitude?.toString() || "");
    uploadData.append("user_longitude", formValues.longitude?.toString() || "");

    try {
      const response = await axios.put("https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo", uploadData, { headers: { "Content-Type": "multipart/form-data" } });
      if (response.status === 200) {
        Alert.alert("Success", "Your profile has been updated!");
        navigation.goBack();
      } else {
        Alert.alert("Error", "Failed to update your profile.");
      }
    } catch (error) {
      console.log("Error uploading profile:", error.response ? error.response.data : error);
      Alert.alert("Error", "There was an issue updating your profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#E4423F' />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Editing My Profile</Text>
          </View>

          {/* Profile Video */}
          <View style={styles.mediaContainer}>
            {videoUri ? (
              <View style={styles.videoWrapper}>
                <Video
                  ref={videoRef}
                  source={{ uri: videoUri }}
                  style={styles.video}
                  resizeMode='cover'
                  useNativeControls
                  shouldPlay={false}
                  onPlaybackStatusUpdate={(status) => {
                    if (!status.isLoaded) return;
                    setIsVideoPlaying(status.isPlaying);
                  }}
                  onError={(err) => console.log("VIDEO ERROR:", err)}
                />
                {!isVideoPlaying && (
                  <TouchableOpacity style={styles.playOverlay} onPress={handlePlayPause}>
                    <Ionicons name='play' size={48} color='#FFF' />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleRemoveVideo} style={styles.removeIconTopRight}>
                  <View style={styles.removeIconBackground}>
                    <Ionicons name='close' size={20} color='#FFF' />
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={handleVideoUpload} style={styles.uploadVideoButton}>
                <Ionicons name='cloud-upload-outline' size={20} color='#E4423F' />
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
                    <TouchableOpacity onPress={() => handleRemovePhoto(idx)} style={styles.removeIconTopRight}>
                      <View style={styles.removeIconBackground}>
                        <Ionicons name='close' size={20} color='#FFF' />
                      </View>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Pressable style={styles.emptyPhotoBox} onPress={() => handlePickImage(idx)}>
                    <Ionicons name='add' size={24} color='red' />
                  </Pressable>
                )}
              </View>
            ))}
          </View>

          {/* Driver's License */}
          <TouchableOpacity style={styles.uploadButton} onPress={handleLicenseUpload}>
            <Ionicons name='cloud-upload-outline' size={24} color='red' />
            <Text style={styles.uploadButtonText}>Upload Picture File</Text>
          </TouchableOpacity>
          {imageLicense && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageLicense.uri }} style={styles.image} />
              <View style={styles.imageDetails}>
                <Text style={styles.imageFilename}>{imageLicense.uri.split("/").pop()}</Text>
                {/* If you have imageLicense.fileSize, you could show that. */}
                <TouchableOpacity onPress={handleRemoveImage}>
                  <Ionicons name='trash-outline' size={24} color='red' />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Form Section */}
          <View style={styles.formContainer}>
            <TextInput
              label='First Name'
              mode='outlined'
              style={styles.inputField}
              value={formValues.firstName}
              onChangeText={(text) => setFormValues({ ...formValues, firstName: text })}
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label='Last Name'
              mode='outlined'
              style={styles.inputField}
              value={formValues.lastName}
              onChangeText={(text) => setFormValues({ ...formValues, lastName: text })}
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label='Phone Number'
              mode='outlined'
              style={styles.inputField}
              value={formValues.phoneNumber}
              onChangeText={(text) => setFormValues({ ...formValues, phoneNumber: text })}
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label='Bio'
              mode='outlined'
              style={styles.inputField}
              multiline
              value={formValues.bio}
              onChangeText={(text) => setFormValues({ ...formValues, bio: text })}
              outlineStyle={styles.textInputOutline}
            />

            {/* Interests as Tag Buttons */}
            <Text style={styles.label}>My Interests</Text>
            <View style={styles.tagContainer}>
              {interests.map((interest, index) => (
                <View key={index} style={styles.tag}>
                  <RNText style={styles.tagText}>{interest}</RNText>
                  <TouchableOpacity onPress={() => handleRemoveInterest(index)} style={styles.tagClose}>
                    <Ionicons name='close' size={14} color='#FFF' />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.addTagButton} onPress={handleAddInterest}>
              <Ionicons name='add' size={14} color='#E4423F' />
              <Text style={styles.addTagButtonText}>Add Interest</Text>
            </TouchableOpacity>

            {/* Kinds of Date I Enjoy as Tag Buttons */}
            <Text style={styles.label}>Kinds of Date I Enjoy</Text>
            <View style={styles.tagContainer}>
              {dateTypes.map((item, index) => (
                <View key={index} style={styles.tag}>
                  <RNText style={styles.tagText}>{item}</RNText>
                  <TouchableOpacity onPress={() => handleRemoveDateType(index)} style={styles.tagClose}>
                    <Ionicons name='close' size={14} color='#FFF' />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.addTagButton} onPress={handleAddDateType}>
              <Ionicons name='add' size={14} color='#E4423F' />
              <Text style={styles.addTagButtonText}>Add Date Type</Text>
            </TouchableOpacity>

            {/* My Availability */}
            <TextInput
              label='My Availability'
              mode='outlined'
              style={styles.inputField}
              placeholder='Example: Mon: 9 AM - 5 PM, Tue: 10 AM - 6 PM'
              value={formValues.availableTimes.map((t) => `${t.day}: ${t.start_time} - ${t.end_time}`).join(", ")}
              onChangeText={(text) => {
                const times = text.split(", ").map((entry) => {
                  const [dayPart, timeRange] = entry.split(": ");
                  const [start, end] = timeRange?.split(" - ") || [];
                  return {
                    day: dayPart?.trim() || "",
                    start_time: start?.trim() || "",
                    end_time: end?.trim() || "",
                  };
                });
                setFormValues({ ...formValues, availableTimes: times });
              }}
              outlineStyle={styles.textInputOutline}
            />

            <TextInput
              label='Birthdate'
              mode='outlined'
              style={styles.inputField}
              value={formValues.birthdate}
              onChangeText={(text) => setFormValues({ ...formValues, birthdate: text })}
              outlineStyle={styles.textInputOutline}
            />

            {/* Height Input */}
            <View style={styles.inputField}>
              <Text variant='bodyMedium' style={styles.inputLabel}>
                Height
              </Text>
              <View style={styles.heightContainer}>
                {/* Feet Controls */}
                <View style={styles.heightControlGroup}>
                  <TouchableOpacity style={styles.heightButton} onPress={() => setHeightFt(Math.max(0, parseInt(heightFt || 0) - 1).toString())}>
                    <Text style={styles.buttonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.heightValue}>{heightFt || 0} ft</Text>
                  <TouchableOpacity style={styles.heightButton} onPress={() => setHeightFt((parseInt(heightFt || 0) + 1).toString())}>
                    <Text style={styles.buttonText}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* Inches Controls */}
                <View style={styles.heightControlGroup}>
                  <TouchableOpacity style={styles.heightButton} onPress={() => setHeightIn(Math.max(0, parseInt(heightIn || 0) - 1).toString())}>
                    <Text style={styles.buttonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.heightValue}>{heightIn || 0} in</Text>
                  <TouchableOpacity style={styles.heightButton} onPress={() => setHeightIn((parseInt(heightIn || 0) + 1).toString())}>
                    <Text style={styles.buttonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* # of Children */}
            <TextInput
              label='# of Children'
              mode='outlined'
              style={styles.inputField}
              value={formValues.children.toString()}
              onChangeText={(text) => setFormValues({ ...formValues, children: parseInt(text) })}
              keyboardType='numeric'
              outlineStyle={styles.textInputOutline}
            />

            {/* Gender */}
            <Text style={styles.label}>Gender</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={formValues.gender || null} onValueChange={(value) => setFormValues({ ...formValues, gender: value })}>
                <Picker.Item label='-' value={""} />
                {genderOptions.map((option, idx) => (
                  <Picker.Item key={idx} label={option} value={option} />
                ))}
              </Picker>
            </View>

            <TextInput
              label='Identity'
              mode='outlined'
              style={styles.inputField}
              value={formValues.identity}
              onChangeText={(text) => setFormValues({ ...formValues, identity: text })}
              outlineStyle={styles.textInputOutline}
            />

            {/* Orientation */}
            <Text style={styles.label}>Sexual Orientation</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={formValues.orientation || null} onValueChange={(value) => setFormValues({ ...formValues, orientation: value })}>
                <Picker.Item label='-' value={""} />
                {orientationOptions.map((opt, idx) => (
                  <Picker.Item key={idx} label={opt} value={opt} />
                ))}
              </Picker>
            </View>

            {/* Open To */}
            <Text style={styles.label}>Open To</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={formValues.openTo || null} onValueChange={(val) => setFormValues({ ...formValues, openTo: val })}>
                <Picker.Item label='-' value={""} />
                {openToOptions.map((opt, idx) => (
                  <Picker.Item key={idx} label={opt} value={opt} />
                ))}
              </Picker>
            </View>

            {/* Location */}
            <Text style={styles.label}>Address / Location</Text>
            <GooglePlacesAutocomplete
              placeholder='Search your location...'
              fetchDetails={true}
              onPress={(data, details = null) => {
                if (details) {
                  const { lat, lng } = details.geometry.location;
                  setLocation({ latitude: lat, longitude: lng });
                  setRegion({
                    latitude: lat,
                    longitude: lng,
                    latitudeDelta: 0.06,
                    longitudeDelta: 0.06,
                  });
                  setFormValues((prev) => ({
                    ...prev,
                    address: data.description,
                    latitude: lat,
                    longitude: lng,
                  }));
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
                  marginBottom: 15,
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
                  backgroundColor: "#F9F9F9",
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

            {/* Map View */}
            <View style={styles.mapContainer}>
              <MapView style={styles.map} region={region} onRegionChangeComplete={(newRegion) => setRegion(newRegion)}>
                {location && <Marker coordinate={location} title='Selected Location' pinColor='red' />}
              </MapView>
            </View>

            <TextInput
              label='Nationality'
              mode='outlined'
              style={styles.inputField}
              value={formValues.nationality}
              onChangeText={(text) => setFormValues({ ...formValues, nationality: text })}
              outlineStyle={styles.textInputOutline}
            />

            {/* Body Type */}
            <Text style={styles.label}>Body Type</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={formValues.bodyType || null} onValueChange={(val) => setFormValues({ ...formValues, bodyType: val })}>
                <Picker.Item label='-' value={""} />
                {bodyTypeOptions.map((opt, idx) => (
                  <Picker.Item key={idx} label={opt} value={opt} />
                ))}
              </Picker>
            </View>

            {/* Education */}
            <Text style={styles.label}>Education Level</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={formValues.education || null} onValueChange={(val) => setFormValues({ ...formValues, education: val })}>
                <Picker.Item label='-' value={""} />
                {educationOptions.map((opt, idx) => (
                  <Picker.Item key={idx} label={opt} value={opt} />
                ))}
              </Picker>
            </View>

            {/* Job */}
            <TextInput
              label='Job'
              mode='outlined'
              style={styles.inputField}
              value={formValues.job}
              onChangeText={(text) => setFormValues({ ...formValues, job: text })}
              outlineStyle={styles.textInputOutline}
            />

            {/* Smoking */}
            <Text style={styles.label}>Smoking Habits</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={formValues.smoking || null} onValueChange={(val) => setFormValues({ ...formValues, smoking: val })}>
                <Picker.Item label='-' value={""} />
                {smokingOptions.map((opt, idx) => (
                  <Picker.Item key={idx} label={opt} value={opt} />
                ))}
              </Picker>
            </View>

            {/* Drinking */}
            <Text style={styles.label}>Drinking Habits</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={formValues.drinking || null} onValueChange={(val) => setFormValues({ ...formValues, drinking: val })}>
                <Picker.Item label='-' value={""} />
                {drinkingOptions.map((opt, idx) => (
                  <Picker.Item key={idx} label={opt} value={opt} />
                ))}
              </Picker>
            </View>

            {/* Religion */}
            <Text style={styles.label}>Religion</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={formValues.religion || null} onValueChange={(val) => setFormValues({ ...formValues, religion: val })}>
                <Picker.Item label='-' value={""} />
                {religionOptions.map((opt, idx) => (
                  <Picker.Item key={idx} label={opt} value={opt} />
                ))}
              </Picker>
            </View>

            {/* Star Sign */}
            <Text style={styles.label}>Star Sign</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={formValues.starSign || null} onValueChange={(val) => setFormValues({ ...formValues, starSign: val })}>
                <Picker.Item label='-' value={""} />
                {starSignOptions.map((opt, idx) => (
                  <Picker.Item key={idx} label={opt} value={opt} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Save Changes Button */}
          <TouchableOpacity onPress={handleSaveChanges} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>

          <Modal visible={modalVisible} animationType='slide' transparent={true} onRequestClose={() => setModalVisible(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add {entryType === "interest" ? "Interest" : "Date Type"}</Text>
                <TextInput style={styles.modalInput} placeholder={`Enter ${entryType === "interest" ? "interest" : "date type"}`} value={newEntryText} onChangeText={setNewEntryText} autoFocus />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      setModalVisible(false);
                      setNewEntryText("");
                    }}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.addButton]}
                    onPress={() => {
                      if (newEntryText.trim()) {
                        if (entryType === "interest") {
                          setInterests((prev) => [...prev, newEntryText.trim()]);
                        } else {
                          setDateTypes((prev) => [...prev, newEntryText.trim()]);
                        }
                      }
                      setModalVisible(false);
                      setNewEntryText("");
                    }}
                  >
                    <Text style={styles.modalButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
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
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "red",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
  },
  uploadButtonText: {
    color: "red",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  imageContainer: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 200,
    height: 120,
    borderRadius: 10,
    marginBottom: 10,
  },
  imageDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "80%",
  },
  imageFilename: {
    fontSize: 14,
    color: "#333",
  },
  formContainer: {
    marginBottom: 20,
  },
  inputField: {
    marginBottom: 15,
  },
  textInputOutline: {
    borderWidth: 0,
    borderColor: "#F9F9F9",
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    paddingHorizontal: 15,
    height: 50,
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
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    fontWeight: "bold",
    marginTop: 10,
  },
  // Tag styles
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  tag: {
    flexDirection: "row",
    backgroundColor: "#E4423F",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: "#FFF",
    marginRight: 6,
    fontSize: 14,
  },
  tagClose: {
    width: 16,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addTagButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  addTagButtonText: {
    marginLeft: 4,
    color: "#E4423F",
    fontWeight: "bold",
  },
  // Height Input
  heightContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heightControlGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 5,
  },
  heightButton: {
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    padding: 10,
    minWidth: 40,
    alignItems: "center",
  },
  heightValue: {
    marginHorizontal: 10,
    fontSize: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  // Picker styling
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#E4423F",
    borderRadius: 8,
    marginBottom: 15,
    overflow: "hidden",
  },
  // Autocomplete
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  searchWrapper: {
    flex: 1,
  },
  searchInput: {
    padding: 10,
    backgroundColor: "#F9F9F9",
  },
  searchIconWrapper: {
    padding: 10,
  },
  suggestionsContainer: {
    marginTop: -10,
    backgroundColor: "#FFF",
    borderRadius: 5,
    zIndex: 999,
    elevation: 3,
    marginBottom: 10,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    padding: 10,
    marginLeft: 15,
  },
  addButton: {
    backgroundColor: "#E4423F",
    borderRadius: 5,
  },
  modalButtonText: {
    color: "#E4423F",
    fontWeight: "bold",
  },
  addButtonText: {
    color: "white",
  },
  mapContainer: {
    height: 200,
    marginBottom: 20,
  },
  map: {
    flex: 1,
  },
});
