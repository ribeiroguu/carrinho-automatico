import { create } from "zustand";
import type { CarrinhoSessao, Livro } from "@/types";
import { carrinhoService } from "@/services/carrinho.service";

interface CartStore {
	sessao: CarrinhoSessao | null;
	livros: Livro[];
	isLoading: boolean;
	isPolling: boolean;

	// Actions
	iniciarSessao: () => Promise<void>;
	fetchLivros: () => Promise<void>;
	removerLivro: (livroId: number) => Promise<void>;
	finalizar: () => Promise<void>;
	limparSessao: () => void;
	startPolling: () => void;
	stopPolling: () => void;
}

let pollingInterval: ReturnType<typeof setInterval> | null = null;

export const useCartStore = create<CartStore>((set, get) => ({
	sessao: null,
	livros: [],
	isLoading: false,
	isPolling: false,

	iniciarSessao: async () => {
		try {
			set({ isLoading: true });
			const sessao = await carrinhoService.iniciarSessao();
			set({ sessao, livros: [], isLoading: false });
		} catch (error) {
			set({ isLoading: false });
			throw error;
		}
	},

	fetchLivros: async () => {
		const { sessao } = get();
		if (!sessao) return;

		try {
			const livros = await carrinhoService.getLivrosCarrinho(sessao.sessao_id);
			set({ livros });
		} catch (error) {
			console.error("Erro ao buscar livros do carrinho:", error);
		}
	},

	removerLivro: async (livroId: number) => {
		const { sessao } = get();
		if (!sessao) return;

		try {
			await carrinhoService.removerLivro(livroId, sessao.sessao_id);
			await get().fetchLivros();
		} catch (error) {
			throw error;
		}
	},

	finalizar: async () => {
		const { sessao } = get();
		if (!sessao) return;

		try {
			set({ isLoading: true });
			await carrinhoService.finalizar(sessao.sessao_id);
			get().limparSessao();
			get().stopPolling();
			set({ isLoading: false });
		} catch (error) {
			set({ isLoading: false });
			throw error;
		}
	},

	limparSessao: () => {
		set({ sessao: null, livros: [] });
	},

	startPolling: () => {
		if (pollingInterval) return;

		set({ isPolling: true });
		pollingInterval = setInterval(() => {
			get().fetchLivros();
		}, 3000); // Poll a cada 3 segundos
	},

	stopPolling: () => {
		if (pollingInterval) {
			clearInterval(pollingInterval);
			pollingInterval = null;
		}
		set({ isPolling: false });
	},
}));
