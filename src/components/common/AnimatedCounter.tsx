// src/components/common/AnimatedCounter.tsx
// Professional animated counter that displays only whole numbers during animation

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TextStyle, Easing } from 'react-native';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  style?: TextStyle;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  easing?: (value: number) => number;
  onAnimationComplete?: () => void;
}

interface AnimatedScoreProps {
  score: number;
  maxScore?: number;
  style?: TextStyle;
  getScoreColor?: (score: number) => string;
  showLabel?: boolean;
  getScoreLabel?: (score: number) => string;
  duration?: number;
}

/**
 * Simple Animated Score Component
 *
 * Specialized for score displays with color transitions
 * Shows only whole numbers during animation
 */
export const AnimatedScore: React.FC<AnimatedScoreProps> = ({
  score,
  maxScore = 100,
  style,
  getScoreColor,
  showLabel = false,
  getScoreLabel,
  duration = 1000,
}) => {
  const [currentScore, setCurrentScore] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(animatedValue, {
      toValue: score,
      duration,
      useNativeDriver: false,
      easing: Easing.out(Easing.quad),
    });

    const listener = animatedValue.addListener(({ value }) => {
      setCurrentScore(Math.round(value));
    });

    animation.start();

    return () => {
      animatedValue.removeListener(listener);
      animation.stop();
    };
  }, [score, duration]);

  const scoreColor = getScoreColor ? getScoreColor(currentScore) : undefined;
  const scoreLabel = getScoreLabel ? getScoreLabel(currentScore) : '';

  return (
    <>
      <Text style={[style, scoreColor ? { color: scoreColor } : {}]}>
        {currentScore}
      </Text>
      {showLabel && scoreLabel && (
        <Text style={[style, { fontSize: (style as any)?.fontSize * 0.6 }]}>
          {scoreLabel}
        </Text>
      )}
    </>
  );
};

/**
 * Simple Animated Counter Component
 *
 * For basic counting animations
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  style,
  prefix = '',
  suffix = '',
  decimals = 0,
  onAnimationComplete,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
      easing: Easing.out(Easing.quad),
    });

    const listener = animatedValue.addListener(({ value: animValue }) => {
      const roundedValue =
        decimals > 0
          ? Math.round(animValue * Math.pow(10, decimals)) /
            Math.pow(10, decimals)
          : Math.round(animValue);
      setDisplayValue(roundedValue);
    });

    animation.start(finished => {
      if (finished) {
        setDisplayValue(value);
        onAnimationComplete?.();
      }
    });

    return () => {
      animatedValue.removeListener(listener);
      animation.stop();
    };
  }, [value, duration, decimals, onAnimationComplete]);

  return (
    <Text style={style}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </Text>
  );
};
