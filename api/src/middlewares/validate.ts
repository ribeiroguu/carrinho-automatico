import type { FastifyReply, FastifyRequest } from 'fastify'
import type { ZodSchema } from 'zod'

export function validateBody(schema: ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = schema.parse(request.body)
      request.body = validated
    } catch (error: any) {
      return reply.status(400).send({
        error: 'Dados inválidos',
        details: error.errors,
      })
    }
  }
}

export function validateQuery(schema: ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = schema.parse(request.query)
      request.query = validated
    } catch (error: any) {
      return reply.status(400).send({
        error: 'Parâmetros inválidos',
        details: error.errors,
      })
    }
  }
}
