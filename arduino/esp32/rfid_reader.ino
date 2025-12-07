extern MFRC522 rfid;
extern unsigned long lastRfidRead;
extern byte lastUID[10];
extern byte lastUIDLength;
extern String sessaoId;
extern String sessaoCodigo;
extern String usuarioNome;
extern unsigned long sessionStartTime;
extern unsigned long lastSessionCheck;
extern SystemState currentState;
extern Adafruit_SSD1306 display;
extern String apiBaseUrl;
extern PubSubClient mqttClient;

void handleWaitingSession() {
  if (sessaoCodigo.length() == 0) {
    return;
  }

  if (millis() - lastSessionCheck > 3000) {
    checkActiveSession();
    lastSessionCheck = millis();
  }
}

void handleSessionActive() {
  if (millis() - sessionStartTime > SESSION_TIMEOUT_MS) {
    sessaoId.clear();
    sessaoCodigo.clear();
    usuarioNome.clear();
    sessionStartTime = 0;
    currentState = STATE_WAITING_SESSION;
    return;
  }

  if (!rfid.PICC_IsNewCardPresent()) {
    return;
  }

  if (!rfid.PICC_ReadCardSerial()) {
    return;
  }

  if (millis() - lastRfidRead < RFID_DEBOUNCE_MS) {
    bool sameTag = rfid.uid.size == lastUIDLength;
    for (byte i = 0; i < rfid.uid.size && sameTag; i++) {
      if (rfid.uid.uidByte[i] != lastUID[i]) {
        sameTag = false;
      }
    }
    if (sameTag) {
      rfid.PICC_HaltA();
      rfid.PCD_StopCrypto1();
      return;
    }
  }

  lastRfidRead = millis();
  lastUIDLength = rfid.uid.size;
  for (byte i = 0; i < rfid.uid.size; i++) {
    lastUID[i] = rfid.uid.uidByte[i];
  }

  String rfidTag;
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) {
      rfidTag += "0";
    }
    rfidTag += String(rfid.uid.uidByte[i], HEX);
  }
  rfidTag.toUpperCase();

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("TAG LIDA");
  display.println("");
  display.println(rfidTag);
  display.println("");
  display.println("Processando...");
  display.display();

  publishRfidTag(rfidTag);

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

void handleError() {
  delay(4000);
  ESP.restart();
}

void checkActiveSession() {
  if (sessaoId.length() > 0) {
    return;
  }

  HTTPClient http;
  String url = apiBaseUrl + API_ENDPOINT_HEALTH;
  http.begin(url);
  int httpCode = http.GET();

  if (httpCode != 200) {
    http.end();
    return;
  }
  http.end();

  if (sessaoCodigo.length() == 0) {
    return;
  }

  String endpointSessao = API_ENDPOINT_SESSAO;
  endpointSessao.replace("%s", sessaoCodigo);
  String sessaoUrl = apiBaseUrl + endpointSessao;
  http.begin(sessaoUrl);
  httpCode = http.GET();

  if (httpCode == 200) {
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, http.getString());

    if (!error) {
      sessaoId = doc["sessao_id"].as<String>();
      usuarioNome = doc["usuario"].as<String>();
      sessionStartTime = millis();
      currentState = STATE_SESSION_ACTIVE;

      subscribeMqttTopics();
    }
  }

  http.end();
}