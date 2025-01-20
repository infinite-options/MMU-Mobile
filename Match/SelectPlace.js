import React, { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SelectPlace() {
    const navigation = useNavigation();
    const route = useRoute();
    const { user, selectedDay, selectedTime, AccountUser = [], accountUserData = [] } = route.params || {};

    const [selectedButton, setSelectedButton] = useState("");

    const dateIdeas = ["Dinner", "Drinks", "Coffee", "Lunch", "Movies", "Custom", "Ask Date To Suggest"];
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
    safeArea: {
        flex:1,
    },
    container: {
        padding: 20,
        alignItems: 'center',
        flex: 1,
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
    subtitle: {
        textAlign: 'center',
        fontSize: 14,
        fontFamily: 'Lexend',
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingBottom: 20,
    },
    buttonRow: {
        justifyContent: 'space-around',
        marginBottom: 10,
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
    selectedButton: {
        backgroundColor: '#E4423F',
    },
    interestBorder: {
        borderWidth: 2,
        borderColor: '#E4423F',
    },
    buttonText: {
        fontSize: 16,
        fontFamily: 'Lexend',
        color: '#000',
    },
    selectedButtonText: {
        color: '#FFF',
    },
    nextButton: {
        backgroundColor: '#E4423F',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 20,
        marginTop: 20,
        width: '80%',
        alignItems: 'center',
    },
    nextButtonText: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'Lexend',
    },
});

