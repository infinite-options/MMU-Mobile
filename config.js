import { Platform } from "react-native";

console.log("Loading environment variables...");
const ENV = {
  IOS_CLIENT_ID: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
  ANDROID_CLIENT_ID_Debug: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID_DEBUG,
  ANDROID_CLIENT_ID_Release: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID_RELEASE,
  WEB_CLIENT_ID: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
  GOOGLE_URL_SCHEME: process.env.EXPO_PUBLIC_GOOGLE_URL_SCHEME,
};

// Log available environment variables
console.log("Environment variables loaded:", {
  iosClientId: ENV.IOS_CLIENT_ID,
  androidClientIdDebug: ENV.ANDROID_CLIENT_ID_Debug,
  androidClientIdRelease: ENV.ANDROID_CLIENT_ID_Release,
  webClientId: ENV.WEB_CLIENT_ID,
  googleUrlScheme: ENV.GOOGLE_URL_SCHEME
});

// Validate required environment variables
if (!ENV.IOS_CLIENT_ID) {
  console.error("ERROR: EXPO_PUBLIC_IOS_CLIENT_ID is not defined in .env file");
}
if (!ENV.ANDROID_CLIENT_ID_Debug) {
  console.error("ERROR: EXPO_PUBLIC_ANDROID_CLIENT_ID_DEBUG is not defined in .env file");
}
if (!ENV.ANDROID_CLIENT_ID_Release) {
  console.error("ERROR: EXPO_PUBLIC_ANDROID_CLIENT_ID_RELEASE is not defined in .env file");
}
if (!ENV.WEB_CLIENT_ID) {
  console.error("ERROR: EXPO_PUBLIC_WEB_CLIENT_ID is not defined in .env file");
}
if (!ENV.GOOGLE_URL_SCHEME) {
  console.error("ERROR: EXPO_PUBLIC_GOOGLE_URL_SCHEME is not defined in .env file");
}

// Get Android client ID based on environment
const getAndroidClientId = () => {
  const clientId = __DEV__ 
    ? ENV.ANDROID_CLIENT_ID_Debug 
    : ENV.ANDROID_CLIENT_ID_Release;

  console.log("Android Environment:", __DEV__ ? "Development" : "Production");
  console.log("Selected Android Client ID:", clientId);
  
  return clientId;
};

// Config object to export
const config = {
  googleClientIds: {
    ios: ENV.IOS_CLIENT_ID,
    android: getAndroidClientId(),
    web: ENV.WEB_CLIENT_ID,
  },
  googleURLScheme: ENV.GOOGLE_URL_SCHEME,
};

console.log("Exporting Google Sign-In config:", config);

export default config;