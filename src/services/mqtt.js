const mqtt = require("mqtt");
const Parking = require("../models/Parking");

function isValidType(type) {
  return ["visitor", "resident"].includes(type);
}

async function updateParkingByDelta(type, delta) {
  if (!isValidType(type)) {
    throw new Error("Invalid parking type");
  }

  if (![1, -1].includes(delta)) {
    throw new Error("delta must be 1 or -1");
  }

  const parking = await Parking.findOne({ type });

  if (!parking) {
    throw new Error(`${type} parking setup not found`);
  }

  const usableSlot = Math.max(parking.totalSlot - parking.maintenanceSlot, 0);

  let newUsedSlot = parking.usedSlot + delta;

  if (newUsedSlot < 0) newUsedSlot = 0;
  if (newUsedSlot > usableSlot) newUsedSlot = usableSlot;

  parking.usedSlot = newUsedSlot;
  parking.availableSlot = Math.max(usableSlot - newUsedSlot, 0);

  await parking.save();

  return parking;
}

function setupMQTT(io) {
  const client = mqtt.connect(process.env.MQTT_URL, {
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS,
    reconnectPeriod: 3000,
    keepalive: 60,
    clean: true,
  });

  client.on("connect", () => {
    console.log("✅ MQTT Connected");

    client.subscribe("sos/alert");
    client.subscribe("parking/update");

    console.log("📡 Subscribed: sos/alert");
    console.log("📡 Subscribed: parking/update");
  });

  client.on("message", async (topic, message) => {
    try {
      const data = JSON.parse(message.toString());

      console.log("MQTT:", topic, data);

      if (topic === "sos/alert") {
        io.emit("sos_alert", data);
      }

      if (topic === "parking/update") {
        const updatedParking = await updateParkingByDelta(
          data.type,
          Number(data.delta)
        );

        console.log("✅ Parking Updated:", updatedParking);

        io.emit("parking_update", updatedParking);
      }
    } catch (err) {
      console.error("❌ MQTT Error:", err.message);
    }
  });

  client.on("error", (err) => {
    console.error("❌ MQTT Client Error:", err.message);
  });

  client.on("close", () => {
    console.log("⚠️ MQTT Disconnected");
  });

  return client;
}

module.exports = setupMQTT;