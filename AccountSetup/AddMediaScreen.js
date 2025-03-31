import React, { useState, useEffect, useRef, useCallback } from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Pressable, Image, Platform, StatusBar, Alert, ActivityIndicator, ScrollView, Linking, ActionSheetIOS } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import { Asset } from "expo-asset";
import * as MediaHelper from "../utils/MediaHelper";
import ProgressBar from "../src/Assets/Components/ProgressBar";
import { __DEV_MODE__ } from "../config";

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
  // const [uploadStatus, setUploadStatus] = useState("");

  // Near other state variables
  const [photoFileSizes, setPhotoFileSizes] = useState([null, null, null]);

  // Add presignedData state near other state declarations
  const [presignedData, setPresignedData] = useState(null);

  // Load test videos using the centralized function
  useEffect(() => {
    const initTestVideos = async () => {
      try {
        const videos = await MediaHelper.loadTestVideos();
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
      const hasPermission = await MediaHelper.requestMediaLibraryPermissions();
      if (!hasPermission) return;

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
        const photoArray = JSON.parse(fetchedData.user_photo_url);
        // We only have 3 slots, fill them from the array
        const newPhotos = [null, null, null];
        photoArray.forEach((uri, idx) => {
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

  // Add a comprehensive getFileSizes function similar to EditProfile.js
  useEffect(() => {
    const calculateFileSizes = async () => {
      try {
        // Calculate video file size
        if (videoUri) {
          const size = await MediaHelper.getFileSizeInMB(videoUri, testVideos);
          setVideoFileSize(size);
        }

        // Calculate photo file sizes
        const newPhotoFileSizes = [...photoFileSizes];
        for (let i = 0; i < photos.length; i++) {
          if (photos[i]) {
            const size = await MediaHelper.getFileSizeInMB(photos[i], testVideos);
            newPhotoFileSizes[i] = size;
          } else {
            newPhotoFileSizes[i] = null;
          }
        }
        setPhotoFileSizes(newPhotoFileSizes);
      } catch (error) {
        console.error("Error calculating file sizes:", error);
      }
    };

    calculateFileSizes();
  }, [videoUri, photos, testVideos]);

  // Update handlePickImage to use MediaHelper
  const handlePickImage = async (slotIndex) => {
    try {
      console.log("===== In AddMediaScreen.js - handlePickImage =====");
      const result = await MediaHelper.pickImage({}, testVideos);
      if (result) {
        const { uri, fileSize } = result;
        const newPhotos = [...photos];
        newPhotos[slotIndex] = uri;
        setPhotos(newPhotos);

        // Set file size
        const newPhotoFileSizes = [...photoFileSizes];
        newPhotoFileSizes[slotIndex] = fileSize;
        setPhotoFileSizes(newPhotoFileSizes);
      }
    } catch (error) {
      console.error("Error in handlePickImage:", error);
      Alert.alert("Error", "There was an issue selecting the image. Please try again.");
    }
  };

  // Update handleRemovePhoto to clear file size
  const handleRemovePhoto = (slotIndex) => {
    const newPhotos = [...photos];
    newPhotos[slotIndex] = null;
    setPhotos(newPhotos);

    // Clear file size for removed photo
    const newPhotoFileSizes = [...photoFileSizes];
    newPhotoFileSizes[slotIndex] = null;
    setPhotoFileSizes(newPhotoFileSizes);
  };

  // Update handleVideoUpload to get presigned URL
  // const handleVideoUpload = async () => {
  //   try {
  //     const result = await MediaHelper.handleVideoLibrarySelection(testVideos);
  //     if (result) {
  //       setVideoUri(result.uri);
  //       setVideoFileSize(result.fileSize);
  //       setIsVideoPlaying(false);

  //       // Get presigned URL
  //       const uid = await AsyncStorage.getItem("user_uid");
  //       if (uid) {
  //         const presignedData = await MediaHelper.getPresignedUrl(uid);
  //         setPresignedData(presignedData);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error in handleVideoUpload:", error);
  //     Alert.alert("Error", "There was an issue with the video selection. Please try again.");
  //   }
  // };

  // Update handleRecordVideo to use the new MediaHelper function
  const handleRecordVideo = async () => {
    try {
      const success = await MediaHelper.handleVideoRecordingWithState(testVideos, userId, setVideoUri, setVideoFileSize, setIsVideoPlaying, setPresignedData);

      if (!success) {
        Alert.alert("Error", "There was an issue with the video recording. Please try again.");
      }
    } catch (error) {
      console.error("Error in handleRecordVideo:", error);
      Alert.alert("Error", "There was an issue with the video recording. Please try again.");
    }
  };

  // Update handleRemoveVideo to clear presignedData
  const handleRemoveVideo = () => {
    setVideoUri(null);
    setIsVideoPlaying(false);
    setVideoFileSize(null);
    setPresignedData(null);
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

  // Function to check if a URI is a test video - using MediaHelper
  // const isTestVideo = (uri) => {
  //   return MediaHelper.isTestVideo(uri, testVideos);
  // };

  // Update checkTotalFileSize to use MediaHelper
  const checkTotalFileSize = useCallback(() => {
    return MediaHelper.checkTotalFileSize(videoFileSize, photoFileSizes);
  }, [videoFileSize, photoFileSizes]);

  const isFormComplete = photos.some((p) => p !== null) || videoUri;

  const handleContinue = async () => {
    console.log("--- In AddMediaScreen.js handleContinue Function ---");
    try {
      setIsLoading(true);

      // Get user_uid
      const uid = userId;
      if (!uid || !userEmail) {
        Alert.alert("Error", "User ID or email missing. Please log in again.");
        setIsLoading(false);
        return;
      }

      // Check total file size before uploading using MediaHelper
      const totalSize = checkTotalFileSize();
      const shouldProceed = await MediaHelper.promptLargeFileSize(totalSize, 5);

      if (!shouldProceed) {
        setIsLoading(false);
        return;
      }

      try {
        // Create FormData object
        const uploadData = new FormData();
        uploadData.append("user_uid", uid);
        uploadData.append("user_email_id", userEmail);

        // Add photos to FormData with sequential indices
        const validPhotos = photos.filter((uri) => uri !== null);
        console.log("=== Debug Photo Arrays ===");
        console.log("Photos array:", validPhotos);
        console.log("=== End Debug Photo Arrays ===");

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
          console.log("New Video");
          try {
            const videoFile = await MediaHelper.uploadVideo(videoUri);

            if (videoFile) {
              console.log("Video file prepared for upload:", videoFile);
              // Append the video file directly to FormData with the correct field name
              uploadData.append("user_video", {
                uri: videoFile.uri,
                type: videoFile.type,
                name: videoFile.name,
              });
            } else {
              console.error("Failed to prepare video for upload");
              Alert.alert("Error uploading video:", "Please try a smaller file or try again.");
              setIsLoading(false);
              return;
            }
          } catch (videoError) {
            console.error("Error preparing video for upload:", videoError);
            Alert.alert("Error", "There was an issue preparing your video for upload. Please try again.");
            setIsLoading(false);
            return;
          }
        }
        console.log("=== End Video Upload Debug ===");

        // Make the upload request
        console.log("=== Profile Update API Request ===", uploadData);
        console.log("Making API request to update profile with timeout of 120 seconds...");
        console.log("API endpoint: https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo");

        const startTime = Date.now();
        console.log("FORM DATA Being sent to server:", uploadData);

        const response = await axios.put("https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo", uploadData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
          timeout: 120000, // Increase timeout to 2 minutes for large files
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          maxRedirects: 5,
          decompress: true,
          // Add these configurations for better handling of large files
          transformRequest: [(data) => data], // Prevent axios from transforming the data
          transformResponse: [(data) => data], // Prevent axios from transforming the response
          // Increase the buffer size for large files
          buffer: true,
          // Add these headers to help with large file uploads
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
            "Transfer-Encoding": "chunked",
            Connection: "keep-alive",
          },
        });

        const endTime = Date.now();
        const requestDuration = (endTime - startTime) / 1000; // in seconds
        console.log("Request duration:", requestDuration.toFixed(2) + " seconds");

        if (response.status === 200) {
          console.log("Upload successful!");
          Alert.alert("Success", `Your profile has been updated!`);
          navigation.navigate("LocationScreen", { photos, videoUri });
        }
      } catch (error) {
        console.error("Error in handleContinue:", error);
        let errorMessage = "Failed to update profile. Please try again.";

        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error("Error response:", error.response.data);
          console.error("Error status:", error.response.status);
          console.error("Error headers:", error.response.headers);

          if (error.response.status === 413) {
            errorMessage = "The file size is too large. Please try a smaller video.";
          } else if (error.response.status === 408) {
            errorMessage = "The upload took too long. Please try a smaller video or check your connection.";
          } else if (error.response.status === 500) {
            errorMessage = "Server error. Please try again later.";
          }
        } else if (error.request) {
          // The request was made but no response was received
          console.error("Error request:", error.request);
          errorMessage = "No response from server. Please check your connection and try again.";
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error("Error message:", error.message);
        }

        Alert.alert("Error", errorMessage);
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error in handleContinue:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1, paddingBottom: 20 }}>
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
                  useNativeControls
                  shouldPlay={false}
                  onPlaybackStatusUpdate={(status) => {
                    if (!status.isLoaded) return;
                    setIsVideoPlaying(status.isPlaying);
                  }}
                  onError={(err) => console.log("VIDEO ERROR:", err)}
                />
                {/* Center play overlay if paused */}
                {!isVideoPlaying && (
                  <TouchableOpacity style={styles.playOverlay} onPress={handlePlayPause}>
                    <Ionicons name='play' size={48} color='#FFF' />
                  </TouchableOpacity>
                )}
                {/* Show file size in corner */}
                {videoFileSize && (
                  <View style={styles.videoFileSizeBadge}>
                    <Text style={styles.fileSizeText}>{videoFileSize}MB</Text>
                  </View>
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

                {/* {__DEV_MODE__ && (
                <TouchableOpacity onPress={handleVideoUpload} style={styles.selectVideoButton}>
                  <Ionicons name='images-outline' size={24} color='#E4423F' />
                  <Text style={styles.uploadVideoText}>Select Video</Text>
                </TouchableOpacity>
              )} */}
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
                    {/* Show file size */}
                    {photoFileSizes[idx] && (
                      <View style={styles.fileSizeBadge}>
                        <Text style={styles.fileSizeText}>{photoFileSizes[idx]}MB</Text>
                      </View>
                    )}
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

        {/* Debug Info Section */}
        {__DEV_MODE__ && (
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>Debug Information</Text>

            <View style={styles.debugGroup}>
              <Text style={styles.debugSubtitle}>Video Information:</Text>
              <View style={styles.debugItem}>
                <Text style={styles.debugLabel}>URI:</Text>
                <Text style={styles.debugValue}>{videoUri || "Not set"}</Text>
              </View>
              <View style={styles.debugItem}>
                <Text style={styles.debugLabel}>File Size:</Text>
                <Text style={styles.debugValue}>{videoFileSize ? `${videoFileSize} MB` : "Not set"}</Text>
              </View>
            </View>

            <View style={styles.debugGroup}>
              <Text style={styles.debugSubtitle}>Presigned Data:</Text>
              <View style={styles.debugItem}>
                <Text style={styles.debugLabel}>URL:</Text>
                <Text style={styles.debugValue}>{presignedData?.url || "Not set"}</Text>
              </View>
              <View style={styles.debugItem}>
                <Text style={styles.debugLabel}>Video URL:</Text>
                <Text style={styles.debugValue}>{presignedData?.videoUrl || "Not set"}</Text>
              </View>
              <View style={styles.debugItem}>
                <Text style={styles.debugLabel}>Full Data:</Text>
                <Text style={styles.debugValue}>{presignedData ? JSON.stringify(presignedData, null, 2) : "Not set"}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Continue Button */}
        <Pressable style={[styles.continueButton, { backgroundColor: isFormComplete ? "#E4423F" : "#F5F5F5" }]} onPress={handleContinue} disabled={!isFormComplete || isLoading}>
          <Text style={[styles.continueButtonText, { color: isFormComplete ? "#FFF" : "rgba(26, 26, 26, 0.25)" }]}>Continue</Text>
        </Pressable>
      </ScrollView>

      {/* Loading Overlay - Only show when isLoading is true */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size='large' color='#E4423F' />
            <Text style={styles.loadingText}>Uploading...</Text>
            <Text style={styles.loadingSubtext}>Please wait while we upload your media.</Text>
          </View>
        </View>
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
    paddingHorizontal: 25,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999, // Increased z-index to ensure it's above everything
  },
  loadingContent: {
    alignItems: "center",
    padding: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    color: "#E4423F",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 5,
  },
  loadingSubtext: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20,
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
  fileSizeBadge: {
    position: "absolute",
    bottom: 5,
    left: 5,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fileSizeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  videoFileSizeBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  // Debug styles
  debugSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 20,
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#212529",
  },
  debugGroup: {
    marginBottom: 20,
  },
  debugSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
    color: "#495057",
  },
  debugItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 10,
  },
  debugLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6c757d",
    width: 80,
  },
  debugValue: {
    fontSize: 14,
    color: "#495057",
    flex: 1,
  },
});
