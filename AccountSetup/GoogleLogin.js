import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Button, StyleSheet } from 'react-native';
import axios from 'axios';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useNavigation } from '@react-navigation/native';
import UserDoesNotExistModal from './UserDoesNotExistModal';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function GoogleLogin(props) {
  const navigation = useNavigation();
  const [showSpinner, setShowSpinner] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [loginSuccessful, setLoginSuccessful] = useState(false);
  const [userDoesntExist, setUserDoesntExist] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  async function handleGoogleSignIn() {
    try {
      setShowSpinner(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const { idToken, user } = userInfo;

      const emailAddress = user.email;
      if (emailAddress) {
        const url = `https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/UserSocialLogin/MMU/${emailAddress}`;
        const serverResponse = await axios.get(url, {
          params: {
            id_token: idToken,
          },
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });

        if (serverResponse.data && serverResponse.data.code === 200) {
          setNewEmail(emailAddress);
          setLoginSuccessful(true);
          setUserDoesntExist(false);
          navigation.navigate('AccountSetup2Create'); 
        } else {
          setUserDoesntExist(true);
        }
      }
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Signin in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available or outdated');
      } else {
        console.error('Error handling Google login:', error);
        setUserDoesntExist(true);
      }
    } finally {
      setShowSpinner(false);
    }
  }

  const onCancelModal = () => {
    setUserDoesntExist(false);
  };

  return (
    <View style={styles.container}>
      {userDoesntExist && (
        <UserDoesNotExistModal
          isOpen={userDoesntExist}
          onCancel={onCancelModal}
          email={newEmail}
        />
      )}
      <Text style={styles.title}>Google Login</Text>
      {loginSuccessful ? (
        <Text>Login Successful! Redirecting...</Text>
      ) : (
        <View>
          <Button title="Sign in with Google" onPress={handleGoogleSignIn} />
          {showSpinner && (
            <ActivityIndicator size="large" color="#0000ff" style={styles.spinner} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  spinner: {
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});

export default GoogleLogin;
