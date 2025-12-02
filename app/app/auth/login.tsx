import Button from "@/components/button";
import FloatingInput from "@/components/input";
import LogoBibliotech from "@/components/logo";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";
import {
	SafeAreaProvider,
	SafeAreaView,
} from "react-native-safe-area-context";

export default function Login() {
	const [identificador, setIdentificador] = useState("");
	const [password, setPassword] = useState("");
	const router = useRouter();

	const { login, isLoading } = useAuthStore();

	const handleLogin = async () => {
		if (!identificador || !password) {
			Alert.alert("Erro", "Por favor, preencha todos os campos");
			return;
		}

		try {
			await login(identificador, password);
			router.replace("/default/home");
		} catch (error: any) {
			console.error("Erro ao fazer login:", error);
			Alert.alert(
				"Erro ao fazer login",
				error.response?.data?.error || "Credenciais inválidas",
			);
		}
	};

	return (
		<SafeAreaProvider
			style={{
				backgroundColor: "#003F09",
				flex: 1,
				justifyContent: "center",
			}}
		>
			<SafeAreaView
				style={{
					flex: 1,
					justifyContent: "space-between",
					alignItems: "center",
					width: "100%",
				}}
			>
				<View
					style={{
						flex: 1,
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<LogoBibliotech variant="medium" />
				</View>

				<View
					style={{
						flex: 1,
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<FloatingInput
						placeholder="Email ou Matrícula"
						value={identificador}
						onChangeText={setIdentificador}
						keyboardType="email-address"
						autoCapitalize="none"
						editable={!isLoading}
					/>

					<FloatingInput
						placeholder="Senha"
						value={password}
						onChangeText={setPassword}
						autoCapitalize="none"
						secureTextEntry={true}
						editable={!isLoading}
					/>
				</View>

				<View
					style={{
						flex: 1,
						justifyContent: "center",
						alignItems: "center",
						gap: 10,
					}}
				>
					<Button
						title="Entrar"
						onPress={handleLogin}
						variant="primary"
						size="large"
						loading={isLoading}
						disabled={isLoading}
					/>

					<Button
						title="Criar conta"
						onPress={() => router.push("/auth/cadastro")}
						variant="secondary"
						size="large"
						disabled={isLoading}
					/>
				</View>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}
