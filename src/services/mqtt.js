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
  const client = mqtt.connect(
    process.env.MQTT_URL || "mqtt://broker.hivemq.com",
  );

  client.on("connect", () => {
    console.log("✅ MQTT Connected");

    client.subscribe("sos/alert", (err) => {
      if (err) console.error("❌ SOS subscribe error:", err.message);
      else console.log("📡 Subscribed: sos/alert");
    });

    client.subscribe("parking/update", (err) => {
      if (err) console.error("❌ Parking subscribe error:", err.message);
      else console.log("📡 Subscribed: parking/update");
    });
  });

  client.on("message", async (topic, message) => {
    try {
      const data = JSON.parse(message.toString());

      console.log("MQTT:", topic, data);

      if (topic === "sos/alert") {
        io.emit("sos_alert", data);

        if (data.room_id) {
          io.to(String(data.room_id)).emit("sos_alert", data);
        }
      }

      if (topic === "parking/update") {
        const type = data.type;
        const delta = Number(data.delta);

        const updatedParking = await updateParkingByDelta(type, delta);

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
