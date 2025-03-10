import React, { useState, useEffect } from "react";
import { StyleSheet, View, Platform, TouchableOpacity, Text, Image, Alert } from "react-native";
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
        console.log("Using web-based Apple Sign-In fallback");
        console.log("Apple Services ID:", config.googleClientIds.appleServicesId);

        // Show a loading indicator or message
        Alert.alert("Sign in with Apple", "You'll be redirected to sign in with your Apple ID.");

        const redirectUri = "https://auth.expo.io/@pmarathay/meetmeup/redirect";
        const authUrl = `https://appleid.apple.com/auth/authorize?client_id=${config.googleClientIds.appleServicesId}&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&response_type=code id_token&scope=name email&response_mode=form_post`;

        console.log("Opening auth URL:", authUrl);

        try {
          const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
          console.log("Web authentication result:", result);

          if (result.type === "success") {
            // Handle successful web authentication
            console.log("Web authentication successful");

            // Extract parameters from the URL
            const params = new URLSearchParams(result.url.split("?")[1]);
            const code = params.get("code");
            const id_token = params.get("id_token");
            const user_id = params.get("user") || "web_user_id";
            const email = params.get("email") || "";
            const name = params.get("name") || "Apple User";

            console.log("Extracted params:", { code, id_token: id_token ? "exists" : "missing", user_id, email, name });

            // Create userInfo object
            const userInfo = {
              user: {
                id: user_id,
                email: email,
                name: name,
              },
              idToken: id_token || code, // Use id_token if available, otherwise use code
            };

            onSignIn(userInfo);
          } else {
            console.log("Web authentication cancelled or failed");
            if (result.type === "cancel") {
              // User cancelled the flow
              console.log("User cancelled web authentication");
            } else {
              // Authentication failed
              onError("Web authentication failed");
            }
          }
        } catch (webError) {
          console.error("Web browser error:", webError);
          onError(webError.message);
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
