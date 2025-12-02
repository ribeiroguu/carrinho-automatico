import type { FastifyRequest } from 'fastify'

export interface AuthRequest extends FastifyRequest {
  user: {
    id: string
    matricula: string
    email: string
  }
}

export interface RegisterBody {
  nome: string
  matricula: string
  email: string
  senha: string
  curso?: string
}

export interface LoginBody {
  identificador: string // email ou matrícula
  senha: string
}

export interface UpdateProfileBody {
  nome?: string
  email?: string
  senha_atual?: string
  senha_nova?: string
}

export interface RFIDLeituraBody {
  sessao_id: string
  rfid_tag: string
}

export interface FinalizarCarrinhoBody {
  sessao_id: string
}
