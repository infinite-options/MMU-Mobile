import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  TextInput,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local assets
import gemmaChatIcon from '../assets/icons/gemmachat.png';
import sendIcon from '../assets/icons/chatsend.png';

// Simple placeholder icons as text
const BackIcon = () => <Text style={{ fontSize: 18, color: 'red' }}>{'<'} </Text>;
const InfoIcon = () => <Text style={{ fontSize: 16, color: 'gray' }}>i</Text>;
const HeartIcon = () => <Text style={{ fontSize: 16, color: '#fff' }}>♥</Text>;

// Add this function to format dates
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Group messages by date
const groupMessagesByDate = (messages) => {
  return messages.reduce((groups, message) => {
    const date = formatDate(message.timestamp);
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});
};

export default function Chat() {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);

  const [userUid, setUserUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initiatedMeet, setInitiatedMeet] = useState(null);
  const [receivedMeet, setReceivedMeet] = useState(null);

  const [chatPartnerName] = useState('Gemma Jones');
  const [chatPartnerPhoto] = useState(gemmaChatIcon);

  // Typed messages
  const [currentMessage, setCurrentMessage] = useState('');
  const [messages, setMessages] = useState([]);

  // Add state to track if user has responded
  const [hasResponded, setHasResponded] = useState(false);

  /**
   * Load user UID
   */
  useEffect(() => {
    const fetchUserUid = async () => {
      try {
        const uid = await AsyncStorage.getItem('user_uid');
        setUserUid(uid);
      } catch (error) {
        console.warn('Error fetching user UID:', error);
      }
    };
    fetchUserUid();
  }, []);

  /**
   * DEMO: Mark as initiator, load previous messages
   */
  useEffect(() => {
    setInitiatedMeet(true);
    setReceivedMeet(false);
    setLoading(false);
  }, []);

  /**
   * Example fetch meets
   */
  const fetchMeets = async (uid) => {
    try {
      const response = await axios.get(
        'https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/meet'
      );
      if (Array.isArray(response.data)) {
        const initiated = response.data.find((item) => item.meet_user_id === uid);
        const received = response.data.find((item) => item.meet_date_user_id === uid);
        if (initiated) setInitiatedMeet(initiated);
        if (received) setReceivedMeet(received);
      }
    } catch (error) {
      console.warn('Error fetching meet data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load user-specific messages when UID is available
  useEffect(() => {
    const loadMessages = async () => {
      if (!userUid) return;
      
      try {
        const key = `chat_messages_${userUid}`;
        const stored = await AsyncStorage.getItem(key);
        if (stored) setMessages(JSON.parse(stored));
      } catch (err) {
        console.warn('Error loading messages:', err);
      }
    };
    
    // loadMessages();
  }, [userUid]); // Reload when UID changes

  // Load response status on mount
  useEffect(() => {
    const loadResponseStatus = async () => {
      if (!userUid) return;
      try {
        const response = await AsyncStorage.getItem(`meet_response_${userUid}`);
        if (response) setHasResponded(true);
      } catch (err) {
        console.warn('Error loading response status:', err);
      }
    };
    loadResponseStatus();
  }, [userUid]);

  const handleSend = async (text) => {
    const trimmed = text?.trim() || currentMessage.trim();
    if (!trimmed || !userUid) return;

    const newMessage = {
      id: Date.now().toString(),
      text: trimmed,
      timestamp: new Date().toISOString(), // Store full ISO date
    };

    const updated = [...messages, newMessage];
    setMessages(updated);
    setCurrentMessage('');

    try {
      const key = `chat_messages_${userUid}`;
      await AsyncStorage.setItem(key, JSON.stringify(updated));
    } catch (err) {
      console.warn('Error saving messages:', err);
    }
  };

  /**
   * Scroll to bottom when messages change
   */
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Get grouped messages
  const groupedMessages = groupMessagesByDate(messages);

  // Handle response selection
  const handleMeetResponse = async (response) => {
    if (!userUid) return;
    
    try {
      // Save response
      await AsyncStorage.setItem(`meet_response_${userUid}`, response);
      setHasResponded(true);

      // Add response to messages
      const newMessage = {
        id: Date.now().toString(),
        text: response,
        timestamp: new Date().toISOString(),
      };

      const updated = [...messages, newMessage];
      setMessages(updated);
      await AsyncStorage.setItem(`chat_messages_${userUid}`, JSON.stringify(updated));
    } catch (err) {
      console.warn('Error saving response:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#999" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <BackIcon />
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <Image source={chatPartnerPhoto} style={styles.userImage} />
          <Text style={styles.userName}>{chatPartnerName}</Text>
        </View>
        <TouchableOpacity style={styles.infoButton}>
          <InfoIcon />
        </TouchableOpacity>
      </View>

      {/* Chat area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatScrollView}
        contentContainerStyle={[styles.chatScrollViewContent, { flexGrow: 1 }]}
      >
        {/* Reverse the order of these elements to push content to bottom */}
        {receivedMeet && (
          <View style={styles.leftBubbleContainer}>
            <Text style={styles.leftBubbleText}>Hi! Let's meet at 7pm?</Text>
            <Text style={styles.leftTimestampSmall}>10:45 AM</Text>
            {/* Left tail */}
            <View style={styles.leftArrow} />
            <View style={styles.leftArrowOverlap} />
          </View>
        )}

        {/* Date groups - this will now appear above older messages */}
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <View key={date}>
            <Text style={styles.dateHeader}>{date}</Text>
            {dateMessages.map((item) => (
              <View key={item.id} style={styles.rightBubbleWrapper}>
                <LinearGradient
                  colors={['#FF5E62', '#FF9966']}
                  style={styles.rightBubbleContainer}
                >
                  <Text style={styles.rightBubbleText}>{item.text}</Text>
                  <Text style={styles.messageTimestamp}>
                    {new Date(item.timestamp).toLocaleTimeString([], { 
                      hour: 'numeric', 
                      minute: '2-digit' 
                    })}
                  </Text>
                  <View style={styles.rightArrow} />
                </LinearGradient>
              </View>
            ))}
          </View>
        ))}

        {/* Initiated meet bubble at the bottom */}
        {initiatedMeet && (
          <View style={styles.rightBubbleWrapper}>
            <LinearGradient
              colors={['#FF5E62', '#FF9966']}
              style={styles.rightBubbleContainer}
            >
              <Text style={styles.bubbleTitle}>Hi! Wanna go on a date with me?</Text>
              <View style={styles.bubbleDetailRow}>
                <Text style={styles.bubbleDetailIcon}>👫</Text>
                <Text style={styles.bubbleDetailText}>Dinner</Text>
              </View>
              <View style={styles.bubbleDetailRow}>
                <Text style={styles.bubbleDetailIcon}>📅</Text>
                <Text style={styles.bubbleDetailText}>Sat, Aug 17</Text>
              </View>
              <View style={styles.bubbleDetailRow}>
                <Text style={styles.bubbleDetailIcon}>⏰</Text>
                <Text style={styles.bubbleDetailText}>7:00 pm</Text>
              </View>
              <View style={styles.bubbleDetailRow}>
                <Text style={styles.bubbleDetailIcon}>📍</Text>
                <Text style={styles.bubbleDetailText}>
                  96 S 1st St, San Jose, CA 95113
                </Text>
              </View>
              <View style={styles.rightArrow} />
            </LinearGradient>
          </View>
        )}

        {/* Received invitation with response options */}
        {receivedMeet && !hasResponded && (
          <>
            {/* Invitation bubble */}
            <View style={styles.bubbleLeftWrapper}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('DateFinal')}
                style={styles.bubbleLeft}
              >
                <Text style={[styles.bubbleTitle, { color: '#FF5E62' }]}>
                  Hi! Wanna go on a date with me?
                </Text>
                <View style={styles.bubbleDetailRow}>
                  <Text style={styles.bubbleDetailIcon}>👫</Text>
                  <Text style={styles.bubbleDetailText}>Dinner</Text>
                </View>
                <View style={styles.bubbleDetailRow}>
                  <Text style={styles.bubbleDetailIcon}>📅</Text>
                  <Text style={styles.bubbleDetailText}>Sat, Aug 17</Text>
                </View>
                <View style={styles.bubbleDetailRow}>
                  <Text style={styles.bubbleDetailIcon}>⏰</Text>
                  <Text style={styles.bubbleDetailText}>7:00 pm</Text>
                </View>
                <View style={styles.bubbleDetailRow}>
                  <Text style={styles.bubbleDetailIcon}>📍</Text>
                  <Text style={styles.bubbleDetailText}>
                    96 S 1st St, San Jose, CA 95113
                  </Text>
                </View>
                <View style={styles.bubbleLeftTail} />
              </TouchableOpacity>
            </View>

            {/* Response options */}
            <View style={styles.responseContainer}>
              <LinearGradient
                colors={['#FF5E62', '#FF9966']}
                style={styles.responseGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleMeetResponse("Yes, I'd love to!")}
                >
                  <Text style={styles.acceptButtonText}>Yes, I'd love to!</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={() => handleMeetResponse("I'm sorry, maybe next time")}
                >
                  <Text style={styles.declineButtonText}>
                    I'm sorry, maybe next time
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </>
        )}

        {/* Sent messages (right side with tail) */}
        {messages.map((item) => (
          <View key={item.id} style={styles.rightBubbleWrapper}>
            <LinearGradient
              colors={['#FF5E62', '#FF9966']}
              style={styles.rightBubbleContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.rightBubbleText}>{item.text}</Text>
              <Text style={styles.timestampSmall}>{item.timestamp}</Text>
              <View style={styles.rightArrow} />
            </LinearGradient>
          </View>
        ))}
      </ScrollView>

      {/* Bottom input bar */}
      <View style={styles.bottomBar}>
        <View style={styles.heartIconContainer}>
          <HeartIcon />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Message..."
            placeholderTextColor="#999"
            value={currentMessage}
            onChangeText={setCurrentMessage}
          />
          <TouchableOpacity onPress={() => handleSend(currentMessage)} style={styles.sendButton}>
            <Image source={sendIcon} style={styles.sendIcon} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF",
    justifyContent: "flex-start",
    alignItems: "stretch",
    paddingHorizontal: 25,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ---------------- HEADER ------------------ */
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  backButton: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  infoButton: {
    width: 40,
    alignItems: 'flex-end',
  },

  /* ---------------- CHAT BODY ------------------ */
  chatScrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatScrollViewContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingTop: 12,
    paddingBottom: 20,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    alignSelf: 'center',
    marginBottom: 8,
  },

  /* ---------- Bubble Right (initiator, typed msgs) ---------- */
  bubbleRightWrapper: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    marginBottom: 12,
    overflow: 'visible',
  },
  bubbleRight: {
    borderRadius: 16,
    padding: 12,
    // If you want a single-color background for typed messages:
    // backgroundColor: '#FF5E62',
  },
  bubbleRightTail: {
    position: 'absolute',
    bottom: 0,
    right: -6,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 0,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightColor: '#FF9966',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },

  /* ---------- Bubble Left (received meet) ---------- */
  bubbleLeftWrapper: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    marginBottom: 12,
  },
  bubbleLeft: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 12,
  },
  bubbleLeftTail: {
    position: 'absolute',
    bottom: 0,
    left: -6,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: '#F5F5F5',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },

  /* ---------- Shared styles ---------- */
  bubbleTitle: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
    color: '#FFF', // White text on pinkish gradient
  },
  bubbleDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bubbleDetailIcon: {
    marginRight: 6,
    fontSize: 14,
    color: '#FFF',
  },
  bubbleDetailText: {
    fontSize: 14,
    color: '#FFF',
  },
  bubbleTimestamp: {
    marginTop: 4,
    fontSize: 12,
    color: '#EEE',
    alignSelf: 'flex-end',
  },

  /* ---------- Bottom bar ---------- */
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopColor: '#EEE',
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heartIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  messageInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    height: 40,
  },
  sendButton: {
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    width: 24,
    height: 24,
    tintColor: '#FF5E62',
  },

  /* Right Bubble (sent messages) */
  rightBubbleWrapper: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    marginBottom: 12,
    overflow: 'visible',
  },
  rightBubbleContainer: {
    padding: 10,
    borderRadius: 20,
    marginBottom: 8,
    maxWidth: '80%',
    position: 'relative',
  },
  rightBubbleText: {
    fontSize: 15,
    color: '#FFF',
  },
  timestampSmall: {
    fontSize: 12,
    color: '#EEE',
    alignSelf: 'flex-end',
  },
  rightArrow: {
    position: "absolute",
    backgroundColor: '#FF9966',
    width: 20,
    height: 25,
    bottom: 0,
    borderBottomLeftRadius: 25,
    right: -10,
    zIndex: 1,
  },
  rightArrowOverlap: {
    position: "absolute",
    backgroundColor: '#FFF',
    width: 20,
    height: 35,
    bottom: -6,
    borderBottomLeftRadius: 18,
    right: -20,
  },

  /* Left Bubble (received messages) */
  leftBubbleContainer: {
    backgroundColor: "#eeeeee",
    padding: 10,
    marginRight: '45%',
    borderRadius: 20,
    marginTop: 5,
    marginLeft: "5%",
    maxWidth: '50%',
    alignSelf: 'flex-start',
    position: 'relative',
  },
  leftArrow: {
    position: "absolute",
    backgroundColor: "#eeeeee",
    width: 20,
    height: 25,
    bottom: 0,
    borderBottomRightRadius: 25,
    left: -10,
  },
  leftArrowOverlap: {
    position: "absolute",
    backgroundColor: "#ffffff",
    width: 20,
    height: 35,
    bottom: -6,
    borderBottomRightRadius: 18,
    left: -20,
  },

  dateHeader: {
    fontSize: 12,
    color: '#888',
    alignSelf: 'center',
    marginVertical: 16,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  messageTimestamp: {
    fontSize: 12,
    color: '#EEE',
    alignSelf: 'flex-end',
    marginTop: 4,
  },

  responseContainer: {
    alignSelf: 'flex-end',
    maxWidth: '70%',
    marginVertical: 10,
    marginHorizontal: 15,
  },
  responseGradient: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  acceptButton: {
    backgroundColor: '#FFF',
    margin: 2,
    borderRadius: 18,
    padding: 12,
  },
  acceptButtonText: {
    color: '#FF5E62',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  declineButton: {
    padding: 12,
  },
  declineButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
