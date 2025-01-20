import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUserInfo } from "../Api.js";
import { Video } from 'expo-av';
// Import images
const profile = require('../src/Assets/Images/profile.png');
const setting = require('../src/Assets/Images/setting.png');
const card = require('../src/Assets/Images/card.png');
const search = require('../src/Assets/Images/search.png');
const group = require('../src/Assets/Images/group.png');
const upload = require('../src/Assets/Images/upload.png');
const heightImg = require('../src/Assets/Images/height.png');
const genderImg = require('../src/Assets/Images/gender.png');
const faith = require('../src/Assets/Images/faith.png');
const star = require('../src/Assets/Images/star.png');
const multi = require('../src/Assets/Images/multi.png');
const hat = require('../src/Assets/Images/hat.png');
const heartImg = require('../src/Assets/Images/heart.png');
const jobImg = require('../src/Assets/Images/job.png');
const drinkImg = require('../src/Assets/Images/drink.png');
const smokeImg = require('../src/Assets/Images/smoke.png');
const flagImg = require('../src/Assets/Images/flag.png');
const diamond = require('../src/Assets/Images/diamond.png');
const time = require('../src/Assets/Images/time.png');

const AccountInfo = ({ img, info }) => (
  <View style={styles.accountInfoContainer}>
    <Image source={img} style={styles.accountInfoImage} />
    <Text style={styles.accountInfoText}>{info}</Text>
  </View>
);

const Profile = () => {
  const navigation = useNavigation();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const uid = await AsyncStorage.getItem('user_uid');
        const data = await fetchUserInfo(uid);
        if (isMounted) {
          setUserInfo(data);
        }
      } catch (error) {
        if (isMounted) {
          setError(error.message);
          console.error('Error fetching userInfo:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  const handleSetting = () =>{
    navigation .navigate ("AccountDetails")
  }
  const handleUpdate = () => {
    navigation.navigate('AccountSetup3Create');
  };

  const handlePreferences = () => {
    navigation.navigate('MatchPreferences');
  };

  const handleSelections = () => {
    navigation.navigate('AccountSetup3Create');
  };

  const handleUpl = () => {
    navigation.navigate("AccountSetup5Create");
  };

  const interestArray = userInfo?.user_general_interests?.split(',').map(item => item.trim()) || [];
  const openTo = userInfo?.user_open_to ? JSON.parse(userInfo.user_open_to) : [];
  const images = userInfo?.user_photo_url ? JSON.parse(userInfo.user_photo_url) : [];
  let videoUrl = userInfo?.user_video_url;
  if (videoUrl) {
    videoUrl = JSON.parse(videoUrl); // Remove escaped quotes from the URL string
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <Image source={profile} style={styles.iconImage} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePreferences} style={styles.iconButton}>
          <Image source={search} style={styles.iconImage} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSelections} style={styles.iconButton}>
          <Image source={group} style={styles.iconImage} />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>About You</Text>

      <View style={styles.imageContainer}>
        {images.slice(0, 3).map((imgUrl, index) => (
          <Image key={index} source={{ uri: imgUrl }} style={styles.image} />
        ))}
        
      </View>
      {videoUrl ? (
        <Video
          source={{ uri: videoUrl }}
          style={styles.video}
          useNativeControls
          resizeMode="contain"
        />
      ) : (
        <Text style={styles.noVideoText}>No video available</Text>
      )}
      <TouchableOpacity onPress={handleUpl} style={styles.uploadButton}>
        <Text style={styles.uploadButtonText}>Upload</Text>
        <Image source={upload} style={styles.uploadButtonImage} />
      </TouchableOpacity>

      <Text style={styles.name}>{userInfo.user_first_name} {userInfo.user_last_name}</Text>
      <Text style={styles.subtitle}>{userInfo.user_age} - {userInfo.user_gender} - {userInfo.user_suburb}</Text>

      <Text style={styles.subtitle}>Interests</Text>
      <View style={styles.interestsContainer}>
        {interestArray.map((interest, index) => (
          <View key={index} style={styles.interestItem}>
            <Text style={styles.interestText}>{interest}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.subtitle}>A Little About Me ...</Text>
      <Text style={styles.description}>{userInfo.user_profile_bio}</Text>

      <AccountInfo img={heightImg} info={userInfo.user_height} />
      <AccountInfo img={genderImg} info={userInfo.user_gender} />
      <AccountInfo img={faith} info={userInfo.user_religion} />
      <AccountInfo img={star} info={userInfo.user_star_sign} />
      <AccountInfo img={multi} info={userInfo.user_sexuality} />
      <AccountInfo img={multi} info={openTo.join(', ')} />
      <AccountInfo img={hat} info={userInfo.user_education} />
      <AccountInfo img={heartImg} info={userInfo.user_body_composition} />
      <AccountInfo img={jobImg} info={userInfo.user_job} />
      <AccountInfo img={drinkImg} info={userInfo.user_drinking} />
      <AccountInfo img={smokeImg} info={userInfo.user_smoking} />
      <AccountInfo img={flagImg} info={userInfo.user_nationality} />

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleUpdate} style={styles.updateButton}>
          <Text style={styles.updateButtonText}>Update Profile</Text>
        </TouchableOpacity>
        <View style={styles.footerIcons}>
          <TouchableOpacity  onPress = {handleSetting} style={styles.footerIconButton}>
            <Image source={setting} style={styles.footerIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerIconButton}>
            <Image source={card} style={styles.footerIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerIconButton}>
            <Image source={diamond} style={styles.footerIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerIconButton}>
            <Image source={time} style={styles.footerIcon} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handlePreferences} style={styles.nextButton}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconButton: {
    margin: 8,
  },
  iconImage: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 30,
    textAlign: 'center',
    marginVertical: 16,
  },
  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  image: {
    width: '48%',
    height: 100,
    resizeMode: 'cover',
  },
  uploadButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    borderRadius: 25,
    height: 45,
    marginBottom: 16,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 18,
    paddingHorizontal: 10,
  },
  uploadButtonImage: {
    width: 24,
    height: 24,
  },
  name: {
    fontSize: 30,
    textAlign: 'center',
    marginVertical: 8,
  },
  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 8,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginVertical: 16,
  },
  interestItem: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    margin: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  interestText: {
    fontSize: 16,
    color: '#000',
  },
  description: {
    fontSize: 14,
    marginVertical: 16,
  },
  accountInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  accountInfoImage: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  video: {
    width: '100%',
    height: 300,
  },
  accountInfoText: {
    fontSize: 16,
  },
  videoPlayer: {
    width: '100%',
    height: 200,
    marginVertical: 16,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  updateButton: {
    backgroundColor: 'black',
    borderRadius: 25,
    height: 45,
    width: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 18,
  },
  footerIcons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  footerIconButton: {
    backgroundColor: '#CECECE',
    borderRadius: 25,
    marginHorizontal: 5,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerIcon: {
    width: 24,
    height: 24,
  },
  nextButton: {
    backgroundColor: 'red',
    borderRadius: 25,
    height: 45,
    width: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
  },
});

export default Profile;
