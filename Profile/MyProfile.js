import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Platform, StatusBar, TouchableOpacity, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Video } from "expo-av";
import { useFocusEffect } from "@react-navigation/native";
import ProgressBar from "../src/Assets/Components/ProgressBar";
import { getProfileSteps, getProfileCompletion } from "./profileStepsState";
import { REACT_APP_GOOGLE_API_KEY } from "@env";

const GOOGLE_API_KEY = REACT_APP_GOOGLE_API_KEY;
console.log("In My Profile:", GOOGLE_API_KEY);

// Example placeholders for bottom navigation icons
const BottomNav = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.bottomNavContainer}>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Preferences")}>
        <Image source={require("../assets/icons/search.png")} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("MatchResultsPage")}>
        <Image source={require("../assets/icons/twohearts.png")} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Chat")}>
        <Image source={require("../assets/icons/chat.png")} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("MyProfile")}>
        <Image source={require("../assets/icons/profile.png")} />
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
  const [photos, setPhotos] = useState([null, null, null]); // array of photo URIs
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

  // Add state for favorite photo
  const [favoritePhotoIndex, setFavoritePhotoIndex] = useState(null);

  // Add effect to set favorite photo from user data
  useEffect(() => {
    if (userData.user_favorite_photo) {
      const index = photos.findIndex((photo) => photo === userData.user_favorite_photo);
      setFavoritePhotoIndex(index >= 0 ? index : null);
    }
  }, [userData, photos]);

  // Fetch user data on mount/focus
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const uid = await AsyncStorage.getItem("user_uid");
        if (!uid) {
          console.log("No user_uid in AsyncStorage");
          return;
        }
        // GET user info
        const response = await axios.get(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${uid}`);
        const fetched = response.data.result[0];
        console.log("Fetched user info:", fetched);

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
          if (typeof rawVideoUrl === "string" && rawVideoUrl.startsWith('"') && rawVideoUrl.endsWith('"')) {
            rawVideoUrl = rawVideoUrl.slice(1, -1);
          }

          console.log("Cleaned video url:", rawVideoUrl);
          setVideoUri(rawVideoUrl);
        }

        // Adjust profile steps based on available user data
        const hasDateInterests = !!fetched?.user_date_interests;
        const hasAvailableTime = !!fetched?.user_available_time;

        // Get profile steps and modify them based on available data
        const steps = getProfileSteps();

        if (hasDateInterests && hasAvailableTime) {
          // Remove date preferences step entirely if both are complete
          const filteredSteps = steps.filter((step) => step.title !== "your date preferences");
          setProfileSteps(filteredSteps);
        } else {
          // Update date preferences step count based on available data
          const updatedSteps = steps.map((step) => {
            if (step.title === "your date preferences") {
              if (hasDateInterests) {
                // Only need DateAvailability
                return { ...step, count: 1 };
              } else if (hasAvailableTime) {
                // Only need TypeOfDate
                return { ...step, count: 1 };
              } else {
                // Reset to 2 if both are missing
                return { ...step, count: 2 };
              }
            }
            return step;
          });
          setProfileSteps(updatedSteps);
        }
        setProfileCompletion(getProfileCompletion());
      } catch (error) {
        console.log("Error fetching user info:", error);
      }
    };

    if (isFocused) {
      fetchUserInfo();
    }
  }, [isFocused]);

  const isProfileComplete = profileSteps.length === 0;

  // Toggle video play/pause
  const handlePlayPause = async () => {
    if (!videoRef.current) return;

    try {
      // Get the current playback status
      const status = await videoRef.current.getStatusAsync();

      // If video is at the end or paused, reset and play from beginning
      if (status.didJustFinish || status.positionMillis >= status.durationMillis - 100 || !isVideoPlaying) {
        await videoRef.current.setPositionAsync(0);
        await videoRef.current.playAsync();
        setIsVideoPlaying(true);
      } else {
        // If video is currently playing, pause it
        await videoRef.current.pauseAsync();
        setIsVideoPlaying(false);
      }
    } catch (error) {
      console.log("Error handling video play/pause:", error);
    }
  };

  // Press a link in the profile steps card
  const handlePressLink = (index) => {
    const step = profileSteps[index];

    if (step.title === "your date preferences") {
      // Check user data to determine appropriate navigation
      const hasDateInterests = !!userData?.user_date_interests;
      const hasAvailableTime = !!userData?.user_available_time;

      if (hasDateInterests) {
        // If date interests already filled, navigate to DateAvailability
        navigation.navigate("DateAvailability", { stepIndex: index });
      } else if (hasAvailableTime) {
        // If available time already filled, navigate to TypeOfDate
        navigation.navigate("TypeOfDate", { stepIndex: index });
      } else {
        // Default behavior if neither is filled
        if (step.count === 2) {
          navigation.navigate("DateAvailability", { stepIndex: index });
        } else if (step.count === 1) {
          navigation.navigate("TypeOfDate", { stepIndex: index });
        }
      }
    } else if (step.title === "a few more details about you") {
      // 8 sub-pages
      switch (step.count) {
        case 8:
          navigation.navigate("AdditionalDetailsOne", { stepIndex: index });
          break;
        case 7:
          navigation.navigate("AdditionalDetailsTwo", { stepIndex: index });
          break;
        case 6:
          navigation.navigate("AdditionalDetailsThree", { stepIndex: index });
          break;
        case 5:
          navigation.navigate("AdditionalDetailsFour", { stepIndex: index });
          break;
        case 4:
          navigation.navigate("AdditionalDetailsFive", { stepIndex: index });
          break;
        case 3:
          navigation.navigate("AdditionalDetailsSix", { stepIndex: index });
          break;
        case 2:
          navigation.navigate("AdditionalDetailsSeven", { stepIndex: index });
          break;
        case 1:
          navigation.navigate("AdditionalDetailsEight", { stepIndex: index });
          break;
        default:
          // If count is 0 or some unexpected value, do nothing or handle error
          break;
      }
    } else if (step.title === "profile bio") {
      // 1 sub-page
      if (step.count === 1) {
        navigation.navigate("ProfileBio", { stepIndex: index });
      }
    } else if (step.title === "verify your account") {
      // 2 sub-pages
      if (step.count === 2) {
        navigation.navigate("VerifyPhoneNumber1", { stepIndex: index });
      } else if (step.count === 1) {
        navigation.navigate("AddDriversLicense", { stepIndex: index });
      }
    } else {
      // Fallback or other steps
      // e.g. navigation.navigate(step.route, { stepIndex: index });
    }
  };

  // Show/hide the popup menu
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };
  // Menu item pressed
  const handleMenuItemPress = (item) => {
    setMenuVisible(false);
    switch (item) {
      case "Edit Profile":
        navigation.navigate("EditProfile");
        break;
      case "Settings":
        navigation.navigate("SettingsScreen");
        break;
      case "Manage Membership":
        navigation.navigate("MembershipScreen");
        break;
      case "Hide Profile":
        // handle hide
        break;
      case "Delete Account":
        // handle delete
        break;
      case "Logout":
        logoutUser();
        break;
      default:
        break;
    }
  };

  // Helper to clear AsyncStorage completely
  const logoutUser = async () => {
    try {
      // This removes EVERYTHING stored by AsyncStorage
      await AsyncStorage.clear();

      // Redirect to your welcome or login screen
      navigation.navigate("Login");
    } catch (error) {
      console.error("Error clearing AsyncStorage:", error);
    }
  };

  // If user data is loaded, pull needed fields
  const {
    user_first_name = "",
    user_last_name = "",
    user_email_id = "",
    user_profile_bio = "",
    user_gender = "",
    user_identity = "",
    user_age = "",
    user_birthdate = "",
    user_kids = "",
    user_height = "",
    // user_sexuality = "",
    user_open_to = "",
    user_address = "",
    user_general_interests = "",
    user_date_interests = "",
    user_available_time = "",
    user_suburb = "",
    user_nationality = "",
    user_religion = "",
    user_body_composition = "",
    user_education = "",
    user_job = "",
    user_drinking = "",
    user_smoking = "",
    user_star_sign = "",
  } = userData;

  // Convert open_to string or parse JSON if needed
  let openToList = [];
  if (typeof user_open_to === "string" && user_open_to) {
    try {
      openToList = JSON.parse(user_open_to);
    } catch (error) {
      console.error("Error parsing user_open_to:", error);
      openToList = user_open_to.includes(",") ? user_open_to.split(",") : [user_open_to];
    }
  }

  // Helper function to format the list
  const formatOpenTo = (openToString) => {
    try {
      const openToList = JSON.parse(openToString);
      if (openToList.length === 1) return openToList[0];
      return openToList.slice(0, -1).join(", ") + " and " + openToList.slice(-1);
    } catch (error) {
      console.error("Error parsing open_to:", error);
      return openToString; // Fallback to the original string if parsing fails
    }
  };

  const parseDate = (dateString) => {
    if (!dateString) return null;
    const [day, month, year] = dateString.split("/");
    return new Date(year, month - 1, day);
  };

  const formatDate = (dateString) => {
    const date = parseDate(dateString);
    if (!date || isNaN(date.getTime())) {
      return "Invalid Date";
    }
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const currentYear = new Date().getFullYear();

  const birthYear = user_birthdate ? parseDate(user_birthdate)?.getFullYear() : "Unknown";

  // Interests / Date interests
  const parseInterests = (interestsString) => {
    if (!interestsString) return [];
    try {
      return JSON.parse(interestsString);
    } catch (error) {
      console.error("Error parsing interests:", error);
      return interestsString.split(",").map((interest) => interest.trim());
    }
  };

  const generalInterests = parseInterests(user_general_interests);
  const dateInterests = parseInterests(user_date_interests);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name='notifications-outline' size={24} color='gray' />
            </TouchableOpacity>

            {/* Menu button */}
            <TouchableOpacity style={styles.iconButton} onPress={toggleMenu}>
              <Ionicons name='ellipsis-vertical' size={24} color='gray' />
            </TouchableOpacity>
          </View>
        </View>

        {/* Popup Menu */}
        {menuVisible && (
          <View style={styles.menuContainer}>
            <TouchableOpacity onPress={() => handleMenuItemPress("Edit Profile")}>
              <Text style={styles.menuItem}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenuItemPress("Settings")}>
              <Text style={styles.menuItem}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenuItemPress("Manage Membership")}>
              <Text style={styles.menuItem}>Manage Membership</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenuItemPress("Hide Profile")}>
              <Text style={styles.menuItem}>Hide Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenuItemPress("Delete Account")}>
              <Text style={styles.menuItem}>Delete Account</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenuItemPress("Logout")}>
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
                resizeMode='cover'
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
                  <Ionicons name='play' size={48} color='#FFF' />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.uploadVideoButton} 
              onPress={() => navigation.navigate("EditProfile")}
            >
              <Ionicons name='cloud-upload-outline' size={20} color='#E4423F' />
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
                  {favoritePhotoIndex === idx && (
                    <View style={styles.heartIconBottomRight}>
                      <View style={styles.heartIconBackground}>
                        <Ionicons name='heart' size={20} color='#E4423F' />
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <Pressable style={styles.emptyPhotoBox}>
                  <Ionicons name='add' size={24} color='red' />
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
            <Text style={styles.completionText}>Profile: {profileCompletion}% complete</Text>
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
        {user_general_interests ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>My interests</Text>
            <View style={styles.interestsRow}>
              {generalInterests.map((interest, i) => (
                <View key={i} style={styles.interestChip}>
                  <Text style={styles.interestChipText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* "Kinds of dates I enjoy" / "My available times" you can add them likewise.  */}
        {user_date_interests ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>My Date interests</Text>
            <View style={styles.interestsRow}>
              {dateInterests.map((dateInt, i) => (
                <View key={"date" + i} style={styles.interestChip}>
                  <Text style={styles.interestChipText}>{dateInt}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        {/* Available times */}
        {user_available_time ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>My available times</Text>
            <View style={styles.aboutItemText}>
              {JSON.parse(user_available_time).map((time, index) => {
                const days = time.day.split(", ");
                // Format day ranges as "Mon-Fri" or "Sat & Sun"
                const dayRange = days.length > 1 ? (days.length === 2 ? days.join(" & ") : `${days[0]}-${days[days.length - 1]}`) : days[0];

                // Check for all-day availability
                const isAllDay = time.start_time === "12:00 AM" && time.end_time === "11:59 PM";

                // Format time as "5:30 pm" without leading zeros
                const formatTime = (t) => {
                  const [timePart, modifier] = t.split(" ");
                  let [hours, minutes] = timePart.split(":");
                  hours = parseInt(hours);
                  const displayHours = hours % 12 || 12; // Convert to 12-hour format
                  const ampm = modifier.toLowerCase();
                  return `${displayHours}${minutes !== "00" ? `:${minutes}` : ""} ${ampm}`;
                };

                return (
                  <Text key={index} style={styles.aboutItem}>
                    {isAllDay ? `${dayRange}, all day` : `${dayRange}, ${formatTime(time.start_time)} to ${formatTime(time.end_time)}`}
                  </Text>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* "A little bit about me" Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>A little bit about me</Text>

          <View style={styles.aboutItem}>
            <Image source={require("../assets/icons/dob.png")} style={{ width: 14, height: 16 }} />
            <Text style={[styles.aboutItemText, !user_age && { color: "gray" }]}>
              {user_age ? `Born on ${formatDate(user_birthdate)} (Age: ${user_age})` : "Not Provided"}
            </Text>
          </View>

          <View style={styles.aboutItem}>
            <Image source={require("../assets/icons/height.png")} style={{ width: 14, height: 16 }} />
            <Text style={[styles.aboutItemText, !user_height && { color: "gray" }]}>
              {user_height || "Not Provided"}
            </Text>
          </View>

          <View style={styles.aboutItem}>
            <Image source={require("../assets/icons/kids.png")} style={{ width: 14, height: 16 }} />
            <Text style={[styles.aboutItemText, !user_kids && { color: "gray" }]}>
              {user_kids ? `${user_kids} children` : "Not Provided"}
            </Text>
          </View>

          <View style={styles.aboutItem}>
            <Image source={require("../assets/icons/gender.png")} style={{ width: 14, height: 16 }} />
            <Text style={[styles.aboutItemText, !user_gender && { color: "gray" }]}>
              {user_gender ? `Sex assigned at birth was ${user_gender}` : "Not Provided"}
            </Text>
          </View>

          <View style={styles.aboutItem}>
            <Image source={require("../assets/icons/user_identity.png")} style={{ width: 14, height: 16 }} />
            <Text style={[styles.aboutItemText, !user_identity && { color: "gray" }]}>
              {user_identity ? `Identifies as ${user_identity}` : "Not Provided"}
            </Text>
          </View>

          {/* {user_sexuality ? (
            <View style={styles.aboutItem}>
              <Image source={require("../assets/icons/sexuality.png")} style={{ width: 14, height: 16 }} />
              <Text style={styles.aboutItemText}>{user_sexuality}</Text>
            </View>
          ) : null} */}

          <View style={styles.aboutItem}>
            <Image source={require("../assets/icons/opento.png")} style={{ width: 14, height: 16 }} />
            {user_open_to ? (
              <View style={styles.aboutItemText}>
                <Text style={styles.openToLabel}>Open to:</Text>
                {openToList.map((item, index) => (
                  <Text key={index} style={styles.openToItem}>
                    • {item}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={[styles.aboutItemText, { color: "gray" }]}>Not Provided</Text>
            )}
          </View>

          <View style={styles.aboutItem}>
            <Image source={require("../assets/icons/location.png")} style={{ width: 14, height: 16 }} />
            <Text style={[styles.aboutItemText, !user_address && { color: "gray" }]}>
              {user_address || "Not Provided"}
            </Text>
          </View>

          {/* Add more fields as needed */}
          <View style={styles.aboutItem}>
            <Image source={require("../assets/icons/flag.png")} style={{ width: 14, height: 16 }} />
            <Text style={[styles.aboutItemText, !user_nationality && { color: "gray" }]}>{user_nationality || "Not Provided"}</Text>
          </View>

          <View style={styles.aboutItem}>
            <Image source={require("../assets/icons/ethnicity.png")} style={{ width: 14, height: 16 }} />
            <Text style={[styles.aboutItemText, { color: "gray" }]}>Not Provided</Text>
          </View>
          <View style={styles.aboutItem}>
            <Image source={require("../assets/icons/bodytype.png")} style={{ width: 14, height: 16 }} />
            <Text style={[styles.aboutItemText, !user_body_composition && { color: "gray" }]}>{user_body_composition || "Not Provided"}</Text>
          </View>
          <View style={styles.aboutItem}>
            <Image source={require("../assets/icons/education.png")} style={{ width: 14, height: 16 }} />
            <Text style={[styles.aboutItemText, !user_education && { color: "gray" }]}>{user_education || "Not Provided"}</Text>
          </View>
          <View style={styles.aboutItem}>
            <Image source={require("../assets/icons/job.png")} style={{ width: 14, height: 16 }} />
            <Text style={[styles.aboutItemText, !user_job && { color: "gray" }]}>{user_job || "Not Provided"}</Text>
          </View>
          <View style={styles.aboutItem}>
            <Image source={require("../assets/icons/smoke.png")} style={{ width: 14, height: 16 }} />
            <Text style={[styles.aboutItemText, !user_smoking && { color: "gray" }]}>{user_smoking || "Not Provided"}</Text>
          </View>
          <View style={styles.aboutItem}>
            <Image source={require("../assets/icons/drink.png")} style={{ width: 14, height: 16 }} />
            <Text style={[styles.aboutItemText, !user_drinking && { color: "gray" }]}>{user_drinking || "Not Provided"}</Text>
          </View>
          <View style={styles.aboutItem}>
            <Image source={require("../assets/icons/religion.png")} style={{ width: 14, height: 16 }} />
            <Text style={[styles.aboutItemText, !user_religion && { color: "gray" }]}>{user_religion || "Not Provided"}</Text>
          </View>
          <View style={styles.aboutItem}>
            <Image source={require("../assets/icons/star.png")} style={{ width: 14, height: 16 }} />
            <Text style={[styles.aboutItemText, !user_star_sign && { color: "gray" }]}>{user_star_sign || "Not Provided"}</Text>
          </View>
        </View>

        {/* Find My Match Button */}
        <TouchableOpacity style={styles.findMatchButton} onPress={() => navigation.navigate("Preferences")}>
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
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundColor: "#FFF",
    borderTopWidth: 2,
    borderTopColor: "#EEE",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navButton: {},
  headerContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
  },
  headerIcons: {
    flexDirection: "row",
  },
  iconButton: {
    marginLeft: 18,
  },
  menuContainer: {
    position: "absolute",
    top: 60, // approximate offset from top
    right: 10,
    backgroundColor: "#FFF",
    padding: 10,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 5,
    zIndex: 999,
  },
  menuItem: {
    fontSize: 16,
    paddingVertical: 8,
    color: "#000",
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
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "red",
  },
  userInfo: {
    alignItems: "center",
    marginVertical: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
  },
  userEmail: {
    color: "gray",
    fontSize: 14,
    marginTop: 4,
  },
  completionCard: {
    backgroundColor: "#F9F9F9",
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    elevation: 1,
    marginTop: 15,
    marginBottom: 10,
  },
  completionText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  completionLink: {
    color: "red",
    fontSize: 14,
    marginVertical: 3,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 10,
    color: "gray",
  },
  bioText: {
    fontSize: 14,
    color: "#000",
    lineHeight: 20,
    marginBottom: 10,
  },
  interestsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  interestChip: {
    borderWidth: 1,
    borderColor: "#1A1A1A",
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  interestChipText: {
    fontSize: 16,
    color: "#000",
  },
  aboutItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 5,
  },
  aboutItemText: {
    marginLeft: 15,
    fontSize: 16,
    flex: 1,
  },
  findMatchButton: {
    backgroundColor: "#E4423F",
    marginTop: 30,
    marginHorizontal: 20,
    height: 60,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  findMatchButtonText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  openToLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  openToItem: {
    fontSize: 16,
    marginLeft: 10,
    marginVertical: 2,
  },
  heartIconBottomRight: {
    position: "absolute",
    bottom: 5,
    right: 5,
    zIndex: 1,
  },
  heartIconBackground: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 15,
    padding: 5,
  },
  timeSlot: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 5,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
    color: "#333",
  },
});
