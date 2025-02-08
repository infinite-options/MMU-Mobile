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
  const matchedUserId = route.params?.matchedUserId || null;
  // Track selected day (index or null)
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);

  // Track the start time in HH:MM format
  const [startTime, setStartTime] = useState('');

  // Track AM/PM selection
  const [amPm, setAmPm] = useState(null);

  // Days array
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Add state for user info
  const [matchedUserName, setMatchedUserName] = useState('');
  const [matchedUserAvailability, setMatchedUserAvailability] = useState([]);

  // Fetch user info when component mounts
  useEffect(() => {
    const fetchMatchedUserInfo = async () => {
      try {
        if (matchedUserId) {
          const response = await fetch(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${matchedUserId}`);
          const data = await response.json();
          const userData = data.result[0];
          console.log('--- userData ---', userData);
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

  // Handler to pick a single day
  const handleDayPress = (index) => {
    setSelectedDayIndex(index);
  };

  // Handler to pick AM/PM
  const handleAmPmPress = (val) => {
    setAmPm(val);
  };

  // Determine if form is "complete"
  const isFormComplete =
    selectedDayIndex !== null && startTime.trim() !== '' && amPm !== null;

  // Continue button behavior
  const handleContinue = async () => {
    if (isFormComplete) {
      try {
        // Optionally store these selections in AsyncStorage
        const daySelected = days[selectedDayIndex];
        const selectedTime = `${startTime} ${amPm}`;
        await AsyncStorage.setItem('user_date_day', daySelected);
        await AsyncStorage.setItem('user_date_time', selectedTime);

        console.log('Day stored:', daySelected);
        console.log('Time stored:', selectedTime);
      } catch (error) {
        console.error('Error storing date info:', error);
      }
      // Navigate to the next screen
      navigation.navigate('DateLocation', {
        selectedDayIndex,
        startTime,
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
            source={require('../src/Assets/Images/match1.png')}
            style={styles.heartImage}
          />
          <Image
            source={require('../src/Assets/Images/match2.png')}
            style={[styles.heartImage, styles.heartOverlap]}
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
              <View style={styles.timeBlock}>
                <Text style={styles.smallLabel}>Start Time</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="00:00"
                  value={startTime}
                  onChangeText={(txt) => setStartTime(txt)}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.amPmContainer}>
                {/* AM toggle */}
                <TouchableOpacity
                  style={[
                    styles.amPmButton,
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
          { backgroundColor: isFormComplete ? '#E4423F' : '#ccc' },
        ]}
        onPress={handleContinue}
        disabled={!isFormComplete}
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
    backgroundColor: '#FFF',
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // Back button
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 30,
    padding: 8,
  },

  // Hearts
  heartsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heartImage: {
    borderColor: '#FF4081',
    borderRadius: 30,
    borderWidth: 2,
    height: 60, 
    resizeMode: 'cover',
    width: 60,
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
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 5,
  },
  bulletItem: {
    color: '#888',
    fontSize: 14,
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
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  dayText: {
    color: '#000',
    fontWeight: '600',
  },

  // Time row
  timeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  timeBlock: {
    flex: 1,
    marginRight: 20,
  },
  smallLabel: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  timeInput: {
    backgroundColor: '#FFF',
    borderColor: '#CCC',
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    paddingHorizontal: 10,
  },

  // AM/PM toggles
  amPmContainer: {
    flexDirection: 'row',
  },
  amPmButton: {
    backgroundColor: '#FFF',
    borderColor: '#CCC',
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  amPmText: {
    color: '#000',
    fontWeight: '600',
  },

  // Continue button
  continueButton: {
    alignItems: 'center',
    borderRadius: 30,
    height: 50,
    justifyContent: 'center',
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
    borderRadius: 4,
    height: 8,
    marginHorizontal: 4,
    width: 8,
  },
});
