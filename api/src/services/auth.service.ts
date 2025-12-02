import { supabase } from '../config/supabase'
import type { Usuario } from '../types/database.types'
import { comparePassword, hashPassword } from '../utils/bcrypt'

export class AuthService {
  async register(data: {
    nome: string
    matricula: string
    email: string
    senha: string
    curso?: string
  }): Promise<Usuario> {
    // Verifica se matrícula já existe
    const { data: existingMatricula } = await supabase
      .from('usuarios')
      .select('id')
      .eq('matricula', data.matricula)
      .single()

    if (existingMatricula) {
      throw new Error('Matrícula já cadastrada')
    }

    // Verifica se email já existe
    const { data: existingEmail } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', data.email)
      .single()

    if (existingEmail) {
      throw new Error('Email já cadastrado')
    }

    // Hash da senha
    const senha_hash = await hashPassword(data.senha)

    // Cria usuário
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .insert({
        nome: data.nome,
        matricula: data.matricula,
        email: data.email,
        senha_hash,
        curso: data.curso || null,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar usuário: ${error.message}`)
    }

    return usuario
  }

  async login(identificador: string, senha: string): Promise<Usuario | null> {
    // Busca por email ou matrícula
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .or(`email.eq.${identificador},matricula.eq.${identificador}`)
      .single()

    if (error || !usuario) {
      return null
    }

    // Verifica senha
    const senhaValida = await comparePassword(senha, usuario.senha_hash)

    if (!senhaValida) {
      return null
    }

    return usuario
  }

  async getUserById(id: string): Promise<Usuario | null> {
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !usuario) {
      return null
    }

    return usuario
  }
}
