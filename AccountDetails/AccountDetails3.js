import React, { useEffect, useState } from 'react';
import { Image, TouchableOpacity, View, Text, TextInput, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../assets/BackButton.png'; // Ensure this path is correct
import { useNavigation } from '@react-navigation/native';

const AccountDetails3 = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const navigation = useNavigation();
  
  const handleBack = () => {
    navigation.goBack();
  };

  useEffect(() => {
    const getUserData = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('user_email_id');
        const storedPhone = await AsyncStorage.getItem('phone_number');
        
        if (storedEmail) setEmail(storedEmail);
        if (storedPhone) setPhone(storedPhone);
      } catch (error) {
        console.error('Failed to load user data from AsyncStorage', error);
      }
    };

    getUserData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back Button */}
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Image onPress={handleBack} source={BackButton} style={styles.arrowIcon} />
        </TouchableOpacity>

        {/* Title */}
        <Text onPress={handleBack} style={styles.title}>Settings</Text>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>Account Details</Text>

        {/* Description */}
        <Text style={styles.description}>
          We need some basic account details to help verify your identity and account.
        </Text>

        {/* Email Label and Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            editable={false} // Non-editable input
          />
        </View>

        {/* Phone Label and Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phone}
            editable={false} // Non-editable input
          />
        </View>
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
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingTop: 20, // Ensures content does not overlap the status bar
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
    color: '#1A1A1A',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 32,
  },
  backButton: {
    marginRight: 16,
    position: 'absolute',
    top: 10, // Adjust based on your design
    left: 10, // Adjust based on your design
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20, // Circular button
    backgroundColor: '#f0f0f0',
  },
  arrowIcon: {
    width: 24, // Adjust the size of the arrow icon
    height: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#E4423F',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    backgroundColor: 'rgba(226, 226, 226, 0.5)',
    padding: 12,
    borderRadius: 10,
    borderColor: '#CECECE',
    borderWidth: 1,
    fontSize: 14,
    color: '#1A1A1A',
  },
});

export default AccountDetails3;
