import React, { useState, useEffect } from "react";
import { StatusBar, Platform, SafeAreaView, ScrollView, View, StyleSheet, Pressable, TouchableOpacity, Alert, Image, ActivityIndicator } from "react-native";
import { Text, TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProgressBar from "../src/Assets/Components/ProgressBar";

import axios from "axios";
import sha256 from "crypto-js/sha256";
import { GoogleSignin, statusCodes, GoogleSigninButton } from "@react-native-google-signin/google-signin";
import config from "../config"; // Import config
import AppleSignIn from "./AppleSignIn"; // Import AppleSignIn component

// Helper function to get last two digits of a string (for debugging)
const getLastTwoDigits = (str) => {
  if (!str) return "Not set";
  return str.slice(-2);
};

export default function Login() {
  // console.log("LoginPage");
  // console.log("LP from login .env:", process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID_DEBUG);
  const navigation = useNavigation();

  // Local states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [isGoogleConfigured, setIsGoogleConfigured] = useState(false);
  const [isGoogleConfiguring, setIsGoogleConfiguring] = useState(true); // New state to track configuration process
  const [configAttemptCount, setConfigAttemptCount] = useState(0); // Track configuration attempts
  const maxAttempts = 3; // Define maxAttempts at component level

  // Helper function to check state values
  const checkGoogleStates = () => {
    console.log(`LP CURRENT STATES: isGoogleConfigured=${isGoogleConfigured}, isGoogleConfiguring=${isGoogleConfiguring}, configAttemptCount=${configAttemptCount}`);
  };

  // Endpoints
  const SALT_ENDPOINT = "https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/AccountSalt/MMU";
  const LOGIN_ENDPOINT = "https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/Login/MMU";
  const SOCIAL_LOGIN_ENDPOINT = "https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/UserSocialSignUp/MMU";

  // Initialize Google Sign In
  useEffect(() => {
    let configAttempts = 0;

    console.log("==============>      LP Starting Google Sign-In configuration process...");

    const configureGoogleSignIn = async () => {
      configAttempts++;
      setConfigAttemptCount(configAttempts); // Update the state with current attempt count
      console.log(`LP Google Sign-In configuration attempt ${configAttempts}/${maxAttempts}`);
      console.log(`LP Current states before configuration: isGoogleConfigured=${isGoogleConfigured}, isGoogleConfiguring=${isGoogleConfiguring}`);
      // Alert.alert("LP Ok So Far", `isGoogleConfigured: ${isGoogleConfigured}\nisGoogleConfiguring: ${isGoogleConfiguring}`);

      try {
        setIsGoogleConfiguring(true); // Set configuring state to true
        console.log("LP from login configure useeffect .env:", process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID_DEBUG);
        console.log("LP Configuring Google Sign-In with config:", {
          iosClientId: config.googleClientIds.ios,
          androidClientId: config.googleClientIds.android,
          webClientId: config.googleClientIds.web,
          googleURLScheme: config.googleClientIds.googleURLScheme,
        });

        // Create Google Sign-In configuration object
        const googleSignInConfig = {
          iosClientId: config.googleClientIds.ios,
          androidClientId: config.googleClientIds.android,
          webClientId: config.googleClientIds.web,
          offlineAccess: true,
        };

        // Add URL scheme for iOS if available
        if (Platform.OS === "ios" && config.googleClientIds.googleURLScheme) {
          googleSignInConfig.googleURLScheme = config.googleClientIds.googleURLScheme;
          console.log(`LP Added googleURLScheme for iOS: ${config.googleClientIds.googleURLScheme}`);
        }

        console.log("LP googleSignInConfig:", googleSignInConfig);

        // Configure Google Sign-In
        console.log("LP Calling GoogleSignin.configure()...");
        await GoogleSignin.configure(googleSignInConfig);
        console.log("LP GoogleSignin.configure() completed successfully");

        console.log("LP About to update states: Setting isGoogleConfigured=true, isGoogleConfiguring=false");
        setIsGoogleConfigured(true);
        setIsGoogleConfiguring(false); // Configuration complete

        // Check states after a delay
        setTimeout(checkGoogleStates, 100);
        setTimeout(checkGoogleStates, 500);
        setTimeout(checkGoogleStates, 1000);

        console.log("LP Google Sign-In configured successfully - isGoogleConfigured set to TRUE");
      } catch (error) {
        console.error(`LP Google Sign-In configuration error (attempt ${configAttempts}/${maxAttempts}):`, error);

        if (configAttempts < maxAttempts) {
          console.log(`LP Retrying Google Sign-In configuration in 1 second (attempt ${configAttempts}/${maxAttempts} failed)`);
          // Wait a bit before retrying
          setTimeout(configureGoogleSignIn, 1000);
        } else {
          console.error(`LP Google Sign-In configuration failed after ${maxAttempts} attempts`);
          setIsGoogleConfiguring(false); // Stop configuring
          // Alert.alert("Error", "Failed to configure Google Sign-In after multiple attempts.");
        }
      }
    };

    // Start configuration process
    configureGoogleSignIn();

    // Cleanup function
    return () => {
      console.log("LP Cleanup: Component unmounting");
    };
  }, []);

  // Email validation
  const isValidEmail = (userEmail) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(userEmail);
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    console.log("LP handleGoogleSignIn called - Current states:", {
      isGoogleConfiguring,
      isGoogleConfigured,
    });

    // Check current states
    checkGoogleStates();

    // Check if still configuring
    if (isGoogleConfiguring) {
      console.log("LP Google Sign-In is still being configured, please wait...");
      Alert.alert("LP Please Wait", "Google Sign-In is still being configured. Please try again in a moment.");
      return;
    }

    // Check if configuration failed
    if (!isGoogleConfigured) {
      console.log("LP Google Sign-In configuration failed");

      Alert.alert(
        "Error",
        `LP Google Sign-In is not configured properly. Please try again later.\n\n` +
          `iOS: ${getLastTwoDigits(config.googleClientIds.ios)}\n` +
          `URL Scheme: ${config.googleClientIds.googleURLScheme ? "..." + config.googleClientIds.googleURLScheme.slice(-2) : "Not set"}\n\n` +
          `isGoogleConfigured: ${isGoogleConfigured}\n` +
          `isGoogleConfiguring: ${isGoogleConfiguring}`
      );

      return;
    }

    console.log("LP Google Sign-In configuration check passed, proceeding with sign-in");
    console.log("==============>  LP Starting Google sign in process...");
    console.log("==============>  LP Google Sign-In States:", {
      isGoogleConfigured,
      isGoogleConfiguring,
    });

    try {
      setShowSpinner(true);

      // Make sure Play Services are available (for Android)
      if (Platform.OS === "android") {
        try {
          await GoogleSignin.hasPlayServices({
            showPlayServicesUpdateDialog: true,
          });
          console.log("LP Play services check passed");
        } catch (e) {
          console.error("LP Play services check error:", e);
          Alert.alert("Error", "Google Play Services are required for Google Sign-In.");
          setShowSpinner(false);
          return;
        }
      }

      console.log("==============>   LP Starting Google sign in process...");

      // First try to sign out to ensure a clean state
      try {
        await GoogleSignin.signOut();
        console.log("LP Successfully signed out before new sign-in attempt");
      } catch (signOutError) {
        // This is okay to fail if user was not previously signed in
        console.log("LP Sign out before sign in resulted in error (can be ignored):", signOutError);
      }

      // Sign in - this is the part that was failing before
      let userInfo;
      try {
        console.log("==============> LP Starting Google sign in process in try block...");
        userInfo = await GoogleSignin.signIn();
        // console.log("Sign-in successful:", userInfo);
        console.log("LP Google Sign-In successful", JSON.stringify(userInfo, null, 2));
      } catch (signInError) {
        console.error("LP Sign in specific error:", signInError);

        // Log more details if it's a DEVELOPER_ERROR
        if (signInError.code === "DEVELOPER_ERROR") {
          console.error(
            "LP DEVELOPER_ERROR details:",
            JSON.stringify(
              {
                message: signInError.message,
                code: signInError.code,
                platform: Platform.OS,
                androidClientId: config.googleClientIds.android,
                webClientId: config.googleClientIds.web,
                iosClientId: config.googleClientIds.ios,
                scopes: ["profile", "email"],
              },
              null,
              2
            )
          );

          // For Android: Show guidance to check SHA-1 fingerprint registration
          if (Platform.OS === "android") {
            Alert.alert(
              "Google Sign-In Error",
              "There appears to be a configuration issue with Google Sign-In. This is likely due to a SHA-1 certificate fingerprint mismatch in the Google Cloud Console.",
              [{ text: "OK" }]
            );
            setShowSpinner(false);
            return;
          }
        }

        throw signInError; // Re-throw to be caught by the outer catch
      }

      if (!userInfo || !userInfo.idToken) {
        throw new Error("No ID token received from Google Sign-In");
      }

      // Process Google login with backend
      const { idToken, user } = userInfo;

      console.log("LP Sending data to backend:", {
        tokenLength: idToken?.length,
        email: user.email,
        givenName: user.givenName,
        familyName: user.familyName,
        hasPhoto: !!user.photo,
      });

      // Call your backend endpoint for Google login - updated to match GoogleLogin.js
      const url = `https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/UserSocialLogin/MMU/${user.email}`;
      const response = await axios.get(url, {
        params: {
          id_token: idToken,
        },
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });

      console.log("LP Backend response:", response.data);

      // Handle response - updated to match actual response format
      if (response.data && response.data.message === "Correct Email" && Array.isArray(response.data.result) && response.data.result.length >= 1) {
        // Store user data in AsyncStorage - the first element in result array is the user_uid
        const user_uid = response.data.result[0];
        const user_email_id = user.email; // Use email from Google sign-in data

        await AsyncStorage.setItem("user_uid", user_uid);
        await AsyncStorage.setItem("user_email_id", user_email_id);

        // Navigate to next screen
        navigation.navigate("MyProfile");
      } else {
        Alert.alert("Error", "Failed to login with Google. Server response invalid.");
      }
    } catch (error) {
      console.error("LP Google sign-in error:", error);

      let errorMessage = "Something went wrong with Google sign-in. Please try again.";

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("LP Google sign-in cancelled");
        errorMessage = "Sign-in was cancelled";
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("LP Google sign-in in progress");
        errorMessage = "Sign-in is already in progress";
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = "Play services not available or outdated";
      } else if (error.code === "DEVELOPER_ERROR") {
        errorMessage = "Configuration error with Google Sign-In. Please check app credentials.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setShowSpinner(false);
    }
  };

  // Handle Apple Sign In
  const handleAppleSignIn = async (userInfo) => {
    try {
      setShowSpinner(true);
      console.log("Apple Sign-In successful", JSON.stringify(userInfo, null, 2));

      const { user, idToken } = userInfo;

      // Call your backend endpoint for Apple login
      const url = SOCIAL_LOGIN_ENDPOINT;
      const response = await axios.post(
        url,
        {
          email: user.email,
          first_name: user.name ? user.name.split(" ")[0] : "",
          last_name: user.name ? user.name.split(" ").slice(1).join(" ") : "",
          social_id: user.id,
          login_type: "apple",
          token: idToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );

      console.log("Apple Sign-In Backend response:", response.data);

      // Handle response
      if (response.data && response.data.code === 200) {
        // Store user data in AsyncStorage
        const user_uid = response.data.result.user_uid;
        const user_email_id = user.email;

        await AsyncStorage.setItem("user_uid", user_uid);
        await AsyncStorage.setItem("user_email_id", user_email_id);

        // Navigate to next screen
        navigation.navigate("MyProfile");
      } else {
        Alert.alert("Error", "Failed to login with Apple. Server response invalid.");
      }
    } catch (error) {
      console.error("Apple sign-in error:", error);
      Alert.alert("Error", "Something went wrong with Apple sign-in. Please try again.");
    } finally {
      setShowSpinner(false);
    }
  };

  // Handle Apple Sign In Error
  const handleAppleSignInError = (error) => {
    console.error("Apple Sign-In Error:", error);
    Alert.alert("Error", `Apple Sign-In failed: ${error}`);
  };

  // Attempt to login with salt
  const handleSubmitLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill out all the fields.");
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    try {
      setShowSpinner(true);

      // 1. Get the salt for this email
      const saltResponse = await axios.post(SALT_ENDPOINT, { email });
      const saltObject = saltResponse.data;

      if (saltObject.code !== 200) {
        Alert.alert("Error", "User does not exist or server error.");
        return;
      }

      // 2. Combine salt with password and hash it
      const salt = saltObject.result[0].password_salt;
      const saltedPassword = password + salt;
      const hashedPassword = sha256(saltedPassword).toString();

      // 3. Call the Login endpoint with the hashed password
      const loginResponse = await axios.post(
        LOGIN_ENDPOINT,
        {
          email,
          password: hashedPassword,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const loginObject = loginResponse.data;

      if (loginObject.code === 200) {
        // Login successful
        const user_uid = loginObject.result[0].user_uid;
        const user_email_id = email;

        // Store user data in AsyncStorage
        await AsyncStorage.setItem("user_uid", user_uid);
        await AsyncStorage.setItem("user_email_id", user_email_id);

        // Navigate to next screen
        navigation.navigate("MyProfile");
      } else {
        // Login failed
        Alert.alert("Error", "Invalid email or password.");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setShowSpinner(false);
    }
  };

  // Check if form is complete
  const isFormComplete = () => email !== "" && password !== "" && isValidEmail(email);

  // Render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle='dark-content' />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name='chevron-back' size={24} color='#000' />
          </Pressable>
          <Text style={styles.headerTitle}>Login</Text>
          <View style={{ width: 24 }} />
        </View>

        <ProgressBar progress={0.5} />

        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome back!</Text>
          <Text style={styles.subtitle}>Please enter your details to continue</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder='Enter your email'
              value={email}
              onChangeText={setEmail}
              keyboardType='email-address'
              autoCapitalize='none'
              mode='outlined'
              outlineColor='#E8E8E8'
              activeOutlineColor='#E4423F'
              theme={{ roundness: 10 }}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder='Enter your password'
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              mode='outlined'
              outlineColor='#E8E8E8'
              activeOutlineColor='#E4423F'
              theme={{ roundness: 10 }}
              right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
            />
          </View>

          <TouchableOpacity style={styles.forgotPassword} onPress={() => Alert.alert("Forgot Password", "Please contact support to reset your password.")}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.loginButton, !isFormComplete() && styles.loginButtonDisabled]} onPress={handleSubmitLogin} disabled={!isFormComplete() || showSpinner}>
            {showSpinner ? <ActivityIndicator color='#fff' /> : <Text style={styles.loginButtonText}>Login</Text>}
          </TouchableOpacity>

          <View style={styles.orContainer}>
            <View style={styles.divider} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialContainer}>
            <GoogleSigninButton style={styles.googleButton} size={GoogleSigninButton.Size.Wide} color={GoogleSigninButton.Color.Light} onPress={handleGoogleSignIn} disabled={showSpinner} />

            {Platform.OS === "ios" && <AppleSignIn onSignIn={handleAppleSignIn} onError={handleAppleSignInError} />}
          </View>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("AccountSetup2Create")}>
              <Text style={styles.signupLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Lexend-Bold",
  },
  formContainer: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    fontFamily: "Lexend-Bold",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    fontFamily: "Lexend",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: "Lexend",
  },
  input: {
    backgroundColor: "#fff",
    fontFamily: "Lexend",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#E4423F",
    fontSize: 14,
    fontFamily: "Lexend",
  },
  loginButton: {
    backgroundColor: "#E4423F",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  loginButtonDisabled: {
    backgroundColor: "#FFCCCB",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Lexend-Bold",
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E8E8E8",
  },
  orText: {
    marginHorizontal: 16,
    color: "#666",
    fontFamily: "Lexend",
  },
  socialContainer: {
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  googleButton: {
    width: 192,
    height: 48,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  signupText: {
    color: "#666",
    fontFamily: "Lexend",
  },
  signupLink: {
    color: "#E4423F",
    fontWeight: "600",
    fontFamily: "Lexend-Bold",
  },
});
