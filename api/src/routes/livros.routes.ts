import type { FastifyInstance } from 'fastify'
import { LivrosService } from '../services/livros.service'
import { authMiddleware } from '../middlewares/auth'
import type { AuthRequest } from '../types/api.types'
import { AuthService } from '../services/auth.service'

export async function livrosRoutes(fastify: FastifyInstance) {
  const livrosService = new LivrosService()
  const authService = new AuthService()

  // Listar livros (com busca e filtros)
  fastify.get('/', async (request, reply) => {
    try {
      const { search, categoria, page, limit } = request.query as {
        search?: string
        categoria?: string
        page?: string
        limit?: string
      }

      const result = await livrosService.getAll({
        search,
        categoria,
        page: page ? Number.parseInt(page) : undefined,
        limit: limit ? Number.parseInt(limit) : undefined,
      })

      return reply.send(result)
    } catch (error: any) {
      return reply.status(500).send({
        error: error.message,
      })
    }
  })

  // Buscar livro por ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const livro = await livrosService.getById(id)

      if (!livro) {
        return reply.status(404).send({
          error: 'Livro não encontrado',
        })
      }

      return reply.send({ livro })
    } catch (error: any) {
      return reply.status(500).send({
        error: error.message,
      })
    }
  })

  // Buscar livros recomendados (protected)
  fastify.get(
    '/recomendados',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const { id } = (request as AuthRequest).user

        const usuario = await authService.getUserById(id)

        if (!usuario) {
          return reply.status(404).send({
            error: 'Usuário não encontrado',
          })
        }

        const livros = await livrosService.getRecomendados(
          usuario.curso || undefined,
        )

        return reply.send({ livros })
      } catch (error: any) {
        return reply.status(500).send({
          error: error.message,
        })
      }
    },
  )
}
