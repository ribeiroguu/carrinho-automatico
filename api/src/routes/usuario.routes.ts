import type { FastifyInstance } from 'fastify'
import { UsuarioService } from '../services/usuario.service'
import { authMiddleware } from '../middlewares/auth'
import type { AuthRequest, UpdateProfileBody } from '../types/api.types'
import { validateBody } from '../middlewares/validate'
import { pushTokenSchema, updateProfileSchema } from '../utils/validation'

export async function usuarioRoutes(fastify: FastifyInstance) {
  const usuarioService = new UsuarioService()

  // Buscar perfil
  fastify.get(
    '/perfil',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const { id } = (request as AuthRequest).user

        const usuario = await usuarioService.getPerfil(id)

        if (!usuario) {
          return reply.status(404).send({
            error: 'Usuário não encontrado',
          })
        }

        // Remove a senha do retorno
        const { senha_hash, ...usuarioSemSenha } = usuario

        return reply.send({ usuario: usuarioSemSenha })
      } catch (error: any) {
        return reply.status(500).send({
          error: error.message,
        })
      }
    },
  )

  // Atualizar perfil
  fastify.put(
    '/perfil',
    {
      preHandler: [authMiddleware, validateBody(updateProfileSchema)],
    },
    async (request, reply) => {
      try {
        const { id } = (request as AuthRequest).user
        const updates = request.body as UpdateProfileBody

        const usuario = await usuarioService.updatePerfil(id, updates)

        // Remove a senha do retorno
        const { senha_hash, ...usuarioSemSenha } = usuario

        return reply.send({
          usuario: usuarioSemSenha,
          message: 'Perfil atualizado com sucesso',
        })
      } catch (error: any) {
        return reply.status(400).send({
          error: error.message,
        })
      }
    },
  )

  // Atualizar push token
  fastify.put(
    '/push-token',
    {
      preHandler: [authMiddleware, validateBody(pushTokenSchema)],
    },
    async (request, reply) => {
      try {
        const { id } = (request as AuthRequest).user
        const { push_token } = request.body as { push_token: string }

        await usuarioService.updatePushToken(id, push_token)

        return reply.send({
          message: 'Push token atualizado com sucesso',
        })
      } catch (error: any) {
        return reply.status(400).send({
          error: error.message,
        })
      }
    },
  )

  // Verificar status de multa
  fastify.get(
    '/status-multa',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const { id } = (request as AuthRequest).user

        const status = await usuarioService.getStatusMulta(id)

        return reply.send(status)
      } catch (error: any) {
        return reply.status(500).send({
          error: error.message,
        })
      }
    },
  )
}
