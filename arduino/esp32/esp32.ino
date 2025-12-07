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

// ===== Variáveis globais =====
Preferences preferences;
MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
Adafruit_SSD1306 display(OLED_WIDTH, OLED_HEIGHT, &Wire, -1);
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
WebServer webServer(WEB_SERVER_PORT);

String wifiSSID;
String wifiPassword;
String mqttServer = DEFAULT_MQTT_SERVER;
int mqttPort = DEFAULT_MQTT_PORT;
String mqttUser = DEFAULT_MQTT_USER;
String mqttPass = DEFAULT_MQTT_PASS;
String apiBaseUrl;
String sessaoId;
String sessaoCodigo;
String usuarioNome;

unsigned long lastRfidRead = 0;
unsigned long lastMqttReconnect = 0;
unsigned long lastWifiReconnect = 0;
unsigned long sessionStartTime = 0;
unsigned long lastSessionCheck = 0;

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
String errorMessage;

// ===== Declarações de funções (Prototipos) =====
// Funções do wifi_manager.ino
void loadConfig();
void saveConfig();
void connectWiFi();
void startConfigMode();
void setupWebServer();
void handleConfigPage();
void handleScanNetworks();
void handleSaveConfig();
void handleRestart();

// Funções do mqtt_client.ino
void connectMQTT();
void subscribeMqttTopics();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void handleLivroMessage(JsonDocument& doc);
void handleErroMessage(JsonDocument& doc);
void handleControleMessage(JsonDocument& doc);
void publishRfidTag(const String& rfidTag);

// Funções do oled_display.ino e rfid_reader.ino / session_manager.ino
void showSplashScreen();
void updateDisplay();
void handleWaitingSession();
void handleSessionActive();
void handleError();
void checkActiveSession();

// ===== Função setup =====
void setup() {
Serial.begin(115200);
preferences.begin("biblioteca", false);

// ⚠️ PASSO TEMPORÁRIO PARA FORÇAR O MODO CONFIG (AP):
// descomente as linhas abaixo, faça upload, comente novamente e faça novo upload
 preferences.clear();
 Serial.println("Configurações limpas. Fazer novo upload sem esta linha.");
 delay(4000);
// ⚠️ FIM DO PASSO TEMPORÁRIO

// Inicializa SPI para RFID
SPI.begin();
rfid.PCD_Init();

// Inicializa I2C e OLED
Wire.begin(OLED_SDA_PIN, OLED_SCL_PIN);
display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS);
display.clearDisplay();
display.setTextSize(1);
display.setTextColor(WHITE);

showSplashScreen();
delay(1500);

// Carrega configurações salvas
loadConfig();

if (wifiSSID.length() == 0) {
currentState = STATE_WIFI_CONFIG;
startConfigMode();
} else {
currentState = STATE_CONNECTING_WIFI;
connectWiFi();
}

// Configura MQTT
mqttClient.setServer(mqttServer.c_str(), mqttPort);
mqttClient.setCallback(mqttCallback);
mqttClient.setKeepAlive(MQTT_KEEPALIVE);
}

// ===== Função loop =====
void loop() {
// WebServer de configuração
if (currentState == STATE_WIFI_CONFIG) {
webServer.handleClient();
return;
}

// Reconexão WiFi
if (WiFi.status() != WL_CONNECTED) {
if (millis() - lastWifiReconnect > WIFI_RECONNECT_MS) {
currentState = STATE_CONNECTING_WIFI;
connectWiFi();
lastWifiReconnect = millis();
}
return;
}

// Reconexão MQTT
if (!mqttClient.connected()) {
if (millis() - lastMqttReconnect > MQTT_RECONNECT_MS) {
currentState = STATE_CONNECTING_MQTT;
connectMQTT();
lastMqttReconnect = millis();
}
return;
}

mqttClient.loop();

// Estado do sistema
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
default:
break;
}

// Atualiza display OLED
updateDisplay();
}