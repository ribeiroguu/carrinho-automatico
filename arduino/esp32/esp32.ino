// Bibliotecas essenciais 
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

void loadConfig();
void saveConfig();
void connectWiFi();
void startConfigMode();
void setupWebServer();
void handleConfigPage();
void handleScanNetworks();
void handleSaveConfig();
void handleRestart();

void connectMQTT();
void subscribeMqttTopics();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void handleLivroMessage(JsonDocument& doc);
void handleErroMessage(JsonDocument& doc);
void handleControleMessage(JsonDocument& doc);
void publishRfidTag(const String& rfidTag);

void showSplashScreen();
void updateDisplay();

void handleWaitingSession();
void handleSessionActive();
void handleError();
void checkActiveSession();

void setup() {
  Serial.begin(115200);
  preferences.begin("biblioteca", false);

  SPI.begin();
  rfid.PCD_Init();

  Wire.begin(OLED_SDA_PIN, OLED_SCL_PIN);
  display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS);
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);

  showSplashScreen();
  delay(1500);

  loadConfig();

  if (wifiSSID.length() == 0) {
    currentState = STATE_WIFI_CONFIG;
    startConfigMode();
  } else {
    currentState = STATE_CONNECTING_WIFI;
    connectWiFi();
  }

  mqttClient.setServer(mqttServer.c_str(), mqttPort);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setKeepAlive(MQTT_KEEPALIVE);
}

void loop() {
  if (currentState == STATE_WIFI_CONFIG) {
    webServer.handleClient();
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastWifiReconnect > WIFI_RECONNECT_MS) {
      currentState = STATE_CONNECTING_WIFI;
      connectWiFi();
      lastWifiReconnect = millis();
    }
    return;
  }

  if (!mqttClient.connected()) {
    if (millis() - lastMqttReconnect > MQTT_RECONNECT_MS) {
      currentState = STATE_CONNECTING_MQTT;
      connectMQTT();
      lastMqttReconnect = millis();
    }
    return;
  }

  mqttClient.loop();

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

  updateDisplay();
}

