import { z } from 'zod'

// Auth
export const registerSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  matricula: z.string().min(4, 'Matrícula inválida'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  curso: z.string().optional(),
})

export const loginSchema = z.object({
  identificador: z.string().min(3, 'Identificador é obrigatório'),
  senha: z.string().min(1, 'Senha é obrigatória'),
})

// Perfil
export const updateProfileSchema = z.object({
  nome: z.string().min(3).optional(),
  email: z.string().email().optional(),
  senha_atual: z.string().optional(),
  senha_nova: z.string().min(6).optional(),
})

// Carrinho RFID
export const rfidLeituraSchema = z.object({
  sessao_id: z.string().min(1, 'Sessão ID é obrigatório'),
  rfid_tag: z.string().min(1, 'RFID tag é obrigatória'),
})

export const finalizarCarrinhoSchema = z.object({
  sessao_id: z.string().min(1, 'Sessão ID é obrigatório'),
})

export const associarRfidSchema = z.object({
  rfid: z.string().min(1, 'RFID é obrigatório'),
})

// Push Token
export const pushTokenSchema = z.object({
  push_token: z.string().min(1, 'Push token é obrigatório'),
})
