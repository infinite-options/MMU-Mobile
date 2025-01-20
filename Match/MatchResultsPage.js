import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons

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
  const [menuVisible, setMenuVisible] = useState(false);
  const [matchedResults, setMatchedResults] = useState([]);
  const [interestedInMe, setInterestedInMe] = useState([]);
  const [interestedIn, setInterestedIn] = useState([]);

  const handleMenuOpen = () => setMenuVisible(true);
  const handleMenuClose = () => setMenuVisible(false);

  // Load user UID from AsyncStorage
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("user_uid");
        if (storedUserId) {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error("Error loading user UID from AsyncStorage:", error);
      }
    };
    loadUserId();
  }, []);

  // Fetch matching results from API
  const findMatchesResult = async () => {
    if (!userId) return; // If not yet loaded, skip
    try {
      const apiUrl = `https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/likes/${userId}`;
      // First get raw text to debug if needed:
      const response = await fetch(apiUrl);
      const text = await response.text();
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

      setMatchedResults(data.matched_results || []);
      setInterestedInMe(data.people_who_selected_you || []);
      setInterestedIn(data.people_whom_you_selected || []);
    } catch (error) {
      console.error("Error fetching matches:", error);
      Alert.alert("Error", "An error occurred while finding matches.");
    }
  };

  useEffect(() => {
    if (userId) {
      findMatchesResult();
    }
  }, [userId]);

  // POST match (like) to the API
  const handleMatchClick = async (matchId) => {
    try {
      if (!userId) return;

      const apiUrl =
        "https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/likes";

      const data = {
        liker_user_id: userId,
        liked_user_id: matchId,
      };

      const response = await axios.post(apiUrl, data);
      if (response.status === 200) {
        console.log("Match success:", response.data);
        Alert.alert("Success", "Matched successfully!");
      }
    } catch (error) {
      console.error("Error calling the match API:", error);
      Alert.alert("Error", "An error occurred while matching.");
    }
  };

  const renderMatchRow = (
    name,
    interests,
    imgSrc,
    buttonLabel = null,
    matchId = null
  ) => (
    <View
      style={styles.matchRow}
      key={`${name}-${matchId}-${Math.random()}`} // For unique keys
    >
      <View style={styles.matchRowLeft}>
        <Image source={{ uri: imgSrc }} style={styles.avatar} />
        <View>
          <Text style={styles.matchName}>{name}</Text>
          <Text style={styles.matchSubText}>
            {interests} interests in common
          </Text>
        </View>
      </View>
      <View style={styles.matchRowRight}>
        {buttonLabel && (
          <TouchableOpacity
            style={[
              styles.matchButton,
              buttonLabel === "Set up date"
                ? styles.setUpDateButton
                : styles.defaultButtonBorder,
            ]}
            onPress={
              buttonLabel === "Match" && matchId
                ? () => handleMatchClick(matchId)
                : undefined
            }
          >
            <Text
              style={[
                styles.matchButtonText,
                buttonLabel === "Match"
                  ? { color: "#E4423F" }
                  : { color: "#fff" },
              ]}
            >
              {buttonLabel}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.closeButton}>
          <Text style={styles.closeButtonIcon}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Matching Results</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => Alert.alert("Notifications!")}>
              <Ionicons name="notifications-outline" size={24} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleMenuOpen}>
              <Ionicons name="ellipsis-vertical" size={24} color="#888" />
            </TouchableOpacity>
          </View>
        </View>

        {/* MENU */}
        {menuVisible && (
          <View style={styles.menuContainer}>
            <TouchableOpacity onPress={handleMenuClose} style={styles.menuItem}>
              <Text>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleMenuClose} style={styles.menuItem}>
              <Text>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleMenuClose} style={styles.menuItem}>
              <Text>Manage Membership</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleMenuClose} style={styles.menuItem}>
              <Text>Hide Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleMenuClose} style={styles.menuItem}>
              <Text>Delete Account</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleMenuClose} style={styles.menuItem}>
              <Text>Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView style={styles.scrollArea}>
          {/* My Matches */}
          <Text style={styles.sectionTitle}>My matches</Text>
          {matchedResults.length > 0 ? (
            matchedResults.map((match) => {
              const photoUrls = safeJsonParse(match.user_photo_url, []);
              const firstPhoto = photoUrls[0] || "";
              return renderMatchRow(
                match.user_first_name,
                match.common_interests || "0",
                firstPhoto,
                "Set up date",
                match.user_uid
              );
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
              const firstPhoto = photoUrls[0] || "";
              return renderMatchRow(
                match.user_first_name,
                match.common_interests || "0",
                firstPhoto,
                "Match",
                match.user_uid
              );
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
              const firstPhoto = photoUrls[0] || "";
              return renderMatchRow(
                match.user_first_name,
                match.common_interests || "0",
                firstPhoto
              );
            })
          ) : (
            <Text style={styles.noMatchesText}>No matches found</Text>
          )}
        </ScrollView>

        {/* BOTTOM NAV */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="search" size={28} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton}>
            <Image
              source={require("../src/Assets/Images/redtwohearts.png")}
              style={styles.bottomIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="chatbubble-outline" size={28} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="person-outline" size={28} color="#888" />
          </TouchableOpacity>
        </View>
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
    elevation: 5, // Shadow on Android
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
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
