/*
 * Projeto: Leitor RFID com Display OLED e Conexão Wi-Fi no ESP32
 * Autor: [Seu Nome/Empresa]
 * Data: 07/12/2025
 * 
 * Descrição:
 * Este código realiza a leitura de tags/cartões RFID, exibe o UID em um display OLED,
 * conecta-se a uma rede Wi-Fi e envia o UID lido para um servidor HTTP.
 * 
 * O código foi atualizado para incluir:
 * - Conexão Wi-Fi com status exibido no OLED e Serial.
 * - Envio do UID para um servidor via requisição HTTP POST.
 */

// =============================================================================
// Inclusão de Bibliotecas
// =============================================================================
#include <SPI.h>              // Biblioteca para comunicação SPI (necessária para o RC522)
#include <MFRC522.h>          // Biblioteca para o leitor RFID MFRC522
#include <Wire.h>             // Biblioteca para comunicação I2C (necessária para o OLED)
#include <Adafruit_GFX.h>     // Biblioteca gráfica principal da Adafruit
#include <Adafruit_SSD1306.h> // Biblioteca para o controlador de display OLED SSD1306
#include <WiFi.h>             // Biblioteca para funcionalidades Wi-Fi do ESP32
#include <HTTPClient.h>       // Biblioteca para realizar requisições HTTP

// =============================================================================
// Definições de Pinos e Constantes
// =============================================================================

// --- Configurações de Wi-Fi ---
// Substitua pelas credenciais da sua rede Wi-Fi
const char* WIFI_SSID = "RONALDO";
const char* WIFI_PASSWORD = "rona652307";

// --- Configurações do Servidor ---
// IMPORTANTE: Substitua pelo IP da máquina onde o servidor está rodando
const char* SERVER_IP = "192.168.15.243"; // IP da sua máquina
const int SERVER_PORT = 3333;

// --- Variável Global para Sessão ---
String sessaoAtiva = "";  // Armazena o sessao_id ativo

// --- Variável Global para Status do OLED ---
bool oledDisponivel = false;  // Flag para indicar se OLED está funcionando

// --- Pinos para o Leitor RFID MFRC522 (Interface SPI) ---
#define RST_PIN  2 // Pino de Reset do RC522
#define SS_PIN   5  // Pino SS/SDA (Slave Select) do RC522

// --- Configurações do Display OLED (Interface I2C) ---
#define SCREEN_WIDTH 128 // Largura do display OLED em pixels
#define SCREEN_HEIGHT 64 // Altura do display OLED em pixels
#define OLED_ADDR   0x3C   // Endereço I2C do display OLED

// --- Outras Constantes ---
#define SERIAL_BAUD_RATE 115200 // Taxa de comunicação para o Serial Monitor
#define CARD_DETECT_DELAY 2000  // Tempo (em ms) que o UID fica na tela após detecção

// =============================================================================
// Instâncias de Objetos
// =============================================================================

MFRC522 mfrc522(SS_PIN, RST_PIN);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// =============================================================================
// Funções Auxiliares
// =============================================================================

/**
 * @brief Exibe uma mensagem centralizada no display OLED.
 */
void showMessageOnOLED(const String& line1, const String& line2 = "") {
  // Não faz nada se OLED não está disponível
  if (!oledDisponivel) {
    return;
  }
  
  display.clearDisplay();
  display.setTextSize(1);
  
  int16_t x1 = (display.width() - (line1.length() * 6)) / 2;
  display.setCursor(x1 > 0 ? x1 : 0, 10);
  display.println(line1);

  if (line2 != "") {
    int16_t x2 = (display.width() - (line2.length() * 6)) / 2;
    display.setCursor(x2 > 0 ? x2 : 0, 30);
    display.println(line2);
  }
  
  display.display();
}

/**
 * @brief Inicializa o display OLED.
 */
void initOLED() {
  Serial.println(F("Inicializando display OLED..."));
  
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    Serial.println(F("========================================"));
    Serial.println(F("AVISO: Falha ao iniciar display OLED."));
    Serial.println(F("Verifique:"));
    Serial.println(F("  - Conexao dos pinos SDA/SCL"));
    Serial.println(F("  - Alimentacao VCC/GND"));
    Serial.println(F("  - Endereco I2C (atual: 0x3C)"));
    Serial.println(F("Sistema continuara sem display."));
    Serial.println(F("========================================"));
    oledDisponivel = false;
    return;  // Sai sem travar
  }
  
  oledDisponivel = true;
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.display();
  Serial.println(F("Display OLED inicializado com sucesso!"));
}

/**
 * @brief Inicializa o leitor RFID MFRC522.
 */
void initRFID() {
  SPI.begin();
  mfrc522.PCD_Init();
  Serial.println(F("Leitor RFID MFRC522 inicializado."));
  mfrc522.PCD_DumpVersionToSerial();
}

/**
 * @brief Conecta-se à rede Wi-Fi.
 */
void conectarWiFi() {
  Serial.println(F("\n--- Conectando ao Wi-Fi ---"));
  Serial.print(F("SSID: "));
  Serial.println(WIFI_SSID);
  showMessageOnOLED("Conectando Wi-Fi...");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED && tentativas < 20) {
    delay(500);
    Serial.print(".");
    tentativas++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("Wi-Fi conectado com sucesso!"));
    Serial.print(F("Endereco IP: "));
    Serial.println(WiFi.localIP());
    Serial.print(F("Servidor: http://"));
    Serial.print(SERVER_IP);
    Serial.print(":");
    Serial.println(SERVER_PORT);
    showMessageOnOLED("Wi-Fi OK!", WiFi.localIP().toString());
  } else {
    Serial.println(F("ERRO: Falha ao conectar no Wi-Fi."));
    Serial.println(F("Verifique SSID e senha."));
    showMessageOnOLED("Falha no Wi-Fi");
  }
  delay(2000);
}

/**
 * @brief Converte o array de bytes do UID para uma string hexadecimal sem espaços.
 */
String uidToString(byte* buffer, byte bufferSize) {
  String uid = "";
  for (byte i = 0; i < bufferSize; i++) {
    if (buffer[i] < 0x10) {
      uid += "0";
    }
    uid += String(buffer[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

/**
 * @brief Obtém a sessão ativa do servidor.
 */
void obterSessaoDoServidor() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi desconectado. Aguardando conexao...");
    showMessageOnOLED("Sem Wi-Fi", "Aguardando...");
    return;
  }

  Serial.println("Obtendo sessao ativa do servidor...");
  showMessageOnOLED("Buscando", "sessao ativa...");

  HTTPClient http;
  String serverUrl = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/carrinhos/sessao-ativa";
  http.begin(serverUrl);
  http.setTimeout(5000);

  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String responsePayload = http.getString();
    Serial.println("Resposta do servidor: " + responsePayload);
    
    // Parse JSON simples para extrair sessao_id
    // Formato esperado: {"sessao_id":"2023001_1234567890","codigo":"123456"}
    int inicio = responsePayload.indexOf("\"sessao_id\":\"") + 13;
    int fim = responsePayload.indexOf("\"", inicio);
    
    if (inicio > 12 && fim > inicio) {
      sessaoAtiva = responsePayload.substring(inicio, fim);
      Serial.println("Sessao obtida: " + sessaoAtiva);
      
      // Extrai e mostra o código
      int inicioCode = responsePayload.indexOf("\"codigo\":\"") + 10;
      int fimCode = responsePayload.indexOf("\"", inicioCode);
      String codigo = responsePayload.substring(inicioCode, fimCode);
      
      showMessageOnOLED("Sessao Ativa:", codigo);
      Serial.println("Codigo da sessao: " + codigo);
    } else {
      Serial.println("Erro ao extrair sessao_id do JSON");
      showMessageOnOLED("Erro JSON", "Tentando...");
      sessaoAtiva = "";
    }
  } else if (httpResponseCode == 404) {
    Serial.println("Nenhuma sessao ativa no momento");
    showMessageOnOLED("Sem sessao ativa", "Inicie no app");
    sessaoAtiva = "";
  } else {
    Serial.printf("Erro ao obter sessao. Codigo: %d\n", httpResponseCode);
    showMessageOnOLED("Erro na busca", "Tentando...");
    sessaoAtiva = "";
  }
  
  http.end();
  delay(2000);
}

/**
 * @brief Envia o RFID do livro para o servidor via HTTP POST.
 * 
 * @param rfidLivro O RFID do livro lido a ser enviado.
 */
void enviarLivroParaServidor(String rfidLivro) {
  // Verifica se há sessão ativa
  if (sessaoAtiva == "") {
    Serial.println("Nenhuma sessao ativa. Buscando...");
    showMessageOnOLED("Sem sessao!", "Aguarde...");
    obterSessaoDoServidor();
    
    if (sessaoAtiva == "") {
      showMessageOnOLED("Erro:", "Inicie no app");
      delay(2000);
      return;
    }
  }

  // Verifica Wi-Fi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi desconectado. Nao enviado.");
    showMessageOnOLED("Erro de Wi-Fi", "Nao enviado");
    delay(1500);
    return;
  }

  Serial.print("Enviando livro para sessao: ");
  Serial.println(sessaoAtiva);
  Serial.print("RFID do livro: ");
  Serial.println(rfidLivro);
  showMessageOnOLED("Enviando livro...", rfidLivro);

  HTTPClient http;
  
  // Endpoint correto
  String serverUrl = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/carrinhos/rfid-leitura";
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);
  
  // Payload correto
  String jsonPayload = "{\"sessao_id\":\"" + sessaoAtiva + "\",\"rfid_tag\":\"" + rfidLivro + "\"}";
  Serial.print("Payload: ");
  Serial.println(jsonPayload);
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    String responsePayload = http.getString();
    Serial.printf("Servidor respondeu: %d\n", httpResponseCode);
    Serial.print("Resposta: ");
    Serial.println(responsePayload);
    
    if (httpResponseCode == 200) {
      // Livro adicionado com sucesso
      showMessageOnOLED("Livro OK!", "Adicionado");
    } else if (httpResponseCode == 400) {
      // Possível erro: limite atingido, livro indisponível, sessão inválida
      if (responsePayload.indexOf("sessao") > -1 || responsePayload.indexOf("Sessao") > -1) {
        // Sessão expirou ou é inválida - limpar e buscar nova
        sessaoAtiva = "";
        showMessageOnOLED("Sessao invalida", "Recarregando...");
        delay(1000);
        obterSessaoDoServidor();
      } else if (responsePayload.indexOf("Limite") > -1 || responsePayload.indexOf("limite") > -1) {
        showMessageOnOLED("Limite atingido", "3 livros max");
      } else if (responsePayload.indexOf("disponivel") > -1) {
        showMessageOnOLED("Livro", "indisponivel");
      } else {
        showMessageOnOLED("Erro:", "Ver app");
      }
    } else {
      showMessageOnOLED("Erro Servidor", "Cod:" + String(httpResponseCode));
    }
  } else {
    Serial.print("Falha no envio: ");
    Serial.println(http.errorToString(httpResponseCode));
    showMessageOnOLED("Falha Envio", "Rede?");
  }
  
  http.end();
  delay(2000);
}

// =============================================================================
// Setup e Loop Principal
// =============================================================================

void setup() {
  Serial.begin(SERIAL_BAUD_RATE);
  Serial.println(F("\n========================================"));
  Serial.println(F("CARRINHO AUTOMATICO RFID - IFNMG"));
  Serial.println(F("Inicializando sistema..."));
  Serial.println(F("========================================\n"));

  initOLED();
  showMessageOnOLED("Iniciando...");
  delay(1000);

  initRFID();
  
  conectarWiFi();
  
  // NÃO chamar obterSessaoDoServidor() aqui para evitar WDT timeout
  // Será chamado no primeiro loop()
  
  showMessageOnOLED("Sistema Pronto", "Inicie no app");
  Serial.println(F("\n========================================"));
  Serial.println(F("Sistema pronto!"));
  Serial.println(F("Aguardando livros RFID..."));
  Serial.println(F("========================================\n"));
}

void loop() {
  // Reconecta Wi-Fi se necessário
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("Wi-Fi desconectado! Tentando reconectar..."));
    conectarWiFi();
  }

  // Busca sessão na primeira vez e depois a cada 10 segundos
  static unsigned long ultimaVerificacao = 0;
  static bool primeiraVez = true;
  
  // Verifica imediatamente na primeira vez, depois a cada 10s
  if (primeiraVez || (millis() - ultimaVerificacao > 10000)) {
    ultimaVerificacao = millis();
    
    if (primeiraVez) {
      Serial.println(F("\n--- Buscando sessao ativa pela primeira vez ---"));
      primeiraVez = false;
    }
    
    if (sessaoAtiva == "") {
      obterSessaoDoServidor();
    }
  }

  // Procura por cartão RFID (livro)
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String rfidLivro = uidToString(mfrc522.uid.uidByte, mfrc522.uid.size);

    Serial.println(F("\n*** LIVRO DETECTADO ***"));
    Serial.print(F("RFID: "));
    Serial.println(rfidLivro);

    showMessageOnOLED("Livro detectado:", rfidLivro);
    delay(800);

    enviarLivroParaServidor(rfidLivro);

    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    delay(1000);

    if (sessaoAtiva != "") {
      showMessageOnOLED("Pronto", "Proximo livro");
    } else {
      showMessageOnOLED("Sistema Pronto", "Inicie no app");
    }
    
    Serial.println(F("\nAguardando proximo livro..."));
  }
}

  // A cada 10 segundos, verifica se há sessão ativa
  static unsigned long ultimaVerificacao = 0;
  if (millis() - ultimaVerificacao > 10000) {
    ultimaVerificacao = millis();
    if (sessaoAtiva == "") {
      obterSessaoDoServidor();
    }
  }

  // Procura por cartão RFID (livro)
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String rfidLivro = uidToString(mfrc522.uid.uidByte, mfrc522.uid.size);

    Serial.print(F("Livro detectado! RFID: "));
    Serial.println(rfidLivro);

    showMessageOnOLED("Livro detectado:", rfidLivro);
    delay(800);

    // Envia para o servidor
    enviarLivroParaServidor(rfidLivro);

    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    delay(1000);

    // Volta à tela de espera
    if (sessaoAtiva != "") {
      showMessageOnOLED("Pronto", "Proximo livro");
    } else {
      showMessageOnOLED("Sistema Pronto", "Inicie no app");
    }
    
    Serial.println(F("\nAguardando proximo livro..."));
  }
}
