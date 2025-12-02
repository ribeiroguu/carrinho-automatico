import api from "./api";
import type { Emprestimo } from "@/types";

export const emprestimosService = {
	async getAtivos(): Promise<Emprestimo[]> {
		const response = await api.get("/emprestimos/ativos");
		return response.data.emprestimos;
	},

	async getHistorico(page = 1, limit = 10) {
		const response = await api.get("/emprestimos/historico", {
			params: { page, limit },
		});
		return response.data;
	},

	async renovar(emprestimoId: string): Promise<Date> {
		const response = await api.post(`/emprestimos/${emprestimoId}/renovar`);
		return new Date(response.data.nova_data_prevista);
	},

	async devolver(emprestimoId: string): Promise<void> {
		await api.post(`/emprestimos/${emprestimoId}/devolver`);
	},

	async verificarLimite(): Promise<{
		pode_emprestar: boolean;
		livros_atuais: number;
		bloqueado: boolean;
	}> {
		const response = await api.get("/emprestimos/verificar-limite");
		return response.data;
	},
};
