import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    StatusBar,
    Alert,
    ScrollView,
    Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../src/Assets/Components/ProgressBar';
import { decrementStepCount } from '../Profile/profileStepsState';

export default function AdditionalDetailsEight({navigation, route}) {
    const stepIndex = route.params?.stepIndex ?? null;
    const [selectedSign, setSelectedSign] = useState('');
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const starSigns = [
        'Aries',
        'Taurus',
        'Gemini',
        'Cancer',
        'Leo',
        'Virgo',
        'Libra',
        'Scorpio',
        'Sagittarius',
        'Capricorn',
        'Aquarius',
        'Pisces',
    ];

    const handleContinue = () => {
        if (!selectedSign) {
            Alert.alert('Please select your star sign before continuing.');
            return;
        }
        if (stepIndex !== null) {
            decrementStepCount(stepIndex);
        }
        // Navigate to the next step or save the data
        navigation.navigate("MyProfile");
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header (Back button) */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={28} color="red" />
            </TouchableOpacity>

            {/* Progress Bar */}
            <ProgressBar startProgress={90} endProgress={90} />

            {/* Content */}
            <ScrollView style={styles.contentContainer}>
                <Text style={styles.title}>What’s your star sign?</Text>
                <Text style={styles.subtitle}>Your star sign will be public.</Text>

                <View style={styles.dropdownContainer}>
                    {/* Dropdown for Star Sign Selection */}
                    <TouchableOpacity
                        style={styles.dropdown}
                        onPress={() => setDropdownVisible(!dropdownVisible)}
                    >
                        <Text style={styles.dropdownText}>
                            {selectedSign || 'Star Sign'}
                        </Text>
                        <Ionicons
                            name={dropdownVisible ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {dropdownVisible && (
                        <View style={styles.dropdownList}>
                            {starSigns.map((sign) => (
                                <TouchableOpacity
                                    key={sign}
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setSelectedSign(sign);
                                        setDropdownVisible(false);
                                    }}
                                >
                                    <Text style={styles.dropdownItemText}>{sign}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Continue Button */}
            {!dropdownVisible && (
                <Pressable
                    style={[
                        styles.continueButton,
                        { backgroundColor: selectedSign ? '#E4423F' : '#ccc' },
                    ]}
                    onPress={handleContinue}
                    disabled={!selectedSign}
                >
                    <Text style={styles.continueButtonText}>Save & Return to Profile</Text>
                </Pressable>
            )}
        </SafeAreaView>
    );
}

// -------------------- STYLES --------------------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
        alignItems: 'stretch',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    backButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        padding: 8,
        marginBottom: 20,
        marginTop: 30,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
        marginTop: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'left',
        color: '#000',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: 'gray',
        textAlign: 'left',
        marginBottom: 20,
    },
    dropdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 15,
        padding: 15,
        backgroundColor: '#F9F9F9',
    },
    dropdownText: {
        fontSize: 16,
        color: '#333',
    },
    dropdownList: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 15,
        backgroundColor: '#F9F9F9',
        elevation: 2,
        marginBottom: 20,
    },
    dropdownItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#333',
    },
    bottomContainer: {
        padding: 20,
        backgroundColor: '#FFF',
    },
    continueButton: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 25,
        marginBottom: 20,
    },
    continueButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
