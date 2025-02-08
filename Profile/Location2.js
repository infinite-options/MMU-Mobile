import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { postUserData } from '../Api.js';
import { SafeAreaView } from 'react-native-safe-area-context';

const LocationPage2 = () => {
  const navigation = useNavigation();

  const handleUpdate = async (choice) => {
    const formData = new FormData();
    formData.append('user_uid', '100-000001');
    formData.append('user_email_id', 'bobhawk@gmail.com');
    formData.append('user_notification_preference', choice);

    await postUserData(formData);
  };

  const handleYesClick = () => {
    handleUpdate('True');
    navigation.replace('AccountSetup7Summary');
  };

  const handleLaterClick = () => {
    handleUpdate('False');
    navigation.replace('AccountSetup7Summary');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={require('../assets/arrow.png')}
              style={styles.arrowIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerText}>Profile Creation</Text>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <Image
            source={require('../assets/icon2.png')}
            style={styles.icon}
          />
          <Text style={styles.mainTitle}>
            Would you like to receive notifications from Meet Me Up?
          </Text>
          <Text style={styles.bodyText}>
            Notifications will be sent to your device to help you coordinate and plan dates! It will also let you know when you have received a message from a potential date!
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.yesButton} onPress={handleYesClick}>
            <Text style={styles.buttonText}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.laterButton} onPress={handleLaterClick}>
            <Text style={styles.laterButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  arrowIcon: {
    height: 30,
    marginRight: 10,
    width: 30,
  },
  bodyText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#000000',
    fontSize: 18,
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#E4423F',
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  contentContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'normal',
  },
  icon: {
    height: 70,
    marginBottom: 16,
    width: 70,
  },
  laterButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  safeArea: {
    backgroundColor: '#E4423F',
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 20,
    width: '100%',
  },
  yesButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    height: 45,
    justifyContent: 'center',
    marginBottom: 16,
    width: 150,
  },
});

export default LocationPage2;
