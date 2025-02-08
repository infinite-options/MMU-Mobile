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
            console.log('Success:', result);
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
    avatar: {
        borderColor: 'white',
        borderRadius: 25,
        borderWidth: 2,
        height: 50,
        width: 50,
    },
    avatarOverlap: {
        marginLeft: -15,
        zIndex: 1,
    },
    container: {
        alignItems: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: 20,
    },
    highlightedText: {
        color: '#E4423F',
    },
    map: {
        borderRadius: 10,
        height: 300,
        marginTop: 20,
        width: '100%',
    },
    nextButton: {
        backgroundColor: '#E4423F',
        borderRadius: 20,
        marginTop: 20,
        paddingHorizontal: 40,
        paddingVertical: 15,
    },
    nextButtonText: {
        color: 'white',
        fontFamily: 'Lexend',
        fontSize: 18,
    },
    safeArea:{
        flex: 1,
    },
    textInput: {
        backgroundColor: '#FFFFFF',
        borderColor: '#DDD',
        borderRadius: 10,
        borderWidth: 1,
        color: '#333',
        fontSize: 16,
        height: 44,
        paddingHorizontal: 10,
    },
    textInputContainer: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        width: '100%',
    },
    title: {
        fontFamily: 'Lexend',
        fontSize: 22,
        marginVertical: 15,
        textAlign: 'center',
    },
    username: {
        fontFamily: 'Lexend',
        fontSize: 20,
        marginLeft: 10,
    },
});
