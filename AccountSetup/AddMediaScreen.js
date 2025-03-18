import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Pressable, Image, Platform, StatusBar, Alert, ActivityIndicator, ScrollView, Linking, ActionSheetIOS } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import { Asset } from "expo-asset";
import { getPresignedUrl, uploadVideoToS3, getFileSizeInMB, loadTestVideos, isTestVideo as s3IsTestVideo, getTestVideoFileSize as s3GetTestVideoFileSize } from "../utils/S3Helper";
import ProgressBar from "../src/Assets/Components/ProgressBar";

export default function AddMediaScreen({ navigation }) {
  console.log("--- In AddMediaScreen.js ---");
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
  const [videoFileSize, setVideoFileSize] = useState(null);

  // Use an empty array as initial state for test videos
  const [testVideos, setTestVideos] = useState([]);

  // For showing a loading overlay while uploading
  const [isLoading, setIsLoading] = useState(false);

  // Add a status message state near other state variables
  const [uploadStatus, setUploadStatus] = useState("");

  // Load test videos using the centralized function
  useEffect(() => {
    const initTestVideos = async () => {
      try {
        const videos = await loadTestVideos();
        console.log("Test videos loaded in AddMediaScreen:", videos);
        setTestVideos(videos);
      } catch (error) {
        console.error("Error loading test videos in AddMediaScreen:", error);
        // Set default empty test videos as fallback
        setTestVideos([]);
      }
    };

    initTestVideos();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (videoRef.current) {
        videoRef.current.setPositionAsync(0);
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
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();

      if (cameraPermission.status !== "granted") {
        Alert.alert("Permission Required", "Camera access is required to select video. Please enable it in your device settings.", [
          { text: "Cancel", style: "cancel" },
          { text: "Settings", onPress: () => Linking.openSettings() },
        ]);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1.0,
        videoQuality: getVideoQuality(),
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        console.log("Video selection success:", result.assets[0]);
        const uri = result.assets[0].uri;
        setVideoUri(uri);
        setIsVideoPlaying(false);

        // Get and set the file size
        const fileSize = await getFileSizeInMB(uri, testVideos);
        setVideoFileSize(fileSize);

        // Set the appropriate message based on file size
        Alert.alert("Video Added", `Your ${fileSize}MB video has been added to your profile. It will be uploaded to our secure server when you continue.`, [{ text: "OK" }]);
      } else {
        // Show test video options when selection is cancelled
        console.log("---- In AddMediaScreen.js Video Selection Cancelled----");
        Alert.alert("Video Selection Cancelled", "Would you like to use a test video instead?", [
          { text: "No", style: "cancel" },
          { text: "Yes", onPress: showTestVideoOptions },
        ]);
      }
    } catch (error) {
      console.error("Error picking video:", error);
    }
  };

  // Determine appropriate video quality based on device
  const getVideoQuality = () => {
    // On iOS, use the ImagePicker preset constants
    if (Platform.OS === "ios") {
      return ImagePicker.UIImagePickerControllerQualityType.Medium;
    }
    // On Android, just use a string
    return "medium";
  };

  // Update the handleRecordVideo function to use the getVideoQuality function
  const handleRecordVideo = async () => {
    try {
      // Platform-specific permission handling
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();

      if (cameraPermission.status !== "granted") {
        Alert.alert("Permission Required", "Camera access is required to record video. Please enable it in your device settings.", [
          { text: "Cancel", style: "cancel" },
          { text: "Settings", onPress: () => Linking.openSettings() },
        ]);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false, // Set to false for more reliable results
        quality: 1,
        videoQuality: getVideoQuality(),
        maxDuration: 60,
        saveToPhotos: true, // Save to device camera roll
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        console.log("Video recording success:", result.assets[0]);
        const uri = result.assets[0].uri;
        setVideoUri(uri);
        setIsVideoPlaying(false);

        // Get and set the file size
        const fileSize = await getFileSizeInMB(uri, testVideos);
        setVideoFileSize(fileSize);

        // Set the appropriate message based on file size
        Alert.alert("Video Recorded", `Your ${fileSize}MB video has been recorded. It will be uploaded to our secure server when you continue.`, [{ text: "OK" }]);
      } else {
        // Show test video options when selection is cancelled
        console.log("---- In AddMediaScreen.js Video Recording Cancelled----");
        Alert.alert("Video Recording Cancelled", "Would you like to use a test video instead?", [
          { text: "No", style: "cancel" },
          { text: "Yes", onPress: showTestVideoOptions },
        ]);
      }
    } catch (error) {
      console.error("Error recording video:", error);
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

  // Function to show fallback options for test videos
  const showTestVideoOptions = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", ...testVideos.map((video) => video.name)],
          cancelButtonIndex: 0,
          title: "Select a Test Video",
          message: "Choose a test video to use for upload testing",
        },
        (buttonIndex) => {
          if (buttonIndex > 0) {
            handleTestVideoSelection(buttonIndex - 1);
          }
        }
      );
    } else {
      // For Android, use Alert with buttons
      Alert.alert("Select a Test Video", "Choose a test video to use for upload testing", [
        { text: "Cancel", style: "cancel" },
        ...testVideos.map((video, index) => ({
          text: video.name,
          onPress: () => handleTestVideoSelection(index),
        })),
      ]);
    }
  };

  // Function to handle test video selection
  const handleTestVideoSelection = (index) => {
    if (index < 0 || index >= testVideos.length) {
      return;
    }

    const selectedVideo = testVideos[index];

    if (!selectedVideo.uri) {
      return;
    }

    setVideoUri(selectedVideo.uri);
    setVideoFileSize(selectedVideo.size);
    setIsVideoPlaying(false);

    const fileSize = selectedVideo.size;

    // Set the appropriate message based on file size
    Alert.alert("Test Video Selected", `The selected test video is ${fileSize}MB. It will be uploaded directly to S3 when you continue.`, [{ text: "OK" }]);
  };

  // Function to get file size for test videos - exactly match EditProfile.js
  const getTestVideoFileSize = (uri) => {
    return s3GetTestVideoFileSize(uri, testVideos);
  };

  // Function to check if a URI is a test video - exactly match EditProfile.js
  const isTestVideo = (uri) => {
    return s3IsTestVideo(uri, testVideos);
  };

  // Add this function near other utility functions
  const checkTotalFileSize = () => {
    let totalSize = 0;

    // Add photo sizes (estimate 0.5MB per photo)
    photos.forEach((uri) => {
      if (uri) totalSize += 0.5;
    });

    // Add video size if available
    if (videoFileSize) {
      totalSize += parseFloat(videoFileSize);
    }

    console.log(`Total estimated file size: ${totalSize.toFixed(2)}MB`);
    return totalSize;
  };

  // Update the uploadMediaToBackend function to check total file size
  const uploadMediaToBackend = async () => {
    if (!userId || !userEmail) {
      Alert.alert("Error", "User ID or email missing. Please log in again.");
      return;
    }

    setIsLoading(true);

    // Check total file size before uploading
    const totalSize = checkTotalFileSize();
    if (totalSize > 5) {
      // Ask for confirmation before proceeding with large files
      const shouldProceed = await new Promise((resolve) => {
        Alert.alert(
          "Large File Size Warning",
          `The total size of your media is ${totalSize.toFixed(2)}MB, which exceeds the recommended 5MB limit. This may cause slow uploads and performance issues. Do you want to continue?`,
          [
            { text: "Cancel", onPress: () => resolve(false), style: "cancel" },
            { text: "Continue Anyway", onPress: () => resolve(true) },
          ]
        );
      });

      if (!shouldProceed) {
        setIsLoading(false);
        return; // Stop the save process
      }
    }

    try {
      const uploadData = new FormData();
      uploadData.append("user_uid", userId);
      uploadData.append("user_email_id", userEmail);

      // Filter out null photos and get only valid URIs
      const validPhotos = photos.filter((uri) => uri !== null);
      console.log("=== Debug Photo Arrays ===");
      console.log("Photos array:", validPhotos);
      console.log("=== End Debug Photo Arrays ===");

      // Add photos to FormData with sequential indices
      validPhotos.forEach((uri, index) => {
        console.log(`Adding new local photo ${index}:`, uri);
        uploadData.append(`img_${index}`, {
          uri,
          type: "image/jpeg",
          name: `img_${index}.jpg`,
        });
      });

      // Handle video upload
      console.log("=== Video Upload Debug ===");
      console.log("Current video URL:", videoUri);

      if (videoUri) {
        setUploadStatus("Preparing video upload...");

        // Always use S3 direct upload
        console.log("--- In AddMediaScreen.js, using S3 direct upload");
        const presignedData = await getPresignedUrl(userId);
        setUploadStatus(`Uploading ${videoFileSize}MB video directly to S3...`);
        const uploadResult = await uploadVideoToS3(videoUri, presignedData.url);
        const uploadSuccess = uploadResult.success;
        console.log("S3 upload result:", uploadSuccess ? "SUCCESS" : "FAILED");

        if (uploadSuccess && presignedData.videoUrl) {
          console.log("Direct S3 upload successful, using S3 URL in form data:", presignedData.videoUrl);
          setUploadStatus(`S3 upload successful! Using S3 URL: ${presignedData.videoUrl}`);
          uploadData.append("user_video_url", presignedData.videoUrl);
          console.log("Added user_video_url to form data:", presignedData.videoUrl);
        } else {
          console.error("Direct S3 upload failed, falling back to regular upload");
          setUploadStatus("S3 upload failed, falling back to regular upload");
          // Fall back to regular upload
          console.log("Adding video as multipart form data...");
          uploadData.append("user_video", {
            uri: videoUri,
            type: "video/mp4",
            name: "user_video.mp4",
          });
          console.log("Added user_video to form data as multipart");
        }
      }

      console.log("=== End Video Upload Debug ===");

      // Make the upload request
      console.log("=== Profile Update API Request ===");
      console.log("Making API request to update profile with timeout of 120 seconds...");
      console.log("API endpoint: https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo");

      // Log the FormData contents (but not the actual file data)
      console.log("FormData contents:");
      for (let [key, value] of uploadData._parts) {
        if (key === "user_video" || key.startsWith("img_")) {
          console.log(`${key}: [File data omitted]`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      const startTime = Date.now();
      setUploadStatus("Sending data to server...");

      const response = await axios.put("https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo", uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
        timeout: 120000, // Increase timeout to 2 minutes for large files
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      const endTime = Date.now();
      const requestDuration = (endTime - startTime) / 1000; // in seconds
      console.log("Request duration:", requestDuration.toFixed(2) + " seconds");

      if (response.status === 200) {
        setUploadStatus("Upload successful!");
        console.log("Upload successful!");
        Alert.alert("Success", "Your profile has been updated!");

        // This is the only functionality difference from EditProfile.js - navigate to next screen
        navigation.navigate("LocationScreen", { photos, videoUri });
      }
    } catch (error) {
      console.error("Error uploading profile:");

      let errorMessage = "Something went wrong while uploading.";
      let errorDetails = "";

      if (error.response) {
        // The request was made and the server responded with a status code outside of 2xx range
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);

        errorMessage = "Server Error";

        if (error.response.status === 413) {
          errorDetails = "The video is too large for the server to process. The file has been automatically uploaded to our S3 server instead.";
        } else if (error.response.status === 403) {
          errorDetails = "You don't have permission to upload this content.";
        } else if (error.response.status === 500) {
          errorDetails = "Our server encountered an error. Please try again later.";
        } else {
          errorDetails = `Error ${error.response.status}: ${error.response.data?.message || error.response.statusText || "Unknown error"}`;
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error("Error Request:", error.request);
        errorMessage = "Network Error";
        errorDetails = "Unable to connect to our servers. Please check your internet connection and try again.";
      } else {
        // Something happened in setting up the request
        console.error("Error Message:", error.message);
        errorMessage = "Upload Failed";
        errorDetails = error.message || "An unexpected error occurred during upload.";
      }

      // Show alert with retry option
      Alert.alert(errorMessage, errorDetails, [
        {
          text: "Try Again",
          onPress: () => {
            // Wait a moment before retrying
            setTimeout(() => {
              uploadMediaToBackend();
            }, 1000);
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    } finally {
      setIsLoading(false);
      setUploadStatus("");
    }
  };

  const isFormComplete = photos.some((p) => p !== null) || videoUri;

  const handleContinue = async () => {
    if (isFormComplete) {
      await uploadMediaToBackend();
      // Note: Navigation to LocationScreen is now handled in uploadMediaToBackend
      // only after a successful upload
    } else {
      // Show a message if no media was selected
      Alert.alert("Missing Content", "Please add at least one photo or video before continuing.", [{ text: "OK" }]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1, paddingBottom: 20 }}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size='large' color='#E4423F' />
            <Text style={{ color: "#E4423F", marginTop: 10, marginBottom: 5, fontWeight: "bold" }}>{uploadStatus || "Uploading..."}</Text>
            {uploadStatus.includes("S3") && (
              <Text style={{ color: "#666", textAlign: "center", paddingHorizontal: 20 }}>Large videos are uploaded directly to our secure server. This may take a moment.</Text>
            )}
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
