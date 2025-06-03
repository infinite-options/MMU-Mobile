import React from "react";
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LandingPage5 = () => {
  const navigation = useNavigation();

  const handleStart = async () => {
    try {
      // Mark onboarding as completed
      await AsyncStorage.setItem("hasCompletedOnboarding", "true");
      navigation.navigate("AccountSetup2Create");
    } catch (error) {
      console.warn("Error saving onboarding status:", error);
      // Still navigate even if saving fails
      navigation.navigate("AccountSetup2Create");
    }
  };

  const handleLogin = async () => {
    try {
      // Mark onboarding as completed for users who login
      await AsyncStorage.setItem("hasCompletedOnboarding", "true");
      navigation.navigate("Login");
    } catch (error) {
      console.warn("Error saving onboarding status:", error);
      // Still navigate even if saving fails
      navigation.navigate("Login");
    }
  };

  return (
    <ImageBackground source={require("../assets/image4.png")} style={styles.backgroundImage}>
      {/* Red Tint Overlay */}
      <View style={styles.redTint} />

      {/* White Card Overlay */}
      <View style={styles.overlay}>
        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.activeDot} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Welcome to meet me up</Text>

        {/* Description */}
        <Text style={styles.description}>We’re currently in development and inviting singles to join early. The first 5,000 profiles will be entered into a draw to win a $3,000 travel voucher.</Text>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleStart}>
          <Text style={styles.continueButtonText}>Start</Text>
        </TouchableOpacity>

        {/* Log In Link */}
        <Text style={styles.loginText}>
          Already have an account?{" "}
          <Text style={styles.loginLink} onPress={handleLogin}>
            Log In
          </Text>
        </Text>
      </View>
    </ImageBackground>
  );
};

export const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "flex-end",
    position: "relative",
  },
  redTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(228, 66, 63, 0.3)", // Red tint overlay
  },
  overlay: {
    backgroundColor: "rgba(255, 255, 255, 0.8)", // Slightly translucent white card
    borderRadius: 25,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "95%", // Adjusted width
    height: "38%", // Slightly increased height
    alignSelf: "center",
    position: "absolute",
    bottom: "2.5%", // Moves the card higher
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    padding: 10,
    top: 15, // Moves dots to the top of the white card
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#E4423F",
    width: 16, // Elongated active dot
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    padding: 10,
    color: "#1A1A1A",
    textAlign: "center",
    marginTop: 40,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 50,
    lineHeight: 24,
  },
  continueButton: {
    backgroundColor: "#E4423F",
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: "center",
    width: "60%", // Reduced button width
    marginBottom: 15,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  loginLink: {
    fontWeight: "bold",
    textDecorationLine: "underline",
    color: "#E4423F",
  },
});

export default LandingPage5;
