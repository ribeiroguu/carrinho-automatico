import type { FastifyReply, FastifyRequest } from 'fastify'
import type { AuthRequest } from '../types/api.types'

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: 'Token não fornecido',
      })
    }

    const token = authHeader.substring(7)
    const decoded = await request.server.jwt.verify<{
      id: string
      matricula: string
      email: string
    }>(token)

    // Adiciona os dados do usuário ao request
    ;(request as AuthRequest).user = decoded
  } catch (error) {
    return reply.status(401).send({
      error: 'Token inválido ou expirado',
    })
  }
}
