import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  TouchableOpacity,
  Image,
  Pressable,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import { useFocusEffect } from '@react-navigation/native';
import ProgressBar from '../src/Assets/Components/ProgressBar';
import { getProfileSteps, getProfileCompletion } from './profileStepsState';

// Example placeholders for bottom navigation icons
const BottomNav = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.bottomNavContainer}>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Home')}>
        <Ionicons name="home-outline" size={24} color="#888" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Matches')}>
        <Ionicons name="heart-outline" size={24} color="#888" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Messages')}>
        <Ionicons name="chatbubble-ellipses-outline" size={24} color="#888" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('MyProfile')}>
        <Ionicons name="person-circle-outline" size={24} color="#E4423F" />
      </TouchableOpacity>
    </View>
  );
};

export default function MyProfile() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  // user data from DB
  const [userData, setUserData] = useState({});
  // For user media
  const [photos, setPhotos] = useState([null,null,null]); // array of photo URIs
  const [videoUri, setVideoUri] = useState(null); // single video URI

  const [profileSteps, setProfileSteps] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState(80);
  const videoRef = useRef(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Menu popup
  const [menuVisible, setMenuVisible] = useState(false);
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
  // Fetch user data on mount/focus
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const uid = await AsyncStorage.getItem('user_uid');
        if (!uid) {
          console.log('No user_uid in AsyncStorage');
          return;
        }
        // GET user info
        const response = await axios.get(
          `https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${uid}`
        );
        const fetched = response.data.result[0];
        console.log('Fetched user info:', fetched);

        setUserData(fetched || {});
        if (fetched.user_photo_url) {
          const photoArray = JSON.parse(fetched.user_photo_url);
          // We only have 3 slots, fill them from the array
          const newPhotos = [null, null, null];
          photoArray.forEach((uri, idx) => {
            if (idx < 3) newPhotos[idx] = uri;
          });
          setPhotos(newPhotos);
        }
    
        // ========== Video handling (Option B) ==========
        if (fetched.user_video_url) {
          let rawVideoUrl = fetched.user_video_url;
    
          // Attempt to parse if it looks like a JSON string
          try {
            rawVideoUrl = JSON.parse(rawVideoUrl); 
            // e.g. "\"https://s3.us-west-1.amazonaws.com/...\"" -> "https://s3.us-west-1.amazonaws.com/..."
          } catch (err) {
            console.warn("Could not JSON-parse user_video_url. Using as-is:", err);
          }
    
          // If there's still extra quotes, you can remove them manually:
          if (
            typeof rawVideoUrl === 'string' &&
            rawVideoUrl.startsWith('"') &&
            rawVideoUrl.endsWith('"')
          ) {
            rawVideoUrl = rawVideoUrl.slice(1, -1);
          }
    
          console.log("Cleaned video url:", rawVideoUrl);
          setVideoUri(rawVideoUrl);
        }

      } catch (error) {
        console.log('Error fetching user info:', error);
      }
    };

    // Profile steps logic
    const steps = getProfileSteps();
    setProfileSteps(steps);
    setProfileCompletion(getProfileCompletion());

    if (isFocused) {
      fetchUserInfo();
    }
  }, [isFocused]);

  const isProfileComplete = profileSteps.length === 0;

  // Handler: big "X" to remove the top media (video or photo)
  const handleRemoveMainMedia = async () => {
    // If it's a video, remove videoUri, etc.
    setVideoUri(null);
    // or remove photos[0] if that was displayed
    // Then do an API call to update user_photo_url or user_video_url
    console.log('Remove main media triggered');
  };
const handlePickImage = async (slotIndex) => {
    try {
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
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "There was an issue processing the image.");
    }
  };
  // Handler: remove a smaller photo (like from the photos array)
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

  // Press a link in the profile steps card
  const handlePressLink = (index) => {
    const step = profileSteps[index];
  
    if (step.title === 'your date preferences') {
      // 2 sub-pages
      if (step.count === 2) {
        navigation.navigate('DateAvailability', { stepIndex: index });
      } else if (step.count === 1) {
        navigation.navigate('TypeOfDate', { stepIndex: index });
      }
    }
    else if (step.title === 'a few more details about you') {
      // 8 sub-pages
      switch (step.count) {
        case 8:
          navigation.navigate('AdditionalDetailsOne', { stepIndex: index });
          break;
        case 7:
          navigation.navigate('AdditionalDetailsTwo', { stepIndex: index });
          break;
        case 6:
          navigation.navigate('AdditionalDetailsThree', { stepIndex: index });
          break;
        case 5:
          navigation.navigate('AdditionalDetailsFour', { stepIndex: index });
          break;
        case 4:
          navigation.navigate('AdditionalDetailsFive', { stepIndex: index });
          break;
        case 3:
          navigation.navigate('AdditionalDetailsSix', { stepIndex: index });
          break;
        case 2:
          navigation.navigate('AdditionalDetailsSeven', { stepIndex: index });
          break;
        case 1:
          navigation.navigate('AdditionalDetailsEight', { stepIndex: index });
          break;
        default:
          // If count is 0 or some unexpected value, do nothing or handle error
          break;
      }
    }
    else if (step.title === 'profile bio') {
      // 1 sub-page
      if (step.count === 1) {
        navigation.navigate('ProfileBio', { stepIndex: index });
      }
    }
    else if (step.title === 'verify your account') {
      // 2 sub-pages
      if (step.count === 2) {
        navigation.navigate('VerifyPhoneNumber1', { stepIndex: index });
      } else if (step.count === 1) {
        navigation.navigate('AddDriversLicense', { stepIndex: index });
      }
    }
    else {
      // Fallback or other steps
      // e.g. navigation.navigate(step.route, { stepIndex: index });
    }
  };

  // Show/hide the popup menu
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };
  const uploadMediaToBackend = async () => {
    if (!userId || !userEmail) {
      Alert.alert("Error", "User ID or email missing. Please log in again.");
      return;
    }

    setIsLoading(true);

    const uploadData = new FormData();
    uploadData.append("user_uid", userId);
    uploadData.append("user_email_id", userEmail);

    // Append each photo if it exists
    photos.forEach((uri, index) => {
      if (uri) {
        uploadData.append(`img_${index}`, {
          uri,
          type: "image/jpeg",
          name: `img_${index}.jpg`,
        });
      }
    });

    // Append video if it exists
    if (videoUri) {
      uploadData.append("user_video", {
        uri: videoUri,
        type: "video/mp4",
        name: "video_filename.mp4",
      });
    }

    try {
      const response = await axios.put(
        "https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo",
        uploadData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.status === 200) {
        Alert.alert("Success", "Media uploaded successfully!");
      } else {
        console.error("Failed to upload media:", response);
        Alert.alert("Error", "Failed to upload media to the server.");
      }
    } catch (error) {
      console.error("Upload Error:", error);
      Alert.alert("Error", "There was an error uploading the media.");
    } finally {
      setIsLoading(false);
    }
  };

  // Menu item pressed
  const handleMenuItemPress = (item) => {
    setMenuVisible(false);
    switch (item) {
      case 'Edit Profile':
        navigation.navigate('EditProfile');
        break;
      case 'Settings':
        navigation.navigate('SettingsScreen');
        break;
      case 'Manage Membership':
        navigation.navigate('MembershipScreen');
        break;
      case 'Hide Profile':
        // handle hide
        break;
      case 'Delete Account':
        // handle delete
        break;
      case 'Logout':
        // handle logout
        break;
      default:
        break;
    }
  };

  // If user data is loaded, pull needed fields
  const {
    user_first_name = '',
    user_last_name = '',
    user_email_id = '',
    user_profile_bio = '',
    user_gender = '',
    user_age = '',
    user_kids = '',
    user_height = '',
    user_sexuality = '',
    user_open_to = '',
    user_general_interests = '',
    user_date_interests = '',
    user_suburb = '',
    user_nationality = '',
    user_religion = '',
    user_body_composition = '',
    user_education = '',
    user_job = '',
    user_drinking = '',
    user_smoking = '',
    user_star_sign = '',
  } = userData;

  // Convert open_to string or parse JSON if needed
  let openToList = [];
  if (typeof user_open_to === 'string') {
    openToList = user_open_to.includes(',') ? user_open_to.split(',') : [user_open_to];
  }

  // Convert user_general_interests, user_date_interests likewise if needed

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color="gray" />
            </TouchableOpacity>

            {/* Menu button */}
            <TouchableOpacity style={styles.iconButton} onPress={toggleMenu}>
              <Ionicons name="ellipsis-vertical" size={24} color="gray" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Popup Menu */}
        {menuVisible && (
          <View style={styles.menuContainer}>
            <TouchableOpacity onPress={() => handleMenuItemPress('Edit Profile')}>
              <Text style={styles.menuItem}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenuItemPress('Settings')}>
              <Text style={styles.menuItem}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenuItemPress('Manage Membership')}>
              <Text style={styles.menuItem}>Manage Membership</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenuItemPress('Hide Profile')}>
              <Text style={styles.menuItem}>Hide Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenuItemPress('Delete Account')}>
              <Text style={styles.menuItem}>Delete Account</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenuItemPress('Logout')}>
              <Text style={styles.menuItem}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Top media section */}
        <View style={styles.mediaContainer}>
        {videoUri ? (
            <View style={styles.videoWrapper}>
              <Video
                ref={videoRef}
                source={{ uri: videoUri }}
                style={styles.video}
                resizeMode="cover"
                // Let the video have built-in controls:
  useNativeControls

  // Attempt to auto-play
  shouldPlay={false}
                onPlaybackStatusUpdate={(status) => {
                  if (!status.isLoaded) return;
                  setIsVideoPlaying(status.isPlaying);
                }}
                // Print errors to console
  onError={(err) => console.log("VIDEO ERROR:", err)}
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
                          <Text style={styles.uploadVideoText}>Upload Video File</Text>
                        </TouchableOpacity>
                      )}
        </View>

        {/* Photos Section (3 boxes) */}
        <View style={styles.photoBoxesRow}>
          {photos.map((photoUri, idx) => (
            <View key={idx} style={styles.photoBox}>
              {photoUri ? (
                <>
                  <Image source={{ uri: photoUri }} style={styles.photoImage} />
                  {/* "X" in top-right */}
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
                <Pressable
                  style={styles.emptyPhotoBox}
                  onPress={() => handlePickImage(idx)}
                >
                  <Ionicons name="add" size={24} color="red" />
                </Pressable>
              )}
            </View>
          ))}
        </View>

        {/* Dots / page indicator (if you want) */}
        <View style={styles.pageIndicator}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Name / Email */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user_first_name} {user_last_name}
          </Text>
          <Text style={styles.userEmail}>{user_email_id}</Text>
        </View>

        {/* Profile completion card */}
        {!isProfileComplete && (
          <View style={styles.completionCard}>
            <Text style={styles.completionText}>
              Profile: {profileCompletion}% complete
            </Text>
            <ProgressBar startProgress={0} endProgress={profileCompletion} />

            {profileSteps.map((step, index) => (
              <Pressable key={index} onPress={() => handlePressLink(index, step.route)}>
                <Text style={styles.completionLink}>
                  {step.title} ({step.count})
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Bio */}
        {user_profile_bio ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.bioText}>{user_profile_bio}</Text>
          </View>
        ) : null}

        {/* Interests / Date interests */}
        {user_general_interests || user_date_interests ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>My interests</Text>
            <View style={styles.interestsRow}>
              {/* If user_general_interests is comma-separated or array */}
              {(user_general_interests.split?.(',') || []).map((interest, i) => (
                <View key={i} style={styles.interestChip}>
                  <Text style={styles.interestChipText}>{interest.trim()}</Text>
                </View>
              ))}
              {/* user_date_interests similarly */}
              {/* {(user_date_interests.split?.(',') || []).map((dateInt, i) => (
                <View key={'date'+i} style={styles.interestChip}>
                  <Text style={styles.interestChipText}>{dateInt.trim()}</Text>
                </View>
              ))} */}
            </View>
          </View>
        ) : null}

        {/* "Kinds of dates I enjoy" / "My available times" you can add them likewise.  */}

        {/* "A little bit about me" Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>A little bit about me</Text>

          {/* Examples, adapt as you see fit */}
          {user_age ? (
            <View style={styles.aboutItem}>
              <Ionicons name="calendar-outline" size={18} color="#999" />
              <Text style={styles.aboutItemText}> {`Born in ${2023 - user_age} (Age: ${user_age})`}</Text>
            </View>
          ) : null}

          {user_height ? (
            <View style={styles.aboutItem}>
              <Ionicons name="man-outline" size={18} color="#999" />
              <Text style={styles.aboutItemText}> {user_height}</Text>
            </View>
          ) : null}

          {user_kids ? (
            <View style={styles.aboutItem}>
              <Ionicons name="people-outline" size={18} color="#999" />
              <Text style={styles.aboutItemText}> {user_kids} children</Text>
            </View>
          ) : null}

          {user_gender ? (
            <View style={styles.aboutItem}>
              <Ionicons name="male-female-outline" size={18} color="#999" />
              <Text style={styles.aboutItemText}> Identifies as {user_gender}</Text>
            </View>
          ) : null}

          {user_sexuality ? (
            <View style={styles.aboutItem}>
              <Ionicons name="heart-outline" size={18} color="#999" />
              <Text style={styles.aboutItemText}> {user_sexuality}</Text>
            </View>
          ) : null}

          {/* You can add more lines for nationality, body_composition, job, education, religion, star_sign, etc. */}
        </View>

        {/* Find My Match Button */}
        <TouchableOpacity
          style={styles.findMatchButton}
          onPress={() => navigation.navigate('Preferences')} 
        >
          <Text style={styles.findMatchButtonText}>Find my match!</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Nav */}
      <BottomNav />
    </SafeAreaView>
  );
}

// ----------------- STYLES -----------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    justifyContent: "flex-start",
    alignItems: "stretch",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  bottomNavContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navButton: {},
  headerContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 18,
  },
  menuContainer: {
    position: 'absolute',
    top: 60, // approximate offset from top
    right: 10,
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 5,
    zIndex: 999,
  },
  menuItem: {
    fontSize: 16,
    paddingVertical: 8,
    color: '#000',
  },
  mediaContainer: {
    marginBottom: 20,
  },
  // 326:428 => aspectRatio ~ 0.76
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

  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: 'red',
  },
  userInfo: {
    alignItems: 'center',
    marginVertical: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userEmail: {
    color: 'gray',
    fontSize: 14,
    marginTop: 4,
  },
  completionCard: {
    backgroundColor: '#F9F9F9',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    elevation: 1,
    marginTop: 15,
    marginBottom: 10,
  },
  completionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  completionLink: {
    color: 'red',
    fontSize: 14,
    marginVertical: 3,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  bioText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
    marginBottom: 10,
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestChip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  interestChipText: {
    fontSize: 14,
    color: '#000',
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  aboutItemText: {
    marginLeft: 5,
    fontSize: 14,
  },
  findMatchButton: {
    backgroundColor: '#E4423F',
    marginTop: 30,
    marginHorizontal: 20,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  findMatchButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

