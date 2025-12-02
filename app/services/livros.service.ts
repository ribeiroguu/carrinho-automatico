import api from "./api";
import type { Livro } from "@/types";

export const livrosService = {
	async getAll(params?: {
		search?: string;
		categoria?: string;
		page?: number;
		limit?: number;
	}): Promise<{
		livros: Livro[];
		total: number;
		page: number;
		pages: number;
	}> {
		const response = await api.get("/livros", { params });
		return response.data;
	},

	async getById(id: number): Promise<Livro> {
		const response = await api.get(`/livros/${id}`);
		return response.data.livro;
	},

	async getRecomendados(): Promise<Livro[]> {
		const response = await api.get("/livros/recomendados");
		return response.data.livros;
	},
};
