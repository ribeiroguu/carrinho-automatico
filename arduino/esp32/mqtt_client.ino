extern PubSubClient mqttClient;
extern String sessaoId;
extern String sessaoCodigo;
extern String usuarioNome;
extern unsigned long sessionStartTime;
extern String errorMessage;
extern SystemState currentState;
extern Adafruit_SSD1306 display;
extern String mqttServer;
extern int mqttPort;
extern String mqttUser;
extern String mqttPass;

void connectMQTT() {
  if (mqttClient.connected()) {
    return;
  }

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Conectando MQTT...");
  display.display();

  String clientId = "biblioteca-esp32-";
  clientId += String(random(0xffff), HEX);

  if (mqttClient.connect(clientId.c_str(), mqttUser.c_str(), mqttPass.c_str())) {
    if (sessaoId.length() > 0) {
      subscribeMqttTopics();
    }
    currentState = STATE_WAITING_SESSION;
  } else {
    errorMessage = "MQTT falhou";
    currentState = STATE_ERROR;
  }
}

void subscribeMqttTopics() {
  if (!mqttClient.connected() || sessaoId.length() == 0) {
    return;
  }

  char topic[128];

  snprintf(topic, sizeof(topic), MQTT_TOPIC_LIVRO, sessaoId.c_str());
  mqttClient.subscribe(topic, MQTT_QOS);

  snprintf(topic, sizeof(topic), MQTT_TOPIC_ERRO, sessaoId.c_str());
  mqttClient.subscribe(topic, MQTT_QOS);

  snprintf(topic, sizeof(topic), MQTT_TOPIC_CONTROLE, sessaoId.c_str());
  mqttClient.subscribe(topic, MQTT_QOS);
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += static_cast<char>(payload[i]);
  }

  StaticJsonDocument<512> doc;
  if (deserializeJson(doc, message) != DeserializationError::Ok) {
    return;
  }

  String topicStr(topic);

  if (topicStr.indexOf("/livro") > 0) {
    handleLivroMessage(doc);
  } else if (topicStr.indexOf("/erro") > 0) {
    handleErroMessage(doc);
  } else if (topicStr.indexOf("/controle") > 0) {
    handleControleMessage(doc);
  }
}

void handleLivroMessage(JsonDocument& doc) {
  bool added = doc["added"] | false;
  String rfidTag = doc["rfid_tag"] | "";

  display.clearDisplay();
  display.setCursor(0, 0);

  if (added) {
    display.println("ADICIONADO!");
  } else {
    display.println("JA NO CARRINHO");
  }

  display.println("");
  display.println("Tag:");
  display.println(rfidTag);
  display.display();

  delay(OLED_MESSAGE_DURATION);
}

void handleErroMessage(JsonDocument& doc) {
  String error = doc["error"] | "Erro";
  String rfidTag = doc["rfid_tag"] | "";

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("ERRO");
  display.println("");
  display.println(error);
  if (!rfidTag.isEmpty()) {
    display.println(rfidTag);
  }
  display.display();

  delay(4000);
}

void handleControleMessage(JsonDocument& doc) {
  String action = doc["action"] | "";

  if (action == "finalizar") {
    sessaoId.clear();
    sessaoCodigo.clear();
    usuarioNome.clear();
    sessionStartTime = 0;
    currentState = STATE_WAITING_SESSION;
  }
}

void publishRfidTag(const String& rfidTag) {
  if (!mqttClient.connected() || sessaoId.length() == 0) {
    return;
  }

  char topic[128];
  snprintf(topic, sizeof(topic), MQTT_TOPIC_RFID, sessaoId.c_str());

  StaticJsonDocument<256> doc;
  doc["rfid_tag"] = rfidTag;
  doc["timestamp"] = millis();

  String payload;
  serializeJson(doc, payload);

  mqttClient.publish(topic, payload.c_str(), false);
}