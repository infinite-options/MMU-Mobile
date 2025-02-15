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
  Dimensions,
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

const screenHeight = Dimensions.get("window").height;

// Add this near the top with other constants
const allDateTypes = ["Lunch", "Dinner", "Coffee", "Drinks", "Movies", "Surprise Me", "Other"];

// Add this zIndex configuration object
const DROPDOWN_ZINDEX = {
  GENDER: 3000,
  IDENTITY: 2900,
  OPEN_TO: 2800,
  SMOKING: 2700,
  DRINKING: 2600,
  RELIGION: 2500,
  STAR_SIGN: 2400,
  EDUCATION: 2300,
  BODY_TYPE: 2200,
};

export default function EditProfile() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const route = useNavigation().getState().routes[useNavigation().getState().index];

  const [userData, setUserData] = useState({});
  const [photos, setPhotos] = useState([null, null, null]); // array of photo URIs
  const [deletedPhotos, setDeletedPhotos] = useState([]); // Track deleted S3 photos
  const [favoritePhotoIndex, setFavoritePhotoIndex] = useState(null); // Track favorite photo
  const [isEditMode, setIsEditMode] = useState(true); // Track if we're in edit mode
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

  // -------------------------------
  // HEIGHT STATES & CONVERSION
  // -------------------------------
  // We store height as feet & inches (for the UI) as well as centimeters.
  // The endpoint always receives height in cm.
  const [heightFt, setHeightFt] = useState("5"); // stored as string
  const [heightIn, setHeightIn] = useState("11");
  const defaultCm = Math.round((5 * 12 + 11) * 2.54);
  const [heightCm, setHeightCm] = useState(defaultCm.toString());
  // heightUnit can be either "in" (for feet/inches) or "cm" (for centimeters)
  const [heightUnit, setHeightUnit] = useState("in");

  // -------------------------------
  // Other form states and dropdown states (e.g., gender, openTo, etc.)
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    bio: "",
    availableTimes: "",
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

  // Add these state variables at the top of your component
  const [openDropdown, setOpenDropdown] = useState(null);

  // Create a list of all dropdown identifiers
  const DROPDOWN_TYPES = {
    GENDER: "gender",
    IDENTITY: "identity",
    OPEN_TO: "openTo",
    SMOKING: "smoking",
    DRINKING: "drinking",
    RELIGION: "religion",
    STAR_SIGN: "starSign",
    EDUCATION: "education",
    BODY_TYPE: "bodyType",
  };

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

  // -------------------------------
  // HEIGHT CONVERSION HELPER FUNCTIONS
  // -------------------------------
  // Updates both inches UI and stored cm value.
  const updateHeightFromInches = (ft, inVal) => {
    const totalInch = ft * 12 + inVal;
    const normalizedFt = Math.floor(totalInch / 12);
    const normalizedIn = totalInch % 12;
    setHeightFt(normalizedFt.toString());
    setHeightIn(normalizedIn.toString());
    const cmValue = Math.round(totalInch * 2.54);
    setHeightCm(cmValue.toString());
  };

  // Updates both cm state and converts to inches.
  const updateHeightFromCm = (cmValue) => {
    setHeightCm(cmValue.toString());
    const totalIn = cmValue / 2.54;
    const ft = Math.floor(totalIn / 12);
    const inVal = Math.round(totalIn - ft * 12);
    setHeightFt(ft.toString());
    setHeightIn(inVal.toString());
  };

  // Toggle the height unit between "in" and "cm" and convert appropriately.
  const toggleHeightUnit = (unit) => {
    if (unit === heightUnit) return;
    if (unit === "cm") {
      // Convert current inches to cm.
      const ft = parseInt(heightFt) || 0;
      const inVal = parseInt(heightIn) || 0;
      const totalIn = ft * 12 + inVal;
      const cmValue = Math.round(totalIn * 2.54);
      setHeightCm(cmValue.toString());
      setHeightUnit("cm");
    } else if (unit === "in") {
      // Convert current cm to inches.
      const cmValue = parseInt(heightCm) || 0;
      const totalIn = cmValue / 2.54;
      const ft = Math.floor(totalIn / 12);
      const inVal = Math.round(totalIn - ft * 12);
      setHeightFt(ft.toString());
      setHeightIn(inVal.toString());
      setHeightUnit("in");
    }
  };

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
          availableTimes: fetched.user_available_time || "",
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
            // Remove any existing JSON encoding
            if (typeof rawVideoUrl === "string") {
              // Handle double-encoded strings
              const parsed = JSON.parse(rawVideoUrl);
              rawVideoUrl = Array.isArray(parsed) ? parsed[0] : parsed;

              // If result is still a string, parse again to remove quotes
              if (typeof parsed === "string") {
                rawVideoUrl = JSON.parse(parsed);
              }
            }
          } catch (err) {
            console.log("Could not parse video URL:", err);
          }

          // Ensure consistent string format
          const cleanedVideoUrl = typeof rawVideoUrl === "string" ? rawVideoUrl.replace(/^"+|"+$/g, "") : null;

          setVideoUri(cleanedVideoUrl);
          // Update the fetched data with cleaned URL
          fetched.user_video_url = cleanedVideoUrl;
        }

        // Convert stored cm back to feet/inches
        if (fetched.user_height) {
          const cm = parseInt(fetched.user_height);
          const totalInches = cm / 2.54;
          const feet = Math.floor(totalInches / 12);
          const inches = Math.round(totalInches % 12);

          setHeightFt(feet.toString());
          setHeightIn(inches.toString());
          setHeightCm(cm.toString());
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
        console.log("\n=== Image Selection Debug ===");
        console.log("Selected assets:", result.assets);
        for (const asset of result.assets) {
          const targetIndex = slotIndex + result.assets.indexOf(asset);
          if (targetIndex < 3) {
            newPhotos[targetIndex] = asset.uri;
            // Log image details when selected
            const size = await getFileSize(asset.uri);
            console.log(`\nImage ${targetIndex + 1} details:`);
            console.log(`- URI: ${asset.uri}`);
            console.log(`- File name: ${asset.uri.split("/").pop()}`);
            console.log(`- Size: ${(size / 1024 / 1024).toFixed(2)} MB`);
          }
        }
        console.log("\nFinal photos array:", newPhotos);
        console.log("=== End Image Selection Debug ===\n");
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
    const photoToRemove = photos[slotIndex];
    console.log("\n=== Removing Photo ===");
    console.log("Removing photo at index:", slotIndex);
    console.log("Photo being removed:", photoToRemove);

    // If it's an S3 photo, add it to deletedPhotos array
    if (photoToRemove && photoToRemove.startsWith("https://s3")) {
      console.log("Adding S3 photo to deletedPhotos array");
      setDeletedPhotos((prev) => [...prev, photoToRemove]);
    }

    const newPhotos = photos.map((photo, index) => (index === slotIndex ? null : photo));
    console.log("Updated photos array:", newPhotos);
    console.log("=== End Remove Photo ===\n");
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

  // Add this after the useEffect that fetches user data
  useEffect(() => {
    if (userData.user_favorite_photo) {
      // Find the index of the favorite photo in the photos array
      const index = photos.findIndex((photo) => photo === userData.user_favorite_photo);
      setFavoritePhotoIndex(index >= 0 ? index : null);
    }
  }, [userData, photos]);

  const handleSetFavoritePhoto = (index) => {
    if (isEditMode) {
      setFavoritePhotoIndex(favoritePhotoIndex === index ? null : index);
    }
  };

  // Add this effect to check for changes
  useEffect(() => {
    const hasPhotoChanges =
      JSON.stringify(photos.filter((p) => p !== null)) !== JSON.stringify(JSON.parse(userData.user_photo_url || "[]")) ||
      deletedPhotos.length > 0 ||
      (favoritePhotoIndex !== null ? photos[favoritePhotoIndex] : null) !== userData.user_favorite_photo;

    setHasChanges(hasPhotoChanges || Object.keys(formValues).some((key) => formValues[key] !== userData[key]));
  }, [photos, deletedPhotos, favoritePhotoIndex, formValues, userData]);

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

      console.log("\n=== Debug Photo Arrays ===");
      console.log("Original photos array:", originalPhotos);
      console.log("Current photos array:", photoUrls);
      console.log("Deleted photos array:", deletedPhotos);
      console.log("=== End Debug ===\n");

      // Create FormData object
      const uploadData = new FormData();
      uploadData.append("user_uid", userData.user_uid);
      uploadData.append("user_email_id", userData.user_email_id);

      // Separate S3 photos from new local photos
      const s3Photos = [];
      const newLocalPhotos = [];

      photos.forEach((uri) => {
        if (uri) {
          if (uri.startsWith("https://s3")) {
            s3Photos.push(uri);
          } else {
            newLocalPhotos.push(uri);
          }
        }
      });

      console.log("\n=== Photo Upload Debug ===");
      console.log("S3 Photos to keep:", s3Photos);
      console.log("New Local Photos to upload:", newLocalPhotos);
      console.log("S3 Photos to delete:", deletedPhotos);

      // Add existing S3 photos as user_photo_url array
      if (s3Photos.length > 0) {
        uploadData.append("user_photo_url", JSON.stringify(s3Photos));
      }

      // Add deleted photos array if any photos were deleted
      if (deletedPhotos.length > 0) {
        uploadData.append("user_delete_photo", JSON.stringify(deletedPhotos));
      }

      // Add new local photos as img_0, img_1, etc.
      newLocalPhotos.forEach((uri, index) => {
        console.log(`Adding new local photo ${index}:`, uri);
        uploadData.append(`img_${index}`, {
          uri,
          type: "image/jpeg",
          name: `img_${index}.jpg`,
        });
      });

      console.log("=== End Photo Upload Debug ===\n");

      // Create an object of the original values from userData
      const originalValues = {
        user_first_name: userData.user_first_name || "",
        user_last_name: userData.user_last_name || "",
        user_phone_number: userData.user_phone_number || "",
        user_profile_bio: userData.user_profile_bio || "",
        user_general_interests: userData.user_general_interests ? JSON.parse(userData.user_general_interests) : [],
        user_date_interests: userData.user_date_interests ? JSON.parse(userData.user_date_interests) : [],
        user_available_time: userData.user_available_time || "",
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
        user_height: heightCm,
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

      // Add favorite photo to upload data if one is selected
      if (favoritePhotoIndex !== null && photos[favoritePhotoIndex]) {
        const isNewPhoto = !photos[favoritePhotoIndex].startsWith("https://s3");
        uploadData.append("user_favorite_photo", isNewPhoto ? `img_${newLocalPhotos.indexOf(photos[favoritePhotoIndex])}` : photos[favoritePhotoIndex]);
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
        setIsEditMode(false); // Exit edit mode after successful save
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
                    {(isEditMode || favoritePhotoIndex === idx) && (
                      <TouchableOpacity onPress={() => handleSetFavoritePhoto(idx)} style={styles.heartIconBottomRight}>
                        <View style={styles.heartIconBackground}>
                          <Ionicons name={favoritePhotoIndex === idx ? "heart" : "heart-outline"} size={20} color={favoritePhotoIndex === idx ? "#E4423F" : "#FFF"} />
                        </View>
                      </TouchableOpacity>
                    )}
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
            <Text style={styles.label}>First Name</Text>
            <TextInput
              placeholder='First Name'
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

            <Text style={styles.label}>Last Name</Text>
            <TextInput
              placeholder='Last Name'
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
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              placeholder='Phone Number'
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
            <Text style={styles.label}>Bio</Text>
            <TextInput
              placeholder='Bio'
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
            <View style={styles.interestsContainer}>
              {allDateTypes.map((dateType) => {
                const isSelected = dateTypes.includes(dateType);
                return (
                  <TouchableOpacity
                    key={dateType}
                    onPress={() => {
                      if (dateTypes.includes(dateType)) {
                        setDateTypes((prev) => prev.filter((t) => t !== dateType));
                      } else {
                        setDateTypes((prev) => [...prev, dateType]);
                      }
                    }}
                    style={[
                      styles.interestButton,
                      {
                        borderColor: isSelected ? "rgba(26, 26, 26, 1)" : "rgba(26, 26, 26, 0.5)",
                        backgroundColor: isSelected ? "#000" : "#FFF",
                      },
                    ]}
                  >
                    <Text style={[styles.interestText, { color: isSelected ? "#FFF" : "rgba(26, 26, 26, 0.5)" }]}>{dateType}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* My Availability - Display only */}
            <View style={styles.sectionContainer}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.sectionTitle}>My Availability</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() =>
                    navigation.navigate("DateAvailability", {
                      fromEditProfile: true,
                      onSave: () => navigation.navigate("EditProfile"),
                    })
                  }
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {formValues.availableTimes ? (
                  JSON.parse(formValues.availableTimes).map((time, index) => {
                    const days = time.day.split(", ");
                    const dayRange = days.length > 1 ? (days.length === 2 ? days.join(" & ") : `${days[0]}-${days[days.length - 1]}`) : days[0];

                    const isAllDay = time.start_time === "12:00 AM" && time.end_time === "11:59 PM";
                    const formatTime = (t) => {
                      const [timePart, modifier] = t.split(" ");
                      let [hours, minutes] = timePart.split(":");
                      hours = parseInt(hours);
                      const displayHours = hours % 12 || 12;
                      const ampm = modifier.toLowerCase();
                      return `${displayHours}${minutes !== "00" ? `:${minutes}` : ""} ${ampm}`;
                    };

                    return (
                      <Text key={index} style={styles.timeSlot}>
                        {isAllDay ? `${dayRange}, all day` : `${dayRange}, ${formatTime(time.start_time)} to ${formatTime(time.end_time)}`}
                      </Text>
                    );
                  })
                ) : (
                  <Text style={styles.emptyStateText}>No availability set</Text>
                )}
              </View>
            </View>

            <Text style={styles.label}>Birthdate</Text>
            <TextInput
              placeholder='Birthdate'
              mode='outlined'
              style={styles.inputField}
              value={formValues.birthdate}
              onChangeText={(text) => setFormValues({ ...formValues, birthdate: text })}
              outlineStyle={styles.textInputOutline}
            />

            {/* Height Input */}
            <Text style={styles.label}>Height</Text>
            <View style={styles.inputField}>
              {/* Toggle Pill Container */}
              <View style={styles.heightToggleContainer}>
                <TouchableOpacity style={[styles.togglePill, heightUnit === "in" && styles.togglePillActive]} onPress={() => toggleHeightUnit("in")}>
                  <Text style={[styles.togglePillText, heightUnit === "in" && styles.togglePillActiveText]}>Inches</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.togglePill, heightUnit === "cm" && styles.togglePillActive]} onPress={() => toggleHeightUnit("cm")}>
                  <Text style={[styles.togglePillText, heightUnit === "cm" && styles.togglePillActiveText]}>Centimeters</Text>
                </TouchableOpacity>
              </View>

              {heightUnit === "in" ? (
                <View style={styles.heightContainer}>
                  {/* Feet Controls */}
                  <View style={styles.heightControlGroup}>
                    <TouchableOpacity style={styles.heightButton} onPress={() => updateHeightFromInches(Math.max(0, parseInt(heightFt) - 1), parseInt(heightIn))}>
                      <Text style={styles.buttonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.heightValue}>{heightFt} ft</Text>
                    <TouchableOpacity style={styles.heightButton} onPress={() => updateHeightFromInches(parseInt(heightFt) + 1, parseInt(heightIn))}>
                      <Text style={styles.buttonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  {/* Inches Controls */}
                  <View style={styles.heightControlGroup}>
                    <TouchableOpacity style={styles.heightButton} onPress={() => updateHeightFromInches(parseInt(heightFt), Math.max(0, parseInt(heightIn) - 1))}>
                      <Text style={styles.buttonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.heightValue}>{heightIn} in</Text>
                    <TouchableOpacity style={styles.heightButton} onPress={() => updateHeightFromInches(parseInt(heightFt), parseInt(heightIn) + 1)}>
                      <Text style={styles.buttonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.heightContainer}>
                  <View style={styles.heightControlGroup}>
                    <TouchableOpacity style={styles.heightButton} onPress={() => updateHeightFromCm(Math.max(0, parseInt(heightCm) - 1))}>
                      <Text style={styles.buttonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.heightValue}>{heightCm} cm</Text>
                    <TouchableOpacity style={styles.heightButton} onPress={() => updateHeightFromCm(parseInt(heightCm) + 1)}>
                      <Text style={styles.buttonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* # of Children */}
            <Text style={styles.label}># of Children</Text>
            <TextInput
              placeholder='# of Children'
              mode='outlined'
              style={styles.inputField}
              value={formValues.children.toString()}
              onChangeText={(text) => setFormValues({ ...formValues, children: parseInt(text) })}
              keyboardType='numeric'
              outlineStyle={styles.textInputOutline}
            />

            {/* Gender */}
            <Text style={styles.label}>Gender assigned at birth</Text>
            <View style={[styles.dropdownWrapper, openDropdown === DROPDOWN_TYPES.GENDER ? { zIndex: DROPDOWN_ZINDEX.GENDER } : { zIndex: 1 }]}>
              <DropDownPicker
                open={openDropdown === DROPDOWN_TYPES.GENDER}
                zIndex={DROPDOWN_ZINDEX.GENDER}
                zIndexInverse={1000}
                onOpen={() => setOpenDropdown(DROPDOWN_TYPES.GENDER)}
                onClose={() => setOpenDropdown(null)}
                value={genderValue}
                items={genderItems}
                setValue={setGenderValue}
                setItems={setGenderItems}
                placeholder='Select Gender assigned at birth'
                style={styles.dropdownStyle}
                listMode='SCROLLVIEW'
                scrollViewProps={{
                  nestedScrollEnabled: true,
                }}
                textStyle={styles.dropdownTextStyle}
                dropDownContainerStyle={{
                  ...styles.dropdownContainerStyle,
                  position: "absolute",
                }}
                onChangeValue={(value) => setFormValues((prev) => ({ ...prev, gender: value }))}
              />
            </View>

            {/* Identity */}
            <Text style={styles.label}>Identity</Text>
            <View style={[styles.dropdownWrapper, openDropdown === DROPDOWN_TYPES.IDENTITY ? { zIndex: DROPDOWN_ZINDEX.IDENTITY } : { zIndex: 1 }]}>
              <DropDownPicker
                open={openDropdown === DROPDOWN_TYPES.IDENTITY}
                zIndex={DROPDOWN_ZINDEX.IDENTITY}
                zIndexInverse={1000}
                onOpen={() => setOpenDropdown(DROPDOWN_TYPES.IDENTITY)}
                onClose={() => setOpenDropdown(null)}
                value={identityValue}
                items={identityItems}
                setValue={setIdentityValue}
                setItems={setIdentityItems}
                placeholder='Select Identity'
                style={styles.dropdownStyle}
                listMode='SCROLLVIEW'
                scrollViewProps={{
                  nestedScrollEnabled: true,
                }}
                textStyle={styles.dropdownTextStyle}
                dropDownContainerStyle={{
                  ...styles.dropdownContainerStyle,
                  position: "absolute",
                }}
                onChangeValue={(value) => setFormValues((prev) => ({ ...prev, identity: value }))}
              />
            </View>

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
            <View style={[styles.dropdownWrapper, openDropdown === DROPDOWN_TYPES.OPEN_TO ? { zIndex: DROPDOWN_ZINDEX.OPEN_TO } : { zIndex: 1 }]}>
              <DropDownPicker
                open={openDropdown === DROPDOWN_TYPES.OPEN_TO}
                zIndex={DROPDOWN_ZINDEX.OPEN_TO}
                zIndexInverse={1000}
                onOpen={() => setOpenDropdown(DROPDOWN_TYPES.OPEN_TO)}
                onClose={() => setOpenDropdown(null)}
                value={openToValue}
                items={openToItems}
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
            <View style={[styles.dropdownWrapper, openDropdown === DROPDOWN_TYPES.SMOKING ? { zIndex: DROPDOWN_ZINDEX.SMOKING } : { zIndex: 1 }]}>
              <DropDownPicker
                open={openDropdown === DROPDOWN_TYPES.SMOKING}
                zIndex={DROPDOWN_ZINDEX.SMOKING}
                zIndexInverse={1000}
                onOpen={() => setOpenDropdown(DROPDOWN_TYPES.SMOKING)}
                onClose={() => setOpenDropdown(null)}
                value={smokingValue}
                items={smokingItems}
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
            <View style={[styles.dropdownWrapper, openDropdown === DROPDOWN_TYPES.DRINKING ? { zIndex: DROPDOWN_ZINDEX.DRINKING } : { zIndex: 1 }]}>
              <DropDownPicker
                open={openDropdown === DROPDOWN_TYPES.DRINKING}
                zIndex={DROPDOWN_ZINDEX.DRINKING}
                zIndexInverse={1000}
                onOpen={() => setOpenDropdown(DROPDOWN_TYPES.DRINKING)}
                onClose={() => setOpenDropdown(null)}
                value={drinkingValue}
                items={drinkingItems}
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
            <View style={[styles.dropdownWrapper, openDropdown === DROPDOWN_TYPES.RELIGION ? { zIndex: DROPDOWN_ZINDEX.RELIGION } : { zIndex: 1 }]}>
              <DropDownPicker
                open={openDropdown === DROPDOWN_TYPES.RELIGION}
                zIndex={DROPDOWN_ZINDEX.RELIGION}
                zIndexInverse={1000}
                onOpen={() => setOpenDropdown(DROPDOWN_TYPES.RELIGION)}
                onClose={() => setOpenDropdown(null)}
                value={religionValue}
                items={religionItems}
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
            <View style={[styles.dropdownWrapper, openDropdown === DROPDOWN_TYPES.STAR_SIGN ? { zIndex: DROPDOWN_ZINDEX.STAR_SIGN } : { zIndex: 1 }]}>
              <DropDownPicker
                open={openDropdown === DROPDOWN_TYPES.STAR_SIGN}
                zIndex={DROPDOWN_ZINDEX.STAR_SIGN}
                zIndexInverse={1000}
                onOpen={() => setOpenDropdown(DROPDOWN_TYPES.STAR_SIGN)}
                onClose={() => setOpenDropdown(null)}
                value={starSignValue}
                items={starSignItems}
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
            <View style={[styles.dropdownWrapper, openDropdown === DROPDOWN_TYPES.EDUCATION ? { zIndex: DROPDOWN_ZINDEX.EDUCATION } : { zIndex: 1 }]}>
              <DropDownPicker
                open={openDropdown === DROPDOWN_TYPES.EDUCATION}
                zIndex={DROPDOWN_ZINDEX.EDUCATION}
                zIndexInverse={1000}
                onOpen={() => setOpenDropdown(DROPDOWN_TYPES.EDUCATION)}
                onClose={() => setOpenDropdown(null)}
                value={educationValue}
                items={educationItems}
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

            <Text style={styles.label}>Nationality</Text>
            <TextInput
              placeholder='Nationality'
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
            <View style={[styles.dropdownWrapper, openDropdown === DROPDOWN_TYPES.BODY_TYPE ? { zIndex: DROPDOWN_ZINDEX.BODY_TYPE } : { zIndex: 1 }]}>
              <DropDownPicker
                open={openDropdown === DROPDOWN_TYPES.BODY_TYPE}
                zIndex={DROPDOWN_ZINDEX.BODY_TYPE}
                zIndexInverse={1000}
                onOpen={() => setOpenDropdown(DROPDOWN_TYPES.BODY_TYPE)}
                onClose={() => setOpenDropdown(null)}
                value={bodyTypeValue}
                items={bodyTypeItems}
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
            <Text style={styles.label}>Job</Text>
            <TextInput
              placeholder='Job'
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
          <TouchableOpacity style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]} onPress={handleSaveChanges} disabled={!hasChanges}>
            <Text style={styles.saveButtonText}>{hasChanges ? "Save Changes" : "No Changes"}</Text>
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
      {openDropdown && <Pressable style={styles.dropdownOverlay} onPress={() => setOpenDropdown(null)} pointerEvents='box-none' />}
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
  heightToggleContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  togglePill: {
    borderWidth: 1,
    borderColor: "#E4423F",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  togglePillActive: {
    backgroundColor: "#E4423F",
  },
  togglePillText: {
    fontSize: 14,
    color: "#E4423F",
  },
  togglePillActiveText: {
    color: "#FFF",
  },
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
    // Additional styling for the add button (if needed)
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
    zIndex: 2000,
    elevation: 2000,
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
  heartIconBottomRight: {
    position: "absolute",
    bottom: 5,
    right: 5,
    zIndex: 1,
  },
  heartIconBackground: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 15,
    padding: 5,
  },
  saveButtonDisabled: {
    backgroundColor: "#ccc",
  },
  dropdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1900,
    backgroundColor: "transparent",
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  timeSlot: {
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#E4423F",
    borderRadius: 5,
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
  },
  helperText: {
    fontSize: 12,
    color: "#999",
  },
  editButton: {
    padding: 10,
    backgroundColor: "#E4423F",
    borderRadius: 5,
    marginLeft: 10,
  },
  editButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});
