extern Adafruit_SSD1306 display;
extern SystemState currentState;
extern String wifiSSID;
extern String sessaoCodigo;
extern String usuarioNome;
extern unsigned long sessionStartTime;
extern String errorMessage;

void showSplashScreen() {
  display.clearDisplay();
  display.setTextSize(2);
  display.setCursor(10, 12);
  display.println("CARRINHO");
  display.setTextSize(1);
  display.setCursor(34, 36);
  display.println("BIBLIOTECA");
  display.setCursor(38, 50);
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
    case STATE_CONNECTING_WIFI:
      display.println("Conectando WiFi...");
      display.println(wifiSSID);
      break;

    case STATE_CONNECTING_MQTT:
      display.println("WiFi: OK");
      display.println("Conectando MQTT...");
      break;

    case STATE_WAITING_SESSION:
      display.println("WiFi: OK");
      display.println("MQTT: OK");
      display.println("");
      display.println("Aguardando sessao");
      break;

    case STATE_SESSION_ACTIVE: {
      display.printf("Sessao: %s\n", sessaoCodigo.c_str());
      display.println(usuarioNome);
      display.println("");
      display.println("Aproxime o livro");
      unsigned long elapsed = millis() - sessionStartTime;
      unsigned long remaining = SESSION_TIMEOUT_MS - elapsed;
      int minutesLeft = remaining / 60000;
      display.println("");
      display.printf("Tempo: %d min\n", minutesLeft);
      break;
    }

    case STATE_ERROR:
      display.println("ERRO");
      display.println("");
      display.println(errorMessage);
      break;

    case STATE_WIFI_CONFIG:
      display.println("Config via WiFi");
      break;

    default:
      display.println("Inicializando...");
      break;
  }

  display.display();
}
