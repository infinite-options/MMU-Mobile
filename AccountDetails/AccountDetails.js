import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Switch, Button, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AccountSetup1Login from '../AccountSetup/AccountSetup1Login';
const Settings = () => {
  const navigation = useNavigation();
  const [locationServices, setLocationServices] = useState(false);
  const [notifications, setNotifications] = useState(false);

  const handleToggleLocationServices = () => {
    setLocationServices(!locationServices);
  };

  const handleToggleNotifications = () => {
    setNotifications(!notifications);
  };

  const AccountDetails3=()=>{
    navigation.navigate('AccountDetails3');
  }

  const handleLogout = () => {
    navigation.navigate('AccountSetup1Login');
  };
  const handleBack = () =>
  {
    navigation.navigate("AccountSetup7Summary");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Image source={require('../assets/arrow.png')} style={styles.arrowIcon} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Settings</Text>
      </View>

      <View style={styles.settingContainer}>
        <Image source={require('../assets/account.png')} style={styles.icon} />
        <Text onPress={AccountDetails3} style={styles.settingText}>Account Details</Text>
        <Text style={styles.arrowText}>&gt;</Text>
      </View>

      <TouchableOpacity style={styles.settingContainer}>
        <Image source={require('../assets/password.png')} style={styles.icon} />
        <Text style={styles.settingText}>Update Password</Text>
        <Text style={styles.arrowText}>&gt;</Text>
      </TouchableOpacity>

      <View style={styles.settingContainer}>
        <Image source={require('../assets/location.png')} style={styles.icon} />
        <Text style={styles.settingText}>Location Services</Text>
        <Switch
  value={locationServices}
  onValueChange={handleToggleLocationServices}
  thumbColor={locationServices ? '#E4423F' : '#E4423F'}  // Red thumb color in both states
  trackColor={{ false: '#E2E2E2', true: '#E4423F' }}     // Gray track when off, red track when on
/>

      </View>
      <Text style={styles.descriptionText}>
        This will help assist you in meeting up for potential dates and meeting in the correct locations.
      </Text>

      <View style={styles.settingContainer}>
        <Image source={require('../assets/notification.png')} style={styles.icon} />
        <Text style={styles.settingText}>Notifications</Text>
        <Switch
          value={notifications}
          onValueChange={handleToggleNotifications}
          thumbColor={notifications ? '#E4423F' : '#E2E2E2'}
          trackColor={{ false: '#E2E2E2', true: '#E4423F' }}
        />
      </View>
      <Text style={styles.descriptionText}>
        Notifications will be sent to your device to help you coordinate and plan dates! It will also let you know when you have received a message from a potential date!
      </Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    padding: 32,
    backgroundColor: '#FFFFFF',
    flexGrow: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  arrowIcon: {
    width: 28,
    height: 28,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '400',
    color: '#1A1A1A',
    fontFamily: 'Segoe UI',
    textAlign: 'center',
    flex: 1,
  },
  settingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    width: 28,
    height: 28,
    marginRight: 16,
  },
  settingText: {
    fontSize: 18,
    fontWeight: '400',
    color: '#1A1A1A',
    fontFamily: 'Segoe UI',
    flex: 1,
  },
  arrowText: {
    fontSize: 18,
    fontWeight: '400',
    color: '#1A1A1A',
  },
  descriptionText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Segoe UI',
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: '#E4423F',
    borderRadius: 30,
    width: 130,
    height: 45,
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 16,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Segoe UI',
    textAlign: 'center',
  },
});

export default Settings;
