#ifndef CONFIG_H
#define CONFIG_H

// ===================================
// METADATA
// ===================================
#define FIRMWARE_VERSION "1.0.0"
#define DEVICE_NAME "Biblioteca_Carrinho"

// ===================================
// RFID (MFRC522)
// ===================================
#define RFID_SS_PIN 5
#define RFID_RST_PIN 2

// ===================================
// OLED DISPLAY (SSD1306 I2C)
// ===================================
#define OLED_SDA_PIN 21
#define OLED_SCL_PIN 22
#define OLED_WIDTH 128
#define OLED_HEIGHT 64
#define OLED_ADDRESS 0x3C

// ===================================
// ACCESS POINT CONFIGURATION
// ===================================
#define AP_SSID "BibliotecaRFID_Config"
#define AP_PASSWORD "biblioteca2024"
#define AP_TIMEOUT 300000

// ===================================
// WEB SERVER
// ===================================
#define WEB_SERVER_PORT 80

// ===================================
// MQTT SETTINGS (DEFAULTS)
// ===================================
#define DEFAULT_MQTT_SERVER "192.168.0.100"
#define DEFAULT_MQTT_PORT 1883
#define DEFAULT_MQTT_USER "biblioteca_esp32"
#define DEFAULT_MQTT_PASS "ESP32#Lib@2024!"
#define MQTT_KEEPALIVE 60
#define MQTT_QOS 1

// ===================================
// TIMERS
// ===================================
#define RFID_DEBOUNCE_MS 3000
#define DISPLAY_UPDATE_MS 200
#define MQTT_RECONNECT_MS 5000
#define WIFI_RECONNECT_MS 10000
#define SESSION_TIMEOUT_MS 1800000
#define OLED_MESSAGE_DURATION 3000

// ===================================
// MQTT TOPICS
// ===================================
#define MQTT_TOPIC_RFID "biblioteca/carrinho/%s/rfid"
#define MQTT_TOPIC_LIVRO "biblioteca/carrinho/%s/livro"
#define MQTT_TOPIC_ERRO "biblioteca/carrinho/%s/erro"
#define MQTT_TOPIC_CONTROLE "biblioteca/carrinho/%s/controle"

// ===================================
// API ENDPOINTS
// ===================================
#define API_ENDPOINT_HEALTH "/esp32/health"
#define API_ENDPOINT_SESSAO "/esp32/sessao-ativa?codigo=%s"

#endif