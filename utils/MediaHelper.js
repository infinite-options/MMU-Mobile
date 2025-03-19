import * as ImagePicker from "expo-image-picker";
import { Alert, Platform, ActionSheetIOS, Linking } from "react-native";
import { getFileSizeInMB, loadTestVideos, isTestVideo as s3IsTestVideo, getTestVideoFileSize as s3GetTestVideoFileSize } from "./S3Helper";

/**
 * Get platform-specific video quality setting
 * @returns {number|string} Video quality setting appropriate for platform
 */
export const getVideoQuality = () => {
  return Platform.OS === "ios" ? ImagePicker.UIImagePickerControllerQualityType.Medium : 0.5;
};

/**
 * Request media library permissions
 * @returns {Promise<boolean>} Whether permissions were granted
 */
export const requestMediaLibraryPermissions = async () => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) {
    Alert.alert("Permission Required", "This app needs permission to access your photo library.", [
      { text: "Cancel", style: "cancel" },
      { text: "Settings", onPress: () => Linking.openSettings() },
    ]);
    return false;
  }
  return true;
};

/**
 * Request camera permissions
 * @returns {Promise<boolean>} Whether permissions were granted
 */
export const requestCameraPermissions = async () => {
  const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
  if (cameraPermission.status !== "granted") {
    Alert.alert("Permission Required", "Camera access is required to record video. Please enable it in your device settings.", [
      { text: "Cancel", style: "cancel" },
      { text: "Settings", onPress: () => Linking.openSettings() },
    ]);
    return false;
  }
  return true;
};

/**
 * Pick an image from the library
 * @param {object} options Additional options
 * @param {Array} testVideos Test videos array for file size calculation
 * @returns {Promise<{uri: string, fileSize: number}|null>} The selected image data or null
 */
export const pickImage = async (options = {}, testVideos = []) => {
  try {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      ...options,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      const fileSize = await getFileSizeInMB(uri, testVideos);
      return { uri, fileSize };
    }
    return null;
  } catch (error) {
    console.error("Error picking image:", error);
    Alert.alert("Error", "There was an issue processing the image.");
    return null;
  }
};

/**
 * Pick a video from the library
 * @param {Array} testVideos Test videos array for file size calculation
 * @returns {Promise<{uri: string, fileSize: number}|boolean>} The selected video data, false if canceled, or null if error
 */
export const pickVideo = async (testVideos = []) => {
  try {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1.0,
      videoQuality: getVideoQuality(),
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      console.log("Video selection success:", result.assets[0]);
      const uri = result.assets[0].uri;
      const fileSize = await getFileSizeInMB(uri, testVideos);

      // Show different alert messages based on video file size
      if (parseFloat(fileSize) < 2) {
        Alert.alert("Video Added", `Your ${fileSize}MB video has been added to your profile. It will be uploaded to our secure server when you continue.`, [{ text: "OK" }]);
      } else {
        Alert.alert(
          "Video Added",
          `Your ${fileSize}MB video has been added to your profile. We'll try to upload it to our secure server. Please consider selecting a shorter video if the upload fails.`,
          [{ text: "OK" }]
        );
      }

      return { uri, fileSize };
    } else {
      console.log("---- Video Selection Cancelled----");
      return false; // Explicitly return false for canceled
    }
  } catch (error) {
    console.error("Error picking video:", error);
    return null;
  }
};

/**
 * Record a video using the device camera
 * @param {Array} testVideos Test videos array for file size calculation
 * @returns {Promise<{uri: string, fileSize: number}|boolean>} The recorded video data, false if canceled, or null if error
 */
export const recordVideo = async (testVideos = []) => {
  try {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return null;

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
      const fileSize = await getFileSizeInMB(uri, testVideos);

      // Show different alert messages based on video file size
      if (parseFloat(fileSize) < 2) {
        Alert.alert("Video Recorded", `Your ${fileSize}MB video has been recorded. It will be uploaded to our secure server when you continue.`, [{ text: "OK" }]);
      } else {
        Alert.alert("Video Recorded", `Your ${fileSize}MB video has been recorded. We'll try to upload it to our secure server. Please consider recording a shorter video if the upload fails.`, [
          { text: "OK" },
        ]);
      }

      return { uri, fileSize };
    } else {
      console.log("---- Video Recording Cancelled----");
      return false; // Explicitly return false for canceled
    }
  } catch (error) {
    console.error("Error recording video:", error);
    return null;
  }
};

/**
 * Show options to select a test video
 * @param {Array} testVideos Array of test videos
 * @param {Function} onSelect Callback function when a test video is selected
 */
export const showTestVideoOptions = (testVideos, onSelect) => {
  if (!testVideos || testVideos.length === 0) {
    Alert.alert("Error", "No test videos available");
    return;
  }

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
          onSelect(buttonIndex - 1);
        }
      }
    );
  } else {
    // For Android, use Alert with buttons
    Alert.alert("Select a Test Video", "Choose a test video to use for upload testing", [
      { text: "Cancel", style: "cancel" },
      ...testVideos.map((video, index) => ({
        text: video.name,
        onPress: () => onSelect(index),
      })),
    ]);
  }
};

/**
 * Handle the selection of a test video
 * @param {number} index Index of the selected test video
 * @param {Array} testVideos Array of test videos
 * @param {string} context Context for alert message (e.g., "save changes" or "continue")
 * @returns {object|null} The selected test video object or null
 */
export const selectTestVideo = (index, testVideos, context = "continue") => {
  if (index < 0 || index >= testVideos.length) {
    return null;
  }

  const selectedVideo = testVideos[index];

  if (!selectedVideo.uri) {
    return null;
  }

  const fileSize = selectedVideo.size;

  // Show different alert messages based on video file size
  if (parseFloat(fileSize) < 2) {
    Alert.alert("Test Video Selected", `The selected test video is ${fileSize}MB. It will be uploaded to our secure server when you ${context}.`, [{ text: "OK" }]);
  } else {
    Alert.alert("Test Video Selected", `The selected test video is ${fileSize}MB. We'll try to upload it to our secure server. Please consider selecting a smaller test video if the upload fails.`, [
      { text: "OK" },
    ]);
  }

  return selectedVideo;
};

/**
 * Check if a URI is a test video
 * @param {string} uri The URI to check
 * @param {Array} testVideos Array of test videos
 * @returns {boolean} Whether the URI is a test video
 */
export const isTestVideo = (uri, testVideos) => {
  return s3IsTestVideo(uri, testVideos);
};

/**
 * Get the file size of a test video
 * @param {string} uri The URI of the test video
 * @param {Array} testVideos Array of test videos
 * @returns {number|null} The file size of the test video or null
 */
export const getTestVideoFileSize = (uri, testVideos) => {
  return s3GetTestVideoFileSize(uri, testVideos);
};

/**
 * Check the total file size of all media
 * @param {number|null} videoFileSize Size of video file in MB
 * @param {Array} photoFileSizes Array of photo file sizes in MB
 * @returns {number} Total file size in MB
 */
export const checkTotalFileSize = (videoFileSize, photoFileSizes) => {
  let totalSize = 0;

  // Add video file size if available
  if (videoFileSize) {
    totalSize += parseFloat(videoFileSize);
  }

  // Add photo file sizes if available
  if (Array.isArray(photoFileSizes)) {
    photoFileSizes.forEach((size) => {
      if (size) {
        totalSize += parseFloat(size);
      }
    });
  }

  // Round to 2 decimal places for display
  totalSize = parseFloat(totalSize.toFixed(2));

  console.log(`Total calculated file size: ${totalSize}MB`);
  return totalSize;
};

/**
 * Prompt user about large file sizes
 * @param {number} totalSize Total file size in MB
 * @param {number} threshold Threshold in MB to trigger warning
 * @returns {Promise<boolean>} Whether to proceed with the upload
 */
export const promptLargeFileSize = async (totalSize, threshold = 5) => {
  if (totalSize <= threshold) {
    return true;
  }

  return new Promise((resolve) => {
    Alert.alert(
      "Large File Size Warning",
      `The total size of your media is ${totalSize.toFixed(2)}MB, which exceeds the recommended ${threshold}MB limit. Please consider reducing the size of your media if the upload fails.`,
      [
        { text: "Cancel", onPress: () => resolve(false), style: "cancel" },
        { text: "Continue Anyway", onPress: () => resolve(true) },
      ]
    );
  });
};
