import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Import your custom SlideToSend
import SlideToSend from '../src/Assets/Components/SlideToSend.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';

export default function DateFinal({ navigation }) {
  const route = useRoute();
  const [matchedUserId, setMatchedUserId] = useState(route.params?.matchedUserId || null);
  const [matchedUserImage, setMatchedUserImage] = useState(null);
  const [currentUserImage, setCurrentUserImage] = useState(null);

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

  useEffect(() => {
    const fetchUserImages = async () => {
      try {
        const currentUserId = await AsyncStorage.getItem('user_uid');
        
        if (currentUserId) {
          const currentUserResponse = await fetch(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${currentUserId}`);
          const currentUserData = await currentUserResponse.json();
          const currentUserPhotoUrls = currentUserData.result[0]?.user_photo_url ? 
            JSON.parse(currentUserData.result[0].user_photo_url.replace(/\\"/g, '"')) || [] : [];
          setCurrentUserImage(currentUserPhotoUrls[0] || null);
        }

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

  const [dateType, setDateType] = useState('No date type selected');
  const [dateDay, setDateDay] = useState('No date day selected');
  const [dateTime, setDateTime] = useState('No date time selected');
  const [dateLocation, setDateLocation] = useState('No date location selected');

  // Replace useEffect with useFocusEffect for screen focus updates
  useFocusEffect(
    React.useCallback(() => {
      const fetchDateDetails = async () => {
        try {
          console.log('DateFinal: Fetching date details');
          
          // First check route.params for any new selections (highest priority)
          if (route.params?.dateType) {
            setDateType(route.params.dateType);
            await AsyncStorage.setItem('user_date_type', route.params.dateType);
          }
          
          if (route.params?.dateDay) {
            setDateDay(route.params.dateDay);
            await AsyncStorage.setItem('user_date_day', route.params.dateDay);
          }
          
          if (route.params?.dateTime) {
            setDateTime(route.params.dateTime);
            await AsyncStorage.setItem('user_date_time', route.params.dateTime);
          }

          // Then check AsyncStorage for saved values (second priority)
          const storedDateType = await AsyncStorage.getItem('user_date_type');
          const storedDateDay = await AsyncStorage.getItem('user_date_day');
          const storedDateTime = await AsyncStorage.getItem('user_date_time');
          const storedDateLocation = await AsyncStorage.getItem('selected_location_name');

          // Set values from AsyncStorage if they exist and weren't already set from route.params
          if (storedDateType && !route.params?.dateType) setDateType(storedDateType);
          if (storedDateDay && !route.params?.dateDay) setDateDay(storedDateDay);
          if (storedDateTime && !route.params?.dateTime) setDateTime(storedDateTime);
          if (storedDateLocation) setDateLocation(storedDateLocation);

          // Special handling for location from route.params
          if (route.params?.location?.name) {
            const locationText = route.params.location.name + ' - ' + route.params.location.address;
            setDateLocation(locationText);
            
            // Save to AsyncStorage for persistence
            await AsyncStorage.setItem('selected_location_name', locationText);
            await AsyncStorage.setItem('selected_date_location_lat', String(route.params.location.latitude));
            await AsyncStorage.setItem('selected_date_location_lng', String(route.params.location.longitude));
          } else if (!storedDateLocation) {
            // Try to parse from savedLocation if no other location is set
            const savedLocationJSON = await AsyncStorage.getItem('savedLocation');
            if (savedLocationJSON) {
              try {
                const savedLocation = JSON.parse(savedLocationJSON);
                if (savedLocation.name) {
                  const locationText = savedLocation.name + (savedLocation.address ? ' - ' + savedLocation.address : '');
                  setDateLocation(locationText);
                  await AsyncStorage.setItem('selected_location_name', locationText);
                  await AsyncStorage.setItem('selected_date_location_lat', String(savedLocation.latitude));
                  await AsyncStorage.setItem('selected_date_location_lng', String(savedLocation.longitude));
                }
              } catch (e) {
                console.error('Error parsing saved location:', e);
              }
            }
          }

          // Fallback to API endpoint only if we don't have critical data yet (lowest priority)
          const hasDateInfo = storedDateType || storedDateDay || storedDateTime || storedDateLocation || 
                             route.params?.dateType || route.params?.dateDay || 
                             route.params?.dateTime || route.params?.location;
                             
          if (!hasDateInfo) {
            console.log('DateFinal: No local data found, fetching from API');
            const meetUserId = await AsyncStorage.getItem('user_uid');
            if (meetUserId && matchedUserId) {
              try {
                const checkUrl = `https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/meet/${meetUserId}`;
                const checkResponse = await fetch(checkUrl, { method: "GET" });
                if (checkResponse.ok) {
                  const checkData = await checkResponse.json();
                  let resultArray = [];
                  if (Array.isArray(checkData)) {
                    resultArray = checkData;
                  } else if (checkData.result && Array.isArray(checkData.result)) {
                    resultArray = checkData.result;
                  } else {
                    resultArray = [checkData];
                  }
                  
                  const matchingMeet = resultArray.find(item => item.meet_date_user_id === matchedUserId);
                  if (matchingMeet) {
                    console.log('DateFinal: Found matching meet in API data');
                    // Set values from meet data and store them in AsyncStorage
                    if (matchingMeet.meet_date_type) {
                      setDateType(matchingMeet.meet_date_type);
                      await AsyncStorage.setItem('user_date_type', matchingMeet.meet_date_type);
                    }
                    
                    if (matchingMeet.meet_day) {
                      setDateDay(matchingMeet.meet_day);
                      await AsyncStorage.setItem('user_date_day', matchingMeet.meet_day);
                    }
                    
                    if (matchingMeet.meet_time) {
                      setDateTime(matchingMeet.meet_time);
                      await AsyncStorage.setItem('user_date_time', matchingMeet.meet_time);
                    }
                    
                    if (matchingMeet.meet_location) {
                      setDateLocation(matchingMeet.meet_location);
                      await AsyncStorage.setItem('selected_location_name', matchingMeet.meet_location);
                    }
                  }
                }
              } catch (error) {
                console.error('Error fetching meet data:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error retrieving date details:', error);
        }
      };

      fetchDateDetails();
    }, [matchedUserId, route.params])
  );

  const [invitationSent, setInvitationSent] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Slide completed => show "Invitation Sent" screen
  const handleSlideComplete = async () => {
    setInvitationSent(true);
    try {
      const meetUserId = await AsyncStorage.getItem('user_uid');
      const meetDateUserId = matchedUserId;
      const meetDay = await AsyncStorage.getItem('user_date_day');
      const meetTime = await AsyncStorage.getItem('user_date_time');
      const meetDateType = await AsyncStorage.getItem('user_date_type');
      const meetLocation = await AsyncStorage.getItem('selected_location_name');
      const meetLatitude = await AsyncStorage.getItem('selected_date_location_lat');
      const meetLongitude = await AsyncStorage.getItem('selected_date_location_lng');

      // Clear date-related AsyncStorage values after retrieving them
      await Promise.all([
        AsyncStorage.removeItem('matchedUserId'),
        AsyncStorage.removeItem('user_date_type'),
        AsyncStorage.removeItem('user_date_day'),
        AsyncStorage.removeItem('user_date_time'),
        AsyncStorage.removeItem('selected_location_name'),
        AsyncStorage.removeItem('selected_date_location_lat'),
        AsyncStorage.removeItem('selected_date_location_lng')
      ]);

      // Check if a meet already exists between the users
      let existingMeet = false;
      let existingMeetData = null;
      try {
        const checkUrl = `https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/meet/${meetUserId}`;
        const checkResponse = await fetch(checkUrl, { method: "GET" });
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          if (checkData && (((Array.isArray(checkData) && checkData.length > 0)) || (checkData.result && Array.isArray(checkData.result) && checkData.result.length > 0))) {
            let resultArray = [];
            if (Array.isArray(checkData)) {
              resultArray = checkData;
            } else if (checkData.result && Array.isArray(checkData.result)) {
              resultArray = checkData.result;
            } else {
              resultArray = [checkData];
            }
            const matchingMeet = resultArray.find(item => item.meet_date_user_id === meetDateUserId);
            console.log('Matching meet:', matchingMeet);
            if (matchingMeet) {
              existingMeet = true;
              existingMeetData = matchingMeet;
            } else {
              console.log('No matching meet found for meetDateUserId:', meetDateUserId);
            }
          } else {
            console.log('checkData does not contain a valid result array');
          }
        }
        console.log('Existing meet:', existingMeetData);
      } catch (error) {
        console.error('Error checking for existing meet:', error);
      }
      
      let response;
      if (existingMeet && existingMeetData) {
        // Use PUT to update the existing meet with new date information using the retrieved meet_uid
        const formData = new FormData();
        formData.append('meet_uid', existingMeetData.meet_uid);
        formData.append('meet_user_id', meetUserId);
        formData.append('meet_date_user_id', meetDateUserId);
        formData.append('meet_day', meetDay);
        formData.append('meet_time', meetTime);
        formData.append('meet_date_type', meetDateType);
        formData.append('meet_location', meetLocation);
        formData.append('meet_latitude', meetLatitude);
        formData.append('meet_longitude', meetLongitude);
        formData.append('meet_confirmed', 0);
        console.log('Existing meet found. Updating with PUT using meet_uid:', existingMeetData.meet_uid);
        response = await fetch('https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/meet', {
          method: "PUT",
          body: formData,
        });
      } else {
        // Create a new meet using POST with values from AsyncStorage
        const formData = new FormData();
        formData.append('meet_user_id', meetUserId);
        formData.append('meet_date_user_id', meetDateUserId);
        formData.append('meet_day', meetDay);
        formData.append('meet_time', meetTime);
        formData.append('meet_date_type', meetDateType);
        formData.append('meet_location', meetLocation);
        formData.append('meet_latitude', meetLatitude);
        formData.append('meet_longitude', meetLongitude);
        console.log('No existing meet. Creating new meet with POST');
        response = await fetch('https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/meet', {
          method: "POST",
          body: formData,
        });
      }
      
      if (response.ok) {
        const result = await response.json();
        console.log("Response from server:", result);
        // Send date invitation message to messages endpoint
        const messageText = `Date Invitation:\nType: ${dateType}\nDate: ${dateDay}\nTime: ${dateTime}\nLocation: ${dateLocation}`;
        await axios.post(
          'https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/messages',
          {
            sender_id: meetUserId,
            receiver_id: meetDateUserId,
            message_content: messageText
          },
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (error) {
      console.error('Error in handleSlideComplete:', error);
    }
  };

  // Confirm cancel => exit or go back
  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    navigation.navigate('MatchResultsPage',{  matchedUserId: matchedUserId });
  };

  if (invitationSent) {
    // RENDER "Invitation Sent" Layout
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.sentContainer}>
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
          <Text style={styles.sentTitle}>Invitation Sent!</Text>
          <Text style={styles.sentSubtitle}>
            Your date invitation was successfully sent.
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('MatchResultsPage',{  matchedUserId: matchedUserId })}
          >
            <Text style={styles.backButtonText}>Back to my matches</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Otherwise, show the "Confirm Date Details" + Slide
  return (
    <SafeAreaView style={styles.container}>
      {/* Cancel (X) in top right */}
      <TouchableOpacity
  style={styles.cancelButton}
  onPress={() => {
    console.log('X was pressed!');
    setShowCancelModal(true);
  }}
>
        <Ionicons name="close" size={28} color="red" />
      </TouchableOpacity>

      <Text style={styles.title}>Confirm date details!</Text>
      <Text style={styles.subtitle}>Tap on any info to edit.</Text>

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

      {/* Example: Date Info */}
      <View style={styles.detailsContainer}>
        {/* Date Type */}
        <TouchableOpacity
          style={styles.detailRow}
          onPress={() => navigation.navigate('DateType',{ matchedUserId: matchedUserId })}
        >
          <Ionicons name="people" size={24} color="#666" style={styles.detailIcon} />
          <Text style={styles.detailText}>{dateType}</Text>
        </TouchableOpacity>

        {/* Day */}
        <TouchableOpacity
          style={styles.detailRow}
          onPress={() => navigation.navigate('DateOccurance',{ matchedUserId: matchedUserId })}
        >
          <Ionicons name="calendar" size={24} color="#666" style={styles.detailIcon} />
          <Text style={styles.detailText}>{dateDay}</Text>
        </TouchableOpacity>

        {/* Time */}
        <TouchableOpacity
          style={styles.detailRow}
          onPress={() => navigation.navigate('DateOccurance',{ matchedUserId: matchedUserId })}
        >
          <Ionicons name="time" size={24} color="#666" style={styles.detailIcon} />
          <Text style={styles.detailText}>{dateTime}</Text>
        </TouchableOpacity>

        {/* Location */}
        <TouchableOpacity
          style={styles.detailRow}
          onPress={() => navigation.navigate('DateLocation',{ matchedUserId: matchedUserId })}
        >
          <Ionicons name="location-sharp" size={24} color="#666" style={styles.detailIcon} />
          <Text style={styles.detailText}>{dateLocation}</Text>
        </TouchableOpacity>
      </View>

      {/* Slide to send at bottom */}
      <View style={{ flex: 1, justifyContent: 'flex-end', marginBottom: 40 }}>
        <SlideToSend onSlideSuccess={handleSlideComplete} />
      </View>

      {/* Cancel Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cancel Invitation?</Text>
            <Text style={styles.modalSubtitle}>
              All information entered will be lost.
            </Text>

            <TouchableOpacity
              style={styles.confirmCancelButton}
              onPress={handleConfirmCancel}
            >
              <Text style={styles.confirmCancelText}>Yes, cancel invitation</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.neverMindButton}
              onPress={() => setShowCancelModal(false)}
            >
              <Text style={styles.neverMindText}>No, continue planning date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
// return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
//       <TouchableOpacity
//         onPress={() => {
//           console.log('X Pressed!');
//           alert('Pressed X');
//         }}
//         style={{
//           marginTop: 100,         // <-- Move it down
//           width: 50,
//           height: 50,
//           backgroundColor: 'red',
//         }}
//       />
//     </SafeAreaView>
//   );
  
}

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  cancelButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 10,
    marginBottom: 5,
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
    alignSelf: 'center',
  },
  heartsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },
  heartWrapper: {
    width: 130,
    height: 130,
    position: 'relative',
  },
  secondHeartWrapper: {
    marginLeft: -25,
    marginTop: -15,
  },
  maskedView: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskImage: {
    width: 130,
    height: 130,
  },
  fullImage: {
    width: 130,
    height: 130,
    resizeMode: 'cover',
  },
  detailsContainer: {
    marginHorizontal: 10,
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  detailIcon: {
    marginRight: 15,
  },
  detailText: {
    fontSize: 16,
    color: '#000',
  },

  // Cancel Modal
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmCancelButton: {
    backgroundColor: '#E4423F',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 15,
  },
  confirmCancelText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  neverMindButton: {
    marginBottom: 10,
  },
  neverMindText: {
    fontSize: 16,
    color: '#000',
    textDecorationLine: 'underline',
  },

  // Invitation Sent screen
  sentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 20,
    marginBottom: 10,
  },
  sentSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 30,
  },
  backButton: {
    width: '80%',
    height: 50,
    backgroundColor: '#E4423F',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  heartOutline: {
    position: 'absolute',
    width: 130,
    height: 130,
    top: 0,
    left: 0,
  },
});
