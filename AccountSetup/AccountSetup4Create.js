import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, TextInput, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HelperTextBox from '../src/Assets/Components/helperTextBox';
import Progress from '../src/Assets/Components/Progress';
import NextButton from '../src/Assets/Components/NextButton';
import DrawerContext from '../src/Assets/Components/DrawerContext';
import DrawerOptions from '../src/Assets/Components/DrawerOptions';

export default function AccountSetup4Create() {
  const [option, setOption] = useState('');
  const [noId, setNoId] = useState(false);
  const navigation = useNavigation();
  const [pickerValue, setPickerValue] = useState({ single: '' });
  const [userId, setUserId] = useState(null); // Change useRef to useState
  const[userEmail,setUserEmail]=useState(null);
  const [formData, setFormData] = useState({
    user_height: '',
    user_education: '',
    user_body_composition: '',
    user_star_sign: '',
    user_drinking: '',
    user_smoking: '',
    user_kids: '',
    user_job: '',
    user_religion: '',
    user_nationality: '',
    user_general_interests: [],
  });
  
  const [specifics, setSpecifics] = useState({
    height: '',
    education: '',
    body: '',
    star: '',
    drinking: '',
    smoking: '',
    children: '',
    position: '',
    religion: '',
    gender: '',
    nationality: '',
    general_interests: [],
  });

  const [loading, setLoading] = useState(true);
  const [passData, setPassData] = useState(null);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userIdValue = await AsyncStorage.getItem('user_uid');
        const userEmail = await AsyncStorage.getItem('user_email_id');
        console.log('EMAILL',userEmail)
        if (userIdValue) {
          setUserEmail(userEmail);
          setUserId(userIdValue); // Set the userId in state
          const response = await axios.get(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${userIdValue}`);
          const fetchedData = response.data.result[0];
          setLoading(false);
          
          handleSetSpecifics('height', fetchedData.user_height || '');
          handleSetSpecifics('education', fetchedData.user_education || '');
          handleSetSpecifics('body', fetchedData.user_body_composition || '');
          handleSetSpecifics('star', fetchedData.user_star_sign || '');
          handleSetSpecifics('drinking', fetchedData.user_drinking || '');
          handleSetSpecifics('smoking', fetchedData.user_smoking || '');
          handleSetSpecifics('children', fetchedData.user_kids || '');
          handleSetSpecifics('position', fetchedData.user_job || '');
          handleSetSpecifics('religion', fetchedData.user_religion || '');
          handleSetSpecifics('nationality', fetchedData.user_nationality || '');

          const interestsArray = fetchedData.user_general_interests ? fetchedData.user_general_interests.split(',') : [];
          setFormData((prevFormData) => ({
            ...prevFormData,
            user_general_interests: interestsArray,
          }));
        }
      } catch (error) {
        console.log('Error fetching data', error);
      }
    };
    fetchUserData();
  }, []);

  const handleSetSpecifics = (name, value) => {
    setSpecifics((prevSpecifics) => ({
      ...prevSpecifics,
      [name]: value,
    }));
    setFormData((prevFormData) => ({
      ...prevFormData,
      [specificsName[name]]: value,
    }));
  };

  const handleNext = async () => {
    const specificsForm = populateFormData();
    try {
      const response = await axios.put(
        'https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo',
        specificsForm
      );
      if (response.status === 200) {
        console.log('HELLO',response.data);
      }
    } catch (err) {
      console.log('Error:', err);
    }
    //navigation.navigate("Location2")
    navigation.navigate('AccountSetup5Create')
  };
  const populateFormData = () => {
    const specificsForm = new FormData();
    specificsForm.append('user_uid', userId); // Ensure userId is appended here
    specificsForm.append('user_email_id',userEmail);
    Object.entries(formData).forEach(([key, value]) => {
      specificsForm.append(key, value);
    });
    return specificsForm;
  };

  const generalInterests = [
    'Eating Out',
    'Bike Rides',
    'Drinking',
    'Dancing',
    'Cooking',
    'Baking',
    'Crafting',
    'Painting',
    'Surfing',
    'Traveling',
  ];

  const specificsName = {
    height: 'user_height',
    education: 'user_education',
    body: 'user_body_composition',
    star: 'user_star_sign',
    drinking: 'user_drinking',
    smoking: 'user_smoking',
    children: 'user_kids',
    position: 'user_job',
    religion: 'user_religion',
    nationality: 'user_nationality',
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <ScrollView style={styles.container}>
      <Progress percent="60%" />

      {/* <Text style={styles.headerText}>Your General Interests</Text>
      <Text style={styles.subHeaderText}>
        These interests help match you to better people on meet me up. Select or add as many interests as you want.
      </Text>

      {generalInterests.map((interest, index) => (
        <TouchableOpacity key={index} style={styles.interestButton}>
          <Text>{interest}</Text>
        </TouchableOpacity>
      ))} */}

      <Text style={styles.headerText}>Some Specifics</Text>
      <Text style={styles.subHeaderText}>
        These help give a better insight into who you are and will allow matches to better understand you as a person.
      </Text>

      <TouchableOpacity style={styles.specificButton} onPress={() => setOption('height')}>
        <View style={styles.specificRow}>
          <Text>Height:</Text>
          <Text style={styles.textStyle}>{specifics.height || 'Not Entered'}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.specificButton} onPress={() => setOption('education')}>
        <View style={styles.specificRow}>
          <Text>Education:</Text>
          <Text style={styles.textStyle}>{specifics.education || 'Not Entered'}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.specificButton} onPress={() => setOption('body')}>
        <View style={styles.specificRow}>
          <Text>Body Composition:</Text>
          <Text style={styles.textStyle}>{specifics.body || 'Not Entered'}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.specificButton} onPress={() => setOption('star')}>
        <View style={styles.specificRow}>
          <Text>Star Sign:</Text>
          <Text style={styles.textStyle}>{specifics.star || 'Not Entered'}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.specificButton} onPress={() => setOption('drinking')}>
        <View style={styles.specificRow}>
          <Text>Drinking:</Text>
          <Text style={styles.textStyle}>{specifics.drinking || 'Not Entered'}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.specificButton} onPress={() => setOption('smoking')}>
        <View style={styles.specificRow}>
          <Text>Smoking:</Text>
          <Text style={styles.textStyle}>{specifics.smoking || 'Not Entered'}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.specificButton} onPress={() => setOption('children')}>
        <View style={styles.specificRow}>
          <Text>Kids:</Text>
          <Text style={styles.textStyle}>{specifics.children || 'Not Entered'}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.specificButton} onPress={() => setOption('position')}>
        <View style={styles.specificRow}>
          <Text>Job:</Text>
          <Text style={styles.textStyle}>{specifics.position || 'Not Entered'}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.specificButton} onPress={() => setOption('religion')}>
        <View style={styles.specificRow}>
          <Text>Religion:</Text>
          <Text style={styles.textStyle}>{specifics.religion || 'Not Entered'}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.specificButton} onPress={() => setOption('nationality')}>
        <View style={styles.specificRow}>
          <Text>Nationality:</Text>
          <Text style={styles.textStyle}>{specifics.nationality || 'Not Entered'}</Text>
        </View>
      </TouchableOpacity>


      <DrawerContext.Provider
        value={{
          specifics,
          option,
          setOption,
          handleSetSpecifics,
          passData,
          setPassData,
          complete,
          setComplete,
          pickerValue,
          setPickerValue,
        }}
      >
        <View style = {styles.buttonContainer}>
             <Pressable style= {styles.button}onPress={handleNext}>
              <Text style={styles.buttonText}>
                Next
              </Text>
             </Pressable>
             </View>
        <DrawerOptions />
      </DrawerContext.Provider>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  button: {
  alignItems: 'center',
  backgroundColor: '#E4423F',
  borderRadius: 25,
  height: 45,
  justifyContent: 'center',
  width: 130,
},
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginVertical: 40,
},
  buttonText: {
  color: 'white',
  fontSize: 18,
},
  container: {
    flex: 1,
    padding: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  interestButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 10,
    padding: 10,
  },
specificButton: {
    backgroundColor: '#ffffff',
    borderColor: '#ccc',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 15,
  },
specificRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // This keeps the label on the left and the value on the right
    alignItems: 'center', // Vertically align items in the center
  },
subHeaderText: {
    fontSize: 16,
    marginBottom: 20,
  },
  textStyle:{
    fontSize: 16,
    fontWeight: '400',
    color: '#E4423F', // Change the value to red
    textAlign: 'right', // Align v
},
});
