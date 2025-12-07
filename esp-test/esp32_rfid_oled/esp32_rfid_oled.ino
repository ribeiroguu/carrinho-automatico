/*
 * Projeto: Leitor RFID com Display OLED no ESP32
 * Autor: [Seu Nome/Empresa]
 * Data: 07/12/2025
 * 
 * Descrição:
 * Este código realiza a leitura de tags/cartões RFID utilizando o módulo MFRC522
 * e exibe o UID (Identificador Único) em um display OLED SSD1306 de 128x64 pixels.
 * O sistema mostra mensagens de status, como "Aproxime o cartão" e "Cartão detectado".
 * 
 * O código foi estruturado para ser de fácil manutenção e expansão futura.
 */

// =============================================================================
// Inclusão de Bibliotecas
// =============================================================================
#include <SPI.h>              // Biblioteca para comunicação SPI (necessária para o RC522)
#include <MFRC522.h>          // Biblioteca para o leitor RFID MFRC522
#include <Wire.h>             // Biblioteca para comunicação I2C (necessária para o OLED)
#include <Adafruit_GFX.h>     // Biblioteca gráfica principal da Adafruit
#include <Adafruit_SSD1306.h> // Biblioteca para o controlador de display OLED SSD1306

// =============================================================================
// Definições de Pinos e Constantes
// =============================================================================

// --- Pinos para o Leitor RFID MFRC522 (Interface SPI) ---
// A ligação padrão para ESP32 com SPI (VSPI) é:
// - SCK:  GPIO 18
// - MISO: GPIO 19
// - MOSI: GPIO 23
// Os pinos RST e SS (SDA) podem ser definidos para qualquer GPIO.
#define RST_PIN  2  // Pino de Reset do RC522
#define SS_PIN   5  // Pino SS/SDA (Slave Select) do RC522

// --- Configurações do Display OLED (Interface I2C) ---
#define SCREEN_WIDTH 128 // Largura do display OLED em pixels
#define SCREEN_HEIGHT 64 // Altura do display OLED em pixels

// Endereço I2C do display OLED. O endereço 0x3C é o mais comum para displays
// de 128x64. Se o seu display não funcionar, tente o endereço 0x3D.
#define OLED_ADDR   0x3C

// --- Outras Constantes ---
#define SERIAL_BAUD_RATE 115200 // Taxa de comunicação para o Serial Monitor
#define CARD_DETECT_DELAY 3000  // Tempo (em ms) que o UID fica na tela após detecção

// =============================================================================
// Instâncias de Objetos
// =============================================================================

// Cria a instância do leitor RFID
MFRC522 mfrc522(SS_PIN, RST_PIN);

// Cria a instância do display OLED
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// =============================================================================
// Funções Auxiliares
// =============================================================================

/**
 * @brief Inicializa o display OLED.
 * 
 * Configura a comunicação I2C e exibe uma mensagem de erro no Serial Monitor
 * se o display não for encontrado.
 */
void initOLED() {
  // Inicia a comunicação I2C com o endereço definido.
  // O 'begin' retorna 'true' em caso de sucesso.
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    Serial.println(F("Falha ao iniciar display OLED. Verifique as conexões e o endereço I2C."));
    // Trava a execução se o display não for encontrado.
    while (true);
  }
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE); // Define a cor do texto (fundo preto, texto branco)
  display.display();
}

/**
 * @brief Inicializa o leitor RFID MFRC522.
 * 
 * Configura a comunicação SPI e exibe a versão do firmware do módulo no
 * Serial Monitor para verificação.
 */
void initRFID() {
  SPI.begin();          // Inicia o barramento SPI
  mfrc522.PCD_Init();   // Inicia o leitor MFRC522
  
  // Exibe informações de diagnóstico no Serial Monitor
  Serial.println(F("Leitor RFID MFRC522 inicializado."));
  mfrc522.PCD_DumpVersionToSerial(); // Mostra detalhes do firmware do leitor
}

/**
 * @brief Exibe uma mensagem centralizada no display OLED.
 * 
 * @param line1 Primeira linha de texto.
 * @param line2 Segunda linha de texto (opcional).
 */
void showMessageOnOLED(const String& line1, const String& line2 = "") {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 10);
  
  // Centraliza a primeira linha (aproximado)
  int16_t x1 = (display.width() - (line1.length() * 6)) / 2;
  display.setCursor(x1 > 0 ? x1 : 0, 10);
  display.println(line1);

  if (line2 != "") {
    // Centraliza a segunda linha (aproximado)
    int16_t x2 = (display.width() - (line2.length() * 6)) / 2;
    display.setCursor(x2 > 0 ? x2 : 0, 30);
    display.println(line2);
  }
  
  display.display();
}

/**
 * @brief Converte o array de bytes do UID para uma string hexadecimal.
 * 
 * @param buffer Ponteiro para o array de bytes do UID.
 * @param bufferSize Tamanho do buffer.
 * @return String contendo o UID em formato hexadecimal.
 */
String uidToString(byte* buffer, byte bufferSize) {
  String uid = "";
  for (byte i = 0; i < bufferSize; i++) {
    // Adiciona um zero à esquerda se o valor for menor que 0x10
    if (buffer[i] < 0x10) {
      uid += "0";
    }
    uid += String(buffer[i], HEX);
    if (i < bufferSize - 1) {
      uid += " "; // Adiciona um espaço entre os bytes para melhor legibilidade
    }
  }
  uid.toUpperCase(); // Converte para maiúsculas
  return uid;
}

// =============================================================================
// Setup e Loop Principal
// =============================================================================

/**
 * @brief Função de configuração inicial, executada uma vez na inicialização.
 */
void setup() {
  // Inicia a comunicação serial para depuração
  Serial.begin(SERIAL_BAUD_RATE);
  Serial.println(F("\nInicializando sistema RFID com ESP32..."));

  // Inicializa os periféricos
  initOLED();
  initRFID();

  // Exibe a mensagem de boas-vindas
  showMessageOnOLED("Sistema RFID ESP32", "Aproxime o cartao");

  Serial.println(F("Sistema pronto. Aproxime um cartao RFID."));
}

/**
 * @brief Loop principal, executado continuamente.
 */
void loop() {
  // 1. Procura por um novo cartão RFID
  // PICC_IsNewCardPresent(): Verifica se um novo cartão está presente.
  // PICC_ReadCardSerial(): Tenta ler o UID do cartão.
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    
    // 2. Se um cartão for detectado, obtém o UID
    String uid = uidToString(mfrc522.uid.uidByte, mfrc522.uid.size);

    // 3. Exibe o UID no Serial Monitor
    Serial.print(F("Cartao detectado! UID: "));
    Serial.println(uid);

    // 4. Exibe o UID no display OLED
    showMessageOnOLED("Cartao detectado:", uid);

    // --- PONTO DE EXPANSÃO: Lógica de Controle de Acesso ---
    // Aqui você pode adicionar a lógica para verificar se o UID lido está
    // em uma lista de UIDs autorizados.
    // 
    // Exemplo:
    // String uidsAutorizados[] = {"AB CD EF 12", "34 56 78 90"};
    // bool autorizado = false;
    // for (int i = 0; i < 2; i++) {
    //   if (uid == uidsAutorizados[i]) {
    //     autorizado = true;
    //     break;
    //   }
    // }
    // if (autorizado) {
    //   Serial.println("Acesso Permitido!");
    //   // Acionar um relé, servo motor, etc.
    // } else {
    //   Serial.println("Acesso Negado!");
    // }
    // ---------------------------------------------------------

    // --- PONTO DE EXPANSÃO: Integração com Wi-Fi/MQTT ---
    // Neste ponto, você poderia enviar o UID para um servidor ou broker MQTT.
    // 
    // Exemplo:
    // if (WiFi.status() == WL_CONNECTED) {
    //   client.publish("rfid/leitura", uid.c_str());
    // }
    // ----------------------------------------------------

    // 5. Para a comunicação com o cartão para economizar energia
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();

    // 6. Aguarda um tempo antes de voltar à tela inicial
    delay(CARD_DETECT_DELAY);

    // 7. Volta a exibir a mensagem inicial
    showMessageOnOLED("Sistema RFID ESP32", "Aproxime o cartao");
    Serial.println(F("\nAguardando novo cartao..."));
  }
}
