import React, { useState } from "react";
import { View, Text, ActivityIndicator, Button, StyleSheet } from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import UserDoesNotExistModal from "./UserDoesNotExistModal";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { REACT_APP_GOOGLE_CLIENT_ID } from "@env";

WebBrowser.maybeCompleteAuthSession();

const SCOPES = ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"];

function GoogleLogin(props) {
  const navigation = useNavigation();
  const [showSpinner, setShowSpinner] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [loginSuccessful, setLoginSuccessful] = useState(false);
  const [userDoesntExist, setUserDoesntExist] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: "466541803518-mpejfib4i7g8m88tbk4hpgfrmqlt9aho.apps.googleusercontent.com",
    androidClientId: "466541803518-41pdpb9pei96hihdt70db2e6a5hg8sj6.apps.googleusercontent.com",
    webClientId: "466541803518-gsnmbth4efjiajdpl1i9c2phrlu81njq.apps.googleusercontent.com",
    scopes: SCOPES,
  });

  async function handleGoogleSignIn() {
    try {
      setShowSpinner(true);
      const result = await promptAsync();

      if (result.type === "success") {
        const { authentication } = result;

        // Get user info using the access token
        const userInfoResponse = await fetch("https://www.googleapis.com/userinfo/v2/me", {
          headers: { Authorization: `Bearer ${authentication.accessToken}` },
        });

        const userInfo = await userInfoResponse.json();
        const emailAddress = userInfo.email;

        if (emailAddress) {
          const url = `https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/UserSocialLogin/MMU/${emailAddress}`;
          const serverResponse = await axios.get(url, {
            params: {
              id_token: authentication.idToken,
            },
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });

          if (serverResponse.data && serverResponse.data.code === 200) {
            setNewEmail(emailAddress);
            setLoginSuccessful(true);
            setUserDoesntExist(false);
            navigation.navigate("AccountSetup2Create");
          } else {
            setUserDoesntExist(true);
          }
        }
      } else {
        console.log("Google Sign In was cancelled or failed");
      }
    } catch (error) {
      console.error("Error handling Google login:", error);
      setUserDoesntExist(true);
    } finally {
      setShowSpinner(false);
    }
  }

  const onCancelModal = () => {
    setUserDoesntExist(false);
  };

  return (
    <View style={styles.container}>
      {userDoesntExist && <UserDoesNotExistModal isOpen={userDoesntExist} onCancel={onCancelModal} email={newEmail} />}
      <Text style={styles.title}>Google Login</Text>
      {loginSuccessful ? (
        <Text>Login Successful! Redirecting...</Text>
      ) : (
        <View>
          <Button title='Sign in with Google' onPress={handleGoogleSignIn} disabled={!request} />
          {showSpinner && <ActivityIndicator size='large' color='#0000ff' style={styles.spinner} />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  spinner: {
    marginTop: 20,
  },
});

export default GoogleLogin;
