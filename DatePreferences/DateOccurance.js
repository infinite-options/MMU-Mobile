import React, { useState } from 'react';
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

export default function DateOccurance({ navigation }) {
  // Track selected day (index or null)
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);

  // Track the start time in HH:MM format
  const [startTime, setStartTime] = useState('');

  // Track AM/PM selection
  const [amPm, setAmPm] = useState(null);

  // Days array
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Handler to pick a single day
  const handleDayPress = (index) => {
    setSelectedDayIndex(index);
  };

  // Handler to pick AM/PM
  const handleAmPmPress = (val) => {
    setAmPm(val);
  };

  // Determine if form is “complete”
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

          <Text style={styles.subtitle}>Gemma’s available times are:</Text>
          <View style={{ marginLeft: 16, marginBottom: 20 }}>
            <Text style={styles.bulletItem}>• Mon - Thu, 7 pm to 9 pm</Text>
            <Text style={styles.bulletItem}>• Fri, 5 pm to 10 pm</Text>
            <Text style={styles.bulletItem}>• Sat &amp; Sun, 9 am to 9:30 pm</Text>
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
    marginTop: 10,
  },
  timeBlock: {
    flex: 1,
    marginRight: 20,
  },
  smallLabel: {
    fontSize: 14,
    color: '#000',
    marginBottom: 5,
    fontWeight: '600',
  },
  timeInput: {
    backgroundColor: '#FFF',
    borderColor: '#CCC',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },

  // AM/PM toggles
  amPmContainer: {
    flexDirection: 'row',
  },
  amPmButton: {
    borderWidth: 1,
    borderColor: '#CCC',
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  amPmText: {
    color: '#000',
    fontWeight: '600',
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
