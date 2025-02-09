import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import BackButton from "../Images/BackButton.png"; // Ensure this path is correct

const Progress = ({ percent, prev }) => {
  const navigation = useNavigation();

  let finished;
  let unfinished;

  const calcProgress = () => {
    finished = parseInt(percent, 10) * 1.1;
    unfinished = 10.5 - finished;
  };
  calcProgress();

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.navigate(prev)}>
          <Image source={BackButton} style={styles.backButton} />
        </TouchableOpacity>
        <Text style={styles.title}>Profile Creation</Text>
      </View>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${finished}%` }]} />
        <Text style={styles.percentText}>{percent}</Text>
        <View style={[styles.incompleteBar, { width: `${unfinished}%` }]} />
      </View>
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
  incompleteBar: {
    backgroundColor: "#E2E2E2",
    borderRadius: 3,
    height: 2.5,
    marginLeft: 5,
  },
  percentText: {
    color: "#E4423F",
    fontSize: 18,
    marginHorizontal: 5,
  },
  progressBar: {
    backgroundColor: "#E4423F",
    borderRadius: 2,
    height: 2,
  },
  progressContainer: {
    alignItems: "center",
    flexDirection: "row",
  },
  title: {
    fontFamily: "sans-serif",
    fontSize: 20,
  },
});

export default Progress;
