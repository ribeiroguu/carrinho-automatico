import api from "./api";
import type { Favorito } from "@/types";

export const favoritosService = {
	async getAll(): Promise<Favorito[]> {
		const response = await api.get("/favoritos");
		return response.data.favoritos;
	},

	async add(livroId: string): Promise<void> {
		await api.post(`/favoritos/${livroId}`);
	},

	async remove(livroId: string): Promise<void> {
		await api.delete(`/favoritos/${livroId}`);
	},

	async isFavorito(livroId: string): Promise<boolean> {
		const response = await api.get(`/favoritos/${livroId}/check`);
		return response.data.isFavorito;
	},
};
