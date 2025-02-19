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
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

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
  const route = useRoute();
  const matchedUserId = route.params?.matchedUserId || null;
  
  // Now you have matchedUserId from MatchResultsPage
  // e.g.: display it, or fetch data for that specific matched user
  console.log('Navigated to Chat with matchedUserId:', matchedUserId);

  const scrollViewRef = useRef(null);

  const [localUid, setLocalUid] = useState(null);
  const [loading, setLoading] = useState(true);

  const [chatPartnerName] = useState('Gemma Jones');
  const [chatPartnerPhoto] = useState(gemmaChatIcon);

  // Typed messages
  const [currentMessage, setCurrentMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [invitationResponseSent, setInvitationResponseSent] = useState(false);
  const [meetConfirmed, setMeetConfirmed] = useState(false);
  const [meetUid, setMeetUid] = useState(null);

  /**
   * Load user UID
   */
  useEffect(() => {
    const loadLocalUid = async () => {
      try {
        const uid = await AsyncStorage.getItem('user_uid');
        if (uid) setLocalUid(uid);
      } catch (err) {
        console.warn('Error retrieving user_uid:', err);
      }
    };
    loadLocalUid();
  }, []);

  // Modified fetchMessages useEffect to handle loading state
  useEffect(() => {
    const fetchMessages = async () => {
      if (!localUid || !matchedUserId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(
          'https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/messages',
          {
            params: {
              sender_id: localUid,
              receiver_id: matchedUserId
            }
          }
        );
        
        // Gracefully handle API response structure
        let apiMessages = [];
        if (response.data && Array.isArray(response.data.result)) {
          apiMessages = response.data.result.map(msg => ({
            id: msg.message_uid,
            text: msg.message_content,
            timestamp: msg.message_sent_at,
            isSent: msg.message_sender_user_id === localUid,
            isReceived: msg.message_sender_user_id !== localUid
          }));
        } else {
          console.warn('Warning: response.data.result is not an array in fetchMessages', response.data);
        }
        setMessages(apiMessages);
      } catch (err) {
        console.warn('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [localUid, matchedUserId]);

  // Add new useEffect to fetch meeting details
  useEffect(() => {
    if (!localUid || !matchedUserId) return;
    const getMeeting = async () => {
      try {
        const response = await axios.get(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/meet/${matchedUserId}`);
        if (!response.data) {
          console.warn('Warning: fetch meeting returned empty data.');
          return;
        }
        console.log(response.data);
        let resultArray = [];
        if (Array.isArray(response.data)) {
          resultArray = response.data;
        } else if (Array.isArray(response.data.result)) {
          resultArray = response.data.result;
        } else {
          console.warn('Warning: Unexpected meeting data structure', response.data);
        }
        const matchingMeet = resultArray.find(item => item.meet_date_user_id === localUid);
        if (matchingMeet) {
          if (matchingMeet.meet_confirmed == 1 || matchingMeet.meet_confirmed === "1") {
            setMeetConfirmed(true);
          }
          setMeetUid(matchingMeet.meet_uid);
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log(matchedUserId);
          console.log('Warning: Meeting endpoint returned 404.');
        } else {
          console.error('Error fetching meeting:', error);
        }
      }
    };
    getMeeting();
  }, [localUid, matchedUserId]);

  const handleSend = async (text) => {
    const trimmed = text?.trim() || currentMessage.trim();
    if (!trimmed || !localUid || !matchedUserId) return;

    // Optimistic UI update
    const tempMessage = {
      id: `temp-${Date.now()}`,
      text: trimmed,
      timestamp: new Date().toISOString(),
      isSent: true
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setCurrentMessage('');

    try {
      // Send to backend
      await axios.post(
        'https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/messages',
        {
          sender_id: localUid,
          receiver_id: matchedUserId,
          message_content: trimmed
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      // Replace temporary message with confirmed message from server
      setMessages(prev => 
        prev.filter(m => m.id !== tempMessage.id) // Remove temp message
            .concat({ ...tempMessage, id: Date.now().toString() })
      );
      
    } catch (err) {
      console.warn('Error sending message:', err);
      // Rollback optimistic update
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
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

  // New function to handle meeting response
  const handleMeetResponse = async (responseText) => {
    if (!localUid || !matchedUserId) return;
    if (responseText === "Yes, I'd love to!") {
      try {
        const formData = new FormData();
        formData.append('meet_uid', meetUid);
        formData.append('meet_user_id', matchedUserId);
        formData.append('meet_date_user_id', localUid);
        formData.append('meet_confirmed', 1);
        console.log(formData);

        await fetch('https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/meet', {
          method: "PUT",
          body: formData,
        });
        setMeetConfirmed(true);
        const responseMessage = {
          id: Date.now().toString(),
          text: responseText,
          timestamp: new Date().toISOString(),
          isSent: true
        };
        setMessages(prev => [...prev, responseMessage]);

        // Also send the confirmation message to the backend messages endpoint
        await axios.post(
          'https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/messages',
          {
            sender_id: localUid,
            receiver_id: matchedUserId,
            message_content: responseText
          },
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );
      } catch (err) {
        console.error('Error confirming meeting:', err);
      }
    } else {
      try {
        await axios.post(
          'https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/messages',
          {
            sender_id: localUid,
            receiver_id: matchedUserId,
            message_content: responseText
          },
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );
        setInvitationResponseSent(true);
        const responseMessage = {
          id: Date.now().toString(),
          text: responseText,
          timestamp: new Date().toISOString(),
          isSent: true
        };
        setMessages(prev => [...prev, responseMessage]);
      } catch (err) {
        console.error('Error sending meeting response:', err);
      }
    }
  };

  // Compute the latest received Date Invitation (received and starts with 'Date Invitation:')
  const receivedInvitations = messages.filter(m => !m.isSent && m.text.startsWith('Date Invitation:'));
  const sortedInvitations = receivedInvitations.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const latestInvitation = sortedInvitations.length > 0 ? sortedInvitations[sortedInvitations.length - 1] : null;

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
          <Image source={require('../assets/icons/backarrow.png')}/>
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
        {/* Grouped messages from the messages endpoint */}
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <View key={date}>
            <Text style={styles.dateHeader}>{date}</Text>
            {dateMessages.map((item) => {
              const containerStyle = item.isSent ? styles.rightBubbleWrapper : styles.leftBubbleWrapper;
              const bubbleContent = (
                <LinearGradient
                  colors={item.isSent ? ['#FF5E62', '#FF9966'] : ['#F5F5F5', '#F5F5F5']}
                  style={styles.bubbleContainer}
                >
                  <Text style={item.isSent ? styles.rightBubbleText : styles.leftBubbleText}>
                    {item.text}
                  </Text>
                  <Text style={styles.messageTimestamp}>
                    {new Date(item.timestamp.replace(' ', 'T')).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </Text>
                  {item.isSent ? (
                    <View style={styles.rightArrow} />
                  ) : (
                    <View style={styles.leftArrow} />
                  )}
                </LinearGradient>
              );
              
              if (item.isSent && item.text.startsWith('Date Invitation:')) {
                return (
                  <TouchableOpacity key={item.id} style={containerStyle} onPress={() => navigation.navigate('DateFinal', { matchedUserId: matchedUserId })}>
                    {bubbleContent}
                  </TouchableOpacity>
                );
              } else {
                return (
                  <View key={item.id} style={containerStyle}>
                    {bubbleContent}
                  </View>
                );
              }
            })}
          </View>
        ))}

        {/* New right bubble for response to latest received Date Invitation */}
        {latestInvitation && !invitationResponseSent && !meetConfirmed && (
          <View style={styles.rightBubbleWrapper}>
            <LinearGradient colors={['#FF5E62', '#FF9966']} style={styles.bubbleContainer}>
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
        )}

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
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 30,
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
    backgroundColor: "#FAFAFA",
    padding: 16,
    borderRadius: 20,
    marginRight: '45%',
    marginTop: 5,
    marginLeft: "5%",
    maxWidth: '50%',
    // Add shadow if needed
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  inviteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E4423F',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  icon: {
    fontSize: 20,
    color: '#999',
    marginRight: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    flexShrink: 1,
  },
  avatarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  leftArrow: {
    position: "absolute",
    backgroundColor: "#FAFAFA",
    width: 20,
    height: 25,
    bottom: 0,
    borderBottomRightRadius: 25,
    left: -10,
    zIndex: 1,
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
    backgroundColor: '#E4423F',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 15,
    marginHorizontal: 5,
  },
  acceptButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  declineButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 15,
    marginHorizontal: 5,
  },
  declineButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bubbleContainer: {
    padding: 10,
    borderRadius: 20,
    marginBottom: 8,
    maxWidth: '80%',
    position: 'relative',
  },
  leftBubbleText: {
    fontSize: 15,
    color: '#000',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 8,
  },
  avatarLeftContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFF',
    marginRight: 12,
    alignSelf: 'flex-start',
  },
  leftArrow: {
    position: "absolute",
    backgroundColor: "#FAFAFA",
    width: 20,
    height: 25,
    bottom: 10,
    borderBottomRightRadius: 25,
    left: -10,
  },
});
