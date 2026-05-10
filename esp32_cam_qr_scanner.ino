#include <WiFi.h>
#include <HTTPClient.h>
#include <ESP32QRCodeReader.h>

const char *WIFI_SSID = "YOUR_WIFI_NAME";
const char *WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

const char *SCAN_ENDPOINT = "http://192.168.1.100:5001/api/qr-scan";

ESP32QRCodeReader reader(CAMERA_MODEL_AI_THINKER);

String lastPayload = "";
unsigned long lastScanAt = 0;
const unsigned long duplicateCooldownMs = 5000;

String escapeJson(const String &input) {
  String output;
  output.reserve(input.length() + 8);

  for (size_t i = 0; i < input.length(); i++) {
    const char ch = input.charAt(i);

    if (ch == '\\' || ch == '"') {
      output += '\\';
    }

    output += ch;
  }

  return output;
}

void connectWifi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  Serial.printf("Connecting to Wi-Fi: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startedAt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < 20000) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Wi-Fi connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Wi-Fi connection failed.");
  }
}

void sendQrToServer(const String &payload) {
  connectWifi();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot send QR payload because Wi-Fi is not connected.");
    return;
  }

  HTTPClient http;
  http.setTimeout(8000);

  if (!http.begin(SCAN_ENDPOINT)) {
    Serial.println("Failed to start HTTP client.");
    return;
  }

  http.addHeader("Content-Type", "application/json");

  const String body = "{\"token\":\"" + escapeJson(payload) + "\"}";
  const int statusCode = http.POST(body);
  const String response = http.getString();

  Serial.printf("POST %s -> %d\n", SCAN_ENDPOINT, statusCode);
  Serial.println(response);

  http.end();
}

void onQrCodeTask(void *pvParameters) {
  struct QRCodeData qrCodeData;

  while (true) {
    if (reader.receiveQrCode(&qrCodeData, 100)) {
      Serial.println("QR code detected.");

      if (!qrCodeData.valid) {
        Serial.print("Invalid QR payload: ");
        Serial.println((const char *)qrCodeData.payload);
        vTaskDelay(250 / portTICK_PERIOD_MS);
        continue;
      }

      const String payload = String((const char *)qrCodeData.payload);
      const unsigned long now = millis();

      if (
        payload == lastPayload &&
        now - lastScanAt < duplicateCooldownMs
      ) {
        Serial.println("Duplicate QR ignored.");
        vTaskDelay(250 / portTICK_PERIOD_MS);
        continue;
      }

      lastPayload = payload;
      lastScanAt = now;

      Serial.print("Decoded QR payload: ");
      Serial.println(payload);

      sendQrToServer(payload);
    }

    if (WiFi.status() != WL_CONNECTED) {
      connectWifi();
    }

    vTaskDelay(150 / portTICK_PERIOD_MS);
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("Starting ESP32-CAM QR scanner...");

  connectWifi();

  reader.setup();
  reader.beginOnCore(1);

  xTaskCreate(
    onQrCodeTask,
    "onQrCode",
    4 * 1024,
    NULL,
    4,
    NULL
  );
}

void loop() {
  delay(1000);
}
