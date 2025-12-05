# 📋 IMPLEMENTAÇÃO MQTT - CARRINHO AUTOMÁTICO RFID

## Documento de Planejamento e Implementação

**Versão:** 1.0  
**Data:** 05/12/2024  
**Autor:** OpenCode AI  
**Projeto:** Carrinho Automático com RFID - Biblioteca IFNMG

---

## 📑 ÍNDICE

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Tecnologias e Dependências](#3-tecnologias-e-dependências)
4. [Instalação do Broker MQTT (Mosquitto)](#4-instalação-do-broker-mqtt-mosquitto)
5. [Implementação Backend (Node.js)](#5-implementação-backend-nodejs)
6. [Implementação ESP32 (Arduino)](#6-implementação-esp32-arduino)
7. [Interface Web de Configuração WiFi](#7-interface-web-de-configuração-wifi)
8. [Protocolo de Comunicação MQTT](#8-protocolo-de-comunicação-mqtt)
9. [Fluxo Completo de Operação](#9-fluxo-completo-de-operação)
10. [Testes e Validação](#10-testes-e-validação)
11. [Segurança](#11-segurança)
12. [Troubleshooting](#12-troubleshooting)
13. [Checklist de Implementação](#13-checklist-de-implementação)

---

## 1. VISÃO GERAL

### 1.1. Objetivo

Implementar comunicação bidirecional via MQTT entre ESP32 (com leitor RFID e display OLED) e o servidor Node.js da API, permitindo:

- Detecção automática de livros via RFID
- Adição automática ao carrinho do usuário
- Feedback visual no display OLED
- Sincronização em tempo real com o aplicativo mobile
- Configuração de WiFi via interface web

### 1.2. Requisitos Principais

- ✅ Broker MQTT auto-hospedado (Mosquitto)
- ✅ Comunicação bidirecional (ESP32 ↔ Servidor)
- ✅ Display OLED exibe apenas: códigos RFID, erros e confirmações
- ✅ Configuração WiFi variável via interface web
- ✅ Remoção de livros manual (pelo app)
- ✅ Código simples e com boas práticas
- ✅ Prioridade: velocidade de implementação

### 1.3. Não-Requisitos (Fora do Escopo)

- ❌ Detecção automática de remoção de livros (via sensor)
- ❌ Informações completas do livro no OLED (tela pequena)
- ❌ TLS/SSL no MQTT (rede local confiável)
- ❌ Interface web complexa para o ESP32

---

## 2. ARQUITETURA DO SISTEMA

### 2.1. Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                     REDE LOCAL (WiFi)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐        ┌──────────────┐                  │
│  │   ESP32      │◄──────►│  Mosquitto   │                  │
│  │ RFID + OLED  │  MQTT  │   Broker     │                  │
│  └──────────────┘        └──────┬───────┘                  │
│        │                         │                          │
│        │ HTTP (Config)           │ MQTT                     │
│        │                         │                          │
│        ▼                         ▼                          │
│  ┌──────────────────────────────────────┐                  │
│  │      Servidor Node.js (Fastify)      │                  │
│  │  ┌────────────┐    ┌──────────────┐  │                  │
│  │  │ MQTT       │    │  Carrinho    │  │                  │
│  │  │ Service    │◄──►│  Service     │  │                  │
│  │  └────────────┘    └──────────────┘  │                  │
│  │         │                  │          │                  │
│  │         └──────────────────┘          │                  │
│  │                  │                    │                  │
│  └──────────────────┼────────────────────┘                  │
│                     │                                       │
│                     ▼                                       │
│            ┌─────────────────┐                              │
│            │    Supabase     │                              │
│            │  (PostgreSQL)   │                              │
│            └─────────────────┘                              │
│                     ▲                                       │
└─────────────────────┼───────────────────────────────────────┘
                      │
                      │ REST API
                      │
              ┌───────▼────────┐
              │   App Mobile   │
              │ (React Native) │
              └────────────────┘
```

### 2.2. Fluxo de Dados Simplificado

```
1. Usuário inicia sessão no App → Servidor gera sessao_id e código
2. ESP32 obtém sessão ativa via HTTP → Armazena sessao_id
3. ESP32 detecta RFID → Publica no MQTT
4. Servidor recebe MQTT → Processa e adiciona ao carrinho
5. Servidor publica resposta → ESP32 atualiza OLED
6. App faz polling → Recebe atualização e exibe na tela
```

---

## 3. TECNOLOGIAS E DEPENDÊNCIAS

### 3.1. Backend (Node.js)

#### Dependências Novas

```json
{
  "mqtt": "^5.11.2"
}
```

#### Instalação

```bash
cd api
pnpm add mqtt
```

### 3.2. ESP32 (Arduino)

#### Bibliotecas Necessárias

**Via Arduino Library Manager:**

1. **PubSubClient** (v2.8+) - Cliente MQTT
2. **ArduinoJson** (v7.x) - Manipulação JSON
3. **WiFi** - Built-in ESP32
4. **WebServer** - Built-in ESP32
5. **Preferences** - Built-in ESP32
6. **MFRC522** (v1.4.11) - Já instalado
7. **Adafruit_SSD1306** (v2.5.12) - Já instalado
8. **Adafruit_GFX** (v1.11.11) - Já instalado

#### Instalação via Arduino IDE

```
Sketch → Include Library → Manage Libraries
Buscar e instalar:
- PubSubClient por Nick O'Leary
- ArduinoJson por Benoit Blanchon
```

### 3.3. Broker MQTT (Mosquitto)

#### Sistema Operacional Suportado

- Linux (Ubuntu/Debian)
- Windows
- macOS

---

## 4. INSTALAÇÃO DO BROKER MQTT (MOSQUITTO)

### 4.1. Linux (Ubuntu/Debian)

```bash
# Atualizar repositórios
sudo apt update

# Instalar Mosquitto e cliente
sudo apt install -y mosquitto mosquitto-clients

# Verificar instalação
mosquitto -h
```

### 4.2. Configuração do Mosquitto

#### Passo 1: Criar arquivo de configuração

```bash
sudo nano /etc/mosquitto/conf.d/biblioteca.conf
```

#### Conteúdo do arquivo:

```conf
# Listener na porta padrão
listener 1883
protocol mqtt

# Desabilitar acesso anônimo
allow_anonymous false

# Arquivo de senhas
password_file /etc/mosquitto/passwd

# Logs
log_dest file /var/log/mosquitto/mosquitto.log
log_type all
connection_messages true
log_timestamp true
```

#### Passo 2: Criar usuários e senhas

```bash
# Criar usuário para o servidor Node.js
sudo mosquitto_passwd -c /etc/mosquitto/passwd biblioteca_server

# Será solicitada a senha. Sugestão: gerar senha forte
# Exemplo: BiblioMQTT#2024!Srv

# Criar usuário para o ESP32
sudo mosquitto_passwd /etc/mosquitto/passwd biblioteca_esp32

# Sugestão de senha: ESP32#Lib@2024!
```

#### Passo 3: Ajustar permissões

```bash
sudo chown mosquitto:mosquitto /etc/mosquitto/passwd
sudo chmod 600 /etc/mosquitto/passwd
```

#### Passo 4: Reiniciar Mosquitto

```bash
sudo systemctl restart mosquitto
sudo systemctl enable mosquitto
sudo systemctl status mosquitto
```

#### Passo 5: Testar o Broker

**Terminal 1 (Subscriber):**

```bash
mosquitto_sub -h localhost -t "test/topic" -u biblioteca_server -P "SUA_SENHA"
```

**Terminal 2 (Publisher):**

```bash
mosquitto_pub -h localhost -t "test/topic" -m "Hello MQTT" -u biblioteca_server -P "SUA_SENHA"
```

Se a mensagem "Hello MQTT" aparecer no Terminal 1, o broker está funcionando! ✅

---

## 5. IMPLEMENTAÇÃO BACKEND (NODE.JS)

### 5.1. Estrutura de Arquivos

```
api/
├── src/
│   ├── config/
│   │   ├── supabase.ts          (existente)
│   │   └── mqtt.config.ts       ✨ NOVO
│   ├── services/
│   │   ├── carrinho.service.ts  (existente - modificar)
│   │   └── mqtt.service.ts      ✨ NOVO
│   ├── routes/
│   │   ├── carrinho.routes.ts   (existente)
│   │   └── esp32.routes.ts      ✨ NOVO
│   └── server.ts                (modificar)
├── .env                         (modificar)
└── package.json                 (modificar)
```

### 5.2. Arquivo: `api/src/config/mqtt.config.ts`

```typescript
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
  port: Number.parseInt(process.env.MQTT_PORT || '1883'),
  username: process.env.MQTT_USER || 'biblioteca_server',
  password: process.env.MQTT_PASS || '',
  clientId: `biblioteca-api-${Math.random().toString(16).slice(3)}`,
  clean: true,
  reconnectPeriod: 5000,
  keepalive: 60,
}

export const mqttTopics = {
  // ESP32 publica aqui quando detecta RFID
  rfidDetected: (sessaoId: string) => `biblioteca/carrinho/${sessaoId}/rfid`,

  // Servidor publica aqui com info do livro
  livroInfo: (sessaoId: string) => `biblioteca/carrinho/${sessaoId}/livro`,

  // Servidor publica aqui com mensagens de erro
  erro: (sessaoId: string) => `biblioteca/carrinho/${sessaoId}/erro`,

  // Servidor publica aqui para controlar o ESP32
  controle: (sessaoId: string) => `biblioteca/carrinho/${sessaoId}/controle`,
}
```

### 5.3. Arquivo: `api/src/services/mqtt.service.ts`

```typescript
import mqtt, { MqttClient } from 'mqtt'
import { mqttConfig, mqttTopics } from '../config/mqtt.config'
import { CarrinhoService } from './carrinho.service'

export class MqttService {
  private client: MqttClient | null = null
  private carrinhoService = new CarrinhoService()
  private connected = false

  constructor() {
    this.connect()
  }

  private connect(): void {
    console.log('🔌 Conectando ao broker MQTT...')

    this.client = mqtt.connect({
      host: mqttConfig.host,
      port: mqttConfig.port,
      username: mqttConfig.username,
      password: mqttConfig.password,
      clientId: mqttConfig.clientId,
      clean: mqttConfig.clean,
      reconnectPeriod: mqttConfig.reconnectPeriod,
      keepalive: mqttConfig.keepalive,
    })

    this.client.on('connect', () => {
      console.log('✅ MQTT conectado com sucesso!')
      this.connected = true
      this.subscribe()
    })

    this.client.on('error', (error) => {
      console.error('❌ Erro MQTT:', error)
      this.connected = false
    })

    this.client.on('close', () => {
      console.log('🔌 Conexão MQTT fechada')
      this.connected = false
    })

    this.client.on('reconnect', () => {
      console.log('🔄 Reconectando ao MQTT...')
    })

    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message)
    })
  }

  private subscribe(): void {
    if (!this.client) return

    // Subscreve em todas as leituras RFID de todos os carrinhos
    const topicPattern = 'biblioteca/carrinho/+/rfid'

    this.client.subscribe(topicPattern, { qos: 1 }, (error) => {
      if (error) {
        console.error('❌ Erro ao subscrever:', error)
      } else {
        console.log(`📡 Subscrito em: ${topicPattern}`)
      }
    })
  }

  private async handleMessage(topic: string, message: Buffer): Promise<void> {
    try {
      // Extrai sessao_id do tópico
      // Formato: biblioteca/carrinho/2024001_1733405678/rfid
      const parts = topic.split('/')
      const sessaoId = parts[2]

      console.log(`📨 Mensagem recebida no tópico: ${topic}`)

      // Parse do payload JSON
      const payload = JSON.parse(message.toString())
      console.log('📦 Payload:', payload)

      const { rfid_tag } = payload

      if (!rfid_tag) {
        console.error('❌ Tag RFID não encontrada no payload')
        return
      }

      // Processa a leitura RFID
      console.log(`🏷️  Processando tag: ${rfid_tag} para sessão: ${sessaoId}`)

      try {
        const result = await this.carrinhoService.addLeituraRFID(sessaoId, rfid_tag)

        // Publica sucesso para o ESP32
        this.publishLivroInfo(sessaoId, {
          status: 'success',
          titulo: result.livro.titulo,
          rfid_tag: result.livro.rfid_tag,
          added: result.added,
        })

        console.log(`✅ Livro processado: ${result.livro.titulo}`)
      } catch (error: any) {
        // Publica erro para o ESP32
        this.publishErro(sessaoId, {
          error: error.message,
          rfid_tag: rfid_tag,
        })

        console.error(`❌ Erro ao processar livro: ${error.message}`)
      }
    } catch (error) {
      console.error('❌ Erro ao processar mensagem MQTT:', error)
    }
  }

  // Publica informações do livro para o ESP32
  private publishLivroInfo(sessaoId: string, data: any): void {
    if (!this.client || !this.connected) {
      console.error('❌ Cliente MQTT não conectado')
      return
    }

    const topic = mqttTopics.livroInfo(sessaoId)
    const payload = JSON.stringify(data)

    this.client.publish(topic, payload, { qos: 1 }, (error) => {
      if (error) {
        console.error('❌ Erro ao publicar info do livro:', error)
      } else {
        console.log(`📤 Info do livro publicada em: ${topic}`)
      }
    })
  }

  // Publica erro para o ESP32
  private publishErro(sessaoId: string, data: any): void {
    if (!this.client || !this.connected) {
      console.error('❌ Cliente MQTT não conectado')
      return
    }

    const topic = mqttTopics.erro(sessaoId)
    const payload = JSON.stringify(data)

    this.client.publish(topic, payload, { qos: 1 }, (error) => {
      if (error) {
        console.error('❌ Erro ao publicar erro:', error)
      } else {
        console.log(`📤 Erro publicado em: ${topic}`)
      }
    })
  }

  // Publica comando de controle (finalizar sessão, etc)
  public publishControle(sessaoId: string, action: string): void {
    if (!this.client || !this.connected) {
      console.error('❌ Cliente MQTT não conectado')
      return
    }

    const topic = mqttTopics.controle(sessaoId)
    const payload = JSON.stringify({ action, timestamp: Date.now() })

    this.client.publish(topic, payload, { qos: 1 }, (error) => {
      if (error) {
        console.error('❌ Erro ao publicar controle:', error)
      } else {
        console.log(`📤 Controle publicado em: ${topic}`)
      }
    })
  }

  public isConnected(): boolean {
    return this.connected
  }

  public disconnect(): void {
    if (this.client) {
      this.client.end()
      console.log('🔌 MQTT desconectado')
    }
  }
}
```

### 5.4. Arquivo: `api/src/routes/esp32.routes.ts`

```typescript
import type { FastifyInstance } from 'fastify'
import { supabase } from '../config/supabase'

export async function esp32Routes(fastify: FastifyInstance) {
  // Endpoint para ESP32 obter sessão ativa por código
  fastify.get('/sessao-ativa', async (request, reply) => {
    try {
      const { codigo } = request.query as { codigo?: string }

      if (!codigo) {
        return reply.status(400).send({
          error: 'Código é obrigatório',
        })
      }

      // Busca sessão ativa com esse código
      // Nota: O código é gerado no frontend e armazenado temporariamente
      // Aqui assumimos que o sessao_id segue o padrão: matricula_timestamp
      // e o código é passado pelo app ao ESP32 (via QR code ou digitação)

      // Buscar todas as sessões ativas (não finalizadas) dos últimos 30 minutos
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

      const { data: sessoes, error } = await supabase
        .from('carrinho_sessao')
        .select(
          `
          sessao_id,
          usuario_id,
          usuarios!inner (nome, matricula)
        `,
        )
        .eq('finalizado', false)
        .gte('created_at', thirtyMinutesAgo)
        .limit(10)

      if (error || !sessoes || sessoes.length === 0) {
        return reply.status(404).send({
          error: 'Nenhuma sessão ativa encontrada',
        })
      }

      // Aqui você pode implementar lógica adicional para validar o código
      // Por simplicidade, retornamos a primeira sessão ativa
      // Em produção, você pode armazenar o código em uma tabela separada

      const sessao = sessoes[0]

      return reply.send({
        sessao_id: sessao.sessao_id,
        usuario: sessao.usuarios.nome,
        matricula: sessao.usuarios.matricula,
      })
    } catch (error: any) {
      return reply.status(500).send({
        error: error.message,
      })
    }
  })

  // Endpoint de health check para ESP32
  fastify.get('/health', async (request, reply) => {
    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  })
}
```

### 5.5. Modificar: `api/src/server.ts`

**Adicionar no topo:**

```typescript
import { MqttService } from './services/mqtt.service'
import { esp32Routes } from './routes/esp32.routes'
```

**Adicionar após a criação do app:**

```typescript
// Inicializa serviço MQTT
let mqttService: MqttService | null = null

try {
  mqttService = new MqttService()
} catch (error) {
  console.error('⚠️  Não foi possível conectar ao MQTT:', error)
  console.log('ℹ️  A API continuará funcionando sem MQTT')
}
```

**Adicionar registro de rotas:**

```typescript
app.register(esp32Routes, { prefix: '/esp32' })
```

**Adicionar no final, antes de start():**

```typescript
// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando...')
  if (mqttService) {
    mqttService.disconnect()
  }
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando...')
  if (mqttService) {
    mqttService.disconnect()
  }
  process.exit(0)
})
```

### 5.6. Modificar: `api/.env`

**Adicionar:**

```env
# MQTT Broker Configuration
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_USER=biblioteca_server
MQTT_PASS=BiblioMQTT#2024!Srv
```

### 5.7. Modificar: `api/.env.example`

**Adicionar:**

```env
# MQTT Broker
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_USER=biblioteca_server
MQTT_PASS=sua-senha-mqtt-aqui
```

---

## 6. IMPLEMENTAÇÃO ESP32 (ARDUINO)

### 6.1. Estrutura de Arquivos

```
arduino/
└── esp32/
    ├── esp32.ino              ✨ REESCREVER COMPLETO
    ├── config.h               ✨ NOVO
    ├── wifi_manager.ino       ✨ NOVO
    ├── mqtt_client.ino        ✨ NOVO
    ├── oled_display.ino       ✨ NOVO
    └── rfid_reader.ino        ✨ NOVO
```

### 6.2. Arquivo: `arduino/esp32/config.h`

```cpp
#ifndef CONFIG_H
#define CONFIG_H

// ===================================
// CONFIGURAÇÕES GERAIS
// ===================================
#define FIRMWARE_VERSION "1.0.0"
#define DEVICE_NAME "Biblioteca_Carrinho"

// ===================================
// PINOS DO HARDWARE
// ===================================
// RFID (MFRC522)
#define RFID_SS_PIN    5
#define RFID_RST_PIN   2

// OLED (I2C)
#define OLED_SDA_PIN   21
#define OLED_SCL_PIN   22
#define OLED_WIDTH     128
#define OLED_HEIGHT    64
#define OLED_ADDRESS   0x3C

// ===================================
// CONFIGURAÇÕES DE REDE
// ===================================
// Access Point para configuração
#define AP_SSID        "BibliotecaRFID_Config"
#define AP_PASSWORD    "biblioteca2024"
#define AP_TIMEOUT     300000  // 5 minutos

// Web Server
#define WEB_SERVER_PORT 80

// ===================================
// CONFIGURAÇÕES MQTT (Padrão)
// ===================================
#define DEFAULT_MQTT_SERVER   "192.168.1.100"  // ALTERAR PARA SEU IP
#define DEFAULT_MQTT_PORT     1883
#define DEFAULT_MQTT_USER     "biblioteca_esp32"
#define DEFAULT_MQTT_PASS     "ESP32#Lib@2024!"
#define MQTT_KEEPALIVE        60
#define MQTT_QOS              1

// ===================================
// CONFIGURAÇÕES DE TIMING
// ===================================
#define RFID_DEBOUNCE_MS      3000   // 3 segundos entre leituras
#define DISPLAY_UPDATE_MS     100    // Atualização do display
#define MQTT_RECONNECT_MS     5000   // Tempo entre tentativas MQTT
#define WIFI_RECONNECT_MS     10000  // Tempo entre tentativas WiFi
#define SESSION_TIMEOUT_MS    1800000 // 30 minutos
#define OLED_MESSAGE_DURATION 3000   // Tempo para mostrar mensagens

// ===================================
// TÓPICOS MQTT
// ===================================
#define MQTT_TOPIC_RFID       "biblioteca/carrinho/%s/rfid"
#define MQTT_TOPIC_LIVRO      "biblioteca/carrinho/%s/livro"
#define MQTT_TOPIC_ERRO       "biblioteca/carrinho/%s/erro"
#define MQTT_TOPIC_CONTROLE   "biblioteca/carrinho/%s/controle"

// ===================================
// ENDPOINTS DA API
// ===================================
#define API_ENDPOINT_HEALTH   "/esp32/health"
#define API_ENDPOINT_SESSAO   "/esp32/sessao-ativa?codigo=%s"

#endif
```

### 6.3. Arquivo: `arduino/esp32/esp32.ino`

```cpp
/*
 * Carrinho Automático RFID - Biblioteca IFNMG
 *
 * Hardware:
 * - ESP32 Dev Board
 * - MFRC522 (RFID Reader)
 * - OLED SSD1306 128x64 (I2C)
 *
 * Autor: Sistema Biblioteca IFNMG
 * Versão: 1.0.0
 * Data: 2024
 */

#include <SPI.h>
#include <Wire.h>
#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <MFRC522.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>

#include "config.h"

// ===================================
// OBJETOS GLOBAIS
// ===================================
Preferences preferences;
MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
Adafruit_SSD1306 display(OLED_WIDTH, OLED_HEIGHT, &Wire, -1);
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
WebServer webServer(WEB_SERVER_PORT);

// ===================================
// VARIÁVEIS GLOBAIS
// ===================================
String wifiSSID = "";
String wifiPassword = "";
String mqttServer = DEFAULT_MQTT_SERVER;
int mqttPort = DEFAULT_MQTT_PORT;
String mqttUser = DEFAULT_MQTT_USER;
String mqttPass = DEFAULT_MQTT_PASS;
String apiBaseUrl = "";

String sessaoId = "";
String sessaoCodigo = "";
String usuarioNome = "";

unsigned long lastRfidRead = 0;
unsigned long lastMqttReconnect = 0;
unsigned long lastWifiReconnect = 0;
unsigned long sessionStartTime = 0;

byte lastUID[10];
byte lastUIDLength = 0;

enum SystemState {
  STATE_INIT,
  STATE_WIFI_CONFIG,
  STATE_CONNECTING_WIFI,
  STATE_CONNECTING_MQTT,
  STATE_WAITING_SESSION,
  STATE_SESSION_ACTIVE,
  STATE_ERROR
};

SystemState currentState = STATE_INIT;
String errorMessage = "";

// ===================================
// SETUP
// ===================================
void setup() {
  Serial.begin(115200);
  Serial.println("\n\n");
  Serial.println("=================================");
  Serial.println("  CARRINHO RFID - BIBLIOTECA");
  Serial.printf("  Versão: %s\n", FIRMWARE_VERSION);
  Serial.println("=================================\n");

  // Inicializa Preferences (armazenamento persistente)
  preferences.begin("biblioteca", false);

  // Inicializa SPI (RFID)
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("✓ RFID inicializado");

  // Inicializa I2C (OLED)
  Wire.begin(OLED_SDA_PIN, OLED_SCL_PIN);

  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
    Serial.println("✗ Falha ao iniciar OLED");
    while (true);
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  Serial.println("✓ OLED inicializado");

  // Mostra splash screen
  showSplashScreen();
  delay(2000);

  // Carrega configurações salvas
  loadConfig();

  // Verifica se tem WiFi configurado
  if (wifiSSID.length() == 0) {
    Serial.println("ℹ WiFi não configurado - entrando em modo AP");
    currentState = STATE_WIFI_CONFIG;
    startConfigMode();
  } else {
    Serial.printf("ℹ WiFi configurado: %s\n", wifiSSID.c_str());
    currentState = STATE_CONNECTING_WIFI;
    connectWiFi();
  }

  // Configura callbacks MQTT
  mqttClient.setServer(mqttServer.c_str(), mqttPort);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setKeepAlive(MQTT_KEEPALIVE);
}

// ===================================
// LOOP PRINCIPAL
// ===================================
void loop() {
  // Processa servidor web se estiver em modo configuração
  if (currentState == STATE_WIFI_CONFIG) {
    webServer.handleClient();
    return;
  }

  // Verifica conexão WiFi
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastWifiReconnect > WIFI_RECONNECT_MS) {
      Serial.println("⚠ WiFi desconectado - reconectando...");
      currentState = STATE_CONNECTING_WIFI;
      connectWiFi();
      lastWifiReconnect = millis();
    }
    return;
  }

  // Verifica conexão MQTT
  if (!mqttClient.connected()) {
    if (millis() - lastMqttReconnect > MQTT_RECONNECT_MS) {
      Serial.println("⚠ MQTT desconectado - reconectando...");
      currentState = STATE_CONNECTING_MQTT;
      connectMQTT();
      lastMqttReconnect = millis();
    }
    return;
  }

  // Processa mensagens MQTT
  mqttClient.loop();

  // Máquina de estados
  switch (currentState) {
    case STATE_WAITING_SESSION:
      handleWaitingSession();
      break;

    case STATE_SESSION_ACTIVE:
      handleSessionActive();
      break;

    case STATE_ERROR:
      handleError();
      break;
  }

  // Atualiza display
  updateDisplay();
}

// Continua nos próximos arquivos .ino...
```

### 6.4. Arquivo: `arduino/esp32/wifi_manager.ino`

```cpp
/*
 * Gerenciamento de WiFi e Modo de Configuração
 */

void loadConfig() {
  wifiSSID = preferences.getString("wifi_ssid", "");
  wifiPassword = preferences.getString("wifi_pass", "");
  mqttServer = preferences.getString("mqtt_server", DEFAULT_MQTT_SERVER);
  mqttPort = preferences.getInt("mqtt_port", DEFAULT_MQTT_PORT);
  mqttUser = preferences.getString("mqtt_user", DEFAULT_MQTT_USER);
  mqttPass = preferences.getString("mqtt_pass", DEFAULT_MQTT_PASS);

  // API Base URL é construído a partir do MQTT Server
  // Assumindo que o servidor Node.js roda na mesma máquina
  apiBaseUrl = "http://" + mqttServer + ":3333";

  Serial.println("✓ Configurações carregadas");
}

void saveConfig() {
  preferences.putString("wifi_ssid", wifiSSID);
  preferences.putString("wifi_pass", wifiPassword);
  preferences.putString("mqtt_server", mqttServer);
  preferences.putInt("mqtt_port", mqttPort);
  preferences.putString("mqtt_user", mqttUser);
  preferences.putString("mqtt_pass", mqttPass);

  Serial.println("✓ Configurações salvas");
}

void connectWiFi() {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Conectando WiFi...");
  display.println(wifiSSID);
  display.display();

  Serial.printf("→ Conectando ao WiFi: %s\n", wifiSSID.c_str());

  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi conectado!");
    Serial.printf("  IP: %s\n", WiFi.localIP().toString().c_str());

    currentState = STATE_CONNECTING_MQTT;
    connectMQTT();
  } else {
    Serial.println("\n✗ Falha ao conectar WiFi");
    errorMessage = "WiFi falhou";
    currentState = STATE_ERROR;
  }
}

void startConfigMode() {
  Serial.println("\n┌─────────────────────────────────┐");
  Serial.println("│   MODO DE CONFIGURAÇÃO ATIVO    │");
  Serial.println("└─────────────────────────────────┘");

  // Inicia Access Point
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASSWORD);

  IPAddress IP = WiFi.softAPIP();
  Serial.printf("\n✓ Access Point iniciado\n");
  Serial.printf("  SSID: %s\n", AP_SSID);
  Serial.printf("  Senha: %s\n", AP_PASSWORD);
  Serial.printf("  IP: %s\n", IP.toString().c_str());
  Serial.printf("  URL: http://%s\n\n", IP.toString().c_str());

  // Exibe no display
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("MODO CONFIGURACAO");
  display.println("");
  display.printf("WiFi: %s\n", AP_SSID);
  display.printf("Senha: %s\n", AP_PASSWORD);
  display.println("");
  display.printf("http://%s\n", IP.toString().c_str());
  display.display();

  // Configura rotas do servidor web
  setupWebServer();

  // Inicia servidor
  webServer.begin();
  Serial.println("✓ Servidor web iniciado");
}

void setupWebServer() {
  // Página principal de configuração
  webServer.on("/", HTTP_GET, handleConfigPage);

  // Salvar configurações
  webServer.on("/save", HTTP_POST, handleSaveConfig);

  // Scan de redes WiFi
  webServer.on("/scan", HTTP_GET, handleScanNetworks);

  // Reiniciar ESP32
  webServer.on("/restart", HTTP_GET, handleRestart);

  // 404
  webServer.onNotFound([]() {
    webServer.send(404, "text/plain", "404: Not found");
  });
}

void handleConfigPage() {
  String html = R"(
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configuração Carrinho RFID</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 100%;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 24px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 600;
            font-size: 14px;
        }
        input, select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.3s;
        }
        input:focus, select:focus {
            outline: none;
            border-color: #667eea;
        }
        .btn {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 10px;
        }
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }
        .btn-secondary {
            background: #f5f5f5;
            color: #333;
        }
        .btn-secondary:hover {
            background: #e0e0e0;
        }
        .info-box {
            background: #f0f7ff;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 8px;
            font-size: 14px;
            color: #333;
        }
        .loading {
            display: none;
            text-align: center;
            margin: 20px 0;
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛒 Carrinho RFID</h1>
        <p class="subtitle">Configure a conexão WiFi e MQTT</p>

        <div class="info-box">
            ℹ️ Após salvar, o dispositivo irá reiniciar e conectar automaticamente.
        </div>

        <form id="configForm">
            <div class="form-group">
                <label>Rede WiFi</label>
                <select id="wifiSsid" name="ssid" required>
                    <option value="">Escaneando redes...</option>
                </select>
            </div>

            <div class="form-group">
                <label>Senha WiFi</label>
                <input type="password" name="password" placeholder="Digite a senha" required>
            </div>

            <div class="form-group">
                <label>Servidor MQTT (IP)</label>
                <input type="text" name="mqtt_server" value=")" + mqttServer + R"(" placeholder="192.168.1.100" required>
            </div>

            <div class="form-group">
                <label>Porta MQTT</label>
                <input type="number" name="mqtt_port" value=")" + String(mqttPort) + R"(" placeholder="1883" required>
            </div>

            <div class="form-group">
                <label>Usuário MQTT</label>
                <input type="text" name="mqtt_user" value=")" + mqttUser + R"(" required>
            </div>

            <div class="form-group">
                <label>Senha MQTT</label>
                <input type="password" name="mqtt_pass" value=")" + mqttPass + R"(" required>
            </div>

            <button type="submit" class="btn btn-primary">💾 Salvar e Reiniciar</button>
            <button type="button" onclick="window.location.reload()" class="btn btn-secondary">🔄 Recarregar</button>
        </form>

        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p style="margin-top: 10px;">Salvando configurações...</p>
        </div>
    </div>

    <script>
        // Carrega lista de redes WiFi
        fetch('/scan')
            .then(r => r.json())
            .then(data => {
                const select = document.getElementById('wifiSsid');
                select.innerHTML = '<option value="">Selecione uma rede</option>';
                data.networks.forEach(net => {
                    select.innerHTML += `<option value="${net.ssid}">${net.ssid} (${net.rssi}dBm)</option>`;
                });
            })
            .catch(err => {
                console.error('Erro ao carregar redes:', err);
            });

        // Envia formulário
        document.getElementById('configForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            document.getElementById('loading').style.display = 'block';
            document.getElementById('configForm').style.display = 'none';

            const formData = new FormData(e.target);
            const params = new URLSearchParams(formData);

            try {
                const response = await fetch('/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: params
                });

                if (response.ok) {
                    alert('✅ Configurações salvas! O dispositivo irá reiniciar.');
                    setTimeout(() => {
                        window.location.href = '/restart';
                    }, 2000);
                } else {
                    alert('❌ Erro ao salvar configurações');
                    location.reload();
                }
            } catch (err) {
                alert('❌ Erro: ' + err.message);
                location.reload();
            }
        });
    </script>
</body>
</html>
  )";

  webServer.send(200, "text/html", html);
}

void handleScanNetworks() {
  Serial.println("→ Escaneando redes WiFi...");

  int n = WiFi.scanNetworks();

  StaticJsonDocument<2048> doc;
  JsonArray networks = doc.createNestedArray("networks");

  for (int i = 0; i < n && i < 20; i++) {
    JsonObject network = networks.createNestedObject();
    network["ssid"] = WiFi.SSID(i);
    network["rssi"] = WiFi.RSSI(i);
    network["secure"] = (WiFi.encryptionType(i) != WIFI_AUTH_OPEN);
  }

  String json;
  serializeJson(doc, json);

  webServer.send(200, "application/json", json);

  Serial.printf("✓ Encontradas %d redes\n", n);
}

void handleSaveConfig() {
  if (!webServer.hasArg("ssid") || !webServer.hasArg("password")) {
    webServer.send(400, "text/plain", "Missing parameters");
    return;
  }

  wifiSSID = webServer.arg("ssid");
  wifiPassword = webServer.arg("password");

  if (webServer.hasArg("mqtt_server")) {
    mqttServer = webServer.arg("mqtt_server");
  }
  if (webServer.hasArg("mqtt_port")) {
    mqttPort = webServer.arg("mqtt_port").toInt();
  }
  if (webServer.hasArg("mqtt_user")) {
    mqttUser = webServer.arg("mqtt_user");
  }
  if (webServer.hasArg("mqtt_pass")) {
    mqttPass = webServer.arg("mqtt_pass");
  }

  saveConfig();

  webServer.send(200, "text/plain", "OK");

  Serial.println("✓ Configurações salvas via web");
}

void handleRestart() {
  webServer.send(200, "text/html", "<h1>Reiniciando...</h1><p>Aguarde 10 segundos</p>");
  delay(1000);
  ESP.restart();
}
```

### 6.5. Arquivo: `arduino/esp32/mqtt_client.ino`

```cpp
/*
 * Cliente MQTT - Publicação e Subscrição
 */

void connectMQTT() {
  if (mqttClient.connected()) {
    return;
  }

  Serial.printf("→ Conectando ao MQTT: %s:%d\n", mqttServer.c_str(), mqttPort);

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Conectando MQTT...");
  display.display();

  String clientId = "biblioteca-esp32-";
  clientId += String(random(0xffff), HEX);

  if (mqttClient.connect(clientId.c_str(), mqttUser.c_str(), mqttPass.c_str())) {
    Serial.println("✓ MQTT conectado!");

    // Se tiver sessão ativa, subscreve nos tópicos
    if (sessaoId.length() > 0) {
      subscribeMqttTopics();
    }

    currentState = STATE_WAITING_SESSION;
  } else {
    Serial.printf("✗ Falha MQTT. Código: %d\n", mqttClient.state());
    errorMessage = "MQTT falhou";
    currentState = STATE_ERROR;
  }
}

void subscribeMqttTopics() {
  if (!mqttClient.connected() || sessaoId.length() == 0) {
    return;
  }

  char topic[100];

  // Tópico de informações do livro
  snprintf(topic, sizeof(topic), MQTT_TOPIC_LIVRO, sessaoId.c_str());
  mqttClient.subscribe(topic, MQTT_QOS);
  Serial.printf("✓ Subscrito: %s\n", topic);

  // Tópico de erros
  snprintf(topic, sizeof(topic), MQTT_TOPIC_ERRO, sessaoId.c_str());
  mqttClient.subscribe(topic, MQTT_QOS);
  Serial.printf("✓ Subscrito: %s\n", topic);

  // Tópico de controle
  snprintf(topic, sizeof(topic), MQTT_TOPIC_CONTROLE, sessaoId.c_str());
  mqttClient.subscribe(topic, MQTT_QOS);
  Serial.printf("✓ Subscrito: %s\n", topic);
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.printf("📨 Mensagem recebida: %s\n", topic);

  // Converte payload para String
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.printf("   Payload: %s\n", message.c_str());

  // Parse JSON
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.printf("✗ Erro ao parsear JSON: %s\n", error.c_str());
    return;
  }

  // Verifica qual tópico
  String topicStr = String(topic);

  if (topicStr.indexOf("/livro") > 0) {
    handleLivroMessage(doc);
  } else if (topicStr.indexOf("/erro") > 0) {
    handleErroMessage(doc);
  } else if (topicStr.indexOf("/controle") > 0) {
    handleControleMessage(doc);
  }
}

void handleLivroMessage(JsonDocument& doc) {
  String status = doc["status"] | "";
  String titulo = doc["titulo"] | "";
  String rfidTag = doc["rfid_tag"] | "";
  bool added = doc["added"] | false;

  Serial.printf("📚 Livro: %s\n", titulo.c_str());
  Serial.printf("   Tag: %s\n", rfidTag.c_str());
  Serial.printf("   Adicionado: %s\n", added ? "Sim" : "Não (já estava)");

  // Exibe no OLED
  display.clearDisplay();
  display.setCursor(0, 0);

  if (added) {
    display.println("ADICIONADO!");
    display.println("");
    display.println("Tag:");
    display.println(rfidTag);
  } else {
    display.println("JA NO CARRINHO");
    display.println("");
    display.println("Tag:");
    display.println(rfidTag);
  }

  display.display();

  // Volta para tela normal após 3 segundos
  delay(OLED_MESSAGE_DURATION);
}

void handleErroMessage(JsonDocument& doc) {
  String error = doc["error"] | "Erro desconhecido";
  String rfidTag = doc["rfid_tag"] | "";

  Serial.printf("❌ Erro: %s\n", error.c_str());
  Serial.printf("   Tag: %s\n", rfidTag.c_str());

  // Exibe no OLED
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("ERRO!");
  display.println("");

  // Quebra mensagem se for muito grande
  display.println(error);

  display.display();

  // Volta para tela normal após 5 segundos
  delay(5000);
}

void handleControleMessage(JsonDocument& doc) {
  String action = doc["action"] | "";

  Serial.printf("🎮 Controle: %s\n", action.c_str());

  if (action == "finalizar") {
    // Limpa sessão
    sessaoId = "";
    sessaoCodigo = "";
    usuarioNome = "";
    sessionStartTime = 0;

    currentState = STATE_WAITING_SESSION;

    Serial.println("✓ Sessão finalizada");
  }
}

void publishRfidTag(String rfidTag) {
  if (!mqttClient.connected() || sessaoId.length() == 0) {
    Serial.println("✗ Não pode publicar: MQTT desconectado ou sem sessão");
    return;
  }

  char topic[100];
  snprintf(topic, sizeof(topic), MQTT_TOPIC_RFID, sessaoId.c_str());

  StaticJsonDocument<256> doc;
  doc["rfid_tag"] = rfidTag;
  doc["timestamp"] = millis();

  String payload;
  serializeJson(doc, payload);

  if (mqttClient.publish(topic, payload.c_str(), false)) {
    Serial.printf("✓ Publicado: %s\n", topic);
    Serial.printf("  Tag: %s\n", rfidTag.c_str());
  } else {
    Serial.println("✗ Falha ao publicar");
  }
}
```

### 6.6. Arquivo: `arduino/esp32/oled_display.ino`

```cpp
/*
 * Gerenciamento do Display OLED
 */

void showSplashScreen() {
  display.clearDisplay();

  // Logo/Título
  display.setTextSize(2);
  display.setCursor(10, 10);
  display.println("CARRINHO");

  display.setTextSize(1);
  display.setCursor(25, 35);
  display.println("BIBLIOTECA");

  display.setCursor(25, 50);
  display.printf("v%s", FIRMWARE_VERSION);

  display.display();
}

void updateDisplay() {
  static unsigned long lastUpdate = 0;

  if (millis() - lastUpdate < DISPLAY_UPDATE_MS) {
    return;
  }

  lastUpdate = millis();

  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);

  switch (currentState) {
    case STATE_INIT:
      display.println("Inicializando...");
      break;

    case STATE_WIFI_CONFIG:
      // Já é tratado em startConfigMode()
      break;

    case STATE_CONNECTING_WIFI:
      display.println("Conectando WiFi...");
      display.println(wifiSSID);
      break;

    case STATE_CONNECTING_MQTT:
      display.println("WiFi: OK");
      display.println("");
      display.println("Conectando MQTT...");
      break;

    case STATE_WAITING_SESSION:
      display.println("WiFi: Conectado");
      display.println("MQTT: OK");
      display.println("");
      display.println("Aguarde Login");
      display.println("no aplicativo...");
      break;

    case STATE_SESSION_ACTIVE:
      display.printf("Sessao: %s\n", sessaoCodigo.c_str());
      display.println(usuarioNome);
      display.println("");
      display.println("Aproxime o livro");
      display.println("do leitor RFID");

      // Mostra tempo restante
      unsigned long elapsed = millis() - sessionStartTime;
      unsigned long remaining = SESSION_TIMEOUT_MS - elapsed;
      int minutesLeft = remaining / 60000;
      display.println("");
      display.printf("Tempo: %d min\n", minutesLeft);
      break;

    case STATE_ERROR:
      display.println("ERRO!");
      display.println("");
      display.println(errorMessage);
      display.println("");
      display.println("Reiniciando...");
      break;
  }

  display.display();
}
```

### 6.7. Arquivo: `arduino/esp32/rfid_reader.ino`

```cpp
/*
 * Leitor RFID - Detecção de Tags
 */

void handleWaitingSession() {
  // Tenta obter sessão ativa a cada 10 segundos
  static unsigned long lastCheck = 0;

  if (millis() - lastCheck > 10000) {
    checkActiveSession();
    lastCheck = millis();
  }
}

void handleSessionActive() {
  // Verifica timeout da sessão
  if (millis() - sessionStartTime > SESSION_TIMEOUT_MS) {
    Serial.println("⏱️  Timeout da sessão");
    sessaoId = "";
    sessaoCodigo = "";
    usuarioNome = "";
    sessionStartTime = 0;
    currentState = STATE_WAITING_SESSION;
    return;
  }

  // Verifica se há cartão presente
  if (!rfid.PICC_IsNewCardPresent()) {
    return;
  }

  if (!rfid.PICC_ReadCardSerial()) {
    return;
  }

  // Debounce - verifica se é a mesma tag lida recentemente
  if (millis() - lastRfidRead < RFID_DEBOUNCE_MS) {
    // Verifica se é a mesma tag
    bool sameTag = true;
    if (rfid.uid.size == lastUIDLength) {
      for (byte i = 0; i < rfid.uid.size; i++) {
        if (rfid.uid.uidByte[i] != lastUID[i]) {
          sameTag = false;
          break;
        }
      }
    } else {
      sameTag = false;
    }

    if (sameTag) {
      rfid.PICC_HaltA();
      rfid.PCD_StopCrypto1();
      return;
    }
  }

  // Nova leitura válida
  lastRfidRead = millis();

  // Salva UID para debounce
  lastUIDLength = rfid.uid.size;
  for (byte i = 0; i < rfid.uid.size; i++) {
    lastUID[i] = rfid.uid.uidByte[i];
  }

  // Converte UID para string hexadecimal
  String rfidTag = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) {
      rfidTag += "0";
    }
    rfidTag += String(rfid.uid.uidByte[i], HEX);
  }
  rfidTag.toUpperCase();

  Serial.printf("🏷️  Tag detectada: %s\n", rfidTag.c_str());

  // Mostra no display
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("TAG LIDA:");
  display.println("");
  display.println(rfidTag);
  display.println("");
  display.println("Processando...");
  display.display();

  // Publica no MQTT
  publishRfidTag(rfidTag);

  // Halt PICC
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

void handleError() {
  delay(5000);
  ESP.restart();
}

void checkActiveSession() {
  if (sessaoId.length() > 0) {
    return; // Já tem sessão ativa
  }

  Serial.println("→ Verificando sessão ativa...");

  HTTPClient http;
  String url = apiBaseUrl + String(API_ENDPOINT_HEALTH);

  http.begin(url);
  int httpCode = http.GET();

  if (httpCode == 200) {
    Serial.
```
