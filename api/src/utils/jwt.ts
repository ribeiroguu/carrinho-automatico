import type { FastifyInstance } from 'fastify'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

export function generateToken(
  fastify: FastifyInstance,
  payload: { id: string; matricula: string; email: string },
): string {
  return fastify.jwt.sign(payload, { expiresIn: '7d' })
}

export async function verifyToken(
  fastify: FastifyInstance,
  token: string,
): Promise<{ id: string; matricula: string; email: string }> {
  return fastify.jwt.verify(token)
}

export { JWT_SECRET }
