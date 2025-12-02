import api from "./api";
import type { Emprestimo } from "@/types";

export const emprestimosService = {
	async getAtivos(): Promise<Emprestimo[]> {
		const response = await api.get("/emprestimos/ativos");
		return response.data.emprestimos;
	},

	async getHistorico(page = 1, limit = 10): Promise<{
		emprestimos: Emprestimo[];
		total: number;
		page: number;
		pages: number;
	}> {
		const response = await api.get("/emprestimos/historico", {
			params: { page, limit },
		});
		return response.data;
	},

	async renovar(emprestimoId: string): Promise<{ nova_data_devolucao_prevista: string }> {
		const response = await api.post(`/emprestimos/${emprestimoId}/renovar`);
		return response.data;
	},

	async devolver(emprestimoId: string): Promise<void> {
		await api.post(`/emprestimos/${emprestimoId}/devolver`);
	},

	async verificarLimite(): Promise<{
		pode_emprestar: boolean;
		emprestimos_ativos: number;
		limite: number;
		bloqueado: boolean;
	}> {
		const response = await api.get("/emprestimos/verificar-limite");
		return response.data;
	},
};
