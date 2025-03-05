import React, { useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Image } from 'react-native';
import {
  PanGestureHandler,
  State,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * SlideToSend
 * @param {function} onSlideSuccess - Called once the thumb is fully dragged.
 */
export default function SlideToSend({ onSlideSuccess }) {
  // Animated value to track horizontal movement
  const translateX = useRef(new Animated.Value(0)).current;
  // For storing the last translation offset
  const offsetX = useRef(0);

  // The PanGestureHandler callback for ongoing gestures
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
  );

  // Called when the gesture state changes (BEGIN, ACTIVE, END, etc.)
  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.state === State.END) {
      const dragX = event.nativeEvent.translationX + offsetX.current;
      const maxDrag = SCREEN_WIDTH * 0.8; // threshold for success (80% of screen width, for example)

      if (dragX > maxDrag) {
        // Successful slide!
        Animated.timing(translateX, {
          toValue: SCREEN_WIDTH * 0.88, // move thumb near the far edge
          duration: 150,
          useNativeDriver: false,
        }).start(() => {
          // Notify parent
          onSlideSuccess?.();
          // Reset after success (optional if you want to keep it slid)
          offsetX.current = 0;
          translateX.setValue(0);
        });
      } else {
        // Snap back if not over threshold
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
        }).start(() => {
          offsetX.current = 0;
        });
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Track */}
      <View style={styles.track}>
        <Text style={styles.slideText}>Slide to Send</Text>
      </View>

      {/* Draggable Thumb */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          style={[
            styles.thumb,
            { transform: [{ translateX }] },
            { marginLeft: 5 }
          ]}
        >
          <Image 
            source={require('../../Assets/Images/sendrectangle.png')} 
            style={styles.thumbImage}
          />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const THUMB_SIZE = 50;
const SLIDING_THUMB_SIZE = 40; // Smaller size for the thumb

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: THUMB_SIZE,
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    width: '100%',
    height: THUMB_SIZE,
    borderRadius: 10,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideText: {
    color: '#888',
    fontWeight: '600',
  },
  thumb: {
    width: SLIDING_THUMB_SIZE,
    height: SLIDING_THUMB_SIZE,
    borderRadius: 5, // Slight border radius
    backgroundColor: '#E4423F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
});
