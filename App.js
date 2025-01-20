import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

import AccountSetup2Create from "./AccountSetup/AccountSetup2Create";
import AccountSetup3Create from "./AccountSetup/AccountSetup3Create";
import AccountSetup4Create from "./AccountSetup/AccountSetup4Create";
import AccountSetup7Summary from "./AccountSetup/AccountSetup7Summary";
import AccountDetails3 from "./AccountDetails/AccountDetails3";

// new pages 
import PersonalDetails from "./AccountSetup/PersonalDetails.js";
import AssignedSex from "./AccountSetup/AssignedSex";
// import { createStackNavigator } from '@react-navigation/stack';
import LandingPage from "./Intro/LandingPage";
import LandingPage2 from "./Intro/LandingPage2";
import LandingPage3 from "./Intro/LandingPage3";
import LandingPage4 from "./Intro/LandingPage4";
import Start from "./Intro/Start";
import AgeVerification from './Intro/AgeVerification';
import TrialAccount from "./Intro/TrialAccount";
import Location from "./Profile/Location";
import Location2 from "./Profile/Location2";
import AccountDetails from "./AccountDetails/AccountDetails";
import AccountSetup1Login from './AccountSetup/AccountSetup1Login';  // Imported the newly created Login
import MatchPreferences from "./Preferences/Preferences";
import Preferences from "./Preferences/Preferences"
import MatchProfileDisplay from "./Match/MatchProfileDisplay"
import MatchPopUp from "./Match/MatchPopUp"
import MatchPopUpTemp from "./Match/MatchPopUpTemp"
import AccountSetup6Available from "./AccountSetup/AccountSetup6Available";
import SelectionResults from "./Match/SelectionResults";
import ViewProfile from "./Match/ViewProfile";
import Match from "./Match/Match";
import MatchDetails from "./Match/MatchDetails";
import AccountSetup5Create from "./AccountSetup/AccountSetup5Create";
import Message from "./Match/Message";
import MatchBegin from "./Match/MatchBegin";
import SelectPlace from "./Match/SelectPlace";
import SelectLocation from "./Match/SelectLocation";
import DateSummary from "./Match/DateSummary";
import NameInput from "./AccountSetup/NameInput.js";
import BirthdayInput from "./AccountSetup/BirthdayInput.js";
import HaveChildren from "./AccountSetup/HaveChildren.js";
import Height from "./AccountSetup/Height.js";
import GenderIdentity from "./AccountSetup/GenderIdentity.js";
import OpenToScreen from "./AccountSetup/OpenToScreen.js";
import SexualOrientationScreen from "./AccountSetup/SexualOrientationScreen.js";
import InterestsScreen from "./AccountSetup/InterestsScreen.js";
import AddMediaScreen from "./AccountSetup/AddMediaScreen.js";
import LocationScreen from "./AccountSetup/LocationScreen.js";
import EnableLocationScreen from "./AccountSetup/EnableLocationScreen.js";
import EnableNotificationsScreen from "./AccountSetup/EnableNotificationsScreen.js";
import MyProfile from "./Profile/MyProfile.js";
import DateAvailability from "./DatePreferences/DateAvailability.js";
import TypeOfDate from "./DatePreferences/TypeOfDate.js";
import AdditionalDetailsOne from "./AdditionalDetails/AdditionalDetailsOne.js";
import AdditionalDetailsTwo from "./AdditionalDetails/AdditionalDetailsTwo.js";
import AdditionalDetailsThree from "./AdditionalDetails/AdditionalDetailsThree.js";
import AdditionalDetailsFour from "./AdditionalDetails/AdditionalDetailsFour.js";
import AdditionalDetailsFive from "./AdditionalDetails/AdditionalDetailsFive.js";
import AdditionalDetailsSix from "./AdditionalDetails/AdditionalDetailsSix.js";
import AdditionalDetailsSeven from "./AdditionalDetails/AdditionalDetailsSeven.js";
import AdditionalDetailsEight from "./AdditionalDetails/AdditionalDetailsEight.js";
import ProfileBio from "./ProfileBio/ProfileBio.js";
import VerifyPhoneNumber1 from "./VerifyYourAccount/VerifyPhoneNumber1.js";
import VerifyPhoneNumber2 from "./VerifyYourAccount/VerifyPhoneNumber2.js";
import AddDriversLicense from "./VerifyYourAccount/AddDriversLicense.js";
import Login from "./AccountSetup/Login.js";
import EditProfile from "./Profile/EditProfile.js";
import MatchPageNew from "./Match/MatchPageNew.js";
import MatchResultsPage from "./Match/MatchResultsPage.js";
const Stack = createNativeStackNavigator();
// const Stack = createStackNavigator();
SplashScreen.preventAutoHideAsync();
export default function App() {
  const [fontsLoaded] = useFonts({
    'Inria Sans': require('./assets/fonts/InriaSans-Regular.ttf'),
    'InriaSans-Bold': require('./assets/fonts/InriaSans-Bold.ttf'),
    'Lexend': require('./assets/fonts/Lexend-Regular.ttf'),
    'Lexend-Regular': require('./assets/fonts/Lexend-Regular.ttf'),
    'Lexend-Bold': require('./assets/fonts/Lexend-Bold.ttf'),
    'DM Sans': require('./assets/fonts/DMSans-Regular.ttf'),
  });

  // Once fonts are loaded, hide the splash screen
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // If fonts aren’t loaded yet, return null or a temporary loading component
  if (!fontsLoaded) {
    return null; 
  }
  return (
    <NavigationContainer>
      {/*
      <Stack.Navigator initialRouteName='AccountSetup2Create'>
        <Stack.Screen name='AccountSetup2Create' component={AccountSetup2Create} />
        <Stack.Screen name='AccountSetup3Create' component={AccountSetup3Create} />
        <Stack.Screen name='AccountSetup4Create' component={AccountSetup4Create} />
      </Stack.Navigator>
  */}
      {/* <Stack.Navigator initialRouteName='Start' screenOptions={{ headerShown: false }}> */}
      <Stack.Navigator initialRouteName='Start' screenOptions={{ headerShown: false }}>
        <Stack.Screen name='Preferences' component={Preferences}/>
        <Stack.Screen name='MatchPageNew' component={MatchPageNew}/>
        <Stack.Screen name='MatchResultsPage' component={MatchResultsPage}/>
       <Stack.Screen name='MatchProfileDisplay' component={MatchProfileDisplay}/> 
       <Stack.Screen name='MatchPopUp' component={MatchPopUp}/>
        <Stack.Screen name='MatchPopUpTemp' component={MatchPopUpTemp}/>
        <Stack.Screen name='Start' component={Start} />
        <Stack.Screen name="AgeVerification" component={AgeVerification} />
        <Stack.Screen name='LandingPage' component={LandingPage} />
        <Stack.Screen name='LandingPage2' component={LandingPage2} />
        <Stack.Screen name='LandingPage3' component={LandingPage3} />
        <Stack.Screen name='LandingPage4' component={LandingPage4} />
        <Stack.Screen name='TrialAccount' component={TrialAccount} />
        <Stack.Screen name='AccountSetup1Login' component={AccountSetup1Login}/>
        <Stack.Screen name='AccountSetup2Create' component={AccountSetup2Create} />
        <Stack.Screen name='Login' component={Login} />
        <Stack.Screen name='PersonalDetails' component={PersonalDetails} />
        {/* Created ui prefered pages for personal details */}
        <Stack.Screen name='NameInput' component={NameInput} />
        <Stack.Screen name='BirthdayInput' component={BirthdayInput} />
        <Stack.Screen name='Height' component={Height} />
        <Stack.Screen name='HaveChildren' component={HaveChildren} />
        <Stack.Screen name="AssignedSex" component={AssignedSex} />
        <Stack.Screen name="GenderIdentity" component={GenderIdentity} />
        <Stack.Screen name="OpenToScreen" component={OpenToScreen} />
        <Stack.Screen name="SexualOrientationScreen" component={SexualOrientationScreen} />
        <Stack.Screen name="InterestsScreen" component={InterestsScreen} />
        <Stack.Screen name="AddMediaScreen" component={AddMediaScreen} />
        <Stack.Screen name="LocationScreen" component={LocationScreen} />
        <Stack.Screen name="EnableLocationScreen" component={EnableLocationScreen} />
        <Stack.Screen name="EnableNotificationsScreen" component={EnableNotificationsScreen} />
        <Stack.Screen name="MyProfile" component={MyProfile} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="DateAvailability" component={DateAvailability} />
        <Stack.Screen name="TypeOfDate" component={TypeOfDate} />
        <Stack.Screen name="AdditionalDetailsOne" component={AdditionalDetailsOne} />
        <Stack.Screen name="AdditionalDetailsTwo" component={AdditionalDetailsTwo} />
        <Stack.Screen name="AdditionalDetailsThree" component={AdditionalDetailsThree} />
        <Stack.Screen name="AdditionalDetailsFour" component={AdditionalDetailsFour} />
        <Stack.Screen name="AdditionalDetailsFive" component={AdditionalDetailsFive} />
        <Stack.Screen name="AdditionalDetailsSix" component={AdditionalDetailsSix} />
        <Stack.Screen name="AdditionalDetailsSeven" component={AdditionalDetailsSeven} />
        <Stack.Screen name="AdditionalDetailsEight" component={AdditionalDetailsEight} />
        <Stack.Screen name="ProfileBio" component={ProfileBio} />
        <Stack.Screen name="VerifyPhoneNumber1" component={VerifyPhoneNumber1} />
        <Stack.Screen name="VerifyPhoneNumber2" component={VerifyPhoneNumber2} />
        <Stack.Screen name="AddDriversLicense" component={AddDriversLicense} />
        {/* <Stack.Screen name="GenderIdentity" component={GenderIdentity} />
        <Stack.Screen name="SexualOrientation" component={SexualOrientation} />
        <Stack.Screen name="OpenTo" component={OpenTo} />
        <Stack.Screen name="Interests" component={Interests} />
        <Stack.Screen name="VideoAndPhotos" component={VideoAndPhotos} />
        <Stack.Screen name="Location" component={LocationScreen} /> */}
        <Stack.Screen name='AccountSetup3Create' component={AccountSetup3Create} />
        <Stack.Screen name='AccountSetup4Create' component={AccountSetup4Create} />
        <Stack.Screen name='Location' component={Location} />
        <Stack.Screen name='Location2' component={Location2} />
        <Stack.Screen name='AccountDetails' component={AccountDetails} />
        <Stack.Screen name = "AccountDetails3" component={AccountDetails3}/>
        <Stack.Screen name='AccountSetup7Summary' component={AccountSetup7Summary} />
        <Stack.Screen name='MatchPreferences' component={MatchPreferences}/>
        {/* <Stack.Screen name='Preferences' component={Preferences}/> */}
        <Stack.Screen name = "AccountSetup6Available" component={AccountSetup6Available}/>
        <Stack.Screen name ="SelectionResults" component={SelectionResults}/>
        <Stack.Screen name="ViewProfile" component={ViewProfile}/>
        <Stack.Screen name="Match" component={Match}/>
        <Stack.Screen name="user-details" component={MatchDetails}/>
        <Stack.Screen name="AccountSetup5Create" component={AccountSetup5Create} />
        <Stack.Screen name="Message" component={Message}/>
        <Stack.Screen name="Begin" component={MatchBegin}/>
        <Stack.Screen name="SelectPlace" component={SelectPlace}/>
        <Stack.Screen name="SelectLocation" component={SelectLocation}/>
        <Stack.Screen name="NextSummary" component={DateSummary}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
