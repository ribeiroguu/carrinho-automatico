import type { FastifyInstance } from 'fastify'
import { CarrinhoService } from '../services/carrinho.service'
import { validateBody } from '../middlewares/validate'
import { authMiddleware } from '../middlewares/auth'
import { validateBody } from '../middlewares/validate'
import {
  finalizarCarrinhoSchema,
  rfidLeituraSchema,
  associarRfidSchema,
} from '../utils/validation'
import type {
  AuthRequest,
  FinalizarCarrinhoBody,
  RFIDLeituraBody,
  AssociarRfidBody,
} from '../types/api.types'

export async function carrinhoRoutes(fastify: FastifyInstance) {
  const carrinhoService = new CarrinhoService()

  // Associar RFID a um carrinho
  fastify.post(
    '/rfid',
    {
      preHandler: validateBody(associarRfidSchema),
    },
    async (request, reply) => {
      try {
        const { rfid } = request.body as AssociarRfidBody
        const carrinho = await carrinhoService.associarCarrinhoRfid(rfid)
        return reply.send(carrinho)
      } catch (error: any) {
        return reply.status(400).send({
          error: error.message,
        })
      }
    },
  )

  // Iniciar sessão do carrinho
  fastify.post(
    '/iniciar-sessao',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const { matricula } = (request as AuthRequest).user

        const result = await carrinhoService.iniciarSessao(matricula)

        return reply.send(result)
      } catch (error: any) {
        return reply.status(500).send({
          error: error.message,
        })
      }
    },
  )

  // Receber leitura RFID (chamado pelo ESP32)
  fastify.post(
    '/rfid-leitura',
    {
      preHandler: validateBody(rfidLeituraSchema),
    },
    async (request, reply) => {
      try {
        const { sessao_id, rfid_tag } = request.body as RFIDLeituraBody

        const result = await carrinhoService.addLeituraRFID(sessao_id, rfid_tag)

        return reply.send({
          livro: result.livro,
          added: result.added,
          message: result.added
            ? 'Livro adicionado ao carrinho'
            : 'Livro já estava no carrinho',
        })
      } catch (error: any) {
        return reply.status(400).send({
          error: error.message,
        })
      }
    },
  )

  // Buscar livros do carrinho
  fastify.get(
    '/sessao/:sessaoId',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const { sessaoId } = request.params as { sessaoId: string }

        const livros = await carrinhoService.getLivrosCarrinho(sessaoId)

        return reply.send({ livros })
      } catch (error: any) {
        return reply.status(500).send({
          error: error.message,
        })
      }
    },
  )

  // Remover livro do carrinho
  fastify.delete(
    '/remover/:livroId',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const { livroId } = request.params as { livroId: string }
        const { sessao_id } = request.body as { sessao_id: string }

        if (!sessao_id) {
          return reply.status(400).send({
            error: 'sessao_id é obrigatório',
          })
        }

        await carrinhoService.removerLivro(sessao_id, livroId)

        return reply.send({
          message: 'Livro removido do carrinho',
        })
      } catch (error: any) {
        return reply.status(400).send({
          error: error.message,
        })
      }
    },
  )

  // Finalizar empréstimo (converter carrinho em empréstimos)
  fastify.post(
    '/finalizar',
    {
      preHandler: [authMiddleware, validateBody(finalizarCarrinhoSchema)],
    },
    async (request, reply) => {
      try {
        const { sessao_id } = request.body as FinalizarCarrinhoBody

        await carrinhoService.finalizarEmprestimo(sessao_id)

        return reply.send({
          message: 'Empréstimo finalizado com sucesso',
        })
      } catch (error: any) {
        return reply.status(400).send({
          error: error.message,
        })
      }
    },
  )
}
