import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
    Image,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TextInput, Text} from "react-native-paper";
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';

export default function EditProfile() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [userData, setUserData] = useState({});
  const [photos, setPhotos] = useState([null, null, null]); // array of photo URIs
  const [videoUri, setVideoUri] = useState(null); // single video URI
  const videoRef = useRef(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    userFirstName: '',
    userLastName: '',
    userPhone: '',
    userBio: '',
    userInterests: '',
    // dateInterests: '',
    // myAvailability: '',
    // age: 0,
    // height: '',
    // noOfChildren: '',
    // sexAssignedAtBirth: '',
    // gender: '',
    // sexualOrientation: '',
    // openTo: '',
    // nationality: '',
    // Ethininity: '',
    // bodyType: '',
    // EducationLevel: '',
    // job: '',
    // smokingHabits: '',
    // drinkingHabits: '',
    // Religion: '',
    // starSign: '',


    // Add other fields here from the form
  });
  useFocusEffect(
        React.useCallback(() => {
          // Runs on every focus
          if (videoRef.current) {
            // Pause & reset the playback to 0 if you want a fresh start
            videoRef.current.setPositionAsync(0); // optional: jump to start
            videoRef.current.pauseAsync();
            setIsVideoPlaying(false);
          }
        }, [])
      );
  // Fetch user data from the server when this screen is opened
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const uid = await AsyncStorage.getItem('user_uid');
        if (!uid) {
          console.log('No user_uid in AsyncStorage');
          return;
        }
        const response = await axios.get(
          `https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${uid}`
        );
        const fetched = response.data.result[0];

        // Update the form fields with the current user data
        setUserData(fetched || {});
        setFormValues({
          userFirstName: fetched.user_first_name || '',
          userLastName: fetched.user_last_name || '',
          userPhone: fetched.user_email_id || '',
          userBio: fetched.user_profile_bio || '',
          userInterests: fetched.user_general_interests || '',
            // dateInterests: fetched.user_date_interests || '',
            // myAvailability: fetched.user_available_time || '',
            // age: String(fetched.user_age || ''),
            // height: fetched.user_height || '',
            // noOfChildren: fetched.user_kids || '',
            // sexAssignedAtBirth: fetched.user_sex_assigned_at_birth || '',
            // gender: fetched.user_gender || '',
            // sexualOrientation: fetched.user_sexuality || '',
            openTo: fetched.user_open_to || '',
            // nationality: fetched.user_nationality || '',
            // Ethininity: fetched.user_ethinicity || '',
            // bodyType: fetched.user_body_composition || '',
            // EducationLevel: fetched.user_education || '',
            // job: fetched.user_job || '',
            // smokingHabits: fetched.user_smoking || '',
            // drinkingHabits: fetched.user_drinking || '',
            // Religion: fetched.user_religion || '',
            // starSign: fetched.user_star_sign || '',
        });
        if (fetched.user_photo_url) {
          const photoArray = JSON.parse(fetched.user_photo_url);
          const newPhotos = [null, null, null];
          photoArray.forEach((uri, idx) => {
            if (idx < 3) newPhotos[idx] = uri;
          });
          setPhotos(newPhotos);
        }

        if (fetched.user_video_url) {
          let rawVideoUrl = fetched.user_video_url;
          try {
            rawVideoUrl = JSON.parse(rawVideoUrl);
          } catch (err) {
            console.warn('Could not JSON-parse user_video_url. Using as-is:', err);
          }
          if (
            typeof rawVideoUrl === 'string' &&
            rawVideoUrl.startsWith('"') &&
            rawVideoUrl.endsWith('"')
          ) {
            rawVideoUrl = rawVideoUrl.slice(1, -1);
          }
          setVideoUri(rawVideoUrl);
        }
      } catch (error) {
        console.log('Error fetching user info:', error);
      }
    };

    if (isFocused) {
        fetchUserInfo();
      }
    }, [isFocused]);
    useEffect(() => {
        console.log('Form Values Updated:', formValues);
      }, [formValues]);
  // Handle picking images
  const handlePickImage = async (slotIndex) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const newPhotos = [...photos];
      newPhotos[slotIndex] = result.assets[0].uri;
      setPhotos(newPhotos);
    }
  };
  const handleRemovePhoto = (slotIndex) => {
    const newPhotos = [...photos];
    newPhotos[slotIndex] = null;
    setPhotos(newPhotos);
  };
  // Handle picking a video
      const handleVideoUpload = async () => {
        try {
          // If you want library instead of camera, un-comment below:
          // const result = await ImagePicker.launchImageLibraryAsync({
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            quality: 0.5,
          });
    
          if (!result.canceled && result.assets?.[0]?.uri) {
            setVideoUri(result.assets[0].uri);
            setIsVideoPlaying(false);
          }
        } catch (error) {
          console.error("Error picking video:", error);
          Alert.alert("Error", "There was an issue processing the video.");
        }
      };
  const handleRemoveVideo = () => {
    setVideoUri(null);
    setIsVideoPlaying(false);
  };
  // Toggle video play/pause
  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      await videoRef.current.pauseAsync();
      setIsVideoPlaying(false);
    } else {
      await videoRef.current.playAsync();
      setIsVideoPlaying(true);
    }
  };
  // Handle saving the changes
  const handleSaveChanges = async () => {
    if (!formValues.userFirstName || !formValues.userLastName) {
      Alert.alert('Error', 'Please fill in your first and last name.');
      return;
    }

    setIsLoading(true);

    const uploadData = new FormData();
    uploadData.append('user_uid', userData.user_uid);
    uploadData.append('user_email_id', formValues.userPhone);

    // Append each photo if it exists
    // photos.forEach((uri, index) => {
    //   if (uri) {
    //     uploadData.append(`img_${index}`, {
    //       uri,
    //       type: 'image/jpeg',
    //       name: `img_${index}.jpg`,
    //     });
    //   }
    // });

    // Append video if it exists
    // if (videoUri) {
    //   uploadData.append('user_video', {
    //     uri: videoUri,
    //     type: 'video/mp4',
    //     name: 'video_filename.mp4',
    //   });
    // }

    // Append other form data
    uploadData.append('user_first_name', formValues.userFirstName);
    uploadData.append('user_last_name', formValues.userLastName);
    uploadData.append('user_profile_bio', formValues.userBio);
    uploadData.append('user_general_interests', formValues.userInterests);
    // uploadData.append('user_date_interests', formValues.dateInterests);
    // uploadData.append('user_available_time', formValues.myAvailability);
    // uploadData.append('user_age', formValues.age);
    // uploadData.append('user_height', formValues.height);
    // uploadData.append('user_kids', formValues.noOfChildren);
    // // uploadData.append('user_sex_assigned_at_birth', formValues.sexAssignedAtBirth);
    // uploadData.append('user_gender', formValues.gender);
    // uploadData.append('user_sexuality', formValues.sexualOrientation);
    uploadData.append('user_open_to', formValues.openTo);
    // uploadData.append('user_nationality', formValues.nationality);
    // // uploadData.append('user_ethinicity', formValues.Ethininity);
    // uploadData.append('user_body_composition', formValues.bodyType);
    // uploadData.append('user_education', formValues.EducationLevel);
    // uploadData.append('user_job', formValues.job);
    // uploadData.append('user_smoking', formValues.smokingHabits);
    // uploadData.append('user_drinking', formValues.drinkingHabits);
    // uploadData.append('user_religion', formValues.Religion);
    // uploadData.append('user_star_sign', formValues.starSign);

    try {
      const response = await axios.put(
        'https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo',
        uploadData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.status === 200) {
        Alert.alert('Success', 'Your profile has been updated!');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to update your profile.');
      }
    } catch (error) {
        console.log('Error uploading profile:', error.response ? error.response.data : error);
        Alert.alert('Error', 'There was an issue updating your profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Editing My Profile</Text>
        </View>

        {/* Profile Media */}
        <View style={styles.mediaContainer}>
          {videoUri ? (
            <View style={styles.videoWrapper}>
              <Video
                ref={videoRef}
                source={{ uri: videoUri }}
                style={styles.video}
                resizeMode="cover"
                useNativeControls
                shouldPlay={false}
                onPlaybackStatusUpdate={(status) => {
                  if (!status.isLoaded) return;
                  setIsVideoPlaying(status.isPlaying);
                }}
                onError={(err) => console.log('VIDEO ERROR:', err)}
              />
              {/* Center play overlay if paused */}
                            {!isVideoPlaying && (
                              <TouchableOpacity style={styles.playOverlay} onPress={handlePlayPause}>
                                <Ionicons name="play" size={48} color="#FFF" />
                              </TouchableOpacity>
                            )}
              {/* "X" in top-right */}
              <TouchableOpacity onPress={handleRemoveVideo} style={styles.removeIconTopRight}>
              <View style={styles.removeIconBackground}>
                <Ionicons name="close" size={20} color="#FFF" />
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={handleVideoUpload} style={styles.uploadVideoButton}>
              <Ionicons name="cloud-upload-outline" size={20} color="#E4423F" />
              <Text style={styles.uploadVideoText}>Upload Video</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Photos Section */}
        <View style={styles.photoBoxesRow}>
          {photos.map((photoUri, idx) => (
            <View key={idx} style={styles.photoBox}>
              {photoUri ? (
                <>
                  <Image source={{ uri: photoUri }} style={styles.photoImage} />
                  <TouchableOpacity
                    onPress={() => handleRemovePhoto(idx)}
                    style={styles.removeIconTopRight}
                  >
                    <View style={styles.removeIconBackground}>
                                          <Ionicons name="close" size={20} color="#FFF" />
                                        </View>
                  </TouchableOpacity>
                </>
              ) : (
                <Pressable style={styles.emptyPhotoBox} onPress={() => handlePickImage(idx)}>
                  <Ionicons name="add" size={24} color="red" />
                </Pressable>
              )}
            </View>
          ))}
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <TextInput
            label="First Name"
            mode="outlined"
            style={styles.inputField}
            placeholder="First Name"
            value={formValues.userFirstName}
            onChangeText={(text) => setFormValues({ ...formValues, userFirstName: text })}
            outlineStyle={styles.textInputOutline}
          />
          <TextInput
            label="Last Name"
            mode="outlined"
            style={styles.inputField}
            placeholder="Last Name"
            value={formValues.userLastName}
            onChangeText={(text) => setFormValues({ ...formValues, userLastName: text })}
            outlineStyle={styles.textInputOutline}
          />
          <TextInput
            label="Phone Number"
            mode="outlined"
            style={styles.inputField}
            placeholder="Phone Number"
            value={formValues.userPhone}
            onChangeText={(text) => setFormValues({ ...formValues, userPhone: text })}
            outlineStyle={styles.textInputOutline}
          />
          <TextInput
            label="Bio"
            mode="outlined"
            style={styles.inputField}
            placeholder="Bio"
            value={formValues.userBio}
            onChangeText={(text) => setFormValues({ ...formValues, userBio: text })}
            outlineStyle={styles.textInputOutline}
          />
          <TextInput
            label="Interests"
            mode="outlined"
            style={styles.inputField}
            placeholder="Interests"
            value={formValues.userInterests}
            onChangeText={(text) => setFormValues({ ...formValues, userInterests: text })}
            outlineStyle={styles.textInputOutline}
          />
            {/* <TextInput
            label="Date Interests"
            mode="outlined"
            style={styles.inputField}
            placeholder="Date Interests"
            value={formValues.dateInterests}
            onChangeText={(text) => setFormValues({ ...formValues, dateInterests: text })}
            outlineStyle={styles.textInputOutline}
            />
            <TextInput
            label="My Availability"
            mode="outlined"
            style={styles.inputField}
            placeholder="My Availability"
            value={formValues.myAvailability}
            onChangeText={(text) => setFormValues({ ...formValues, myAvailability: text })}
            outlineStyle={styles.textInputOutline}
            />
            <TextInput
            label="Age"
            mode="outlined"
            style={styles.inputField}
            placeholder="Age"
            value={formValues.age}
            onChangeText={(text) => setFormValues({ ...formValues, age: text })}
            outlineStyle={styles.textInputOutline}
            />
            <TextInput
            label="Height"
            mode="outlined"
            style={styles.inputField}
            placeholder="Height"
            value={formValues.height}
            onChangeText={(text) => setFormValues({ ...formValues, height: text })}
            outlineStyle={styles.textInputOutline}
            />
            <TextInput
            label="No of Children"
            mode="outlined"
            style={styles.inputField}
            placeholder="No of Children"
            value={formValues.noOfChildren}
            onChangeText={(text) => setFormValues({ ...formValues, noOfChildren: text })}
            outlineStyle={styles.textInputOutline}
            /> */}
            {/* <TextInput
            label="sex Assigned At Birth"
            mode="outlined"
            style={styles.inputField}
            placeholder="Sex Assigned At Birth"
            value={formValues.sexAssignedAtBirth}
            onChangeText={(text) => setFormValues({ ...formValues, sexAssignedAtBirth: text })}
            outlineStyle={styles.textInputOutline}
            /> */}
            {/* <TextInput
            label="gender"
            mode="outlined"
            style={styles.inputField}
            placeholder="gender"
            value={formValues.gender}
            onChangeText={(text) => setFormValues({ ...formValues, gender: text })}
            outlineStyle={styles.textInputOutline}
            />
            <TextInput
            label="Sexual Orientation"
            mode="outlined"
            style={styles.inputField}
            placeholder="Sexual Orientation"
            value={formValues.sexualOrientation}
            onChangeText={(text) => setFormValues({ ...formValues, sexualOrientation: text })}
            outlineStyle={styles.textInputOutline}
            />*/}
            <TextInput
            label="Open To"
            mode="outlined"
            style={styles.inputField}
            placeholder="Open To"
            value={formValues.openTo}
            onChangeText={(text) => setFormValues({ ...formValues, openTo: text })}
            outlineStyle={styles.textInputOutline}
            />
            {/* <TextInput
            label="Nationality"
            mode="outlined"
            style={styles.inputField}
            placeholder="nationality"
            value={formValues.nationality}
            onChangeText={(text) => setFormValues({ ...formValues, nationality: text })}
            outlineStyle={styles.textInputOutline}
            />  */}
            {/* <TextInput
            label="Ethinicity"
            mode="outlined"
            style={styles.inputField}
            placeholder="Ethinicity"
            value={formValues.Ethininity}
            onChangeText={(text) => setFormValues({ ...formValues, Ethininity: text })}
            outlineStyle={styles.textInputOutline}
            /> */}
            {/* <TextInput
            label="Body Type"
            mode="outlined"
            style={styles.inputField}
            placeholder="Body Type"
            value={formValues.bodyType}
            onChangeText={(text) => setFormValues({ ...formValues, bodyType: text })}
            outlineStyle={styles.textInputOutline}
            />
            <TextInput
            label="Education Level"
            mode="outlined"
            style={styles.inputField}
            placeholder="Education Level"
            value={formValues.EducationLevel}
            onChangeText={(text) => setFormValues({ ...formValues, EducationLevel: text })}
            outlineStyle={styles.textInputOutline}
            />
            <TextInput
            label="Job"
            mode="outlined"
            style={styles.inputField}
            placeholder="Job"
            value={formValues.job}
            onChangeText={(text) => setFormValues({ ...formValues, job: text })}
            outlineStyle={styles.textInputOutline}
            />
            <TextInput
            label="Smoking Habits"
            mode="outlined"
            style={styles.inputField}
            placeholder="Smoking Habits"
            value={formValues.smokingHabits}
            onChangeText={(text) => setFormValues({ ...formValues, smokingHabits: text })}
            outlineStyle={styles.textInputOutline}
            />
            <TextInput
            label="Drinking Habits"
            mode="outlined"
            style={styles.inputField}
            placeholder="Drinking Habits"
            value={formValues.drinkingHabits}
            onChangeText={(text) => setFormValues({ ...formValues, drinkingHabits: text })}
            outlineStyle={styles.textInputOutline}
            />
            <TextInput
            label="Religion"
            mode="outlined"
            style={styles.inputField}
            placeholder="Religion"
            value={formValues.Religion}
            onChangeText={(text) => setFormValues({ ...formValues, Religion: text })}
            outlineStyle={styles.textInputOutline}
            />
            <TextInput
            label="Star Sign"
            mode="outlined"
            style={styles.inputField}
            placeholder="Star Sign"
            value={formValues.starSign}
            onChangeText={(text) => setFormValues({ ...formValues, starSign: text })}
            outlineStyle={styles.textInputOutline}
            /> */}
        </View>

        {/* Save Changes Button */}
        <TouchableOpacity onPress={handleSaveChanges} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// STYLES
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF",
        justifyContent: "flex-start",
        alignItems: "stretch",
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      },
      headerContainer: {
        paddingHorizontal: 20,
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  mediaContainer: {
    marginBottom: 20,
  },
  videoWrapper: {
    position: "relative",
    width: "100%",
    aspectRatio: 0.76,
    backgroundColor: "#000",
    marginBottom: 15,
    borderRadius: 10,
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -24 }, { translateY: -24 }],
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 50,
    padding: 10,
  },
  removeIconTopRight: {
    position: "absolute",
    top: 5,
    right: 5,
  },
  removeIconBackground: {
    backgroundColor: "#E4423F",
    borderRadius: 20,
    padding: 4,
  },
  uploadVideoButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#E4423F",
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  uploadVideoText: {
    color: "#E4423F",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },

  // Photo boxes in a row (3 boxes)
  photoBoxesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  photoBox: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
    overflow: "hidden",
    position: "relative",
  },
  emptyPhotoBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  inputField: {
    marginBottom: 15,
  },
  saveButton: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E4423F",
    borderRadius: 30,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  textInputOutline: {
    borderWidth: 0,
    borderColor: "#F9F9F9",
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 50,
  },
});
