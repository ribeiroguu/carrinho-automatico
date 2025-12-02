import api from "./api";
import type { Livro } from "@/types";

export const favoritosService = {
	async listar(): Promise<Livro[]> {
		const response = await api.get("/favoritos");
		return response.data.favoritos;
	},

	async adicionar(livroId: number): Promise<void> {
		await api.post(`/favoritos/${livroId}`);
	},

	async remover(livroId: number): Promise<void> {
		await api.delete(`/favoritos/${livroId}`);
	},

	async isFavorito(livroId: number): Promise<{ isFavorito: boolean }> {
		const response = await api.get(`/favoritos/${livroId}/check`);
		return response.data;
	},
};
