import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

type AnimationType = 'fade' | 'slideUp' | 'slideDown' | 'scale';

interface AnimatedScreenProps {
  children: React.ReactNode;
  animation?: AnimationType;
  duration?: number;
  style?: ViewStyle;
  resetOnFocus?: boolean;
}

export const AnimatedScreen: React.FC<AnimatedScreenProps> = ({
  children,
  animation = 'fade',
  duration = 400,
  style,
  resetOnFocus = false,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const transform = useRef(new Animated.Value(0)).current;

  const animate = () => {
    opacity.setValue(0);
    transform.setValue(animation === 'slideDown' ? -30 : animation === 'scale' ? 0.85 : 30);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(transform, {
        toValue: animation === 'scale' ? 1 : 0,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useFocusEffect(
    React.useCallback(() => {
      if (resetOnFocus) animate();
    }, [resetOnFocus])
  );

  useEffect(() => {
    if (!resetOnFocus) animate();
  }, []);

  const animatedStyle: ViewStyle = {
    flex: 1,
    opacity,
    transform: animation === 'scale' 
      ? [{ scale: transform }]
      : animation !== 'fade'
      ? [{ translateY: transform }]
      : undefined,
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};