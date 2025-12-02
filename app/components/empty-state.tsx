import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { BookOpen } from "lucide-react-native";

interface EmptyStateProps {
	message: string;
	description?: string;
	icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, description, icon }) => {
	return (
		<View style={styles.container}>
			{icon || <BookOpen size={64} color="#8E8E93" />}
			<Text style={styles.message}>{message}</Text>
			{description && <Text style={styles.description}>{description}</Text>}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	message: {
		marginTop: 16,
		fontSize: 16,
		color: "#8E8E93",
		textAlign: "center",
		fontFamily: "Manrope-Bold",
	},
	description: {
		marginTop: 8,
		fontSize: 14,
		color: "#8E8E93",
		textAlign: "center",
		fontFamily: "Manrope-Regular",
	},
});
