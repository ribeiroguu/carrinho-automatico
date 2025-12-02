import { create } from "zustand";
import type { Usuario, AuthResponse } from "@/types";
import { authService } from "@/services/auth.service";

interface AuthStore {
	user: Usuario | null;
	token: string | null;
	isLoading: boolean;
	isAuthenticated: boolean;

	// Actions
	login: (identificador: string, senha: string) => Promise<void>;
	register: (data: {
		nome: string;
		matricula: string;
		email: string;
		senha: string;
		curso?: string;
	}) => Promise<void>;
	logout: () => Promise<void>;
	loadUser: () => Promise<void>;
	setUser: (user: Usuario) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
	user: null,
	token: null,
	isLoading: false,
	isAuthenticated: false,

	login: async (identificador: string, senha: string) => {
		try {
			set({ isLoading: true });
			const response = await authService.login(identificador, senha);
			set({
				user: response.user,
				token: response.token,
				isAuthenticated: true,
				isLoading: false,
			});
		} catch (error) {
			set({ isLoading: false });
			throw error;
		}
	},

	register: async (data) => {
		try {
			set({ isLoading: true });
			const response = await authService.register(data);
			set({
				user: response.user,
				token: response.token,
				isAuthenticated: true,
				isLoading: false,
			});
		} catch (error) {
			set({ isLoading: false });
			throw error;
		}
	},

	logout: async () => {
		try {
			await authService.logout();
			set({
				user: null,
				token: null,
				isAuthenticated: false,
			});
		} catch (error) {
			// Mesmo se der erro, limpa o estado local
			set({
				user: null,
				token: null,
				isAuthenticated: false,
			});
		}
	},

	loadUser: async () => {
		try {
			const token = await authService.getToken();
			if (token) {
				const user = await authService.getMe();
				set({
					user,
					token,
					isAuthenticated: true,
				});
			}
		} catch (error) {
			// Token inválido, limpa tudo
			set({
				user: null,
				token: null,
				isAuthenticated: false,
			});
		}
	},

	setUser: (user: Usuario) => {
		set({ user });
	},
}));
