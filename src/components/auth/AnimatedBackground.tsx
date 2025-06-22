// src/components/auth/AnimatedBackground.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../constants';

export const AnimatedBackground: React.FC = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous rotation for background elements
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 30000,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <>
      <Animated.View
        style={[styles.backgroundCircle1, { transform: [{ rotate: spin }] }]}
      />
      <Animated.View
        style={[styles.backgroundCircle2, { transform: [{ rotate: spin }] }]}
      />
      <View style={styles.backgroundCircle3} />
    </>
  );
};

const styles = StyleSheet.create({
  backgroundCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primary,
    opacity: 0.1,
    top: -100,
    right: -100,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: COLORS.secondary,
    opacity: 0.08,
    bottom: -150,
    left: -150,
  },
  backgroundCircle3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.accent,
    opacity: 0.1,
    top: '40%',
    left: -50,
  },
});
