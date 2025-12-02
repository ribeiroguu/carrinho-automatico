import api from "./api";
import type { AuthResponse } from "@/types";
import * as SecureStore from "expo-secure-store";

export const authService = {
	async register(data: {
		nome: string;
		matricula: string;
		email: string;
		senha: string;
		curso?: string;
	}): Promise<AuthResponse> {
		const response = await api.post("/auth/register", data);
		await SecureStore.setItemAsync("auth_token", response.data.token);
		return response.data;
	},

	async login(identificador: string, senha: string): Promise<AuthResponse> {
		const response = await api.post("/auth/login", {
			identificador,
			senha,
		});
		await SecureStore.setItemAsync("auth_token", response.data.token);
		return response.data;
	},

	async getMe() {
		const response = await api.get("/auth/me");
		return response.data.user;
	},

	async logout() {
		await api.post("/auth/logout");
		await SecureStore.deleteItemAsync("auth_token");
	},

	async getToken(): Promise<string | null> {
		return await SecureStore.getItemAsync("auth_token");
	},
};
