import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function DateSummary() {
    const navigation = useNavigation();
    const route = useRoute();
    const { user, selectedDay, selectedTime, selectedDateIdea, AccountUser = [], formattedAddress } = route.params || {};
    const [userId, setUserId] = useState(null);
    const [sliderValue, setSliderValue] = useState(0);

    useEffect(() => {
        const getUserId = async () => {
            const id = await AsyncStorage.getItem('user_uid');
            setUserId(id);
        };
        getUserId();
    }, []);

    const handleMessage = () => {
        navigation.navigate('Message', { user });
    };

    const handleSliderChange = (newValue) => {
        if (newValue < 80) {
            setSliderValue(newValue);
            navigation.navigate('Message', { user });
        } else {
            setSliderValue(100);  // Lock at 100 to simulate completion
        }
    };

    const handleSend = () => {
        if (!userId) return;

        const fd = new FormData();
        fd.append('meet_user_id', userId);
        fd.append('meet_date_user_id', user.user_uid);
        fd.append('meet_day', selectedDay);
        fd.append('meet_time', selectedTime);
        fd.append('meet_date_type', selectedDateIdea);
        fd.append('meet_location', formattedAddress);

        const msg = `Let's meet up on ${selectedDay} ${selectedTime} and go to ${selectedDateIdea} at ${formattedAddress}`;

        axios.post('https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/meet', fd)
            .then(res => console.log(res));

        axios.post('https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/messages', {
            sender_id: userId,
            receiver_id: user.user_uid,
            message_content: msg
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
    };

    useEffect(() => {
        if (sliderValue === 100) {
            handleSend();
        }
    }, [sliderValue]);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                <View style={styles.userInfo}>
                    <Image 
                        source={
                            AccountUser.length > 0 && AccountUser[0].photo 
                                ? { uri: JSON.parse(AccountUser[0].photo)[0] }
                                : require('../src/Assets/Images/account.png')
                        }
                        style={styles.profileImageLeft}
                    />
                    <Image 
                        source={
                            user.user_photo_url
                                ? { uri: JSON.parse(user.user_photo_url)[0] }
                                : require('../src/Assets/Images/account.png')
                        }
                        style={styles.profileImageRight}
                    />
                    <Text style={styles.userName}>{user.user_first_name}</Text>
                </View>

                <Text style={styles.meetingText}>
                    Let's meet up on <Text style={{ color: '#E4423F' }}>{selectedDay} {selectedTime}</Text>, and go to <Text style={{ color: '#E4423F' }}>{selectedDateIdea}</Text> at <Text style={{ color: '#E4423F' }}>{formattedAddress}</Text>
                </Text>

                <View style={styles.editableItemsContainer}>
                    <EditableItem label="Date & Time" value={`${selectedDay} ${selectedTime}`} />
                    <EditableItem label="Date Theme" value={selectedDateIdea} />
                    <EditableItem label="Location" value={formattedAddress} />
                </View>

                <View style={styles.sliderContainer}>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={100}
                        step={1}
                        value={sliderValue}
                        onValueChange={handleSliderChange}
                        thumbTintColor="white"
                        minimumTrackTintColor="white"
                    />
                    <Text style={styles.sliderText}>Slide to send</Text>
                </View>

                <TouchableOpacity
                    onPress={handleMessage}
                    style={styles.messageButton}
                >
                    <Text style={styles.messageButtonText}>Message!</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const EditableItem = ({ label, value }) => (
    <View style={styles.editableItem}>
        <Text style={styles.editableLabel}>{label}</Text>
        <View style={styles.editableValueContainer}>
            <Text style={styles.editableValue}>{value}</Text>
            <TouchableOpacity style={{ marginLeft: 5 }}>
                <Image source={require('../src/Assets/Images/EditIcon.png')} style={styles.editIcon} />
            </TouchableOpacity>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        flex: 1,
        padding: 20,
    },
    editIcon: {
        height: 14,
        width: 14,
    },
    editableItem: {
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        padding: 10,
    },
    editableItemsContainer: {
        width: '100%',
    },
    editableLabel: {
        fontFamily: 'Lexend',
        fontSize: 14,
    },
    editableValue: {
        color: '#555',
        fontFamily: 'Lexend',
        fontSize: 14,
        textAlign: 'right',
    },
    editableValueContainer: {
        alignItems: 'center',
        flexDirection: 'row',
    },
    meetingText: {
        fontFamily: 'Lexend',
        fontSize: 23,
        marginVertical: 20,
        textAlign: 'center',
    },
    messageButton: {
        backgroundColor: '#E4423F',
        borderRadius: 18,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    messageButtonText: {
        color: 'white',
        fontFamily: 'Lexend',
        fontSize: 16,
    },
    profileImageLeft: {
        borderColor: 'white',
        borderRadius: 25,
        borderWidth: 2,
        height: 50,
        marginRight: -15,
        width: 50,
        zIndex: 1,
    },
    profileImageRight: {
        borderColor: 'white',
        borderRadius: 25,
        borderWidth: 2,
        height: 50,
        marginLeft: -15,
        width: 50,
        zIndex: 0,
    },
    slider: {
        color: 'white',
        height: 50,
        width: '100%',
    },
    sliderContainer: {
        alignItems: 'center',
        backgroundColor: '#E4423F',
        borderRadius: 25,
        height: 50,
        justifyContent: 'center',
        marginBottom: 20,
        marginTop: 30,
        maxWidth: 300,
        width: '100%',
    },
    sliderText: {
        color: 'white',
        fontFamily: 'Lexend',
        fontSize: 16,
        position: 'absolute',
        textAlign: 'center',
    },
    userInfo: {
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: 20,
    },
    userName: {
        fontFamily: 'Lexend',
        fontSize: 20,
        marginLeft: 10,
    },
});
