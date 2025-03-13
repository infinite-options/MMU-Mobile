import React, { useState, useEffect } from "react";
import { StatusBar, Platform, SafeAreaView, View, StyleSheet, TouchableOpacity, Pressable, Image } from "react-native";
import { Text, TextInput } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import ProgressBar from "../src/Assets/Components/ProgressBar";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function NameInput({ navigation }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
  });

  // Add error state
  const [nameErrors, setNameErrors] = useState({
    firstName: "",
    lastName: "",
  });

  // Add useEffect to retrieve stored name information
  useEffect(() => {
    const retrieveStoredNames = async () => {
      try {
        const firstName = (await AsyncStorage.getItem("user_first_name")) || "";
        const lastName = (await AsyncStorage.getItem("user_last_name")) || "";

        if (firstName || lastName) {
          console.log("Retrieved stored names:", firstName, lastName);
          setFormData({
            firstName,
            lastName,
          });

          // Validate the retrieved names
          const firstNameError = validateName(firstName, "First name");
          const lastNameError = validateName(lastName, "Last name");

          setNameErrors({
            firstName: firstNameError,
            lastName: lastNameError,
          });
        }
      } catch (error) {
        console.error("Error retrieving stored names:", error);
      }
    };

    retrieveStoredNames();
  }, []);

  // Modify form completion check to also check for validation errors
  const isFormComplete = formData.firstName.trim() !== "" && formData.lastName.trim() !== "" && !nameErrors.firstName && !nameErrors.lastName;

  // Add validation function
  const validateName = (name, field) => {
    // Name should only contain letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[A-Za-z\s\-']+$/;

    if (!name || name.trim() === "") {
      return `${field} is required`;
    } else if (name.length < 2) {
      return `${field} must be at least 2 characters`;
    } else if (name.length > 40) {
      return `${field} cannot exceed 40 characters`;
    } else if (!nameRegex.test(name)) {
      return `${field} can only contain letters, spaces, hyphens, and apostrophes`;
    }
    return "";
  };

  /**
   * Store the user's name (firstName, lastName) in AsyncStorage.
   * This will be retrieved later on the final step of profile completion.
   */
  const saveUserName = async (firstName, lastName) => {
    try {
      await AsyncStorage.setItem("user_first_name", firstName);
      await AsyncStorage.setItem("user_last_name", lastName);
      console.log("✅ First Name & Last Name stored successfully");
    } catch (error) {
      console.error("Error saving name", error);
    }
  };

  const handleContinue = async () => {
    // Validate once more before continuing
    const firstNameError = validateName(formData.firstName, "First name");
    const lastNameError = validateName(formData.lastName, "Last name");

    setNameErrors({
      firstName: firstNameError,
      lastName: lastNameError,
    });

    if (isFormComplete) {
      // 1) Store the data for future usage
      await saveUserName(formData.firstName, formData.lastName);

      // 2) Navigate to next screen
      navigation.navigate("BirthdayInput");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Image source={require("../assets/icons/backarrow.png")} />
      </TouchableOpacity>

      {/* Progress Bar */}
      <ProgressBar startProgress={10} endProgress={20} style={styles.progressBar} />

      {/* Title and Input Fields */}
      <View style={styles.content}>
        <Text style={styles.title}>What should we call you?</Text>
        <Text style={styles.subtitle}>Your full name will be public.</Text>

        <TextInput
          label='First Name'
          mode='outlined'
          value={formData.firstName}
          onChangeText={(text) => {
            // Allow spaces during typing but validate the input
            const validatedText = text.replace(/[^A-Za-z\s\-']/g, "");

            // Capitalize first letter when there's content
            const formattedText = validatedText.length > 0 ? validatedText.charAt(0).toUpperCase() + validatedText.slice(1) : validatedText;

            setFormData({ ...formData, firstName: formattedText });

            // Validate
            setNameErrors((prev) => ({
              ...prev,
              firstName: validateName(formattedText, "First name"),
            }));
          }}
          autoCorrect={false}
          autoCapitalize='words'
          style={[styles.input, nameErrors.firstName ? styles.inputError : null]}
          outlineStyle={[styles.textInputOutline, nameErrors.firstName ? styles.textInputOutlineError : null]}
        />
        {nameErrors.firstName ? <Text style={styles.errorText}>{nameErrors.firstName}</Text> : null}

        <TextInput
          label='Last Name'
          mode='outlined'
          value={formData.lastName}
          onChangeText={(text) => {
            // Allow spaces during typing but validate the input
            const validatedText = text.replace(/[^A-Za-z\s\-']/g, "");

            // Capitalize first letter when there's content
            const formattedText = validatedText.length > 0 ? validatedText.charAt(0).toUpperCase() + validatedText.slice(1) : validatedText;

            setFormData({ ...formData, lastName: formattedText });

            // Validate
            setNameErrors((prev) => ({
              ...prev,
              lastName: validateName(formattedText, "Last name"),
            }));
          }}
          autoCorrect={false}
          autoCapitalize='words'
          style={[styles.input, nameErrors.lastName ? styles.inputError : null]}
          outlineStyle={[styles.textInputOutline, nameErrors.lastName ? styles.textInputOutlineError : null]}
        />
        {nameErrors.lastName ? <Text style={styles.errorText}>{nameErrors.lastName}</Text> : null}
      </View>

      {/* Continue Button */}
      <Pressable style={[styles.continueButton, { backgroundColor: isFormComplete ? "#E4423F" : "#F5F5F5" }]} onPress={handleContinue} disabled={!isFormComplete}>
        <Text style={[styles.continueButtonText, { color: isFormComplete ? "#FFF" : "rgba(26, 26, 26, 0.25)" }]}>Continue</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: "#FFF",
    justifyContent: "flex-start",
    alignItems: "stretch",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  backButton: {
    alignSelf: "flex-start",
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 30,
  },
  progressBar: {
    marginBottom: 30,
  },
  content: {
    flex: 1,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "left",
    color: "#000",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: "gray",
    textAlign: "left",
    marginBottom: 50,
  },
  input: {
    marginBottom: 15,
  },
  continueButton: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E4423F",
    borderRadius: 30,
    marginBottom: 50,
  },
  continueButtonText: {
    color: "#FFF",
    fontSize: 18,
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
    marginBottom: 20,
    height: 50,
  },
  inputError: {
    marginBottom: 5, // Reduced to make room for error text
  },
  textInputOutlineError: {
    borderWidth: 1,
    borderColor: "#E4423F",
  },
  errorText: {
    color: "#E4423F",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
});
