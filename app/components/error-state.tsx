import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AlertCircle } from "lucide-react-native";

interface ErrorStateProps {
	message?: string;
	onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
	message = "Algo deu errado",
}) => {
	return (
		<View style={styles.container}>
			<AlertCircle size={64} color="#FF3B30" />
			<Text style={styles.message}>{message}</Text>
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
		color: "#666",
		textAlign: "center",
		fontFamily: "Manrope-Regular",
	},
});
