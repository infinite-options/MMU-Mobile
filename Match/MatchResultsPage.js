import React, { useState, useEffect } from 'react';
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
  
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import { useNavigation } from '@react-navigation/native';
// Example placeholders for bottom navigation icons

const BottomNav = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.bottomNavContainer}>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Preferences')}>
        <Image source={require('../assets/icons/search.png')} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('MatchResultsPage')}>
        <Image source={require('../assets/icons/twoheartsfilled.png')} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Chat')}>
        <Image source={require('../assets/icons/chat.png')}  />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('MyProfile')}>
        <Image source={require('../assets/icons/profileoutline.png')} />
      </TouchableOpacity>
    </View>
  );
};
// Utility to parse JSON safely
function safeJsonParse(value, fallback = []) {
    // If value is null or not a string, just return fallback
    if (typeof value !== 'string') {
      return fallback;
    }
    // Otherwise parse
    try {
      return JSON.parse(value);
    } catch (err) {
      console.warn('Failed to parse JSON:', value, err);
      return fallback;
    }
  }

const MatchResultsPage = () => {
  const [userId, setUserId] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [matchedResults, setMatchedResults] = useState([]);
  const [interestedInMe, setInterestedInMe] = useState([]);
  const [interestedIn, setInterestedIn] = useState([]);
  
  // This stores whether each matched user has an existing meet
  // Example structure: { '100-000111': true, '100-000112': false }
  const [meetStatus, setMeetStatus] = useState({});
  const [meetSelfStatus, setMeetSelfStatus] = useState({});

  const navigation = useNavigation();

  const handleMenuOpen = () => setMenuVisible(true);
  const handleMenuClose = () => setMenuVisible(false);

  // Load user UID from AsyncStorage
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

  // Fetch matching results from API
  const findMatchesResult = async () => {
    if (!userId) return; // If not yet loaded, skip
    try {
      const apiUrl = `https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/likes/${userId}`;
      // First get raw text to debug if needed:
      const response = await fetch(apiUrl);
      const text = await response.text();
      // Debug:
      console.log('--- Raw server response ---', text);

      // Now parse the text as JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr);
        Alert.alert('Error', 'Failed to parse server response.');
        return; // Stop here if parse fails
      }

      // If parse succeeded, proceed
      console.log('--- data ---', data);

      setMatchedResults(data.matched_results || []);
      setInterestedInMe(data.people_who_selected_you || []);
      setInterestedIn(data.people_whom_you_selected || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      Alert.alert('Error', 'An error occurred while finding matches.');
    }
  };

  useEffect(() => {
    if (userId) {
      findMatchesResult();
    }
  }, [userId]);

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
        console.warn('Error fetching meet data for self users:', err);
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
          console.log('--- theirUserId ---', theirUserId);
          const meetUrl = `https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/meet/${theirUserId}`;
          
          try {
            const res = await axios.get(meetUrl);
            
            // Handle case where data is missing or malformed
            const resultData = res.data?.result || [];
            const meets = Array.isArray(resultData) ? resultData : [];
            
            newMeetStatus[theirUserId] = meets.length > 0;
          } catch (err) {
            console.warn('Error fetching meet data for user:', theirUserId, err);
            newMeetStatus[theirUserId] = false; // Default to no meet
          }
        }

        setMeetStatus(newMeetStatus);
      } catch (err) {
        console.warn('Error fetching meet data for matched users:', err);
      }
    };

    fetchMeetStatus();
  }, [matchedResults]);

  // Render "Set up date" or "See invitation" depending on meet status
  // Also handle button press to navigate to DateType or Chat
  const handleButtonPress = (matchId) => {
    if (meetStatus[matchId]) {
      // Pass the matched user UID to Chat
      navigation.navigate('Chat', { matchedUserId: matchId });
    } else {
      // Also pass the UID to DateType
      navigation.navigate('DateType', { matchedUserId: matchId });
    }
  };

  const renderMatchRow = (
    firstname,
    lastname,
    interests,
    imgSrc,
    buttonLabel = null,
    matchId = null
  ) => {
    // Decide which label to show (we ignore the passed buttonLabel here intentionally,
    // because we override with either "See invitation" or "Set up date" below).
    const hasMeet = meetStatus[matchId] || false;
    console.log('--- hasMeet ---', hasMeet);
    const hasMeetSelf = meetSelfStatus[matchId] || false;
    console.log('--- hasMeetSelf ---', hasMeetSelf);
    const dynamicButtonLabel = hasMeet ? 'See invitation' : hasMeetSelf ? 'change date' : 'Set up date';
    console.log('--- dynamicButtonLabel ---', dynamicButtonLabel);

    return (
      <View
        style={styles.matchRow}
        key={`${firstname}-${matchId}-${Math.random()}`}
      >
        <View style={styles.matchRowLeft}>
          <Image 
            source={imgSrc ? { uri: imgSrc } : require('../assets/account.png')} 
            style={styles.avatar} 
          />
          <View>
            <Text style={styles.matchName}>{firstname} {lastname}</Text>
            <Text style={styles.matchSubText}>
              {interests} interests in common
            </Text>
          </View>
        </View>
        <View style={styles.matchRowRight}>
          <TouchableOpacity
            style={[
              styles.matchButton,
              dynamicButtonLabel === 'Set up date'
                ? styles.setUpDateButton
                : styles.defaultButtonBorder,
            ]}
            onPress={() => handleButtonPress(matchId)}
          >
            <Text
              style={[
                styles.matchButtonText,
                dynamicButtonLabel === 'Set up date'
                  ? { color: '#fff' }
                  : { color: '#E4423F' },
              ]}
            >
              {dynamicButtonLabel}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton}>
            <Text style={styles.closeButtonIcon}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  const renderInterestedInMeRow = (fname, lname, interests, imgSrc, buttonLabel = 'Match', matchId = null) => {
    return (
      <View
        style={styles.matchRow}
        key={`${fname}-${matchId}`}
      >
        <View style={styles.matchRowLeft}>
          <Image 
            source={imgSrc ? { uri: imgSrc } : require('../assets/account.png')} 
            style={styles.avatar} 
          />
          <View>
            <Text style={styles.matchName}>{fname} {lname}</Text>
            <Text style={styles.matchSubText}>
              {interests} interests in common
            </Text>
          </View>
        </View>
        <View style={styles.matchRowRight}>
          <TouchableOpacity
            style={[styles.matchButton, styles.setUpDateButton]}
            onPress={() => navigation.navigate('MatchProfileDisplay', { matchedUserId: matchId })}
          >
            <Text style={[styles.matchButtonText, { color: '#fff' }]}>
              {buttonLabel}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton}>
            <Text style={styles.closeButtonIcon}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  const renderInterestedInRow = (fname, lname, interests, imgSrc, buttonLabel = null, matchId = null) => {
    return (
      <View
        style={styles.matchRow}
        key={`${fname}-${matchId}`}
      >
        <View style={styles.matchRowLeft}>
          <Image 
            source={imgSrc ? { uri: imgSrc } : require('../assets/account.png')} 
            style={styles.avatar} 
          />
          <View>
            <Text style={styles.matchName}>{fname} {lname}</Text>
            <Text style={styles.matchSubText}>
              {interests} interests in common
            </Text>
          </View>
        </View>
        <View style={styles.matchRowRight}>
          <TouchableOpacity style={styles.closeButton}>
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
            <TouchableOpacity onPress={() => Alert.alert('Notifications!')}>
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
              const firstPhoto = photoUrls[0] || null;
              return renderMatchRow(
                match.user_first_name,
                match.user_last_name,
                match.common_interests || '0',
                firstPhoto,
                'Set up date or see invitation',
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
              const firstPhoto = photoUrls[0] || null;
              return renderInterestedInMeRow(
                match.user_first_name,
                match.user_last_name,
                match.common_interests || '0',
                firstPhoto,
                'Match',
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
              const firstPhoto = photoUrls[0] || null;
              return renderInterestedInRow(
                match.user_first_name,
                match.user_last_name,
                match.common_interests || '0',
                firstPhoto,
                'See Profile',
                match.user_uid
              );
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
  avatar: {
    backgroundColor: '#ccc',
    borderRadius: 28,
    height: 56,
    marginRight: 8,
    width: 56,
  },
  bottomIcon: {
    height: 28,
    resizeMode: 'contain',
    width: 28,
  },
  bottomNav: {
    alignItems: 'center',
    borderTopColor: '#ddd',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  bottomNavContainer: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderTopColor: '#EEE',
    borderTopWidth: 2,
    bottom: 0,
    flexDirection: 'row',
    height: 60,
    justifyContent: 'space-around',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  container: {
    alignItems: 'stretch',
    backgroundColor: '#FFF',
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  defaultButtonBorder: {
    borderColor: '#E4423F',
  },
  divider: {
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    marginVertical: 16,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  headerIcons: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerTitle: {
    fontFamily: 'Lexend', // Or your desired font
    fontWeight: '500',
    fontSize: 21,
    color: '#1A1A1A',
  },
  icon: {
    color: '#888',
    fontSize: 24,
  },
  matchButton: {
    borderRadius: 30,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  matchButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  matchName: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  matchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  matchRowLeft: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  matchRowRight: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  matchSubText: {
    color: '#666',
    fontSize: 12,
  },
  menuContainer: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 8,
    elevation: 5, // Shadow on Android
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },
  menuItem: {
    padding: 8,
  },
  navButton: {},
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMatchesText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  scrollArea: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionTitle: {
    color: '#757575',
    fontFamily: 'Lexend',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'left',
  },
  setUpDateButton: {
    backgroundColor: '#E4423F',
    borderColor: '#E4423F',
  },
});
