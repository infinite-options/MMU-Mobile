import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BackButton from '../Images/BackButton.png'; // Ensure this path is correct

const Progress = ({ percent, prev }) => {
    const navigation = useNavigation();

    let finished;
    let unfinished;

    const calcProgress = () => {
        finished = parseInt(percent, 10) * 1.1;
        unfinished = 10.5 - finished;
    };
    calcProgress();

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.navigate(prev)}>
                    <Image source={BackButton} style={styles.backButton} />
                </TouchableOpacity>
                <Text style={styles.title}>Profile Creation</Text>
            </View>
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${finished}%` }]} />
                <Text style={styles.percentText}>{percent}</Text>
                <View style={[styles.incompleteBar, { width: `${unfinished}%` }]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    backButton: {
        width: 24,
        height: 24,
        marginRight: 10,
    },
    title: {
        fontSize: 20,
        fontFamily: 'sans-serif',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressBar: {
        height: 2,
        backgroundColor: '#E4423F',
        borderRadius: 2,
    },
    percentText: {
        color: '#E4423F',
        fontSize: 18,
        marginHorizontal: 5,
    },
    incompleteBar: {
        height: 2.5,
        backgroundColor: '#E2E2E2',
        borderRadius: 3,
        marginLeft: 5,
    },
});

export default Progress;
