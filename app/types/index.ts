export interface Usuario {
	id: string;
	nome: string;
	matricula: string;
	email: string;
	curso: string | null;
	dias_bloqueado: number;
	data_fim_bloqueio: Date | null;
}

export interface Livro {
	id: string;
	titulo: string;
	autor: string;
	rfid_tag: string;
	capa_url: string | null;
	categoria: string | null;
	sinopse: string | null;
	status: "disponivel" | "emprestado" | "manutencao";
	created_at: Date;
	updated_at: Date;
}

export interface Emprestimo {
	id: string;
	usuario_id: string;
	livro_id: string;
	data_retirada: Date;
	data_prevista: Date;
	data_devolucao: Date | null;
	renovacoes: number;
	atrasado: boolean;
	dias_atraso: number;
	created_at: Date;
	livro: Livro;
}

export interface Favorito {
	id: string;
	usuario_id: string;
	livro_id: string;
	created_at: Date;
	livro: Livro;
}

export interface AuthResponse {
	user: Usuario;
	token: string;
}

export interface CarrinhoSessao {
	sessao_id: string;
	codigo: string;
}

export interface APIError {
	error: string;
	details?: any;
}
