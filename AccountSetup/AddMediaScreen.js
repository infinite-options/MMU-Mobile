import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Pressable, Image, Platform, StatusBar, Alert, ActivityIndicator, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ProgressBar from "../src/Assets/Components/ProgressBar";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";

export default function AddMediaScreen({ navigation }) {
  // Basic user info from AsyncStorage
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  // Limit to 3 photos. If you already have server data, you can fill these slots.
  // Example: [null, null, null] by default.
  const [photos, setPhotos] = useState([null, null, null]);
  const [delphotos, setdelphotos] = useState([null, null, null]);

  // Single video slot
  const [videoUri, setVideoUri] = useState(null);
  const [delvideoUri, setdelvideoUri] = useState(null);
  const videoRef = useRef(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // For showing a loading overlay while uploading
  const [isLoading, setIsLoading] = useState(false);
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

  // On mount: request permissions & fetch user data from server
  useEffect(() => {
    const requestPermissionsAndFetchUserData = async () => {
      // 1) Ask for photo library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "This app needs permission to access your photo library.");
      }

      // 2) Get user info from AsyncStorage
      try {
        const storedUserId = await AsyncStorage.getItem("user_uid");
        const storedUserEmail = await AsyncStorage.getItem("user_email_id");
        console.log("Stored user data:", storedUserId, storedUserEmail);
        if (storedUserId && storedUserEmail) {
          setUserId(storedUserId);
          setUserEmail(storedUserEmail);
          await fetchUserData(storedUserId);
        } else {
          Alert.alert("User data not found", "Please log in again.");
          navigation.navigate("Login");
        }
      } catch (e) {
        console.error("Error fetching user data from AsyncStorage", e);
      }
    };

    requestPermissionsAndFetchUserData();
  }, []);

  // Fetch existing images/video from your backend
  const fetchUserData = async (uid) => {
    try {
      const response = await axios.get(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${uid}`);
      const fetchedData = response.data.result[0] || {};
      console.log("Fetched user data:", fetchedData);

      // ========== Photo handling (unchanged) ==========
      if (fetchedData.user_photo_url) {
        const imageArray = JSON.parse(fetchedData.user_photo_url);
        // We only have 3 slots, fill them from the array
        const newPhotos = [null, null, null];
        imageArray.forEach((uri, idx) => {
          if (idx < 3) newPhotos[idx] = uri;
        });
        console.log("fetched photos:", newPhotos);
        setPhotos(newPhotos);
      }

      // ========== Video handling (Option B) ==========
      if (fetchedData.user_video_url) {
        let rawVideoUrl = fetchedData.user_video_url;

        // Check if the URL needs parsing (only try to parse if it looks like a JSON string)
        if (typeof rawVideoUrl === "string" && (rawVideoUrl.startsWith('"') || rawVideoUrl.startsWith("["))) {
          try {
            rawVideoUrl = JSON.parse(rawVideoUrl);
            // e.g. "\"https://s3.us-west-1.amazonaws.com/...\"" -> "https://s3.us-west-1.amazonaws.com/..."
          } catch (err) {
            console.warn("Could not JSON-parse user_video_url. Using as-is:", err);
            // Continue with the raw string
          }
        }

        // If there's still extra quotes, you can remove them manually:
        if (typeof rawVideoUrl === "string" && rawVideoUrl.startsWith('"') && rawVideoUrl.endsWith('"')) {
          rawVideoUrl = rawVideoUrl.slice(1, -1);
        }

        console.log("Cleaned fetched video url:", rawVideoUrl);
        setVideoUri(rawVideoUrl);
      }
    } catch (error) {
      console.error("Error fetching user data", error);
      Alert.alert("Error", "Failed to fetch existing media. Please try again later.");
    }
  };

  // Handle picking an image for a given slot (0..2)
  const handlePickImage = async (slotIndex) => {
    try {
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
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "There was an issue processing the image.");
    }
  };

  // Remove a photo from a given slot
  const handleRemovePhoto = (slotIndex) => {
    const newPhotos = [...photos];

    newPhotos[slotIndex] = null;
    setPhotos(newPhotos);
  };

  // Handle picking a video
  const handleVideoUpload = async () => {
    try {
      // Only request camera permissions - not microphone through ImagePicker
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();

      if (cameraPermission.status !== "granted") {
        Alert.alert("Permissions Required", "Please enable camera permissions to record video.");
        return;
      }

      // Try using launchImageLibraryAsync instead, which is more reliable for videos
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1.0,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
        // Remove videoExportPreset as it can cause issues on some devices
      });

      console.log("Video picker result:", result);

      if (!result.canceled && result.assets?.[0]?.uri) {
        console.log("Video selection success:", result.assets[0]);
        setVideoUri(result.assets[0].uri);
        setIsVideoPlaying(false);
      } else {
        console.log("Video selection cancelled or no URI returned");
        Alert.alert("No Video Selected", "Please try again or choose a different video.");
      }
    } catch (error) {
      console.error("Error details:", error);
      Alert.alert("Video Selection Error", "There was an issue selecting the video. Please try again.");
    }
  };

  // Add a new function for recording video directly (as an alternative)
  const handleRecordVideo = async () => {
    try {
      // Only request camera permissions - not microphone through ImagePicker
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();

      if (cameraPermission.status !== "granted") {
        Alert.alert("Permissions Required", "Please enable camera permissions to record video.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false, // Set to false for more reliable results
        quality: 1, // Slightly reduced quality for better compatibility
      });

      console.log("Video recording result:", result);

      if (!result.canceled && result.assets?.[0]?.uri) {
        console.log("Video recording success:", result.assets[0]);
        setVideoUri(result.assets[0].uri);
        setIsVideoPlaying(false);
      } else {
        console.log("Video recording cancelled or no URI returned");
      }
    } catch (error) {
      console.error("Error details:", error);
      Alert.alert("Video Recording Error", "There was an issue recording the video. Please ensure you have granted camera and microphone permissions and try again.", [
        {
          text: "Check Permissions",
          onPress: async () => {
            const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
            const micStatus = await ImagePicker.requestMicrophonePermissionsAsync();
            if (cameraStatus.status !== "granted" || micStatus.status !== "granted") {
              Alert.alert("Permissions Required", "Please enable camera and microphone permissions in your device settings to record video.");
            }
          },
        },
        { text: "OK" },
      ]);
    }
  };

  // Remove the video
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

  // Upload images and video to backend
  const uploadMediaToBackend = async () => {
    if (!userId || !userEmail) {
      Alert.alert("Error", "User ID or email missing. Please log in again.");
      return;
    }

    setIsLoading(true);

    const uploadData = new FormData();
    uploadData.append("user_uid", userId);
    uploadData.append("user_email_id", userEmail);

    // Filter out null photos and get only valid URIs
    const validPhotos = photos.filter((uri) => uri !== null);
    console.log("Valid photos to upload:", validPhotos);

    // Append each valid photo with sequential index (img_0, img_1, img_2)
    // regardless of which slot it was in originally
    validPhotos.forEach((uri, index) => {
      uploadData.append(`img_${index}`, {
        uri,
        type: "image/jpeg",
        name: `img_${index}.jpg`,
      });
      console.log(`Appending photo img_${index}:`, uri);
    });

    // Append video if it exists
    if (videoUri) {
      uploadData.append("user_video", {
        uri: videoUri,
        type: "video/mp4",
        name: "video_filename.mp4",
      });
      console.log("Appending user_video:", videoUri);
    }

    try {
      // Log the complete FormData for debugging
      console.log("FormData contents:");
      for (let [key, value] of uploadData._parts) {
        console.log(`- ${key}: ${value}`);
      }

      const response = await axios.put("https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo", uploadData, { headers: { "Content-Type": "multipart/form-data" } });

      if (response.status === 200) {
        console.log("Media uploaded successfully:", response.data);
        Alert.alert("Success", "Media uploaded successfully!");
      } else {
        console.error("Failed to upload media:", response);
        Alert.alert("Error", "Failed to upload media to the server.");
      }
    } catch (error) {
      console.error("Upload Error:", error);
      if (error.response) {
        console.error("Error Response:", error.response.data || error.response);
        Alert.alert("Error", `Error: ${error.response.status} - ${error.response.data?.message || error.response.statusText || "Unknown error"}`);
      } else if (error.request) {
        console.error("Error Request:", error.request);
        Alert.alert("Error", "Network error. Please check your internet connection.");
      } else {
        console.error("Error Message:", error.message);
        Alert.alert("Error", "Something went wrong while uploading.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormComplete = photos.some((p) => p !== null) || videoUri;

  const handleContinue = async () => {
    if (isFormComplete) {
      await uploadMediaToBackend();
      navigation.navigate("LocationScreen", { photos, videoUri });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1, paddingBottom: 20 }}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size='large' color='#E4423F' />
            <Text style={{ color: "#E4423F", marginTop: 10 }}>Uploading...</Text>
          </View>
        )}

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={require("../assets/icons/backarrow.png")} />
        </TouchableOpacity>

        {/* Progress Bar */}
        <ProgressBar startProgress={70} endProgress={80} style={styles.progressBar} />

        {/* Title & Subtitle */}
        <View style={styles.content}>
          <Text style={styles.title}>Add your video & photos</Text>
          <Text style={styles.subtitle}>Please upload a short video introducing yourself.</Text>

          {/* Trial Notice */}
          <View style={styles.trialVersion}>
            <Text style={styles.trialHeading}>TRIAL VERSION</Text>
            <Text style={styles.trialBody}>
              For the testing phase, please keep your video <Text style={styles.bold}>short</Text>.{"\n"}Example: "Hi! I'm Hannah and I enjoy outdoor activities."
              {"\n\n"}We are also unable to crop your photos for the testing phase, so please use <Text style={styles.bold}>centered photos</Text>.
            </Text>
          </View>

          {/* Video Section */}
          <View style={styles.mediaContainer}>
            {videoUri ? (
              <View style={styles.videoWrapper}>
                <Video
                  ref={videoRef}
                  source={{ uri: videoUri }}
                  style={styles.video}
                  resizeMode='cover'
                  // Let the video have built-in controls:
                  useNativeControls
                  // Attempt to auto-play
                  shouldPlay={false}
                  onPlaybackStatusUpdate={(status) => {
                    if (!status.isLoaded) return;
                    setIsVideoPlaying(status.isPlaying);
                  }}
                  // Print errors to console
                  onError={(err) => console.log("VIDEO ERROR:", err)}
                />
                {/* Center play overlay if paused */}
                {!isVideoPlaying && (
                  <TouchableOpacity style={styles.playOverlay} onPress={handlePlayPause}>
                    <Ionicons name='play' size={48} color='#FFF' />
                  </TouchableOpacity>
                )}
                {/* "X" in top-right */}
                <TouchableOpacity onPress={handleRemoveVideo} style={styles.removeIconTopRight}>
                  <View style={styles.removeIconBackground}>
                    <Ionicons name='close' size={20} color='#FFF' />
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.videoUploadOptions}>
                <TouchableOpacity onPress={handleRecordVideo} style={styles.uploadVideoButton}>
                  <Image source={require("../assets/icons/record.png")} />
                  <Text style={styles.uploadVideoText}>Record Video</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleVideoUpload} style={styles.selectVideoButton}>
                  <Ionicons name='images-outline' size={24} color='#E4423F' />
                  <Text style={styles.uploadVideoText}>Select Video</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Photos Section (3 boxes) */}
          <View style={styles.photoBoxesRow}>
            {photos.map((photoUri, idx) => (
              <View key={idx} style={styles.photoBox}>
                {photoUri ? (
                  <>
                    <Image source={{ uri: photoUri }} style={styles.photoImage} />
                    {/* "X" in top-right */}
                    <TouchableOpacity onPress={() => handleRemovePhoto(idx)} style={styles.removeIconTopRight}>
                      <View style={styles.removeIconBackground}>
                        <Ionicons name='close' size={20} color='#FFF' />
                      </View>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.emptyPhotoBox}>
                    <TouchableOpacity style={styles.addButton} onPress={() => handlePickImage(idx)}>
                      <Ionicons name='add' size={24} color='#E4423F' />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
        {/* </ScrollView> */}

        {/* Continue Button */}
        <Pressable style={[styles.continueButton, { backgroundColor: isFormComplete ? "#E4423F" : "#F5F5F5" }]} onPress={handleContinue} disabled={!isFormComplete || isLoading}>
          <Text style={[styles.continueButtonText, { color: isFormComplete ? "#FFF" : "rgba(26, 26, 26, 0.25)" }]}>Continue</Text>
        </Pressable>
      </ScrollView>
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
  loadingOverlay: {
    position: "absolute",
    zIndex: 999,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 30,
  },
  content: {
    flex: 1,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 50,
  },
  trialVersion: {
    marginBottom: 20,
  },
  trialHeading: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  trialBody: {
    fontSize: 14,
    color: "#1A1A1A",
    lineHeight: 20,
    marginBottom: 20,
  },
  bold: {
    fontWeight: "bold",
  },
  mediaContainer: {
    marginBottom: 20,
  },
  // 326:428 => aspectRatio ~ 0.76
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
  videoUploadOptions: {
    flexDirection: "column",
    gap: 10,
    marginBottom: 20,
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
    marginBottom: 20,
  },
  uploadVideoText: {
    color: "#E4423F",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 15,
  },
  selectVideoButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#E4423F",
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
  },

  // Photo boxes in a row (3 boxes)
  photoBoxesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
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
    backgroundColor: "#F5F5F5",
  },
  addButton: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 5,
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },

  continueButton: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E4423F",
    borderRadius: 30,
    marginBottom: 50,
  },
  continueButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
