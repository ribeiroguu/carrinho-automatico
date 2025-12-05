export interface MqttConfig {
  host: string
  port: number
  username: string
  password: string
  clientId: string
  clean: boolean
  reconnectPeriod: number
  keepalive: number
}

export const mqttConfig: MqttConfig = {
  host: process.env.MQTT_HOST || 'localhost',
  port: Number.parseInt(process.env.MQTT_PORT || '1883', 10),
  username: process.env.MQTT_USER || 'biblioteca_server',
  password: process.env.MQTT_PASS || '',
  clientId: `biblioteca-api-${Math.random().toString(16).slice(2)}`,
  clean: true,
  reconnectPeriod: 5000,
  keepalive: 60,
}

export const mqttTopics = {
  rfidDetected: (sessaoId: string) => `biblioteca/carrinho/${sessaoId}/rfid`,
  livroInfo: (sessaoId: string) => `biblioteca/carrinho/${sessaoId}/livro`,
  erro: (sessaoId: string) => `biblioteca/carrinho/${sessaoId}/erro`,
  controle: (sessaoId: string) => `biblioteca/carrinho/${sessaoId}/controle`,
}
