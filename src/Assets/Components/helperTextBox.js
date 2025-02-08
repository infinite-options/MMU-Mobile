import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../../src/theme/theme";

const HelperTextBox = ({ text }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    justifyContent: "center",
    marginVertical: 10,
    padding: 15,
    width: "100%",
  },
  text: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: "center",
  },
});

export default HelperTextBox;
