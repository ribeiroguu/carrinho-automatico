import { Image, StyleSheet, Text, View } from "react-native";

interface LogoProps {
  variant?: "large" | "medium" | "small";
  size?: number;
  color?: string;
}

const VARIANT_CONFIG = {
  large: (size?: number) => ({
    flexDirection: "column" as const,
    imageSize: size || 200,
    textSize: size ? size * 0.24 : 48,
    imageMargin: size ? size * 0.1 : 20,
  }),
  medium: (size?: number) => ({
    flexDirection: "row" as const,
    imageSize: size || 100,
    textSize: size || 50,
    imageMargin: 5,
  }),
  small: (size?: number) => ({
    flexDirection: "row" as const,
    imageSize: size || 40,
    textSize: 0,
    imageMargin: 0,
  }),
};

const LogoBibliotech = ({
  variant = "large",
  size,
  color = "white",
}: LogoProps) => {
  const config = VARIANT_CONFIG[variant](size);
  const showText = variant !== "small";

  return (
    <View style={[styles.container, { flexDirection: config.flexDirection }]}>
      <Image
        source={require("@/assets/images/logo.png")}
        style={{
          width: config.imageSize,
          height: config.imageSize,
          marginRight: variant === "medium" ? config.imageMargin : 0,
          marginBottom: variant === "large" ? config.imageMargin : 0,
        }}
      />
      {showText && (
        <Text
          style={[
            styles.text,
            {
              color,
              fontSize: config.textSize,
            },
          ]}
        >
          Bibliotech
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontFamily: "SortsMill Goudy",
  },
});

export default LogoBibliotech;