import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import NextButton from '../src/Assets/Components/NextButton';
import axios from 'axios';

const AccountSetup6Available = () => {
  const [formData, setFormData] = useState({
    dates: [],
  });
  const [loading, setLoading] = useState(true);
  const [times, setTimes] = useState([]);
  const [noId, setNoId] = useState(false);
  const navigation = useNavigation(); // React Native navigation
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dates = ['Lunch', 'Dinner', 'Coffee', 'Movies', 'Surprise Me'];

  const handleAddTime = (day, start_time, end_time) => {
    setTimes((prevTimes) => {
      const updatedTimes = [...prevTimes, { day, start_time, end_time }];
      updatedTimes.sort((a, b) => daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day));
      return updatedTimes;
    });
  };

  const handleRemoveTime = (index) => {
    setTimes((prevTimes) => prevTimes.filter((_, i) => i !== index));
  };

  const handleButton = (id, type) => {
    setFormData((prevFormData) => {
      const updatedArray = prevFormData[type].includes(id)
        ? prevFormData[type].filter((item) => item !== id)
        : [...prevFormData[type], id];
      return { ...prevFormData, [type]: updatedArray };
    });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = await AsyncStorage.getItem('user_uid');
      if (!userId) {
        setLoading(false);
        setNoId(true);
        return;
      }

      try {
        const response = await axios.get(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${userId}`);
        const fetchedData = response.data.result[0];
        const datesArray = fetchedData.user_date_interests ? fetchedData.user_date_interests.split(',') : [];
        setFormData({ dates: datesArray });

        const newTimes = JSON.parse(fetchedData.user_available_time || '[]');
        setTimes(newTimes);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleNext = async () => {
    const userId = await AsyncStorage.getItem('user_uid');
    const emailId = await AsyncStorage.getItem('user_email_id');
    const url = "https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo";

    const formDataToSend = new FormData();
    formDataToSend.append("user_uid", userId);
    formDataToSend.append("user_email_id", emailId);
    formDataToSend.append("user_date_interests", formData.dates.join(', '));
    formDataToSend.append("user_available_time", JSON.stringify(times));

    try {
      const response = await axios.put(url, formDataToSend);
      if (response.status === 200) {
        console.log('Success:', response.data);
        navigation.replace('AccountSetup7Summary'); // Navigate to the next screen
      }
    } catch (error) {
      console.error('Error submitting data:', error);
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    }
  };

  if (loading) {
    return <Text>Loading specifics...</Text>;
  }

  if (noId) {
    navigation.navigate('AccountSetup1Login'); // Redirect if no userId found
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerText}>What Types of Dates Interest You?</Text>
      <Text style={styles.subHeaderText}>Select any activities you would be open to</Text>
      <View style={styles.gridContainer}>
        {dates.map((date) => (
          <TouchableOpacity key={date} onPress={() => handleButton(date, 'dates')} style={styles.dateButton}>
            <Text style={[styles.dateText, formData.dates.includes(date) && styles.selectedDateText]}>
              {date}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.headerText}>When Are You Available?</Text>
      <Text style={styles.subHeaderText}>  These availability slots are crucial to help you and potential matches make a date faster. {'\n'}
        These slots will directly correspond to other users' slots, and will allow you both to plan a date within time frames that you both are available for. {'\n'}
        If you leave the below section blank, meet me up will assume you are always available.</Text>

      
      <NextButton onPress={handleNext} text="Next" />
    </ScrollView>
  );
};

export default AccountSetup6Available;

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subHeaderText: {
    fontSize: 14,
    marginBottom: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dateButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 16,
  },
  selectedDateText: {
    color: 'red',
  },
});
