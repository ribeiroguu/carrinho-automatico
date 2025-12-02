export interface Usuario {
	id: string; // UUID no banco
	nome: string;
	matricula: string;
	email: string;
	curso: string | null;
	dias_bloqueado: number;
	data_fim_bloqueio: string | null;
	push_token?: string | null;
	created_at: string;
	updated_at: string;
}

export interface Livro {
	id: string; // UUID no banco
	titulo: string;
	autor: string;
	rfid_tag: string;
	capa_url: string | null;
	categoria: string | null;
	sinopse: string | null;
	status: "disponivel" | "emprestado" | "manutencao";
	created_at: string;
	updated_at: string;
}

export interface Emprestimo {
	id: string; // UUID no banco
	usuario_id: string; // UUID
	livro_id: string; // UUID
	data_retirada: string; // data_retirada no banco
	data_prevista: string; // data_prevista no banco
	data_devolucao: string | null; // data_devolucao no banco
	renovacoes: number;
	atrasado: boolean;
	dias_atraso: number;
	created_at: string;
	livro: Livro;
}

export interface Favorito {
	id: string; // UUID no banco
	usuario_id: string; // UUID
	livro_id: string; // UUID
	created_at: string;
	livro: Livro;
}

export interface AuthResponse {
	user: Usuario;
	token: string;
}

export interface CarrinhoSessao {
	sessao_id: string;
	codigo_sessao: string;
}

export interface APIError {
	error: string;
	details?: any;
}
