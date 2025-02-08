import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import profileImg from '../src/Assets/Images/profileimg.png';
import like from '../src/Assets/Images/like.png';
import likedImg from '../src/Assets/Images/filledheart.png';

const Match = () => {
    const navigation = useNavigation();
    const [userData, setUserData] = useState([]);
    const [userStates, setUserStates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState(null);

    // Load userId and liked users on initial load
    useEffect(() => {
        const initialize = async () => {
            try {
                const storedUserId = await AsyncStorage.getItem('user_uid');
                setUserId(storedUserId);

                if (storedUserId) {
                    // Fetch liked users from the backend
                    const likedResponse = await axios.get(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/likes/${storedUserId}`);
                    const likedUserIds = likedResponse.data.people_whom_you_selected.map(user => user.user_uid);
                    await AsyncStorage.setItem('liked_user_ids', JSON.stringify(likedUserIds));
                }
            } catch (error) {
                console.error('Error initializing data:', error);
            }
        };
        initialize();
    }, []);

    // Fetch match data and initialize the liked state
    useEffect(() => {
        const fetchMatches = async () => {
            if (userId) {
                try {
                    const res = await axios.get(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/matches/${userId}`);
                    if (res.data.result && Array.isArray(res.data.result)) {
                        setUserData(res.data.result);

                        // Initialize user states based on stored liked status
                        const storedLikes = await AsyncStorage.getItem('liked_user_ids');
                        const likedUserIds = storedLikes ? JSON.parse(storedLikes) : [];

                        const initialUserStates = res.data.result.map(user => ({
                            isFlipped: false,
                            liked: likedUserIds.includes(user.user_uid),
                        }));
                        setUserStates(initialUserStates);
                    } else {
                        console.log('API did not return expected data structure:', res.data);
                    }
                } catch (error) {
                    console.log('Error fetching data:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchMatches();
    }, [userId]);

    // Handle navigation to the profile view
    const handleProfile = (user) => {
        navigation.navigate('ViewProfile', { user });
    };

    // Handle like/unlike functionality and update AsyncStorage
    const handleLike = async (index, user) => {
        const updatedLikedStatus = !userStates[index]?.liked;
        setUserStates(prevStates => 
            prevStates.map((state, i) => i === index ? { ...state, liked: updatedLikedStatus } : state)
        );

        const formData = new FormData();
        formData.append('liker_user_id', userId);
        formData.append('liked_user_id', user.user_uid);

        try {
            if (updatedLikedStatus) {
                await axios.post('https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/likes', formData);
                const likedUserIds = await AsyncStorage.getItem('liked_user_ids');
                const updatedLikedUserIds = likedUserIds ? JSON.parse(likedUserIds).concat(user.user_uid) : [user.user_uid];
                await AsyncStorage.setItem('liked_user_ids', JSON.stringify(updatedLikedUserIds));
            } else {
                await axios.delete('https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/likes', { data: formData });
                const likedUserIds = await AsyncStorage.getItem('liked_user_ids');
                const updatedLikedUserIds = likedUserIds ? JSON.parse(likedUserIds).filter(id => id !== user.user_uid) : [];
                await AsyncStorage.setItem('liked_user_ids', JSON.stringify(updatedLikedUserIds));
            }
        } catch (error) {
            console.error('Error handling like action', error);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E4423F" />
                <Text>Loading Matches...</Text>
            </View>
        );
    }

    return (
        <ScrollView>
            <View style={styles.container}>
                {userData.length === 0 ? (
                    <Text>No matches found.</Text>
                ) : (
                    userData.map((user, index) => (
                        <View key={user.user_uid || index} style={styles.cardContainer}>
                            <View style={styles.card}>
                                <TouchableOpacity onPress={() => handleLike(index, user)} style={styles.likeButton}>
                                    <Image source={userStates[index]?.liked ? likedImg : like} style={styles.likeIcon} />
                                </TouchableOpacity>
                                <Image source={user.user_photo_url ? { uri: user.user_photo_url } : profileImg} style={styles.profileImage} />
                                <Text style={styles.userName}>
                                    {user.user_first_name || 'Unknown'} {user.user_last_name || 'User'}
                                </Text>
                                <Text style={styles.userDetails}>
                                    {user.user_age || 'N/A'} - {user.user_gender || 'N/A'} - {user.user_suburb || 'N/A'}
                                </Text>
                                <TouchableOpacity onPress={() => handleProfile(user)} style={styles.profileButton}>
                                    <Text style={styles.flipText}>Tap to See Profile</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity onPress={() => navigation.navigate('MatchPreferences')}>
                        <View style={styles.button}>
                            <Text style={styles.buttonText}>Back</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('SelectionResults')}>
                        <View style={styles.button}>
                            <Text style={styles.buttonText}>Continue</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#E4423F',
        borderRadius: 25,
        paddingHorizontal: 40,
        paddingVertical: 15,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
    },
    card: {
        alignItems: 'center',
        backgroundColor: '#E4423F',
        borderRadius: 10,
        height: 400,
        justifyContent: 'space-between',
        padding: 15,
        position: 'relative',
        width: '100%',
    },
    cardContainer: {
        marginBottom: 20,
    },
    container: {
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    flipText: {
        color: 'white',
        fontSize: 18,
    },
    likeButton: {
        position: 'absolute',
        right: 10,
        top: 10,
        zIndex: 1,
    },
    likeIcon: {
        height: 30,
        width: 30,
    },
    loadingContainer: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    profileButton: {
        alignItems: 'center',
        backgroundColor: '#E4423F',
        borderRadius: 10,
        paddingVertical: 10,
        width: '100%',
    },
    profileImage: {
        borderRadius: 10,
        height: '75%',
        width: '100%',
    },
    userDetails: {
        color: 'white',
        fontSize: 12,
    },
    userName: {
        color: 'white',
        fontSize: 20,
        marginTop: 10,
    },
});

export default Match;
