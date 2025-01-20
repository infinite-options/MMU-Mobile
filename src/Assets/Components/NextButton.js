import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const NextButton = ({ next, onPress }) => {
    const navigation = useNavigation();

    const handleNavigate = () => {
        if (onPress) {
            onPress();
        }
        navigation.navigate(next);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.button}
                onPress={handleNavigate}
            >
                <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 40,
    },
    button: {
        width: 130,
        backgroundColor: '#E4423F',
        borderRadius: 25,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
    },
});

export default NextButton;
