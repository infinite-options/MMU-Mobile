import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, Image, ActivityIndicator, Modal, Alert } from "react-native";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { formatPhoneNumber } from "./helper";
import { EXPO_PUBLIC_MMU_WEB_CLIENT_ID, EXPO_PUBLIC_MMU_WEB_CLIENT_SECRET, REACT_APP_GOOGLE_LOGIN } from "@env";

const CLIENT_ID = EXPO_PUBLIC_MMU_WEB_CLIENT_ID;
const CLIENT_SECRET = EXPO_PUBLIC_MMU_WEB_CLIENT_SECRET;
const GOOGLE_LOGIN = REACT_APP_GOOGLE_LOGIN;
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

  useEffect(() => {
    GoogleSignin.configure({
      scopes: SCOPES,
      webClientId: CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const { idToken, user } = userInfo;
      const { email, id } = user;
      setEmail(email);
      setSocialId(id);
      fetchGoogleTokens(idToken);
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("User cancelled the login flow");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("Sign-in is in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log("Play Services not available or outdated");
      } else {
        console.error("Error during Google Signup:", error);
      }
      setLoading(false);
    }
  };

  const fetchGoogleTokens = async (auth_code) => {
    try {
      const authorization_url = "https://accounts.google.com/o/oauth2/token";
      const details = {
        code: auth_code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirectUri: "postmessage",
        grant_type: "authorization_code",
      };

      const formBody = Object.keys(details)
        .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(details[key]))
        .join("&");

      const response = await fetch(authorization_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: formBody,
      });
      const data = await response.json();

      const at = data["access_token"];
      const rt = data["refresh_token"];
      setAccessToken(at);
      setRefreshToken(rt);

      const userResponse = await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo?alt=json&access_token=${at}`);
      const userData = userResponse.data;

      setEmail(userData.email);
      setSocialId(userData.id);

      const user = {
        email: userData.email,
        password: GOOGLE_LOGIN,
        phone_number: phoneNumber,
        google_auth_token: at,
        google_refresh_token: rt,
        social_id: userData.id,
      };

      axios.post("https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/UserSocialSignUp/MMU", user).then((response) => {
        if (response.data.message === "User already exists") {
          setUserAlreadyExists(true);
        } else {
          setSignupSuccessful(true);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error("Error fetching tokens:", error);
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
            <Button title='Sign Up with Google' onPress={handleGoogleSignup} />
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
