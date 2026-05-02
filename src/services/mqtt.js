const mqtt = require("mqtt");

function setupMQTT(io) {
  const client = mqtt.connect("mqtt://broker-url");

  client.on("connect", () => {
    console.log("MQTT Connected");

    // subscribe topics
    client.subscribe("sos/alert");
    client.subscribe("parking/update");
  });

  client.on("message", (topic, message) => {
    try {
      const data = JSON.parse(message.toString());

      console.log("MQTT:", topic, data);

      // =========================
      // SOS EVENT
      // =========================
      if (topic === "sos/alert") {
        io.to(data.room_id).emit("sos_alert", data);
      }

      // =========================
      // PARKING EVENT
      // =========================
      if (topic === "parking/update") {
        io.emit("parking_update", data);
      }
    } catch (err) {
      console.error("MQTT Error:", err);
    }
  });

  return client;
}

module.exports = setupMQTT;
