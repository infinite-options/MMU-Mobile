import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
export default function MatchPopUp({ user, userStates, setUserStates, index }) {
    const navigation = useNavigation();
    const [accountUser, setAccountUser] = useState([]);
    const userId = AsyncStorage.getItem('user_uid'); // Get user ID from AsyncStorage
    const handleBegin = () => {
        navigation.navigate('Begin', { user, accountUser });
    };

    const handleDislike = async () => {
        if (userStates) {
            const updatedStates = [...userStates];
            updatedStates[index].liked = false;
            updatedStates[index].showPopup = false;
            setUserStates(updatedStates);

            const fd = new FormData();
            fd.append('liker_user_id', userId);
            fd.append('liked_user_id', user.user_uid);
            console.log('JISNE LIKE KIYA',user.user_uid);
            try {
                await axios.delete('https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/likes', { data: fd });
                console.log('User unliked successfully');
            } catch (error) {
                console.error('Error unliking user:', error);
            }
        }
        navigation.navigate('Match');
    };

    useEffect(() => {
        const fetchAccountUser = async () => {
            try {
                const userId = await AsyncStorage.getItem('user_uid'); 
                console.log('Trying to fetch user ID', userId);
                const res = await axios.get(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${userId}`);
                const userData = res.data.result[0];
                setAccountUser({
                    name: userData.user_first_name,
                    photo: userData.user_photo_url ? JSON.parse(userData.user_photo_url)[0] : ''
                });
            } catch (error) {
                console.error('Error fetching account user data:', error);
            }
        };
        fetchAccountUser();
    }, []);

    return (
        <View style={styles.overlay}>
            <View style={styles.container}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: accountUser.photo }}
                        style={[styles.avatar, { zIndex: 1 }]}
                    />
                   <Image
    source={{ uri: user.user_photo_url ? JSON.parse(user.user_photo_url)[0] : '' }}
    style={[styles.avatar, styles.overlappingAvatar]}
/>
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.matchText}>It's A Match!</Text>
                    <Text style={styles.bodyText}>
                        Let's start by creating a date with {'\n'}
                        {user.user_first_name} {user.user_last_name} and you
                    </Text>
                    <TouchableOpacity onPress={handleBegin} style={styles.button}>
                        <Text style={styles.buttonText}>Begin!</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDislike} style={[styles.button, styles.dislikeButton]}>
                        <Text style={styles.buttonText}>Dislike</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    avatar: {
        borderColor: 'white',
        borderRadius: 30,
        borderWidth: 2,
        height: 60,
        width: 60,
    },
    avatarContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginRight: 15,
    },
    bodyText: {
        fontSize: 14,
        marginVertical: 10,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#E4423F',
        borderRadius: 25,
        marginTop: 10,
        paddingHorizontal: 20,
        paddingVertical: 10,
        width: 120,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
    },
    container: {
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 30,
        elevation: 10,
        flexDirection: 'row',
        maxWidth: 400,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        width: 300,
    },
    dislikeButton: {
        backgroundColor: '#555', // Different color for the Dislike button
        marginTop: 5,
    },
    matchText: {
        color: '#E4423F',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    overlappingAvatar: {
        borderColor: 'white',
        borderWidth: 2,
        marginLeft: -15,
    },
    overlay: {
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        height: '100%',
        justifyContent: 'center',
        left: 0,
        position: 'absolute',
        top: 0,
        width: '100%',
        zIndex: 2,
    },
    textContainer: {
        alignItems: 'center',
        flex: 1,
    },
});
