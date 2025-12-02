import api from "./api";
import type { Usuario } from "@/types";

export const usuarioService = {
	async getPerfil(): Promise<Usuario> {
		const response = await api.get("/usuario/perfil");
		return response.data.usuario;
	},

	async updatePerfil(data: {
		nome?: string;
		email?: string;
		senha_atual?: string;
		senha_nova?: string;
	}): Promise<Usuario> {
		const response = await api.put("/usuario/perfil", data);
		return response.data.usuario;
	},

	async updatePushToken(pushToken: string): Promise<void> {
		await api.put("/usuario/push-token", { push_token: pushToken });
	},

	async getStatusMulta(): Promise<{
		bloqueado: boolean;
		dias_restantes: number;
		data_fim_bloqueio: Date | null;
	}> {
		const response = await api.get("/usuario/status-multa");
		return response.data;
	},
};
