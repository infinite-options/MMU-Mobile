import { Platform } from "react-native";

console.log("Loading environment variables...");
const ENV = {
  IOS_CLIENT_ID: process.env.EXPO_PUBLIC_MMU_IOS_CLIENT_ID,
  ANDROID_CLIENT_ID_Debug: process.env.EXPO_PUBLIC_MMU_ANDROID_CLIENT_ID_DEBUG,
  ANDROID_CLIENT_ID_Release: process.env.EXPO_PUBLIC_MMU_ANDROID_CLIENT_ID_RELEASE,
  WEB_CLIENT_ID: process.env.EXPO_PUBLIC_MMU_WEB_CLIENT_ID,
  GOOGLE_URL_SCHEME: process.env.EXPO_PUBLIC_MMU_GOOGLE_URL_SCHEME,
  APPLE_SERVICE_ID: process.env.EXPO_PUBLIC_MMU_APPLE_SERVICE_ID,
};

// Global development mode flag
// IMPORTANT: Set this to false before deploying to production/app store
export const __DEV_MODE__ = true;
console.log("__DEV_MODE__:", __DEV_MODE__);

// console.log("IOS Client ID:", ENV.IOS_CLIENT_ID);
// console.log("Android Client ID Debug:", ENV.ANDROID_CLIENT_ID_Debug);
// console.log("Android Client ID Release:", ENV.ANDROID_CLIENT_ID_Release);
// console.log("Web Client ID:", ENV.WEB_CLIENT_ID);
// console.log("Google URL Scheme:", ENV.GOOGLE_URL_SCHEME);

// Validate required environment variables
if (!ENV.IOS_CLIENT_ID) {
  console.error("ERROR: EXPO_PUBLIC_MMU_IOS_CLIENT_ID is not defined in .env file");
}
if (!ENV.ANDROID_CLIENT_ID_Debug) {
  console.error("ERROR: EXPO_PUBLIC_MMU_ANDROID_CLIENT_ID_DEBUG is not defined in .env file");
}
if (!ENV.ANDROID_CLIENT_ID_Release) {
  console.error("ERROR: EXPO_PUBLIC_MMU_ANDROID_CLIENT_ID_RELEASE is not defined in .env file");
}
if (!ENV.WEB_CLIENT_ID) {
  console.error("ERROR: EXPO_PUBLIC_MMU_WEB_CLIENT_ID is not defined in .env file");
}
if (!ENV.GOOGLE_URL_SCHEME) {
  console.error("ERROR: EXPO_PUBLIC_MMU_GOOGLE_URL_SCHEME is not defined in .env file");
}
if (!ENV.APPLE_SERVICE_ID) {
  console.error("ERROR: EXPO_PUBLIC_MMU_APPLE_SERVICE_ID is not defined in .env file");
}

// Get Android client ID based on environment
const getAndroidClientId = () => {
  // console.log("System Environment:", __DEV__);
  const clientId = __DEV__ ? ENV.ANDROID_CLIENT_ID_Debug : ENV.ANDROID_CLIENT_ID_Release;

  console.log("Android Environment:", __DEV__ ? "Development" : "Production");
  // console.log("Selected Android Client ID:", clientId);

  return clientId;
};

// Config object to export
const config = {
  googleClientIds: {
    ios: ENV.IOS_CLIENT_ID,
    android: getAndroidClientId(),
    web: ENV.WEB_CLIENT_ID,
    googleURLScheme: ENV.GOOGLE_URL_SCHEME,
    appleServicesId: ENV.APPLE_SERVICE_ID,
  },
  googleURLScheme: ENV.GOOGLE_URL_SCHEME,
};

// console.log("Exporting Google Sign-In config:", config);

export default config;
