import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Alert, Platform, SafeAreaView, KeyboardAvoidingView, ScrollView } from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { formatPhoneNumber } from "./helper";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { REACT_APP_GOOGLE_CLIENT_SECRET, REACT_APP_GOOGLE_LOGIN } from "@env";
import { getGoogleConfig } from "../utils/environment";
import * as AuthSession from "expo-auth-session";

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

  // Add debugging useEffect
  useEffect(() => {
    console.log("[1][Lifecycle] Component mounted");
    console.log("[2][Navigation] Current screen: GoogleSignUp");

    return () => {
      console.log("[X][Lifecycle] Component unmounting");
    };
  }, []);

  // Add navigation focus listener
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      console.log("[3][Navigation] Screen focused");
    });

    return unsubscribe;
  }, [navigation]);

  const googleConfig = getGoogleConfig();
  console.log("[4][Setup] Google Config loaded:", {
    hasExpoClientId: !!googleConfig.expoClientId,
    hasIosClientId: !!googleConfig.iosClientId,
    hasRedirectUri: !!googleConfig.redirectUri,
    platform: Platform.OS,
    currentTimestamp: new Date().toISOString(),
  });

  // Initialize auth request
  const [authRequest, authResponse, authPromptAsync] = Google.useAuthRequest({
    clientId: googleConfig.clientId,
    webClientId: googleConfig.webClientId,
    redirectUri: googleConfig.redirectUri,
    scopes: SCOPES,
    useProxy: true,
    responseType: "token",
  });

  // Add debug logging for auth request initialization
  useEffect(() => {
    console.log("[4a][Auth Debug] Auth request state:", {
      isAuthRequestNull: authRequest === null,
      hasPromptAsync: typeof authPromptAsync === "function",
      configUsed: {
        clientId: googleConfig.clientId,
        webClientId: googleConfig.webClientId,
        redirectUri: googleConfig.redirectUri,
        useProxy: true,
        responseType: "token",
      },
    });
  }, [authRequest, authPromptAsync]);

  // Monitor auth response
  useEffect(() => {
    if (authResponse?.type === "success") {
      console.log("[8][Auth Response] Received successful response:", {
        hasAccessToken: !!authResponse.authentication?.accessToken,
        hasIdToken: !!authResponse.authentication?.idToken,
        type: authResponse.type,
      });
    } else if (authResponse) {
      console.log("[8][Auth Response] Received non-success response:", {
        type: authResponse.type,
        error: authResponse.error,
      });
    }
  }, [authResponse]);

  const handleGoogleSignup = async () => {
    console.log("[5][Auth Flow] Starting signup flow");

    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim()) {
      console.log("[E1][Validation] Missing required fields");
      Alert.alert("Error", "Please fill in all fields before proceeding.");
      return;
    }

    if (!authRequest) {
      console.log("[E2][Error] Auth request not initialized", {
        requestState: authRequest,
        googleConfig: {
          hasExpoClientId: !!googleConfig.expoClientId,
          hasIosClientId: !!googleConfig.iosClientId,
        },
      });
      Alert.alert("Error", "Authentication not ready. Please try again.");
      return;
    }

    try {
      setLoading(true);
      console.log("[6][Auth Flow] Calling promptAsync with config:", {
        clientId: authRequest.clientId,
        redirectUri: authRequest.redirectUri,
        scopes: authRequest.scopes,
        responseType: authRequest.responseType,
      });

      // Add detailed logging before the prompt
      console.log("[6a][Auth Flow Debug] AuthRequest details:", {
        hasAuthRequest: !!authRequest,
        promptAsyncExists: !!authPromptAsync,
        authRequestKeys: authRequest ? Object.keys(authRequest) : [],
        googleConfigComplete: !!(googleConfig.expoClientId && googleConfig.iosClientId && googleConfig.redirectUri),
      });

      let result;
      try {
        result = await authPromptAsync({ showInRecents: true, useProxy: true });
      } catch (promptError) {
        console.log("[6c][Auth Flow Error] promptAsync threw error:", {
          error: promptError.message,
          stack: promptError.stack?.split("\n")[0],
          name: promptError.name,
        });
        throw promptError;
      }

      // Add catch for promise rejection
      if (!result) {
        console.log("[6b][Auth Flow Error] promptAsync returned no result");
        throw new Error("No result from promptAsync");
      }

      console.log("[7][Auth Flow] Received result:", {
        type: result.type,
        hasError: !!result.error,
        errorDetails: result.error ? `${result.error.code}: ${result.error.message}` : null,
        hasAuthentication: !!result.authentication,
      });

      if (result.type === "success") {
        console.log("[9][Auth Flow] Authentication successful, fetching user info");
        const { authentication } = result;

        // Get user info using the access token
        const userInfoResponse = await fetch("https://www.googleapis.com/userinfo/v2/me", {
          headers: { Authorization: `Bearer ${authentication.accessToken}` },
        });

        const userData = await userInfoResponse.json();
        console.log("[10][User Info] Retrieved user data:", {
          hasEmail: !!userData.email,
          hasId: !!userData.id,
        });

        setEmail(userData.email);
        setSocialId(userData.id);
        setAccessToken(authentication.accessToken);

        // Exchange authorization code for refresh token
        console.log("[11][Token Exchange] Requesting refresh token");
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            code: authentication.idToken,
            client_id: googleConfig.webClientId,
            client_secret: googleConfig.clientSecret,
            redirect_uri: "https://auth.expo.io",
            grant_type: "authorization_code",
          }).toString(),
        });

        const tokenData = await tokenResponse.json();
        console.log("[12][Token Exchange] Received token response:", {
          hasRefreshToken: !!tokenData.refresh_token,
        });

        setRefreshToken(tokenData.refresh_token);

        const user = {
          email: userData.email,
          first_name: firstName,
          last_name: lastName,
          password: REACT_APP_GOOGLE_LOGIN,
          phone_number: phoneNumber,
          google_auth_token: authentication.accessToken,
          google_refresh_token: tokenData.refresh_token,
          social_id: userData.id,
        };

        console.log("[13][API] Sending user data to server");
        const response = await axios.post("https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/UserSocialSignUp/MMU", user);

        if (response.data.message === "User already exists") {
          console.log("[14a][API] User already exists");
          setUserAlreadyExists(true);
        } else {
          console.log("[14b][API] Signup successful");
          setSignupSuccessful(true);
        }
      } else {
        console.log("[E3][Auth Flow] Google Sign Up was cancelled or failed");
      }
    } catch (error) {
      console.error("[E4][Error] Error during Google Signup:", error);
      Alert.alert("Error", "Failed to complete Google signup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    setUserAlreadyExists(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Google Signup</Text>
          {signupSuccessful ? (
            <View>
              <Text style={styles.successMessage}>Signup Successful</Text>
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("AccountSetup1Login")}>
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <TextInput style={styles.input} placeholder='First Name' placeholderTextColor='#666' value={firstName} onChangeText={setFirstName} autoCapitalize='words' />
                <TextInput style={styles.input} placeholder='Last Name' placeholderTextColor='#666' value={lastName} onChangeText={setLastName} autoCapitalize='words' />
                <TextInput
                  style={styles.input}
                  placeholder='Phone Number'
                  placeholderTextColor='#666'
                  value={phoneNumber}
                  onChangeText={(value) => setPhoneNumber(formatPhoneNumber(value))}
                  keyboardType='phone-pad'
                />
              </View>
              <TouchableOpacity style={[styles.button, !authRequest && styles.buttonDisabled]} onPress={handleGoogleSignup} disabled={!authRequest}>
                <Text style={[styles.buttonText, !authRequest && styles.buttonTextDisabled]}>Sign Up with Google</Text>
              </TouchableOpacity>
              {loading && <ActivityIndicator size='large' color='#E4423F' />}
            </>
          )}
          <Modal visible={userAlreadyExists} transparent animationType='slide'>
            <View style={styles.modalOverlay}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>User Already Exists</Text>
                <TouchableOpacity style={styles.modalButton} onPress={onCancel}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#000",
  },
  inputGroup: {
    marginBottom: 25,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#000",
  },
  button: {
    backgroundColor: "#E4423F",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonTextDisabled: {
    color: "#666",
  },
  successMessage: {
    fontSize: 18,
    textAlign: "center",
    color: "#4CAF50",
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
    color: "#000",
  },
  modalButton: {
    backgroundColor: "#E4423F",
    borderRadius: 10,
    padding: 15,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default GoogleSignup;
