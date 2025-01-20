import React,{useState} from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native'; 
import { postUserData } from "../Api.js";



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
  container: {
    flexGrow: 1,
    backgroundColor: '#E4423F',
    padding: 0,
    margin: 0,
    flexDirection: 'column',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
    backgroundColor: '#E4423F',
    width: '100%',
  },
  arrowIcon: {
    width: 30,
    height: 30,
    marginRight: 8,
  },
  headerText: {
    color: '#FFFFFF',
    fontFamily: 'Segoe UI',
    fontSize: 22,
    fontWeight: 'normal',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  iconContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  icon: {
    width: 72,
    height: 72,
    marginBottom: 16,
  },
  textContainer: {
    width: '100%',
    marginBottom: 16,
    color: '#FFFFFF',
    fontFamily: 'Segoe UI',
    fontSize: 30,
    fontWeight: 'normal',
  },
  mainTitle: {
    fontFamily: 'Segoe UI',
    fontSize: 30,
    fontWeight: '200',
    color: '#FFFFFF',
  },
  bodyText: {
    fontFamily: 'Segoe UI',
    fontSize: 15,
    fontWeight: '200',
    color: '#FFFFFF',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'left', 
    marginBottom: 700,
    marginLeft: 20
  },
  yesButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: 130,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 0, 
  },
  laterButton: {
    justifyContent: 'center',
    alignItems: 'left',
    marginTop: 10,
    marginLeft: 20
  },
  buttonText: {
    fontFamily: 'Segoe UI',
    fontSize: 18,
    color: '#000000',
  },
});

export default LocationPage;