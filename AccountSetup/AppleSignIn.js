import React, { useState, useEffect } from "react";
import { StyleSheet, View, Platform, TouchableOpacity, Text, Image } from "react-native";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config"; // Fix the import path

// Conditionally import AppleAuthentication only on iOS
const AppleAuthentication = Platform.OS === "ios" ? require("expo-apple-authentication") : null;

const AppleSignIn = ({ onSignIn, onError }) => {
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);

  // Check if Apple Authentication is available (only on iOS)
  useEffect(() => {
    const checkAvailability = async () => {
      if (Platform.OS === "ios") {
        try {
          const isAvailable = await AppleAuthentication.isAvailableAsync();
          setIsAppleAuthAvailable(isAvailable);
          console.log("Apple Authentication available:", isAvailable);
        } catch (error) {
          console.log("Error checking Apple Authentication availability:", error);
          setIsAppleAuthAvailable(false);
        }
      } else {
        // On Android, Apple Authentication is not available natively
        setIsAppleAuthAvailable(false);
      }
    };

    checkAvailability();
  }, []);

  const handleAppleSignIn = async () => {
    try {
      if (Platform.OS === "ios" && isAppleAuthAvailable && AppleAuthentication) {
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
        });

        // If we received the user's name, store it for future use
        if (credential.fullName) {
          const userFullName = {
            givenName: credential.fullName.givenName,
            familyName: credential.fullName.familyName,
          };
          await AsyncStorage.setItem(`apple_user_${credential.user}`, JSON.stringify(userFullName));
        }

        // Try to get stored name if not provided in current sign-in
        let fullName = credential.fullName;
        if (!fullName?.givenName) {
          try {
            const storedName = await AsyncStorage.getItem(`apple_user_${credential.user}`);
            if (storedName) {
              fullName = JSON.parse(storedName);
            }
          } catch (error) {
            console.log("Error retrieving stored name:", error);
          }
        }

        // User is authenticated
        const userInfo = {
          user: {
            id: credential.user,
            email: credential.email,
            name: fullName?.givenName ? `${fullName.givenName} ${fullName.familyName}` : "Apple User",
          },
          idToken: credential.identityToken,
        };

        onSignIn(userInfo);
      } else {
        // For Android or iOS without Apple Authentication, open web-based Sign in with Apple
        const result = await WebBrowser.openAuthSessionAsync(
          `https://appleid.apple.com/auth/authorize?client_id=${config.googleClientIds.appleServicesId}&redirect_uri=${encodeURIComponent(
            "https://auth.expo.io/@pmarathay/meetmeup/redirect"
          )}&response_type=code id_token&scope=name email&response_mode=form_post`,
          "https://auth.expo.io/@pmarathay/meetmeup/redirect"
        );

        if (result.type === "success") {
          // Handle successful web authentication
          // You'll need to implement server-side validation for the web flow
          console.log("Web authentication successful:", result);
          // Parse the authentication response and create userInfo object
          // This is a simplified example - you'll need to implement proper token validation
          const userInfo = {
            user: {
              id: "web_user_id",
              email: "email_from_response",
              name: "name_from_response",
            },
            idToken: "token_from_response",
          };
          onSignIn(userInfo);
        } else {
          console.log("Web authentication cancelled or failed");
        }
      }
    } catch (error) {
      if (error.code === "ERR_CANCELED") {
        // Handle user canceling the sign-in flow
        console.log("User canceled Apple Sign-in");
      } else {
        console.error("Apple Sign-In Error:", error);
        onError(error.message);
      }
    }
  };

  // Render platform-specific button
  if (Platform.OS === "ios" && isAppleAuthAvailable && AppleAuthentication) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.socialLoginButton} onPress={handleAppleSignIn}>
          <Image source={require("../assets/apple_logo.png")} style={styles.appleLogo} />
        </TouchableOpacity>
      </View>
    );
  }

  // Android button or iOS without Apple Authentication
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.socialLoginButton} onPress={handleAppleSignIn}>
        <Image source={require("../assets/apple_logo.png")} style={styles.appleLogo} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
  },
  appleButton: {
    width: 192,
    height: 48,
  },
  socialLoginButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 37.5,
    width: 75,
    height: 75,
    alignItems: "center",
    justifyContent: "center",
  },
  appleLogo: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  androidAppleButton: {
    width: 192,
    height: 48,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
  },
  androidAppleButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AppleSignIn;
