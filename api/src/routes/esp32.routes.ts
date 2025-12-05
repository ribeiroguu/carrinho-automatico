import type { FastifyInstance } from 'fastify'
import { supabase } from '../config/supabase'

export async function esp32Routes(fastify: FastifyInstance) {
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    }
  })

  fastify.get('/sessao-ativa', async (request, reply) => {
    const { codigo } = request.query as { codigo?: string }

    if (!codigo) {
      return reply.status(400).send({ error: 'Código é obrigatório' })
    }

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('carrinho_sessao')
      .select(
        `
        sessao_id,
        usuario_matricula,
        usuarios!inner (
          nome,
          matricula
        )
      `,
      )
      .eq('finalizado', false)
      .gte('created_at', thirtyMinutesAgo)
      .limit(10)

    if (error) {
      return reply.status(500).send({ error: error.message })
    }

    if (!data || data.length === 0) {
      return reply.status(404).send({ error: 'Nenhuma sessão ativa encontrada' })
    }

    const sessao = data[0]

    return reply.send({
      sessao_id: sessao.sessao_id,
      usuario: sessao.usuarios?.nome,
      matricula: sessao.usuarios?.matricula,
    })
  })
}
