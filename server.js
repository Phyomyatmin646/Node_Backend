require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// ── Socket.IO ──────────────────────────────────────────────────────────────────
const http = require("http");
const { Server } = require("socket.io");

const app = express();

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);

// Serve static files for the visitor display/register pages
app.use(express.static(path.join(__dirname, "public")));

// ================= DB CONNECT =================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ DB Error:", err));

// ================= VISITOR SCHEMA & MODEL =================
// Defined here so it is available to both the inline route handlers
// and can be imported from other modules if needed.
const visitorSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    company: { type: String, trim: true, default: "" },
    hostName: { type: String, required: true, trim: true },
    purpose: {
      type: String,
      enum: [
        "Meeting",
        "Interview",
        "Delivery",
        "Event",
        "Tour",
        "Service",
        "Other",
      ],
      required: true,
    },
    purposeDetail: { type: String, trim: true, default: "" },
    agreedToTerms: { type: Boolean, required: true },
    badgeNumber: { type: String },
    visitDate: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

visitorSchema.pre("save", async function (next) {
  if (this.isNew) {
    const count = await mongoose.model("Visitor").countDocuments();
    const d = new Date();
    const prefix = `V${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    this.badgeNumber = `${prefix}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

const Visitor = mongoose.model("Visitor", visitorSchema);

// ================= EXISTING ROUTES =================
const authRoutes = require("./src/routes/auth");
const protectedRoutes = require("./src/routes/protected");
const adminRoutes = require("./src/routes/admin");

const notificationRoutes = require("./src/routes/notification");
const sosRoutes = require("./src/routes/sos");
const parkingRoutes = require("./src/routes/parking");

app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/parking", parkingRoutes);
app.use("/api/announcements", require("./src/routes/announcement"));
app.use("/api/reports", require("./src/routes/report"));
app.use("/api/helpers", require("./src/routes/helperRequest"));
app.use("/api/bills", require("./src/routes/serviceBill"));

let sseClients = [];

app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const client = { id: Date.now(), res };
  sseClients.push(client);
  console.log(`📡 SSE client connected  (total: ${sseClients.length})`);

  // Keep-alive ping every 20 s to prevent proxy/load-balancer timeouts
  const ping = setInterval(() => res.write(": ping\n\n"), 20000);

  req.on("close", () => {
    clearInterval(ping);
    sseClients = sseClients.filter((c) => c.id !== client.id);
    console.log(`📡 SSE client disconnected (total: ${sseClients.length})`);
  });
});

function broadcastSSE(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((c) => c.res.write(msg));
}

const VALID_QR_TOKEN =
  process.env.VALID_QR_TOKEN || "VISITOR_ACCESS_2024_SECRET";
const DISPLAY_URL =
  process.env.REGISTRATION_FORM_URL || "http://localhost:5001/register";
const UNLOCK_TIMEOUT = parseInt(process.env.UNLOCK_TIMEOUT_SECS || "30", 10);

app.post("/api/qr-scan", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: "No token provided" });
  }

  if (token !== VALID_QR_TOKEN) {
    console.log("❌ Invalid badge token received");
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  console.log(
    "✅ Valid visitor badge scanned — broadcasting unlock to display",
  );
  broadcastSSE("unlock", {
    url: DISPLAY_URL,
    timeout: UNLOCK_TIMEOUT,
    timestamp: new Date().toISOString(),
  });

  // Also emit via Socket.IO so any React dashboard can react in real time
  const io = app.get("io");
  const onlineUsers = app.get("onlineUsers");
  if (io) {
    io.emit("visitor:badge-scanned", { timestamp: new Date().toISOString() });
  }

  res.json({ success: true, message: "Display unlocked" });
});

app.post("/api/visitors/register", async (req, res) => {
  try {
    const visitor = new Visitor(req.body);
    await visitor.save();
    console.log(
      `📋 Visitor registered: ${visitor.firstName} ${visitor.lastName} [${visitor.badgeNumber}]`,
    );

    broadcastSSE("registered", {
      name: `${visitor.firstName} ${visitor.lastName}`,
      badge: visitor.badgeNumber,
    });

    const io = app.get("io");
    if (io) {
      io.emit("visitor:registered", {
        name: `${visitor.firstName} ${visitor.lastName}`,
        badge: visitor.badgeNumber,
        time: new Date().toISOString(),
      });
    }

    res.status(201).json({
      success: true,
      message: "Registration successful!",
      data: {
        badgeNumber: visitor.badgeNumber,
        name: `${visitor.firstName} ${visitor.lastName}`,
      },
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const msgs = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: msgs.join(". ") });
    }
    console.error("Registration error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/visitors", async (req, res) => {
  try {
    const { date, purpose, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.visitDate = { $gte: start, $lte: end };
    }
    if (purpose) filter.purpose = purpose;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [visitors, total] = await Promise.all([
      Visitor.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Visitor.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: visitors,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Single visitor by ID
app.get("/api/visitors/:id", async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= DISPLAY & REGISTER HTML PAGES =================
// Laptop: open http://localhost:5001/display in fullscreen at reception desk
app.get("/display", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "display.html")),
);
// Phone:  visitor scans the QR and this page opens automatically
app.get("/register", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "register.html")),
);

// ================= HEALTH CHECK =================
app.get("/", (req, res) => res.send("🚀 API Running..."));
app.get("/health", (req, res) =>
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
  }),
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

// Track online users  { userId: socketId }
const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("⚡ Socket connected:", socket.id);

  socket.on("register", (userId) => {
    onlineUsers[userId] = socket.id;
    console.log(`👤 User registered: ${userId} → ${socket.id}`);
  });

  socket.on("disconnect", () => {
    // Remove from onlineUsers map
    const uid = Object.keys(onlineUsers).find(
      (k) => onlineUsers[k] === socket.id,
    );
    if (uid) delete onlineUsers[uid];
    console.log("❌ Socket disconnected:", socket.id);
  });
});

app.set("io", io);
app.set("onlineUsers", onlineUsers);

const PORT = process.env.PORT || 5001;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`   Dashboard    : http://localhost:5173`);
  console.log(`   Laptop QR    : http://localhost:${PORT}/display`);
  console.log(`   Phone form   : http://<LAN_IP>:${PORT}/register`);
  console.log(`   ESP32 scan   : POST http://<LAN_IP>:${PORT}/api/qr-scan`);
});
