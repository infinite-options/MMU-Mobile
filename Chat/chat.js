import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, TextInput, SafeAreaView, ScrollView, Platform, StatusBar } from "react-native";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

// Local assets
import gemmaChatIcon from "../assets/icons/gemmachat.png";
import sendIcon from "../assets/icons/chatsend.png";

// Simple placeholder icons as text
const BackIcon = () => <Text style={{ fontSize: 18, color: "red" }}>{"<"} </Text>;
const InfoIcon = () => <Text style={{ fontSize: 16, color: "gray" }}>i</Text>;
const HeartIcon = () => <Text style={{ fontSize: 16, color: "#fff" }}>♥</Text>;

/**
 * Formats a timestamp for display in consistent format
 * @param {string|Date} dateValue - The date to format
 * @param {string} format - 'date' for date labels, 'time' for message timestamps
 * @returns {string} Formatted date or time string
 */
const formatDateTime = (dateValue, format = "date") => {
  try {
    let date;

    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === "string") {
      // Parse the ISO string
      date = new Date(dateValue);

      console.log("Formatting timestamp:", {
        original: dateValue,
        asDate: date.toString(),
        inGMT: date.toUTCString(),
        inLocal: date.toLocaleString(),
      });
    } else {
      console.warn("Invalid date value:", dateValue);
      return format === "date" ? "Unknown Date" : "Unknown Time";
    }

    // Format using locale-specific methods
    if (format === "date") {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } else if (format === "time") {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  } catch (err) {
    console.warn("Error formatting date:", dateValue, err);
    return format === "date" ? "Unknown Date" : "Unknown Time";
  }
};

/**
 * Groups messages by date and sorts them chronologically within each date
 * @param {Array} messages - The messages to group
 * @returns {Object} Date-grouped messages with each group sorted by timestamp
 */
const groupMessagesByDate = (messages) => {
  // First create groups by date
  const groups = messages.reduce((groups, message) => {
    const date = formatDateTime(message.timestamp, "date");
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  // Then sort messages within each date group chronologically
  Object.keys(groups).forEach((date) => {
    groups[date].sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateA - dateB; // Chronological order (oldest to newest)
    });
  });

  // Now sort the date keys to ensure newest dates are at the bottom
  const sortedGroups = {};
  Object.keys(groups)
    .sort((a, b) => {
      // Convert date strings back to Date objects for comparison
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA - dateB; // Chronological order for date headers
    })
    .forEach((date) => {
      sortedGroups[date] = groups[date];
    });

  return sortedGroups;
};

/**
 * Safely parses JSON with fallback
 * @param {string} value - The JSON string to parse
 * @param {*} fallback - The fallback value if parsing fails
 * @returns {*} Parsed JSON or fallback
 */
function safeJsonParse(value, fallback = []) {
  if (typeof value !== "string") {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (err) {
    console.warn("Failed to parse JSON:", value, err);
    return fallback;
  }
}

export default function Chat() {
  const navigation = useNavigation();
  const route = useRoute();
  const matchedUserId = route.params?.matchedUserId || null;
  const scrollViewRef = useRef(null);

  // State variables
  const [localUid, setLocalUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatPartnerName, setChatPartnerName] = useState("");
  const [chatPartnerPhoto, setChatPartnerPhoto] = useState(gemmaChatIcon);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [invitationResponseSent, setInvitationResponseSent] = useState(false);
  const [meetConfirmed, setMeetConfirmed] = useState(false);
  const [meetUid, setMeetUid] = useState(null);
  const [serverTimeOffset, setServerTimeOffset] = useState(0); // Track time difference between server and client

  // Load user UID from storage
  useEffect(() => {
    const loadLocalUid = async () => {
      try {
        const uid = await AsyncStorage.getItem("user_uid");
        if (uid) setLocalUid(uid);
      } catch (err) {
        console.warn("Error retrieving user_uid:", err);
      }
    };
    loadLocalUid();
  }, []);

  // Fetch messages when user ID or matched user changes - only on initial load
  useEffect(() => {
    const fetchMessages = async () => {
      if (!localUid || !matchedUserId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get("https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/messages", {
          params: {
            sender_id: localUid,
            receiver_id: matchedUserId,
          },
        });

        // Process messages with standardized timestamps
        let apiMessages = [];
        if (response.data && Array.isArray(response.data.result)) {
          // First, check if we need to calculate server time offset
          if (response.data.result.length > 0 && response.data.server_time) {
            // If server provides current time, calculate offset
            try {
              const serverTime = new Date(response.data.server_time).getTime();
              const localTime = Date.now();
              const offset = serverTime - localTime;

              // Only apply significant offsets (>5 seconds) to avoid minor discrepancies
              if (Math.abs(offset) > 5000) {
                console.log(`Server-client time offset: ${offset}ms`);
                setServerTimeOffset(offset);
              }
            } catch (err) {
              console.warn("Error calculating time offset:", err);
            }
          }

          // If no server time available, try to estimate based on most recent message
          if (serverTimeOffset === 0 && response.data.result.length > 0) {
            const latestMsg = response.data.result.reduce((latest, msg) => {
              const msgTime = new Date(msg.message_sent_at || 0).getTime();
              return msgTime > latest ? msgTime : latest;
            }, 0);

            // If latest message is in the future, use its offset
            const now = Date.now();
            if (latestMsg > now) {
              const estimatedOffset = latestMsg - now + 1000; // Add 1 second buffer
              console.log(`Estimated time offset from messages: ${estimatedOffset}ms`);
              setServerTimeOffset(estimatedOffset);
            }
          }

          apiMessages = response.data.result.map((msg) => {
            // Debug log the raw timestamp from server
            console.log("\n=== Message Timestamp Debug ===");
            console.log("Message ID:", msg.message_uid);
            console.log("Raw server timestamp (GMT):", msg.message_sent_at);

            // Parse the GMT timestamp correctly
            const [datePart, timePart] = msg.message_sent_at.split(" ");
            const [year, month, day] = datePart.split("-");
            const [hours, minutes, seconds] = timePart.split(":");

            // Create Date object in GMT
            const messageDate = new Date(
              Date.UTC(
                parseInt(year),
                parseInt(month) - 1, // months are 0-based
                parseInt(day),
                parseInt(hours),
                parseInt(minutes),
                parseInt(seconds)
              )
            );

            console.log("Parsed GMT time:", messageDate.toUTCString());
            console.log("Local time:", messageDate.toLocaleString());
            console.log("Timezone offset (minutes):", messageDate.getTimezoneOffset());

            return {
              id: msg.message_uid || `msg-${Date.now()}-${Math.random()}`,
              text: msg.message_content || "",
              timestamp: messageDate.toISOString(), // Store as ISO string
              isSent: msg.message_sender_user_id === localUid,
              isReceived: msg.message_sender_user_id !== localUid,
            };
          });

          console.log("Fetched messages:", apiMessages);
        } else {
          console.warn("Warning: response.data.result is not an array in fetchMessages", response.data);
        }

        setMessages(apiMessages);
      } catch (err) {
        console.warn("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [localUid, matchedUserId]);

  // Fetch meeting details
  useEffect(() => {
    if (!localUid || !matchedUserId) return;

    const getMeeting = async () => {
      try {
        const response = await axios.get(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/meet/${matchedUserId}`);
        if (!response.data) {
          console.warn("Warning: fetch meeting returned empty data.");
          return;
        }

        let resultArray = [];
        if (Array.isArray(response.data)) {
          resultArray = response.data;
        } else if (Array.isArray(response.data.result)) {
          resultArray = response.data.result;
        } else {
          console.warn("Warning: Unexpected meeting data structure", response.data);
          return;
        }

        const matchingMeet = resultArray.find((item) => item.meet_date_user_id === localUid);
        if (matchingMeet) {
          if (matchingMeet.meet_confirmed == 1 || matchingMeet.meet_confirmed === "1") {
            setMeetConfirmed(true);
          }
          setMeetUid(matchingMeet.meet_uid);
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log("Warning: Meeting endpoint returned 404.");
        } else {
          console.error("Error fetching meeting:", error);
        }
      }
    };

    getMeeting();
  }, [localUid, matchedUserId]);

  // Fetch matched user details
  useEffect(() => {
    if (!matchedUserId) return;

    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(`https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo/${matchedUserId}`);

        if (response.data && response.data.result && response.data.result.length > 0) {
          const userData = response.data.result[0];

          // Set user name
          const firstName = userData.user_first_name || "";
          const lastName = userData.user_last_name || "";
          const fullName = `${firstName} ${lastName}`.trim() || "Chat Partner";
          setChatPartnerName(fullName);

          // Set user photo - prioritize favorite photo
          console.log("\n=== Chat Partner Photo Debug ===");
          console.log("User ID:", matchedUserId);
          console.log("Favorite photo:", userData.user_favorite_photo);
          const photoUrls = safeJsonParse(userData.user_photo_url, []);
          console.log("Photo URLs array:", photoUrls);
          console.log("Photo URLs type:", typeof photoUrls);
          // Use favorite photo if available, otherwise use first photo
          const photoToShow = userData.user_favorite_photo?.toString() || (photoUrls.length > 0 ? photoUrls[0].toString() : null);
          console.log("Selected photo to show:", photoToShow);
          console.log("===============================\n");

          if (photoToShow) {
            setChatPartnerPhoto({ uri: photoToShow });
          }
        } else {
          console.warn("User details response missing data:", response.data);
          setChatPartnerName("Chat Partner");
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
        setChatPartnerName("Chat Partner");
      }
    };

    fetchUserDetails();
  }, [matchedUserId]);

  // Handle sending messages
  const handleSend = async (text) => {
    const trimmed = text?.trim() || currentMessage.trim();
    if (!trimmed || !localUid || !matchedUserId) return;

    // Create current time in GMT
    const now = new Date();
    const gmtTimestamp = now.toISOString();

    // Create temporary message
    const tempMessage = {
      id: `temp-${Date.now()}-${Math.random()}`,
      text: trimmed,
      timestamp: gmtTimestamp,
      isSent: true,
    };

    // Update messages state immediately
    setMessages((prev) => [...prev, tempMessage]);
    setCurrentMessage("");

    try {
      // Format the GMT timestamp for the server in the expected format
      const serverTimestamp = gmtTimestamp.replace("T", " ").slice(0, 19);

      // Send to backend with the GMT timestamp
      const messageResponse = await axios.post(
        "https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/messages",
        {
          sender_id: localUid,
          receiver_id: matchedUserId,
          message_content: trimmed,
          message_sent_at: serverTimestamp,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // If server returns the created message with its timestamp, update our local copy
      if (messageResponse.data && messageResponse.data.message_uid) {
        const serverMessage = {
          id: messageResponse.data.message_uid,
          text: trimmed,
          timestamp: messageResponse.data.message_sent_at ? new Date(messageResponse.data.message_sent_at.replace(" ", "T") + "Z").toISOString() : gmtTimestamp,
          isSent: true,
        };

        // Replace temporary message with server version
        setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id).concat(serverMessage));
      }
    } catch (err) {
      console.warn("Error sending message:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
    }
  };

  // Handle meeting response with proper time conversion
  const handleMeetResponse = async (responseText) => {
    if (!localUid || !matchedUserId) return;

    // Create timestamp in UTC format for consistent storage
    const now = new Date();

    // Apply the server time offset if needed for consistency
    if (serverTimeOffset !== 0) {
      now.setTime(now.getTime() + serverTimeOffset);
    }

    // Get timestamp in UTC format
    const utcTimestamp = now.toISOString();

    // Convert to local time for display
    const localTimestamp = convertToLocalTimestamp(utcTimestamp);

    // Create temporary message with client-generated ID
    const tempMessage = {
      id: `temp-${Date.now()}-${Math.random()}`,
      text: responseText,
      timestamp: localTimestamp, // Use local timestamp
      isSent: true,
    };

    if (responseText === "Yes, I'd love to!") {
      try {
        // Update UI state first with temporary message
        setMeetConfirmed(true);
        setMessages((prev) => [...prev, tempMessage]);

        // Send confirmation to meet endpoint
        const formData = new FormData();
        formData.append("meet_uid", meetUid);
        formData.append("meet_user_id", matchedUserId);
        formData.append("meet_date_user_id", localUid);
        formData.append("meet_confirmed", 1);

        await fetch("https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/meet", {
          method: "PUT",
          body: formData,
        });

        // Also send confirmation message to backend
        const messageResponse = await axios.post(
          "https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/messages",
          {
            sender_id: localUid,
            receiver_id: matchedUserId,
            message_content: responseText,
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        // If server returns the created message with its timestamp, update our local copy
        if (messageResponse.data && messageResponse.data.message_uid) {
          // Get standardized UTC timestamp from server
          const serverUtcTimestamp = standardizeTimestamp(messageResponse.data.message_sent_at || utcTimestamp);

          // Convert to local time
          const serverLocalTimestamp = convertToLocalTimestamp(serverUtcTimestamp);

          const serverMessage = {
            id: messageResponse.data.message_uid,
            text: responseText,
            timestamp: serverLocalTimestamp, // Use local timestamp
            isSent: true,
          };

          // Replace temporary message with server version
          setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id).concat(serverMessage));
        }
      } catch (err) {
        console.error("Error confirming meeting:", err);
        // Revert UI changes if API call fails
        setMeetConfirmed(false);
        setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      }
    } else {
      try {
        // Update UI state first with temporary message
        setInvitationResponseSent(true);
        setMessages((prev) => [...prev, tempMessage]);

        // Send message to backend
        const messageResponse = await axios.post(
          "https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/messages",
          {
            sender_id: localUid,
            receiver_id: matchedUserId,
            message_content: responseText,
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        // If server returns the created message with its timestamp, update our local copy
        if (messageResponse.data && messageResponse.data.message_uid) {
          // Get standardized UTC timestamp from server
          const serverUtcTimestamp = standardizeTimestamp(messageResponse.data.message_sent_at || utcTimestamp);

          // Convert to local time
          const serverLocalTimestamp = convertToLocalTimestamp(serverUtcTimestamp);

          const serverMessage = {
            id: messageResponse.data.message_uid,
            text: responseText,
            timestamp: serverLocalTimestamp, // Use local timestamp
            isSent: true,
          };

          // Replace temporary message with server version
          setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id).concat(serverMessage));
        }
      } catch (err) {
        console.error("Error sending meeting response:", err);
        // Revert UI changes if API call fails
        setInvitationResponseSent(false);
        setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      }
    }
  };

  // Scroll to bottom when messages change (only for new messages, not initial load)
  const initialLoadRef = useRef(true);

  useEffect(() => {
    // Skip scrolling on initial render
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    // Only animate scrolling for subsequent message updates
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Clear the initial load flag when loading completes
  useEffect(() => {
    if (!loading) {
      initialLoadRef.current = false;
    }
  }, [loading]);

  // Get grouped messages
  const groupedMessages = groupMessagesByDate(messages);

  // Compute the latest received Date Invitation
  const receivedInvitations = messages.filter((m) => m.isReceived && m.text && m.text.startsWith("Date Invitation:"));

  // Sort invitations by timestamp (newest first)
  const sortedInvitations = receivedInvitations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const latestInvitation = sortedInvitations.length > 0 ? sortedInvitations[0] : null;

  // Loading state
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size='large' color='#999' />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={require("../assets/icons/backarrow.png")} />
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
        contentContainerStyle={[styles.chatScrollViewContent, { flexGrow: 1, justifyContent: "flex-end" }]}
        onContentSizeChange={() => {
          // Only use non-animated scroll to avoid visible jumping
          scrollViewRef.current?.scrollToEnd({ animated: false });
        }}
        onLayout={() => {
          // Ensure we're at the bottom on initial layout
          scrollViewRef.current?.scrollToEnd({ animated: false });
        }}
        showsVerticalScrollIndicator={false}
        // Maintain position when keyboard appears/content changes
        keyboardShouldPersistTaps='handled'
        // Prevent automatic scrolling for iOS keyboard
        keyboardDismissMode='on-drag'
      >
        {/* Grouped messages by date */}
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <View key={date}>
            <Text style={styles.dateHeader}>{date}</Text>
            {dateMessages.map((item) => {
              const textContent = item.text || "";
              const isDateInvitation = textContent.startsWith("Date Invitation:");
              const containerStyle = item.isSent ? styles.rightBubbleWrapper : styles.leftBubbleWrapper;

              // Render appropriate bubble content based on message type
              let bubbleContent;

              if (isDateInvitation) {
                // Parse date invitation content
                const lines = textContent.split("\n");
                const title = lines[0].replace("Date Invitation:", "").trim() || "Hi! Wanna go on a date with me?";

                // Extract details with defaults
                let activity = "Dinner";
                let date = "Sat, Aug 17";
                let time = "7:00 pm";
                let location = "96 S 1st St, San Jose, CA 95113";

                // Parse from text
                lines.forEach((line) => {
                  if (line.includes("Activity:")) activity = line.replace("Activity:", "").trim();
                  if (line.includes("Date:")) date = line.replace("Date:", "").trim();
                  if (line.includes("Time:")) time = line.replace("Time:", "").trim();
                  if (line.includes("Location:")) location = line.replace("Location:", "").trim();
                });

                if (item.isReceived) {
                  // Received date invitation (white card)
                  bubbleContent = (
                    <View style={styles.receivedDateCard}>
                      <Text style={styles.receivedDateTitle}>{title}</Text>

                      <View style={styles.receivedDateDetail}>
                        <Ionicons name='people-outline' size={18} color='#999' style={styles.receivedDateIcon} />
                        <Text style={styles.receivedDateText}>{activity}</Text>
                      </View>

                      <View style={styles.receivedDateDetail}>
                        <Ionicons name='calendar-outline' size={18} color='#999' style={styles.receivedDateIcon} />
                        <Text style={styles.receivedDateText}>{date}</Text>
                      </View>

                      <View style={styles.receivedDateDetail}>
                        <Ionicons name='time-outline' size={18} color='#999' style={styles.receivedDateIcon} />
                        <Text style={styles.receivedDateText}>{time}</Text>
                      </View>

                      <View style={styles.receivedDateDetail}>
                        <Ionicons name='location-outline' size={18} color='#999' style={styles.receivedDateIcon} />
                        <Text style={styles.receivedDateText}>{location}</Text>
                      </View>

                      <Text style={[styles.messageTimestamp, { color: "#999" }]}>{formatDateTime(item.timestamp, "time")}</Text>

                      <View style={styles.leftArrowDate} />

                      {/* User avatar */}
                      <View style={styles.dateAvatarContainer}>
                        <Image source={chatPartnerPhoto} style={styles.dateAvatar} />
                      </View>
                    </View>
                  );
                } else {
                  // Sent date invitation (gradient card)
                  bubbleContent = (
                    <LinearGradient colors={["#FF5E62", "#FF9966"]} style={styles.dateInvitationCard}>
                      <Text style={styles.dateInvitationTitle}>{title}</Text>

                      <View style={styles.dateInvitationDetail}>
                        <Ionicons name='people' size={18} color='#fff' style={styles.dateInvitationIcon} />
                        <Text style={styles.dateInvitationText}>{activity}</Text>
                      </View>

                      <View style={styles.dateInvitationDetail}>
                        <Ionicons name='calendar' size={18} color='#fff' style={styles.dateInvitationIcon} />
                        <Text style={styles.dateInvitationText}>{date}</Text>
                      </View>

                      <View style={styles.dateInvitationDetail}>
                        <Ionicons name='time' size={18} color='#fff' style={styles.dateInvitationIcon} />
                        <Text style={styles.dateInvitationText}>{time}</Text>
                      </View>

                      <View style={styles.dateInvitationDetail}>
                        <Ionicons name='location' size={18} color='#fff' style={styles.dateInvitationIcon} />
                        <Text style={styles.dateInvitationText}>{location}</Text>
                      </View>

                      <Text style={styles.messageTimestamp}>{formatDateTime(item.timestamp, "time")}</Text>

                      <View style={styles.rightArrow} />
                    </LinearGradient>
                  );
                }
              } else {
                // Regular message (not date invitation)
                bubbleContent = (
                  <LinearGradient colors={item.isSent ? ["#FF5E62", "#FF9966"] : ["#F5F5F5", "#F5F5F5"]} style={styles.bubbleContainer}>
                    <Text style={item.isSent ? styles.rightBubbleText : styles.leftBubbleText}>{textContent}</Text>
                    <Text style={item.isSent ? styles.messageTimestamp : styles.messageTimestampDark}>{formatDateTime(item.timestamp, "time")}</Text>
                    {item.isSent ? <View style={styles.rightArrow} /> : <View style={styles.leftArrow} />}
                  </LinearGradient>
                );
              }

              // Make sent date invitations clickable
              if (isDateInvitation && !item.isReceived) {
                return (
                  <TouchableOpacity key={item.id} style={containerStyle} onPress={() => navigation.navigate("DateFinal", { matchedUserId: matchedUserId })}>
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

        {/* Date invitation response buttons */}
        {latestInvitation && !invitationResponseSent && !meetConfirmed && (
          <View style={styles.responseButtonContainer}>
            <LinearGradient colors={["#FF5E62", "#FF9966"]} style={{ borderRadius: 25, padding: 15 }}>
              <TouchableOpacity style={styles.acceptButton} onPress={() => handleMeetResponse("Yes, I'd love to!")}>
                <Text style={styles.acceptButtonText}>Yes, I'd love to!</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.declineButton} onPress={() => handleMeetResponse("I'm sorry, maybe next time")}>
                <Text style={styles.declineButtonText}>I'm sorry, maybe next time</Text>
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
          <TextInput style={styles.messageInput} placeholder='Message...' placeholderTextColor='#999' value={currentMessage} onChangeText={setCurrentMessage} />
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* ---------------- HEADER ------------------ */
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  backButton: {
    width: 40,
    justifyContent: "center",
    alignItems: "flex-start",
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 30,
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  infoButton: {
    width: 40,
    alignItems: "flex-end",
  },

  /* ---------------- CHAT BODY ------------------ */
  chatScrollView: {
    flex: 1,
    paddingHorizontal: 0,
  },
  chatScrollViewContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingTop: 12,
    paddingBottom: 20,
    minHeight: "100%", // Ensures content can be positioned at the bottom
  },
  dateHeader: {
    fontSize: 12,
    color: "#888",
    alignSelf: "center",
    marginVertical: 16,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },

  /* Right Bubble (sent messages) */
  rightBubbleWrapper: {
    alignSelf: "flex-end",
    maxWidth: "80%",
    marginBottom: 12,
    overflow: "visible",
  },
  bubbleContainer: {
    padding: 10,
    borderRadius: 20,
    marginBottom: 8,
    maxWidth: "80%",
    position: "relative",
  },
  rightBubbleText: {
    fontSize: 15,
    color: "#FFF",
  },
  messageTimestamp: {
    fontSize: 12,
    color: "#EEE",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  messageTimestampDark: {
    fontSize: 12,
    color: "#999",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  rightArrow: {
    position: "absolute",
    backgroundColor: "#FF9966",
    width: 20,
    height: 25,
    bottom: 0,
    borderBottomLeftRadius: 25,
    right: -10,
    zIndex: 1,
  },

  /* Left Bubble (received messages) */
  leftBubbleWrapper: {
    alignSelf: "flex-start",
    maxWidth: "80%",
    marginBottom: 12,
  },
  leftBubbleText: {
    fontSize: 15,
    color: "#000",
  },
  leftArrow: {
    position: "absolute",
    backgroundColor: "#F5F5F5",
    width: 20,
    height: 25,
    bottom: 0,
    borderBottomRightRadius: 25,
    left: -10,
    zIndex: 1,
  },

  /* Date Invitation - Sent */
  dateInvitationCard: {
    padding: 10,
    borderRadius: 20,
    marginBottom: 8,
    maxWidth: "80%",
    position: "relative",
  },
  dateInvitationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  dateInvitationDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  dateInvitationIcon: {
    marginRight: 6,
  },
  dateInvitationText: {
    fontSize: 14,
    color: "#FFF",
  },

  /* Date Invitation - Received */
  receivedDateCard: {
    backgroundColor: "#FAFAFA",
    padding: 16,
    borderRadius: 20,
    marginRight: "10%",
    marginLeft: "17%",
    maxWidth: "80%",
    position: "relative",
    marginBottom: 30, // Extra space for avatar
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  receivedDateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF5E62",
    marginBottom: 12,
  },
  receivedDateDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  receivedDateIcon: {
    marginRight: 10,
  },
  receivedDateText: {
    fontSize: 16,
    color: "#333",
  },
  leftArrowDate: {
    position: "absolute",
    backgroundColor: "#FAFAFA",
    width: 20,
    height: 25,
    bottom: 10,
    borderBottomRightRadius: 25,
    left: -10,
  },
  dateAvatarContainer: {
    position: "absolute",
    bottom: -10,
    left: -40,
    zIndex: 10,
  },
  dateAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFF",
  },

  /* Response buttons */
  responseButtonContainer: {
    alignSelf: "flex-end",
    marginTop: 10,
    marginBottom: 15,
    borderRadius: 25,
    overflow: "hidden",
    width: "80%",
  },
  acceptButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginVertical: 10,
    marginHorizontal: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  acceptButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  declineButton: {
    marginVertical: 5,
    marginHorizontal: 15,
    marginBottom: 15,
  },
  declineButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    textDecorationLine: "underline",
  },

  /* Bottom input bar */
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopColor: "#EEE",
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heartIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  messageInput: {
    flex: 1,
    fontSize: 15,
    color: "#000",
    height: 40,
  },
  sendButton: {
    marginLeft: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  sendIcon: {
    width: 24,
    height: 24,
    tintColor: "#FF5E62",
  },
});
