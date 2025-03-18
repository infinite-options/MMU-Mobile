import axios from "axios";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

/**
 * Get a presigned URL from the server for direct S3 upload
 * @param {string} uid - The user ID
 * @returns {Promise<object|null>} - The presigned URL data or null if there was an error
 */
export const getPresignedUrl = async (uid) => {
  try {
    console.log("===== In S3Helper.js - Presigned URL Request =====");
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

      console.log("=== End Presigned URL Request ===");
      return response.data;
    } else {
      console.error("Invalid response format for presigned URL:", JSON.stringify(response.data));
      console.log("=== End Presigned URL Request (Failed) ===\n");
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
    console.log("=== End Presigned URL Request (Error) ===\n");
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
    console.log("===== In S3Helper.js -  S3 Direct Upload Process =====");
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
      console.log("=== End S3 Direct Upload Process (File Not Found) ===");
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
        console.log("=== End S3 Direct Upload Process (Success) ===\n");
        return { success: true };
      } else {
        const responseText = await response.text();
        console.error("S3 upload failed with status:", response.status);
        console.error("S3 error response:", responseText);
        console.log("=== End S3 Direct Upload Process (Failed) ===\n");
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
      console.log("=== End S3 Direct Upload Process (Error) ===\n");
      return { success: false };
    }
  } catch (error) {
    console.error("Error preparing file for S3 upload:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    if (error.stack) {
      console.error("Error stack:", error.stack);
    }
    console.log("=== End S3 Direct Upload Process (Preparation Error) ===\n");
    return { success: false };
  }
};

/**
 * Get the file size in MB for a given file URI
 * @param {string} fileUri - The file URI
 * @param {function} getTestVideoFileSize - Optional function to get test video file size
 * @param {function} isTestVideo - Optional function to check if a URI is a test video
 * @returns {Promise<string|null>} - The file size in MB or null
 */
export const getFileSizeInMB = async (fileUri, getTestVideoFileSize, isTestVideo) => {
  try {
    console.log("===== In S3Helper.js - getFileSizeInMB =====");
    // Check if it's a test video first (only if the functions are provided)
    if (getTestVideoFileSize && isTestVideo) {
      const testVideoSize = getTestVideoFileSize(fileUri);
      if (testVideoSize) {
        console.log(`Test video detected, size: ${testVideoSize}MB`);
        return testVideoSize;
      }
    }

    if (!fileUri || typeof fileUri !== "string") return null;

    // Handle remote URLs (S3 URLs)
    if (fileUri.startsWith("http") && (!isTestVideo || !isTestVideo(fileUri))) {
      // For remote files, we can't get the size directly
      // Return null or a placeholder
      return null;
    }

    // For local files, get the file info
    if (Platform.OS === "ios") {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      const fileSizeInBytes = fileInfo.size;
      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
      console.log(`File size: ${fileSizeInMB}MB`);
      return fileSizeInMB;
    } else {
      // For Android, we need to use the content resolver
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists && fileInfo.size) {
        const fileSizeInMB = (fileInfo.size / (1024 * 1024)).toFixed(2);
        console.log(`File size: ${fileSizeInMB}MB`);
        return fileSizeInMB;
      } else {
        console.log("File info not available, using estimated size");
        return "1.5"; // Default estimated size
      }
    }
  } catch (error) {
    console.error("Error getting file size:", error);
    return "1.0"; // Default fallback size
  }
};
