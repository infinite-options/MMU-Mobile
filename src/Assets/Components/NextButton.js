import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

const NextButton = ({ next, onPress }) => {
  const navigation = useNavigation();

  const handleNavigate = () => {
    if (onPress) {
      onPress();
    }
    navigation.navigate(next);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleNavigate}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: "#E4423F",
    borderRadius: 25,
    height: 45,
    justifyContent: "center",
    width: 130,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 40,
  },
});

export default NextButton;
