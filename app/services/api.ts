import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3333";

export const api = axios.create({
	baseURL: API_URL,
	timeout: 10000,
	headers: {
		"Content-Type": "application/json",
	},
});

// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use(
	async (config) => {
		const token = await SecureStore.getItemAsync("auth_token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// Interceptor para tratar erros
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (error.response?.status === 401) {
			// Token inválido ou expirado, limpa o storage
			await SecureStore.deleteItemAsync("auth_token");
			// Aqui você pode redirecionar para login se necessário
		}
		return Promise.reject(error);
	},
);

export default api;
