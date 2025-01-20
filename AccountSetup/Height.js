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
import ProgressBar from "../src/Assets/Components/ProgressBar";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Helper functions to convert cm <-> ft & in
function cmToFtIn(cm) {
  // 1 in = 2.54 cm
  // 1 ft = 12 in
  // round so you don't get floating inches
  const totalInches = Math.round(cm / 2.54);
  const ft = Math.floor(totalInches / 12);
  const inch = totalInches % 12;
  return { ft, inch };
}

function ftInToCm(ft, inch) {
  // totalInches = ft * 12 + inch
  // 1 in = 2.54 cm
  const totalInches = ft * 12 + inch;
  return Math.round(totalInches * 2.54);
}

export default function Height({ navigation }) {
  // Default to 175 cm, and convert it to ft/in
  const [heightCm, setHeightCm] = useState(175);
  const initialFtIn = cmToFtIn(175);
  const [heightFt, setHeightFt] = useState(initialFtIn.ft);
  const [heightIn, setHeightIn] = useState(initialFtIn.inch);

  // "cm" or "ft"
  const [selectedUnit, setSelectedUnit] = useState("cm"); // Default to cm

  // Toggle between cm and ft/in, converting the value
  const handleUnitToggle = (newUnit) => {
    if (newUnit === selectedUnit) return; // no change needed

    if (newUnit === "cm") {
      // Convert from ft/in -> cm
      const newCm = ftInToCm(heightFt, heightIn);
      setHeightCm(newCm);
    } else {
      // Convert from cm -> ft/in
      const { ft, inch } = cmToFtIn(heightCm);
      setHeightFt(ft);
      setHeightIn(inch);
    }

    setSelectedUnit(newUnit);
  };

  // Increment/decrement for ft
  const handleIncrementFt = () => setHeightFt((prev) => prev + 1);
  const handleDecrementFt = () => setHeightFt((prev) => (prev > 0 ? prev - 1 : 0));

  // Increment/decrement for in
  const handleIncrementIn = () => setHeightIn((prev) => (prev < 11 ? prev + 1 : 11));
  const handleDecrementIn = () => setHeightIn((prev) => (prev > 0 ? prev - 1 : 0));

  // Increment/decrement for cm
  const handleIncrementCm = () => setHeightCm((prev) => prev + 1);
  const handleDecrementCm = () => setHeightCm((prev) => (prev > 0 ? prev - 1 : 0));

  // The form is “complete” if:
  //  - "ft": (heightFt >= 1)
  //  - "cm": (heightCm >= 50) or however you decide
  const isFormComplete =
    (selectedUnit === "ft" && heightFt >= 1) ||
    (selectedUnit === "cm" && heightCm >= 50);

  const handleContinue = async () => {
    if (!isFormComplete) return;

    // On Continue, store both cm and ft/in for future use.
    let cmValue = heightCm;
    let ftValue = heightFt;
    let inValue = heightIn;

    // If user is in ft mode, convert to cm so we can store both
    if (selectedUnit === "ft") {
      cmValue = ftInToCm(heightFt, heightIn);
    } else {
      // If user is in cm mode, convert to ft/in so we have them all
      const { ft, inch } = cmToFtIn(heightCm);
      ftValue = ft;
      inValue = inch;
    }

    try {
      await AsyncStorage.setItem("user_height_cm", String(cmValue));
      await AsyncStorage.setItem("user_height_ft", String(ftValue));
      await AsyncStorage.setItem("user_height_in", String(inValue));
      console.log("Height saved successfully");
    } catch (error) {
      console.error("Error saving height:", error);
    }

    // Move to next screen
    navigation.navigate("HaveChildren");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="red" />
      </TouchableOpacity>

      {/* Progress Bar */}
      <ProgressBar startProgress={30} endProgress={35} />

      {/* Title / Subtitle */}
      <View style={styles.content}>
        <Text style={styles.title}>How tall are you?</Text>
        <Text style={styles.subtitle}>Your height will be public.</Text>

        {/* Toggle for cm vs. ft & in */}
        <View style={styles.unitToggleContainer}>
          <TouchableOpacity
            style={styles.toggleSpacing}
            onPress={() => handleUnitToggle("cm")}
          >
            <Text
              style={[
                styles.unitToggleText,
                selectedUnit === "cm" ? styles.unitToggleActive : null,
              ]}
            >
              cm
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleSpacing}
            onPress={() => handleUnitToggle("ft")}
          >
            <Text
              style={[
                styles.unitToggleText,
                selectedUnit === "ft" ? styles.unitToggleActive : null,
              ]}
            >
              ft & in
            </Text>
          </TouchableOpacity>
        </View>

        {/* If user selects cm, show up/down arrows for cm */}
        {selectedUnit === "cm" && (
          <View style={styles.selector}>
            <TouchableOpacity
              onPress={handleIncrementCm}
              style={styles.arrowButton}
            >
              <Ionicons name="caret-up" size={40} color="#888" />
            </TouchableOpacity>

            <Text style={styles.selectorValue}>
              <Text style={styles.valueText}>{heightCm}</Text>
              <Text style={styles.unitText}> cm</Text>
            </Text>

            <TouchableOpacity
              onPress={handleDecrementCm}
              style={styles.arrowButton}
            >
              <Ionicons name="caret-down" size={40} color="#888" />
            </TouchableOpacity>
          </View>
        )}

        {/* If user selects ft & in, show up/down arrows for ft & in */}
        {selectedUnit === "ft" && (
          <View style={styles.ftInContainer}>
            {/* Feet Selector */}
            <View style={styles.selector}>
              <TouchableOpacity
                onPress={handleIncrementFt}
                style={styles.arrowButton}
              >
                <Ionicons name="caret-up" size={40} color="#888" />
              </TouchableOpacity>

              <Text style={styles.selectorValue}>
                <Text style={styles.valueText}>{heightFt}</Text>
                <Text style={styles.unitText}> ft</Text>
              </Text>

              <TouchableOpacity
                onPress={handleDecrementFt}
                style={styles.arrowButton}
              >
                <Ionicons name="caret-down" size={40} color="#888" />
              </TouchableOpacity>
            </View>

            {/* Inch Selector */}
            <View style={styles.selector}>
              <TouchableOpacity
                onPress={handleIncrementIn}
                style={styles.arrowButton}
              >
                <Ionicons name="caret-up" size={40} color="#888" />
              </TouchableOpacity>

              <Text style={styles.selectorValue}>
                <Text style={styles.valueText}>{heightIn}</Text>
                <Text style={styles.unitText}> in</Text>
              </Text>

              <TouchableOpacity
                onPress={handleDecrementIn}
                style={styles.arrowButton}
              >
                <Ionicons name="caret-down" size={40} color="#888" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Continue Button */}
      <Pressable
        style={[
          styles.continueButton,
          { backgroundColor: isFormComplete ? "#E4423F" : "#ccc" },
        ]}
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
  unitToggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 40,
  },
  unitToggleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#888",
    marginHorizontal: 20,
  },
  unitToggleActive: {
    color: "red",
    borderBottomWidth: 2,
    borderBottomColor: "red",
  },
  toggleSpacing: {
    paddingVertical: 6,
  },
  selector: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  ftInContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginBottom: 40,
  },
  arrowButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  selectorValue: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 8,
  },
  valueText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#000",
  },
  unitText: {
    fontSize: 20,
    color: "#000",
    marginLeft: 6,
    marginBottom: 5,
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
