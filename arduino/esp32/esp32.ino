#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// --- OLED ----
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// --- RFID ----
#define SS_PIN  5
#define RST_PIN 2
MFRC522 rfid(SS_PIN, RST_PIN);

// UID autorizado
byte authorizedUID[] = {0x0B, 0x23, 0x9B, 0x15};

void setup() {
  Serial.begin(9600);

  // Inicializa SPI e RFID
  SPI.begin();
  rfid.PCD_Init();

  // Inicializa I2C (OLED)
  Wire.begin(21, 22); // SDA, SCL

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("Falha ao iniciar OLED");
    while (true);
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);
  display.println("Aproxime o cartao");
  display.display();
}

void loop() {

  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }

  Serial.print("UID: ");
  bool authorized = true;

  for (byte i = 0; i < rfid.uid.size; i++) {
    Serial.print(rfid.uid.uidByte[i], HEX);
    Serial.print(" ");

    if (rfid.uid.uidByte[i] != authorizedUID[i]) {
      authorized = false;
    }
  }

  Serial.println();

  display.clearDisplay();
  display.setCursor(0, 0);

  if (authorized) {
    display.println("ACESSO PERMITIDO");
    display.println("Bem-vindo!");
  } else {
    display.println("ACESSO NEGADO");
    display.println("Cartao invalido");
  }

  display.display();
  delay(2000);

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Aproxime o cartao");
  display.display();

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}