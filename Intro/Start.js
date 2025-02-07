import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

const StartPage = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* App Title */}
      <Text style={styles.title}>meet me up</Text>

      {/* Get Started Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("AgeVerification")}>
          <Text style={styles.buttonText}>Get Started!</Text>
        </TouchableOpacity>

        {/* Log In Link */}
        <Text style={styles.loginText}>
          Already have an account?{" "}
          <Text style={styles.loginLink} onPress={() => navigation.navigate("Login")}>
            Log In
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E4423F",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    position: "absolute",
    top: "35%", // Moves the text higher
  },
  bottomContainer: {
    position: "absolute",
    bottom: 50, // Positions the container near the bottom
    alignItems: "center",
    width: "100%",
  },
  button: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: "center",
    width: "100%",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  loginText: {
    fontSize: 16,
    color: "#1A1A1A",
    marginTop: 10,
  },
  loginLink: {
    fontWeight: "bold",
    textDecorationLine: "underline",
    color: "#F5F5F5",
  },
});

export default StartPage;
