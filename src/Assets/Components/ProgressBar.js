import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "../../../src/theme/theme";

const ProgressBar = ({ progress }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.progressBar, { width: `${progress}%` }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray[300],
    borderRadius: 4,
    height: 4,
    overflow: "hidden",
    width: "100%",
  },
  progressBar: {
    backgroundColor: colors.text.primary,
    borderRadius: 4,
    height: "100%",
  },
});

export default ProgressBar;
