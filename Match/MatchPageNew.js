import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import axios from 'axios';
// If you have your images locally, you can import/require them:
const DefaultMale = require('../src/Assets/Images/account.png');
const DefaultFeMale = require('../src/Assets/Images/account.png');

const MatchPageNew = () => {
  const route = useRoute();
  const meet_date_user_id  = route.params.meet_date_user_id;
  console.log("--- meet_date_user_id ---", meet_date_user_id);
  const [userId, setUserId] = useState(null);
  const [userPhoto, setUserPhoto] = useState(null);
  const [matchedUserPhoto, setMatchedUserPhoto] = useState(null);
  const [matchedUserName, setMatchedUserName] = useState('');

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

  // Fetch user photos
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        // Fetch current user's photo
        const userResponse = await axios.get(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${userId}`);
        const userData = userResponse.data.result[0]; // Access first result item
        const userPhotoUrls = JSON.parse(userData.user_photo_url.replace(/\\"/g, '"')) || [];
        setUserPhoto(userPhotoUrls[0] || null);

        // Fetch matched user's photo
        const matchedUserResponse = await axios.get(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${meet_date_user_id}`);
        const matchedUserData = matchedUserResponse.data.result[0];
        const matchedPhotoUrls = JSON.parse(matchedUserData.user_photo_url.replace(/\\"/g, '"')) || [];
        setMatchedUserPhoto(matchedPhotoUrls[0] || null);
        
        // Get matched user's name
        setMatchedUserName(matchedUserData.user_first_name + ' ' + matchedUserData.user_last_name || 'your match');
        
      } catch (error) {
        console.error("Error fetching user photos:", error);
        // Fallback to default images
        setUserPhoto(null);
        setMatchedUserPhoto(null);
        setMatchedUserName('your match');
      }
    };

    if (userId && meet_date_user_id) {
      fetchPhotos();
    }
  }, [userId, meet_date_user_id]);

  console.log("--- userId ---", userId);
    const navigation = useNavigation();
    const handleKeepExploring = () => {
        navigation.navigate('MatchResultsPage');
    }
    const handleSetUpDate = () => {
        navigation.navigate('DateType', { matchedUserId: meet_date_user_id });
    }
  return (
    <LinearGradient colors={['#FC6767', '#EC008C']} style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>It's a Match!</Text>
      <Text style={styles.subtitle}>You and {matchedUserName} have liked each other.</Text>

      {/* Images container */}
      <View style={styles.imagesContainer}>
        {/* Current user's image */}
        <View style={[styles.imageWrapper, { zIndex: 2, marginRight: -20 }]}>
          <Image 
            source={userPhoto ? { uri: userPhoto } : DefaultMale} 
            style={styles.image}
            defaultSource={DefaultMale} // Fallback while loading
          />
        </View>
        
        {/* Matched user's image */}
        <View style={[styles.imageWrapper, { zIndex: 1, marginLeft: -20 }]}>
          <Image 
            source={matchedUserPhoto ? { uri: matchedUserPhoto } : DefaultFeMale} 
            style={styles.image}
            defaultSource={DefaultFeMale} // Fallback while loading
          />
        </View>
      </View>

      {/* Button: Set up our date */}
      <TouchableOpacity style={styles.button} onPress={handleSetUpDate}>
        <Text style={styles.buttonText}>Set up our date</Text>
      </TouchableOpacity>

      {/* Link: Keep exploring */}
      <TouchableOpacity
        onPress={handleKeepExploring}
      >
        <Text style={styles.link}>Keep exploring</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 24,
  },
  imagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  imageWrapper: {
    width: 140,
    height: 140,
    borderWidth: 4,
    borderColor: '#fff',
    borderRadius: 70, // This makes the image circular
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 16,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  link: {
    color: '#fff',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default MatchPageNew;
