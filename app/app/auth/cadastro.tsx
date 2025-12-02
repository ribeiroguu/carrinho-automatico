import Button from "@/components/button";
import FloatingInput from "@/components/input";
import LogoBibliotech from "@/components/logo";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import {
	SafeAreaProvider,
	SafeAreaView,
} from "react-native-safe-area-context";

export default function Cadastro() {
	const [nome, setNome] = useState("");
	const [matricula, setMatricula] = useState("");
	const [email, setEmail] = useState("");
	const [curso, setCurso] = useState("");
	const [senha, setSenha] = useState("");
	const [confirmaSenha, setConfirmaSenha] = useState("");

	const router = useRouter();
	const { register, isLoading } = useAuthStore();

	const handleRegister = async () => {
		// Validações
		if (!nome || !matricula || !email || !senha || !confirmaSenha) {
			Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios");
			return;
		}

		if (senha !== confirmaSenha) {
			Alert.alert("Erro", "As senhas não coincidem");
			return;
		}

		if (senha.length < 6) {
			Alert.alert("Erro", "A senha deve ter no mínimo 6 caracteres");
			return;
		}

		try {
			await register({
				nome,
				matricula,
				email,
				senha,
				curso: curso || undefined,
			});

			Alert.alert("Sucesso", "Conta criada com sucesso!", [
				{
					text: "OK",
					onPress: () => router.replace("/default/home"),
				},
			]);
		} catch (error: any) {
			console.error("Erro ao criar conta:", error);
			Alert.alert(
				"Erro ao criar conta",
				error.response?.data?.error || "Erro ao criar conta. Tente novamente.",
			);
		}
	};

	return (
		<SafeAreaProvider
			style={{
				backgroundColor: "#003F09",
				flex: 1,
			}}
		>
			<SafeAreaView
				style={{
					flex: 1,
					alignItems: "center",
					width: "100%",
				}}
			>
				<ScrollView
					contentContainerStyle={{
						flexGrow: 1,
						justifyContent: "space-between",
						alignItems: "center",
						paddingVertical: 20,
					}}
					showsVerticalScrollIndicator={false}
				>
					<View
						style={{
							justifyContent: "center",
							alignItems: "center",
							marginTop: 20,
						}}
					>
						<LogoBibliotech variant="medium" />
					</View>

					<View
						style={{
							justifyContent: "center",
							alignItems: "center",
							gap: 5,
							marginVertical: 20,
						}}
					>
						<FloatingInput
							placeholder="Nome Completo *"
							value={nome}
							onChangeText={setNome}
							autoCapitalize="words"
							editable={!isLoading}
						/>

						<FloatingInput
							placeholder="Matrícula *"
							value={matricula}
							onChangeText={setMatricula}
							autoCapitalize="none"
							editable={!isLoading}
						/>

						<FloatingInput
							placeholder="Email *"
							value={email}
							onChangeText={setEmail}
							keyboardType="email-address"
							autoCapitalize="none"
							editable={!isLoading}
						/>

						<FloatingInput
							placeholder="Curso (opcional)"
							value={curso}
							onChangeText={setCurso}
							autoCapitalize="words"
							editable={!isLoading}
						/>

						<FloatingInput
							placeholder="Senha *"
							value={senha}
							onChangeText={setSenha}
							autoCapitalize="none"
							secureTextEntry={true}
							editable={!isLoading}
						/>

						<FloatingInput
							placeholder="Confirme sua senha *"
							value={confirmaSenha}
							onChangeText={setConfirmaSenha}
							autoCapitalize="none"
							secureTextEntry={true}
							editable={!isLoading}
						/>
					</View>

					<View
						style={{
							justifyContent: "center",
							alignItems: "center",
							gap: 10,
							marginBottom: 20,
						}}
					>
						<Button
							title="Criar conta"
							onPress={handleRegister}
							variant="secondary"
							size="large"
							loading={isLoading}
							disabled={isLoading}
						/>

						<Button
							title="Já tenho conta"
							onPress={() => router.back()}
							variant="primary"
							size="large"
							disabled={isLoading}
						/>
					</View>
				</ScrollView>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}
