import { supabase } from '../config/supabase'
import type { FavoritoComLivro } from '../types/database.types'

export class FavoritosService {
  async getFavoritos(usuario_matricula: string): Promise<FavoritoComLivro[]> {
    const { data, error } = await supabase
      .from('favoritos')
      .select(
        `
				*,
				livro:livros (*)
			`,
      )
      .eq('usuario_matricula', usuario_matricula)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar favoritos: ${error.message}`)
    }

    return data || []
  }

  async addFavorito(
    usuario_matricula: string,
    livro_rfid: string,
  ): Promise<{ success: boolean }> {
    // Verifica se o livro existe
    const { data: livro, error: livroError } = await supabase
      .from('livros')
      .select('rfid_tag')
      .eq('rfid_tag', livro_rfid)
      .single()

    if (livroError || !livro) {
      throw new Error('Livro não encontrado')
    }

    // Verifica se já está nos favoritos
    const { data: existing } = await supabase
      .from('favoritos')
      .select('id')
      .eq('usuario_matricula', usuario_matricula)
      .eq('livro_rfid', livro_rfid)
      .single()

    if (existing) {
      throw new Error('Livro já está nos favoritos')
    }

    // Adiciona aos favoritos
    const { error } = await supabase.from('favoritos').insert({
      usuario_matricula,
      livro_rfid,
    })

    if (error) {
      throw new Error(`Erro ao adicionar favorito: ${error.message}`)
    }

    return { success: true }
  }

  async removeFavorito(
    usuario_matricula: string,
    livro_rfid: string,
  ): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from('favoritos')
      .delete()
      .eq('usuario_matricula', usuario_matricula)
      .eq('livro_rfid', livro_rfid)

    if (error) {
      throw new Error(`Erro ao remover favorito: ${error.message}`)
    }

    return { success: true }
  }

  async isFavorito(usuario_matricula: string, livro_rfid: string): Promise<boolean> {
    const { data } = await supabase
      .from('favoritos')
      .select('id')
      .eq('usuario_matricula', usuario_matricula)
      .eq('livro_rfid', livro_rfid)
      .single()

    return !!data
  }
}
