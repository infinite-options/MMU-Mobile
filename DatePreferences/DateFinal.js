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
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';

export default function DateFinal({ navigation }) {
  const route = useRoute();
  const matchedUserId = route.params?.matchedUserId || null;
  const [dateType, setDateType] = useState('Dinner');
  const [dateDay, setDateDay] = useState('Sat, Aug 17');
  const [dateTime, setDateTime] = useState('7:00 pm');
  const [dateLocation, setDateLocation] = useState('96 S 1st St, San Jose, CA 95113');

  useEffect(() => {
    const fetchDateDetails = async () => {
      try {
        const storedDateType = await AsyncStorage.getItem('user_date_type');
        const storedDateDay = await AsyncStorage.getItem('user_date_day');
        const storedDateTime = await AsyncStorage.getItem('user_date_time');
        const storedDateLocation = await AsyncStorage.getItem('selected_location_name');

        if (storedDateType) setDateType(storedDateType);
        if (storedDateDay) setDateDay(storedDateDay);
        if (storedDateTime) setDateTime(storedDateTime);
        if (storedDateLocation) setDateLocation(storedDateLocation);
      } catch (error) {
        console.error('Error retrieving date details from AsyncStorage:', error);
      }
    };

    fetchDateDetails();
  }, []);

  const [invitationSent, setInvitationSent] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Slide completed => show "Invitation Sent" screen
  const handleSlideComplete = async () => {
    setInvitationSent(true);

    try {
      const meetUserId = await AsyncStorage.getItem('user_uid');
      const meetDateUserId = await AsyncStorage.getItem('meet_date_user_id');
      const meetDay = await AsyncStorage.getItem('user_date_day');
      const meetTime = await AsyncStorage.getItem('user_date_time');
      const meetDateType = await AsyncStorage.getItem('user_date_type');
      const meetLocation = await AsyncStorage.getItem('selected_location_name');
      const meetLatitude = await AsyncStorage.getItem('selected_date_location_lat');
      const meetLongitude = await AsyncStorage.getItem('selected_date_location_lat');

      const formData = new FormData();
      formData.append('meet_user_id', meetUserId);
      formData.append('meet_date_user_id', meetDateUserId);
      formData.append('meet_day', meetDay);
      formData.append('meet_time', meetTime);
      formData.append('meet_date_type', meetDateType);
      formData.append('meet_location', meetLocation);
      formData.append('meet_latitude', meetLatitude);
      formData.append('meet_longitude', meetLongitude);
      console.log('formData', formData);
      console.log('Meet User ID:', meetUserId);
      console.log('Meet Date User ID:', meetDateUserId);
      console.log('Meet Day:', meetDay);
      console.log('Meet Time:', meetTime);
      console.log('Meet Date Type:', meetDateType);
      console.log('Meet Location:', meetLocation);
      console.log('Meet Latitude:', meetLatitude);
      console.log('Meet Longitude:', meetLongitude);
        const response = await fetch('https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/meet', {
          method: 'POST',
          body: formData,
        });
        if (response.ok) {
          const result = await response.json();
          console.log('Response from server:', result);
        }
      
    } catch (error) {
      console.error('Error retrieving data from AsyncStorage:', error);
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
    backgroundColor: '#FFF',
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  cancelButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  title: {
    alignSelf: 'center',
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
  },
  subtitle: {
    alignSelf: 'center',
    color: '#888',
    fontSize: 14,
    marginBottom: 20,
  },
  heartsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
  },
  heartImage: {
    borderColor: '#FF4081',
    borderRadius: 40,
    borderWidth: 2,
    height: 80,
    resizeMode: 'cover',
    width: 80,
  },
  heartOverlap: {
    marginLeft: -30,
  },
  detailsContainer: {
    marginHorizontal: 10,
    marginVertical: 10,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 12,
  },
  detailIcon: {
    marginRight: 15,
  },
  detailText: {
    color: '#000',
    fontSize: 16,
  },

  // Cancel Modal
  modalBackground: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    flex: 1,
    justifyContent: 'center',
  },
  modalContainer: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmCancelButton: {
    backgroundColor: '#E4423F',
    borderRadius: 30,
    marginBottom: 15,
    paddingHorizontal: 20,
    paddingVertical: 12,
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
    color: '#000',
    fontSize: 16,
    textDecorationLine: 'underline',
  },

  // Invitation Sent screen
  sentContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  sentTitle: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
  },
  sentSubtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 30,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#E4423F',
    borderRadius: 30,
    height: 50,
    justifyContent: 'center',
    width: '80%',
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
