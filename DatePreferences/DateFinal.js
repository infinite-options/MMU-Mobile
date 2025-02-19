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

export default function DateFinal({ navigation }) {
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

  const [dateType, setDateType] = useState('No date type selected');
  const [dateDay, setDateDay] = useState('No date day selected');
  const [dateTime, setDateTime] = useState('No date time selected');
  const [dateLocation, setDateLocation] = useState('No date location selected');

  // Replace useEffect with useFocusEffect for screen focus updates
  useFocusEffect(
    React.useCallback(() => {
      const fetchDateDetails = async () => {
        try {
          // First check AsyncStorage values
          const storedDateType = await AsyncStorage.getItem('user_date_type');
          const storedDateDay = await AsyncStorage.getItem('user_date_day');
          const storedDateTime = await AsyncStorage.getItem('user_date_time');
          const storedDateLocation = await AsyncStorage.getItem('selected_location_name');

          // Always set values from AsyncStorage if they exist, as they are the most recent
          if (storedDateType) setDateType(storedDateType);
          if (storedDateDay) setDateDay(storedDateDay);
          if (storedDateTime) setDateTime(storedDateTime);
          if (storedDateLocation) setDateLocation(storedDateLocation);

          // Only fetch from endpoint if ALL AsyncStorage values are missing
          if (!storedDateType && !storedDateDay && !storedDateTime && !storedDateLocation) {
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
                    // Set default values from meet data only if ALL AsyncStorage values are missing
                    setDateType(matchingMeet.meet_date_type || 'Dinner');
                    setDateDay(matchingMeet.meet_day || 'Sat, Aug 17');
                    setDateTime(matchingMeet.meet_time || '7:00 pm');
                    setDateLocation(matchingMeet.meet_location || '96 S 1st St, San Jose, CA 95113');
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
    }, [matchedUserId])
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
      const meetLongitude = await AsyncStorage.getItem('selected_date_location_lat');

      // Clear date-related AsyncStorage values after retrieving them
      await Promise.all([
        AsyncStorage.removeItem('matchedUserId'),
        AsyncStorage.removeItem('user_date_type'),
        AsyncStorage.removeItem('user_date_day'),
        AsyncStorage.removeItem('user_date_time'),
        AsyncStorage.removeItem('selected_location_name'),
        AsyncStorage.removeItem('selected_date_location_lat'),
        AsyncStorage.removeItem('selected_date_location_lat')
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
    navigation.popToTop();
  };

  if (invitationSent) {
    // RENDER "Invitation Sent" Layout
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.sentContainer}>
          <View style={styles.heartsContainer}>
            <Image
              source={require('../src/Assets/Images/match1.png')}
              style={styles.heartImage}
            />
            <Image
              source={require('../src/Assets/Images/match2.png')}
              style={[styles.heartImage, styles.heartOverlap]}
            />
          </View>
          <Text style={styles.sentTitle}>Invitation Sent!</Text>
          <Text style={styles.sentSubtitle}>
            Your date invitation was successfully sent.
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('MatchResultsPage',{  matchedUserId: matchedUserId })}
          >
            <Text style={styles.backButtonText}>Back to my matches(Temp chat)</Text>
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
        <Image
          source={require('../src/Assets/Images/match1.png')}
          style={styles.heartImage}
        />
        <Image
          source={require('../src/Assets/Images/match2.png')}
          style={[styles.heartImage, styles.heartOverlap]}
        />
      </View>

      {/* Example: Date Info */}
      <View style={styles.detailsContainer}>
        {/* Date Type */}
        <TouchableOpacity
          style={styles.detailRow}
          onPress={() => navigation.navigate('DateType')}
        >
          <Ionicons name="people" size={24} color="#666" style={styles.detailIcon} />
          <Text style={styles.detailText}>{dateType}</Text>
        </TouchableOpacity>

        {/* Day */}
        <TouchableOpacity
          style={styles.detailRow}
          onPress={() => navigation.navigate('DateOccurance')}
        >
          <Ionicons name="calendar" size={24} color="#666" style={styles.detailIcon} />
          <Text style={styles.detailText}>{dateDay}</Text>
        </TouchableOpacity>

        {/* Time */}
        <TouchableOpacity
          style={styles.detailRow}
          onPress={() => navigation.navigate('DateOccurance')}
        >
          <Ionicons name="time" size={24} color="#666" style={styles.detailIcon} />
          <Text style={styles.detailText}>{dateTime}</Text>
        </TouchableOpacity>

        {/* Location */}
        <TouchableOpacity
          style={styles.detailRow}
          onPress={() => navigation.navigate('DateLocation')}
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
    marginBottom: 25,
  },
  heartImage: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FF4081',
  },
  heartOverlap: {
    marginLeft: -30,
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
});
