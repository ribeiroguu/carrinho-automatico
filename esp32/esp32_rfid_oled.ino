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
const char* SERVER_IP = "192.168.1.10"; // Exemplo: "192.168.0.10"
const int SERVER_PORT = 3000;

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
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    Serial.println(F("Falha ao iniciar display OLED."));
    while (true);
  }
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.display();
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
  Serial.println("Conectando ao Wi-Fi...");
  showMessageOnOLED("Conectando Wi-Fi...");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED && tentativas < 20) {
    delay(500);
    Serial.print(".");
    tentativas++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi conectado!");
    Serial.print("Endereco IP: ");
    Serial.println(WiFi.localIP());
    showMessageOnOLED("Wi-Fi OK!", WiFi.localIP().toString());
  } else {
    Serial.println("\nFalha ao conectar no Wi-Fi.");
    showMessageOnOLED("Falha no Wi-Fi");
  }
  delay(2000); // Aguarda para que a mensagem de status seja lida
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
 * @brief Envia o UID lido para o servidor via HTTP POST.
 * 
 * @param uid O UID do cartão a ser enviado.
 */
void enviarUIDParaServidor(String uid) {
  // Verifica se o Wi-Fi está conectado antes de tentar enviar
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi desconectado. Nao foi possivel enviar o UID.");
    showMessageOnOLED("Erro de Wi-Fi", "Nao enviado");
    delay(1500);
    return;
  }

  Serial.print("Enviando UID para o servidor: ");
  Serial.println(uid);
  showMessageOnOLED("Enviando UID...", uid);

  HTTPClient http;
  
  // Monta a URL do endpoint do servidor
  String serverUrl = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/carrinhos/rfid";
  http.begin(serverUrl);
  
  // Define o cabeçalho da requisição como JSON
  http.addHeader("Content-Type", "application/json");
  
  // Monta o corpo (payload) da requisição em formato JSON
  String jsonPayload = "{\"rfid\":\"" + uid + "\"}";
  
  // Envia a requisição POST e obtém o código de resposta
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    String responsePayload = http.getString();
    Serial.printf("Servidor respondeu com codigo: %d\n", httpResponseCode);
    Serial.printf("Resposta: %s\n", responsePayload.c_str());
    
    if (httpResponseCode == 200) {
      showMessageOnOLED("Servidor OK", "UID Enviado!");
    } else {
      showMessageOnOLED("Erro no Servidor", "Codigo: " + String(httpResponseCode));
    }
    
  } else {
    Serial.printf("Falha no envio. Codigo de erro: %s\n", http.errorToString(httpResponseCode).c_str());
    showMessageOnOLED("Falha no Envio", http.errorToString(httpResponseCode).c_str());
  }
  
  // Libera os recursos do cliente HTTP
  http.end();
  delay(1500); // Aguarda para a mensagem ser lida
}

// =============================================================================
// Setup e Loop Principal
// =============================================================================

void setup() {
  Serial.begin(SERIAL_BAUD_RATE);
  Serial.println(F("\nInicializando sistema..."));

  initOLED();
  showMessageOnOLED("Iniciando...");
  delay(1000);

  initRFID();
  
  conectarWiFi(); // Conecta ao Wi-Fi antes de iniciar o loop principal

  showMessageOnOLED("Sistema Pronto", "Aproxime o cartao");
  Serial.println(F("Sistema pronto. Aproxime um cartao RFID."));
}

void loop() {
  // Se o Wi-Fi cair, tenta reconectar
  if (WiFi.status() != WL_CONNECTED) {
    conectarWiFi();
  }

  // Procura por um novo cartão RFID
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    
    String uid = uidToString(mfrc522.uid.uidByte, mfrc522.uid.size);

    Serial.print(F("Cartao detectado! UID: "));
    Serial.println(uid);

    showMessageOnOLED("Cartao detectado:", uid);
    delay(1000);

    // Chama a função que envia o UID para o servidor
    enviarUIDParaServidor(uid);

    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();

    delay(CARD_DETECT_DELAY);

    showMessageOnOLED("Sistema Pronto", "Aproxime o cartao");
    Serial.println(F("\nAguardando novo cartao..."));
  }
}
