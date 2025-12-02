import { supabase } from '../config/supabase'
import type { Livro } from '../types/database.types'

export class LivrosService {
  async getAll(filters?: {
    search?: string
    categoria?: string
    page?: number
    limit?: number
  }): Promise<{ livros: Livro[]; total: number; page: number; pages: number }> {
    const page = filters?.page || 1
    const limit = filters?.limit || 10
    const offset = (page - 1) * limit

    let query = supabase.from('livros').select('*', { count: 'exact' })

    // Filtro de busca (título ou autor)
    if (filters?.search) {
      query = query.or(
        `titulo.ilike.%${filters.search}%,autor.ilike.%${filters.search}%`,
      )
    }

    // Filtro de categoria
    if (filters?.categoria) {
      query = query.eq('categoria', filters.categoria)
    }

    // Paginação
    query = query.range(offset, offset + limit - 1).order('titulo', {
      ascending: true,
    })

    const { data: livros, error, count } = await query

    if (error) {
      throw new Error(`Erro ao buscar livros: ${error.message}`)
    }

    const total = count || 0
    const pages = Math.ceil(total / limit)

    return {
      livros: livros || [],
      total,
      page,
      pages,
    }
  }

  async getById(id: string): Promise<Livro | null> {
    const { data: livro, error } = await supabase
      .from('livros')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !livro) {
      return null
    }

    return livro
  }

  async getRecomendados(curso?: string): Promise<Livro[]> {
    // Lógica simples: se o curso for de informática, retorna livros de programação
    // Senão, retorna livros mais populares/recentes
    let query = supabase.from('livros').select('*').eq('status', 'disponivel')

    if (curso?.toLowerCase().includes('informática')) {
      query = query.eq('categoria', 'Informática')
    }

    const { data: livros, error } = await query.limit(10)

    if (error) {
      throw new Error(`Erro ao buscar recomendados: ${error.message}`)
    }

    return livros || []
  }

  async getByRfidTag(rfid_tag: string): Promise<Livro | null> {
    const { data: livro, error } = await supabase
      .from('livros')
      .select('*')
      .eq('rfid_tag', rfid_tag)
      .single()

    if (error || !livro) {
      return null
    }

    return livro
  }
}
