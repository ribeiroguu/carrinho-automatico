import mqtt, { type MqttClient } from 'mqtt'
import { mqttConfig, mqttTopics } from '../config/mqtt.config'
import { CarrinhoService } from './carrinho.service'

interface LivroInfoPayload {
  status: 'success'
  titulo: string
  rfid_tag: string
  added: boolean
}

interface ErroPayload {
  error: string
  rfid_tag?: string
}

interface ControlePayload {
  action: string
  timestamp: number
}

export class MqttService {
  private client: MqttClient | null = null
  private readonly carrinhoService = new CarrinhoService()
  private connected = false

  constructor() {
    this.connect()
  }

  private connect(): void {
    const { host, port, username, password, clientId, clean, reconnectPeriod, keepalive } = mqttConfig

    this.client = mqtt.connect({
      host,
      port,
      username,
      password,
      clientId,
      clean,
      reconnectPeriod,
      keepalive,
    })

    this.client.on('connect', () => {
      this.connected = true
      this.subscribe()
    })

    this.client.on('error', (error) => {
      this.connected = false
      console.error('MQTT error:', error)
    })

    this.client.on('close', () => {
      this.connected = false
    })

    this.client.on('reconnect', () => {
      console.warn('MQTT reconnecting...')
    })

    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message)
    })
  }

  private subscribe(): void {
    if (!this.client) return

    const topicPattern = 'biblioteca/carrinho/+/rfid'

    this.client.subscribe(topicPattern, { qos: 1 }, (error) => {
      if (error) {
        console.error('Erro ao subscrever no MQTT:', error)
      }
    })
  }

  private async handleMessage(topic: string, message: Buffer): Promise<void> {
    try {
      const parts = topic.split('/')
      const sessaoId = parts[2]

      const payload = JSON.parse(message.toString()) as { rfid_tag?: string }
      const { rfid_tag } = payload

      if (!sessaoId || !rfid_tag) {
        console.error('Mensagem MQTT inválida:', { topic, payload })
        return
      }

      const result = await this.carrinhoService.addLeituraRFID(sessaoId, rfid_tag)

      this.publishLivroInfo(sessaoId, {
        status: 'success',
        titulo: result.livro.titulo,
        rfid_tag: result.livro.rfid_tag,
        added: result.added,
      })
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

      const topicParts = topic.split('/')
      const sessaoId = topicParts[2]
      const payload = JSON.parse(message.toString()) as { rfid_tag?: string }

      if (sessaoId) {
        this.publishErro(sessaoId, {
          error: errorMessage,
          rfid_tag: payload?.rfid_tag,
        })
      }

      console.error('Erro ao processar mensagem MQTT:', error)
    }
  }

  private publishLivroInfo(sessaoId: string, data: LivroInfoPayload): void {
    if (!this.client || !this.connected) return

    const topic = mqttTopics.livroInfo(sessaoId)

    this.client.publish(topic, JSON.stringify(data), { qos: 1 }, (error) => {
      if (error) {
        console.error('Erro ao publicar info do livro:', error)
      }
    })
  }

  private publishErro(sessaoId: string, data: ErroPayload): void {
    if (!this.client || !this.connected) return

    const topic = mqttTopics.erro(sessaoId)

    this.client.publish(topic, JSON.stringify(data), { qos: 1 }, (error) => {
      if (error) {
        console.error('Erro ao publicar mensagem de erro:', error)
      }
    })
  }

  public publishControle(sessaoId: string, action: string): void {
    if (!this.client || !this.connected) return

    const topic = mqttTopics.controle(sessaoId)
    const payload: ControlePayload = {
      action,
      timestamp: Date.now(),
    }

    this.client.publish(topic, JSON.stringify(payload), { qos: 1 }, (error) => {
      if (error) {
        console.error('Erro ao publicar controle MQTT:', error)
      }
    })
  }

  public isConnected(): boolean {
    return this.connected
  }

  public disconnect(): void {
    if (this.client) {
      this.client.end()
      this.connected = false
    }
  }
}
