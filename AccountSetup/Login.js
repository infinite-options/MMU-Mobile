import React, { useState } from "react";
import { StatusBar, Platform, SafeAreaView, View, StyleSheet, Pressable, TouchableOpacity, Alert, Image, ActivityIndicator } from "react-native";
import { Text, TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProgressBar from "../src/Assets/Components/ProgressBar";
import axios from "axios";
import sha256 from "crypto-js/sha256";

export default function Login() {
  const navigation = useNavigation();

  // Local states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  // Endpoints
  const SALT_ENDPOINT = "https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/AccountSalt/MMU";
  const LOGIN_ENDPOINT = "https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/Login/MMU";

  // Check if email is valid
  const isValidEmail = (userEmail) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(userEmail);
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
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name='arrow-back' size={28} color='red' />
      </TouchableOpacity>

      {/* Progress Bar (optional) */}
      <ProgressBar startProgress={0} endProgress={10} />

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
        style={[styles.continueButton, { backgroundColor: isFormComplete() ? "#E4423F" : "#ccc" }]}
        onPress={() => {
          if (isFormComplete()) {
            handleSubmitLogin();
          }
        }}
        disabled={!isFormComplete()}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>

      {/* OR Separator */}
      <View style={styles.orSeparator}>
        <View style={styles.separatorLine} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.separatorLine} />
      </View>

      {/* Social Login Buttons */}
      <View style={styles.socialContainer}>
        <TouchableOpacity style={styles.socialLoginButton}>
          <Image source={require("../assets/google_logo.png")} style={styles.googleLogo} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialLoginButton}>
          <Image source={require("../assets/apple_logo.png")} style={styles.appleLogo} />
        </TouchableOpacity>
      </View>

      {/* Don’t have an account? Sign up */}
      <TouchableOpacity onPress={() => navigation.navigate("AccountSetup2Create")}>
        <Text style={styles.footerText}>
          Don’t have an account yet? <Text style={styles.loginLink}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Styles can be nearly identical to your signup page
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: "#FFF",
    justifyContent: "flex-start",
    alignItems: "stretch",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    padding: 8,
    marginBottom: 20,
    marginTop: 30,
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
    fontSize: 14,
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
});
