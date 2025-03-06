import React, { useState, useEffect } from "react";
import { StatusBar, Platform, SafeAreaView, View, StyleSheet, Pressable, TouchableOpacity, Alert, Image, ActivityIndicator } from "react-native";
import { Text, TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProgressBar from "../src/Assets/Components/ProgressBar";

import axios from "axios";
import sha256 from "crypto-js/sha256";
import { GoogleSignin, statusCodes, GoogleSigninButton } from "@react-native-google-signin/google-signin";
import config from "../config"; // Import config

export default function Login() {
  console.log("LoginPage");
  console.log("from login .env:", process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID_DEBUG);
  const navigation = useNavigation();

  // Local states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [isGoogleConfigured, setIsGoogleConfigured] = useState(false);

  // Endpoints
  const SALT_ENDPOINT = "https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/AccountSalt/MMU";
  const LOGIN_ENDPOINT = "https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/Login/MMU";
  // Replace the GoogleLoginMMU endpoint with UserSocialLogin endpoint (used as template below)
  // const GOOGLE_LOGIN_ENDPOINT = 'https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/GoogleLoginMMU';

  // Initialize Google Sign In
  useEffect(() => {
    const configureGoogleSignIn = async () => {
      try {
        console.log("from login configure useeffect .env:", process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID_DEBUG);
        console.log("Configuring Google Sign-In with config:", {
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
        console.log("googleSignInConfig:", googleSignInConfig);

        // Configure Google Sign-In
        await GoogleSignin.configure(googleSignInConfig);
        setIsGoogleConfigured(true);
        console.log("Google Sign-In configured successfully1");
      } catch (error) {
        console.error("Google Sign-In configuration error:", error);
        setIsGoogleConfigured(false);
      }
    };

    configureGoogleSignIn();
  }, []);

  // Check if email is valid
  const isValidEmail = (userEmail) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(userEmail);
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    if (!isGoogleConfigured) {
      Alert.alert("Error", "Google Sign-In is not configured properly. Please try again later.");
      return;
    }

    try {
      setShowSpinner(true);

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
          setShowSpinner(false);
          return;
        }
      }

      console.log("Starting Google sign in process...");

      // First try to sign out to ensure a clean state
      try {
        await GoogleSignin.signOut();
        console.log("Successfully signed out before new sign-in attempt");
      } catch (signOutError) {
        // This is okay to fail if user was not previously signed in
        console.log("Sign out before sign in resulted in error (can be ignored):", signOutError);
      }

      // Sign in - this is the part that was failing before
      let userInfo;
      try {
        console.log("Starting Google sign in process in try block...");
        userInfo = await GoogleSignin.signIn();
        // console.log("Sign-in successful:", userInfo);
        console.log("Google Sign-In successful", JSON.stringify(userInfo, null, 2));
      } catch (signInError) {
        console.error("Sign in specific error:", signInError);

        // Log more details if it's a DEVELOPER_ERROR
        if (signInError.code === "DEVELOPER_ERROR") {
          console.error(
            "DEVELOPER_ERROR details:",
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

      console.log("Sending data to backend:", {
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

      console.log("Backend response:", response.data);

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
      console.error("Google sign-in error:", error);

      let errorMessage = "Something went wrong with Google sign-in. Please try again.";

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("Google sign-in cancelled");
        errorMessage = "Sign-in was cancelled";
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("Google sign-in in progress");
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
      console.error("Error occurred:", error);
      Alert.alert("Error", "Invalid credentials or server error.");
    } finally {
      setShowSpinner(false);
    }
  };

  // Whether the form is ready to be submitted
  const isFormComplete = () => email !== "" && password !== "" && isValidEmail(email);

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      {/* <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="red" />
      </TouchableOpacity> */}

      {/* Progress Bar (optional) */}
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
      /> */}

      {/* Don't have an account? Sign up */}
      <TouchableOpacity onPress={() => navigation.navigate("AccountSetup2Create")}>
        <Text style={styles.footerText}>
          Don't have an account yet? <Text style={styles.loginLink}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Styles can be nearly identical to your signup page
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: "#FFF",
    justifyContent: "flex-start",
    alignItems: "stretch",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  // backButton: {
  //   alignSelf: 'flex-start',
  //   backgroundColor: '#F5F5F5',
  //   borderRadius: 20,
  //   padding: 8,
  //   marginBottom: 20,
  //   marginTop: 30,
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
});
