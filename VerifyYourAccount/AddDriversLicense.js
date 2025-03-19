import React, { useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Image, Alert, Pressable, Platform, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ProgressBar from "../src/Assets/Components/ProgressBar";
import * as ImagePicker from "expo-image-picker";
import { decrementStepCount } from "../Profile/profileStepsState";
export default function AddDriversLicense({ navigation, route }) {
  const stepIndex = route.params?.stepIndex ?? null;
  const [image, setImage] = useState(null);

  const handleUpload = async () => {
    // Ask for permission to access media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "You need to allow access to your media library to upload a file.");
      return;
    }

    // Pick an image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]); // Save the selected image
    }
  };

  const handleRemoveImage = () => {
    setImage(null); // Remove the uploaded image
  };

  const handleSaveAndReturn = () => {
    if (!image) {
      Alert.alert("No File Uploaded", "Please upload a picture of your driver’s license before saving.");
      return;
    }
    if (stepIndex !== null) {
      decrementStepCount(stepIndex);
    }
    // Save or proceed with the uploaded file
    navigation.navigate("MyProfile", { image });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name='arrow-back' size={28} color='red' />
      </TouchableOpacity>

      {/* Progress Bar */}
      <ProgressBar startProgress={95} endProgress={100} style={styles.progressBar} />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Add your driver's license.</Text>
        <Text style={styles.subtitle}>Please upload a picture of your driver's license.</Text>

        {/* Upload Button */}
        <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
          <Ionicons name='cloud-upload-outline' size={24} color='red' />
          <Text style={styles.uploadButtonText}>Upload Drivers License</Text>
        </TouchableOpacity>

        {/* Uploaded Image Preview */}
        {image && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image.uri }} style={styles.image} />
            <View style={styles.imageDetails}>
              <Text style={styles.imageFilename}>{image.uri.split("/").pop()}</Text>
              <Text style={styles.imageSize}>~{(image.fileSize / 1024 / 1024).toFixed(2)} MB</Text>
              <TouchableOpacity onPress={handleRemoveImage}>
                <Ionicons name='trash-outline' size={24} color='red' />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Save & Return Button */}
      <Pressable style={[styles.saveButton, { backgroundColor: image ? "red" : "#ccc" }]} onPress={handleSaveAndReturn} disabled={!image}>
        <Text style={styles.saveButtonText}>Save & Return to Profile</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    padding: 8,
    marginBottom: 20,
    marginTop: 30,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "gray",
    marginBottom: 30,
    textAlign: "center",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "red",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
  },
  uploadButtonText: {
    color: "red",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  imageContainer: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 200,
    height: 120,
    borderRadius: 10,
    marginBottom: 10,
  },
  imageDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "80%",
  },
  imageFilename: {
    fontSize: 14,
    color: "#333",
  },
  imageSize: {
    fontSize: 14,
    color: "gray",
  },
  saveButton: {
    margin: 20,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  progressBar: {
    marginBottom: 20,
  },
});
