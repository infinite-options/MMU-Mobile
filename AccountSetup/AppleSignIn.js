import React, { useState, useEffect } from "react";
import { StyleSheet, View, Platform, TouchableOpacity, Text, Image } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config"; // Fix the import path

const AppleSignIn = ({ onSignIn, onError }) => {
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);

  // Check if Apple Authentication is available
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const isAvailable = await AppleAuthentication.isAvailableAsync();
        setIsAppleAuthAvailable(isAvailable);
        console.log("Apple Authentication available:", isAvailable);
      } catch (error) {
        console.log("Error checking Apple Authentication availability:", error);
        setIsAppleAuthAvailable(false);
      }
    };

    checkAvailability();
  }, []);

  const handleAppleSignIn = async () => {
    try {
      if (Platform.OS === "ios" && isAppleAuthAvailable) {
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

  // Render platform-specific button - By hiding it for now we force the use of the Apple
  // if (Platform.OS === "ios" && isAppleAuthAvailable) {
  //   return (
  //     <View style={styles.container}>
  //       <AppleAuthentication.AppleAuthenticationButton
  //         buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
  //         buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
  //         cornerRadius={5}
  //         style={styles.appleButton}
  //         onPress={handleAppleSignIn}
  //       />
  //     </View>
  //   );
  // }

  // Android button or iOS without Apple Authentication
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.androidAppleButton} onPress={handleAppleSignIn}>
        <Image source={require("../assets/apple_logo.png")} style={styles.appleLogo} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Remove marginTop to align with Google button
  },
  appleButton: {
    width: 192,
    height: 48,
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
