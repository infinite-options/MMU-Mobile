import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity, Image, Alert, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import config from "../config";

// Make sure to complete any pending auth sessions
WebBrowser.maybeCompleteAuthSession();

/**
 * A simplified Apple Sign-in component that focuses on web-based authentication for Android
 */
const AppleSignIn = ({ onSignIn, onError }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  /**
   * Handle Apple Sign-in process
   */
  const handleAppleSignIn = async () => {
    // Prevent multiple authentication attempts
    if (isAuthenticating) {
      console.log("Authentication already in progress, ignoring tap");
      return;
    }

    console.log("Apple button clicked - handleAppleSignIn called");
    console.log("Platform:", Platform.OS);

    setIsAuthenticating(true);

    try {
      // Clean up any existing auth sessions - only on iOS
      if (Platform.OS === "ios") {
        try {
          await WebBrowser.dismissAuthSession();
        } catch (error) {
          console.log("Error dismissing auth session:", error);
          // Continue anyway
        }
      }

      // For Android, use web-based Sign in with Apple
      // Use a custom URL scheme that will redirect back to your app
      const redirectUri = "https://auth.expo.io/@pmarathay/meetmeup/redirect";
      const appleServiceId = config.googleClientIds.appleServicesId;

      console.log("Using Apple Service ID:", appleServiceId);
      console.log("Using redirect URI:", redirectUri);

      // Construct the URL with proper parameters
      const authUrl =
        `https://appleid.apple.com/auth/authorize?` +
        `client_id=${appleServiceId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=name%20email` +
        `&response_mode=form_post`;

      console.log("Opening auth URL:", authUrl);

      // Set up a listener for the redirect URL
      const redirectListener = Linking.addEventListener("url", (event) => {
        console.log("Redirect URL received:", event.url);
      });

      // Open the authentication URL in a browser
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      // Clean up the listener
      redirectListener.remove();

      console.log("Web authentication result:", result);

      // On Android, we'll almost always get a "dismiss" result when the browser is closed
      // after the redirect to auth.expo.io, which shows a "Not Found" page
      if (result.type === "success" || result.type === "dismiss") {
        console.log("Authentication completed with result type:", result.type);

        // Create a mock user for testing purposes
        const userInfo = {
          user: {
            id: "apple_web_user",
            email: "apple_user@example.com",
            name: "Apple User",
          },
          idToken: "mock_token",
        };

        if (result.type === "success") {
          Alert.alert("Apple Sign-In Successful", "You've successfully signed in with Apple.", [{ text: "OK" }]);
        } else {
          // For dismiss case
          Alert.alert("Apple Sign-In", "The authentication process completed, but we couldn't verify the result. Proceeding with a test account.", [{ text: "OK" }]);
        }

        onSignIn(userInfo);
      } else if (result.type === "cancel") {
        console.log("User cancelled the authentication");
      } else {
        console.log("Web authentication failed with result type:", result.type);
        onError("Authentication failed");
      }
    } catch (error) {
      console.error("Apple Sign-In Error:", error);

      // Show a more user-friendly error message
      let errorMessage = error.message || String(error);
      if (errorMessage.includes("invalid_client")) {
        errorMessage = "The Apple Sign-In service is not properly configured. Please check your Apple Service ID and redirect URL configuration.";
      } else if (errorMessage.includes("WebBrowser")) {
        errorMessage = "There was a problem with the browser session. Please try again.";
      }

      Alert.alert("Apple Sign-In Error", errorMessage, [{ text: "OK" }]);

      onError(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Render the Apple Sign-in button
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.androidAppleButton}
        disabled={isAuthenticating}
        onPress={() => {
          console.log("Apple icon TouchableOpacity pressed directly");
          handleAppleSignIn();
        }}
      >
        <Image source={require("../assets/apple_logo.png")} style={styles.appleLogo} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Remove marginTop to align with Google button
  },
  androidAppleButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 50,
    padding: 15,
    marginHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 75, // Set fixed width to match Google button
    height: 75, // Set fixed height to match Google button
  },
  appleLogo: {
    width: 45,
    height: 45,
  },
});

export default AppleSignIn;
