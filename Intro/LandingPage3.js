import React from "react";
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

const LandingPage3 = () => {
  const navigation = useNavigation();

  return (
    <ImageBackground source={require("../assets/image3.png")} style={styles.backgroundImage}>
      {/* Red Tint Overlay */}
      <View style={styles.redTint} />

      {/* White Card Overlay */}
      <View style={styles.overlay}>
        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.activeDot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Title */}
        <Text style={styles.title}>No Misleading Profiles</Text>

        {/* Description */}
        <Text style={styles.description}>
          Wary of being catfished? Don't be! meet me up{"\n"}
          requires every user to upload a video of{"\n"}
          themselves to their profile, updated yearly.
        </Text>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={() => navigation.navigate("LandingPage4")}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <TouchableOpacity onPress={() => navigation.navigate("AccountSetup2Create")}>
          <Text style={styles.signUpText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
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
    height: "38%", // Increased height
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
    top: 15, // Moves dots to the top
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
  loginText: {
    fontSize: 16,
    color: "#4A4A4A",
    marginTop: 10,
  },
  signUpText: {
    fontSize: 18,
    textDecorationLine: "underline",
    color: "#1A1A1A",
  },
});

export default LandingPage3;
