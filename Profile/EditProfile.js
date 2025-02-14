import React, { useState, useEffect, useRef } from "react";
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
  Text as RNText,
  Modal,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TextInput, Text } from "react-native-paper";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import { Picker } from "@react-native-picker/picker";
import MapView, { Marker } from "react-native-maps";
import { REACT_APP_GOOGLE_API_KEY } from "@env";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import DropDownPicker from "react-native-dropdown-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { allInterests } from "../src/config/interests";

const GOOGLE_API_KEY = REACT_APP_GOOGLE_API_KEY;

// Add axios default configuration
axios.defaults.timeout = 10000; // 10 seconds timeout
axios.defaults.headers.common["Content-Type"] = "application/json";

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
  // Body Type
  const [bodyTypeOpen, setBodyTypeOpen] = useState(false);
  const [bodyTypeValue, setBodyTypeValue] = useState(null);
  const [bodyTypeItems, setBodyTypeItems] = useState([
    { label: "Slim", value: "Slim" },
    { label: "Athletic", value: "Athletic" },
    { label: "Curvy", value: "Curvy" },
    { label: "Average", value: "Average" },
    { label: "Other", value: "Other" },
  ]);

  // Gender
  const [genderOpen, setGenderOpen] = useState(false);
  const [genderValue, setGenderValue] = useState(null);
  const [genderItems, setGenderItems] = useState([
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Non-binary", value: "Non-binary" },
    { label: "Other", value: "Other" },
  ]);

  // Identity
  const [identityOpen, setIdentityOpen] = useState(false);
  const [identityValue, setIdentityValue] = useState(null);
  const [identityItems, setIdentityItems] = useState([
    { label: "Man", value: "Man" },
    { label: "Woman", value: "Woman" },
    { label: "Non-binary", value: "Non-binary" },
    { label: "Transgender Man", value: "Transgender Man" },
    { label: "Transgender Woman", value: "Transgender Woman" },
    { label: "Genderqueer", value: "Genderqueer" },
    { label: "Other", value: "Other" },
  ]);

  // Orientation
  const [orientationOpen, setOrientationOpen] = useState(false);
  const [orientationValue, setOrientationValue] = useState(null);
  const [orientationItems, setOrientationItems] = useState([
    { label: "Straight", value: "Straight" },
    { label: "Gay", value: "Gay" },
    { label: "Bisexual", value: "Bisexual" },
    { label: "Asexual", value: "Asexual" },
    { label: "Pansexual", value: "Pansexual" },
    { label: "Queer", value: "Queer" },
    { label: "Questioning", value: "Questioning" },
    { label: "Other", value: "Other" },
  ]);

  // Open To
  const [openToOpen, setOpenToOpen] = useState(false);
  const [openToValue, setOpenToValue] = useState([]); // Changed to array for multiple selections
  const [openToItems, setOpenToItems] = useState([
    { label: "Men", value: "Men" },
    { label: "Women", value: "Women" },
    { label: "Men (transgender)", value: "Men (transgender)" },
    { label: "Women (transgender)", value: "Women (transgender)" },
    { label: "Non-binary", value: "Non-binary" },
    { label: "Genderqueer", value: "Genderqueer" },
    { label: "Other", value: "Other" },
    { label: "Everyone", value: "Everyone" },
  ]);

  // Smoking
  const [smokingOpen, setSmokingOpen] = useState(false);
  const [smokingValue, setSmokingValue] = useState(null);
  const [smokingItems, setSmokingItems] = useState([
    { label: "I don't smoke", value: "I don't smoke" },
    { label: "Social smoker", value: "Social smoker" },
    { label: "Regular smoker", value: "Regular smoker" },
  ]);

  // Drinking
  const [drinkingOpen, setDrinkingOpen] = useState(false);
  const [drinkingValue, setDrinkingValue] = useState(null);
  const [drinkingItems, setDrinkingItems] = useState([
    { label: "I don't drink", value: "I don't drink" },
    { label: "Social drinker", value: "Social drinker" },
    { label: "Regular drinker", value: "Regular drinker" },
  ]);

  // Religion
  const [religionOpen, setReligionOpen] = useState(false);
  const [religionValue, setReligionValue] = useState(null);
  const [religionItems, setReligionItems] = useState([
    { label: "No religion", value: "No religion" },
    { label: "Christianity", value: "Christianity" },
    { label: "Islam", value: "Islam" },
    { label: "Hinduism", value: "Hinduism" },
    { label: "Buddhism", value: "Buddhism" },
    { label: "Other", value: "Other" },
  ]);

  // Star Sign
  const [starSignOpen, setStarSignOpen] = useState(false);
  const [starSignValue, setStarSignValue] = useState(null);
  const [starSignItems, setStarSignItems] = useState([
    { label: "Aries", value: "Aries" },
    { label: "Taurus", value: "Taurus" },
    { label: "Gemini", value: "Gemini" },
    { label: "Cancer", value: "Cancer" },
    { label: "Leo", value: "Leo" },
    { label: "Virgo", value: "Virgo" },
    { label: "Libra", value: "Libra" },
    { label: "Scorpio", value: "Scorpio" },
    { label: "Sagittarius", value: "Sagittarius" },
    { label: "Capricorn", value: "Capricorn" },
    { label: "Aquarius", value: "Aquarius" },
    { label: "Pisces", value: "Pisces" },
  ]);

  // Education
  const [educationOpen, setEducationOpen] = useState(false);
  const [educationValue, setEducationValue] = useState(null);
  const [educationItems, setEducationItems] = useState([
    { label: "High School", value: "High School" },
    { label: "Bachelor's Degree", value: "Bachelor's Degree" },
    { label: "Master's Degree", value: "Master's Degree" },
    { label: "PhD", value: "PhD" },
  ]);

  // Interests and date interests as arrays of strings => displayed as chips
  const [interests, setInterests] = useState([]);
  const [dateTypes, setDateTypes] = useState([]);

  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    bio: "",
    availableTimes: [],
    birthdate: "",
    children: 0,
    gender: "",
    identity: "",
    orientation: "",
    openTo: [],
    address: "",
    nationality: "",
    bodyType: "",
    education: "",
    job: "",
    smoking: "",
    drinking: "",
    religion: "",
    starSign: "",
    latitude: null,
    longitude: null,
  });

  const [searchText, setSearchText] = useState(formValues.address || "");

  const [modalVisible, setModalVisible] = useState(false);
  const [newEntryText, setNewEntryText] = useState("");
  const [entryType, setEntryType] = useState("interest"); // 'interest' or 'dateType'

  const [hasChanges, setHasChanges] = useState(false);
  const [originalValues, setOriginalValues] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      if (videoRef.current) {
        videoRef.current.setPositionAsync(0);
        videoRef.current.pauseAsync();
        setIsVideoPlaying(false);
      }
    }, [])
  );

  // Permission check on component mount
  useEffect(() => {
    (async () => {
      const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Media library permission not granted");
      }
    })();
  }, []);

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

        // Create axios instance with specific config
        const api = axios.create({
          baseURL: "https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev",
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        });

        const response = await api.get(`/userinfo/${uid}`);
        const fetched = response.data.result[0];

        // Safely parse open_to field
        let parsedOpenTo = [];
        try {
          if (fetched.user_open_to) {
            if (typeof fetched.user_open_to === "string") {
              parsedOpenTo = JSON.parse(fetched.user_open_to);
            } else if (Array.isArray(fetched.user_open_to)) {
              parsedOpenTo = fetched.user_open_to;
            }
          }
        } catch (error) {
          console.log("Error parsing open_to:", error);
          parsedOpenTo = [];
        }

        // Safely parse interests
        let parsedInterests = [];
        try {
          if (fetched.user_general_interests) {
            parsedInterests = JSON.parse(fetched.user_general_interests);
          }
        } catch (error) {
          console.log("Error parsing interests:", error);
          parsedInterests = [];
        }

        // Safely parse date interests
        let parsedDateInterests = [];
        try {
          if (fetched.user_date_interests) {
            parsedDateInterests = JSON.parse(fetched.user_date_interests);
          }
        } catch (error) {
          console.log("Error parsing date interests:", error);
          parsedDateInterests = [];
        }

        setUserData(fetched || {});
        const newFormValues = {
          firstName: fetched.user_first_name || "",
          lastName: fetched.user_last_name || "",
          phoneNumber: fetched.user_phone_number || "",
          bio: fetched.user_profile_bio || "",
          availableTimes: fetched.user_available_time ? JSON.parse(fetched.user_available_time) : [],
          birthdate: fetched.user_birthdate || "",
          children: fetched.user_kids || 0,
          gender: fetched.user_gender || "",
          identity: fetched.user_identity || "",
          orientation: fetched.user_sexuality || "",
          openTo: parsedOpenTo,
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
        };

        setFormValues(newFormValues);
        setOriginalValues({ ...newFormValues });

        setInterests(parsedInterests);
        setDateTypes(parsedDateInterests);

        // Set initial values for dropdowns
        setGenderValue(fetched.user_gender || null);
        setIdentityValue(fetched.user_identity || null);
        setOrientationValue(fetched.user_sexuality || null);
        setOpenToValue(parsedOpenTo);
        setBodyTypeValue(fetched.user_body_composition || null);
        setSmokingValue(fetched.user_smoking || null);
        setDrinkingValue(fetched.user_drinking || null);
        setReligionValue(fetched.user_religion || null);
        setStarSignValue(fetched.user_star_sign || null);
        setEducationValue(fetched.user_education || null);

        // Handle photos
        if (fetched.user_photo_url) {
          try {
            const photoArray = JSON.parse(fetched.user_photo_url);
            const newPhotos = [null, null, null];
            photoArray.forEach((uri, idx) => {
              if (idx < 3) newPhotos[idx] = uri;
            });
            setPhotos(newPhotos);
          } catch (error) {
            console.log("Error parsing photo URLs:", error);
            setPhotos([null, null, null]);
          }
        }

        // Handle video
        if (fetched.user_video_url) {
          let rawVideoUrl = fetched.user_video_url;
          try {
            if (typeof rawVideoUrl === "string" && (rawVideoUrl.startsWith('"') || rawVideoUrl.startsWith("["))) {
              rawVideoUrl = JSON.parse(rawVideoUrl);
            }
            if (Array.isArray(rawVideoUrl)) {
              rawVideoUrl = rawVideoUrl[0];
            }
          } catch (err) {
            console.log("Could not parse video URL:", err);
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

        setGenderValue(fetched.user_gender || null);
      } catch (error) {
        console.log("Error fetching user info:", error.response || error);
        Alert.alert("Error", "Failed to load profile data. Please check your internet connection and try again.");
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

  // Platform-specific video quality
  const getVideoQuality = () => {
    if (Platform.OS === "ios") {
      return ImagePicker.UIImagePickerControllerQualityType.Medium;
    }
    return "720p";
  };

  // Updated image picker function with better permission handling
  const handlePickImage = async (slotIndex) => {
    try {
      const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();

      if (existingStatus !== "granted") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Photo library access is required to select images. Would you like to open settings to grant permission?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                Platform.OS === "ios" ? Linking.openURL("app-settings:") : Linking.openSettings();
              },
            },
          ]);
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 3,
        quality: Platform.OS === "ios" ? 0.8 : 1,
        allowsEditing: false,
        base64: false,
        exif: false,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const newPhotos = [...photos];
        for (const asset of result.assets) {
          const targetIndex = slotIndex + result.assets.indexOf(asset);
          if (targetIndex < 3) {
            newPhotos[targetIndex] = asset.uri;
            // Log image details when selected
            const size = await getFileSize(asset.uri);
            console.log(`Image selected: ${asset.uri.split("/").pop()}`);
            console.log(`Original size: ${(size / 1024 / 1024).toFixed(2)} MB`);
          }
        }
        setPhotos(newPhotos);
      }
    } catch (error) {
      console.error("Error picking images:", error);
      Alert.alert("Error", "There was an issue accessing your photos. Please check your permissions and try again.", [
        { text: "OK" },
        {
          text: "Open Settings",
          onPress: () => {
            Platform.OS === "ios" ? Linking.openURL("app-settings:") : Linking.openSettings();
          },
        },
      ]);
    }
  };
  const handleRemovePhoto = (slotIndex) => {
    const newPhotos = photos.map((photo, index) => (index === slotIndex ? null : photo));
    setPhotos(newPhotos);
  };

  // Handle picking a video
  const handleVideoUpload = async () => {
    try {
      // Platform-specific permission handling
      if (Platform.OS === "ios") {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        const microphonePermission = await ImagePicker.requestMicrophonePermissionsAsync();

        if (cameraPermission.status !== "granted" || microphonePermission.status !== "granted") {
          Alert.alert("Permission Required", "Camera and microphone access is required to record video. Please enable it in your device settings.", [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => Linking.openSettings() },
          ]);
          return;
        }
      } else {
        // Android permissions
        const permissions = await Promise.all([ImagePicker.requestCameraPermissionsAsync(), ImagePicker.requestMicrophonePermissionsAsync(), ImagePicker.requestMediaLibraryPermissionsAsync()]);

        if (permissions.some((permission) => permission.status !== "granted")) {
          Alert.alert("Permission Required", "Camera, microphone, and storage access are required to record video. Please enable them in your device settings.", [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => Linking.openSettings() },
          ]);
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: Platform.OS === "ios", // Video editing only works well on iOS
        quality: 1,
        videoQuality: getVideoQuality(),
        maxDuration: 60,
        saveToPhotos: true, // Save to device camera roll
        presentationStyle: Platform.OS === "ios" ? "fullScreen" : undefined,
        androidRecordAudioPermissionOptions:
          Platform.OS === "android"
            ? {
                title: "Permission to use audio recording",
                message: "We need your permission to use your audio",
              }
            : undefined,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        // Handle platform-specific video path
        const videoUri = Platform.OS === "ios" ? result.assets[0].uri.replace("file://", "") : result.assets[0].uri;

        setVideoUri(videoUri);
        setIsVideoPlaying(false);
      }
    } catch (error) {
      console.error("Error picking video:", error);
      Alert.alert("Error", "There was an issue recording the video. Please try again.");
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

  // Updated handleSaveChanges function
  const handleSaveChanges = async () => {
    console.log("\n=== Starting Profile Update ===");
    console.log("Creating new FormData object");
    if (!formValues.firstName || !formValues.lastName) {
      Alert.alert("Error", "Please fill in your full name and phone number.");
      return;
    }

    try {
      setIsLoading(true);
      const uid = await AsyncStorage.getItem("user_uid");
      if (!uid) {
        Alert.alert("Error", "User ID not found");
        return;
      }

      // Filter out null photos and only include actual photo URIs
      const originalPhotos = userData.user_photo_url ? JSON.parse(userData.user_photo_url) : [];
      const photoUrls = photos.filter((uri) => uri !== null && uri !== undefined);

      // Create FormData object
      const uploadData = new FormData();
      uploadData.append("user_uid", userData.user_uid);
      uploadData.append("user_email_id", userData.user_email_id);

      // Check if photos have changed
      if (JSON.stringify(originalPhotos) !== JSON.stringify(photoUrls)) {
        uploadData.append("user_photo_url", JSON.stringify(photoUrls));
      }

      // Create an object of the original values from userData
      const originalValues = {
        user_first_name: userData.user_first_name || "",
        user_last_name: userData.user_last_name || "",
        user_phone_number: userData.user_phone_number || "",
        user_profile_bio: userData.user_profile_bio || "",
        user_general_interests: userData.user_general_interests ? JSON.parse(userData.user_general_interests) : [],
        user_date_interests: userData.user_date_interests ? JSON.parse(userData.user_date_interests) : [],
        user_available_time: userData.user_available_time ? JSON.parse(userData.user_available_time) : [],
        user_birthdate: userData.user_birthdate || "",
        user_height: userData.user_height || "",
        user_kids: userData.user_kids?.toString() || "0",
        user_gender: userData.user_gender || "",
        user_identity: userData.user_identity || "",
        user_sexuality: userData.user_sexuality || "",
        user_open_to: userData.user_open_to ? JSON.parse(userData.user_open_to) : [],
        user_address: userData.user_address || "",
        user_nationality: userData.user_nationality || "",
        user_body_composition: userData.user_body_composition || "",
        user_education: userData.user_education || "",
        user_job: userData.user_job || "",
        user_smoking: userData.user_smoking || "",
        user_drinking: userData.user_drinking || "",
        user_religion: userData.user_religion || "",
        user_star_sign: userData.user_star_sign || "",
        user_latitude: userData.user_latitude?.toString() || "",
        user_longitude: userData.user_longitude?.toString() || "",
      };

      // Create an object of the new values
      const newValues = {
        user_first_name: formValues.firstName,
        user_last_name: formValues.lastName,
        user_phone_number: formValues.phoneNumber,
        user_profile_bio: formValues.bio,
        user_general_interests: interests,
        user_date_interests: dateTypes,
        user_available_time: formValues.availableTimes,
        user_birthdate: formValues.birthdate,
        user_height: Math.round((parseInt(heightFt || 0) * 12 + parseInt(heightIn || 0)) * 2.54).toString(),
        user_kids: formValues.children.toString(),
        user_gender: genderValue,
        user_identity: identityValue,
        user_sexuality: orientationValue,
        user_open_to: openToValue,
        user_address: formValues.address,
        user_nationality: formValues.nationality,
        user_body_composition: bodyTypeValue,
        user_education: educationValue,
        user_job: formValues.job,
        user_smoking: smokingValue,
        user_drinking: drinkingValue,
        user_religion: religionValue,
        user_star_sign: starSignValue,
        user_latitude: formValues.latitude?.toString(),
        user_longitude: formValues.longitude?.toString(),
      };

      // Debug log for values before sending
      console.log("\n=== Original Values ===");
      console.log(JSON.stringify(originalValues, null, 2));
      console.log("\n=== New Values ===");
      console.log(JSON.stringify(newValues, null, 2));

      // Only add fields that have changed to the FormData
      console.log("\n=== Changed Fields ===");
      Object.entries(newValues).forEach(([key, value]) => {
        const originalValue = originalValues[key];
        const newValueStr = typeof value === "object" ? JSON.stringify(value) : value;
        const originalValueStr = typeof originalValue === "object" ? JSON.stringify(originalValue) : originalValue;

        if (newValueStr !== originalValueStr) {
          console.log(`${key}: ${originalValueStr} -> ${newValueStr}`);
          uploadData.append(key, newValueStr);
        }
      });

      // Log the final FormData contents
      console.log("\n=== Final FormData Contents ===");
      for (let [key, value] of uploadData._parts) {
        console.log(`${key}: ${value}`);
      }

      // Make the upload request
      const response = await axios.put("https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo", uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
        timeout: 60000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      if (response.status === 200) {
        console.log("Upload successful!");
        Alert.alert("Success", "Your profile has been updated!");
        navigation.goBack();
      }
    } catch (error) {
      console.log("Error uploading profile:", error.response?.data || error);
      Alert.alert("Error", "Failed to update profile. Please check your internet connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Remove the compression utility functions
  const getFileSize = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob.size;
    } catch (error) {
      console.error("Error getting file size:", error);
      return 0;
    }
  };

  // Toggle a single interest
  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      // If it's already selected, remove it
      setInterests(interests.filter((item) => item !== interest));
    } else {
      // Otherwise, add it
      setInterests([...interests, interest]);
    }
  };

  // Handle adding and removing date types
  const handleAddDateType = () => {
    setEntryType("dateType");
    setModalVisible(true);
  };

  const handleRemoveDateType = (index) => {
    setDateTypes((prev) => prev.filter((_, i) => i !== index));
  };

  // Add this effect to check for changes
  useEffect(() => {
    if (originalValues) {
      console.log("\n=== Checking for Changes ===");
      console.log("Original Values:", originalValues);
      console.log("Current Form Values:", formValues);
      console.log("Original Photos:", JSON.parse(userData.user_photo_url || "[]"));
      console.log(
        "Current Photos:",
        photos.filter((p) => p !== null)
      );
      console.log("Original Video:", userData.user_video_url);
      console.log("Current Video:", videoUri);

      const hasAnyChanges =
        JSON.stringify(formValues) !== JSON.stringify(originalValues) ||
        JSON.stringify(photos.filter((p) => p !== null)) !== JSON.stringify(JSON.parse(userData.user_photo_url || "[]")) ||
        videoUri !== userData.user_video_url;

      console.log("Has Changes:", hasAnyChanges);
      console.log("=== End Check ===\n");

      setHasChanges(hasAnyChanges);
    }
  }, [formValues, photos, videoUri, originalValues]);

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#E4423F' />
        </View>
      ) : (
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps='handled'
          enableOnAndroid={true}
          enableResetScrollToCoords={false}
        >
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
            {/* <TextInput
              label='First Name'
              mode='outlined'
              style={styles.inputField}
              value={formValues.firstName}
              onChangeText={(text) =>
                setFormValues((prev) => ({
                  ...prev,
                  firstName: text,
                }))
              }
              outlineStyle={styles.textInputOutline}
            /> */}
            <TextInput
              label='First Name'
              mode='outlined'
              style={styles.inputField}
              value={formValues.firstName}
              onChangeText={(text) =>
                setFormValues((prev) => ({
                  ...prev,
                  firstName: text.trim(),
                }))
              }
              autoCorrect={false}
              autoCapitalize='none'
              outlineStyle={styles.textInputOutline}
            />

            <TextInput
              label='Last Name'
              mode='outlined'
              style={styles.inputField}
              value={formValues.lastName}
              onChangeText={(text) =>
                setFormValues((prev) => ({
                  ...prev,
                  lastName: text.trim(),
                }))
              }
              autoCorrect={false}
              autoCapitalize='none'
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label='Phone Number'
              mode='outlined'
              style={styles.inputField}
              value={formValues.phoneNumber}
              onChangeText={(text) =>
                setFormValues((prev) => ({
                  ...prev,
                  phoneNumber: text.trim(),
                }))
              }
              autoCorrect={false}
              autoCapitalize='none'
              outlineStyle={styles.textInputOutline}
            />
            <TextInput
              label='Bio'
              mode='outlined'
              style={styles.inputField}
              multiline
              value={formValues.bio}
              onChangeText={(text) =>
                setFormValues((prev) => ({
                  ...prev,
                  bio: text.trim(),
                }))
              }
              autoCorrect={false}
              autoCapitalize='none'
              outlineStyle={styles.textInputOutline}
            />

            {/* Interests as Tag Buttons */}
            <Text style={styles.label}>My Interests</Text>
            <View style={styles.interestsContainer}>
              {allInterests.map((interest) => {
                const isSelected = interests.includes(interest);
                return (
                  <TouchableOpacity
                    key={interest}
                    onPress={() => toggleInterest(interest)}
                    style={[
                      styles.interestButton,
                      {
                        borderColor: isSelected ? "rgba(26, 26, 26, 1)" : "rgba(26, 26, 26, 0.5)",
                        backgroundColor: isSelected ? "#000" : "#FFF",
                      },
                    ]}
                  >
                    <Text style={[styles.interestText, { color: isSelected ? "#FFF" : "rgba(26, 26, 26, 0.5)" }]}>{interest}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

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
            <Text style={styles.label}>Gender assigned at birth</Text>
            <DropDownPicker
              open={genderOpen}
              value={genderValue}
              items={genderItems}
              setOpen={setGenderOpen}
              setValue={setGenderValue}
              setItems={setGenderItems}
              placeholder='Select Gender assigned at birth'
              style={{
                backgroundColor: "#F9F9F9",
                borderColor: "#E4423F",
                marginBottom: genderOpen ? 100 : 15,
                zIndex: 10000,
                elevation: 10000,
              }}
              listMode='SCROLLVIEW'
              scrollViewProps={{
                nestedScrollEnabled: true,
              }}
              textStyle={{
                fontSize: 16,
              }}
              dropDownContainerStyle={{
                backgroundColor: "#F9F9F9",
                borderColor: "#E4423F",
                position: "absolute",
                zIndex: 10000,
                elevation: 10000,
              }}
              onChangeValue={(value) => {
                setFormValues((prev) => ({ ...prev, gender: value }));
              }}
            />

            {/* Identity */}
            <Text style={styles.label}>Identity</Text>
            <DropDownPicker
              open={identityOpen}
              value={identityValue}
              items={identityItems}
              setOpen={setIdentityOpen}
              setValue={setIdentityValue}
              setItems={setIdentityItems}
              placeholder='Select Identity'
              style={{
                backgroundColor: "#F9F9F9",
                borderColor: "#E4423F",
                marginBottom: identityOpen ? 100 : 15,
                zIndex: 9500,
                elevation: 9500,
              }}
              listMode='SCROLLVIEW'
              scrollViewProps={{
                nestedScrollEnabled: true,
              }}
              textStyle={{
                fontSize: 16,
              }}
              dropDownContainerStyle={{
                backgroundColor: "#F9F9F9",
                borderColor: "#E4423F",
                position: "absolute",
                zIndex: 9500,
                elevation: 9500,
              }}
              onChangeValue={(value) => {
                setFormValues((prev) => ({ ...prev, identity: value }));
              }}
            />

            {/* Commenting out Sexual Orientation section
            <Text style={styles.label}>Sexual Orientation</Text>
            <DropDownPicker
              open={orientationOpen}
              value={orientationValue}
              items={orientationItems}
              setOpen={setOrientationOpen}
              setValue={setOrientationValue}
              setItems={setOrientationItems}
              placeholder='Select Orientation'
              listMode='SCROLLVIEW'
              scrollViewProps={{
                nestedScrollEnabled: true,
              }}
              style={{
                ...styles.dropdownStyle,
                zIndex: 9000,
                elevation: 9000,
              }}
              textStyle={styles.dropdownTextStyle}
              dropDownContainerStyle={{
                ...styles.dropdownContainerStyle,
                position: "absolute",
                zIndex: 9000,
                elevation: 9000,
              }}
              onChangeValue={(value) => setFormValues((prev) => ({ ...prev, orientation: value }))}
            />
            */}

            {/* Open To */}
            <Text style={styles.label}>Open To</Text>
            <View style={[styles.dropdownWrapper, openToOpen ? { zIndex: 1000 } : { zIndex: 1 }]}>
              <DropDownPicker
                open={openToOpen}
                value={openToValue}
                items={openToItems}
                setOpen={setOpenToOpen}
                setValue={setOpenToValue}
                setItems={setOpenToItems}
                placeholder='Select Open To (Multiple)'
                multiple={true}
                mode='BADGE'
                badgeDotColors={["#E4423F"]}
                listMode='SCROLLVIEW'
                scrollViewProps={{
                  nestedScrollEnabled: true,
                }}
                style={styles.dropdownStyle}
                textStyle={styles.dropdownTextStyle}
                dropDownContainerStyle={{
                  ...styles.dropdownContainerStyle,
                  position: "absolute",
                }}
                onChangeValue={(value) => setFormValues((prev) => ({ ...prev, openTo: value }))}
              />
            </View>

            {/* Smoking */}
            <Text style={styles.label}>Smoking</Text>
            <View style={[styles.dropdownWrapper, smokingOpen ? { zIndex: 1000 } : { zIndex: 1 }]}>
              <DropDownPicker
                open={smokingOpen}
                value={smokingValue}
                items={smokingItems}
                setOpen={setSmokingOpen}
                setValue={setSmokingValue}
                setItems={setSmokingItems}
                placeholder='Select Smoking Preference'
                listMode='SCROLLVIEW'
                scrollViewProps={{
                  nestedScrollEnabled: true,
                }}
                style={styles.dropdownStyle}
                textStyle={styles.dropdownTextStyle}
                dropDownContainerStyle={{
                  ...styles.dropdownContainerStyle,
                  position: "absolute",
                }}
                onChangeValue={(value) => setFormValues((prev) => ({ ...prev, smoking: value }))}
              />
            </View>

            {/* Drinking */}
            <Text style={styles.label}>Drinking</Text>
            <View style={[styles.dropdownWrapper, drinkingOpen ? { zIndex: 1000 } : { zIndex: 1 }]}>
              <DropDownPicker
                open={drinkingOpen}
                value={drinkingValue}
                items={drinkingItems}
                setOpen={setDrinkingOpen}
                setValue={setDrinkingValue}
                setItems={setDrinkingItems}
                placeholder='Select Drinking Preference'
                listMode='SCROLLVIEW'
                scrollViewProps={{
                  nestedScrollEnabled: true,
                }}
                style={styles.dropdownStyle}
                textStyle={styles.dropdownTextStyle}
                dropDownContainerStyle={{
                  ...styles.dropdownContainerStyle,
                  position: "absolute",
                }}
                onChangeValue={(value) => setFormValues((prev) => ({ ...prev, drinking: value }))}
              />
            </View>

            {/* Religion */}
            <Text style={styles.label}>Religion</Text>
            <View style={[styles.dropdownWrapper, religionOpen ? { zIndex: 1000 } : { zIndex: 1 }]}>
              <DropDownPicker
                open={religionOpen}
                value={religionValue}
                items={religionItems}
                setOpen={setReligionOpen}
                setValue={setReligionValue}
                setItems={setReligionItems}
                placeholder='Select Religion'
                listMode='SCROLLVIEW'
                scrollViewProps={{
                  nestedScrollEnabled: true,
                }}
                style={styles.dropdownStyle}
                textStyle={styles.dropdownTextStyle}
                dropDownContainerStyle={{
                  ...styles.dropdownContainerStyle,
                  position: "absolute",
                }}
                onChangeValue={(value) => setFormValues((prev) => ({ ...prev, religion: value }))}
              />
            </View>

            {/* Star Sign */}
            <Text style={styles.label}>Star Sign</Text>
            <View style={[styles.dropdownWrapper, starSignOpen ? { zIndex: 1000 } : { zIndex: 1 }]}>
              <DropDownPicker
                open={starSignOpen}
                value={starSignValue}
                items={starSignItems}
                setOpen={setStarSignOpen}
                setValue={setStarSignValue}
                setItems={setStarSignItems}
                placeholder='Select Star Sign'
                listMode='SCROLLVIEW'
                scrollViewProps={{
                  nestedScrollEnabled: true,
                }}
                style={styles.dropdownStyle}
                textStyle={styles.dropdownTextStyle}
                dropDownContainerStyle={{
                  ...styles.dropdownContainerStyle,
                  position: "absolute",
                }}
                onChangeValue={(value) => setFormValues((prev) => ({ ...prev, starSign: value }))}
              />
            </View>

            {/* Education */}
            <Text style={styles.label}>Education</Text>
            <View style={[styles.dropdownWrapper, educationOpen ? { zIndex: 1000 } : { zIndex: 1 }]}>
              <DropDownPicker
                open={educationOpen}
                value={educationValue}
                items={educationItems}
                setOpen={setEducationOpen}
                setValue={setEducationValue}
                setItems={setEducationItems}
                placeholder='Select Education'
                listMode='SCROLLVIEW'
                scrollViewProps={{
                  nestedScrollEnabled: true,
                }}
                style={styles.dropdownStyle}
                textStyle={styles.dropdownTextStyle}
                dropDownContainerStyle={{
                  ...styles.dropdownContainerStyle,
                  position: "absolute",
                }}
                onChangeValue={(value) => setFormValues((prev) => ({ ...prev, education: value }))}
              />
            </View>

            {/* Location */}
            <Text style={styles.label}>Address / Location</Text>
            {formValues.address && (
              <View style={styles.currentAddressContainer}>
                <Text style={styles.currentAddressText}>Current Address:</Text>
                <Text style={styles.addressValue}>{formValues.address}</Text>
              </View>
            )}
            <View style={styles.autocompleteContainer}>
              <GooglePlacesAutocomplete
                placeholder='Search your location...'
                fetchDetails={true}
                onPress={(data, details = null) => {
                  if (details) {
                    const { lat, lng } = details.geometry.location;
                    setLocation({ latitude: lat, longitude: lng });
                    setRegion((prev) => ({ ...prev, latitude: lat, longitude: lng }));
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
                enablePoweredByContainer={false}
                styles={{
                  container: {
                    flex: 0,
                    zIndex: 2000,
                  },
                  textInputContainer: {
                    width: "100%",
                  },
                  textInput: {
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
                    position: "absolute",
                    top: 50,
                    left: 0,
                    right: 0,
                    backgroundColor: "#FFF",
                    borderWidth: 1,
                    borderColor: "#DDD",
                    borderRadius: 5,
                    zIndex: 2000,
                    elevation: 2000,
                  },
                  row: {
                    padding: 13,
                    height: 44,
                  },
                }}
                listViewDisplayed={false}
                keyboardShouldPersistTaps='handled'
                nestedScrollEnabled={true}
              />
            </View>

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
              onChangeText={(text) =>
                setFormValues((prev) => ({
                  ...prev,
                  nationality: text.replace(/\s+/g, " ").trim(),
                }))
              }
              outlineStyle={styles.textInputOutline}
            />

            {/* Body Type */}
            <Text style={styles.label}>Body Type</Text>
            <View style={[styles.dropdownWrapper, bodyTypeOpen ? { zIndex: 1000 } : { zIndex: 1 }]}>
              <DropDownPicker
                open={bodyTypeOpen}
                value={bodyTypeValue}
                items={bodyTypeItems}
                setOpen={setBodyTypeOpen}
                setValue={setBodyTypeValue}
                setItems={setBodyTypeItems}
                placeholder='Select Body Type'
                listMode='SCROLLVIEW'
                scrollViewProps={{
                  nestedScrollEnabled: true,
                }}
                style={styles.dropdownStyle}
                textStyle={styles.dropdownTextStyle}
                dropDownContainerStyle={{
                  ...styles.dropdownContainerStyle,
                  position: "absolute",
                }}
                onChangeValue={(value) => setFormValues((prev) => ({ ...prev, bodyType: value }))}
              />
            </View>

            {/* Job */}
            <TextInput
              label='Job'
              mode='outlined'
              style={styles.inputField}
              value={formValues.job}
              onChangeText={(text) =>
                setFormValues((prev) => ({
                  ...prev,
                  job: text.replace(/\s+/g, " ").trim(),
                }))
              }
              outlineStyle={styles.textInputOutline}
            />
          </View>

          {/* Save Changes Button */}
          <TouchableOpacity onPress={hasChanges ? handleSaveChanges : () => navigation.goBack()} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>{hasChanges ? "Save Changes" : "Return to Profile"}</Text>
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
        </KeyboardAwareScrollView>
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
  dropdownStyle: {
    backgroundColor: "#F9F9F9",
    borderWidth: 0,
    borderRadius: 10,
    minHeight: 50,
  },
  dropdownTextStyle: {
    fontSize: 16,
  },
  dropdownContainerStyle: {
    backgroundColor: "#FFF",
    borderColor: "#E4423F",
    borderWidth: 1,
    borderRadius: 10,
  },
  autocompleteContainer: {
    flex: 0,
    position: "relative",
    zIndex: 1,
    backgroundColor: "white",
    marginBottom: 10,
  },
  dropdownWrapper: {
    marginBottom: 15,
  },
  selectedOptionsContainer: {
    marginTop: 10,
    marginLeft: 5,
  },
  selectedOptionItem: {
    fontSize: 16,
    color: "#333",
    marginVertical: 5,
    paddingLeft: 10,
  },
  currentAddressContainer: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E4423F",
  },
  currentAddressText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  addressValue: {
    fontSize: 16,
    color: "#000",
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: 20,
  },
  interestButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 30,
    margin: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  interestText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
