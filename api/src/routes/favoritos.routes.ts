import type { FastifyInstance } from 'fastify'
import { FavoritosService } from '../services/favoritos.service'
import { authMiddleware } from '../middlewares/auth'
import type { AuthRequest } from '../types/api.types'

export async function favoritosRoutes(fastify: FastifyInstance) {
  const favoritosService = new FavoritosService()

  // Listar favoritos do usuário
  fastify.get(
    '/',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const { matricula } = (request as AuthRequest).user

        const favoritos = await favoritosService.getFavoritos(matricula)

        return reply.send({ favoritos })
      } catch (error: any) {
        return reply.status(500).send({
          error: error.message,
        })
      }
    },
  )

  // Adicionar livro aos favoritos
  fastify.post(
    '/:livroId',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const { matricula } = (request as AuthRequest).user
        const { livroId } = request.params as { livroId: string }

        await favoritosService.addFavorito(matricula, livroId)

        return reply.send({
          message: 'Livro adicionado aos favoritos',
        })
      } catch (error: any) {
        return reply.status(400).send({
          error: error.message,
        })
      }
    },
  )

  // Remover livro dos favoritos
  fastify.delete(
    '/:livroId',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const { matricula } = (request as AuthRequest).user
        const { livroId } = request.params as { livroId: string }

        await favoritosService.removeFavorito(matricula, livroId)

        return reply.send({
          message: 'Livro removido dos favoritos',
        })
      } catch (error: any) {
        return reply.status(400).send({
          error: error.message,
        })
      }
    },
  )

  // Verificar se livro está nos favoritos
  fastify.get(
    '/:livroId/check',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const { matricula } = (request as AuthRequest).user
        const { livroId } = request.params as { livroId: string }

        const isFavorito = await favoritosService.isFavorito(matricula, livroId)

        return reply.send({ isFavorito })
      } catch (error: any) {
        return reply.status(500).send({
          error: error.message,
        })
      }
    },
  )
}
