import React, { useRef, useState, useEffect } from "react";
import { StyleSheet, TouchableOpacity, View, Image, Text, Animated, PanResponder, Dimensions, ScrollView } from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";

import { fetchUserInfo } from "../Api.js";

const heightImg = require("../src/Assets/Images/height.png");
const genderImg = require("../src/Assets/Images/gender.png");
const redlikeEmpty = require("../src/Assets/Images/redlike.png");
const likeImg = require("../src/Assets/Images/like.png");
const BottomNav = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.bottomNavContainer}>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Preferences")}>
        <Image source={require("../assets/icons/searchdark.png")} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("MatchResultsPage")}>
        <Image source={require("../assets/icons/twoheartsdark.png")} />
      </TouchableOpacity>
      <View style={[styles.navButton, { pointerEvents: "none" }]}>
        <Image source={require("../assets/icons/chatdark.png")} style={{ opacity: 0.5 }} />
      </View>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("MyProfile")}>
        <Image source={require("../assets/icons/profileoutlinedark.png")} />
      </TouchableOpacity>
    </View>
  );
};

export default function UserProfile() {
  const screenHeight = Dimensions.get("window").height;
  const sheetOpenY = screenHeight * 0.15; // how far from top when "open"
  const sheetClosedY = screenHeight * 0.73; // Adjusted to show name, rating, and buttons
  const navigation = useNavigation();
  const route = useRoute();
  const matchedUserId = route.params?.meet_date_user_id;

  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [arrlength, setArrlength] = useState(0);
  const [arrposition, setArrposition] = useState(0);
  const [userUid, setUserUid] = useState(null);
  const [likeStatus, setLikeStatus] = useState({
    isLikedByMe: false,
    isLikedByOther: false,
  });

  // For video slider (optional)
  const [videoPosition, setVideoPosition] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  // Animated value controlling bottom sheet's vertical position
  const sheetAnim = useRef(new Animated.Value(sheetClosedY)).current;

  // Track the starting position of the sheet for smooth dragging
  const startPositionRef = useRef(sheetClosedY);

  // PanResponder to handle dragging of bottom sheet
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Start capturing if we have a significant vertical move
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        // Save the current position when the user starts dragging
        startPositionRef.current = sheetAnim._value;
        // Stop any ongoing animations
        sheetAnim.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        // Calculate new position based on the starting position and the drag distance
        const newPosition = Math.max(
          sheetOpenY, // Don't allow dragging above the open position
          Math.min(
            startPositionRef.current + gestureState.dy,
            screenHeight - 100 // Don't allow dragging below the screen
          )
        );
        // Update the animated value
        sheetAnim.setValue(newPosition);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Get the current position and velocity
        const currentPosition = sheetAnim._value;
        const velocity = gestureState.vy;

        // Determine target position based on current position, velocity, and thresholds
        let targetPosition;

        // If velocity is significant, use it to determine direction
        if (Math.abs(velocity) > 0.5) {
          targetPosition = velocity > 0 ? sheetClosedY : sheetOpenY;
        }
        // Otherwise use position thresholds
        else {
          const threshold = (sheetOpenY + sheetClosedY) / 2;
          targetPosition = currentPosition < threshold ? sheetOpenY : sheetClosedY;
        }

        // Animate to the target position with spring physics
        Animated.spring(sheetAnim, {
          toValue: targetPosition,
          velocity: velocity * 0.1, // Use the gesture velocity for natural feel
          tension: 50,
          friction: 10,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  const [isLiked, setIsLiked] = useState(false);

  // Add a function to toggle the bottom sheet
  const toggleBottomSheet = () => {
    // Determine if we're closer to open or closed position
    const isCurrentlyMoreOpen = sheetAnim._value < (sheetOpenY + sheetClosedY) / 2;

    // Animate to the opposite position
    Animated.spring(sheetAnim, {
      toValue: isCurrentlyMoreOpen ? sheetClosedY : sheetOpenY,
      tension: 50,
      friction: 10,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    // On mount, we want the sheet at the position shown in the image
    sheetAnim.setValue(sheetClosedY);
  }, []);

  useEffect(() => {
    console.log("likeStatus changed:", likeStatus);
    // Use direct boolean value instead of conditional
    setIsLiked(Boolean(likeStatus.isLikedByMe));
  }, [likeStatus]);

  // Video logic
  const handlePlaybackStatusUpdate = (statusUpdate) => {
    setStatus(statusUpdate);
    if (statusUpdate.isLoaded) {
      setVideoPosition(statusUpdate.positionMillis);
      setVideoDuration(statusUpdate.durationMillis);
    }
  };

  const handleSeek = (value) => {
    if (videoRef.current) {
      videoRef.current.setPositionAsync(value);
    }
    if (value >= videoDuration) {
      videoRef.current.stopAsync();
    }
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const handleLeftArrowPress = () => {
    if (arrposition > 0) {
      const newPos = arrposition - 1;
      setArrposition(newPos);
      fetchData(newPos);
    } else {
      setArrposition(arrlength - 1);
      fetchData(arrlength - 1);
    }
  };

  const handleRightArrowPress = () => {
    if (arrposition < arrlength - 1) {
      const newPos = arrposition + 1;
      setArrposition(newPos);
      fetchData(newPos);
    } else {
      setArrposition(0);
      fetchData(0);
    }
  };
  const handleLikePress = async () => {
    const updatedIsLiked = !isLiked;
    console.log("updatedIsLiked:", updatedIsLiked);
    console.log("userInfo.Liked:", userInfo?.Likes);

    const likedUserUid = userInfo.user_uid;
    const formData = new URLSearchParams();
    formData.append("liker_user_id", userUid);
    formData.append("liked_user_id", likedUserUid);

    try {
      if (updatedIsLiked) {
        await axios.post("https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/likes", formData.toString(), {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 15000, // Increase timeout to 15 seconds
        });

        // Update like status after successful API call
        setLikeStatus((prev) => ({ ...prev, isLikedByMe: true }));
        setIsLiked(true);
      } else {
        await axios.delete("https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/likes", {
          data: formData.toString(),
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 15000, // Increase timeout to 15 seconds
        });

        // Update like status after successful API call
        setLikeStatus((prev) => ({ ...prev, isLikedByMe: false }));
        setIsLiked(false);
      }

      // Check if both users have liked each other
      if (updatedIsLiked && userInfo["Liked by"] === "YES") {
        try {
          // Store the matched user's UserUid
          await AsyncStorage.setItem("meet_date_user_id", likedUserUid);
          console.log("meet_date_user_id stored:", likedUserUid);
          // Navigate to MatchPageNew
          navigation.navigate("MatchPageNew", { meet_date_user_id: likedUserUid });
        } catch (error) {
          console.error("Failed to store meet_date_user_id:", error);
        }
      }
    } catch (error) {
      console.error("Error handling like action", error.message);
      console.error("Error details:", error.response ? error.response.data : "No response data");
      // Revert UI state if API call fails
      setIsLiked(!updatedIsLiked);
      setLikeStatus((prev) => ({ ...prev, isLikedByMe: !updatedIsLiked }));
    }
  };

  const handleClosePress = () => {
    // Example: skip to next profile on "X"
    handleRightArrowPress();
  };

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Radius of the Earth in miles
    const earthRadius = 3958.8;

    // Convert latitude and longitude from degrees to radians
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    // Haversine formula
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;

    return distance;
  };

  // Get the like status between current user and matched user
  const getLikeStatus = async (currentUserUid, matchedUserUid) => {
    try {
      console.log(`=== USERPROFILE DEBUG: Getting like status for current user ${currentUserUid} and matched user ${matchedUserUid} ===`);
      const likeStatusStartTime = Date.now();

      // Get likes data for current user using the correct endpoint format
      const apiUrl = `https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/likes/${currentUserUid}`;
      console.log(`USERPROFILE DEBUG: Calling API: ${apiUrl}`);
      const startTime = Date.now();
      const response = await axios.get(apiUrl, { timeout: 15000 }); // Increase timeout to 15 seconds
      const duration = Date.now() - startTime;

      const likeStatusDuration = Date.now() - likeStatusStartTime;
      // console.log(`USERPROFILE DEBUG: Received likes data in ${duration}ms`);

      // console.log("Likes response received:", JSON.stringify(response.data).substring(0, 300) + "...");

      // Check if response has the expected structure
      if (!response.data || response.data.code !== 200) {
        console.error("USERPROFILE DEBUG: Unexpected response from likes endpoint:", response.data);
        return { isLikedByMe: false, isLikedByOther: false };
      }

      // Deep logging of response structure to debug
      // console.log("Response structure:", Object.keys(response.data));
      // console.log("Result array type:", Array.isArray(response.data.result));
      if (response.data.result) {
        console.log("Result array length:", response.data.result.length);
      }

      // Extract data from the response - checking both top-level and nested structures
      let isLikedByMe = false;
      let isLikedByOther = false;

      // Check top-level arrays first
      if (Array.isArray(response.data.people_whom_you_selected)) {
        // console.log("Checking top-level people_whom_you_selected array");
        isLikedByMe = response.data.people_whom_you_selected.some((user) => user.user_uid === matchedUserUid);
      }

      if (Array.isArray(response.data.people_who_selected_you)) {
        // console.log("Checking top-level people_who_selected_you array");
        isLikedByOther = response.data.people_who_selected_you.some((user) => user.user_uid === matchedUserUid);
      }

      // If we couldn't find the info in top-level arrays, look in the result array
      if ((!isLikedByMe || !isLikedByOther) && Array.isArray(response.data.result)) {
        response.data.result.forEach((item, index) => {
          // console.log(`Checking result[${index}] keys:`, Object.keys(item));

          if (Array.isArray(item.people_whom_you_selected)) {
            // console.log(`Checking nested people_whom_you_selected at index ${index}`);
            if (item.people_whom_you_selected.some((user) => user.user_uid === matchedUserUid)) {
              isLikedByMe = true;
            }
          }

          if (Array.isArray(item.people_who_selected_you)) {
            // console.log(`Checking nested people_who_selected_you at index ${index}`);
            if (item.people_who_selected_you.some((user) => user.user_uid === matchedUserUid)) {
              isLikedByOther = true;
            }
          }
        });
      }

      // Check matched_results as well, which might contain mutual matches
      if (Array.isArray(response.data.matched_results)) {
        // console.log("Checking matched_results array");
        const isMutualMatch = response.data.matched_results.some((user) => user.user_uid === matchedUserUid);
        if (isMutualMatch) {
          isLikedByMe = true;
          isLikedByOther = true;
        }
      }

      // console.log("USERPROFILE DEBUG: Final like status:", { isLikedByMe, isLikedByOther });
      // console.log(`USERPROFILE DEBUG: Total getLikeStatus processing time: ${Date.now() - likeStatusStartTime}ms`);
      return { isLikedByMe, isLikedByOther };
    } catch (error) {
      console.error("USERPROFILE DEBUG: ⚠️ ERROR getting like status:", error);
      console.error("USERPROFILE DEBUG: Error details:", error.message);
      console.error("USERPROFILE DEBUG: Error code:", error.code);

      if (error.code === "ECONNABORTED") {
        console.error("USERPROFILE DEBUG: ⚠️ TIMEOUT ERROR in getLikeStatus");
      }

      if (error.response) {
        console.error("USERPROFILE DEBUG: Error response data:", error.response.data);
        console.error("USERPROFILE DEBUG: Error response status:", error.response.status);
      }

      return { isLikedByMe: false, isLikedByOther: false };
    }
  };

  // Get current user's location
  const getCurrentUserLocation = async (userUid) => {
    try {
      const userData = await fetchUserInfo(userUid);
      return {
        latitude: parseFloat(userData.user_latitude || 0),
        longitude: parseFloat(userData.user_longitude || 0),
      };
    } catch (error) {
      console.error("Error getting current user location:", error);
      return { latitude: 0, longitude: 0 };
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log("=== USERPROFILE DEBUG: Starting fetchData ===");
      const fetchDataStartTime = Date.now();

      if (!matchedUserId || !userUid) {
        setError("Missing user information");
        setLoading(false);
        return;
      }

      // 1. Get matched user information and like status in parallel
      console.log(`USERPROFILE DEBUG: Fetching matched user data and like status for ${matchedUserId}`);
      const startTime = Date.now();

      const [matchedUserData, likeStatusData] = await Promise.all([fetchUserInfo(matchedUserId), getLikeStatus(userUid, matchedUserId)]);

      const duration = Date.now() - startTime;
      console.log(`USERPROFILE DEBUG: Fetched all data in ${duration}ms`);

      if (!matchedUserData) {
        setError("Could not retrieve matched user data");
        setLoading(false);
        return;
      }

      // 2. Calculate distance between users
      let distance = 0;
      try {
        const currentUserData = await fetchUserInfo(userUid);
        if (currentUserData?.user_latitude && currentUserData?.user_longitude && matchedUserData?.user_latitude && matchedUserData?.user_longitude) {
          distance = calculateDistance(
            parseFloat(currentUserData.user_latitude),
            parseFloat(currentUserData.user_longitude),
            parseFloat(matchedUserData.user_latitude),
            parseFloat(matchedUserData.user_longitude)
          );
          console.log("Calculated distance:", distance);
        }
      } catch (error) {
        console.error("Error calculating distance:", error);
      }

      // 3. Combine all data
      const completeUserInfo = {
        ...matchedUserData,
        "Liked by": likeStatusData.isLikedByOther ? "YES" : "NO",
        Likes: likeStatusData.isLikedByMe ? "YES" : "NO",
        distance: distance,
      };

      // Force immediate update by using a functional update
      setUserInfo(() => completeUserInfo);
      setLikeStatus(likeStatusData);
      setIsLiked(likeStatusData.isLikedByMe);

      const totalFetchTime = Date.now() - fetchDataStartTime;
      // console.log(`USERPROFILE DEBUG: Total fetchData execution time: ${totalFetchTime}ms`);
      // console.log("=== USERPROFILE DEBUG: Completed fetchData ===");
    } catch (err) {
      console.error("USERPROFILE DEBUG: ⚠️ ERROR in fetchData:", err);
      console.error("USERPROFILE DEBUG: Error message:", err.message);
      if (err.code === "ECONNABORTED") {
        console.error("USERPROFILE DEBUG: ⚠️ TIMEOUT ERROR in fetchData");
      }
      setError(err.message || "An error occurred while fetching user information.");
    } finally {
      setLoading(false);
    }
  };

  const getUserUid = async () => {
    try {
      const uid = await AsyncStorage.getItem("user_uid");
      if (uid !== null) {
        setUserUid(uid);
      } else {
        setError("User UID not found.");
        setLoading(false);
      }
    } catch (err) {
      setError("Failed to retrieve user UID.");
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserUid();
  }, []);

  useEffect(() => {
    if (userUid && matchedUserId) {
      fetchData();
    }
  }, [userUid, matchedUserId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>Error: {error}</Text>
      </View>
    );
  }

  // Parse userInfo.user_video_url if it's stored as a JSON string
  let videoUrl = userInfo?.user_video_url;
  if (videoUrl) {
    // Check if the URL needs parsing (only try to parse if it looks like a JSON string)
    if (typeof videoUrl === "string" && (videoUrl.startsWith('"') || videoUrl.startsWith("["))) {
      try {
        // Some APIs return it with quotes or as a raw string. Adjust as needed:
        videoUrl = JSON.parse(videoUrl);
      } catch (e) {
        console.error("Invalid video URL format:", e);
        videoUrl = userInfo.user_video_url.replace(/^"|"$/g, "");
      }
    }
  }

  // Parse userInfo.user_general_interests
  let generalInterests = [];
  if (userInfo?.user_general_interests) {
    try {
      // Log the raw data
      // console.log("Raw user_general_interests:", userInfo.user_general_interests);

      // Attempt to parse as JSON
      if (typeof userInfo.user_general_interests === "string" && userInfo.user_general_interests.trim().startsWith("[")) {
        generalInterests = JSON.parse(userInfo.user_general_interests);
      } else {
        // Fallback: Split by commas if it's a plain string
        generalInterests = userInfo.user_general_interests.split(",").map((item) => item.trim());
      }
    } catch (e) {
      console.log("Failed to parse user_general_interests", e);

      // Fallback: Split by commas if it's a plain string
      generalInterests = userInfo.user_general_interests.split(",").map((item) => item.trim());
    }
  }

  // Parse userInfo.user_date_interests
  let dateInterests = [];
  if (userInfo?.user_date_interests) {
    try {
      // Log the raw data

      // Check if the data is a valid JSON string
      if (typeof userInfo.user_date_interests === "string" && userInfo.user_date_interests.trim().startsWith("[")) {
        // Attempt to parse as JSON
        dateInterests = JSON.parse(userInfo.user_date_interests);
      } else {
        // Fallback: Split by commas if it's a plain string
        dateInterests = userInfo.user_date_interests.split(",").map((item) => item.trim());
      }
    } catch (e) {
      console.log("Failed to parse user_date_interests", e);

      // Fallback: Split by commas if it's a plain string
      dateInterests = userInfo.user_date_interests.split(",").map((item) => item.trim());
    }
  }

  // Combine them into a single array for chips
  const allInterests = [...generalInterests, ...dateInterests];

  // Parse userInfo.user_open_to to show "open to ..."
  let openToArray = [];
  if (userInfo?.user_open_to) {
    try {
      openToArray = JSON.parse(userInfo.user_open_to);
    } catch (e) {
      console.log("Failed to parse user_open_to", e);
    }
  }

  return (
    <View style={styles.container}>
      {/* Top bar with "x of y" and settings icon */}
      <View style={styles.topBar}>
        {/* <View style={{ flex: 1 }}>
          <Text style={styles.topCounter}>
            {arrposition + 1} of {arrlength}
          </Text>
        </View> */}
        <TouchableOpacity>
          <Ionicons name='options' size={24} color='#999' />
        </TouchableOpacity>
      </View>

      {/* Background Video */}
      {isValidUrl(videoUrl) ? (
        <>
          <Video
            ref={videoRef}
            style={styles.backgroundVideo}
            source={{ uri: videoUrl }}
            shouldPlay={status.isPlaying || false}
            isLooping={false}
            resizeMode='cover'
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
          {/* Play/Pause Button */}
          <TouchableOpacity
            style={styles.playPauseButton}
            onPress={() => {
              if (status.isPlaying) {
                videoRef.current.pauseAsync();
              } else {
                videoRef.current.playAsync();
              }
            }}
          >
            <Text style={styles.playPauseText}>{status.isPlaying ? "❚❚" : "►"}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.noVideoContainer}>
          <Text style={styles.noVideoText}>No Video</Text>
        </View>
      )}

      {/* BOTTOM SHEET */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.bottomSheet,
          {
            top: sheetAnim,
          },
        ]}
      >
        {/* Action buttons in the middle of the sheet */}
        <View style={styles.matchActionsContainer}>
          <TouchableOpacity style={[styles.roundButton, { backgroundColor: "#fff" }]} onPress={handleClosePress}>
            <Ionicons name='close' size={24} color='red' />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.roundButton, { backgroundColor: isLiked ? "red" : "white" }]} onPress={handleLikePress}>
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "white" : "red"} />
          </TouchableOpacity>
        </View>

        {/* Name, Age and Rating at the bottom */}
        <View style={styles.nameContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>
              {userInfo?.user_first_name}, {userInfo?.user_age}
            </Text>
            {userInfo?.["Liked by"] === "YES" && <Ionicons name='heart' size={20} color='red' style={{ marginLeft: 6 }} />}
          </View>

          {/* 5-star rating + attendance rating */}
          <View style={styles.starRatingContainer}>
            {[...Array(5).keys()].map((i) => (
              <Ionicons key={i} name='star' size={18} color='#FFD700' />
            ))}
            <Text style={styles.attendanceText}> attendance rating</Text>
            <Text style={styles.attendanceText}> • UID: {userInfo?.user_uid}</Text>
          </View>
        </View>

        {/* Horizontal line */}
        <View style={styles.horizontalLine} />

        <ScrollView style={styles.bottomSheetScroll}>
          {/* Interests chips */}
          <View style={styles.chipsRow}>
            {allInterests.map((interest, idx) => (
              <View style={styles.chip} key={idx}>
                <Text style={styles.chipText}>{interest}</Text>
              </View>
            ))}
          </View>

          {/* User Photos */}
          {userInfo?.user_photo_url && (
            <View style={styles.photoContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                {(() => {
                  try {
                    const photoUrls = typeof userInfo.user_photo_url === "string" ? JSON.parse(userInfo.user_photo_url.replace(/\\"/g, '"')) : userInfo.user_photo_url || [];

                    // Reorder photos to put favorite first if it exists
                    let orderedPhotos = [...photoUrls];
                    if (userInfo.user_favorite_photo) {
                      const favoriteIndex = photoUrls.indexOf(userInfo.user_favorite_photo);
                      if (favoriteIndex !== -1) {
                        orderedPhotos = [userInfo.user_favorite_photo, ...photoUrls.slice(0, favoriteIndex), ...photoUrls.slice(favoriteIndex + 1)];
                      }
                    }

                    return orderedPhotos.map((photoUrl, index) =>
                      photoUrl ? (
                        <View key={index} style={{ position: "relative" }}>
                          <Image source={{ uri: photoUrl }} style={styles.userPhoto} resizeMode='cover' />
                          {photoUrl === userInfo.user_favorite_photo && (
                            <View style={styles.heartIconContainer}>
                              <Ionicons name='heart' size={16} color='#E4423F' />
                            </View>
                          )}
                        </View>
                      ) : null
                    );
                  } catch (e) {
                    console.error("Error parsing photo URLs:", e);
                    return null;
                  }
                })()}
              </ScrollView>
            </View>
          )}

          {/* Distances */}
          <View style={styles.detailRow}>
            <Ionicons name='location' size={16} color='#bbb' style={{ marginRight: 8 }} />
            <Text style={styles.detailText}>{typeof userInfo.distance === "number" ? `${userInfo.distance.toFixed(2)} miles away` : "Distance unavailable"}</Text>
          </View>

          {/* Height */}
          {userInfo?.user_height ? (
            <View style={styles.detailRow}>
              <Image source={heightImg} style={styles.detailIcon} />
              <Text style={styles.detailText}>{userInfo.user_height} cm tall</Text>
            </View>
          ) : null}

          {/* Kids */}
          <View style={styles.detailRow}>
            <Ionicons name='people' size={16} color='#bbb' style={{ marginRight: 8 }} />
            <Text style={styles.detailText}>{userInfo.user_kids !== null ? `${userInfo.user_kids} children` : "0 children"}</Text>
          </View>

          {/* Sex assigned at birth */}
          <View style={styles.detailRow}>
            <Image source={genderImg} style={styles.detailIcon} />
            <Text style={styles.detailText}>Sex assigned at birth: {userInfo?.user_gender || "Unknown"}</Text>
          </View>

          {/* Identity */}
          <View style={styles.detailRow}>
            <Ionicons name='wifi' size={16} color='#bbb' style={{ marginRight: 8 }} />
            <Text style={styles.detailText}>Identifies as {userInfo?.user_identity || "N/A"}</Text>
          </View>

          {/* Sexuality */}
          {/* <View style={styles.detailRow}>
            <Ionicons name='heart-half-outline' size={16} color='#bbb' style={{ marginRight: 8 }} />
            <Text style={styles.detailText}>{userInfo?.user_sexuality || "Orientation not provided"}</Text>
          </View> */}

          {/* Open to */}
          <View style={styles.detailRow}>
            <Ionicons name='male-female' size={16} color='#bbb' style={{ marginRight: 8 }} />
            <Text style={styles.detailText}>Open to {openToArray.join(", ") || "No preference"}</Text>
          </View>

          {/* Nationality */}
          <View style={styles.detailRow}>
            <Ionicons name='flag' size={16} color='#bbb' style={{ marginRight: 8 }} />
            <Text style={styles.detailText}>Nationality: {userInfo?.user_nationality || "Not entered"}</Text>
          </View>

          {/* Suburb */}
          <View style={styles.detailRow}>
            <Ionicons name='flag' size={16} color='#bbb' style={{ marginRight: 8 }} />
            <Text style={styles.detailText}>{userInfo?.user_suburb ? `Suburb: ${userInfo.user_suburb}` : "No suburb"}</Text>
          </View>

          {/* Body Composition */}
          <View style={styles.detailRow}>
            <Ionicons name='body' size={16} color='#bbb' style={{ marginRight: 8 }} />
            <Text style={styles.detailText}>{userInfo?.user_body_composition || "Body type not specified"}</Text>
          </View>

          {/* Education */}
          <View style={styles.detailRow}>
            <Ionicons name='school' size={16} color='#bbb' style={{ marginRight: 8 }} />
            <Text style={styles.detailText}>{userInfo?.user_education || "Education not specified"}</Text>
          </View>

          {/* Job */}
          <View style={styles.detailRow}>
            <Ionicons name='briefcase' size={16} color='#bbb' style={{ marginRight: 8 }} />
            <Text style={styles.detailText}>{userInfo?.user_job || "Occupation not specified"}</Text>
          </View>

          {/* Smoking */}
          <View style={styles.detailRow}>
            <Ionicons name='cafe' size={16} color='#bbb' style={{ marginRight: 8 }} />
            <Text style={styles.detailText}>{userInfo?.user_smoking && userInfo.user_smoking !== "Not Entered" ? userInfo.user_smoking : "Smoking habit not specified"}</Text>
          </View>

          {/* Drinking */}
          <View style={styles.detailRow}>
            <Ionicons name='beer' size={16} color='#bbb' style={{ marginRight: 8 }} />
            <Text style={styles.detailText}>{userInfo?.user_drinking || "Drinking habit not specified"}</Text>
          </View>

          {/* Religion */}
          <View style={styles.detailRow}>
            <Ionicons name='alert-circle' size={16} color='#bbb' style={{ marginRight: 8 }} />
            <Text style={styles.detailText}>{userInfo?.user_religion || "Religion not specified"}</Text>
          </View>

          {/* Star sign */}
          <View style={styles.detailRow}>
            <Ionicons name='planet' size={16} color='#bbb' style={{ marginRight: 8 }} />
            <Text style={styles.detailText}>{userInfo?.user_star_sign || "Sign not specified"}</Text>
          </View>
        </ScrollView>
      </Animated.View>

      {/* BOTTOM NAV BAR */}
      <BottomNav />
    </View>
  );
}

// ----------------------------------
// STYLES
// ----------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  topBar: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 9999,
  },
  topCounter: {
    color: "#ccc",
    fontSize: 16,
  },

  backgroundVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  noVideoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noVideoText: {
    color: "#fff",
    fontSize: 18,
  },

  playPauseButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -40 }, { translateY: -40 }],
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    padding: 15,
    borderRadius: 50,
    zIndex: 9999,
  },
  playPauseText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold",
  },

  matchActionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 5,
    gap: 30,
  },
  roundButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
  },
  nameContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  nameText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },
  starRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  attendanceText: {
    color: "#fff",
    marginLeft: 6,
    fontSize: 14,
  },

  chipsRow: {
    flexWrap: "wrap",
    flexDirection: "row",
    marginBottom: 16,
  },
  chip: {
    backgroundColor: "#333",
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: "#fff",
    fontSize: 13,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailIcon: {
    width: 16,
    height: 16,
    resizeMode: "contain",
    tintColor: "#bbb",
    marginRight: 8,
  },
  detailText: {
    color: "#ccc",
    fontSize: 14,
  },

  progressContainer: {
    position: "absolute",
    bottom: 70,
    left: 20,
    right: 20,
    zIndex: 10000,
  },
  slider: {
    width: "100%",
    height: 40,
  },

  bottomNavBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: "#222",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 9999,
  },
  navItem: {
    padding: 10,
  },
  bottomNavContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundColor: "#222",
    borderTopWidth: 2,
    borderTopColor: "#EEE",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 9999,
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

  infoText: {
    color: "#fff",
  },

  photoContainer: {
    marginBottom: 15,
  },
  photoScroll: {
    flexDirection: "row",
  },
  userPhoto: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 8,
  },

  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 11,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#888",
    marginVertical: 8,
  },
  horizontalLine: {
    height: 1,
    backgroundColor: "#444",
    marginHorizontal: 20,
    marginBottom: 10,
  },
  bottomSheetScroll: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  heartIconContainer: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 2,
  },
});
