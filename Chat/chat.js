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
  const [initiatedMeet, setInitiatedMeet] = useState(null);
  const [receivedMeet, setReceivedMeet] = useState(null);
  const [loading, setLoading] = useState(true);

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

  /**
   * Once we have both localUid and matchedUserId, fetch meets from both perspectives
   */
  useEffect(() => {
    if (localUid || matchedUserId) {
      checkInitiatedAndReceived(localUid, matchedUserId);
    }
  }, [localUid, matchedUserId]);

  /**
   * 1) Call /meet/localUid to see if local user sent an invite to matchedUserId
   * 2) Call /meet/matchedUserId to see if matchedUserId sent an invite to localUid
   */
  const checkInitiatedAndReceived = async (localUid, matchedUserId) => {
    setLoading(true);

    // ---------------- CHECK INITIATED ----------------
    try {
      console.log('Checking initiated meet for localUid:', localUid, 'and matchedUserId:', matchedUserId);
      const localResponse = await axios.get(
        `https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/meet/${localUid}`
      );
      const localMeets = Array.isArray(localResponse.data?.result)
        ? localResponse.data.result
        : [];

      const foundInitiated =
        localMeets.find(
          (m) =>
            m.meet_user_id === localUid 
        ) || null;

        if (foundInitiated && !foundInitiated.created_at) {
          foundInitiated.created_at = new Date().toISOString();
        }
        setInitiatedMeet(foundInitiated);
        console.log('Initiated meet:', foundInitiated);

        // If nothing was found, just log and continue
        if (!foundInitiated) {
          console.log('No initiated meet for this user. Continuing...');
          // Additional logic or fallback UI
        }
    } catch (err) {
      console.log('Error checking initiated invitations:', err);
      setInitiatedMeet(null);
    }

    // ---------------- CHECK RECEIVED ----------------
    try {
      if (matchedUserId) {
        const matchedUserResponse = await axios.get(
          `https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/meet/${matchedUserId}`
        );
        const matchedUserMeets = Array.isArray(matchedUserResponse.data?.result)
          ? matchedUserResponse.data.result
          : [];
        
        const foundReceived =
          matchedUserMeets.find(
            (m) =>
              m.meet_user_id === matchedUserId &&
              m.meet_date_user_id === localUid
          ) || null;
        setReceivedMeet(foundReceived);
        console.log('Received meet:', foundReceived);

        if (!foundReceived) {
          console.log('No received meet from this user. Continuing...');
          // Additional logic or fallback UI
        }
      }
    } catch (err) {
      console.log('Error checking received invitations:', err);
      setReceivedMeet(null);
    }

    // Loading is finished regardless of whether either call failed
    setLoading(false);
  };

  // Replace AsyncStorage message loading with API fetch
  useEffect(() => {
    const fetchMessages = async () => {
      if (!localUid || !matchedUserId) return;
      
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
        
        // Transform API response to match existing message structure
        const apiMessages = response.data.result.map(msg => ({
          id: msg.message_uid,
          text: msg.message_content,
          timestamp: msg.message_sent_at,
          isSent: msg.message_sender_user_id === localUid,
          isReceived: msg.message_sender_user_id !== localUid
        }));
        
        setMessages(apiMessages);
      } catch (err) {
        console.warn('Error fetching messages:', err);
      }
    };

    fetchMessages();
  }, [localUid, matchedUserId]); // Fetch when UID or matched user changes

  // Load response status on mount
  useEffect(() => {
    const loadResponseStatus = async () => {
      if (!localUid) return;
      try {
        const response = await AsyncStorage.getItem(`meet_response_${localUid}`);
        if (response) setHasResponded(true);
      } catch (err) {
        console.warn('Error loading response status:', err);
      }
    };
    loadResponseStatus();
  }, [localUid]);

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

  // Handle response selection
  const handleMeetResponse = async (response) => {
    if (!localUid || !matchedUserId) return;
    
    try {
      // Save response locally
      await AsyncStorage.setItem(`meet_response_${localUid}`, response);
      setHasResponded(true);

      // Add to messages state
      const newMessage = {
        id: Date.now().toString(),
        text: response,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMessage]);

      // Send to messages API endpoint
      await axios.post(
        'https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/messages',
        {
          sender_id: localUid,
          receiver_id: matchedUserId,
          message_content: response
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await AsyncStorage.getItem('user_token')}`
          }
        }
      );

    } catch (err) {
      console.warn('Error saving/sending response:', err);
      // Rollback message if API call fails
      setMessages(prev => prev.filter(m => m.id !== newMessage.id));
    }
  };

  // Add this useEffect to handle meet initiation message
  useEffect(() => {
    const sendMeetInvitationMessage = async () => {
      if (!initiatedMeet || !localUid || !matchedUserId) return;

      try {
        // Format meet details into a message
        const meetMessage = `Date Invitation: 
          Type: ${initiatedMeet.meet_date_type}
          Date: ${new Date(initiatedMeet.meet_day).toLocaleDateString('en-US')}
          Time: ${initiatedMeet.meet_time}
          Location: ${initiatedMeet.meet_location}`;

        // Send to messages endpoint
        await axios.post(
          'https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/messages',
          {
            sender_id: localUid,
            receiver_id: matchedUserId,
            message_content: meetMessage
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await AsyncStorage.getItem('user_token')}`
            }
          }
        );

        // Add to local messages state
        setMessages(prev => [...prev, {
          id: `meet-${Date.now()}`,
          text: meetMessage,
          timestamp: new Date().toISOString(),
          isSent: true
        }]);

      } catch (err) {
        console.warn('Error sending meet invitation message:', err);
      }
    };

    // Only send if meet was just initiated
    if (initiatedMeet?.created_at) { // Check if this is a new meet
      sendMeetInvitationMessage();
    }
  }, [initiatedMeet, localUid, matchedUserId]);

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
       

        {/* Date groups - this will now appear above older messages */}
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <View key={date}>
            <Text style={styles.dateHeader}>{date}</Text>
            {dateMessages.map((item) => (
              <View 
                key={item.id} 
                style={item.isSent ? styles.rightBubbleWrapper : styles.leftBubbleWrapper}
              >
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
              </View>
            ))}
          </View>
        ))}

        {/* Initiated meet bubble at the bottom */}
        {initiatedMeet && (
           <TouchableOpacity 
           onPress={() => navigation.navigate('DateFinal')}
         >
          <View style={styles.rightBubbleWrapper}>
           
              <LinearGradient
                colors={['#FF5E62', '#FF9966']}
                style={styles.rightBubbleContainer}
              >
                <Text style={styles.bubbleTitle}>Hi! Wanna go on a date with me?</Text>
                <View style={styles.bubbleDetailRow}>
                  <Text style={styles.bubbleDetailIcon}>👫</Text>
                  <Text style={styles.bubbleDetailText}>
                    {initiatedMeet?.meet_date_type || ''}
                  </Text>
                </View>
                <View style={styles.bubbleDetailRow}>
                  <Text style={styles.bubbleDetailIcon}>📅</Text>
                  <Text style={styles.bubbleDetailText}>
                    {initiatedMeet?.date ? 
                      new Date(initiatedMeet.meet_day).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : initiatedMeet?.meet_day}
                  </Text>
                </View>
                <View style={styles.bubbleDetailRow}>
                  <Text style={styles.bubbleDetailIcon}>⏰</Text>
                  <Text style={styles.bubbleDetailText}>
                    {initiatedMeet?.meet_time || ''}
                  </Text>
                </View>
                <View style={styles.bubbleDetailRow}>
                  <Text style={styles.bubbleDetailIcon}>📍</Text>
                  <Text style={styles.bubbleDetailText}>
                    {initiatedMeet?.meet_location || ''}
                  </Text>
                </View>
                <View style={styles.rightArrow} />
              </LinearGradient>
            
          </View>
          </TouchableOpacity>
        )}
        
        {/* Received invitation with response options */}
        
        {receivedMeet && !hasResponded && (
          <View style={styles.rightBubbleWrapper}>
            <LinearGradient
              colors={['#FF5E62', '#FF9966']}
              style={styles.rightBubbleContainer}
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
              <View style={styles.rightArrow} />
              
            </LinearGradient>
          </View>
        )}
        {/* Sent messages (right side with tail) */}
        {/* {messages.map((item) => (
          <View key={item.id} style={styles.rightBubbleWrapper}>
            <LinearGradient
              colors={['#FF5E62', '#FF9966']}
              style={styles.rightBubbleContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.rightBubbleText}>{item.text}</Text>
              <Text style={styles.timestampSmall}>{new Date(item.timestamp).toLocaleTimeString([], { 
                      hour: 'numeric', 
                      minute: '2-digit' 
                    })}</Text>
              <View style={styles.rightArrow} />
            </LinearGradient>
          </View>
        ))} */}
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
});
