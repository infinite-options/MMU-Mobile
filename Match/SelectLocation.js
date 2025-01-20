import React, { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SelectLocation() {
    const navigation = useNavigation();
    const route = useRoute();
    const { user, selectedDay, selectedTime, selectedDateIdea, AccountUser = [] } = route.params || {};

    const [formattedAddress, setFormattedAddress] = useState('');
    const [center, setCenter] = useState({
        latitude: -32.015001263602,
        longitude: 115.83650856893345
    });
    const GOOGLE_API_KEY = process.env.REACT_NATIVE_GOOGLE_API_KEY; // Replace with your API key

    const handleNextButton = async () => {
        try {
            await sendDataToAPI(selectedDateIdea, formattedAddress, center.latitude, center.longitude, '200-0000011');
            navigation.navigate('NextSummary', { user, selectedDay, selectedTime, selectedDateIdea, AccountUser, formattedAddress });
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const sendDataToAPI = async (datetype, datelocation, latitude, longitude, uid) => {
        const formData = new FormData();
        formData.append('meet_date_type', datetype);
        formData.append('meet_location', datelocation);
        formData.append('meet_latitude', latitude);
        formData.append('meet_longitude', longitude);
        formData.append('meet_uid', uid);

        try {
            const response = await fetch('https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/meet', {
                method: 'PUT',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const result = await response.json();
            console.log("Success:", result);
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                {AccountUser.length > 0 && AccountUser[0].photo && JSON.parse(AccountUser[0].photo)[0] ? (
                    <Image
                        source={{ uri: JSON.parse(AccountUser[0].photo)[0] }}
                        style={styles.avatar}
                    />
                ) : null}
                {user.user_photo_url && JSON.parse(user.user_photo_url)[0] ? (
                    <Image
                        source={{ uri: JSON.parse(user.user_photo_url)[0] }}
                        style={[styles.avatar, styles.avatarOverlap]}
                    />
                ) : null}
                <Text style={styles.username}>{user.user_first_name}</Text>
            </View>

            <Text style={styles.title}>
                Let's meet up on <Text style={styles.highlightedText}>{selectedDay} {selectedTime}</Text>, and go to <Text style={styles.highlightedText}>{selectedDateIdea}</Text> at the <Text style={styles.highlightedText}>_</Text>
            </Text>

            <GooglePlacesAutocomplete
                placeholder="Enter location"
                onPress={(data, details = null) => {
                    const { lat, lng } = details.geometry.location;
                    const address = data.description;
                    setFormattedAddress(address);
                    setCenter({ latitude: lat, longitude: lng });
                }}
                query={{
                    key: GOOGLE_API_KEY,
                    language: 'en',
                }}
                fetchDetails={true}
                styles={{
                    textInputContainer: styles.textInputContainer,
                    textInput: styles.textInput,
                    predefinedPlacesDescription: {
                        color: '#1faadb',
                    },
                }}
                enablePoweredByContainer={false}
            />

            <MapView
                style={styles.map}
                region={{
                    latitude: center.latitude,
                    longitude: center.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }}
            >
                <Marker coordinate={center} />
            </MapView>

            <TouchableOpacity style={styles.nextButton} onPress={handleNextButton}>
                <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
        </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea:{
        flex: 1,
    },
    container: {
        padding: 20,
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: 'white',
    },
    avatarOverlap: {
        marginLeft: -15,
        zIndex: 1,
    },
    username: {
        fontSize: 20,
        marginLeft: 10,
        fontFamily: 'Lexend',
    },
    title: {
        fontSize: 22,
        textAlign: 'center',
        marginVertical: 15,
        fontFamily: 'Lexend',
    },
    highlightedText: {
        color: '#E4423F',
    },
    textInputContainer: {
        width: '100%',
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    textInput: {
        height: 44,
        borderColor: '#DDD',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
        color: '#333',
    },
    map: {
        width: '100%',
        height: 300,
        borderRadius: 10,
        marginTop: 20,
    },
    nextButton: {
        backgroundColor: '#E4423F',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 20,
        marginTop: 20,
    },
    nextButtonText: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'Lexend',
    },
});
