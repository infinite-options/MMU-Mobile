import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountSetup5Create() {
    const [formData, setFormData] = useState({ image: '', imgFav: '', video: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const navigation = useNavigation();

    useEffect(() => {
        const requestPermissionsAndFetchUserData = async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'This app needs permission to access your photo library.');
            }

            try {
                const storedUserId = await AsyncStorage.getItem('user_uid');
                const storedUserEmail = await AsyncStorage.getItem('user_email_id');
                if (storedUserId && storedUserEmail) {
                    setUserId(storedUserId);
                    setUserEmail(storedUserEmail);
                    await fetchUserData(storedUserId); // Fetch already uploaded images and video
                } else {
                    Alert.alert('User data not found', 'Please log in again.');
                    navigation.navigate('Login');
                }
            } catch (e) {
                console.error('Error fetching user data', e);
            }
        };
        requestPermissionsAndFetchUserData();
    }, []);

    const fetchUserData = async (userId) => {
        try {
            const response = await axios.get(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${userId}`);
            const fetchedData = response.data.result[0];

            if (fetchedData.user_photo_url) {
                const imageArray = JSON.parse(fetchedData.user_photo_url);
                setFormData(prevData => ({ ...prevData, image: imageArray.join(',') })); // Set images in the state
            }

            if (fetchedData.user_video_url) {
                setFormData(prevData => ({ ...prevData, video: fetchedData.user_video_url })); // Set video URL in the state
            }
        } catch (error) {
            console.error('Error fetching user data', error);
            Alert.alert('Error', 'Failed to fetch existing media. Please try again later.');
        }
    };

    const handleImageUpload = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.5,
            });

            const imageUri = result.assets ? result.assets[0].uri : result.uri;

            if (!result.cancelled && imageUri) {
                setFormData(prevData => ({
                    ...prevData,
                    image: prevData.image ? `${prevData.image},${imageUri}` : imageUri,
                }));
            } else {
                console.log('Image picker was cancelled or returned no URI.');
            }
        } catch (error) {
            console.error('Error selecting or uploading image:', error);
            Alert.alert('Error', 'There was an issue processing the image. Please try again.');
        }
    };

    const handleVideoUpload = async () => {
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: true,
                quality: 0.5,
            });

            const videoUri = result.assets ? result.assets[0].uri : result.uri;

            if (!result.cancelled && videoUri) {
                setFormData(prevData => ({
                    ...prevData,
                    video: videoUri,
                }));
            } else {
                console.log('Video picker was cancelled or returned no URI.');
            }
        } catch (error) {
            console.error('Error selecting or uploading video:', error);
            Alert.alert('Error', 'There was an issue processing the video. Please try again.');
        }
    };

    const uploadMediaToBackend = async () => {
        setIsLoading(true);

        const uploadData = new FormData();
        uploadData.append('user_uid', userId);
        uploadData.append('user_email_id', userEmail);

        const imageArray = formData.image.split(',').filter(img => img);
        imageArray.forEach((imageUri, index) => {
            uploadData.append(`img_${index}`, {
                uri: imageUri,
                type: 'image/jpeg',
                name: `img_${index}.jpg`
            });
        });

        if (formData.video) {
            uploadData.append('user_video', {
                uri: formData.video,
                type: 'video/mp4',
                name: 'video_filename.mp4'
            });
        }

        try {
            const response = await axios.put(
                'https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo',
                uploadData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (response.status === 200) {
                Alert.alert('Success', 'Media uploaded successfully!');
            } else {
                console.error('Failed to upload media:', response);
                Alert.alert('Error', 'Failed to upload media to the server. Please try again.');
            }
        } catch (error) {
            console.error('Upload Error:', error.message);
            Alert.alert('Error', 'There was an error uploading the media. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (imgUri) => {
        const updatedImages = formData.image.split(',').filter((img) => img !== imgUri).join(',');
        setFormData(prevData => ({
            ...prevData,
            image: updatedImages,
            imgFav: prevData.imgFav === imgUri ? '' : prevData.imgFav,
        }));
    };

    const handleDeleteVideo = () => {
        setFormData(prevData => ({ ...prevData, video: '' }));
    };

    const handleNext = async () => {
        await uploadMediaToBackend();
        navigation.replace('AccountSetup7Summary');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.header}>Profile Creation</Text>
                </View>

                <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                        <View style={styles.progress}></View>
                    </View>
                    <Text style={styles.progressText}>80%</Text>
                </View>

                <Text style={styles.sectionTitle}>Images and Video</Text>
                <Text style={styles.sectionSubtitle}>Upload media to represent yourself.</Text>

                <View style={styles.imagePreviewContainer}>
                    {formData.image.split(',').filter(Boolean).map((img, index) => (
                        <View key={index} style={styles.imageContainer}>
                            <Image source={{ uri: img }} style={styles.image} />
                            <TouchableOpacity onPress={() => handleDelete(img)} style={styles.deleteButton}>
                                <Text style={styles.deleteButtonText}>✖</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                    {formData.video ? (
                        <View style={styles.videoContainer}>
                            <Text>Video Recorded</Text>
                            <TouchableOpacity onPress={handleDeleteVideo} style={styles.deleteButton}>
                                <Text style={styles.deleteButtonText}>✖</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </View>

                <TouchableOpacity onPress={handleImageUpload} style={styles.uploadButton}>
                    <Text style={styles.uploadText}>Upload Image</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleVideoUpload} style={styles.uploadButton}>
                    <Text style={styles.uploadText}>Record Video</Text>
                </TouchableOpacity>

                {isLoading ? (
                    <ActivityIndicator size="large" color="#E4423F" />
                ) : (
                    <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                        <Text style={styles.nextText}>Next</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    backButton: { marginRight: 10 },
    backText: { color: '#000', fontSize: 24 },
    container: { backgroundColor: '#f7f7f7', flex: 1, padding: 20 },
    deleteButton: { backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: 15, padding: 2, position: 'absolute', right: 5, top: 5 },
    deleteButtonText: { color: '#fff', fontSize: 12 },
    header: { color: '#333', fontSize: 26, fontWeight: 'bold' },
    headerContainer: { alignItems: 'center', flexDirection: 'row', marginBottom: 20 },
    image: { borderRadius: 5, height: 150, width: 100 },
    imageContainer: { margin: 5, position: 'relative' },
    imagePreviewContainer: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 10 },
    nextButton: { alignItems: 'center', backgroundColor: '#E4423F', borderRadius: 45, padding: 15, width: 200 },
    nextText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    progress: { backgroundColor: '#E4423F', height: '100%', width: '80%' },
    progressBar: { backgroundColor: '#ddd', borderRadius: 5, flex: 1, height: 10, marginRight: 10, overflow: 'hidden' },
    progressBarContainer: { alignItems: 'center', flexDirection: 'row', marginBottom: 20 },
    progressText: { color: '#E4423F', fontSize: 14, fontWeight: 'bold' },
    safeArea: { flex: 1 },
    sectionSubtitle: { color: '#666', fontSize: 14, marginBottom: 10 },
    sectionTitle: { color: '#333', fontSize: 18, fontWeight: 'bold', marginBottom: 5, marginTop: 20 },
    uploadButton: { alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 45, marginVertical: 10, padding: 15, width: 200 },
    uploadText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    videoContainer: { alignItems: 'center', backgroundColor: '#ddd', borderRadius: 5, marginTop: 10, padding: 20, position: 'relative' },
});
