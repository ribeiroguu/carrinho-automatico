import { create } from "zustand";
import type { Livro } from "@/types";
import { livrosService } from "@/services/livros.service";

interface BooksStore {
	livros: Livro[];
	recomendados: Livro[];
	isLoading: boolean;
	searchQuery: string;
	page: number;
	totalPages: number;

	// Actions
	fetchLivros: (params?: {
		search?: string;
		categoria?: string;
		page?: number;
	}) => Promise<void>;
	fetchRecomendados: () => Promise<void>;
	setSearchQuery: (query: string) => void;
	clearSearch: () => void;
}

export const useBooksStore = create<BooksStore>((set, get) => ({
	livros: [],
	recomendados: [],
	isLoading: false,
	searchQuery: "",
	page: 1,
	totalPages: 1,

	fetchLivros: async (params) => {
		try {
			set({ isLoading: true });
			const result = await livrosService.getAll(params);
			set({
				livros: result.livros,
				page: result.page,
				totalPages: result.pages,
				isLoading: false,
			});
		} catch (error) {
			set({ isLoading: false });
			throw error;
		}
	},

	fetchRecomendados: async () => {
		try {
			const recomendados = await livrosService.getRecomendados();
			set({ recomendados });
		} catch (error) {
			console.error("Erro ao buscar recomendados:", error);
		}
	},

	setSearchQuery: (query: string) => {
		set({ searchQuery: query });
	},

	clearSearch: () => {
		set({ searchQuery: "" });
		get().fetchLivros();
	},
}));
