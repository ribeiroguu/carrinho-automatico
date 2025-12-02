import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export const LoadingScreen: React.FC<{ size?: "small" | "large" }> = ({
	size = "large",
}) => {
	return (
		<View style={styles.container}>
			<ActivityIndicator size={size} color="#69B565" />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
	},
});
