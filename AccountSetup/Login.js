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

console.log("--- In Login.js Starting Login---");

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

    // console.log("==============>      LP Starting Google Sign-In configuration process...");

    const configureGoogleSignIn = async () => {
      configAttempts++;
      setConfigAttemptCount(configAttempts); // Update the state with current attempt count
      console.log(`LP Google Sign-In configuration attempt ${configAttempts}/${maxAttempts}`);
      console.log(`LP Current states before configuration: isGoogleConfigured=${isGoogleConfigured}, isGoogleConfiguring=${isGoogleConfiguring}`);
      // Alert.alert("LP Ok So Far", `isGoogleConfigured: ${isGoogleConfigured}\nisGoogleConfiguring: ${isGoogleConfiguring}`);

      try {
        setIsGoogleConfiguring(true); // Set configuring state to true
        // console.log("LP from login configure useeffect .env:", process.env.EXPO_PUBLIC_MMU_ANDROID_CLIENT_ID_DEBUG);
        // console.log("LP Configuring Google Sign-In with config:", {
        //   iosClientId: config.googleClientIds.ios,
        //   androidClientId: config.googleClientIds.android,
        //   webClientId: config.googleClientIds.web,
        //   googleURLScheme: config.googleClientIds.googleURLScheme,
        // });

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
          // console.log(`LP Added googleURLScheme for iOS: ${config.googleClientIds.googleURLScheme}`);
          console.log("Configured for iOS");
        }

        // console.log("LP googleSignInConfig:", googleSignInConfig);

        // Configure Google Sign-In
        // console.log("LP Calling GoogleSignin.configure()...");
        await GoogleSignin.configure(googleSignInConfig);
        // console.log("LP GoogleSignin.configure() completed successfully");

        // console.log("LP About to update states: Setting isGoogleConfigured=true, isGoogleConfiguring=false");
        setIsGoogleConfigured(true);
        setIsGoogleConfiguring(false); // Configuration complete

        // Check states after a delay
        setTimeout(checkGoogleStates, 100);
        setTimeout(checkGoogleStates, 500);
        setTimeout(checkGoogleStates, 1000);

        // console.log("LP Google Sign-In configured successfully - isGoogleConfigured set to TRUE");
      } catch (error) {
        console.error(`LP Google Sign-In configuration error (attempt ${configAttempts}/${maxAttempts}):`, error);

        if (configAttempts < maxAttempts) {
          console.log(`LP Retrying Google Sign-In configuration in 1 second (attempt ${configAttempts}/${maxAttempts} failed)`);
          // Wait a bit before retrying
          setTimeout(configureGoogleSignIn, 1000);
        } else {
          console.error("LP Failed to configure Google Sign-In after multiple attempts");
          setIsGoogleConfigured(false);
          setIsGoogleConfiguring(false); // Configuration failed but no longer configuring
          console.log("LP Google Sign-In configuration failed - isGoogleConfigured set to FALSE, isGoogleConfiguring set to FALSE");

          // Don't show alert here, only when user tries to use the feature
        }
      }
    };

    configureGoogleSignIn();

    // Cleanup function
    return () => {
      console.log("LP Cleanup: Resetting Google Sign-In configuration state");
      // Reset configuration state when component unmounts
      setIsGoogleConfigured(false);
      setIsGoogleConfiguring(false);
    };
  }, []);

  // Check if email is valid
  const isValidEmail = (userEmail) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(userEmail);
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    console.log("LP Google button clicked - handleGoogleSignIn called");

    // console.log("LP handleGoogleSignIn called - Current states:", {
    //   isGoogleConfiguring,
    //   isGoogleConfigured,
    // });

    // Check current states
    checkGoogleStates();

    // Check if still configuring
    if (isGoogleConfiguring) {
      console.log("LP Google Sign-In is still being configured, please wait...");
      Alert.alert("LP Please Wait", "Google Sign-In is still being configured. Please try again in a moment.");
      return;
    }

    // Check if configuration failed
    // if (!isGoogleConfigured) {
    //   console.log("LP Google Sign-In configuration failed");
    //   Alert.alert("Error", "LP Google Sign-In is not configured properly. Please try again later.");
    //   return;
    // }
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

    // console.log("LP Google Sign-In configuration check passed, proceeding with sign-in");
    // console.log("==============>  LP Starting Google sign in process...");
    // console.log("==============>  LP Google Sign-In States:", {
    //   isGoogleConfigured,
    //   isGoogleConfiguring,
    // });

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

      // console.log("==============>   LP Starting Google sign in process...");

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
        // console.log("==============> LP Starting Google sign in process in try block...");
        userInfo = await GoogleSignin.signIn();
        // console.log("Sign-in successful:", userInfo);
        // console.log("LP Google Sign-In successful", JSON.stringify(userInfo, null, 2));
        console.log("Login.js,LP Google Sign-In successful");
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

      // console.log("LP Sending data to backend:", {
      //   tokenLength: idToken?.length,
      //   email: user.email,
      //   givenName: user.givenName,
      //   familyName: user.familyName,
      //   hasPhoto: !!user.photo,
      // });
      console.log("Login.js, Requesting userinfo given successful Google Login");

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

      // console.log("LP Backend response:", response.data);
      // console.log("In Login.js, Login Successful");

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
        Alert.alert("Error", "Failed to login with Google. Please check your email and password or Sign Up.");
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
    console.log("LP handleAppleSignIn callback triggered in Login.js");
    console.log("LP handleAppleSignIn called with userInfo:", JSON.stringify(userInfo, null, 2));

    try {
      setShowSpinner(true);

      // Extract user data from Apple Sign In response
      const { user, idToken } = userInfo;

      console.log("LP Apple User ID:", user.id);
      console.log("LP Apple User Email:", user.email);
      console.log("LP Apple User Name:", user.name);
      console.log("LP Apple ID Token Length:", idToken ? idToken.length : 0);

      // Call the appleLogin endpoint with the user ID
      // const appleLoginEndpoint = "https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/appleLogin";
      // console.log("LP Calling appleLogin endpoint with ID:", user.id);

      // const response = await axios.get(url, {
      //   params: {
      //     id_token: idToken,
      //   },
      //   headers: {
      //     "Content-Type": "application/json",
      //     "Access-Control-Allow-Origin": "*",
      //   },
      // });

      // console.log("LP Backend response for Apple Sign In:", response.data);

      // // Handle response
      // if (response.data && response.data.message === "Correct Email" && Array.isArray(response.data.result) && response.data.result.length >= 1) {
      //   // Store user data in AsyncStorage
      //   const user_uid = response.data.result[0];
      //   const user_email_id = user.email;

      //   await AsyncStorage.setItem("user_uid", user_uid);
      //   await AsyncStorage.setItem("user_email_id", user_email_id);
      // Call the appleLogin endpoint with the user ID
      const appleLoginEndpoint = "https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/appleLogin";
      console.log("LP Calling appleLogin endpoint with ID:", user.id);

      const response = await axios.post(
        appleLoginEndpoint,
        { id: user.id },
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );

      console.log("LP Apple Login endpoint response:", response.data);

      // Check if the response contains valid user data
      if (response.data?.result?.[0]?.user_uid) {
        const userData = response.data.result[0];

        // Store user data in AsyncStorage
        await AsyncStorage.setItem("user_uid", userData.user_uid);
        await AsyncStorage.setItem("user_email_id", userData.user_email_id || user.email || "");

        // Navigate to next screen
        navigation.navigate("MyProfile");
      } else {
        Alert.alert("Error", "Failed to login with Apple. Please check your email and password or Sign Up.");
      }
    } catch (error) {
      console.error("LP Apple sign-in error 4:", error);
      Alert.alert("Error", "Something went wrong with Apple sign-in Login. Please try again.");
    } finally {
      setShowSpinner(false);
    }
  };

  // Handle Apple Sign In Error
  const handleAppleSignInError = (error) => {
    console.log("LP handleAppleSignInError callback triggered in Login.js");
    console.error("LP Apple Sign-In Error 5:", error);
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

      // 4. If success, store the user data in AsyncStorage
      const { user_uid, user_email_id } = loginResponse.data.result;
      await AsyncStorage.setItem("user_uid", user_uid);
      await AsyncStorage.setItem("user_email_id", user_email_id);

      // 5. Navigate to next screen
      navigation.navigate("MyProfile");
    } catch (error) {
      console.error("LP Error occurred:", error);
      Alert.alert("Error", "Invalid credentials or server error.");
    } finally {
      setShowSpinner(false);
    }
  };

  // Whether the form is ready to be submitted
  const isFormComplete = () => email !== "" && password !== "" && isValidEmail(email);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <StatusBar barStyle='dark-content' backgroundColor='#FFF' />

        {/* Progress Bar */}
        <ProgressBar startProgress={0} endProgress={10} style={styles.progressBar} />

        {/* Title and Subtitle */}
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Please choose a login option to continue.</Text>

        {/* Spinner (optional) */}
        {showSpinner && <ActivityIndicator size='large' color='#E4423F' style={{ marginBottom: 10 }} />}

        {/* Input Fields */}
        <View style={styles.inputContainer}>
          <TextInput label='Email' mode='outlined' keyboardType='email-address' value={email} onChangeText={setEmail} style={styles.input} outlineStyle={styles.textInputOutline} />

          <TextInput
            label='Password'
            mode='outlined'
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            right={<TextInput.Icon icon={showPassword ? "eye" : "eye-off"} onPress={() => setShowPassword(!showPassword)} size={20} color='gray' style={styles.eyeIcon} />}
            style={styles.input}
            outlineStyle={styles.textInputOutline}
          />
        </View>

        {/* Continue (Login) Button */}
        <Pressable
          style={[styles.continueButton, { backgroundColor: isFormComplete() ? "#E4423F" : "#F5F5F5" }]}
          onPress={() => {
            if (isFormComplete()) {
              handleSubmitLogin();
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
          <TouchableOpacity style={styles.socialLoginButton} onPress={handleGoogleSignIn}>
            <Image source={require("../assets/google_logo.png")} style={styles.googleLogo} />
          </TouchableOpacity>
          <AppleSignIn onSignIn={handleAppleSignIn} onError={handleAppleSignInError} />
        </View>

        {/* Google Sign-In Button */}
        {/* <GoogleSigninButton
          style={styles.googleButton}
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Dark}
          onPress={handleGoogleSignIn}
        /> */}

        {/* Don't have an account? Sign up */}
        <TouchableOpacity onPress={() => navigation.navigate("AccountSetup2Create")}>
          <Text style={styles.footerText}>
            Don't have an account yet? <Text style={styles.loginLink}>Sign Up</Text>
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
            Config Attempts:{" "}
            <Text style={{ fontWeight: "bold", fontSize: 14 }}>
              {configAttemptCount}/{maxAttempts}
            </Text>
          </Text>

          {/* Debug button to check Google Sign-In status */}
          <TouchableOpacity style={styles.debugButton} onPress={handleGoogleSignIn}>
            <Text style={styles.debugButtonText}>Check Google Sign-In Status</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles can be nearly identical to your signup page
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
    paddingHorizontal: 25,
    backgroundColor: "#FFF",
    justifyContent: "flex-start",
    alignItems: "stretch",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
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
  input: {
    marginBottom: 15,
  },
  eyeIcon: {
    marginTop: 15,
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
    width: 75,
    height: 75,
  },
  googleLogo: {
    width: 45,
    height: 45,
  },
  appleLogo: {
    width: 45,
    height: 45,
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
  googleButton: {
    width: 192,
    height: 48,
    alignSelf: "center",
    marginBottom: 20,
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
  debugSuccess: {
    color: "green",
    fontWeight: "bold",
  },
  debugError: {
    color: "red",
    fontWeight: "bold",
  },
  debugWarning: {
    color: "orange",
    fontWeight: "bold",
  },
  debugButton: {
    backgroundColor: "#E4423F",
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  debugButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});
