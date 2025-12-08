import { supabase } from '../config/supabase'
import type { Livro } from '../types/database.types'
import { LivrosService } from './livros.service'
import { EmprestimosService } from './emprestimos.service'

export class CarrinhoService {
  private livrosService = new LivrosService()
  private emprestimosService = new EmprestimosService()

  // Armazena a sessão ativa em memória (simples para 1 carrinho)
  private sessaoAtiva: { 
    sessao_id: string
    codigo: string
    timestamp: number 
  } | null = null

  // Gera código aleatório de 6 dígitos
  private gerarCodigo(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  async iniciarSessao(usuario_matricula: string): Promise<{
    sessao_id: string
    codigo: string
  }> {
    const codigo = this.gerarCodigo()
    const sessao_id = `${usuario_matricula}_${Date.now()}`

    // Armazena a sessão como ativa
    this.sessaoAtiva = {
      sessao_id,
      codigo,
      timestamp: Date.now()
    }

    return {
      sessao_id,
      codigo,
    }
  }

  async getSessaoAtiva(): Promise<{ sessao_id: string; codigo: string } | null> {
    // Verifica se há sessão ativa e se não expirou (1 hora)
    if (this.sessaoAtiva) {
      const umHoraEmMs = 60 * 60 * 1000
      const agora = Date.now()
      
      if (agora - this.sessaoAtiva.timestamp < umHoraEmMs) {
        return {
          sessao_id: this.sessaoAtiva.sessao_id,
          codigo: this.sessaoAtiva.codigo
        }
      } else {
        // Sessão expirou
        this.sessaoAtiva = null
      }
    }
    
    return null
  }

  async addLeituraRFID(
    sessao_id: string,
    rfid_tag: string,
  ): Promise<{ livro: Livro; added: boolean }> {
    // Busca o livro pela tag RFID
    const livro = await this.livrosService.getByRfidTag(rfid_tag)

    if (!livro) {
      throw new Error('Livro não encontrado. Tag RFID inválida.')
    }

    // Verifica se o livro está disponível
    if (livro.status !== 'disponivel') {
      throw new Error(`Livro não está disponível. Status: ${livro.status}`)
    }

    // Extrai o usuario_matricula do sessao_id
    const usuario_matricula = sessao_id.split('_')[0]

    // Verifica se o usuário pode emprestar mais livros
    const limite = await this.emprestimosService.verificarLimite(usuario_matricula)

    if (limite.bloqueado) {
      throw new Error('Você está bloqueado e não pode pegar livros emprestados')
    }

    // Conta quantos livros já estão no carrinho
    const { count: livrosNoCarrinho } = await supabase
      .from('carrinho_sessao')
      .select('*', { count: 'exact', head: true })
      .eq('sessao_id', sessao_id)
      .eq('finalizado', false)

    const totalLivros = limite.livros_atuais + (livrosNoCarrinho || 0)

    if (totalLivros >= 3) {
      throw new Error('Limite de 3 livros atingido')
    }

    // Verifica se o livro já está no carrinho
    const { data: existing } = await supabase
      .from('carrinho_sessao')
      .select('id')
      .eq('sessao_id', sessao_id)
      .eq('livro_rfid', livro.rfid_tag)
      .eq('finalizado', false)
      .single()

    if (existing) {
      return {
        livro,
        added: false, // Já estava no carrinho
      }
    }

    // Adiciona ao carrinho
    const { error } = await supabase.from('carrinho_sessao').insert({
      usuario_matricula,
      livro_rfid: livro.rfid_tag,
      sessao_id,
      finalizado: false,
    })

    if (error) {
      throw new Error(`Erro ao adicionar ao carrinho: ${error.message}`)
    }

    return {
      livro,
      added: true,
    }
  }

  async getLivrosCarrinho(sessao_id: string): Promise<Livro[]> {
    const { data, error } = await supabase
      .from('carrinho_sessao')
      .select(
        `
				*,
				livro:livros (*)
			`,
      )
      .eq('sessao_id', sessao_id)
      .eq('finalizado', false)
      .order('data_leitura', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar livros do carrinho: ${error.message}`)
    }

    return (data || []).map((item: any) => item.livro)
  }

  async removerLivro(
    sessao_id: string,
    livro_rfid: string,
  ): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from('carrinho_sessao')
      .delete()
      .eq('sessao_id', sessao_id)
      .eq('livro_rfid', livro_rfid)
      .eq('finalizado', false)

    if (error) {
      throw new Error(`Erro ao remover livro: ${error.message}`)
    }

    return { success: true }
  }

  async finalizarEmprestimo(sessao_id: string): Promise<{ success: boolean }> {
    // Busca todos os livros do carrinho
    const { data: itens, error: fetchError } = await supabase
      .from('carrinho_sessao')
      .select('*')
      .eq('sessao_id', sessao_id)
      .eq('finalizado', false)

    if (fetchError || !itens || itens.length === 0) {
      throw new Error('Carrinho vazio ou não encontrado')
    }

    const usuario_matricula = itens[0].usuario_matricula

    // Verifica novamente o limite
    const limite = await this.emprestimosService.verificarLimite(usuario_matricula)

    if (limite.bloqueado) {
      throw new Error('Você está bloqueado e não pode pegar livros emprestados')
    }

    if (limite.livros_atuais + itens.length > 3) {
      throw new Error('Limite de 3 livros atingido')
    }

    // Cria os empréstimos
    const dataPrevista = new Date()
    dataPrevista.setDate(dataPrevista.getDate() + 7) // 7 dias

    const emprestimos = itens.map((item) => ({
      usuario_matricula: item.usuario_matricula,
      livro_rfid: item.livro_rfid,
      data_prevista: dataPrevista.toISOString(),
      renovacoes: 0,
    }))

    const { error: insertError } = await supabase
      .from('emprestimos')
      .insert(emprestimos)

    if (insertError) {
      throw new Error(`Erro ao criar empréstimos: ${insertError.message}`)
    }

    // Marca os itens do carrinho como finalizados
    const { error: updateError } = await supabase
      .from('carrinho_sessao')
      .update({ finalizado: true })
      .eq('sessao_id', sessao_id)

    if (updateError) {
      throw new Error(`Erro ao finalizar carrinho: ${updateError.message}`)
    }

    // Limpa a sessão ativa se for a que está sendo finalizada
    if (this.sessaoAtiva?.sessao_id === sessao_id) {
      this.sessaoAtiva = null
    }

    return { success: true }
  }
}
