import React, { useEffect, useState } from 'react';
import { Image,View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
const Message = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { user } = route.params || {};  

    const [messages, setMessages] = useState([]);  
    const [newMessage, setNewMessage] = useState("");
    const [userId, setUserId] = useState("");
    const handleBack=()=>{
        navigation.navigate("Match");
    }
    useEffect(() => {
        const fetchUserId = async () => {
            const storedUserId = await AsyncStorage.getItem('user_uid');
            if (storedUserId) {
                setUserId(storedUserId);
                fetchMessages(storedUserId);
            } else {
                Alert.alert("Error", "User ID not found. Please log in again.");
                navigation.navigate('Login');
            }
        };
        fetchUserId();
    }, []);

    const fetchMessages = (storedUserId) => {
        axios.get('https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/messages', {
            params: {
                sender_id: storedUserId,
                receiver_id: user?.user_uid,  
            },
        })
        .then(res => {
            setMessages(res.data.result || []); 
        })
        .catch(error => {
            console.error("Error fetching messages:", error);
        });
    };

    const handleSendMessage = () => {
        if (newMessage.trim() === "") return;

        axios.post('https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/messages', {
            sender_id: userId,
            receiver_id: user?.user_uid, 
            message_content: newMessage,
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(res => {
            setMessages(prev => [...prev, { message_content: newMessage, message_sender_user_id: userId }]);
            setNewMessage("");
        })
        .catch(error => {
            console.error("Error sending message:", error);
        });
    };

    const handleNavigate = () => {
        navigation.navigate("SelectionResults");
    };

    return (
        <SafeAreaView style = {styles.safeArea}>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Image source={require('../assets/arrow.png')} style={styles.arrowIcon} />
        </TouchableOpacity>
            <Text style={styles.title}>{user ? `${user.user_first_name} ${user.user_last_name}` : "User"}</Text>
            <ScrollView style={styles.messagesContainer}>
                {messages && messages.map((message, index) => (
                    <View key={index} style={[
                        styles.messageBox,
                        message.message_sender_user_id === userId ? styles.messageBoxRight : styles.messageBoxLeft
                    ]}>
                        <Text style={[
                            styles.messageText,
                            message.message_sender_user_id === userId ? styles.messageTextRight : styles.messageTextLeft
                        ]}>
                            {message.message_content}
                        </Text>
                    </View>
                ))}
            </ScrollView>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={newMessage}
                    placeholder="Type your message"
                    onChangeText={text => setNewMessage(text)}
                    onSubmitEditing={handleSendMessage}
                    returnKeyType="send"
                />
                <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
                    <MaterialIcons name="send" size={24} color="#E4423F" />
                </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleNavigate} style={styles.navigateButton}>
                <Text style={styles.navigateButtonText}>My Matches</Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea:{
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        justifyContent: 'space-between'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    messagesContainer: {
        flex: 1,
        marginVertical: 20,
        paddingHorizontal: 10,
    },
    messageBox: {
        padding: 15,
        borderRadius: 20,
        marginBottom: 10,
        maxWidth: '70%',
    },
    messageBoxRight: {
        alignSelf: 'flex-end',
        backgroundColor: '#EDEDED',
    },
    messageBoxLeft: {
        alignSelf: 'flex-start',
        backgroundColor: '#E4423F',
    },
    messageText: {
        fontSize: 15,
        color: 'white',
    },
    messageTextRight: {
        color: 'black',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: '#ddd',
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    input: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        borderRadius: 20,
        paddingHorizontal: 15,
        fontSize: 16,
        height: 40,
    },
    sendButton: {
        marginLeft: 10,
    },
    navigateButton: {
        backgroundColor: '#E4423F',
        borderRadius: 25,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    navigateButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        marginRight: 16,
      },
      arrowIcon: {
        width: 28,
        height: 28,
      },
});

export default Message;
