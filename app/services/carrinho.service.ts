import api from "./api";
import type { CarrinhoSessao, Livro } from "@/types";

export const carrinhoService = {
	async iniciarSessao(): Promise<CarrinhoSessao> {
		const response = await api.post("/carrinhos/iniciar-sessao");
		return response.data;
	},

	async getLivrosCarrinho(sessaoId: string): Promise<Livro[]> {
		const response = await api.get(`/carrinhos/sessao/${sessaoId}`);
		return response.data.livros;
	},

	async removerLivro(livroId: string, sessaoId: string): Promise<void> {
		await api.delete(`/carrinho/remover/${livroId}`, {
			data: { sessao_id: sessaoId },
		});
	},

	async finalizar(sessaoId: string): Promise<{ emprestimos: number[] }> {
		const response = await api.post("/carrinho/finalizar", { sessao_id: sessaoId });
		return response.data;
	},
};
