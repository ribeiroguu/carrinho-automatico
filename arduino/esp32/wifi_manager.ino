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

  apiBaseUrl = "http://" + mqttServer + ":3333";
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
  String html = R"(
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Configuração Carrinho RFID</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f3f4f6; }
    .card { background: #fff; max-width: 480px; margin: 0 auto; padding: 24px; border-radius: 12px; box-shadow: 0 12px 24px rgba(0,0,0,0.1); }
    h1 { font-size: 20px; margin-bottom: 6px; color: #111827; }
    p { color: #6b7280; margin-bottom: 20px; font-size: 14px; }
    label { display: block; margin-bottom: 6px; color: #111827; font-weight: 600; font-size: 13px; }
    input, select { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; margin-bottom: 14px; font-size: 14px; }
    button { width: 100%; padding: 12px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 15px; }
    .primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; margin-bottom: 10px; }
    .secondary { background: #f9fafb; color: #111827; }
    .info { background: #e0e7ff; padding: 12px; border-radius: 8px; font-size: 13px; color: #312e81; margin-bottom: 18px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🛒 Carrinho RFID</h1>
    <p>Configure a conexão WiFi e o broker MQTT.</p>
    <div class="info">Após salvar, o dispositivo reinicia com as novas configurações.</div>
    <form id="configForm">
      <label>Rede WiFi</label>
      <select id="wifiSsid" name="ssid" required>
        <option value="">Escaneando redes...</option>
      </select>

      <label>Senha WiFi</label>
      <input type="password" name="password" placeholder="Digite a senha" required>

      <label>Servidor MQTT (IP)</label>
      <input type="text" name="mqtt_server" value=")" + mqttServer + R"(" required>

      <label>Porta MQTT</label>
      <input type="number" name="mqtt_port" value=")" + String(mqttPort) + R"(" required>

      <label>Usuário MQTT</label>
      <input type="text" name="mqtt_user" value=")" + mqttUser + R"(" required>

      <label>Senha MQTT</label>
      <input type="password" name="mqtt_pass" value=")" + mqttPass + R"(" required>

      <button type="submit" class="primary">Salvar e Reiniciar</button>
      <button type="button" onclick="window.location.reload()" class="secondary">Recarregar</button>
    </form>
  </div>

  <script>
    fetch('/scan')
      .then(r => r.json())
      .then(data => {
        const select = document.getElementById('wifiSsid');
        select.innerHTML = '<option value="">Selecione uma rede</option>';
        data.networks.forEach(net => {
          select.innerHTML += `<option value="${net.ssid}">${net.ssid} (${net.rssi} dBm)</option>`;
        });
      });

    document.getElementById('configForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const params = new URLSearchParams(formData);

      const response = await fetch('/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });

      if (response.ok) {
        alert('Configurações salvas. Reiniciando...');
        setTimeout(() => { window.location.href = '/restart'; }, 1500);
      } else {
        alert('Erro ao salvar configurações');
        window.location.reload();
      }
    });
  </script>
</body>
</html>
  )";

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
}

void handleRestart() {
  webServer.send(200, "text/html", "<h1>Reiniciando...</h1>");
  delay(500);
  ESP.restart();
}
