import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { colors } from "../../../src/theme/theme";

const NextButton = ({ onPress, title = "Next" }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    marginVertical: 10,
    width: "100%",
  },
  buttonText: {
    color: colors.text.light,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default NextButton;
