import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Modal } from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { formatPhoneNumber } from "./helper";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { REACT_APP_GOOGLE_CLIENT_ID, REACT_APP_GOOGLE_CLIENT_SECRET, REACT_APP_GOOGLE_LOGIN } from "@env";

WebBrowser.maybeCompleteAuthSession();

const SCOPES = ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"];

function GoogleSignup() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [socialId, setSocialId] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [signupSuccessful, setSignupSuccessful] = useState(false);
  const [userAlreadyExists, setUserAlreadyExists] = useState(false);
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: "466541803518-mpejfib4i7g8m88tbk4hpgfrmqlt9aho.apps.googleusercontent.com",
    androidClientId: "466541803518-41pdpb9pei96hihdt70db2e6a5hg8sj6.apps.googleusercontent.com",
    webClientId: "466541803518-gsnmbth4efjiajdpl1i9c2phrlu81njq.apps.googleusercontent.com",
    scopes: SCOPES,
  });

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const result = await promptAsync();

      if (result.type === "success") {
        const { authentication } = result;

        // Get user info using the access token
        const userInfoResponse = await fetch("https://www.googleapis.com/userinfo/v2/me", {
          headers: { Authorization: `Bearer ${authentication.accessToken}` },
        });

        const userData = await userInfoResponse.json();
        setEmail(userData.email);
        setSocialId(userData.id);
        setAccessToken(authentication.accessToken);

        // Exchange authorization code for refresh token
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            code: authentication.idToken,
            client_id: REACT_APP_GOOGLE_CLIENT_ID,
            client_secret: REACT_APP_GOOGLE_CLIENT_SECRET,
            redirect_uri: "https://auth.expo.io",
            grant_type: "authorization_code",
          }).toString(),
        });

        const tokenData = await tokenResponse.json();
        setRefreshToken(tokenData.refresh_token);

        const user = {
          email: userData.email,
          password: REACT_APP_GOOGLE_LOGIN,
          phone_number: phoneNumber,
          google_auth_token: authentication.accessToken,
          google_refresh_token: tokenData.refresh_token,
          social_id: userData.id,
        };

        const response = await axios.post("https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/UserSocialSignUp/MMU", user);

        if (response.data.message === "User already exists") {
          setUserAlreadyExists(true);
        } else {
          setSignupSuccessful(true);
        }
      } else {
        console.log("Google Sign Up was cancelled or failed");
      }
    } catch (error) {
      console.error("Error during Google Signup:", error);
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    setUserAlreadyExists(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Google Signup</Text>
      {signupSuccessful ? (
        <View>
          <Text style={styles.successMessage}>Signup Successful</Text>
          <Button title='Login' onPress={() => navigation.navigate("AccountSetup1Login")} />
        </View>
      ) : (
        <>
          <View style={styles.inputGroup}>
            <TextInput style={styles.input} placeholder='First Name' value={firstName} onChangeText={setFirstName} />
            <TextInput style={styles.input} placeholder='Last Name' value={lastName} onChangeText={setLastName} />
            <TextInput style={styles.input} placeholder='Phone Number' value={phoneNumber} onChangeText={(value) => setPhoneNumber(formatPhoneNumber(value))} keyboardType='phone-pad' />
          </View>
          <View style={styles.signUpButton}>
            <Button title='Sign Up with Google' onPress={handleGoogleSignup} disabled={!request} />
          </View>
          {loading && <ActivityIndicator size='large' color='#0000ff' />}
        </>
      )}
      <Modal visible={userAlreadyExists} transparent animationType='slide'>
        <View style={styles.modalView}>
          <Text>User Already Exists</Text>
          <Button title='Cancel' onPress={onCancel} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  signUpButton: {
    marginTop: 20,
  },
  successMessage: {
    fontSize: 18,
    textAlign: "center",
    color: "green",
  },
  modalView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    margin: 20,
    backgroundColor: "white",
    padding: 35,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default GoogleSignup;
