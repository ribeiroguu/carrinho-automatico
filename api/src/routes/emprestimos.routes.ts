import type { FastifyInstance } from 'fastify'
import { EmprestimosService } from '../services/emprestimos.service'
import { authMiddleware } from '../middlewares/auth'
import type { AuthRequest } from '../types/api.types'

export async function emprestimosRoutes(fastify: FastifyInstance) {
  const emprestimosService = new EmprestimosService()

  // Listar empréstimos ativos
  fastify.get(
    '/ativos',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const { id } = (request as AuthRequest).user

        const emprestimos = await emprestimosService.getAtivos(id)

        return reply.send({ emprestimos })
      } catch (error: any) {
        return reply.status(500).send({
          error: error.message,
        })
      }
    },
  )

  // Listar histórico de empréstimos
  fastify.get(
    '/historico',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const { id } = (request as AuthRequest).user
        const { page, limit } = request.query as {
          page?: string
          limit?: string
        }

        const result = await emprestimosService.getHistorico(
          id,
          page ? Number.parseInt(page) : 1,
          limit ? Number.parseInt(limit) : 10,
        )

        return reply.send(result)
      } catch (error: any) {
        return reply.status(500).send({
          error: error.message,
        })
      }
    },
  )

  // Renovar empréstimo
  fastify.post(
    '/:id/renovar',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const { id: usuario_id } = (request as AuthRequest).user
        const { id: emprestimo_id } = request.params as { id: string }

        const result = await emprestimosService.renovar(
          emprestimo_id,
          usuario_id,
        )

        return reply.send({
          message: 'Empréstimo renovado com sucesso',
          nova_data_prevista: result.nova_data,
        })
      } catch (error: any) {
        return reply.status(400).send({
          error: error.message,
        })
      }
    },
  )

  // Devolver livro
  fastify.post(
    '/:id/devolver',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const { id: usuario_id } = (request as AuthRequest).user
        const { id: emprestimo_id } = request.params as { id: string }

        await emprestimosService.devolver(emprestimo_id, usuario_id)

        return reply.send({
          message: 'Livro devolvido com sucesso',
        })
      } catch (error: any) {
        return reply.status(400).send({
          error: error.message,
        })
      }
    },
  )

  // Verificar limite de empréstimos
  fastify.get(
    '/verificar-limite',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const { id } = (request as AuthRequest).user

        const result = await emprestimosService.verificarLimite(id)

        return reply.send(result)
      } catch (error: any) {
        return reply.status(500).send({
          error: error.message,
        })
      }
    },
  )
}
