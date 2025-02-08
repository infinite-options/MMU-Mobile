import React,{useState} from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native'; 
import { postUserData } from '../Api.js';



const LocationPage = () => {
const [loading, setLoading] = useState(false);
const navigation = useNavigation();

const handleUpdate = async (choice) => {

  const formData = new FormData();
  formData.append('user_uid', '100-000001');
  formData.append('user_email_id', 'bobhawk@gmail.com');
  formData.append('user_location_service', choice);

  await postUserData(formData);

}


const handleYesClick = () => {
  handleUpdate('True');
  navigation.navigate('Location2'); 
};

const handleLaterClick = () => {
  handleUpdate('False');
  navigation.navigate('Location2'); 
};

return (
    <ScrollView contentContainerStyle={styles.container}>

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../src/Assets/Images/arrow.png')}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>Profile Creation</Text>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <Image
            source={require('../src/Assets/Images/icon.png')}
            style={styles.icon}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.mainTitle}>
            Would you like to{'\n'}turn on location{'\n'}services?
          </Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.bodyText}>
            This will help assist you in meeting up for{'\n'}
            potential dates and meeting in the correct{'\n'}
            locations.
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.yesButton} onPress={handleYesClick}>
          <Text style={styles.buttonText}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.laterButton} onPress={handleLaterClick}>
          <Text style={styles.buttonText}>Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  arrowIcon: {
    height: 30,
    marginRight: 8,
    width: 30,
  },
  bodyText: {
    color: '#FFFFFF',
    fontFamily: 'Segoe UI',
    fontSize: 15,
    fontWeight: '200',
  },
  buttonContainer: {
    alignItems: 'left',
    marginBottom: 700, 
    marginLeft: 20,
    width: '100%'
  },
  buttonText: {
    color: '#000000',
    fontFamily: 'Segoe UI',
    fontSize: 18,
  },
  container: {
    backgroundColor: '#E4423F',
    flexDirection: 'column',
    flexGrow: 1,
    margin: 0,
    padding: 0,
  },
  contentContainer: {
    alignItems: 'flex-start',
    flex: 1,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  headerText: {
    color: '#FFFFFF',
    fontFamily: 'Segoe UI',
    fontSize: 22,
    fontWeight: 'normal',
  },
  icon: {
    height: 72,
    marginBottom: 16,
    width: 72,
  },
  iconContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  laterButton: {
    alignItems: 'left',
    justifyContent: 'center',
    marginLeft: 20,
    marginTop: 10
  },
  mainTitle: {
    color: '#FFFFFF',
    fontFamily: 'Segoe UI',
    fontSize: 30,
    fontWeight: '200',
  },
  textContainer: {
    color: '#FFFFFF',
    fontFamily: 'Segoe UI',
    fontSize: 30,
    fontWeight: 'normal',
    marginBottom: 16,
    width: '100%',
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: '#E4423F',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 32,
    width: '100%',
  },
  yesButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    height: 45,
    justifyContent: 'center',
    marginVertical: 0,
    width: 130, 
  },
});

export default LocationPage;