// AgeVerification.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Button,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AgeVerification = ({ navigation }) => {
    const monthNames = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
    ];

    const startYear = 1900;
    const currentYear = new Date().getFullYear();
    const yearsList = [];
    for (let y = currentYear; y >= startYear; y--) {
        yearsList.push(y);
    }

    //  selected month/day/year
    const [selectedMonth, setSelectedMonth] = useState(0);
    const [selectedDay, setSelectedDay] = useState(1);
    const [selectedYear, setSelectedYear] = useState(2000);

    // to track the number of days in current month
    const [daysInCurrentMonth, setDaysInCurrentMonth] = useState(31);

    // loading  while we check AsyncStorage
    const [loading, setLoading] = useState(true);

    // 1) to see if user has already verified
    useEffect(() => {
        const checkVerifiedStatus = async () => {
            try {
                const isVerified = await AsyncStorage.getItem('userIsVerified');
                if (isVerified === 'true') {
                    // they've already verified, skip verification
                    navigation.replace('LandingPage');
                } else {
                    // not verified, show the normal UI
                    setLoading(false);
                }
            } catch (err) {
                console.warn('Error reading AsyncStorage:', err);
                setLoading(false);
            }
        };

        checkVerifiedStatus();
    }, [navigation]);

    //  valid days if month/year changes
    useEffect(() => {
        const days = getDaysInMonth(selectedMonth, selectedYear);
        setDaysInCurrentMonth(days);
        if (selectedDay > days) {
            setSelectedDay(days);
        }
    }, [selectedMonth, selectedYear]);

    // get # of days in a given month+year
    const getDaysInMonth = (monthIndex, year) => {
        return new Date(year, monthIndex + 1, 0).getDate();
    };

    // check if user is >= 18
    const handleSubmit = async () => {
        const birthDate = new Date(selectedYear, selectedMonth, selectedDay);
        if (isNaN(birthDate.getTime())) {
            Alert.alert('Invalid Date', 'Please select a valid date.');
            return;
        }

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
            age--;
        }

        if (age < 18) {
            Alert.alert('Underage', 'You must be 18 years or older to continue.');
        } else {
            try {
                // Store verified status in AsyncStorage
                await AsyncStorage.setItem('userIsVerified', 'true');
                // Then navigate to the next screen
                navigation.replace('LandingPage');
            } catch (error) {
                console.warn('Error setting AsyncStorage:', error);
                Alert.alert(
                    'Error',
                    'Could not save verification status. Please try again later.'
                );
            }
        }
    };

    // Show a loading indicator if we’re still checking AsyncStorage
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#999" />
            </View>
        );
    }


    return (
        <View style={styles.container}>
            <Text style={styles.title}>Age Verification</Text>
            <Text style={styles.subtext}>
                This app requires you to be 18 years or older to enter.
            </Text>
            <Text style={styles.subtext}>
                Please enter your Date of Birth in the fields below in order to continue:
            </Text>

            <View style={styles.pickerContainer}>
                {/* Month Picker */}
                <Picker
                    selectedValue={selectedMonth}
                    style={styles.pickerStyle}
                    onValueChange={(val) => setSelectedMonth(val)}
                >
                    {monthNames.map((month, index) => (
                        <Picker.Item key={month} label={month} value={index} />
                    ))}
                </Picker>

                {/* Day Picker */}
                <Picker
                    selectedValue={selectedDay}
                    style={styles.pickerStyle}
                    onValueChange={(val) => setSelectedDay(val)}
                >
                    {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map(day => (
                        <Picker.Item key={day} label={String(day)} value={day} />
                    ))}
                </Picker>

                {/* Year Picker */}
                <Picker
                    selectedValue={selectedYear}
                    style={styles.pickerStyle}
                    onValueChange={(val) => setSelectedYear(val)}
                >
                    {yearsList.map(year => (
                        <Picker.Item key={year} label={String(year)} value={year} />
                    ))}
                </Picker>
            </View>

            <View style={styles.buttonContainer}>
                <Button
                    title="Submit"
                    onPress={handleSubmit}
                    color="#65a844"
                />
            </View>
        </View>
    );
};

export default AgeVerification;

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtext: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 4,
    },
    pickerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
    },
    pickerStyle: {
        flex: 1,
        height: 50,
    },
    buttonContainer: {
        marginTop: 20,
        alignSelf: 'center',
        width: '50%',
    },
});
