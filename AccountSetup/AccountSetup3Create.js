import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Pressable } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import MapView, { Marker } from 'react-native-maps';
import 'react-native-get-random-values';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
// Replace this with your Google Maps API key
const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

export default function AccountSetup3Create({ navigation }) {
  
  const genders = [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Nonbinary", value: "Nonbinary" },
  ];

  const sexualityOptions = [
    { key: "sexualityStraight", label: "Straight" },
    { key: "sexualityBisexual", label: "Bi-sexual" },
    { key: "sexualityTransgender", label: "Transgender" },
    { key: "sexualityLGBTQ", label: "LGBTQ" },
    { key: "sexualityHomosexual", label: "Homosexual" },
  ];

  const openTo = [
    { key: "openToStraight", label: "Straight" },
    { key: "openToBisexual", label: "Bi-sexual" },
    { key: "openToTransgender", label: "Transgender" },
    { key: "openToLGBTQ", label: "LGBTQ" },
    { key: "openToHomosexual", label: "Homosexual" },
  ];
  const [userData, setUserData] = useState({});
  const [savedAddress, setSavedAddress] = useState("");
  const [center, setCenter] = useState({ lat: 37.3541079, lng: -121.9552356 });

  const handleAddressSelection = (data, details) => {
    const selectedAddress = details.formatted_address;
    const lat = details.geometry.location.lat;
    const lng = details.geometry.location.lng;

    setSavedAddress(selectedAddress);
    setCenter({ lat, lng });
  };
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    profileBio: "",
    suburb: "",
    country: "",
    sexuality:"",
    openTo: [],
  });
  const [isChanged, setIsChanged] = useState(false);
  const [loading, setLoading] = useState(true);

  const userId = useRef(null); // UseRef to store userId instead of localStorage

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userIdValue = await AsyncStorage.getItem("user_uid");
        userId.current = userIdValue;

        if (userIdValue) {
          const response = await axios.get(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${userIdValue}`);
          console.log(response.data.result[0]);
          const fetchedData = response.data.result[0];
          const openToArray = fetchedData.user_open_to ? fetchedData.user_open_to.split(",") : [];
          console.log("openToArray", openToArray)
          setUserData(fetchedData);
          setFormData({
            ...formData,
            name: `${fetchedData.user_first_name} ${fetchedData.user_last_name}` || "",
            age: fetchedData.user_age || "",
            gender: fetchedData.user_gender || "",
            profileBio: fetchedData.user_profile_bio || "",
            suburb: fetchedData.user_suburb || "",
            sexuality: fetchedData.user_sexuality || "",
            openTo: openToArray || [],
          });
          if (fetchedData.user_latitude && fetchedData.user_longitude) {
            setCenter({
              lat: Number(fetchedData.user_latitude),
              lng: Number(fetchedData.user_longitude),
            });
            await handleAddress(fetchedData.user_latitude, fetchedData.user_longitude);
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.log("Error fetching data", error);
      }
    };

    fetchUserData();
  }, []);

  const handleAddress = async (lat, lng) => {
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`);
      if (response.ok) {
        const result = await response.json();
        if (result.results.length > 0) {
          const address = result.results[0].formatted_address;
          setSavedAddress(address);
        }
      }
    } catch (error) {
      console.log("Error fetching address:", error);
    }
  };

  const handleChange = (name, value) => {
    setIsChanged(true);
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const handleButton = (id, type) => {
    setIsChanged(true);
  
    if (type === 'sexuality') {
      setFormData({
        ...formData,
        sexuality: id, // Set the selected value directly
      });
    }
  
    else if (type === 'openTo') {
      // Ensure formData[type] is an array before using includes
      const selectedOptions = formData[type] || []; // Initialize as an empty array if undefined
  
      if (selectedOptions.includes(id)) {
        // Remove the option if it's already selected
        const newArray = selectedOptions.filter((item) => item !== id);
        setFormData({
          ...formData,
          [type]: newArray,
        });
      } else {
        // Add the option if it's not selected
        setFormData({
          ...formData,
          [type]: [...selectedOptions, id],
        });
      }
    }
  };
  
  
  const handleNext = async () => {
    const url = "https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo";
    const fd = new FormData();
    const nameArray = formData.name.split(" ");
    const firstName = nameArray[0];
    const lastName = nameArray.length > 1 ? nameArray[nameArray.length - 1] : "";

    fd.append("user_uid", userId.current);
    fd.append("user_email_id", await AsyncStorage.getItem("user_email_id"));
    fd.append("user_first_name", firstName);
    fd.append("user_last_name", lastName);
    fd.append("user_age", formData.age);
    fd.append("user_gender", formData.gender);
    fd.append("user_suburb", formData.suburb);
    fd.append("user_profile_bio", formData.profileBio);
    fd.append("user_country", formData.country);
    fd.append("user_latitude", center["lat"]);
    fd.append("user_longitude", center["lng"]);
    fd.append("user_sexuality", formData.sexuality);
    fd.append("user_open_to", JSON.stringify(formData["openTo"]))

    if (isChanged) {
      try {
        const response = await fetch(url, {
          method: "PUT",
          body: fd,
        });
        if (response.ok) {
          const result = await response.json();
          console.log("Response from server:", result);
        }
      } catch (error) {
        console.log("Error updating user data:", error);
      }
    }
    navigation.navigate("AccountSetup4Create");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerText}>About You</Text>
      <Text style={styles.subHeaderText}>These details are about you and will be public to potential matches on meet me up.</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={formData.name}
        onChangeText={(text) => handleChange("name", text)}
      />
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { width: "48%" }]}
          label= "Age"
          placeholder="Age"
          value={formData.age}
          keyboardType="numeric"
          onChangeText={(text) => handleChange("age", text)}
        />
        <TextInput
          style={[styles.input, { width: "48%" }]}
          placeholder="Gender"
          value={formData.gender}
          onChangeText={(text) => handleChange("gender", text)}
        />
      </View>
      <Text style={styles.label}>Suburb</Text>
      <TextInput
        style={styles.input}
        placeholder="Suburb"
        value={formData.suburb}
        onChangeText={(text) => handleChange("suburb", text)}
      />
      <Text style={styles.label}>Profile Bio</Text>
      <TextInput
        style={styles.input}
        placeholder="Profile Bio"
        value={formData.profileBio}
        multiline={true}
        numberOfLines={4}
        onChangeText={(text) => handleChange("profileBio", text)}
      />

      <Text style={styles.headerText}>Location</Text>
      <Text style={styles.subHeaderText}>Your location helps us pin point where you are to provide better matches to you.</Text>
      <GooglePlacesAutocomplete
        placeholder="Search for a location"
        fetchDetails={true}  // This enables fetching more detailed location data
        onPress={handleAddressSelection}
        query={{
          key: GOOGLE_API_KEY,
          language: 'en',  // Language of the search results
        }}
        styles={{
          textInput: {
            height: 50,
            borderColor: "#ddd",
            borderWidth: 1,
            borderRadius: 5,
            paddingHorizontal: 10,
            marginBottom: 15,
          },
        }}
      />
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: center.lat,
          longitude: center.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker coordinate={{ latitude: center.lat, longitude: center.lng }} />
      </MapView>
         {/* Your Sexuality Section */}
    <View style={styles.optionContainer}>
  <Text style={styles.header}>Your Sexuality</Text>
  <Text style={styles.subHeader}>Select the field that best describes your sexuality</Text>
  {sexualityOptions.map((option) => (
    <TouchableOpacity
      key={option.key}
      onPress={() => handleButton(option.label, 'sexuality')} 
      style={[
        styles.option,
        {
          backgroundColor: formData['sexuality'] === option.label ? 'red' : 'white', 
        },
      ]}
    >
      <Text
        style={[
          styles.optionText,
          {
            color: formData['sexuality'] === option.label ? 'white' : 'black', // Set text color to white if selected
          },
        ]}
      >
        {option.label}
      </Text>
    </TouchableOpacity>
  ))}
</View>

      {/* Open To Section */}
      <View style={styles.optionContainer}>
          <Text style={styles.header}>Open To...</Text>
          <Text style={styles.subHeader}>Select the fields that best describe what you are open to in a partner</Text>
          {openTo.map((option) => (
            <TouchableOpacity
              key={option.key}
              onPress={() => handleButton(option.label, 'openTo')} 
              style={[
                styles.option,
                {
                  backgroundColor: formData['openTo'].includes(option.label) ? 'red' : 'white', 
                },
              ]}
            >
       <Text
        style={[
          styles.optionText,
          {
            color: formData['openTo'].includes(option.label) ? 'white' : 'black', // Set text color to white if selected
          },
        ]}
      >
        {option.label}
      </Text>
            </TouchableOpacity>
          ))}
      </View>


        <View style = {styles.buttonContainer}>
             <Pressable style= {styles.button}onPress={handleNext}>
              <Text style={styles.buttonText}>
                Next
              </Text>
             </Pressable>
             </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  headerText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subHeaderText: {
    fontSize: 14,
    color: "#888",
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  label: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#E4423F",
    marginBottom: 5,
},
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  optionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "left",
  },
  buttonContainer: {
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
},
button: {
  width: 130,
  backgroundColor: '#E4423F',
  borderRadius: 25,
  height: 45,
  justifyContent: 'center',
  alignItems: 'center',
},
buttonText: {
  color: 'white',
  fontSize: 18,
},
  option: {
    backgroundColor: "#ffffff",
    borderRadius: 41,
    marginVertical: 10,
    paddingHorizontal: 5,
    paddingVertical: 10,
    width: "30%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 10,
  },
  optionText: {
    color: "#000000",
    fontSize: 12,
    fontFamily: "sans-serif",
  },
  map: {
    width: "100%",
    height: 300,
    marginBottom: 20,
  },
});

