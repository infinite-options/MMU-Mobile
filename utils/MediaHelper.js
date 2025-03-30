import * as ImagePicker from "expo-image-picker";
import { Alert, Platform, ActionSheetIOS, Linking } from "react-native";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import axios from "axios";
import Constants from "expo-constants";

// Define test video paths
const TEST_VIDEOS = {
  mike: require("../assets/mike768kb.mp4"),
  john: require("../assets/john1400kb.mp4"),
  bob: require("../assets/bob7100kb.mp4"),
};

/**
 * Load test videos for development and testing purposes
 * @returns {Promise<Array>} Array of test video objects with uri and size information
 */
export const loadTestVideos = async () => {
  try {
    console.log("===== In MediaHelper.js - Loading Test Videos =====");

    // Create assets from the test video modules
    const mikeAsset = Asset.fromModule(TEST_VIDEOS.mike);
    const johnAsset = Asset.fromModule(TEST_VIDEOS.john);
    const bobAsset = Asset.fromModule(TEST_VIDEOS.bob);

    // Download all assets in parallel
    await Promise.all([mikeAsset.downloadAsync(), johnAsset.downloadAsync(), bobAsset.downloadAsync()]);

    // Create the test videos array with local URIs
    const testVideos = [
      { name: "Mike (768KB)", uri: mikeAsset.localUri || mikeAsset.uri, size: 0.768 },
      { name: "John (1.4MB)", uri: johnAsset.localUri || johnAsset.uri, size: 1.4 },
      { name: "Bob (7.1MB)", uri: bobAsset.localUri || bobAsset.uri, size: 7.1 },
    ];

    console.log("Test videos loaded successfully");
    console.log("===== End Loading Test Videos =====");

    return testVideos;
  } catch (error) {
    console.error("Error loading test videos:", error);
    // Return empty test videos as a fallback
    return [
      { name: "Mike (768KB)", uri: null, size: 0.768 },
      { name: "John (1.4MB)", uri: null, size: 1.4 },
      { name: "Bob (7.1MB)", uri: null, size: 7.1 },
    ];
  }
};

/**
 * Get a presigned URL from the server for direct S3 upload
 * @param {string} uid - The user ID
 * @returns {Promise<object|null>} - The presigned URL data or null if there was an error
 */
export const getPresignedUrl = async (uid) => {
  try {
    console.log("===== In MediaHelper.js - Presigned URL Request =====");
    // console.log("Requesting presigned URL for user:", uid);

    const requestData = {
      user_uid: uid,
      user_video_filetype: "video/mp4",
    };

    // console.log("Request payload:", JSON.stringify(requestData, null, 2));

    const response = await axios.post("https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/s3Link", requestData);

    // console.log("Presigned URL API RAW response status:", response);
    console.log("Presigned URL API response data:", response.data);
    // console.log("Presigned URL API response status:", response.status);
    // console.log("Presigned URL API response headers:", JSON.stringify(response.headers, null, 2));
    // console.log("Presigned URL API response data:", JSON.stringify(response.data, null, 2));

    if (response.data && response.data.url) {
      //   console.log("Got presigned URL:", response.data.url);
      console.log("S3 video URL will be:", response.data.videoUrl);

      // Add detailed analysis of the response structure
      //   console.log("Presigned URL response structure: ", response.data.key);

      console.log("===== End Presigned URL Request (Success)=====");
      return response.data;
    } else {
      console.error("Invalid response format for presigned URL:", JSON.stringify(response.data));
      console.log("===== End Presigned URL Request (Failed) =====\n");
      return null;
    }
  } catch (error) {
    console.error("Error getting presigned URL:");
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    } else {
      console.error("Error message:", error.message);
    }
    console.log("===== End Presigned URL Request (Error) =====\n");
    return null;
  }
};

/**
 * Upload a video file directly to S3 using a presigned URL
 * @param {string} fileUri - The local file URI
 * @param {string} presignedUrl - The presigned URL for S3 upload
 * @returns {Promise<{success: boolean}>} - Object with success status
 */
export const uploadVideoToS3 = async (fileUri, presignedUrl) => {
  try {
    console.log("===== In MediaHelper.js -  S3 Direct Upload Process =====");
    // console.log("Starting direct S3 upload for large video file");
    // console.log("File URI:", fileUri);
    // console.log("Presigned URL:", presignedUrl);

    // Parse the presigned URL to get query parameters
    const urlObj = new URL(presignedUrl);
    // console.log("S3 bucket:", urlObj.hostname);
    // console.log("S3 key path:", urlObj.pathname);
    // console.log("S3 query parameters:", urlObj.search);

    // Add more detailed analysis of the presigned URL
    // console.log("Presigned URL analysis:");
    // console.log("- Protocol:", urlObj.protocol);
    // console.log("- Full hostname:", urlObj.host);
    // console.log("- Path:", urlObj.pathname);

    // Parse and log query parameters individually
    const queryParams = {};
    urlObj.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    // console.log("- Query parameters:", JSON.stringify(queryParams, null, 2));

    // Get file info to confirm size before upload
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    // console.log("File info before upload:", JSON.stringify(fileInfo, null, 2));

    if (!fileInfo.exists) {
      console.error("File does not exist at path:", fileUri);
      console.log("===== End S3 Direct Upload Process (File Not Found) =====");
      return { success: false };
    }

    const fileSizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2);
    console.log("File size before upload:", fileSizeMB + " MB");

    // Fetch the file and create a blob
    // console.log("Fetching file and creating blob...");
    const file = await fetch(fileUri);
    const blob = await file.blob();
    const blobSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
    // console.log("Blob created successfully");
    // console.log("Blob size:", blobSizeMB + " MB");
    // console.log("Blob type:", blob.type);

    // Determine content type based on file extension
    let contentType = "video/mp4";
    if (fileUri.toLowerCase().endsWith(".mov")) {
      contentType = "video/quicktime";
    } else if (fileUri.toLowerCase().endsWith(".avi")) {
      contentType = "video/x-msvideo";
    }

    // console.log("Using content type for upload:", contentType);

    // Log request headers
    const requestHeaders = {
      "Content-Type": contentType,
    };
    // console.log("Request headers:", JSON.stringify(requestHeaders, null, 2));
    // console.log("Sending PUT request to S3 with timeout of 120 seconds...");

    // Use a longer timeout for large files
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("Upload timeout reached (120 seconds), aborting...");
      controller.abort();
    }, 120000); // 2 minute timeout

    try {
      const startTime = Date.now();
      console.log("Upload started at:", new Date(startTime).toISOString());

      const response = await fetch(presignedUrl, {
        method: "PUT",
        body: blob,
        headers: requestHeaders,
        signal: controller.signal,
      });

      const endTime = Date.now();
      const uploadDuration = (endTime - startTime) / 1000; // in seconds
      console.log("Upload completed at:", new Date(endTime).toISOString());
      //   console.log("Upload duration:", uploadDuration.toFixed(2) + " seconds");
      //   console.log("Upload speed:", (blobSizeMB / uploadDuration).toFixed(2) + " MB/s");

      clearTimeout(timeoutId); // Clear the timeout if request completes

      //   console.log("S3 upload response status:", response.status);
      //   console.log("S3 upload response status text:", response.statusText);
      //   console.log("S3 upload response headers:", JSON.stringify([...response.headers.entries()], null, 2));

      if (response.ok) {
        // console.log("Direct S3 upload successful!");
        console.log("===== End S3 Direct Upload Process (Success) =====\n");
        return { success: true };
      } else {
        const responseText = await response.text();
        console.error("S3 upload failed with status:", response.status);
        console.error("S3 error response:", responseText);
        console.log("===== End S3 Direct Upload Process (Failed) =====\n");
        return { success: false };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId); // Clear the timeout on error
      if (fetchError.name === "AbortError") {
        console.error("S3 upload timed out after 120 seconds");
      } else {
        console.error("Fetch error during S3 upload:", fetchError);
        console.error("Error name:", fetchError.name);
        console.error("Error message:", fetchError.message);
        if (fetchError.stack) {
          console.error("Error stack:", fetchError.stack);
        }
      }
      console.log("===== End S3 Direct Upload Process (Error) =====\n");
      return { success: false };
    }
  } catch (error) {
    console.error("Error preparing file for S3 upload:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    if (error.stack) {
      console.error("Error stack:", error.stack);
    }
    console.log("===== End S3 Direct Upload Process (Preparation Error) =====\n");
    return { success: false };
  }
};

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

export const getTestVideoFileSize = (uri, testVideos) => {
  if (!uri || !testVideos || !Array.isArray(testVideos)) return null;

  // Find the test video by URI
  const testVideo = testVideos.find((video) => {
    if (!video.uri) return false;
    return uri.includes(video.uri.split("/").pop());
  });

  if (testVideo) {
    return testVideo.size;
  }
  return null;
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

export const getFileSizeInMB = async (fileUri, testVideos = []) => {
  try {
    console.log("===== In MediaHelper.js - getFileSizeInMB =====");
    // console.log("fileUri:", fileUri);
    // console.log("testVideos:", testVideos);

    // Check if it's a test video first (only if testVideos is provided)
    if (testVideos && testVideos.length > 0) {
      const testVideoSize = getTestVideoFileSize(fileUri, testVideos);
      if (testVideoSize) {
        console.log(`Test video detected, size: ${testVideoSize}MB`);
        return testVideoSize.toString();
      }
    }
    if (!fileUri || typeof fileUri !== "string") return null;

    // Handle remote URLs (S3 URLs)
    if (fileUri.startsWith("http")) {
      // For remote files, we can't get the size directly
      // Return a default size for S3 URLs
      console.log("Remote URL detected, using default size");
      return "1.5"; // Default size for remote videos
    }

    // For local files, get the file info
    if (Platform.OS === "ios") {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      const fileSizeInBytes = fileInfo.size;
      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
      console.log(`in ios, File size: ${fileSizeInMB}MB`);
      return fileSizeInMB;
    } else {
      // For Android, we need to use the content resolver
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists && fileInfo.size) {
        const fileSizeInMB = (fileInfo.size / (1024 * 1024)).toFixed(2);
        console.log(`in android, File size: ${fileSizeInMB}MB`);
        return fileSizeInMB;
      } else {
        console.log("File info not available, using estimated size");
        return "1.5"; // Default estimated size
      }
    }
  } catch (error) {
    console.error("Error getting file size. (Error 4)", error);
    return "1.0"; // Default fallback size
  }
};

/**
 * Processes and stores video data
 * @param {Object} result The result from ImagePicker
 * @param {Array} testVideos Test videos array for file size calculation
 * @returns {Promise<{uri: string, fileSize: number}|boolean>} The processed video data, false if canceled, or null if error
 */
export const storeVideo = async (result) => {
  try {
    if (!result.canceled && result.assets?.[0]?.uri) {
      console.log("In MediaHelper, Video stored:", result.assets[0]);

      const uri = result.assets[0].uri;
      const fileSize = await getFileSizeInMB(uri);
      console.log(`In MediaHelper, Video file size: ${fileSize}MB`);

      // Standardized alert messages
      if (parseFloat(fileSize) < 2) {
        Alert.alert("Video Selected", `Your ${fileSize}MB video has been selected. It will be uploaded to our secure server when you continue.`, [{ text: "OK" }]);
      } else {
        Alert.alert("Video Selected", `Your ${fileSize}MB video has been selected. We'll try to upload it to our secure server. Please consider selecting a shorter video if the upload fails.`, [
          { text: "OK" },
        ]);
      }
      console.log("In MediaHelper, just before return:", { uri, fileSize });
      return { uri, fileSize };
    } else {
      console.log("---- Video NOT stored----");
      Alert.alert("Video Selection Cancelled", "No video was stored. Please try again.", [{ text: "OK" }]);
      return false; // Explicitly return false for canceled
    }
  } catch (error) {
    console.error("Error processing video:", error);
    Alert.alert("Error", "There was an issue processing the video. (Error 3)");
    return null;
  }
};

export const useTestVideo = (testVideos = []) => {
  console.log("===== In MediaHelper.js - useTestVideo =====");

  return new Promise((resolve) => {
    if (!testVideos || testVideos.length === 0) {
      Alert.alert("Error", "No test videos available");
      resolve(null);
      return;
    }

    const handleVideoSelection = (index) => {
      const selectedVideo = testVideos[index];
      console.log("Selected video:", selectedVideo);
      if (!selectedVideo) {
        resolve(null);
        return;
      }
      console.log("Selected video URI raw:", selectedVideo.uri);
      const uri = selectedVideo.uri;
      console.log("Selected video URI:", uri);
      const fileSize = selectedVideo.size;
      console.log(`Video file size: ${fileSize}MB`);
      resolve({ uri, fileSize });
    };

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
            handleVideoSelection(buttonIndex - 1);
          } else {
            resolve(null);
          }
        }
      );
    } else {
      // For Android, use Alert with buttons
      Alert.alert("Select a Test Video", "Choose a test video to use for upload testing", [
        { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
        ...testVideos.map((video, index) => ({
          text: video.name,
          onPress: () => handleVideoSelection(index),
        })),
      ]);
    }
  });
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
 * @param {string} uri - The URI to check
 * @param {Array} testVideos - Array of test video objects
 * @returns {boolean} - True if the URI corresponds to a test video
 */
export const isTestVideo = (uri, testVideos) => {
  if (!uri || !testVideos || !Array.isArray(testVideos)) return false;

  // Check if the URI contains any test video filenames
  return testVideos.some((video) => {
    if (!video.uri) return false;
    return uri.includes(video.uri.split("/").pop());
  });
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

/**
 * Handle video upload process including direct S3 upload
 * @param {string} userId User ID for the presigned URL
 * @param {string} videoUri URI of the video to upload
 * @returns {Promise<{success: boolean, videoUrl: string|null}>} Upload result with success status and video URL
 */
export const handleVideoUpload = async (userId, videoUri) => {
  try {
    if (!videoUri) {
      return { success: false, videoUrl: null };
    }

    // Determine if running in simulator
    const isSimulator = Platform.select({
      ios: Constants.executionEnvironment === "simulator" || Constants.modelName?.toLowerCase().includes("simulator") || !Constants.isDevice,
      android: !Constants.isDevice,
      default: false,
    });

    console.log("=== Device Detection ===");
    console.log("Platform:", Platform.OS);
    console.log("Is Simulator:", isSimulator);
    console.log("iOS Model Name:", Constants.modelName);
    console.log("Is Device:", Constants.isDevice);
    console.log("Execution Environment:", Constants.executionEnvironment);
    console.log("=====================");
    console.log("--- In MediaHelper.js handleVideoUpload Function ---");
    console.log("Starting video upload for user:", userId);
    console.log("Video URI:", videoUri);

    // Get presigned URL
    const presignedData = await getPresignedUrl(userId);
    console.log("Presigned URL data:", presignedData);

    if (!presignedData || !presignedData.url) {
      console.error("Failed to get presigned URL");
      return { success: false, videoUrl: null };
    }

    // Upload to S3
    const uploadResult = await uploadVideoToS3(videoUri, presignedData.url);
    console.log("S3 upload result:", uploadResult);

    if (uploadResult.success && presignedData.videoUrl) {
      console.log("Direct S3 upload successful, using S3 URL:", presignedData.videoUrl);
      return {
        success: true,
        videoUrl: presignedData.videoUrl,
      };
    } else {
      console.error("S3 upload failed");
      return { success: false, videoUrl: null };
    }
  } catch (error) {
    console.error("Error in handleVideoUpload:", error);
    return { success: false, videoUrl: null };
  }
};

/**
 * Handle video recording with proper fallbacks
 * @param {Array} testVideos Array of test videos
 * @returns {Promise<{uri: string, fileSize: number}|null>} The processed video data or null
 */
export const handleVideoRecording = async (testVideos) => {
  try {
    console.log("===== In MediaHelper.js - handleVideoRecording =====");
    const hasPermission = await requestCameraPermissions();

    if (!hasPermission) {
      console.log("No camera permission, trying library selection");
      return handleVideoLibrarySelection(testVideos);
    }

    // If we have camera permission, try recording
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1.0,
        videoQuality: getVideoQuality(),
        maxDuration: 60,
        saveToPhotos: true,
      });

      if (!result.canceled) {
        console.log("Camera recording successful, processing video");
        return await storeVideo(result);
      } else {
        console.log("Camera recording cancelled, trying library selection");
        return handleVideoLibrarySelection(testVideos);
      }
    } catch (cameraError) {
      console.log("Camera error detected:", cameraError);
      return handleVideoLibrarySelection(testVideos);
    }
  } catch (error) {
    console.error("Error in handleVideoRecording:", error);
    return null;
  }
};

/**
 * Handle video library selection with test video fallback
 * @param {Array} testVideos Array of test videos
 * @returns {Promise<{uri: string, fileSize: number}|null>} The processed video data or null
 */
export const handleVideoLibrarySelection = async (testVideos) => {
  try {
    console.log("===== In MediaHelper.js - handleVideoLibrarySelection =====");
    const hasPermission = await requestMediaLibraryPermissions();

    if (!hasPermission) {
      console.log("No library permission, offering test videos");
      return await useTestVideo(testVideos);
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1.0,
      videoQuality: getVideoQuality(),
    });

    if (!result.canceled) {
      console.log("Library selection successful, processing video");
      return await storeVideo(result);
    } else {
      console.log("Library selection cancelled, offering test videos");
      return await useTestVideo(testVideos);
    }
  } catch (error) {
    console.error("Error in handleVideoLibrarySelection:", error);
    return null;
  }
};
