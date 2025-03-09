import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import config from "../config"; // Import config for Google client IDs
import * as AppleAuthentication from "expo-apple-authentication";

// Helper function to extract the last two digits before .apps.googleusercontent.com
const getLastTwoDigits = (clientId) => {
  if (!clientId) return "Not set";

  // Extract the part before .apps.googleusercontent.com
  const match = clientId.match(/(.+)\.apps\.googleusercontent\.com$/);
  if (match) {
    const idPart = match[1];
    // Get the last two digits of the ID part
    return "..." + idPart.slice(-2);
  }

  // Fallback if the pattern doesn't match
  return "..." + clientId.slice(-2);
};

const StartPage = () => {
  const navigation = useNavigation();
  const [appleAuthStatus, setAppleAuthStatus] = useState("Checking...");

  // Check if Apple Authentication is available
  useEffect(() => {
    const checkAppleAuthAvailability = async () => {
      try {
        // Check if the module is available
        if (Platform.OS === "ios") {
          try {
            const isAvailable = await AppleAuthentication.isAvailableAsync();
            setAppleAuthStatus(isAvailable ? "Available" : "Not Available");

            // If not available but on iOS, show an alert
            if (!isAvailable) {
              Alert.alert("Apple Sign In Not Available", "Apple Sign In is not available on this device. This may cause errors when trying to use Apple Sign In.", [{ text: "OK" }]);
              console.warn("Apple Authentication is not available on this iOS device.");
            }
          } catch (error) {
            setAppleAuthStatus("Error: Module Not Linked");
            console.error("Apple Authentication module error:", error);

            // Show an alert about the module not being properly linked
            Alert.alert("Apple Sign In Module Error", "The Apple Sign In module is not properly linked. This will cause errors when trying to use Apple Sign In.", [{ text: "OK" }]);
          }
        } else {
          setAppleAuthStatus("Not iOS");
        }
      } catch (error) {
        setAppleAuthStatus("Error");
        console.error("Error checking Apple Authentication:", error);
      }
    };

    checkAppleAuthAvailability();
  }, []);

  // Get Maps API Key from environment variables
  const mapsApiKey = process.env.EXPO_PUBLIC_MMU_GOOGLE_MAPS_API_KEY;
  const mapsApiKeyDisplay = mapsApiKey ? "..." + mapsApiKey.slice(-4) : "Not set";

  return (
    <View style={styles.container}>
      {/* App Title */}
      <Text style={styles.title}>meet me up</Text>

      {/* API Keys Info - For debugging */}
      <View style={styles.apiKeysContainer}>
        <Text style={styles.apiKeysTitle}>API Keys (Last 2 Digits):</Text>
        <Text style={styles.apiKeysText}>iOS: {getLastTwoDigits(config.googleClientIds.ios)}</Text>
        <Text style={styles.apiKeysText}>Android: {getLastTwoDigits(config.googleClientIds.android)}</Text>
        <Text style={styles.apiKeysText}>Web: {getLastTwoDigits(config.googleClientIds.web)}</Text>
        <Text style={styles.apiKeysText}>URL Scheme: {config.googleClientIds.googleURLScheme ? "..." + config.googleClientIds.googleURLScheme.slice(-2) : "Not set"}</Text>
        <Text style={styles.apiKeysText}>Maps API: {mapsApiKeyDisplay}</Text>
        <Text style={styles.apiKeysText}>Apple Auth: {appleAuthStatus}</Text>
        <Text style={styles.apiKeysText}>Environment: {__DEV__ ? "Development" : "Production"}</Text>
      </View>

      {/* Get Started Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("LandingPage")}>
          <Text style={styles.buttonText}>Get Started!</Text>
        </TouchableOpacity>

        {/* Log In Link */}
        <Text style={styles.loginText}>
          Already have an account?{" "}
          <Text style={styles.loginLink} onPress={() => navigation.navigate("Login")}>
            Log In
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E4423F",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    position: "absolute",
    top: "35%", // Moves the text higher
  },
  apiKeysContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    position: "absolute",
    top: "45%", // Position below the title
    width: "90%",
  },
  apiKeysTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  apiKeysText: {
    fontSize: 10,
    color: "#666",
    marginBottom: 2,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 50, // Positions the container near the bottom
    alignItems: "center",
    width: "100%",
  },
  button: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: "center",
    width: "100%",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  loginText: {
    fontSize: 16,
    color: "#1A1A1A",
    marginTop: 10,
  },
  loginLink: {
    fontWeight: "bold",
    textDecorationLine: "underline",
    color: "#F5F5F5",
  },
});

export default StartPage;
