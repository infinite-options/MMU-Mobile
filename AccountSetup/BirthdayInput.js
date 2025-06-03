import React, { useState } from "react";
import { SafeAreaView, Platform, StatusBar, ScrollView, View, StyleSheet, TouchableOpacity, Pressable, Alert, Image, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView } from "react-native";
import { Text, TextInput } from "react-native-paper";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProgressBar from "../src/Assets/Components/ProgressBar";

// Helper to calculate age from "dd/mm/yyyy"
function calculateAge(birthdateString) {
  const [day, month, year] = birthdateString.split("/").map(Number);
  const today = new Date();
  const birthDate = new Date(year, month - 1, day); // JS months are 0-indexed
  let age = today.getFullYear() - birthDate.getFullYear();

  // If birth month/day is later in the year than today's month/day, subtract 1 from age
  const hasNotHadBirthdayThisYear = today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());

  if (hasNotHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
}

// Helper to add slashes as the user types
function formatBirthdate(input) {
  // Remove non-digit characters
  const digitsOnly = input.replace(/\D/g, "");

  // Build up "DD/MM/YYYY" format step by step
  let formatted = digitsOnly;
  if (digitsOnly.length > 2) {
    formatted = digitsOnly.slice(0, 2) + "/" + digitsOnly.slice(2);
  }
  if (digitsOnly.length > 4) {
    formatted = digitsOnly.slice(0, 2) + "/" + digitsOnly.slice(2, 4) + "/" + digitsOnly.slice(4, 8); // limit to 8 digits total
  }
  return formatted;
}

export default function BirthdayInput({ navigation }) {
  const [birthdate, setBirthdate] = useState("");
  const [warning, setWarning] = useState("");
  const [isValid, setIsValid] = useState(false);

  // Simple regex to check dd/mm/yyyy format
  const isValidDate = (date) => {
    const dateRegex = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    return dateRegex.test(date);
  };

  const handleInputChange = (text) => {
    // 1) Format user input to dd/mm/yyyy
    const formatted = formatBirthdate(text);
    setBirthdate(formatted);

    // 2) If length < 10, user hasn't typed a full "dd/mm/yyyy" yet
    if (formatted.length < 10) {
      setWarning("");
      setIsValid(false);
      return;
    }

    // 3) Validate format
    if (!isValidDate(formatted)) {
      setWarning("Please enter a valid date in dd/mm/yyyy.");
      setIsValid(false);
      return;
    }

    // 4) Check if user is at least 18
    const age = calculateAge(formatted);
    if (age < 18) {
      setWarning("You must be 18+ to use meet me up.");
      setIsValid(false);
      return;
    }

    // 5) If all checks pass, clear warning and mark valid
    setWarning("");
    setIsValid(true);
  };

  const handleContinue = async () => {
    if (!isValid) {
      return;
    }
    // Calculate age again to be sure
    const age = calculateAge(birthdate);

    try {
      // Store both age and verification status
      await AsyncStorage.setItem("user_age", age.toString());
      await AsyncStorage.setItem("user_birthdate", birthdate);
      await AsyncStorage.setItem("userIsVerified", "true");
    } catch (error) {
      console.error("Error storing user data:", error);
      Alert.alert("Storage Error", "Could not save your information.");
      return;
    }

    navigation.navigate("Height");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps='handled' showsVerticalScrollIndicator={false}>
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Image source={require("../assets/icons/backarrow.png")} />
            </TouchableOpacity>

            {/* Progress Bar */}
            <ProgressBar startProgress={20} endProgress={30} style={styles.progressBar} />

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title}>When's your birthday?</Text>
              <Text style={styles.subtitle}>Your age will be public.</Text>

              {/* Input Field */}
              <TextInput
                label='dd/mm/yyyy'
                value={birthdate}
                onChangeText={handleInputChange}
                mode='outlined'
                style={styles.input}
                keyboardType='numeric'
                outlineStyle={[styles.textInputOutline, warning !== "" && { borderColor: "#E4423F", borderWidth: 2, borderRadius: 10 }]}
                maxLength={10} // dd/mm/yyyy -> 10 characters
                onSubmitEditing={Keyboard.dismiss}
                blurOnSubmit={true}
                returnKeyType='done'
              />

              {/* Warning Section */}
              {warning !== "" && (
                <View style={styles.warningContainer}>
                  <MaterialIcons name='error-outline' size={20} color='red' />
                  <Text style={styles.warningText}>{warning}</Text>
                </View>
              )}
            </View>

            {/* Continue Button */}
            <Pressable style={[styles.continueButton, { backgroundColor: isValid ? "#E4423F" : "#F5F5F5" }]} onPress={handleContinue} disabled={!isValid}>
              <Text style={[styles.continueButtonText, { color: isValid ? "#FFF" : "rgba(26, 26, 26, 0.25)" }]}>Continue</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
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
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 50,
  },
  input: {
    backgroundColor: "#FFF",
    marginBottom: 10,
    borderRadius: 10,
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
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  warningText: {
    color: "red",
    fontSize: 14,
    marginLeft: 8,
  },
  continueButton: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E4423F",
    borderRadius: 30,
    marginBottom: 30,
    marginTop: 20,
  },
  continueButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingBottom: 50,
  },
});
