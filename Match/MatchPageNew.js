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
const male1 = require('../src/Assets/Images/img2.png');
const Tiffany = require('../src/Assets/Images/Tiffany.jpeg');

const MatchPageNew = () => {
  const route = useRoute();
  const meet_date_user_id  = route.params.meet_date_user_id;
  console.log('--- meet_date_user_id ---', meet_date_user_id);
  const [userId, setUserId] = useState(null);
  const [userPhoto, setUserPhoto] = useState(null);
  const [matchedUserPhoto, setMatchedUserPhoto] = useState(null);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('user_uid');
        if (storedUserId) {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error('Error loading user UID from AsyncStorage:', error);
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
        
      } catch (error) {
        console.error('Error fetching user photos:', error);
        // Fallback to default images
        setUserPhoto(null);
        setMatchedUserPhoto(null);
      }
    };

    if (userId && meet_date_user_id) {
      fetchPhotos();
    }
  }, [userId, meet_date_user_id]);

  console.log('--- userId ---', userId);
    const navigation = useNavigation();
    const handleKeepExploring = () => {
        navigation.navigate('MatchResultsPage');
    }
    const handleSetUpDate = () => {
        navigation.navigate('DateType');
    }
  return (
    <LinearGradient colors={['#FC6767', '#EC008C']} style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>It's a Match!</Text>
      <Text style={styles.subtitle}>You and Gemma have liked each other.</Text>

      {/* Images container */}
      <View style={styles.imagesContainer}>
        {/* Current user's image */}
        <View style={[styles.imageWrapper, { zIndex: 2, marginRight: -20 }]}>
          <Image 
            source={userPhoto ? { uri: userPhoto } : male1} 
            style={styles.image}
            defaultSource={male1} // Fallback while loading
          />
        </View>
        
        {/* Matched user's image */}
        <View style={[styles.imageWrapper, { zIndex: 1, marginLeft: -20 }]}>
          <Image 
            source={matchedUserPhoto ? { uri: matchedUserPhoto } : Tiffany} 
            style={styles.image}
            defaultSource={Tiffany} // Fallback while loading
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
  button: {
    backgroundColor: '#fff',
    borderRadius: 30,
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  image: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  imageWrapper: {
    width: 140,
    height: 140,
    borderWidth: 4,
    borderColor: '#fff',
    borderRadius: 70, // This makes the image circular
    overflow: 'hidden',
  },
  imagesContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 24,
  },
  link: {
    color: '#fff',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});

export default MatchPageNew;
