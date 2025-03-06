import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  Platform,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaskedView from '@react-native-masked-view/masked-view';

export default function DateType({ navigation }) {
  const route = useRoute();
  const [matchedUserId, setMatchedUserId] = useState(route.params?.matchedUserId || null);
  useEffect(() => {
    const initMatchedUserId = async () => {
      if (!matchedUserId) {
        const storedId = await AsyncStorage.getItem('matchedUserId');
        if (storedId) setMatchedUserId(storedId);
      }
      else {
        await AsyncStorage.setItem('matchedUserId', matchedUserId);
      }
    };
    initMatchedUserId();
  }, []);
  console.log("--- matchedUserId ---", matchedUserId);
  // Track which date type is selected

  const [selectedDateType, setSelectedDateType] = useState(null);

  // Add useEffect to load previously selected date type
  useEffect(() => {
    const loadSavedDateType = async () => {
      try {
        const savedDateType = await AsyncStorage.getItem('user_date_type');
        if (savedDateType) {
          setSelectedDateType(savedDateType);
          console.log('Loaded previously selected date type:', savedDateType);
        }
      } catch (error) {
        console.error('Error loading saved date type:', error);
      }
    };
    
    loadSavedDateType();
  }, []);

  // Add state for matched user's info
  const [matchedUserName, setMatchedUserName] = useState('');
  const [matchedUserPreferences, setMatchedUserPreferences] = useState([]);
  const [matchedUserImage, setMatchedUserImage] = useState(null);
  const [currentUserImage, setCurrentUserImage] = useState(null);

  // Fetch user info when component mounts
  useEffect(() => {
    const fetchMatchedUserInfo = async () => {
      try {
        if (matchedUserId) {
          const response = await fetch(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${matchedUserId}`);
          const data = await response.json();
          console.log("--- data ---", data);
          
          setMatchedUserName(data.result[0].user_first_name);
          // Parse user_date_interests as JSON and provide empty array fallback
          const preferences = data.result[0].user_date_interests 
            ? JSON.parse(data.result[0].user_date_interests)
            : [];
          setMatchedUserPreferences(preferences);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchMatchedUserInfo();
  }, []);

  // Fetch both users' images
  useEffect(() => {
    const fetchUserImages = async () => {
      try {
        // Get current user ID from storage
        const currentUserId = await AsyncStorage.getItem('user_uid');
        console.log("--- currentUserId ---", currentUserId);
        
        // Fetch current user's image
        if (currentUserId) {
          const currentUserResponse = await fetch(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${currentUserId}`);
          const currentUserData = await currentUserResponse.json();
          const currentUserPhotoUrls = currentUserData.result[0]?.user_photo_url ? 
            JSON.parse(currentUserData.result[0].user_photo_url.replace(/\\"/g, '"')) || [] : [];
          setCurrentUserImage(currentUserPhotoUrls[0] || null);
        }

        // Fetch matched user's image
        if (matchedUserId) {
          const matchedUserResponse = await fetch(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${matchedUserId}`);
          const matchedUserData = await matchedUserResponse.json();
          const matchedUserPhotoUrls = matchedUserData.result[0]?.user_photo_url ? 
            JSON.parse(matchedUserData.result[0].user_photo_url.replace(/\\"/g, '"')) || [] : [];
          setMatchedUserImage(matchedUserPhotoUrls[0] || null);
        }
      } catch (error) {
        console.error('Error fetching user images:', error);
      }
    };

    fetchUserImages();
  }, [matchedUserId]);

  // List of date type options
  const dateOptions = ['Lunch', 'Dinner', 'Coffee', 'Drinks', 'Movies', 'Other'];

  // When an option is pressed, update state
  const handleOptionPress = (option) => {
    setSelectedDateType(option);
  };

  // "Continue" enabled only if there's a selection
  const isFormComplete = selectedDateType !== null;

  const handleContinue = async () => {
    if (isFormComplete) {
      try {
        // Optional: store selection in AsyncStorage
        await AsyncStorage.setItem('user_date_type', selectedDateType);
        console.log('User date type stored:', selectedDateType);
      } catch (error) {
        console.error('Error storing user_date_type:', error);
      }
      // Navigate to the next screen
      navigation.navigate('DateOccurance', { dateType: selectedDateType, matchedUserId: matchedUserId });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={require("../assets/icons/backarrow.png")} />
        </TouchableOpacity>

        {/* Profile images as hearts */}
        <View style={styles.heartsContainer}>
          {/* First heart using MaskedView */}
          <View style={styles.heartWrapper}>
            <MaskedView
              style={styles.maskedView}
              maskElement={
                <Image
                  source={require('../assets/icons/Primaryheart.png')}
                  style={styles.maskImage}
                  resizeMode="contain"
                />
              }
            >
              <Image
                source={currentUserImage ? { uri: currentUserImage } : require('../src/Assets/Images/account.png')}
                style={styles.fullImage}
                defaultSource={require('../src/Assets/Images/account.png')}
              />
            </MaskedView>
            <Image
              source={require('../assets/icons/primaryheartoutline.png')}
              style={styles.heartOutline}
              resizeMode="contain"
            />
          </View>
          
          {/* Second heart using MaskedView */}
          <View style={[styles.heartWrapper, styles.secondHeartWrapper]}>
            <MaskedView
              style={styles.maskedView}
              maskElement={
                <Image
                  source={require('../assets/icons/Secondaryheart.png')}
                  style={styles.maskImage}
                  resizeMode="contain"
                />
              }
            >
              <Image
                source={matchedUserImage ? { uri: matchedUserImage } : require('../src/Assets/Images/account.png')}
                style={styles.fullImage}
                defaultSource={require('../src/Assets/Images/account.png')}
              />
            </MaskedView>
            <Image
              source={require('../assets/icons/secondaryheartoutline.png')}
              style={styles.heartOutline}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Title and subtitle */}
        <View style={styles.content}>
          <Text style={styles.title}>What type of date will it be?</Text>
          <Text style={styles.subtitle}>
            {matchedUserPreferences.length > 0 
              ? `${matchedUserName}'s preferences are ${matchedUserPreferences.join(', ').replace(/, ([^,]*)$/, ' & $1')}.`
              : `${matchedUserName} hasn't set up date preferences yet.`}
          </Text>

          {/* Options list */}
          {dateOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                {
                  backgroundColor: selectedDateType === option ? '#000' : '#FFF',
                  borderColor: '#CCC',
                },
              ]}
              onPress={() => handleOptionPress(option)}
            >
              <Text
                style={{ color: selectedDateType === option ? '#FFF' : '#000' }}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <Pressable
        style={[
          styles.continueButton,
          { backgroundColor: isFormComplete ? '#E4423F' : '#ccc' },
        ]}
        onPress={handleContinue}
        disabled={!isFormComplete}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>

      {/* Three progress dots below the Continue button */}
      <View style={styles.progressDotsContainer}>
        {/* For illustration, we'll highlight the middle dot as "active" */}
        <View style={[styles.dot, { backgroundColor: '#E4423F' }]} />
        <View style={[styles.dot, { backgroundColor: '#ccc' }]} />
        <View style={[styles.dot, { backgroundColor: '#ccc' }]} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Overall container
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  // Back button style
  backButton: {
    alignSelf: "flex-start",
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 30,
  },
  // Hearts container
  heartsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  // Heart images using MaskedView
  heartWrapper: {
    width: 60,
    height: 60,
    position: 'relative',
  },
  secondHeartWrapper: {
    marginLeft: -20,
  },
  maskedView: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskImage: {
    width: 60,
    height: 60,
  },
  fullImage: {
    width: 60,
    height: 60,
    resizeMode: 'cover',
  },
  heartOutline: {
    position: 'absolute',
    width: 60,
    height: 60,
    top: 0,
    left: 0,
  },
  // Body content
  content: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  // Title
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  // Subtitle
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  // Option buttons (pill shape)
  optionButton: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 30,
    marginVertical: 10,
    alignItems: 'center',
  },
  // Continue button
  continueButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    marginBottom: 10, // so there's space for the dots
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Three dots container
  progressDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20, 
  },
  // Single dot
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
