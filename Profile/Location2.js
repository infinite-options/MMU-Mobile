import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { postUserData } from "../Api.js";
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
  safeArea: {
    flex: 1,
    backgroundColor: '#E4423F',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#E4423F',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  arrowIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  headerText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: 'normal',
  },
  contentContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  icon: {
    width: 70,
    height: 70,
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  yesButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    width: 150,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  laterButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#000000',
  },
  laterButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
});

export default LocationPage2;
