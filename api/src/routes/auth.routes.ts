import type { FastifyInstance } from 'fastify'
import { AuthService } from '../services/auth.service'
import type { LoginBody, RegisterBody, AuthRequest } from '../types/api.types'
import { generateToken } from '../utils/jwt'
import { loginSchema, registerSchema } from '../utils/validation'
import { validateBody } from '../middlewares/validate'
import { authMiddleware } from '../middlewares/auth'

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService()

  // Registro
  fastify.post(
    '/register',
    {
      preHandler: validateBody(registerSchema),
    },
    async (request, reply) => {
      try {
        const body = request.body as RegisterBody

        const usuario = await authService.register(body)

        const token = generateToken(fastify, {
          matricula: usuario.matricula,
          email: usuario.email,
        })

        return reply.status(201).send({
          user: {
            matricula: usuario.matricula,
            nome: usuario.nome,
            email: usuario.email,
            curso: usuario.curso,
          },
          token,
        })
      } catch (error: any) {
        return reply.status(400).send({
          error: error.message,
        })
      }
    },
  )

  // Login
  fastify.post(
    '/login',
    {
      preHandler: validateBody(loginSchema),
    },
    async (request, reply) => {
      try {
        const { identificador, senha } = request.body as LoginBody

        const usuario = await authService.login(identificador, senha)

        if (!usuario) {
          return reply.status(401).send({
            error: 'Credenciais inválidas',
          })
        }

        const token = generateToken(fastify, {
          matricula: usuario.matricula,
          email: usuario.email,
        })

        return reply.send({
          user: {
            matricula: usuario.matricula,
            nome: usuario.nome,
            email: usuario.email,
            curso: usuario.curso,
            dias_bloqueado: usuario.dias_bloqueado,
            data_fim_bloqueio: usuario.data_fim_bloqueio,
          },
          token,
        })
      } catch (error: any) {
        return reply.status(500).send({
          error: error.message,
        })
      }
    },
  )

  // Get user info (protected)
  fastify.get(
    '/me',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const { matricula } = (request as AuthRequest).user

        const usuario = await authService.getUserByMatricula(matricula)

        if (!usuario) {
          return reply.status(404).send({
            error: 'Usuário não encontrado',
          })
        }

        return reply.send({
          user: {
            matricula: usuario.matricula,
            nome: usuario.nome,
            email: usuario.email,
            curso: usuario.curso,
            dias_bloqueado: usuario.dias_bloqueado,
            data_fim_bloqueio: usuario.data_fim_bloqueio,
          },
        })
      } catch (error: any) {
        return reply.status(500).send({
          error: error.message,
        })
      }
    },
  )

  // Logout (apenas retorna sucesso, o cliente remove o token)
  fastify.post(
    '/logout',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      return reply.send({
        message: 'Logout realizado com sucesso',
      })
    },
  )
}
