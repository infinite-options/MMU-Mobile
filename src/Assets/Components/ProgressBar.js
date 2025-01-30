import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

const ProgressBar = ({ startProgress, endProgress, style }) => {
  const animatedProgress = useRef(new Animated.Value(startProgress)).current; // Initialize with startProgress

  useEffect(() => {
    const duration = (endProgress - startProgress) * 50; // Calculate total duration based on speed

    // Use timing animation with calculated duration
    Animated.timing(animatedProgress, {
      toValue: endProgress, // Target progress value
      duration: duration, // Total animation time
      easing: Easing.linear, // Linear easing for consistent speed
      useNativeDriver: false, // Native driver is not supported for layout animations
    }).start();
  }, [startProgress, endProgress]);

  // Interpolate the animated value to convert it into a width percentage
  const animatedWidth = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'], // Map progress value to percentage width
  });

  return (
    <View style={[styles.progressBarContainer, style]}>
      <Animated.View style={[styles.progress, { width: animatedWidth }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 20,
  },
  progress: {
    height: '100%',
    backgroundColor: '#000',
  },
});

export default ProgressBar;