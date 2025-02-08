import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  Pressable,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { decrementStepCount } from '../Profile/profileStepsState';
import ProgressBar from '../src/Assets/Components/ProgressBar'; // Update this path as per your project structure

export default function ProfileBio({ navigation, route }) {
  const [bio, setBio] = useState('');
  const [inputHeight, setInputHeight] = useState(50); // Initial height
  const stepIndex = route.params?.stepIndex ?? null;

  const handleSaveAndReturn = () => {
    if (!bio.trim()) {
      Alert.alert('Please write a bio before saving.');
      return;
    }
    if (stepIndex !== null) {
      decrementStepCount(stepIndex);
    }
    // Save the bio and navigate to the profile page
    navigation.navigate('MyProfile', { bio });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={28} color="red" />
      </TouchableOpacity>

      {/* Progress Bar */}
      <ProgressBar startProgress={90} endProgress={90} />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Want to write a bio?</Text>
        <Text style={styles.subtitle}>Your profile bio will be public.</Text>

        {/* Bio Input */}
        <TextInput
          style={[styles.input, { height: inputHeight }]}
          label="Bio"
          mode="outlined"
          placeholder="Write something about yourself..."
          placeholderTextColor="#999"
          value={bio}
          outlineStyle={styles.textInputOutline}
          onChangeText={setBio}
          multiline
          onContentSizeChange={(event) => {
            const newHeight = Math.min(Math.max(event.nativeEvent.contentSize.height, 50), 200); // Adjust between minHeight and maxHeight
            setInputHeight(newHeight);
          }}
        />
      </View>

      <Pressable
        style={[
          styles.saveButton,
          { backgroundColor: bio.trim() ? '#E4423F' : '#ccc' },
        ]}
        onPress={handleSaveAndReturn}
        disabled={!bio.trim()}
      >
        <Text style={styles.saveButtonText}>Save & Return to Profile</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 30,
    padding: 8,
  },
  container: {
    alignItems: 'stretch',
    backgroundColor: '#FFF',
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  input: {
    borderWidth: 0,
    borderColor: '#ddd',
    borderRadius: 25,
    backgroundColor: '#F9F9F9',
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 50, // Initial height
    maxHeight: 200, // Maximum height
  },
  saveButton: {
    alignItems: 'center',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    margin: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'gray',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'left',
  },
  textInputOutline: {
    backgroundColor: '#F9F9F9',
    borderColor: '#F9F9F9',
    borderRadius: 25,
    borderWidth: 0,
    paddingHorizontal: 15,
  },
  title: {
    color: '#000',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'left',
  },
});
