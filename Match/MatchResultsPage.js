import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, Alert, StyleSheet, ScrollView, SafeAreaView, Platform, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons"; // Import Ionicons
import { useNavigation } from "@react-navigation/native";

console.log("--- MatchResultsPage ---");

// Example placeholders for bottom navigation icons

const BottomNav = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.bottomNavContainer}>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Preferences")}>
        <Image source={require("../assets/icons/search.png")} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("MatchResultsPage")}>
        <Image source={require("../assets/icons/twoheartsfilled.png")} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Chat")}>
        <Image source={require("../assets/icons/chat.png")} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("MyProfile")}>
        <Image source={require("../assets/icons/profileoutline.png")} />
      </TouchableOpacity>
    </View>
  );
};
// Utility to parse JSON safely
function safeJsonParse(value, fallback = []) {
  // If value is null or not a string, just return fallback
  if (typeof value !== "string") {
    return fallback;
  }
  // Otherwise parse
  try {
    return JSON.parse(value);
  } catch (err) {
    console.warn("Failed to parse JSON:", value, err);
    return fallback;
  }
}

const MatchResultsPage = () => {
  const [userId, setUserId] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [matchedResults, setMatchedResults] = useState([]);
  const [interestedInMe, setInterestedInMe] = useState([]);
  const [interestedIn, setInterestedIn] = useState([]);

  // This stores whether each matched user has an existing meet
  // Example structure: { '100-000111': true, '100-000112': false }
  const [meetStatus, setMeetStatus] = useState({});
  const [meetSelfStatus, setMeetSelfStatus] = useState({});
  const [userInterests, setUserInterests] = useState([]);

  const navigation = useNavigation();

  const handleMenuOpen = () => setMenuVisible(true);
  const handleMenuClose = () => setMenuVisible(false);

  // Added functions for menu actions similar to MyProfile.js
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
        // handle hide profile if needed
        break;
      case "Delete Account":
        // handle delete account if needed
        break;
      case "Logout":
        logoutUser();
        break;
      default:
        break;
    }
  };

  const logoutUser = async () => {
    try {
      await AsyncStorage.clear();
      navigation.navigate("Login");
    } catch (error) {
      console.error("Error clearing AsyncStorage:", error);
    }
  };

  // Load user UID from AsyncStorage and fetch user info from API
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("user_uid");

        if (storedUserId) {
          setUserId(storedUserId);

          // Fetch user info from API
          try {
            const userInfoUrl = `https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${storedUserId}`;
            const response = await axios.get(userInfoUrl);
            console.log("--- User Info Response ---", response.data);

            // Extract general interests from response - access the first item in the result array
            if (response.data && response.data.result && response.data.result.length > 0) {
              const userData = response.data.result[0];

              if (userData.user_general_interests) {
                const interestsData = userData.user_general_interests;

                // Handle different formats of interests data
                if (typeof interestsData === "string") {
                  try {
                    // Try parsing as JSON
                    const interests = JSON.parse(interestsData);
                    setUserInterests(Array.isArray(interests) ? interests : []);
                  } catch (e) {
                    // If parsing fails, try treating as comma-separated string
                    setUserInterests(interestsData.split(",").map((i) => i.trim()));
                  }
                } else if (Array.isArray(interestsData)) {
                  setUserInterests(interestsData);
                }

                console.log("--- Parsed User Interests ---", userInterests);
              }
            }
          } catch (apiError) {
            console.error("Error fetching user info from API:", apiError);

            // Fallback to AsyncStorage if API call fails
            const userInterestsString = await AsyncStorage.getItem("user_general_interests");
            if (userInterestsString) {
              try {
                const interests = JSON.parse(userInterestsString);
                setUserInterests(Array.isArray(interests) ? interests : []);
              } catch (e) {
                setUserInterests(userInterestsString.split(",").map((i) => i.trim()));
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, []);

  // Add focus listener to refresh when returning to the screen
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setRefreshTrigger((prev) => prev + 1);
    });
    return unsubscribe;
  }, [navigation]);

  // Fetch matching results from API
  const findMatchesResult = async () => {
    if (!userId) return; // If not yet loaded, skip
    try {
      console.log("=== MATCH DEBUG: Starting API call for user likes ===");
      const matchesStartTime = Date.now();

      const apiUrl = `https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/likes/${userId}`;
      // First get raw text to debug if needed:
      console.log(`MATCH DEBUG: Calling API: ${apiUrl}`);
      const response = await fetch(apiUrl);
      const text = await response.text();

      const initialApiDuration = Date.now() - matchesStartTime;
      console.log(`MATCH DEBUG: Initial API call completed in ${initialApiDuration}ms`);

      // Debug:
      console.log("--- Raw server response ---", text);

      // Now parse the text as JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr);
        Alert.alert("Error", "Failed to parse server response.");
        return; // Stop here if parse fails
      }

      // If parse succeeded, proceed
      console.log("--- data ---", data);

      const matchedResultsData = data.matched_results || [];
      const interestedInMeData = data.people_who_selected_you || [];
      const interestedInData = data.people_whom_you_selected || [];

      console.log(`MATCH DEBUG: Found ${matchedResultsData.length} matches, ${interestedInMeData.length} people interested in me, ${interestedInData.length} people I'm interested in`);

      // Fetch user details including interests for each matched user
      console.log("MATCH DEBUG: Starting to fetch details for matched users");
      const matchedDetailsStartTime = Date.now();

      const enrichedMatchedResults = await Promise.all(
        matchedResultsData.map(async (match, index) => {
          try {
            console.log(`MATCH DEBUG: Fetching details for matched user ${index + 1}/${matchedResultsData.length}: ${match.user_uid}`);
            const userInfoUrl = `https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${match.user_uid}`;
            const startTime = Date.now();
            const userInfoResponse = await axios.get(userInfoUrl, { timeout: 15000 }); // Increase timeout to 15 seconds
            const duration = Date.now() - startTime;
            console.log(`MATCH DEBUG: Fetched details for matched user ${match.user_uid} in ${duration}ms`);

            if (userInfoResponse.data && userInfoResponse.data.result && userInfoResponse.data.result.length > 0) {
              const userDetails = userInfoResponse.data.result[0];
              console.log(`MATCH DEBUG: User ${match.user_uid} details from API:`, {
                favorite_photo: userDetails.user_favorite_photo,
                photo_urls: userDetails.user_photo_url,
              });
              // Merge the user details into the match data
              return {
                ...match,
                user_general_interests: userDetails.user_general_interests,
                user_favorite_photo: userDetails.user_favorite_photo,
              };
            }
            return match;
          } catch (error) {
            console.error(`MATCH DEBUG: ⚠️ ERROR fetching interests for user ${match.user_uid}:`, error.message);
            if (error.code === "ECONNABORTED") {
              console.error(`MATCH DEBUG: ⚠️ TIMEOUT occurred for user ${match.user_uid}`);
            }
            return match;
          }
        })
      );

      const matchedDetailsDuration = Date.now() - matchedDetailsStartTime;
      console.log(`MATCH DEBUG: Completed fetching matched user details in ${matchedDetailsDuration}ms`);

      // Similarly fetch details for interested in me users
      console.log("MATCH DEBUG: Starting to fetch details for users interested in me");
      const interestedInMeStartTime = Date.now();

      const enrichedInterestedInMe = await Promise.all(
        interestedInMeData.map(async (match, index) => {
          try {
            console.log(`MATCH DEBUG: Fetching details for interested-in-me user ${index + 1}/${interestedInMeData.length}: ${match.user_uid}`);
            const userInfoUrl = `https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${match.user_uid}`;
            const startTime = Date.now();
            const userInfoResponse = await axios.get(userInfoUrl, { timeout: 15000 }); // Increase timeout to 15 seconds
            const duration = Date.now() - startTime;
            console.log(`MATCH DEBUG: Fetched details for interested-in-me user ${match.user_uid} in ${duration}ms`);

            if (userInfoResponse.data && userInfoResponse.data.result && userInfoResponse.data.result.length > 0) {
              const userDetails = userInfoResponse.data.result[0];
              return {
                ...match,
                user_general_interests: userDetails.user_general_interests,
                user_favorite_photo: userDetails.user_favorite_photo,
              };
            }
            return match;
          } catch (error) {
            console.error(`MATCH DEBUG: ⚠️ ERROR fetching interests for interested-in-me user ${match.user_uid}:`, error.message);
            if (error.code === "ECONNABORTED") {
              console.error(`MATCH DEBUG: ⚠️ TIMEOUT occurred for user ${match.user_uid}`);
            }
            return match;
          }
        })
      );

      const interestedInMeDuration = Date.now() - interestedInMeStartTime;
      console.log(`MATCH DEBUG: Completed fetching interested-in-me user details in ${interestedInMeDuration}ms`);

      // And for interested in users
      console.log("MATCH DEBUG: Starting to fetch details for users I'm interested in");
      const interestedInStartTime = Date.now();

      const enrichedInterestedIn = await Promise.all(
        interestedInData.map(async (match, index) => {
          try {
            console.log(`MATCH DEBUG: Fetching details for interested-in user ${index + 1}/${interestedInData.length}: ${match.user_uid}`);
            const userInfoUrl = `https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${match.user_uid}`;
            const startTime = Date.now();
            const userInfoResponse = await axios.get(userInfoUrl, { timeout: 15000 }); // Increase timeout to 15 seconds
            const duration = Date.now() - startTime;
            console.log(`MATCH DEBUG: Fetched details for interested-in user ${match.user_uid} in ${duration}ms`);

            if (userInfoResponse.data && userInfoResponse.data.result && userInfoResponse.data.result.length > 0) {
              const userDetails = userInfoResponse.data.result[0];
              return {
                ...match,
                user_general_interests: userDetails.user_general_interests,
                user_favorite_photo: userDetails.user_favorite_photo,
              };
            }
            return match;
          } catch (error) {
            console.error(`MATCH DEBUG: ⚠️ ERROR fetching interests for interested-in user ${match.user_uid}:`, error.message);
            if (error.code === "ECONNABORTED") {
              console.error(`MATCH DEBUG: ⚠️ TIMEOUT occurred for user ${match.user_uid}`);
            }
            return match;
          }
        })
      );

      const interestedInDuration = Date.now() - interestedInStartTime;
      console.log(`MATCH DEBUG: Completed fetching interested-in user details in ${interestedInDuration}ms`);

      // Update state with the enriched data
      console.log("MATCH DEBUG: Updating state with all fetched data");
      setMatchedResults(enrichedMatchedResults);
      setInterestedInMe(enrichedInterestedInMe);
      setInterestedIn(enrichedInterestedIn);
      console.log("MATCH DEBUG: State updated successfully");

      const totalDuration = Date.now() - matchesStartTime;
      console.log(`MATCH DEBUG: Total findMatchesResult execution time: ${totalDuration}ms`);
    } catch (error) {
      console.error("MATCH DEBUG: ⚠️ CRITICAL ERROR in findMatchesResult:", error);
      console.log("MATCH DEBUG: Error details:", error.message);
      console.log("MATCH DEBUG: Error code:", error.code);
      console.log("MATCH DEBUG: Error name:", error.name);

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log("MATCH DEBUG: Error response data:", error.response.data);
        console.log("MATCH DEBUG: Error response status:", error.response.status);
        console.log("MATCH DEBUG: Error response headers:", error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.log("MATCH DEBUG: No response received. Request details:", error.request);
      }

      if (error.code === "ECONNABORTED") {
        console.error("MATCH DEBUG: ⚠️ TIMEOUT ERROR - The request took too long to complete");
        Alert.alert("Connection Timeout", "The request is taking longer than expected. Please check your internet connection and try again.");
      } else {
        Alert.alert("Error", "Failed to fetch matches. Please try again later.");
      }
    }
  };

  // Update useEffect dependency array
  useEffect(() => {
    if (userId) {
      findMatchesResult();
    }
  }, [userId, refreshTrigger]);

  // Once matchedResults loads, fetch meet info for each matched user
  useEffect(() => {
    // If no matches, clear and return
    if (!matchedResults || matchedResults.length === 0) {
      setMeetStatus({});
      setMeetSelfStatus({});
      return;
    }
    const fetchMeetSelfStatus = async () => {
      try {
        const meetSelfUrl = `https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/meet/${userId}`;
        const res = await axios.get(meetSelfUrl);
        const selfmeets = Array.isArray(res.data?.result) ? res.data.result : [];
        setMeetSelfStatus(selfmeets.length > 0);
      } catch (err) {
        console.warn("Error fetching meet data for self users:", err);
      }
    };
    fetchMeetSelfStatus();

    // Create a copy of matchedResults to fetch meets for each user
    const fetchMeetStatus = async () => {
      try {
        const newMeetStatus = {};

        // For each user in matchedResults, call the meet endpoint for THAT user's ID
        // NOT your own userId.
        for (const matchedUser of matchedResults) {
          const theirUserId = matchedUser.user_uid;
          console.log("--- theirUserId ---", theirUserId);
          const meetUrl = `https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/meet/${theirUserId}`;

          try {
            const res = await axios.get(meetUrl);

            // Handle case where data is missing or malformed
            const resultData = res.data?.result || [];
            console.log("--- resultData ---", resultData);
            const meets = Array.isArray(resultData) ? resultData : [];

            newMeetStatus[theirUserId] = meets.length > 0;
          } catch (err) {
            // Only log error if it's not a 404
            if (!(err.response && err.response.status === 404)) {
              console.warn("Error fetching meet data for user:", theirUserId, err);
            }
            newMeetStatus[theirUserId] = false; // Default to no meet
          }
        }

        setMeetStatus(newMeetStatus);
      } catch (err) {
        console.warn("Error fetching meet data for matched users:", err);
      }
    };

    fetchMeetStatus();
  }, [matchedResults]);

  // Function to calculate common interests
  const calculateCommonInterests = (matchInterests) => {
    console.log("--- CALCULATING COMMON INTERESTS ---");
    console.log("User interests:", userInterests);
    console.log("Match interests raw:", matchInterests);

    // Ensure both are arrays and not null/undefined
    const userInterestsArray = Array.isArray(userInterests) ? userInterests : [];
    let matchInterestsArray = [];

    // Handle case when matchInterests is undefined or null
    if (!matchInterests) {
      console.log("No match interests found, returning 0");
      return 0; // No common interests if match has no interests
    }

    if (typeof matchInterests === "string") {
      try {
        // Try parsing as JSON
        matchInterestsArray = JSON.parse(matchInterests);
        console.log("Successfully parsed match interests as JSON:", matchInterestsArray);
        if (!Array.isArray(matchInterestsArray)) {
          console.log("Parsed result is not an array, converting to empty array");
          matchInterestsArray = []; // Ensure it's an array
        }
      } catch (e) {
        // If parsing fails, try treating as comma-separated string
        console.log("Failed to parse as JSON, treating as comma-separated string");
        matchInterestsArray = matchInterests.split(",").map((i) => i.trim());
        console.log("Split result:", matchInterestsArray);
      }
    } else if (Array.isArray(matchInterests)) {
      console.log("Match interests is already an array");
      matchInterestsArray = matchInterests;
    } else {
      console.log("Match interests is neither string nor array:", typeof matchInterests);
    }

    // Extra safety check to ensure matchInterestsArray is an array
    if (!Array.isArray(matchInterestsArray)) {
      console.log("matchInterestsArray is still not an array after processing");
      return 0;
    }

    // Count common interests with case-insensitive comparison
    const common = userInterestsArray.filter((userInterest) => matchInterestsArray.some((matchInterest) => String(userInterest).toLowerCase() === String(matchInterest).toLowerCase()));

    console.log("Common interests found:", common);
    console.log("Common count:", common.length);

    return common.length;
  };

  // Render "Set up date" or "See invitation" depending on meet status
  // Also handle button press to navigate to DateType or Chat
  const handleButtonPress = (matchId) => {
    if (meetStatus[matchId]) {
      // Pass the matched user UID to Chat
      navigation.navigate("Chat", { matchedUserId: matchId });
    } else {
      // Also pass the UID to DateType
      navigation.navigate("DateType", { matchedUserId: matchId });
    }
  };

  const handleDislike = async (matchId) => {
    const userUid = await AsyncStorage.getItem("user_uid");
    const formData = new URLSearchParams();
    formData.append("liker_user_id", userUid);
    formData.append("liked_user_id", matchId);
    try {
      await axios.delete("https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/likes", {
        data: formData.toString(),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      console.log("Disliked user:", matchId);
      setMatchedResults((prevResults) => prevResults.filter((match) => match.user_uid !== matchId));
      setRefreshTrigger((prev) => prev + 1);
      await findMatchesResult();
    } catch (error) {
      console.error("Error disliking user:", error.message);
    }
  };

  const renderMatchRow = (firstname, lastname, interests, imgSrc, buttonLabel = null, matchId = null) => {
    // Calculate common interests
    const commonInterestsCount = calculateCommonInterests(interests);

    // Decide which label to show (we ignore the passed buttonLabel here intentionally,
    // because we override with either "See invitation" or "Set up date" below).
    const hasMeet = meetStatus[matchId] || false;
    console.log("--- hasMeet ---", hasMeet);
    const hasMeetSelf = meetSelfStatus[matchId] || false;
    console.log("--- hasMeetSelf ---", hasMeetSelf);
    const dynamicButtonLabel = hasMeet ? "See invitation" : hasMeetSelf ? "change date" : "Set up date";
    console.log("--- dynamicButtonLabel ---", dynamicButtonLabel);

    return (
      <View style={styles.matchRow} key={`${firstname}-${matchId}-${Math.random()}`}>
        <View style={styles.matchRowLeft}>
          <TouchableOpacity onPress={() => navigation.navigate("UserProfile", { meet_date_user_id: matchId })}>
            <Image source={imgSrc ? { uri: imgSrc } : require("../assets/account.png")} style={styles.avatar} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Chat", { matchedUserId: matchId })}>
            <View>
              <Text style={styles.matchName}>
                {firstname} {lastname}
              </Text>
              <Text style={styles.matchSubText}>{commonInterestsCount} interests in common</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.matchRowRight}>
          <TouchableOpacity style={[styles.matchButton, dynamicButtonLabel === "Set up date" ? styles.setUpDateButton : styles.defaultButtonBorder]} onPress={() => handleButtonPress(matchId)}>
            <Text style={[styles.matchButtonText, dynamicButtonLabel === "Set up date" ? { color: "#fff" } : { color: "#E4423F" }]}>{dynamicButtonLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={() => handleDislike(matchId)}>
            <Text style={styles.closeButtonIcon}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  const renderInterestedInMeRow = (fname, lname, interests, imgSrc, buttonLabel = "Match", matchId = null) => {
    return (
      <View style={styles.matchRow} key={`${fname}-${matchId}`}>
        <View style={styles.matchRowLeft}>
          <TouchableOpacity onPress={() => navigation.navigate("UserProfile", { meet_date_user_id: matchId })}>
            <Image source={imgSrc ? { uri: imgSrc } : require("../assets/account.png")} style={styles.avatar} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("UserProfile", { meet_date_user_id: matchId })}>
            <View>
              <Text style={styles.matchName}>
                {fname} {lname}
              </Text>
              <Text style={styles.matchSubText}>{calculateCommonInterests(interests)} interests in common</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.matchRowRight}>
          <TouchableOpacity style={[styles.matchButton, styles.setUpDateButton]} onPress={() => navigation.navigate("UserProfile", { meet_date_user_id: matchId })}>
            <Text style={[styles.matchButtonText, { color: "#fff" }]}>{buttonLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={() => setInterestedInMe((prevResults) => prevResults.filter((match) => match.user_uid !== matchId))}>
            <Text style={styles.closeButtonIcon}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  const renderInterestedInRow = (fname, lname, interests, imgSrc, buttonLabel = null, matchId = null) => {
    return (
      <View style={styles.matchRow} key={`${fname}-${matchId}`}>
        <View style={styles.matchRowLeft}>
          <TouchableOpacity onPress={() => navigation.navigate("UserProfile", { meet_date_user_id: matchId })}>
            <Image source={imgSrc ? { uri: imgSrc } : require("../assets/account.png")} style={styles.avatar} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("UserProfile", { meet_date_user_id: matchId })}>
            <View>
              <Text style={styles.matchName}>
                {fname} {lname}
              </Text>
              <Text style={styles.matchSubText}>{calculateCommonInterests(interests)} interests in common</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.matchRowRight}>
          <TouchableOpacity style={styles.closeButton} onPress={() => handleDislike(matchId)}>
            <Text style={styles.closeButtonIcon}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Matching Results</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => Alert.alert("Notifications!")}>
            <Ionicons name='notifications-outline' size={24} color='#888' />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleMenuOpen}>
            <Ionicons name='ellipsis-vertical' size={24} color='#888' />
          </TouchableOpacity>
        </View>
      </View>

      {/* MENU */}
      {menuVisible && (
        <>
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={0} onPress={handleMenuClose} />
          <View style={styles.menuContainer}>
            <TouchableOpacity onPress={() => handleMenuItemPress("Edit Profile")} style={styles.menuItem}>
              <Text>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenuItemPress("Settings")} style={styles.menuItem}>
              <Text>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenuItemPress("Manage Membership")} style={styles.menuItem}>
              <Text>Manage Membership</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenuItemPress("Hide Profile")} style={styles.menuItem}>
              <Text>Hide Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenuItemPress("Delete Account")} style={styles.menuItem}>
              <Text>Delete Account</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenuItemPress("Logout")} style={styles.menuItem}>
              <Text>Logout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <ScrollView style={styles.scrollArea}>
        {/* My Matches */}
        <Text style={styles.sectionTitle}>My matches</Text>
        {matchedResults.length > 0 ? (
          matchedResults.map((match) => {
            const photoUrls = safeJsonParse(match.user_photo_url, []);
            console.log(`\n=== Photo Debug for user ${match.user_uid} ===`);
            console.log("Favorite photo:", match.user_favorite_photo);
            console.log("Photo URLs array:", photoUrls);
            console.log("Photo URLs type:", typeof photoUrls);

            // Use favorite photo if available, otherwise use first photo from array
            const photoToShow = match.user_favorite_photo?.toString() || (photoUrls.length > 0 ? photoUrls[0].toString() : null);

            console.log("Selected photo to show:", photoToShow);
            console.log("===============================\n");

            return renderMatchRow(match.user_first_name, match.user_last_name, match.user_general_interests, photoToShow, "Set up date or see invitation", match.user_uid);
          })
        ) : (
          <Text style={styles.noMatchesText}>No matches found</Text>
        )}

        <View style={styles.divider} />

        {/* People Interested in Me */}
        <Text style={styles.sectionTitle}>People interested in me</Text>
        {interestedInMe.length > 0 ? (
          interestedInMe.map((match) => {
            const photoUrls = safeJsonParse(match.user_photo_url, []);
            console.log(`\n=== Photo Debug for Interested In Me user ${match.user_uid} ===`);
            console.log("Favorite photo:", match.user_favorite_photo);
            console.log("Photo URLs array:", photoUrls);
            console.log("Photo URLs type:", typeof photoUrls);

            const photoToShow = match.user_favorite_photo?.toString() || (photoUrls.length > 0 ? photoUrls[0].toString() : null);

            console.log("Selected photo to show:", photoToShow);
            console.log("===============================\n");

            return renderInterestedInMeRow(match.user_first_name, match.user_last_name, match.user_general_interests, photoToShow, "Match", match.user_uid);
          })
        ) : (
          <Text style={styles.noMatchesText}>No matches found</Text>
        )}

        <View style={styles.divider} />

        {/* People I'm Interested In */}
        <Text style={styles.sectionTitle}>People I'm interested in</Text>
        {interestedIn.length > 0 ? (
          interestedIn.map((match) => {
            const photoUrls = safeJsonParse(match.user_photo_url, []);
            console.log(`\n=== Photo Debug for Interested In user ${match.user_uid} ===`);
            console.log("Favorite photo:", match.user_favorite_photo);
            console.log("Photo URLs array:", photoUrls);
            console.log("Photo URLs type:", typeof photoUrls);

            const photoToShow = match.user_favorite_photo?.toString() || (photoUrls.length > 0 ? photoUrls[0].toString() : null);

            console.log("Selected photo to show:", photoToShow);
            console.log("===============================\n");

            return renderInterestedInRow(match.user_first_name, match.user_last_name, match.user_general_interests, photoToShow, "See Profile", match.user_uid);
          })
        ) : (
          <Text style={styles.noMatchesText}>No matches found</Text>
        )}
      </ScrollView>

      {/* BOTTOM NAV */}
      <BottomNav />
    </SafeAreaView>
  );
};

export default MatchResultsPage;

/**
 * STYLES
 */
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
  },
  headerTitle: {
    fontFamily: "Lexend", // Or your desired font
    fontWeight: "500",
    fontSize: 21,
    color: "#1A1A1A",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 24,
    color: "#888",
  },
  menuContainer: {
    position: "absolute",
    top: 80,
    right: 16,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    zIndex: 1000,
  },
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 999,
  },
  menuItem: {
    padding: 8,
  },
  scrollArea: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionTitle: {
    textAlign: "left",
    color: "#757575",
    fontFamily: "Lexend",
    fontSize: 14,
    marginBottom: 20,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  matchRowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 8,
    backgroundColor: "#ccc",
  },
  matchName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#000",
  },
  matchSubText: {
    fontSize: 12,
    color: "#666",
  },
  matchRowRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  matchButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 30,
    borderWidth: 1,
    marginRight: 8,
  },
  setUpDateButton: {
    backgroundColor: "#E4423F",
    borderColor: "#E4423F",
  },
  defaultButtonBorder: {
    borderColor: "#E4423F",
  },
  matchButtonText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonIcon: {
    fontSize: 20,
    fontWeight: "bold",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginVertical: 16,
  },
  noMatchesText: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#666",
    marginBottom: 16,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingVertical: 8,
  },
  navButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  bottomIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
});
