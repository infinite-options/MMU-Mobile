import { StyleSheet, Button, View, Text, Animated, PanResponder, Dimensions, ScrollView } from 'react-native';
import { Video } from 'expo-av';
import React, { useRef, useState, useEffect } from 'react';
import { fetchUserInfo } from '../Api.js';

export default function MatchPopUpTemp() {
  const video = useRef(null);
  const [status, setStatus] = useState({});
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Helper function to validate URLs
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const uid = '100-000004';
        console.log('Fetching user UID:', uid);
        const data = await fetchUserInfo(uid);
        console.log('Fetched Data:', data);
        if (isMounted) {
          setUserInfo(data);
        }
      } catch (error) {
        if (isMounted) {
          setError(error.message);
          console.error('Error fetching userInfo:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Debugging: Log the video URL after userInfo updates
    if (userInfo) {
      console.log('Video URL:', userInfo.user_video_url);
    }
  }, [userInfo]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>Error: {error}</Text>
      </View>
    );
  }

  let videoUrl = userInfo?.user_video_url;
  if (videoUrl) {
    videoUrl = JSON.parse(videoUrl); // Remove escaped quotes from the URL string
  }

  return (
    <View style={styles.container}>
      {isValidUrl(videoUrl) ? (
        <Video
          ref={video}
          style={styles.backgroundVideo}
          source={{ uri: videoUrl }}
          shouldPlay
          isLooping
          resizeMode="cover"
          onPlaybackStatusUpdate={(status) => setStatus(() => status)}
        />
      ) : (
        <Text style={styles.infoText}>Invalid or Missing Video URL</Text>
      )}

      <Animated.View
        style={[styles.scrollableLayer, { transform: [{ translateY: pan.y }] }]}
      >
        <ScrollView contentContainerStyle={styles.overlay}>
          <Text style={styles.infoText}>Name: {userInfo.name || 'Unknown'}</Text>
          <Text style={styles.infoText}>Age: {userInfo.age || 'N/A'}</Text>
          <Text style={styles.infoText}>Location: {userInfo.location || 'N/A'}</Text>
          <Button
            title="Play from 5s"
            onPress={() => video.current.playFromPositionAsync(5000)}
            color="#fff"
          />
          <Button
            title={status.isLooping ? 'Set to not loop' : 'Set to loop'}
            onPress={() => video.current.setIsLoopingAsync(!status.isLooping)}
            color="#fff"
          />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundVideo: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  container: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  infoText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 10,
  },
  overlay: {
    justifyContent: 'flex-start',
    padding: 20,
  },
  scrollableLayer: {
    backgroundColor: 'rgba(120, 120, 120, 0.8)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    bottom: 0,
    left: 0,
    maxHeight: Dimensions.get('window').height * 0.5,
    position: 'absolute',
    right: 0,
    zIndex: 1,
  },
});