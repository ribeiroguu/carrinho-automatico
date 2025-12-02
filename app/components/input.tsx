import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

interface FloatingInputProps extends TextInputProps {
  placeholder: string;
  value?: string;
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  placeholder,
  value,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  const inputRef = useRef<TextInput>(null);

  const animateLabel = (toValue: number) => {
    Animated.timing(animatedValue, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleFocus = () => {
    setIsFocused(true);
    animateLabel(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) animateLabel(0);
  };

  useEffect(() => {
    if (value && !isFocused) animateLabel(1);
  }, [value]);

  const labelStyle = {
    position: "absolute" as "absolute",
    left: 17,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [17, -10],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 16],
    }),
    backgroundColor: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ["transparent", "#003F09"],
    }),
    paddingHorizontal: 4,
  };

  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      <Animated.Text
        style={[styles.placeholder, labelStyle]}
        onPress={() => inputRef.current?.focus()}>
        {placeholder}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    marginVertical: 10,
  },
  input: {
    fontWeight: "500",
    fontSize: 16,
    width: 325,
    height: 60,
    padding: 15,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#D9D9D9",
    backgroundColor: "#003F09",
    color: "#fff",
    fontFamily: "Manrope-Regular",
  },
  placeholder: {
    fontFamily: "Manrope-Regular",
    color: "#fff",
  },
});

export default FloatingInput;
