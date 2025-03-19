import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import profileImg from "../src/Assets/Images/profileimg.png";
import MatchPopUp from "./MatchPopUp";
import like from "../src/Assets/Images/like.png";
import likedImg from "../src/Assets/Images/filledheart.png";
import { Video } from "expo-av";

const Match = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState([]);
  const [userStates, setUserStates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        // const storedUserId = await AsyncStorage.getItem('user_uid');
        const storedUserId = "100-000004";
        setUserId(storedUserId);

        if (storedUserId) {
          const likedResponse = await axios.get(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/likes/${storedUserId}`);
          const likedUserIds = likedResponse.data.people_whom_you_selected.map((user) => user.user_uid);
          const likedByUserIds = likedResponse.data.people_who_selected_you.map((user) => user.user_uid);

          await AsyncStorage.setItem("liked_user_ids", JSON.stringify(likedUserIds));
          await AsyncStorage.setItem("liked_by_user_ids", JSON.stringify(likedByUserIds));
        }
      } catch (error) {
        console.error("Error initializing data:", error);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    const fetchMatches = async () => {
      if (userId) {
        try {
          const res = await axios.get(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/matches/${userId}`);
          if (res.data.result && Array.isArray(res.data.result)) {
            setUserData(res.data.result);
            const storedLikes = await AsyncStorage.getItem("liked_user_ids");
            const storedLikedBy = await AsyncStorage.getItem("liked_by_user_ids");
            const likedUserIds = storedLikes ? JSON.parse(storedLikes) : [];
            const likedByUserIds = storedLikedBy ? JSON.parse(storedLikedBy) : [];

            const initialUserStates = res.data.result.map((user) => ({
              isFlipped: false,
              liked: likedUserIds.includes(user.user_uid),
              likedBy: likedByUserIds.includes(user.user_uid),
              showPopup: likedUserIds.includes(user.user_uid) && likedByUserIds.includes(user.user_uid),
            }));
            setUserStates(initialUserStates);
          } else {
            console.log("API did not return expected data structure:", res.data);
          }
        } catch (error) {
          console.log("Error fetching data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchMatches();
  }, [userId]);

  const handleLike = async (index, user) => {
    const updatedLikedStatus = !userStates[index]?.liked;
    const updatedStates = [...userStates];
    updatedStates[index].liked = updatedLikedStatus;

    if (updatedLikedStatus && userStates[index]?.likedBy) {
      updatedStates[index].showPopup = true;
    } else {
      updatedStates[index].showPopup = false;
    }

    setUserStates(updatedStates);

    const formData = new FormData();
    formData.append("liker_user_id", userId);
    formData.append("liked_user_id", user.user_uid);

    try {
      if (updatedLikedStatus) {
        await axios.post("https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/likes", formData);
      } else {
        await axios.delete("https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/likes", { data: formData });
      }
    } catch (error) {
      console.error("Error handling like action", error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#E4423F' />
        <Text>Loading Matches...</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={styles.container}>
        {userData.length === 0 ? (
          <Text>No matches found.</Text>
        ) : (
          userData.map((user, index) => (
            <View key={user.user_uid || index} style={styles.cardContainer}>
              {userStates[index].showPopup && <MatchPopUp user={user} userStates={userStates} setUserStates={setUserStates} index={index} />}
              <View style={styles.card}>
                <TouchableOpacity onPress={() => handleLike(index, user)} style={styles.likeButton}>
                  <Image source={userStates[index]?.liked ? likedImg : like} style={styles.likeIcon} />
                </TouchableOpacity>
                <Image
                  source={
                    user.user_favorite_photo
                      ? { uri: user.user_favorite_photo.toString() }
                      : user.user_photo_url
                      ? { uri: (Array.isArray(user.user_photo_url) ? user.user_photo_url[0] : JSON.parse(user.user_photo_url)[0]).toString() }
                      : profileImg
                  }
                  style={styles.profileImage}
                />
                <Text style={styles.userName}>
                  {user.user_first_name} {user.user_last_name}
                </Text>
                <Text style={styles.userDetails}>
                  {user.user_age} - {user.user_gender} - {user.user_suburb}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate("ViewProfile", { user })} style={styles.profileButton}>
                  <Text style={styles.flipText}>Tap to See Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={() => navigation.navigate("MatchPreferences")}>
            <View style={styles.button}>
              <Text style={styles.buttonText}>Edit Preferences</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("SelectionResults")}>
            <View style={styles.button}>
              <Text style={styles.buttonText}>My Matches</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("AccountSetup1Login")}>
            <View style={styles.button}>
              <Text style={styles.buttonText}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContainer: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#E4423F",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    height: 400,
    justifyContent: "space-between",
    position: "relative",
  },
  profileImage: {
    width: "100%",
    height: "75%",
    borderRadius: 10,
  },
  profileVideo: {
    width: "100%",
    height: "75%",
    borderRadius: 10,
    backgroundColor: "black",
  },
  userName: {
    fontSize: 20,
    color: "white",
    marginTop: 10,
  },
  userDetails: {
    fontSize: 12,
    color: "white",
  },
  flipText: {
    color: "white",
    fontSize: 18,
  },
  likeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  likeIcon: {
    width: 30,
    height: 30,
  },
  profileButton: {
    backgroundColor: "#E4423F",
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    paddingVertical: 10,
  },
  buttonContainer: {
    flexDirection: "column",
    marginTop: 20,
    alignItems: "center", // Center align buttons horizontally
  },
  button: {
    backgroundColor: "#E4423F", // Set button color to match the example
    paddingVertical: 15, // Vertical padding for button height
    paddingHorizontal: 60, // Horizontal padding for button width
    borderRadius: 25, // Rounded button corners
    marginBottom: 10, // Space between buttons
    width: 300, // Set width to a fixed size
    alignItems: "center", // Center text horizontally within the button
  },
  buttonText: {
    color: "white", // White text color
    fontSize: 18, // Font size for text
    fontWeight: "bold", // Bold text for emphasis
  },
});

export default Match;
