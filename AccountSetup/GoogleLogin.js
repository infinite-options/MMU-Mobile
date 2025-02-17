import React, { useState } from "react";
import { View, Text, ActivityIndicator, Button, StyleSheet } from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import UserDoesNotExistModal from "./UserDoesNotExistModal";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { getGoogleConfig } from "../utils/environment";

WebBrowser.maybeCompleteAuthSession();

const SCOPES = ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"];

function GoogleLogin(props) {
  const navigation = useNavigation();
  const [showSpinner, setShowSpinner] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [loginSuccessful, setLoginSuccessful] = useState(false);
  const [userDoesntExist, setUserDoesntExist] = useState(false);

  const config = getGoogleConfig();
  const [request, response, promptAsync] = Google.useAuthRequest(config);

  async function handleGoogleSignIn() {
    try {
      setShowSpinner(true);
      console.log("1. Starting Google Sign In Flow...");

      // Log the request object before attempting authentication
      if (request) {
        console.log("2. Auth Request Configuration:", {
          authUrl: request.url,
          responseType: request.responseType,
          clientId: request.clientId,
          redirectUri: request.redirectUri,
          scopes: request.scopes,
        });
      } else {
        console.log("Error: Auth Request not initialized");
        return;
      }

      console.log("3. Opening Google Auth in browser...");
      const result = await promptAsync();
      console.log("4. Received auth result:", JSON.stringify(result, null, 2));

      if (result.type === "success") {
        console.log("5. Authentication successful, getting user info...");
        const { authentication } = result;

        // Get user info using the access token
        const userInfoResponse = await fetch("https://www.googleapis.com/userinfo/v2/me", {
          headers: { Authorization: `Bearer ${authentication.accessToken}` },
        });

        const userInfo = await userInfoResponse.json();
        console.log("6. Received user info:", userInfo);
        const emailAddress = userInfo.email;

        if (emailAddress) {
          console.log("7. Calling our backend to create/verify user...");
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
            console.log("8. User successfully authenticated and verified");
            setNewEmail(emailAddress);
            setLoginSuccessful(true);
            setUserDoesntExist(false);
            navigation.navigate("AccountSetup2Create");
          } else {
            console.log("8. User not found in our system");
            setUserDoesntExist(true);
          }
        }
      } else {
        console.log("Authentication failed or was cancelled:", result);
      }
    } catch (error) {
      console.error("Error handling Google login:", error);
      if (error.message) {
        console.error("Error message:", error.message);
      }
      if (error.response) {
        console.error("Error response:", error.response);
      }
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
