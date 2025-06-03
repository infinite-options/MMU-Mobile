import React, { useState } from "react";
import { SafeAreaView, Platform, StatusBar, View, Text, TouchableOpacity, Pressable, StyleSheet, ScrollView, Image, KeyboardAvoidingView } from "react-native";
import ProgressBar from "../src/Assets/Components/ProgressBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

export default function OpenToScreen({ navigation }) {
  const [selectedOptions, setSelectedOptions] = useState([]);

  // The list of choices, as shown in the screenshot:
  const openToOptions = ["Men", "Women", "Men (transgender)", "Women (transgender)", "Non-binary", "Genderqueer", "Other"];

  // Toggle an option on/off in the selectedOptions array
  const toggleOption = (option) => {
    if (selectedOptions.includes(option)) {
      // If currently selected, remove it
      setSelectedOptions((prev) => prev.filter((o) => o !== option));
    } else {
      // If not selected, add it
      setSelectedOptions((prev) => [...prev, option]);
    }
  };

  // Continue button is only enabled if at least 1 selection
  const isFormComplete = selectedOptions.length > 0;

  const handleContinue = async () => {
    if (isFormComplete) {
      try {
        // Store the selected options array in AsyncStorage
        await AsyncStorage.setItem("user_open_to", JSON.stringify(selectedOptions));
        console.log("User open to stored:", selectedOptions);
      } catch (error) {
        console.error("Error storing user_open_to:", error);
      }

      // Move to the next screen, passing the chosen preferences
      navigation.navigate("InterestsScreen", { openTo: selectedOptions });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps='handled' showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Image source={require("../assets/icons/backarrow.png")} />
          </TouchableOpacity>

          {/* Progress Bar */}
          <ProgressBar startProgress={50} endProgress={60} style={styles.progressBar} />

          {/* Title / Subtitle */}
          <View style={styles.content}>
            <Text style={styles.title}>Who are you open to?</Text>
            <Text style={styles.subtitle}>We'll only show your preferences to you.</Text>

            {/* List of options */}
            {openToOptions.map((option) => {
              const isSelected = selectedOptions.includes(option);
              return (
                <TouchableOpacity
                  key={option}
                  onPress={() => toggleOption(option)}
                  style={[
                    styles.optionButton,
                    // If selected, make the border black; otherwise gray
                    { borderColor: isSelected ? "rgba(26, 26, 26, 1)" : "rgba(26, 26, 26, 0.5)" },
                  ]}
                >
                  <View style={styles.optionInner}>
                    {/* Circle on the left */}
                    <View
                      style={[
                        styles.circle,
                        {
                          backgroundColor: isSelected ? "#000" : "#FFF",
                          borderColor: isSelected ? "rgba(26, 26, 26, 1)" : "rgba(26, 26, 26, 0.5)",
                        },
                      ]}
                    >
                      {/* Show a checkmark if selected */}
                      {isSelected && <Ionicons name='checkmark' size={10} color='#FFF' />}
                    </View>
                    {/* Option text */}
                    <Text style={[styles.optionText, { color: isSelected ? "rgba(26, 26, 26, 1)" : "rgba(26, 26, 26, 0.5)" }]}>{option}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Continue Button */}
          <Pressable style={[styles.continueButton, { backgroundColor: isFormComplete ? "#E4423F" : "#F5F5F5" }]} onPress={handleContinue} disabled={!isFormComplete}>
            <Text style={[styles.continueButtonText, { color: isFormComplete ? "#FFF" : "rgba(26, 26, 26, 0.25)" }]}>Continue</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* Basic container + spacing, matching the style in your screenshots */
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

  /* Each option row is a large pill-shaped button */
  optionButton: {
    borderWidth: 1,
    borderRadius: 30,
    padding: 15,
    marginVertical: 5,
  },
  optionInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
    fontWeight: 500,
  },
  /* Circle on the left side */
  circle: {
    width: 20,
    height: 20,
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  /* Option text */
  optionText: {
    color: "#000",
    fontSize: 16,
  },

  /* Continue button styling, as in your other pages */
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
