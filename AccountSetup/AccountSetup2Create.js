import React, { useState, useEffect } from "react";
import { StatusBar, Platform, SafeAreaView, ScrollView, View, StyleSheet, Pressable, TouchableOpacity, Alert, Image, ActivityIndicator } from "react-native";
import { Text, TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProgressBar from "../src/Assets/Components/ProgressBar";
import { GoogleSignin, statusCodes, GoogleSigninButton } from "@react-native-google-signin/google-signin";
import config from "../config"; // Import config
import AppleSignIn from "./AppleSignIn"; // Import AppleSignIn component

// Static utility function to reset Google Sign-In state
export const resetGoogleSignIn = async () => {
  console.log("AS2C Attempting to reset Google Sign-In state...");
  try {
    // Check if Google Sign-In is initialized
    const isConfigured = await GoogleSignin.isSignedIn().catch(() => false);

    if (isConfigured) {
      // First sign out
      await GoogleSignin.signOut().catch((e) => console.log("AS2C Error during sign out:", e));

      // Then try to revoke access (this is more aggressive)
      await GoogleSignin.revokeAccess().catch((e) => console.log("AS2C Error revoking access:", e));

      console.log("AS2C Google Sign-In state reset successfully");
      return true;
    } else {
      console.log("AS2C Google Sign-In not configured, no need to reset");
      return false;
    }
  } catch (error) {
    console.error("AS2C Failed to reset Google Sign-In state:", error);
    return false;
  }
};

export default function AccountSetup2Create() {
  const [formData, setFormData] = useState({
    email: "",
    // phone_number: '',
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);
  const [isGoogleConfigured, setIsGoogleConfigured] = useState(false);
  const [isGoogleConfiguring, setIsGoogleConfiguring] = useState(true);
  const [signInInProgress, setSignInInProgress] = useState(false);
  const [configAttemptCount, setConfigAttemptCount] = useState(0);
  const maxAttempts = 3;

  const navigation = useNavigation();
  const [existing, setExisting] = useState(false);

  // Google Sign In endpoint
  const GOOGLE_SIGNUP_ENDPOINT = "https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/UserSocialSignUp/MMU";

  // Helper function to check state values
  const checkGoogleStates = () => {
    console.log(
      `AS2C CURRENT STATES: isGoogleConfigured=${isGoogleConfigured}, isGoogleConfiguring=${isGoogleConfiguring}, signInInProgress=${signInInProgress}, configAttemptCount=${configAttemptCount}`
    );

    // Check if Google Sign-In is actually configured by calling the API
    try {
      GoogleSignin.isSignedIn()
        .then((isSignedIn) => {
          console.log(`AS2C GoogleSignin.isSignedIn() returned: ${isSignedIn}`);
        })
        .catch((error) => {
          console.log(`AS2C GoogleSignin.isSignedIn() error: ${error}`);
        });
    } catch (error) {
      console.log(`AS2C Error calling GoogleSignin.isSignedIn(): ${error}`);
    }
  };

  // Initialize Google Sign In
  useEffect(() => {
    let configAttempts = 0;

    console.log("AS2C Starting Google Sign-In configuration process...");

    // Check if Google Sign-In is already configured from a previous session
    try {
      GoogleSignin.isSignedIn()
        .then((isSignedIn) => {
          console.log(`AS2C Initial check - GoogleSignin.isSignedIn() returned: ${isSignedIn}`);
          if (isSignedIn) {
            console.log("AS2C Google Sign-In appears to be already configured from a previous session");
          }
        })
        .catch((error) => {
          console.log(`AS2C Initial check - GoogleSignin.isSignedIn() error: ${error}`);
          console.log("AS2C Google Sign-In is not configured yet");
        });
    } catch (error) {
      console.log(`AS2C Error during initial check of GoogleSignin.isSignedIn(): ${error}`);
    }

    const configureGoogleSignIn = async () => {
      configAttempts++;
      setConfigAttemptCount(configAttempts);
      console.log(`AS2C Google Sign-In configuration attempt ${configAttempts}/${maxAttempts}`);
      console.log(`AS2C Current states before configuration: isGoogleConfigured=${isGoogleConfigured}, isGoogleConfiguring=${isGoogleConfiguring}`);
      // Alert.alert("AS2C Ok So Far", `isGoogleConfigured: ${isGoogleConfigured}\nisGoogleConfiguring: ${isGoogleConfiguring}`);

      try {
        setIsGoogleConfiguring(true); // Set configuring state to true

        // First try to reset any existing sign-in state
        const resetResult = await resetGoogleSignIn();
        console.log(`AS2C Reset Google Sign-In state result: ${resetResult ? "Success" : "Not needed"}`);

        console.log("AS2C Configuring Google Sign-In with config:", {
          iosClientId: config.googleClientIds.ios,
          androidClientId: config.googleClientIds.android,
          webClientId: config.googleClientIds.web,
        });

        // Create Google Sign-In configuration object
        const googleSignInConfig = {
          iosClientId: config.googleClientIds.ios,
          androidClientId: config.googleClientIds.android,
          webClientId: config.googleClientIds.web,
          offlineAccess: true, // This enables getting refresh token
          scopes: ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
        };

        // Add URL scheme for iOS if available
        if (Platform.OS === "ios" && config.googleClientIds.googleURLScheme) {
          googleSignInConfig.googleURLScheme = config.googleClientIds.googleURLScheme;
          console.log(`AS2C Added googleURLScheme for iOS: ${config.googleClientIds.googleURLScheme}`);
        }

        console.log("AS2C googleSignInConfig:", googleSignInConfig);

        // Configure Google Sign-In
        console.log("AS2C Calling GoogleSignin.configure()...");
        await GoogleSignin.configure(googleSignInConfig);
        console.log("AS2C GoogleSignin.configure() completed successfully");

        console.log("AS2C About to update states: Setting isGoogleConfigured=true, isGoogleConfiguring=false");
        setIsGoogleConfigured(true);
        setIsGoogleConfiguring(false); // Configuration complete

        // Check states after a delay
        setTimeout(checkGoogleStates, 100);
        setTimeout(checkGoogleStates, 500);
        setTimeout(checkGoogleStates, 1000);

        console.log("AS2C Google Sign-In configured successfully - isGoogleConfigured set to TRUE");
      } catch (error) {
        console.error(`AS2C Google Sign-In configuration error (attempt ${configAttempts}/${maxAttempts}):`, error);

        if (configAttempts < maxAttempts) {
          console.log(`AS2C Retrying Google Sign-In configuration in 1 second (attempt ${configAttempts}/${maxAttempts} failed)`);
          // Wait a bit before retrying
          setTimeout(configureGoogleSignIn, 1000);
        } else {
          console.error("AS2C Failed to configure Google Sign-In after multiple attempts");
          setIsGoogleConfigured(false);
          setIsGoogleConfiguring(false); // Configuration failed but no longer configuring
          console.log("AS2C Google Sign-In configuration failed - isGoogleConfigured set to FALSE, isGoogleConfiguring set to FALSE");

          // Don't show alert here, only when user tries to use the feature
        }
      }
    };

    configureGoogleSignIn();

    // Cleanup when component unmounts
    return () => {
      console.log("AS2C Cleanup: Resetting Google Sign-In configuration state");
      // Try to reset any hanging sign-in state
      resetGoogleSignIn().catch((e) => console.log("AS2C Error during cleanup:", e));
      // Reset configuration state
      setIsGoogleConfigured(false);
      setIsGoogleConfiguring(false);
    };
  }, []);

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    console.log("AS2C handleGoogleSignIn called - Current states:", {
      isGoogleConfiguring,
      isGoogleConfigured,
      signInInProgress,
    });

    // Check current states
    checkGoogleStates();

    // Check if still configuring
    if (isGoogleConfiguring) {
      console.log("AS2C Google Sign-In is still being configured, please wait...");
      Alert.alert("Please Wait", "Google Sign-In is still being configured. Please try again in a moment.");
      return;
    }

    // Check if configuration failed
    if (!isGoogleConfigured) {
      console.log("AS2C Google Sign-In configuration failed");

      Alert.alert(
        "Error",
        `Google Sign-In is not configured properly. Please try again later.\n\n` +
          `iOS: ${getLastTwoDigits(config.googleClientIds.ios)}\n` +
          `URL Scheme: ${config.googleClientIds.googleURLScheme ? "..." + config.googleClientIds.googleURLScheme.slice(-2) : "Not set"}\n\n` +
          `isGoogleConfigured: ${isGoogleConfigured}\n` +
          `isGoogleConfiguring: ${isGoogleConfiguring}`
      );

      return;
    }

    // Prevent multiple simultaneous sign-in attempts
    if (signInInProgress) {
      console.log("AS2C Sign-in already in progress, ignoring additional attempts");
      return;
    }

    console.log("AS2C Google Sign-In configuration check passed, proceeding with sign-in");

    // Set a timeout to reset the sign-in state in case the process hangs
    const signInTimeoutId = setTimeout(() => {
      console.log("Google sign-in timeout - resetting state");
      setSignInInProgress(false);
      setShowSpinner(false);
    }, 30000); // 30 seconds timeout

    try {
      setShowSpinner(true);
      setSignInInProgress(true);

      // Make sure Play Services are available (for Android)
      if (Platform.OS === "android") {
        try {
          await GoogleSignin.hasPlayServices({
            showPlayServicesUpdateDialog: true,
          });
          console.log("Play services check passed");
        } catch (e) {
          console.error("Play services check error:", e);
          Alert.alert("Error", "Google Play Services are required for Google Sign-In.");
          return;
        }
      }

      console.log("==============>  AS2C Starting Google sign in process...");
      console.log("==============>  AS2C Google Sign-In States:", {
        isGoogleConfigured,
        isGoogleConfiguring,
        signInInProgress,
      });

      // Force reset the Google Sign-In system - this is a more aggressive approach
      try {
        // First check if signed in
        const isSignedIn = await GoogleSignin.isSignedIn();
        console.log("User is already signed in:", isSignedIn);

        // If signed in, sign out
        if (isSignedIn) {
          await GoogleSignin.signOut();
          console.log("Successfully signed out");
        }

        // Add a small delay to ensure the sign-out is processed
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Revoking tokens is more aggressive and helps reset the internal state
        try {
          await GoogleSignin.revokeAccess();
          console.log("Successfully revoked access");
        } catch (revokeError) {
          console.log("Error revoking access (can be ignored):", revokeError);
          // This is okay to fail, as it may fail if there are no tokens to revoke
        }

        // Another small delay
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (resetError) {
        console.log("Error during Google Sign-In reset (can be ignored):", resetError);
        // Continue despite errors in reset process
      }

      // Sign in with retry mechanism
      let userInfo;
      let retryCount = 0;
      const MAX_RETRIES = 3;

      while (retryCount < MAX_RETRIES) {
        try {
          userInfo = await GoogleSignin.signIn();
          console.log("Google Sign-In successful", JSON.stringify(userInfo, null, 2));
          break; // Success, exit the loop
        } catch (signInError) {
          console.error(`Sign in error (attempt ${retryCount + 1}):`, signInError);

          if (signInError.code === statusCodes.IN_PROGRESS) {
            console.log("Sign-in in progress error detected, waiting before retry");

            // Wait longer between each retry
            await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));

            // Try to forcefully interrupt the process
            try {
              await GoogleSignin.signOut();
            } catch (e) {
              console.log("Error during forced sign-out (can be ignored):", e);
            }

            retryCount++;

            if (retryCount >= MAX_RETRIES) {
              // If we've exhausted all retries, throw the error to be caught by outer catch
              throw new Error(`Google Sign-In in progress error persisted after ${MAX_RETRIES} retries`);
            }

            // Continue to next retry attempt
            continue;
          }

          // For other errors, throw immediately to be caught by outer catch
          throw signInError;
        }
      }

      if (!userInfo || !userInfo.idToken) {
        throw new Error("No authentication token received from Google Sign-In");
      }

      // Similar to GoogleSignUp.js, get tokens from Google
      const { idToken, user } = userInfo;
      console.log("User email:", user.email);
      console.log("User ID:", user.id);

      // Now get access and refresh tokens using the authorization code
      try {
        // Get tokens
        const tokens = await GoogleSignin.getTokens();
        console.log("Retrieved tokens:", tokens);

        // Create user data payload - similar to GoogleSignUp.js
        const userData = {
          email: user.email,
          password: "GOOGLE_LOGIN", // Special password for social login
          phone_number: "", // Phone number would be collected separately if needed
          google_auth_token: tokens.accessToken,
          google_refresh_token: tokens.refreshToken || "",
          social_id: user.id,
          first_name: user.givenName || "",
          last_name: user.familyName || "",
          profile_picture: user.photo || "",
        };

        // Store name data in AsyncStorage for use in the name input screen
        if (user.givenName) {
          await AsyncStorage.setItem("user_first_name", user.givenName);
          console.log("AS2C - Stored first name in AsyncStorage:", user.givenName);
        } else {
          console.log("AS2C - No first name provided by Google Sign-In");
        }

        if (user.familyName) {
          await AsyncStorage.setItem("user_last_name", user.familyName);
          console.log("AS2C - Stored last name in AsyncStorage:", user.familyName);
        } else {
          console.log("AS2C - No last name provided by Google Sign-In");
        }

        console.log("Sending data to backend:", userData);

        // Call your backend endpoint for Google signup
        const response = await fetch(GOOGLE_SIGNUP_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });

        const result = await response.json();
        console.log("Backend response:", result);

        // Handle response
        if (result.message === "User already exists") {
          setExisting(true);
          Alert.alert("User Already Exists", "This Google account is already registered. Would you like to log in instead?", [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Log In",
              onPress: () => navigation.navigate("Login"),
            },
          ]);
        } else {
          // Store user data in AsyncStorage - assuming the API returns user_uid
          if (result.user_uid) {
            await AsyncStorage.setItem("user_uid", result.user_uid);
            await AsyncStorage.setItem("user_email_id", user.email);

            // Navigate to next screen
            navigation.navigate("NameInput");
          } else {
            console.log("Signup successful, redirecting to login");
            Alert.alert("Success", "Your account has been created successfully! Please log in now.", [{ text: "OK", onPress: () => navigation.navigate("Login") }]);
          }
        }
      } catch (tokenError) {
        console.error("Error getting tokens:", tokenError);
        throw new Error("Failed to get authentication tokens");
      }
    } catch (error) {
      console.error("Google sign-in error:", error);

      let errorMessage = "Something went wrong with Google sign-in. Please try again.";

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("Google sign-in cancelled");
        errorMessage = "Sign-in was cancelled";
      } else if (error.code === statusCodes.IN_PROGRESS || error.message?.includes("Sign-In in progress")) {
        console.log("Google sign-in in progress error - attempting reset");
        // Try to reset Google Sign-In state
        await resetGoogleSignIn();
        errorMessage = "There was an issue with Google Sign-In. We've reset the sign-in process. Please try again.";
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = "Play services not available or outdated";
      } else if (error.code === "DEVELOPER_ERROR") {
        errorMessage = "Configuration error with Google Sign-In. Please check app credentials.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      clearTimeout(signInTimeoutId); // Clear the timeout if sign-in completes normally
      setShowSpinner(false);
      setSignInInProgress(false);
    }
  };

  // Handle Apple Sign In
  const handleAppleSignIn = async (userInfo) => {
    console.log("AS2C handleAppleSignIn called with userInfo:", JSON.stringify(userInfo, null, 2));

    // Set a timeout to reset the sign-in state in case the process hangs
    const signInTimeoutId = setTimeout(() => {
      console.log("AS2C Apple sign-in timeout - resetting state");
      setSignInInProgress(false);
      setShowSpinner(false);
    }, 30000); // 30 seconds timeout

    try {
      setShowSpinner(true);
      setSignInInProgress(true);

      // Extract user data from Apple Sign In response
      const { user, idToken } = userInfo;

      console.log("AS2C Apple User ID:", user.id);
      console.log("AS2C Apple User Email:", user.email);
      console.log("AS2C Apple User Name:", user.name);
      console.log("AS2C Apple ID Token Length:", idToken ? idToken.length : 0);

      // First, check if the user already exists by calling the appleLogin endpoint
      const appleLoginEndpoint = "https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/appleLogin";
      console.log("AS2C Calling appleLogin endpoint with ID:", user.id);

      try {
        const loginResponse = await fetch(appleLoginEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: user.id }),
        });

        const loginResult = await loginResponse.json();
        console.log("AS2C Apple Login endpoint response:", loginResult);

        // Check if the response contains valid user data
        if (loginResult?.result?.[0]?.user_uid) {
          console.log("AS2C User already exists, navigating to MyProfile");

          const userData = loginResult.result[0];

          // Store user data in AsyncStorage
          await AsyncStorage.setItem("user_uid", userData.user_uid);
          await AsyncStorage.setItem("user_email_id", userData.user_email_id || user.email || "");

          // Store first and last name for use in other screens
          if (userData.user_first_name) {
            await AsyncStorage.setItem("user_first_name", userData.user_first_name);
          }
          if (userData.user_last_name) {
            await AsyncStorage.setItem("user_last_name", userData.user_last_name);
          }

          // Navigate to MyProfile
          navigation.navigate("MyProfile");

          // Clean up and return
          clearTimeout(signInTimeoutId);
          setShowSpinner(false);
          setSignInInProgress(false);
          return;
        }

        // If we get here, the user doesn't exist, so continue with sign up
        console.log("AS2C User doesn't exist, continuing with sign up");
      } catch (loginError) {
        console.error("AS2C Error checking if user exists:", loginError);
        // Continue with sign up if there's an error checking if the user exists
      }

      // Log the first and last parts of the token for debugging (without exposing the full token)
      if (idToken) {
        console.log("AS2C Apple ID Token Start:", idToken.substring(0, 20) + "...");
        console.log("AS2C Apple ID Token End:", "..." + idToken.substring(idToken.length - 20));
      }

      // Create user data payload for backend - matching the structure used for Google Sign In
      const userData = {
        email: user.email || `apple_${user.id}@example.com`, // Use a placeholder email if not provided
        password: "APPLE_LOGIN", // Special password for social login
        phone_number: "", // Phone number would be collected separately if needed
        google_auth_token: idToken, // Using the same field name as Google Sign In
        google_refresh_token: "apple", // Using "apple" as the refresh token value
        social_id: user.id,
        first_name: user.name ? user.name.split(" ")[0] : "",
        last_name: user.name ? user.name.split(" ").slice(1).join(" ") : "",
        profile_picture: "", // Apple doesn't provide profile pictures
        login_type: "apple", // Specify login type
      };

      // Store name data in AsyncStorage for use in the name input screen
      if (userData.first_name) {
        await AsyncStorage.setItem("user_first_name", userData.first_name);
      }
      if (userData.last_name) {
        await AsyncStorage.setItem("user_last_name", userData.last_name);
      }

      console.log("AS2C Sending Apple data to backend:", JSON.stringify(userData, null, 2));

      // Call your backend endpoint for Apple signup - using the same endpoint as Google
      const response = await fetch(GOOGLE_SIGNUP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      console.log("AS2C Backend response for Apple Sign In:", JSON.stringify(result, null, 2));

      // Handle response - same logic as Google Sign In
      if (result.message === "User already exists") {
        setExisting(true);
        Alert.alert("User Already Exists", "This Apple account is already registered. Would you like to log in instead?", [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Log In",
            onPress: () => navigation.navigate("Login"),
          },
        ]);
      } else {
        // Store user data in AsyncStorage - assuming the API returns user_uid
        if (result.user_uid) {
          console.log("AS2C Storing Apple user data in AsyncStorage - user_uid:", result.user_uid);
          await AsyncStorage.setItem("user_uid", result.user_uid);
          await AsyncStorage.setItem("user_email_id", user.email);

          // Navigate to next screen
          navigation.navigate("NameInput");
        } else {
          console.log("AS2C Signup successful, redirecting to login");
          Alert.alert("Success", "Your account has been created successfully! Please log in now.", [{ text: "OK", onPress: () => navigation.navigate("Login") }]);
        }
      }
    } catch (error) {
      console.error("AS2C Apple sign-in error:", error);
      Alert.alert("Error", "Something went wrong with Apple sign-in. Please try again.");
    } finally {
      clearTimeout(signInTimeoutId); // Clear the timeout if sign-in completes normally
      setShowSpinner(false);
      setSignInInProgress(false);
    }
  };

  // Handle Apple Sign In Error
  const handleAppleSignInError = (error) => {
    console.error("AS2C Apple Sign-In Error:", error);
    Alert.alert("Error", `Apple Sign-In failed: ${error}`);
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });

    if (name === "password") {
      updatePasswordStrength(value);
      setPasswordsMatch(value === formData.confirmPassword || formData.confirmPassword === "");
    }

    if (name === "confirmPassword") {
      setPasswordsMatch(value === formData.password || value === "");
    }
  };

  const updatePasswordStrength = (password) => {
    if (password.length === 0) {
      setPasswordStrength(0);
    } else if (password.length < 6) {
      setPasswordStrength(1);
    } else if (password.length < 10) {
      setPasswordStrength(2);
    } else if (password.match(/[A-Z]/) && password.match(/[0-9]/) && password.length >= 10) {
      setPasswordStrength(4); // very strong
    } else {
      setPasswordStrength(3); // strong
    }
  };
  const saveUserData = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error("Error saving user data", error);
    }
  };
  const getUserData = async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (error) {
      console.error("Error retrieving user data", error);
      return null;
    }
  };

  const handleContinue = async () => {
    const url = "https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/CreateAccount/MMU";
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (!passwordsMatch) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    let data = new FormData();
    data.append("email", formData["email"]);
    data.append("password", formData["password"]);
    // data.append("phone_number", formData['phone_number']);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          // phone_number: formData.phone_number,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (result.message === "User already exists") {
        setExisting(true);
        Alert.alert("User Already Exists");
        return;
      }

      if (result.user_uid) {
        await AsyncStorage.setItem("user_uid", result.user_uid);
        await AsyncStorage.setItem("user_email_id", formData["email"]);
        navigation.navigate("NameInput");
      } else {
        console.error("Unexpected API response structure:", result);
        Alert.alert("Error", "Unexpected response from server. Please try again.");
      }
    } catch (error) {
      console.error("Error occurred:", error);
      Alert.alert("Error", "There was an issue creating your account. Please try again.");
    }
  };

  const getBarColor = () => {
    switch (passwordStrength) {
      case 1:
        return "#FF4D4D"; // weak
      case 2:
        return "#FFA500"; // medium
      case 3:
        return "#FFD700"; // strong
      case 4:
        return "#32CD32"; // vvery strong
      default:
        return "#E0E0E0"; // empty
    }
  };

  const getStrengthLabel = () => {
    switch (passwordStrength) {
      case 1:
        return "Weak";
      case 2:
        return "Medium";
      case 3:
        return "Strong";
      case 4:
        return "Very Strong";
      default:
        return "";
    }
  };

  const isFormComplete = () =>
    isValidEmail(formData.email) &&
    // formData.phone_number !== '' &&
    formData.password !== "" &&
    formData.confirmPassword !== "" &&
    passwordsMatch;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <StatusBar barStyle='dark-content' backgroundColor='#FFF' />

        {/* Progress Bar */}
        <ProgressBar startProgress={0} endProgress={10} style={styles.progressBar} />

        {/* Title and Subtitle */}
        <Text style={styles.title}>Welcome to MeetMeUp!</Text>
        <Text style={styles.subtitle}>Please choose a signup option to continue.</Text>

        {/* Spinner (optional) */}
        {showSpinner && <ActivityIndicator size='large' color='#E4423F' style={{ marginBottom: 10 }} />}

        {/* Input Fields */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            label='Email'
            mode='outlined'
            keyboardType='email-address'
            value={formData.email}
            onChangeText={(text) => handleInputChange("email", text)}
            outlineStyle={styles.textInputOutline}
          />
          {/* <TextInput
                      style={styles.phoneInput}
                      placeholder="Phone Number"
                      keyboardType="phone-pad"
                      value={formData.phone_number}
                      onChangeText={(text) => handleInputChange('phone_number', text)}
                  /> */}
          <TextInput
            label='Create password'
            mode='outlined'
            secureTextEntry={!showPassword}
            value={formData.password}
            onChangeText={(text) => handleInputChange("password", text)}
            right={<TextInput.Icon icon={showPassword ? "eye" : "eye-off"} onPress={() => setShowPassword(!showPassword)} size={20} color='gray' style={styles.eyeIcon} />}
            style={styles.input}
            outlineStyle={styles.textInputOutline}
          />

          <TextInput
            label='Confirm password'
            mode='outlined'
            secureTextEntry={!showConfirmPassword}
            value={formData.confirmPassword}
            onChangeText={(text) => handleInputChange("confirmPassword", text)}
            right={<TextInput.Icon icon={showConfirmPassword ? "eye" : "eye-off"} onPress={() => setShowConfirmPassword(!showConfirmPassword)} size={20} color='gray' style={styles.eyeIcon} />}
            style={styles.input}
            outlineStyle={styles.textInputOutline}
          />

          {/* Password Mismatch Warning */}
          {!passwordsMatch && formData.confirmPassword !== "" && <Text style={styles.mismatchText}>Passwords do not match</Text>}

          {/* Password Strength Bar */}
          <View style={styles.strengthBarContainer}>
            {[0, 1, 2, 3].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.strengthSegment,
                  {
                    backgroundColor: passwordStrength > index ? getBarColor() : "#E0E0E0",
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.strengthLabel, { color: getBarColor() }]}>{getStrengthLabel()}</Text>
        </View>

        {/* Continue Button */}
        <Pressable
          style={[styles.continueButton, { backgroundColor: isFormComplete() ? "#E4423F" : "#F5F5F5" }]}
          onPress={() => {
            if (isFormComplete()) {
              handleContinue();
            }
          }}
          disabled={!isFormComplete()}
        >
          <Text style={[styles.continueButtonText, { color: isFormComplete() ? "#FFF" : "rgba(26, 26, 26, 0.25)" }]}>Continue</Text>
        </Pressable>

        {/* OR Separator */}
        <View style={styles.orSeparator}>
          <View style={styles.separatorLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Social Login Buttons */}
        <View style={styles.socialContainer}>
          <TouchableOpacity style={[styles.socialLoginButton, signInInProgress && styles.disabledButton]} onPress={handleGoogleSignIn} disabled={signInInProgress}>
            <Image source={require("../assets/google_logo.png")} style={styles.googleLogo} />
          </TouchableOpacity>
          {Platform.OS === "ios" && <AppleSignIn onSignIn={handleAppleSignIn} onError={handleAppleSignInError} />}
        </View>

        {/* Already Have an Account */}
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.loginLink}>Log In</Text>
          </Text>
        </TouchableOpacity>

        {/* Google Sign-In Configuration Status - For debugging */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>Google Sign-In Status:</Text>
          <Text style={styles.debugText}>
            isGoogleConfigured: <Text style={{ color: isGoogleConfigured ? "#00AA00" : "#FF0000", fontWeight: "bold", fontSize: 14 }}>{isGoogleConfigured ? "TRUE" : "FALSE"}</Text>
          </Text>
          <Text style={styles.debugText}>
            isGoogleConfiguring: <Text style={{ color: isGoogleConfiguring ? "#00AA00" : "#FF0000", fontWeight: "bold", fontSize: 14 }}>{isGoogleConfiguring ? "TRUE" : "FALSE"}</Text>
          </Text>
          <Text style={styles.debugText}>
            signInInProgress: <Text style={{ color: signInInProgress ? "#00AA00" : "#FF0000", fontWeight: "bold", fontSize: 14 }}>{signInInProgress ? "TRUE" : "FALSE"}</Text>
          </Text>
          <Text style={styles.debugText}>
            Config Attempts:{" "}
            <Text style={{ fontWeight: "bold", fontSize: 14 }}>
              {configAttemptCount}/{maxAttempts}
            </Text>
          </Text>

          {/* Debug button to check Google Sign-In status */}
          <Pressable style={styles.debugButton} onPress={checkGoogleStates}>
            <Text style={styles.debugButtonText}>Check Google Sign-In Status</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 25,
    paddingBottom: 30, // Add padding at the bottom for better scrolling
    justifyContent: "flex-start", // Align content to the top
    alignItems: "stretch",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
    backgroundColor: "#FFF",
  },
  progressBar: {
    marginTop: 110,
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "left",
    color: "#000",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "gray",
    textAlign: "left",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 30,
  },
  eyeIcon: {
    marginTop: 15,
  },
  strengthBarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 5,
  },
  strengthSegment: {
    flex: 1,
    height: 6,
    marginHorizontal: 2,
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
    marginTop: 5,
  },
  mismatchText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
  },
  continueButton: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E4423F",
    borderRadius: 30,
    marginBottom: 20,
  },
  continueButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  orSeparator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: "gray",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 25,
    alignItems: "center",
  },
  socialLoginButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 37.5, // Half of width/height for perfect circle
    width: 75,
    height: 75,
    marginHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
  loginLink: {
    color: "#E4423F",
    fontWeight: "bold",
  },
  googleLogo: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  appleLogo: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  textInputOutline: {
    borderWidth: 0,
    borderColor: "#F9F9F9",
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    paddingHorizontal: 15,
    height: 50,
  },
  input: {
    marginBottom: 15, // Space between input fields
  },
  googleButton: {
    width: 192,
    height: 48,
    alignSelf: "center",
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: "#E0E0E0",
  },
  // Add new styles for debug information
  debugContainer: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    backgroundColor: "#f9f9f9",
  },
  debugText: {
    fontSize: 12,
    color: "#333",
    marginBottom: 4,
  },
  debugButton: {
    backgroundColor: "#E4423F",
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  debugButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});
