import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import BackButton from "../Images/BackButton.png"; // Ensure this path is correct
import { colors } from "../../../src/theme/theme";

const Progress = ({ currentStep, totalSteps }) => {
  const navigation = useNavigation();

  const progress = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Image source={BackButton} style={styles.backButton} />
        </TouchableOpacity>
        <Text style={styles.title}>Profile Creation</Text>
      </View>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {currentStep} of {totalSteps}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  backButton: {
    height: 24,
    marginRight: 10,
    width: 24,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 10,
  },
  progressBar: {
    backgroundColor: colors.primary,
    borderRadius: 2,
    height: "100%",
  },
  progressContainer: {
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    flex: 1,
    height: 4,
    marginRight: 16,
    overflow: "hidden",
  },
  progressText: {
    color: colors.primary,
    fontSize: 14,
  },
  title: {
    fontFamily: "sans-serif",
    fontSize: 20,
  },
});

export default Progress;
