import React, { useState } from "react";
import { StatusBar, Platform, SafeAreaView, View, StyleSheet, Pressable, TouchableOpacity, Alert, Image } from "react-native";
import { Text, TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProgressBar from "../src/Assets/Components/ProgressBar";

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

  const navigation = useNavigation();
  const [existing, setExisting] = useState(false);
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
    console.log("In handleContinue");
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
    console.log("Input Data: ", data);
    console.log("Input Data: ", formData.email);
    signUpData = JSON.stringify({
      email: formData.email,
      password: formData.password,
    });
    console.log("signUpData: ", signUpData);
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
      //   console.log("Account Signup Result: ", response.json());
      console.log("Result: ", result);

      if (result.message === "User already exists") {
        setExisting(true);
        Alert.alert("User Already Exists");
        return;
      }
      // await saveUserData('user_email_id', formData.email);
      // await saveUserData('user_uid', result.result[0].user_uid);
      //   console.log("Result: ", result);
      //   console.log("Result: ", result[0]);
      console.log("Result: ", result.user_uid);
      await AsyncStorage.setItem("user_uid", result.user_uid); // Ensure this is correctly stored
      await AsyncStorage.setItem("user_email_id", formData["email"]);
      // await AsyncStorage.setItem('user_uid', result.result[0].user_uid);
      // await AsyncStorage.setItem('user_email_id', formData['email']);
      // await AsyncStorage.setItem('user_phone_number', formData['phone_number']);
      navigation.navigate("NameInput");
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
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name='arrow-back' size={28} color='red' />
      </TouchableOpacity>

      <ProgressBar startProgress={0} endProgress={10} />

      {/* Title and Subtitle */}
      <Text style={styles.title}>Welcome to MeetMeUp!</Text>
      <Text style={styles.subtitle}>Please choose a signup option to continue.</Text>

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
        style={[styles.continueButton, { backgroundColor: isFormComplete() ? "#E4423F" : "#ccc" }]}
        onPress={() => {
          if (isFormComplete()) {
            handleContinue();
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
    paddingHorizontal: 20,
    backgroundColor: "#FFF",
    justifyContent: "flex-start", // Align content to the top
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
    fontSize: 14,
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
});
