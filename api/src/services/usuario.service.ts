import { supabase } from '../config/supabase'
import type { Usuario } from '../types/database.types'
import { comparePassword, hashPassword } from '../utils/bcrypt'

export class UsuarioService {
  async getPerfil(usuario_matricula: string): Promise<Usuario | null> {
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('matricula', usuario_matricula)
      .single()

    if (error || !usuario) {
      return null
    }

    return usuario
  }

  async updatePerfil(
    usuario_matricula: string,
    updates: {
      nome?: string
      email?: string
      senha_atual?: string
      senha_nova?: string
    },
  ): Promise<Usuario> {
    const usuario = await this.getPerfil(usuario_matricula)

    if (!usuario) {
      throw new Error('Usuário não encontrado')
    }

    const updateData: any = {}

    // Atualiza nome
    if (updates.nome) {
      updateData.nome = updates.nome
    }

    // Atualiza email
    if (updates.email) {
      // Verifica se email já existe
      const { data: existingEmail } = await supabase
        .from('usuarios')
        .select('email')
        .eq('email', updates.email)
        .neq('matricula', usuario_matricula)
        .single()

      if (existingEmail) {
        throw new Error('Email já está em uso')
      }

      updateData.email = updates.email
    }

    // Atualiza senha
    if (updates.senha_atual && updates.senha_nova) {
      const senhaValida = await comparePassword(
        updates.senha_atual,
        usuario.senha_hash,
      )

      if (!senhaValida) {
        throw new Error('Senha atual incorreta')
      }

      updateData.senha_hash = await hashPassword(updates.senha_nova)
    }

    // Se não há nada para atualizar
    if (Object.keys(updateData).length === 0) {
      return usuario
    }

    updateData.updated_at = new Date().toISOString()

    const { data: updatedUser, error } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('matricula', usuario_matricula)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar perfil: ${error.message}`)
    }

    return updatedUser
  }

  async updatePushToken(usuario_matricula: string, push_token: string): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .update({ push_token })
      .eq('matricula', usuario_matricula)

    if (error) {
      throw new Error(`Erro ao atualizar push token: ${error.message}`)
    }
  }

  async getStatusMulta(usuario_matricula: string): Promise<{
    bloqueado: boolean
    dias_restantes: number
    data_fim_bloqueio: Date | null
  }> {
    const usuario = await this.getPerfil(usuario_matricula)

    if (!usuario) {
      throw new Error('Usuário não encontrado')
    }

    const bloqueado =
      usuario.dias_bloqueado > 0 &&
      usuario.data_fim_bloqueio &&
      new Date(usuario.data_fim_bloqueio) > new Date()

    let diasRestantes = 0
    if (bloqueado && usuario.data_fim_bloqueio) {
      const diff =
        new Date(usuario.data_fim_bloqueio).getTime() - new Date().getTime()
      diasRestantes = Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    return {
      bloqueado: !!bloqueado,
      dias_restantes: diasRestantes,
      data_fim_bloqueio: usuario.data_fim_bloqueio,
    }
  }
}
