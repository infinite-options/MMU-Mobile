import Constants from "expo-constants";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { Platform } from "react-native";

const ENV = {
  dev: {
    webClientId: "466541803518-gsnmbth4efjiajdpl1i9c2phrlu81njq.apps.googleusercontent.com",
    iosClientId: "466541803518-mpejfib4i7g8m88tbk4hpgfrmqlt9aho.apps.googleusercontent.com",
    androidClientId: "466541803518-41pdpb9pei96hihdt70db2e6a5hg8sj6.apps.googleusercontent.com",
    useProxy: true,
  },
  prod: {
    webClientId: "466541803518-gsnmbth4efjiajdpl1i9c2phrlu81njq.apps.googleusercontent.com",
    iosClientId: "466541803518-mpejfib4i7g8m88tbk4hpgfrmqlt9aho.apps.googleusercontent.com",
    androidClientId: "466541803518-41pdpb9pei96hihdt70db2e6a5hg8sj6.apps.googleusercontent.com",
    useProxy: true,
  },
};

const logEnvironmentInfo = () => {
  // Get manifest values safely
  const manifest = Constants.manifest2 || Constants.manifest || {};
  const { extra = {}, ios = {}, android = {} } = manifest;

  const info = {
    environment: {
      platform: Platform.OS,
      appOwnership: Constants.appOwnership || "development",
      expoVersion: Constants.expoVersion,
      isDevelopment: Constants.appOwnership === "expo" || Constants.appOwnership === null,
    },
    app: {
      name: manifest.name || "MMU App",
      slug: manifest.slug || "meetmeup",
      scheme: manifest.scheme || "com.infiniteoptions.meetmeupapp",
    },
    platform: {
      ios: {
        bundleIdentifier: ios.bundleIdentifier || "com.infiniteoptions.meetmeupapp",
      },
      android: {
        package: android.package || "com.infiniteoptions.meetmeupapp",
      },
    },
    project: {
      owner: manifest.owner || "pmarathay",
      projectId: extra?.eas?.projectId || "Running in Expo Go",
    },
  };

  console.log("Environment Details:", JSON.stringify(info, null, 2));
  return info;
};

const getEnvVars = (env = Constants.appOwnership) => {
  const envInfo = logEnvironmentInfo();
  console.log(`Current environment: ${env || "development"}`);

  if (envInfo.environment.isDevelopment) {
    console.log("Using development configuration with Expo proxy");
    return ENV.dev;
  }

  console.log("Using production configuration");
  return ENV.prod;
};

export const getGoogleConfig = () => {
  const env = getEnvVars();
  const envInfo = logEnvironmentInfo();

  // Create the Expo proxy redirect URI
  const redirectUri = `https://auth.expo.io/@${envInfo.project.owner}/${envInfo.app.slug}`;

  const config = {
    clientId: env.webClientId, // Primary identifier
    webClientId: env.webClientId, // Backup for web platform
    redirectUri,
    useProxy: true,
  };

  console.log("Google Auth Configuration:", {
    clientId: config.clientId,
    webClientId: config.webClientId,
    redirectUri: config.redirectUri,
    useProxy: config.useProxy,
    platform: Platform.OS,
    environment: "Expo Go Development",
    note: "Using Expo proxy for authentication",
  });

  return config;
};

export const isProduction = () => {
  const isProd = Constants.appOwnership === "standalone";
  console.log(`Running in ${isProd ? "production" : "development"} mode`);
  return isProd;
};
