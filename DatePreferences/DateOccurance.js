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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function DateOccurance({ navigation }) {
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
  // Track selected day (index or null)
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);

  // Enhanced time state with formatting
  const [timeState, setTimeState] = useState({
    formattedInput: '',
    hour: 0,
    minute: 0
  });

  // Track AM/PM selection
  const [amPm, setAmPm] = useState(null);

  // Days array with single letters for display
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  // Full day names for storage and API
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Add state for user info
  const [matchedUserName, setMatchedUserName] = useState('');
  const [matchedUserAvailability, setMatchedUserAvailability] = useState([]);

  // Add state for user images
  const [matchedUserImage, setMatchedUserImage] = useState(null);
  const [currentUserImage, setCurrentUserImage] = useState(null);

  // Add useEffect to load previously selected day and time
  useEffect(() => {
    const loadSavedDayAndTime = async () => {
      try {
        // Load previously saved day
        const savedDay = await AsyncStorage.getItem('user_date_day');
        if (savedDay) {
          // Find the index of the saved day in the fullDayNames array
          const dayIndex = fullDayNames.findIndex(day => day === savedDay);
          if (dayIndex !== -1) {
            setSelectedDayIndex(dayIndex);
          }
        }
        
        // Load previously saved time
        const savedTime = await AsyncStorage.getItem('user_date_time');
        if (savedTime) {
          // Parse the time format (e.g., "7:30 PM")
          const timeParts = savedTime.split(' ');
          if (timeParts.length === 2) {
            const [timeString, periodStr] = timeParts;
            const [hourStr, minuteStr] = timeString.split(':');
            
            // Set time values
            const hour = parseInt(hourStr, 10);
            const minute = parseInt(minuteStr, 10);
            
            setTimeState({
              formattedInput: timeString,
              hour: hour,
              minute: minute
            });
            
            // Set AM/PM
            setAmPm(periodStr);
          }
        }
      } catch (error) {
        console.error('Error loading saved day and time:', error);
      }
    };
    
    loadSavedDayAndTime();
  }, []);

  // Helper function to format time string for display and storage
  const formatTime = () => {
    if (!timeState.formattedInput) return '';
    const hour = timeState.hour || 12; // Default to 12 if hour is 0
    const minute = timeState.minute.toString().padStart(2, '0');
    return `${hour}:${minute} ${amPm}`;
  };

  // Fetch user info when component mounts
  useEffect(() => {
    const fetchMatchedUserInfo = async () => {
      try {
        if (matchedUserId) {
          const response = await fetch(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${matchedUserId}`);
          const data = await response.json();
          const userData = data.result[0];
          console.log("--- userData ---", userData);
          setMatchedUserName(userData?.user_first_name || 'Your match');
          const rawAvailability = userData?.user_available_time;
          const availability = rawAvailability
            ? JSON.parse(rawAvailability).map(slot => 
                `${slot.day}, ${slot.start_time} to ${slot.end_time}`
              )
            : [];
          setMatchedUserAvailability(availability);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    fetchMatchedUserInfo();
  }, [matchedUserId]);

  // Fetch both users' images
  useEffect(() => {
    const fetchUserImages = async () => {
      try {
        // Get current user ID from storage
        const currentUserId = await AsyncStorage.getItem('user_uid');
        
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

  // Handler to pick a single day
  const handleDayPress = (index) => {
    setSelectedDayIndex(index);
  };

  // Handler to pick AM/PM
  const handleAmPmPress = (val) => {
    setAmPm(val);
  };

  // Handler for time input with formatting and validation
  const handleTimeChange = (val) => {
    // Allow only numbers
    const digitsOnly = val.replace(/[^0-9]/g, '');
    
    // Format time as user types (HH:MM)
    let formatted = '';
    if (digitsOnly.length > 0) {
      // First digit of hour
      const hour1 = parseInt(digitsOnly[0], 10);
      // Only allow 0, 1 as first digit if there's a second digit
      if (digitsOnly.length > 1 && hour1 > 1) {
        return; // Invalid hour first digit
      }
      
      if (digitsOnly.length === 1) {
        formatted = digitsOnly[0];
      } else if (digitsOnly.length === 2) {
        // Check for valid hour
        const hour = parseInt(digitsOnly.substring(0, 2), 10);
        if (hour === 0 || hour > 12) return; // Invalid hour
        formatted = digitsOnly.substring(0, 2) + ':';
      } else if (digitsOnly.length >= 3) {
        // Add minutes
        const hour = parseInt(digitsOnly.substring(0, 2), 10);
        if (hour === 0 || hour > 12) return; // Invalid hour
        
        const min1 = parseInt(digitsOnly[2], 10);
        if (min1 > 5) return; // First minute digit can only be 0-5
        
        if (digitsOnly.length === 3) {
          formatted = digitsOnly.substring(0, 2) + ':' + digitsOnly[2];
        } else {
          const minutes = parseInt(digitsOnly.substring(2, 4), 10);
          if (minutes > 59) return; // Invalid minutes
          formatted = digitsOnly.substring(0, 2) + ':' + digitsOnly.substring(2, 4);
        }
      }
    }
    
    // Update state with formatted value and actual time values
    setTimeState({
      formattedInput: formatted,
      hour: digitsOnly.length >= 2 ? parseInt(digitsOnly.substring(0, 2), 10) : 0,
      minute: digitsOnly.length >= 4 
        ? parseInt(digitsOnly.substring(2, 4), 10) 
        : (digitsOnly.length === 3 ? parseInt(digitsOnly[2] + '0', 10) : 0)
    });
  };

  // Improved validation logic
  const isFormComplete = () => {
    // Day selected
    const hasDaySelected = selectedDayIndex !== null;
    
    // Valid time entered
    const hasValidTime = timeState.hour > 0 || timeState.minute > 0;
    
    // AM/PM selected
    const hasAmPmSelected = amPm !== null;
    
    return hasDaySelected && hasValidTime && hasAmPmSelected;
  };

  // Continue button behavior
  const handleContinue = async () => {
    if (isFormComplete()) {
      try {
        // Get the full day name instead of just the letter
        const dayLetter = days[selectedDayIndex];
        const dayFullName = fullDayNames[selectedDayIndex];
        const selectedTime = formatTime();
        
        await AsyncStorage.setItem('user_date_day', dayFullName);
        await AsyncStorage.setItem('user_date_time', selectedTime);

        console.log('Day stored:', dayFullName);
        console.log('Time stored:', selectedTime);
      } catch (error) {
        console.error('Error storing date info:', error);
      }
      // Navigate to the next screen with full day name
      navigation.navigate('DateLocation', {
        selectedDayIndex,
        selectedDay: fullDayNames[selectedDayIndex],
        startTime: formatTime(),
        amPm,
        matchedUserId: matchedUserId,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color="red" />
        </TouchableOpacity>

        {/* Hearts at top (replace sources as needed) */}
        <View style={styles.heartsContainer}>
          <Image
            source={currentUserImage ? { uri: currentUserImage } : require('../src/Assets/Images/account.png')}
            style={styles.heartImage}
            defaultSource={require('../src/Assets/Images/account.png')}
          />
          <Image
            source={matchedUserImage ? { uri: matchedUserImage } : require('../src/Assets/Images/account.png')}
            style={[styles.heartImage, styles.heartOverlap]}
            defaultSource={require('../src/Assets/Images/account.png')}
          />
        </View>

        {/* Title and availability info */}
        <View style={styles.content}>
          <Text style={styles.title}>When will the date occur?</Text>

          <Text style={styles.subtitle}>{matchedUserName}'s available times are:</Text>
          <View style={{ marginLeft: 16, marginBottom: 20 }}>
            {matchedUserAvailability.length > 0 ? (
              matchedUserAvailability.map((time, index) => (
                <Text key={index} style={styles.bulletItem}>
                  • {time}
                </Text>
              ))
            ) : (
              <Text style={styles.bulletItem}>No availability times set yet</Text>
            )}
          </View>

          {/* Gray box for day/time selection */}
          <View style={styles.selectionContainer}>
            {/* Days row */}
            <View style={styles.daysRow}>
              {days.map((day, index) => {
                const isSelected = selectedDayIndex === index;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCircle,
                      isSelected && { backgroundColor: '#000' },
                    ]}
                    onPress={() => handleDayPress(index)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && { color: '#FFF' },
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Row for Start Time label, input, AM/PM toggles */}
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Start Time</Text>
              <View style={styles.timeInputContainer}>
                <TextInput
                  style={styles.timeInput}
                  placeholder="00:00"
                  value={timeState.formattedInput}
                  onChangeText={handleTimeChange}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.amPmContainer}>
                {/* AM toggle */}
                <TouchableOpacity
                  style={[
                    styles.amPmButton,
                    styles.amPmButtonLeft,
                    amPm === 'AM' && { backgroundColor: '#000' },
                  ]}
                  onPress={() => handleAmPmPress('AM')}
                >
                  <Text
                    style={[
                      styles.amPmText,
                      amPm === 'AM' && { color: '#FFF' },
                    ]}
                  >
                    AM
                  </Text>
                </TouchableOpacity>

                {/* PM toggle */}
                <TouchableOpacity
                  style={[
                    styles.amPmButton,
                    styles.amPmButtonRight,
                    amPm === 'PM' && { backgroundColor: '#000' },
                  ]}
                  onPress={() => handleAmPmPress('PM')}
                >
                  <Text
                    style={[
                      styles.amPmText,
                      amPm === 'PM' && { color: '#FFF' },
                    ]}
                  >
                    PM
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <Pressable
        style={[
          styles.continueButton,
          { backgroundColor: isFormComplete() ? '#E4423F' : '#ccc' },
        ]}
        onPress={handleContinue}
        disabled={!isFormComplete()}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>

      {/* Three progress dots (2nd one highlighted) */}
      <View style={styles.progressDotsContainer}>
        <View style={[styles.dot, { backgroundColor: '#ccc' }]} />
        <View style={[styles.dot, { backgroundColor: '#E4423F' }]} />
        <View style={[styles.dot, { backgroundColor: '#ccc' }]} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // Back button
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 8,
    marginBottom: 20,
    marginTop: 30,
  },

  // Hearts
  heartsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heartImage: {
    width: 60,
    height: 60,
    resizeMode: 'cover',
    borderRadius: 30, 
    borderWidth: 2,
    borderColor: '#FF4081',
  },
  heartOverlap: {
    marginLeft: -20,
  },

  // Content area
  content: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  bulletItem: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },

  // Gray box container
  selectionContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
  },

  // Days row
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    color: '#000',
    fontWeight: '600',
  },

  // Time row
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 20,
    paddingHorizontal: 5,
  },
  timeLabel: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
    width: 90,
    marginRight: 5,
  },
  timeInputContainer: {
    width: 100,
    marginRight: 15,
  },
  timeInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },

  // AM/PM toggles
  amPmContainer: {
    flexDirection: 'row',
  },
  amPmButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amPmButtonLeft: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRightWidth: 0,
  },
  amPmButtonRight: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  amPmText: {
    color: '#888',
    fontWeight: '500',
    fontSize: 16,
  },

  // Continue button
  continueButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    marginBottom: 10, 
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Progress dots
  progressDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
