export interface Usuario {
	matricula: string; // PRIMARY KEY
	nome: string;
	email: string;
	curso: string | null;
	dias_bloqueado: number;
	data_fim_bloqueio: string | null;
	push_token?: string | null;
	created_at: string;
	updated_at: string;
}

export interface Livro {
	rfid_tag: string; // PRIMARY KEY
	titulo: string;
	autor: string;
	capa_url: string | null;
	categoria: string | null;
	sinopse: string | null;
	status: "disponivel" | "emprestado" | "manutencao";
	created_at: string;
	updated_at: string;
}

export interface Emprestimo {
	id: string; // UUID
	usuario_matricula: string; // FK
	livro_rfid: string; // FK
	data_retirada: string;
	data_prevista: string;
	data_devolucao: string | null;
	renovacoes: number;
	atrasado: boolean;
	dias_atraso: number;
	created_at: string;
	livro: Livro;
}

export interface Favorito {
	id: string; // UUID
	usuario_matricula: string; // FK
	livro_rfid: string; // FK
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
