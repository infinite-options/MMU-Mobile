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

  // Handle picking a video using MediaHelper
  const handleVideoUpload = async () => {
    const result = await MediaHelper.pickVideo(testVideos);

    if (result === false) {
      // Selection was cancelled, show test video options
      Alert.alert("Video Selection Cancelled", "Would you like to use a test video instead?", [
        { text: "No", style: "cancel" },
        { text: "Yes", onPress: showTestVideoOptions },
      ]);
    } else if (result) {
      const { uri, fileSize } = result;
      setVideoUri(uri);
      setVideoFileSize(fileSize);
      setIsVideoPlaying(false);
    }
  };

  // Record video using MediaHelper
  const handleRecordVideo = async () => {
    const result = await MediaHelper.recordVideo(testVideos);

    if (result === false) {
      // Recording was cancelled, show test video options
      Alert.alert("Video Recording Cancelled", "Would you like to use a test video instead?", [
        { text: "No", style: "cancel" },
        { text: "Yes", onPress: showTestVideoOptions },
      ]);
    } else if (result) {
      const { uri, fileSize } = result;
      setVideoUri(uri);
      setVideoFileSize(fileSize);
      setIsVideoPlaying(false);
    }
  };

  // Remove the video
  const handleRemoveVideo = () => {
    setVideoUri(null);
    setIsVideoPlaying(false);
    setVideoFileSize(null);
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
    MediaHelper.showTestVideoOptions(testVideos, handleTestVideoSelection);
  };

  // Function to handle test video selection
  const handleTestVideoSelection = (index) => {
    const selectedVideo = MediaHelper.selectTestVideo(index, testVideos, "continue");
    if (selectedVideo) {
      setVideoUri(selectedVideo.uri);
      setVideoFileSize(selectedVideo.size);
      setIsVideoPlaying(false);
    }
  };

  // Function to get file size for test videos - using MediaHelper
  const getTestVideoFileSize = (uri) => {
    return MediaHelper.getTestVideoFileSize(uri, testVideos);
  };

  // Function to check if a URI is a test video - using MediaHelper
  const isTestVideo = (uri) => {
    return MediaHelper.isTestVideo(uri, testVideos);
  };

  // Update checkTotalFileSize to use MediaHelper
  const checkTotalFileSize = useCallback(() => {
    return MediaHelper.checkTotalFileSize(videoFileSize, photoFileSizes);
  }, [videoFileSize, photoFileSizes]);

  // Update the uploadMediaToBackend function to check total file size
  // const uploadMediaToBackend = async () => {
  //   console.log("--- In AddMediaScreen.js uploadMediaToBackend Function ---");
  //   try {
  //     setIsLoading(true);

  //     // Check if userId and userEmail are available
  //     if (!userId || !userEmail) {
  //       Alert.alert("Error", "User ID or email missing. Please log in again.");
  //       setIsLoading(false);
  //       return;
  //     }

  //     // Check total file size before uploading using MediaHelper
  //     const totalSize = checkTotalFileSize();
  //     const shouldProceed = await MediaHelper.promptLargeFileSize(totalSize, 5);

  //     if (!shouldProceed) {
  //       setIsLoading(false);
  //       return; // Stop the save process
  //     }

  //     // try{}

  //     const uploadData = new FormData();
  //     uploadData.append("user_uid", userId);

  //     uploadData.append("user_email_id", userEmail);

  //     // Filter out null photos and get only valid URIs
  //     const validPhotos = photos.filter((uri) => uri !== null);
  //     console.log("=== Debug Photo Arrays ===");
  //     console.log("Photos array:", validPhotos);
  //     console.log("=== End Debug Photo Arrays ===");

  //     // Add photos to FormData with sequential indices
  //     validPhotos.forEach((uri, index) => {
  //       console.log(`Adding new local photo ${index}:`, uri);
  //       uploadData.append(`img_${index}`, {
  //         uri,
  //         type: "image/jpeg",
  //         name: `img_${index}.jpg`,
  //       });
  //     });

  //     console.log("=== End Photo Upload Debug ===");

  //     // Handle video upload
  //     console.log("=== Video Upload Debug ===");

  //     console.log("Current video URL:", videoUri);

  //     // Check if new video
  //     if (videoUri) {
  //       // setUploadStatus("Preparing video upload...");

  //       // Enhanced S3 direct upload - align with EditProfile.js approach
  //       console.log("--- In AddMediaScreen.js, using S3 direct upload ---");
  //       // First get the presigned URL (same as EditProfile.js)
  //       const presignedData = await MediaHelper.getPresignedUrl(userId);
  //       console.log("Presigned data:", presignedData);

  //       if (presignedData && presignedData.url) {
  //         // setUploadStatus(`Uploading ${videoFileSize}MB video directly to S3...`);
  //         console.log("Got presigned URL, starting upload to S3...", presignedData.url);

  //         // Perform the actual upload
  //         const uploadResult = await MediaHelper.uploadVideoToS3(videoUri, presignedData.url);
  //         const uploadSuccess = uploadResult.success;
  //         console.log("S3 upload result:", uploadSuccess ? "SUCCESS" : "FAILED");

  //         Alert.alert("Debug Info", `Video URI: ${videoUri}\nPresigned URL: ${presignedData?.url}\nVideo URL: ${presignedData?.videoUrl}\nUpload Success: ${uploadSuccess}`);

  //         if (uploadSuccess && presignedData.videoUrl) {
  //           console.log("Direct S3 upload successful, using S3 URL in form data:", presignedData.videoUrl);
  //           // setUploadStatus(`S3 upload successful! Using S3 URL: ${presignedData.videoUrl}`);

  //           uploadData.append("user_video_url", presignedData.videoUrl);
  //           console.log("Added user_video_url to form data:", presignedData.videoUrl);
  //         } else {
  //           console.error("Direct S3 upload failed, showing alert to user");
  //           // setUploadStatus("S3 upload failed, waiting for user input...");

  //           // Show alert to user with options to try regular upload or cancel
  //           return new Promise((resolve) => {
  //             Alert.alert("S3 Upload Failed", "Your video could not be uploaded to our secure server. Would you like to try a regular upload instead?", [
  //               {
  //                 text: "Cancel",
  //                 style: "cancel",
  //                 onPress: () => {
  //                   console.log("User cancelled after S3 upload failure");
  //                   setIsLoading(false);
  //                   // setUploadStatus("");
  //                   navigation.goBack(); // Return to previous screen
  //                   resolve(false);
  //                 },
  //               },
  //               {
  //                 text: "OK",
  //                 onPress: () => {
  //                   console.log("User opted to try regular upload");
  //                   // setUploadStatus("Trying regular upload...");
  //                   // Fall back to regular upload
  //                   console.log("Adding video as multipart form data...");
  //                   uploadData.append("user_video", {
  //                     uri: videoUri,
  //                     type: "video/mp4",
  //                     name: "user_video.mp4",
  //                   });
  //                   console.log("Added user_video to form data as multipart");
  //                   resolve(true);
  //                 },
  //               },
  //             ]);
  //           }).then((shouldContinue) => {
  //             if (!shouldContinue) {
  //               throw new Error("Upload cancelled by user after S3 upload failure");
  //             }
  //           });
  //         }
  //       } else {
  //         console.error("Failed to get presigned URL, showing alert to user");
  //         // setUploadStatus("Failed to get presigned URL, waiting for user input...");

  //         // Show alert to user with options to try regular upload or cancel
  //         return new Promise((resolve) => {
  //           Alert.alert("S3 Upload Failed", "We couldn't prepare our secure server for upload. Would you like to try a regular upload instead?", [
  //             {
  //               text: "Cancel",
  //               style: "cancel",
  //               onPress: () => {
  //                 console.log("User cancelled after presigned URL failure");
  //                 setIsLoading(false);
  //                 // setUploadStatus("");
  //                 navigation.goBack(); // Return to previous screen
  //                 resolve(false);
  //               },
  //             },
  //             {
  //               text: "OK",
  //               onPress: () => {
  //                 console.log("User opted to try regular upload");
  //                 // setUploadStatus("Trying regular upload...");
  //                 // Fall back to regular upload
  //                 console.log("Adding video as multipart form data (presigned URL failed)...");
  //                 uploadData.append("user_video", {
  //                   uri: videoUri,
  //                   type: "video/mp4",
  //                   name: "user_video.mp4",
  //                 });
  //                 console.log("Added user_video to form data as multipart");
  //                 resolve(true);
  //               },
  //             },
  //           ]);
  //         }).then((shouldContinue) => {
  //           if (!shouldContinue) {
  //             throw new Error("Upload cancelled by user after presigned URL failure");
  //           }
  //         });
  //       }
  //     }

  //     console.log("=== End Video Upload Debug ===");

  //     // Make the upload request
  //     console.log("=== Profile Update API Request ===", uploadData);
  //     // console.log("Making API request to update profile with timeout of 120 seconds...");
  //     // console.log("API endpoint: https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo");

  //     // Log the FormData contents (but not the actual file data)
  //     // console.log("FormData contents:");
  //     // for (let [key, value] of uploadData._parts) {
  //     //   if (key === "user_video") {
  //     //     console.log(`${key}: [File data omitted, size: ${videoFileSize}MB]`);
  //     //   } else if (key.startsWith("img_")) {
  //     //     // Extract the index from img_0, img_1, etc.
  //     //     const imgIndex = parseInt(key.substring(4), 10);
  //     //     const fileSize = photoFileSizes[imgIndex] || "unknown";
  //     //     console.log(`${key}: [File data omitted, size: ${fileSize}MB]`);
  //     //   } else {
  //     //     console.log(`${key}: ${value}`);
  //     //   }
  //     // }

  //     const startTime = Date.now();
  //     // setUploadStatus("Sending data to server...", uploadData);

  //     const response = await axios.put("https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo", uploadData, {
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //         Accept: "application/json",
  //       },
  //       timeout: 120000, // Increase timeout to 2 minutes for large files
  //       maxContentLength: Infinity,
  //       maxBodyLength: Infinity,
  //     });

  //     const endTime = Date.now();
  //     const requestDuration = (endTime - startTime) / 1000; // in seconds
  //     console.log("Request duration:", requestDuration.toFixed(2) + " seconds");

  //     if (response.status === 200) {
  //       // setUploadStatus("Upload successful!");
  //       console.log("Upload successful!");
  //       Alert.alert("Success", `Your profile has been updated!`);
  //       // Alert.alert("Success", `Video URL: ${presignedData.videoUrl}`);

  //       // This is the only functionality difference from EditProfile.js - navigate to next screen
  //       navigation.navigate("LocationScreen", { photos, videoUri });
  //     }
  //   } catch (error) {
  //     console.error("Error uploading profile:");

  //     let errorMessage = "Something went wrong while uploading.";
  //     let errorDetails = "";

  //     if (error.response) {
  //       // The request was made and the server responded with a status code outside of 2xx range
  //       console.error("Response data:", error.response.data);
  //       console.error("Response status:", error.response.status);
  //       console.error("Response headers:", error.response.headers);

  //       errorMessage = "Server Error";

  //       if (error.response.status === 413) {
  //         errorDetails = "The video is too large.  Please record a shorter video and try again.";
  //       } else if (error.response.status === 403) {
  //         errorDetails = "You don't have permission to upload this content.";
  //       } else if (error.response.status === 500) {
  //         errorDetails = "Our server encountered an error. Please try again later.";
  //       } else {
  //         errorDetails = `Error ${error.response.status}: ${error.response.data?.message || error.response.statusText || "Unknown error"}`;
  //       }
  //     } else if (error.request) {
  //       // The request was made but no response was received
  //       console.error("Error Request:", error.request);
  //       errorMessage = "Network Error";
  //       errorDetails = "Unable to connect to our servers. Please check your internet connection and try again.";
  //     } else {
  //       // Something happened in setting up the request
  //       console.error("Error Message:", error.message);
  //       errorMessage = "Upload Failed";
  //       errorDetails = error.message || "An unexpected error occurred during upload.";
  //     }

  //     // Show alert with retry option
  //     Alert.alert(errorMessage, errorDetails, [
  //       {
  //         text: "Try Again",
  //         onPress: () => {
  //           // Wait a moment before retrying
  //           setTimeout(() => {
  //             uploadMediaToBackend();
  //           }, 1000);
  //         },
  //       },
  //       { text: "Cancel", style: "cancel" },
  //     ]);
  //   } finally {
  //     setIsLoading(false);
  //     // setUploadStatus("");
  //   }
  // };

  const isFormComplete = photos.some((p) => p !== null) || videoUri;

  // const handleContinueOG = async () => {
  //   if (isFormComplete) {
  //     await uploadMediaToBackend();
  //     // Note: Navigation to LocationScreen is now handled in uploadMediaToBackend
  //     // only after a successful upload
  //   } else {
  //     // Show a message if no media was selected
  //     Alert.alert("Missing Content", "Please add at least one photo or video before continuing.", [{ text: "OK" }]);
  //   }
  // };

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
        // Validate the form before submitting
        // Check if there have been any changes
        // Only upload if there are changes
        // Check phone number format if provided

        // Create FormData object
        const uploadData = new FormData();
        uploadData.append("user_uid", uid);

        // Add modified fields to FormData
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

        console.log("=== End Photo Upload Debug ===");

        // Handle video upload
        console.log("=== Video Upload Debug ===");
        //
        //
        console.log("Current video URL:", videoUri);

        // Check if video was deleted or changed
        if (videoUri) {
          // First get the presigned URL (same as EditProfile.js)
          const presignedData = await MediaHelper.getPresignedUrl(uid);

          // setUploadStatus(`Uploading ${videoFileSize}MB video directly to S3...`);

          const uploadResult = await MediaHelper.uploadVideoToS3(videoUri, presignedData.url);
          const uploadSuccess = uploadResult.success;
          console.log("S3 upload result:", uploadSuccess ? "SUCCESS" : "FAILED");

          // Alert.alert("Debug Info", `Video URI: ${videoUri}\nPresigned URL: ${presignedData?.url}\nVideo URL: ${presignedData?.videoUrl}\nUpload Success: ${uploadSuccess}`);

          if (uploadSuccess && presignedData.videoUrl) {
            console.log("Direct S3 upload successful, using S3 URL in form data:", presignedData.videoUrl);

            uploadData.append("user_video_url", presignedData.videoUrl);
            console.log("Added user_video_url to form data:", presignedData.videoUrl);
          } else {
            console.error("Direct S3 upload failed");
            // setUploadStatus("S3 upload failed, falling back to regular upload");

            // // Fall back to regular upload
            // console.log("Adding video as multipart form data...");
            // uploadData.append("user_video", {
            //   uri: videoUri,
            //   type: "video/mp4",
            //   name: "user_video.mp4",
            // });
            // console.log("Added user_video to form data as multipart");
          }
        }
        console.log("=== End Video Upload Debug ===");

        // Make the upload request
        console.log("=== Profile Update API Request ===", uploadData);
        console.log("Making API request to update profile with timeout of 120 seconds...");
        console.log("API endpoint: https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo");

        const startTime = Date.now();
        console.log("FORM DATA Being sent to server from EditProfile.js: ", uploadData);
        // setUploadStatus("Sending data to server...", uploadData);

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
          //
          console.log("Upload successful!");
          Alert.alert("Success", `Your profile has been updated!`);
          // Alert.alert("Success", `Video URL: ${presignedData.videoUrl}`);

          // This is the only functionality difference from EditProfile.js - navigate to next screen
          navigation.navigate("LocationScreen", { photos, videoUri });
        }
      } catch (error) {
        console.error("Error uploading profile:");
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error("Response data:", error.response.data);
          console.error("Response status:", error.response.status);
          console.error("Response headers:", error.response.headers);
          Alert.alert("Server Error", `Failed to update profile. Please consider selecting smaller videos and photos or try saving images individually.`);
        } else if (error.request) {
          // The request was made but no response was received
          console.error("No response received:", error.request);
          if (error.code === "ECONNABORTED") {
            Alert.alert("Timeout Error", "The request took too long to complete. Please consider selecting smaller videos and photos or try saving images individually.");
          } else {
            Alert.alert("Network Error", "Failed to update profile. Please check your internet connection and try again.");
          }
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error("Error message:", error.message);
          Alert.alert("Error", `An error occurred: ${error.message}`);
        }
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error uploading profile:", error);
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1, paddingBottom: 20 }}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size='large' color='#E4423F' />
            <Text style={{ color: "#E4423F", marginTop: 10, marginBottom: 5, fontWeight: "bold" }}>Uploading...</Text>
            {/* <Text style={{ color: "#E4423F", marginTop: 10, marginBottom: 5, fontWeight: "bold" }}>{uploadStatus || "Uploading..."}</Text>
            {uploadStatus.includes("S3") && (
              <Text style={{ color: "#666", textAlign: "center", paddingHorizontal: 20 }}>Large videos are uploaded directly to our secure server. This may take a moment.</Text>
            )} */}
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

                {__DEV_MODE__ && (
                  <TouchableOpacity onPress={handleVideoUpload} style={styles.selectVideoButton}>
                    <Ionicons name='images-outline' size={24} color='#E4423F' />
                    <Text style={styles.uploadVideoText}>Select Video</Text>
                  </TouchableOpacity>
                )}
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
});
