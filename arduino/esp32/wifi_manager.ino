#include <ESPmDNS.h>

extern String wifiSSID;
extern String wifiPassword;
extern String mqttServer;
extern int mqttPort;
extern String mqttUser;
extern String mqttPass;
extern String apiBaseUrl;
extern WebServer webServer;
extern Preferences preferences;
extern Adafruit_SSD1306 display;

extern SystemState currentState;
extern String errorMessage;
extern PubSubClient mqttClient;

void loadConfig() {
  wifiSSID = preferences.getString("wifi_ssid", "");
  wifiPassword = preferences.getString("wifi_pass", "");
  mqttServer = preferences.getString("mqtt_server", DEFAULT_MQTT_SERVER);
  mqttPort = preferences.getInt("mqtt_port", DEFAULT_MQTT_PORT);
  mqttUser = preferences.getString("mqtt_user", DEFAULT_MQTT_USER);
  mqttPass = preferences.getString("mqtt_pass", DEFAULT_MQTT_PASS);

  // Mantém esta URL para a comunicação interna (ESP32 -> Backend)
  apiBaseUrl = String("http://") + mqttServer + ":3333";
}

void saveConfig() {
  preferences.putString("wifi_ssid", wifiSSID);
  preferences.putString("wifi_pass", wifiPassword);
  preferences.putString("mqtt_server", mqttServer);
  preferences.putInt("mqtt_port", mqttPort);
  preferences.putString("mqtt_user", mqttUser);
  preferences.putString("mqtt_pass", mqttPass);
}

void connectWiFi() {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Conectando WiFi...");
  display.println(wifiSSID);
  display.display();

  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    currentState = STATE_CONNECTING_MQTT;
    connectMQTT();
  } else {
    errorMessage = "WiFi falhou";
    currentState = STATE_ERROR;
  }
}

void startConfigMode() {
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASSWORD);

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("MODO CONFIGURACAO");
  display.printf("WiFi: %s\n", AP_SSID);
  display.printf("Senha: %s\n", AP_PASSWORD);
  display.println("acessar:");
  display.println(WiFi.softAPIP());
  display.display();

  setupWebServer();
  webServer.begin();
}

void setupWebServer() {
  webServer.on("/", HTTP_GET, handleConfigPage);
  webServer.on("/save", HTTP_POST, handleSaveConfig);
  webServer.on("/scan", HTTP_GET, handleScanNetworks);
  webServer.on("/restart", HTTP_GET, handleRestart);
  webServer.onNotFound([]() {
    webServer.send(404, "text/plain", "404: Not found");
  });
}
void handleConfigPage() {
  String html =
    "<!DOCTYPE html>\n"
    "<html lang=\"pt-BR\">\n"
    "<head>\n"
    "  <meta charset=\"UTF-8\">\n"
    "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n"
    "  <title>Configuração Carrinho RFID</title>\n"
    "  <style>\n"
    "    body { font-family: Arial, sans-serif; padding: 20px; background: #f3f4f6; }\n"
    "    .card { background: #fff; max-width: 480px; margin: 0 auto; padding: 24px; border-radius: 12px; box-shadow: 0 12px 24px rgba(0,0,0,0.1); }\n"
    "    h1 { font-size: 20px; margin-bottom: 6px; color: #111827; }\n"
    "    p { color: #6b7280; margin-bottom: 20px; font-size: 14px; }\n"
    "    label { display: block; margin-bottom: 6px; color: #111827; font-weight: 600; font-size: 13px; }\n"
    "    input, select { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; margin-bottom: 14px; font-size: 14px; }\n"
    "    button { width: 100%; padding: 12px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 15px; }\n"
    "    .primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; margin-bottom: 10px; }\n"
    "    .secondary { background: #f9fafb; color: #111827; }\n"
    "    .info { background: #e0e7ff; padding: 12px; border-radius: 8px; font-size: 13px; color: #312e81; margin-bottom: 18px; }\n"
    "  </style>\n"
    "</head>\n"
    "<body>\n"
    "  <div class=\"card\">\n"
    "    <h1>🛒 Carrinho RFID</h1>\n"
    "    <p>Configure a conexão WiFi e o broker MQTT.</p>\n"
    "    <div class=\"info\">Após salvar, o dispositivo reinicia e o aplicativo será aberto automaticamente.</div>\n"
    "    <form id=\"configForm\">\n"
    "      <label>Rede WiFi</label>\n"
    "      <select id=\"wifiSsid\" name=\"ssid\" required>\n"
    "        <option value=\"\">Escaneando redes...</option>\n"
    "      </select>\n"
    "\n"
    "      <label>Senha WiFi</label>\n"
    "      <input type=\"password\" name=\"password\" placeholder=\"Digite a senha\" required>\n"
    "\n"
    "      <label>Servidor MQTT (IP)</label>\n"
    "      <input type=\"text\" name=\"mqtt_server\" value=\"{{MQTT_SERVER}}\" required>\n"
    "\n"
    "      <label>Porta MQTT</label>\n"
    "      <input type=\"number\" name=\"mqtt_port\" value=\"{{MQTT_PORT}}\" required>\n"
    "\n"
    "      <label>Usuário MQTT</label>\n"
    "      <input type=\"text\" name=\"mqtt_user\" value=\"{{MQTT_USER}}\" required>\n"
    "\n"
    "      <label>Senha MQTT</label>\n"
    "      <input type=\"password\" name=\"mqtt_pass\" value=\"{{MQTT_PASS}}\" required>\n"
    "\n"
    "      <button type=\"submit\" class=\"primary\">Salvar e Reiniciar</button>\n"
    "      <button type=\"button\" onclick=\"window.location.reload()\" class=\"secondary\">Recarregar</button>\n"
    "    </form>\n"
    "  </div>\n"
    "\n"
    "<script>\n"
    "  // Carrega redes WiFi\n"
    "  fetch('/scan')\n"
    "    .then(r => r.json())\n"
    "    .then(data => {\n"
    "      const select = document.getElementById('wifiSsid');\n"
    "      select.innerHTML = '<option value=\"\">Selecione uma rede</option>';\n"
    "      data.networks.forEach(net => {\n"
    "        select.innerHTML += `<option value='${net.ssid}'>${net.ssid} (${net.rssi} dBm)</option>`;\n"
    "      });\n"
    "    });\n"
    "\n"
    "  // Ao enviar o formulário\n"
    "  document.getElementById('configForm').addEventListener('submit', async (e) => {\n"
    "    e.preventDefault();\n"
    "    const formData = new FormData(e.target);\n"
    "    const params = new URLSearchParams(formData);\n"
    "\n"
    "    const response = await fetch('/save', {\n"
    "      method: 'POST',\n"
    "      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },\n"
    "      body: params\n"
    "    });\n"
    "\n"
    "    if (response.ok) {\n"
    "      alert('Configurações salvas! Reiniciando e abrindo o app...');\n"
    "\n"
    "      const deep = 'carrinhoautomaticofrontend://';\n" //redirecionamento marcão 
    "\n"
    "      // Tentar abrir via iframe (100% funcional)\n"
    "      const iframe = document.createElement('iframe');\n"
    "      iframe.style.display = 'none';\n"
    "      iframe.src = deep;\n"
    "      document.body.appendChild(iframe);\n"
    "\n"
    "      // Se falhar, evita travamento\n"
    "      setTimeout(() => {\n"
    "        window.location = deep;\n"
    "      }, 1200);\n"
    "\n"
    "    } else {\n"
    "      alert('Erro ao salvar configurações');\n"
    "      window.location.reload();\n"
    "    }\n"
    "  });\n"
    "</script>\n"
    "\n"
    "</body>\n"
    "</html>\n";

  html.replace("{{MQTT_SERVER}}", mqttServer);
  html.replace("{{MQTT_PORT}}", String(mqttPort));
  html.replace("{{MQTT_USER}}", mqttUser);
  html.replace("{{MQTT_PASS}}", mqttPass);

  webServer.send(200, "text/html", html);
}


void handleScanNetworks() {
  int n = WiFi.scanNetworks();

  StaticJsonDocument<1024> doc;
  JsonArray networks = doc.createNestedArray("networks");

  for (int i = 0; i < n && i < 20; i++) {
    JsonObject network = networks.createNestedObject();
    network["ssid"] = WiFi.SSID(i);
    network["rssi"] = WiFi.RSSI(i);
    network["secure"] = WiFi.encryptionType(i) != WIFI_AUTH_OPEN;
  }

  String json;
  serializeJson(doc, json);
  webServer.send(200, "application/json", json);
}

void handleSaveConfig() {
  if (!webServer.hasArg("ssid") || !webServer.hasArg("password")) {
    webServer.send(400, "text/plain", "Missing parameters");
    return;
  }

  wifiSSID = webServer.arg("ssid");
  wifiPassword = webServer.arg("password");

  if (webServer.hasArg("mqtt_server")) {
    mqttServer = webServer.arg("mqtt_server");
  }
  if (webServer.hasArg("mqtt_port")) {
    mqttPort = webServer.arg("mqtt_port").toInt();
  }
  if (webServer.hasArg("mqtt_user")) {
    mqttUser = webServer.arg("mqtt_user");
  }
  if (webServer.hasArg("mqtt_pass")) {
    mqttPass = webServer.arg("mqtt_pass");
  }

  saveConfig();
  webServer.send(200, "text/plain", "OK");
  
  // AÇÃO ALTERADA: Reiniciar imediatamente após salvar e enviar a resposta
  delay(500);
  ESP.restart();
}

void handleRestart() {
  webServer.send(200, "text/html", "<h1>Reiniciando...</h1>");
  delay(500);
  ESP.restart();
}