import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const Info = ({ img, info }) => {
    return (
        <View style={styles.container}>
            <Image source={img} style={styles.icon} />
            <Text style={styles.infoText}>{info}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    icon: {
        width: 30,   // Adjust the size based on your icon
        height: 30,  // Adjust the size based on your icon
        marginRight: 10,
    },
    infoText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default Info;
