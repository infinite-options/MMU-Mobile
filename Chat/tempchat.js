import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Button } from 'react-native';
import io from 'socket.io-client';

const SocketIOExample = () => {
  const socket = useRef(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Replace with your socket.io server URL
    socket.current = io('https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/chat', {
      transports: ['websocket'], // you can specify transports if needed
    });
    // @socketio.on('join_conversation', namespace='/chat')
    //{
    //  "user_id_1": "100-000007",
    //  "user_id_2": "100-000001"
    //}
    socket.current.on('join_conversation', () => {
      console.log('Connected to Socket.io server');
    });
    // @socketio.on('send_message', namespace='/chat')
    socket.current.on('message', (data) => {
      console.log('Received message:', data);
      setMessages((prevMessages) => [...prevMessages, data]);
    });
    // @socketio.on('leave_conversation', namespace='/chat')
    socket.current.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
    });

    socket.current.on('connect_error', (error) => {
      console.error('Connection Error:', error);
    });

    // Clean up the socket connection when the component unmounts
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  const sendMessage = () => {
    if (socket.current) {
      const msg = 'Hello from React Native!';
      socket.current.emit('message', msg);
      console.log('Sent message:', msg);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Socket.io Example</Text>
      <Button title="Send Message" onPress={sendMessage} />
      <View style={{ marginTop: 20 }}>
        {messages.map((msg, index) => (
          <Text key={index}>{msg}</Text>
        ))}
      </View>
    </View>
  );
};

export default SocketIOExample;
