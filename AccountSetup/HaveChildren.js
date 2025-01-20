import React, { useState } from "react";
import {
  View,
  Text,
  StatusBar,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage"; // <-- Import AsyncStorage
import ProgressBar from "../src/Assets/Components/ProgressBar";

export default function HaveChildren({ navigation }) {
  // We only need numChildren on this screen
  const [numChildren, setNumChildren] = useState(0);

  // Increment/Decrement logic
  const handleIncrement = () => setNumChildren((prev) => prev + 1);
  const handleDecrement = () => setNumChildren((prev) => (prev > 0 ? prev - 1 : 0));

  // Check if form is complete (e.g., if user has chosen a number)
  const isFormComplete = numChildren !== null; // or numChildren >= 0

  // On Continue, store in AsyncStorage and move on
  const handleContinue = async () => {
    if (!isFormComplete) return;

    try {
      await AsyncStorage.setItem("user_kids", numChildren.toString());
      console.log("Number of children saved to AsyncStorage:", numChildren);
    } catch (error) {
      console.error("Error saving user_kids:", error);
    }

    // Navigate to the next screen
    navigation.navigate("AssignedSex");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="red" />
      </TouchableOpacity>

      {/* Progress Bar */}
      <ProgressBar startProgress={30} endProgress={30} />

      {/* Title and Subtitle */}
      <View style={styles.content}>
        <Text style={styles.title}>How many children do you have?</Text>
        <Text style={styles.subtitle}>The number of children you have will be public.</Text>

        {/* Number of Children Section */}
        <View style={styles.fieldWrapperFull}>
          <Text style={styles.fieldLabel}># of Children</Text>
          <View style={styles.field}>
            {/* Display the current number of children */}
            <Text style={styles.fieldValue}>{numChildren}</Text>

            {/* Decrement Button */}
            <TouchableOpacity onPress={handleDecrement} style={styles.fieldButton}>
              <Text style={styles.fieldButtonText}>−</Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Increment Button */}
            <TouchableOpacity onPress={handleIncrement} style={styles.fieldButton}>
              <Text style={styles.fieldButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Continue Button */}
      <Pressable
        style={[styles.continueButton, { backgroundColor: isFormComplete ? "#E4423F" : "#ccc" }]}
        onPress={handleContinue}
        disabled={!isFormComplete}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>
    </SafeAreaView>
  );
}

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
  content: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 20,
  },
  fieldWrapperFull: {
    width: "100%",
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 5,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
  },
  fieldValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
  },
  fieldButton: {
    paddingHorizontal: 10,
  },
  fieldButtonText: {
    fontSize: 20,
    color: "#888",
  },
  separator: {
    width: 1,
    height: "60%",
    backgroundColor: "#ccc",
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
});
