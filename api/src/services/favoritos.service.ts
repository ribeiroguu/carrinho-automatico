import { supabase } from '../config/supabase'
import type { FavoritoComLivro } from '../types/database.types'

export class FavoritosService {
  async getFavoritos(usuario_id: string): Promise<FavoritoComLivro[]> {
    const { data, error } = await supabase
      .from('favoritos')
      .select(
        `
				*,
				livro:livros (*)
			`,
      )
      .eq('usuario_id', usuario_id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar favoritos: ${error.message}`)
    }

    return data || []
  }

  async addFavorito(
    usuario_id: string,
    livro_id: string,
  ): Promise<{ success: boolean }> {
    // Verifica se o livro existe
    const { data: livro, error: livroError } = await supabase
      .from('livros')
      .select('id')
      .eq('id', livro_id)
      .single()

    if (livroError || !livro) {
      throw new Error('Livro não encontrado')
    }

    // Verifica se já está nos favoritos
    const { data: existing } = await supabase
      .from('favoritos')
      .select('id')
      .eq('usuario_id', usuario_id)
      .eq('livro_id', livro_id)
      .single()

    if (existing) {
      throw new Error('Livro já está nos favoritos')
    }

    // Adiciona aos favoritos
    const { error } = await supabase.from('favoritos').insert({
      usuario_id,
      livro_id,
    })

    if (error) {
      throw new Error(`Erro ao adicionar favorito: ${error.message}`)
    }

    return { success: true }
  }

  async removeFavorito(
    usuario_id: string,
    livro_id: string,
  ): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from('favoritos')
      .delete()
      .eq('usuario_id', usuario_id)
      .eq('livro_id', livro_id)

    if (error) {
      throw new Error(`Erro ao remover favorito: ${error.message}`)
    }

    return { success: true }
  }

  async isFavorito(usuario_id: string, livro_id: string): Promise<boolean> {
    const { data } = await supabase
      .from('favoritos')
      .select('id')
      .eq('usuario_id', usuario_id)
      .eq('livro_id', livro_id)
      .single()

    return !!data
  }
}
