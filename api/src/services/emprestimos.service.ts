import { supabase } from '../config/supabase'
import type { EmprestimoComLivro } from '../types/database.types'

export class EmprestimosService {
  async getAtivos(usuario_matricula: string): Promise<EmprestimoComLivro[]> {
    const { data, error } = await supabase
      .from('emprestimos')
      .select(
        `
				*,
				livro:livros (*)
			`,
      )
      .eq('usuario_matricula', usuario_matricula)
      .is('data_devolucao', null)
      .order('data_retirada', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar empréstimos: ${error.message}`)
    }

    return data || []
  }

  async getHistorico(
    usuario_matricula: string,
    page = 1,
    limit = 10,
  ): Promise<{ 
    emprestimos: EmprestimoComLivro[]; 
    total: number;
    page: number;
    pages: number;
  }> {
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from('emprestimos')
      .select(
        `
				*,
				livro:livros (*)
			`,
        { count: 'exact' },
      )
      .eq('usuario_matricula', usuario_matricula)
      .order('data_retirada', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Erro ao buscar histórico: ${error.message}`)
    }

    const total = count || 0
    const pages = Math.ceil(total / limit)

    return {
      emprestimos: data || [],
      total,
      page,
      pages,
    }
  }

  async renovar(
    emprestimo_id: string,
    usuario_matricula: string,
  ): Promise<{ success: boolean; nova_data: Date }> {
    // Busca o empréstimo
    const { data: emprestimo, error: fetchError } = await supabase
      .from('emprestimos')
      .select('*')
      .eq('id', emprestimo_id)
      .eq('usuario_matricula', usuario_matricula)
      .is('data_devolucao', null)
      .single()

    if (fetchError || !emprestimo) {
      throw new Error('Empréstimo não encontrado')
    }

    // Verifica se já atingiu o limite de renovações (3)
    if (emprestimo.renovacoes >= 3) {
      throw new Error('Limite de renovações atingido (máximo 3)')
    }

    // Verifica se está atrasado
    if (
      emprestimo.atrasado ||
      new Date() > new Date(emprestimo.data_prevista)
    ) {
      throw new Error('Não é possível renovar um empréstimo atrasado')
    }

    // Calcula nova data (7 dias a partir de hoje)
    const novaData = new Date()
    novaData.setDate(novaData.getDate() + 7)

    // Atualiza o empréstimo
    const { error: updateError } = await supabase
      .from('emprestimos')
      .update({
        data_prevista: novaData.toISOString(),
        renovacoes: emprestimo.renovacoes + 1,
      })
      .eq('id', emprestimo_id)

    if (updateError) {
      throw new Error(`Erro ao renovar empréstimo: ${updateError.message}`)
    }

    return {
      success: true,
      nova_data: novaData,
    }
  }

  async devolver(
    emprestimo_id: string,
    usuario_matricula: string,
  ): Promise<{ success: boolean }> {
    // Busca o empréstimo
    const { data: emprestimo, error: fetchError } = await supabase
      .from('emprestimos')
      .select('*')
      .eq('id', emprestimo_id)
      .eq('usuario_matricula', usuario_matricula)
      .is('data_devolucao', null)
      .single()

    if (fetchError || !emprestimo) {
      throw new Error('Empréstimo não encontrado')
    }

    const agora = new Date()
    const dataPrevista = new Date(emprestimo.data_prevista)
    const atrasado = agora > dataPrevista

    let diasAtraso = 0
    if (atrasado) {
      diasAtraso = Math.ceil(
        (agora.getTime() - dataPrevista.getTime()) / (1000 * 60 * 60 * 24),
      )
    }

    // Atualiza o empréstimo
    const { error: updateError } = await supabase
      .from('emprestimos')
      .update({
        data_devolucao: agora.toISOString(),
        atrasado: atrasado,
        dias_atraso: diasAtraso,
      })
      .eq('id', emprestimo_id)

    if (updateError) {
      throw new Error(`Erro ao devolver livro: ${updateError.message}`)
    }

    // Se estava atrasado, aplica a multa
    if (atrasado && diasAtraso > 0) {
      const { error: multaError } = await supabase
        .from('usuarios')
        .update({
          dias_bloqueado: diasAtraso,
          data_fim_bloqueio: new Date(Date.now() + diasAtraso * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('matricula', usuario_matricula)

      if (multaError) {
        console.error('Erro ao aplicar multa:', multaError)
      }
    }

    return { success: true }
  }

  async verificarLimite(usuario_matricula: string): Promise<{
    pode_emprestar: boolean
    livros_atuais: number
    bloqueado: boolean
  }> {
    // Verifica quantos livros o usuário tem emprestados
    const { count: livrosEmprestados } = await supabase
      .from('emprestimos')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_matricula', usuario_matricula)
      .is('data_devolucao', null)

    // Verifica se o usuário está bloqueado
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('dias_bloqueado, data_fim_bloqueio')
      .eq('matricula', usuario_matricula)
      .single()

    const bloqueado =
      usuario &&
      usuario.dias_bloqueado > 0 &&
      usuario.data_fim_bloqueio &&
      new Date(usuario.data_fim_bloqueio) > new Date()

    return {
      pode_emprestar: !bloqueado && (livrosEmprestados || 0) < 3,
      livros_atuais: livrosEmprestados || 0,
      bloqueado: !!bloqueado,
    }
  }
}
