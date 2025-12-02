import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  textStyle,
  ...props
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[`button_${variant}`],
        styles[`button_${size}`],
        disabled && styles.button_disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#D9D9D9" : "#69B565"}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`text_${variant}`],
            styles[`text_${size}`],
            disabled && styles.text_disabled,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create<any>({
  button: {
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  text: {
    textAlign: "center",
    fontFamily: "Manrope-Bold",
  },

  // Variants
  button_primary: {
    backgroundColor: "#69B565",
  },
  button_secondary: {
    backgroundColor: "#D9D9D9",
  },
  button_danger: {
    backgroundColor: "#FF3B30",
  },

  text_primary: {
    color: "#000",
  },
  text_secondary: {
    color: "#000",
  },
  text_danger: {
    color: "#FFFFFF",
  },

  // Sizes
  button_small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  button_medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 44,
  },
  button_large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    height: 60,
    width: 325,
  },

  text_small: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 16,
  },
  text_large: {
    fontSize: 20,
  },

  // States
  button_disabled: {
    backgroundColor: "#C7C7CC",
    borderColor: "#C7C7CC",
  },
  text_disabled: {
    color: "#8E8E93",
  },
});

export default Button;
