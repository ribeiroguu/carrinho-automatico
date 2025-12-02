import api from "./api";
import type { Favorito } from "@/types";

export const favoritosService = {
	async listar(): Promise<Favorito[]> {
		const response = await api.get("/favoritos");
		return response.data.favoritos;
	},

	async adicionar(livroId: string): Promise<void> {
		await api.post(`/favoritos/${livroId}`);
	},

	async remover(livroId: string): Promise<void> {
		await api.delete(`/favoritos/${livroId}`);
	},

	async isFavorito(livroId: string): Promise<{ isFavorito: boolean }> {
		const response = await api.get(`/favoritos/${livroId}/check`);
		return response.data;
	},
};
