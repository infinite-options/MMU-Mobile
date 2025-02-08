import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ImageBackground, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { sha256 } from 'js-sha256';
import AsyncStorage from '@react-native-async-storage/async-storage';
import backgroundImage from '../assets/accountSetup1Login.jpg'; // Replace with the correct path to your image

export default function AccountSetup1Login() {
    const [formDataLogin, setFormDataLogin] = useState({
        email: '',
        password: '',
    });
    const [showSpinner, setShowSpinner] = useState(false);
    const navigation = useNavigation();
    const screenHeight = Dimensions.get('window').height;

    const handleChange = (name, value) => {
        setFormDataLogin({
            ...formDataLogin,
            [name]: value,
        });
    };

    const handleSubmitLogin = async () => {
        if (formDataLogin.email === '' || formDataLogin.password === '') {
            Alert.alert('Error', 'Please fill out all the fields');
            return;
        }

        const saltUrl = 'https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/AccountSalt/MMU';
        const loginUrl = 'https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/Login/MMU';

        try {
            setShowSpinner(true);
            const saltResponse = await axios.post(saltUrl, { email: formDataLogin.email });
            const saltObject = saltResponse.data;

            if (saltObject.code === 200) {
                let salt = saltObject.result[0].password_salt;

                const saltedPassword = formDataLogin.password + salt;
                const hashedPassword = sha256(saltedPassword);

                const loginResponse = await axios.post(loginUrl, {
                    email: formDataLogin.email,
                    password: hashedPassword
                }, {
                    headers: { 'Content-Type': 'application/json' }
                });

                await AsyncStorage.setItem('user_uid', loginResponse.data.result.user_uid);
                await AsyncStorage.setItem('user_email_id', loginResponse.data.result.user_email_id);
                await AsyncStorage.setItem('phone_number', loginResponse.data.result.user_phone_number);

                navigation.navigate('AccountSetup7Summary');
            } else {
                Alert.alert('Error', 'User does not exist.');
            }
        } catch (error) {
            console.error('Error occurred:', error);
            Alert.alert('Error', 'Invalid credentials or server error.');
        } finally {
            setShowSpinner(false);
        }
    };

    const handleSubmitCreate = () => {
        navigation.navigate('AccountSetup2Create');
    };

    return (
        <ImageBackground source={backgroundImage} style={styles.backgroundImage} resizeMode="cover">
            <View style={styles.overlay} />
            <View style={styles.formContainer}>
                <View style={styles.roundedBox}>
                    <Text style={styles.title}>meet me up</Text>
                    <Text style={styles.header}>Let’s get you out there</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        keyboardType="email-address"
                        value={formDataLogin.email}
                        onChangeText={(text) => handleChange('email', text)}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        secureTextEntry
                        value={formDataLogin.password}
                        onChangeText={(text) => handleChange('password', text)}
                    />

                    <Pressable style={styles.button} onPress={handleSubmitLogin}>
                        <Text style={styles.buttonText}>Login</Text>
                    </Pressable>

                    <Text style={styles.linkText} onPress={() => Alert.alert('Retrieve password', 'Password retrieval link')}>
                        Forgot password? Retrieve here
                    </Text>

                    <View style={styles.separator} />

                    <Text style={styles.subHeader}>Not with us yet?</Text>
                    <Text style={styles.subText}>
                        Diam pulvinar pharetra nulla dolor nullam. Neque aliquam est amet scelerisque. Massa aenean.
                    </Text>

                    <Pressable style={styles.button} onPress={handleSubmitCreate}>
                        <Text style={styles.buttonText}>Create Profile</Text>
                    </Pressable>
                </View>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        justifyContent: 'flex-start',
    },

    button: {
        alignItems: 'center',
        backgroundColor: '#E4423F',
        borderRadius: 25,
        marginTop: 10,
        paddingHorizontal: 32,
        paddingVertical: 12,
        width: '100%',
    },
    buttonText: {
        color: '#FFFFFF',
        fontFamily: 'Lexend',
        fontSize: 18,
    },
    formContainer: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-end',
    },
    header: {
        fontFamily: 'Lexend',
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderColor: '#ccc',
        borderRadius: 10,
        borderWidth: 1,
        fontSize: 16,
        height: 50,
        marginBottom: 15,
        paddingHorizontal: 15,
        width: '100%',
    },
    linkText: {
        color: '#E4423F',
        fontSize: 14,
        marginTop: 10,
    },
    roundedBox: {
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        elevation: 5,
        padding: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        width: '100%',
    },
    separator: {
        backgroundColor: '#CECECE',
        height: 1,
        marginVertical: 20,
        width: '100%',
    },
    subHeader: {
        fontFamily: 'Lexend',
        fontSize: 18,
        marginBottom: 10,
        textAlign: 'center',
    },
    subText: {
        fontFamily: 'DM Sans',
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
    },
    title: {
        color: '#E4423F',
        fontFamily: 'Inria Sans',
        fontSize: 36,
        marginBottom: 10,
        textAlign: 'center',
    },
});
