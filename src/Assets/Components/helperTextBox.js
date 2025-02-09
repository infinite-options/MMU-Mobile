import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import questionMark from "../Images/questionMarkBox.png";

export default function HelperTextBox({ text }) {
  return (
    <View style={styles.container}>
      <Image source={questionMark} style={styles.image} />
      <View style={styles.textContainer}>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    flexDirection: "row",
    marginBottom: 10,
    padding: 10,
  },
  image: {
    height: 24,
    marginRight: 8,
    width: 24,
  },
  text: {
    color: "#333",
    fontFamily: "sans-serif",
    fontSize: 14,
  },
  textContainer: {
    flex: 1,
  },
});
