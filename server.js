require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// socket
const http = require("http");
const { Server } = require("socket.io");

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ================= DB CONNECT =================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ DB Error:", err));

// ================= ROUTES =================
const authRoutes = require("./src/routes/auth");
const protectedRoutes = require("./src/routes/protected");
const adminRoutes = require("./src/routes/admin");

// 👉 New routes (Real-time system)
const notificationRoutes = require("./src/routes/notification");
const sosRoutes = require("./src/routes/sos");
const parkingRoutes = require("./src/routes/parking");

app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/admin", adminRoutes);

// 🔥 add these
app.use("/api/notifications", notificationRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/parking", parkingRoutes);
app.use("/api/announcements", require("./src/routes/announcement"));
app.use("/api/reports", require("./src/routes/report"));
app.use("/api/helpers", require("./src/routes/helperRequest"));
app.use("/api/visitors", require("./src/routes/visitor"));
app.use("/api/bills", require("./src/routes/serviceBill"));

// ================= TEST =================
app.get("/", (req, res) => {
  res.send("🚀 API Running...");
});

// ================= SOCKET.IO =================
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

// store users
const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  socket.on("register", (userId) => {
    onlineUsers[userId] = socket.id;
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected");
  });
});

// share globally
app.set("io", io);
app.set("onlineUsers", onlineUsers);

// ================= SERVER =================
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
require("dotenv").config();
