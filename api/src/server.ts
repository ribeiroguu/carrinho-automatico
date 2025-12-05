import { fastify } from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { JWT_SECRET } from './utils/jwt'
import { authRoutes } from './routes/auth.routes'
import { livrosRoutes } from './routes/livros.routes'
import { favoritosRoutes } from './routes/favoritos.routes'
import { emprestimosRoutes } from './routes/emprestimos.routes'
import { carrinhoRoutes } from './routes/carrinho.routes'
import { usuarioRoutes } from './routes/usuario.routes'
import { MqttService } from './services/mqtt.service'
import { esp32Routes } from './routes/esp32.routes'

const app = fastify({
  logger: true,
})

// Registra plugins
app.register(cors, {
  origin: true, // Em produção, configure origins específicas
})

app.register(jwt, {
  secret: JWT_SECRET,
})

// Rota de saúde
app.get('/', async (request, reply) => {
  return {
    name: 'Carrinho Automático API',
    version: '1.0.0',
    status: 'online',
  }
})

app.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Registra rotas
app.register(authRoutes, { prefix: '/auth' })
app.register(livrosRoutes, { prefix: '/livros' })
app.register(favoritosRoutes, { prefix: '/favoritos' })
app.register(emprestimosRoutes, { prefix: '/emprestimos' })
app.register(carrinhoRoutes, { prefix: '/carrinho' })
app.register(usuarioRoutes, { prefix: '/usuario' })
app.register(esp32Routes, { prefix: '/esp32' })

const mqttService = new MqttService()

// Handler de erros global
app.setErrorHandler((error, request, reply) => {
  app.log.error(error)

  return reply.status(500).send({
    error: 'Erro interno do servidor',
    message: error instanceof Error ? error.message : 'Unknown error',
  })
})

// Inicia o servidor
const start = async () => {
  try {
    const port = Number.parseInt(process.env.PORT || '3333')
    const host = process.env.HOST || '0.0.0.0'

    await app.listen({ port, host })

    console.log(`
🚀 Servidor rodando em http://${host}:${port}

📚 API Endpoints:
   - POST   /auth/register
   - POST   /auth/login
   - GET    /auth/me
   - POST   /auth/logout

   - GET    /livros
   - GET    /livros/:id
   - GET    /livros/recomendados

   - GET    /favoritos
   - POST   /favoritos/:livroId
   - DELETE /favoritos/:livroId

   - GET    /emprestimos/ativos
   - GET    /emprestimos/historico
   - POST   /emprestimos/:id/renovar
   - POST   /emprestimos/:id/devolver
   - GET    /emprestimos/verificar-limite

   - POST   /carrinho/iniciar-sessao
   - POST   /carrinho/rfid-leitura
   - GET    /carrinho/sessao/:sessaoId
   - DELETE /carrinho/remover/:livroId
   - POST   /carrinho/finalizar

   - GET    /usuario/perfil
   - PUT    /usuario/perfil
   - PUT    /usuario/push-token
   - GET    /usuario/status-multa

🔒 Rotas protegidas requerem: Authorization: Bearer <token>
    `)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()

const shutdown = () => {
  mqttService.disconnect()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
