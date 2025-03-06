import React, { useState, useEffect } from "react";
import { StatusBar, Platform, SafeAreaView, View, StyleSheet, Pressable, TouchableOpacity, Alert, Image, ActivityIndicator } from "react-native";
import { Text, TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProgressBar from "../src/Assets/Components/ProgressBar";
import { GoogleSignin, statusCodes, GoogleSigninButton } from "@react-native-google-signin/google-signin";
import config from "../config"; // Import config

// Static utility function to reset Google Sign-In state
export const resetGoogleSignIn = async () => {
  console.log("Attempting to reset Google Sign-In state...");
  try {
    // Check if Google Sign-In is initialized
    const isConfigured = await GoogleSignin.isSignedIn().catch(() => false);

    if (isConfigured) {
      // First sign out
      await GoogleSignin.signOut().catch((e) => console.log("Error during sign out:", e));

      // Then try to revoke access (this is more aggressive)
      await GoogleSignin.revokeAccess().catch((e) => console.log("Error revoking access:", e));

      console.log("Google Sign-In state reset successfully");
      return true;
    } else {
      console.log("Google Sign-In not configured, no need to reset");
      return false;
    }
  } catch (error) {
    console.error("Failed to reset Google Sign-In state:", error);
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
  const [signInInProgress, setSignInInProgress] = useState(false);

  const navigation = useNavigation();
  const [existing, setExisting] = useState(false);

  // Google Sign In endpoint
  const GOOGLE_SIGNUP_ENDPOINT = "https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/UserSocialSignUp/MMU";

  // Initialize Google Sign In
  useEffect(() => {
    const configureGoogleSignIn = async () => {
      try {
        // First try to reset any existing sign-in state
        await resetGoogleSignIn();

        console.log("Configuring Google Sign-In with config:", {
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

        // Configure Google Sign-In
        await GoogleSignin.configure(googleSignInConfig);
        setIsGoogleConfigured(true);
        console.log("Google Sign-In configured successfully2");
      } catch (error) {
        console.error("Google Sign-In configuration error:", error);
        setIsGoogleConfigured(false);
      }
    };

    configureGoogleSignIn();

    // Cleanup when component unmounts
    return () => {
      // Try to reset any hanging sign-in state
      resetGoogleSignIn().catch((e) => console.log("Error during cleanup:", e));
    };
  }, []);

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    // Prevent multiple simultaneous sign-in attempts
    if (signInInProgress) {
      console.log("Sign-in already in progress, ignoring additional attempts");
      return;
    }

    if (!isGoogleConfigured) {
      Alert.alert("Error", "Google Sign-In is not configured properly. Please try again later.");
      return;
    }

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

      console.log("Starting Google sign in process...");

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
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      {/* <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={28} color="red" />
            </TouchableOpacity> */}

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
        <TouchableOpacity style={styles.socialLoginButton}>
          <Image source={require("../assets/apple_logo.png")} style={styles.appleLogo} />
        </TouchableOpacity>
      </View>

      {/* Google Sign-In Button */}
      {/* <GoogleSigninButton
                style={styles.googleButton}
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Dark}
                onPress={handleGoogleSignIn}
                disabled={signInInProgress}
            /> */}

      {/* Already Have an Account */}
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.footerText}>
          Already have an account? <Text style={styles.loginLink}>Log In</Text>
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
    backgroundColor: "#FFF",
    justifyContent: "flex-start", // Align content to the top
    alignItems: "stretch",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  // backButton: {
  //     alignSelf: 'flex-start',
  //     backgroundColor: '#F5F5F5',
  //     borderRadius: 20,
  //     padding: 8,
  //     marginBottom: 20,
  //     marginTop: 30,
  // },
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
  },
  socialLoginButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 50,
    padding: 15,
    marginHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    textAlign: "center",
    color: "gray",
    fontSize: 16,
  },
  loginLink: {
    color: "#E4423F",
    fontWeight: "bold",
  },
  googleLogo: {
    width: 45,
    height: 45,
  },
  appleLogo: {
    width: 45,
    height: 45,
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
});
