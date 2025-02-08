import React, { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SelectPlace() {
    const navigation = useNavigation();
    const route = useRoute();
    const { user, selectedDay, selectedTime, AccountUser = [], accountUserData = [] } = route.params || {};

    const [selectedButton, setSelectedButton] = useState('');

    const dateIdeas = ['Dinner', 'Drinks', 'Coffee', 'Lunch', 'Movies', 'Custom', 'Ask Date To Suggest'];
    const userInterests = user?.user_date_interests ? user.user_date_interests.split(',') : [];

    const handleButtonClick = (buttonName) => {
        setSelectedButton(buttonName);
    };

    const handleNextButton = () => {
        navigation.navigate('SelectLocation', {
            user,
            selectedDay,
            selectedTime,
            selectedDateIdea: selectedButton,
            AccountUser
        });
    };

    const renderDateIdeaButton = ({ item }) => {
        const isUserInterest = userInterests.includes(item);
        const isSelected = selectedButton === item;

        return (
            <TouchableOpacity
                onPress={() => handleButtonClick(item)}
                style={[
                    styles.dateIdeaButton,
                    isSelected && styles.selectedButton,
                    isUserInterest && styles.interestBorder,
                ]}
            >
                <Text style={[styles.buttonText, isSelected && styles.selectedButtonText]}>{item}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
            <View style={styles.header}>
                {AccountUser.length > 0 && AccountUser[0].photo ? (
                    <Image
                        source={{ uri: JSON.parse(AccountUser[0].photo)[0] || undefined }}
                        style={styles.avatar}
                    />
                ) : null}
                {user.user_photo_url ? (
                    <Image
                        source={{ uri: JSON.parse(user.user_photo_url)[0] || undefined }}
                        style={[styles.avatar, styles.avatarOverlap]}
                    />
                ) : null}
                <Text style={styles.username}>{user.user_first_name}</Text>
            </View>

            <Text style={styles.title}>
                Let's meet up on 
                <Text style={styles.highlightedText}> {selectedDay} {selectedTime}</Text>, and go to
                <Text style={styles.highlightedText}> _</Text>
            </Text>

            <Text style={styles.subtitle}>Select a pre-filled date idea or suggest your own idea.</Text>

            <FlatList
                data={dateIdeas}
                renderItem={renderDateIdeaButton}
                keyExtractor={(item) => item}
                numColumns={2}
                columnWrapperStyle={styles.buttonRow}
                contentContainerStyle={styles.buttonContainer}
            />

            <TouchableOpacity style={styles.nextButton} onPress={handleNextButton}>
                <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
        </View>
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
    buttonContainer: {
        alignItems: 'center',
        flexDirection: 'column',
        paddingBottom: 20,
    },
    buttonRow: {
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    buttonText: {
        color: '#000',
        fontFamily: 'Lexend',
        fontSize: 16,
    },
    container: {
        alignItems: 'center',
        flex: 1,
        padding: 20,
    },
    dateIdeaButton: {
        margin: 10,
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,  // More rounded corners
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 140,
        width: '45%',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    header: {
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: 20,
    },
    highlightedText: {
        color: '#E4423F',
    },
    interestBorder: {
        borderColor: '#E4423F',
        borderWidth: 2,
    },
    nextButton: {
        alignItems: 'center',
        backgroundColor: '#E4423F',
        borderRadius: 20,
        marginTop: 20,
        paddingHorizontal: 40,
        paddingVertical: 15,
        width: '80%',
    },
    nextButtonText: {
        color: 'white',
        fontFamily: 'Lexend',
        fontSize: 18,
    },
    safeArea: {
        flex:1,
    },
    selectedButton: {
        backgroundColor: '#E4423F',
    },
    selectedButtonText: {
        color: '#FFF',
    },
    subtitle: {
        fontFamily: 'Lexend',
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
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

