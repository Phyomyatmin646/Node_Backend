# 🏙️ Smart City Backend

A real-time smart city management backend built with **Node.js**, **Express**, **MongoDB**, and **Socket.IO** — featuring an **ESP32-CAM visitor registration system** with QR code scanning, live notifications, SOS alerts, parking management, and more.

---

## 📋 Table of Contents

- [Features](#-features)
- [System Architecture](#-system-architecture)
- [ESP32-CAM Visitor Flow](#-esp32-cam-visitor-flow)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Server](#-running-the-server)
- [API Endpoints](#-api-endpoints)
- [ESP32-CAM Setup](#-esp32-cam-setup)
- [Visitor Badge QR](#-visitor-badge-qr)
- [Deployment (Render)](#-deployment-render)
- [WebSocket Events](#-websocket-events)
- [Tech Stack](#-tech-stack)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | JWT-based login & role management |
| 👤 **Visitor Registration** | QR-triggered phone form → MongoDB |
| 📷 **ESP32-CAM Scanner** | Reads visitor badge QR, unlocks display |
| 📡 **Real-time SSE** | Server-Sent Events push QR to laptop display |
| ⚡ **Socket.IO** | Live dashboard updates for all events |
| 🚨 **SOS Alerts** | Emergency alert system with real-time broadcast |
| 🅿️ **Parking Management** | Slot tracking and assignments |
| 📢 **Announcements** | Community-wide notice board |
| 🧾 **Service Bills** | Billing and payment tracking |
| 📊 **Reports** | Incident and activity reports |
| 🤝 **Helper Requests** | Resident assistance requests |
| 🔔 **Notifications** | Per-user push notifications |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        SMART CITY SYSTEM                     │
├──────────────┬──────────────────┬───────────────────────────┤
│  ESP32-CAM   │   Laptop Display  │      Visitor Phone        │
│              │  (localhost/display)│  (scans QR from display) │
│  Scans badge │◄── SSE unlock ───│                           │
│  POST /qr-scan│                  │  Opens /register form     │
└──────┬───────┴──────────────────┴───────────┬───────────────┘
       │                                       │
       ▼                                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Node.js Express Server                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  REST API │  │ Socket.IO│  │   SSE    │  │  Static   │  │
│  │ /api/...  │  │ realtime │  │ /events  │  │  /public  │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
                         ┌────────────────┐
                         │   MongoDB Atlas │
                         │   (Database)    │
                         └────────────────┘
```

---

## 📷 ESP32-CAM Visitor Flow

```
1. Visitor arrives at reception
       │
       ▼
2. Holds QR badge towards ESP32-CAM
       │
       ▼
3. ESP32-CAM reads QR → POST /api/qr-scan {token}
       │
       ├── ❌ Invalid token → reject (LED flashes rapidly)
       │
       └── ✅ Valid token → server broadcasts SSE "unlock" event
                   │
                   ▼
4. Laptop display (localhost:5001/display) receives SSE
   → Shows registration form QR code on screen
       │
       ▼
5. Visitor scans laptop QR with phone camera
   → Phone opens http://<LAN_IP>:5001/register
       │
       ▼
6. Visitor fills form → POST /api/visitors/register
       │
       ▼
7. Data saved to MongoDB
   + SSE "registered" → laptop shows "Welcome!" flash
   + Socket.IO "visitor:registered" → React dashboard updates
```

---

## 📁 Project Structure

```
smart-city-backend/
│
├── server.js                    # Main entry point
├── package.json
├── .env                         # Environment variables (never commit)
├── .env.example                 # Template for env vars
│
├── public/                      # Static files served by Express
│   ├── display.html             # 📺 Laptop reception screen (SSE + QR)
│   └── register.html            # 📱 Visitor phone registration form
│
└── src/
    ├── config/                  # DB and app configuration
    │
    ├── middleware/              # Auth, role checks, etc.
    │
    ├── models/                  # Mongoose schemas
    │   ├── Advertisement.js
    │   ├── Announcement.js
    │   ├── Helper.js
    │   ├── HelperRequest.js
    │   ├── Notification.js
    │   ├── Report.js
    │   ├── ResParking.js
    │   ├── Room.js
    │   ├── ServiceBill.js
    │   ├── SosAlert.js
    │   ├── User.js
    │   ├── Visitor.js           # ← Visitor + badge + check-in/out
    │   └── VisParking.js
    │
    ├── routes/                  # Express routers
    │   ├── admin.js
    │   ├── announcement.js
    │   ├── auth.js
    │   ├── helperRequest.js
    │   ├── notification.js
    │   ├── parking.js
    │   ├── protected.js
    │   ├── report.js
    │   ├── serviceBill.js
    │   ├── sos.js
    │   └── visitor.js           # ← /register /checkin /checkout
    │
    └── services/
        └── mqtt.js              # MQTT broker integration
```

---

## ✅ Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **MongoDB Atlas** account (free tier works) or local MongoDB
- **ESP32-CAM** module (AI-Thinker) — for the QR scanner hardware

---

## 🚀 Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/smart-city-backend.git
cd smart-city-backend

# 2. Install dependencies
npm install

# 3. Start the server
node server.js
```

---

## ▶️ Running the Server

```bash
# Development (with auto-restart)
npx nodemon server.js

# Production
node server.js
```

On startup you'll see:

```
✅ MongoDB Connected
🚀 Server running on port 5001
   Dashboard  : http://localhost:5173
   Display    : http://localhost:5001/display
   Register   : http://192.168.1.x:5001/register
   ESP32 scan : POST http://192.168.1.x:5001/api/qr-scan
```

Open **`http://localhost:5001/display`** fullscreen on the reception laptop.

---
### Pages
| URL | Description |
|---|---|
| `/display` | Laptop reception display (open fullscreen) |
| `/register` | Visitor phone registration form |

---

## 🔧 ESP32-CAM Setup

### Hardware Required
- AI-Thinker ESP32-CAM module
- FTDI USB-to-Serial adapter (for flashing)
- Optional: 0.96" SSD1306 OLED display

### Arduino Libraries (install via Library Manager)
```
- ESP32 board support by Espressif
- ESP32-QR-Code-Reader (quirc) by alvarowolfx
```

### Key configuration in `esp32cam_scanner.ino`
```cpp
const char* WIFI_SSID        = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD    = "YOUR_WIFI_PASSWORD";
const char* LAPTOP_SERVER_IP = "192.168.1.x";   // your server LAN IP
const int   LAPTOP_PORT      = 5001;
const char* VALID_QR_TOKEN   = "VISITOR_ACCESS_2024_SECRET"; // must match .env
```

### Flashing Steps
1. Connect GPIO0 → GND on ESP32-CAM
2. Upload sketch via FTDI adapter
3. Remove GPIO0 → GND jumper
4. Press Reset button
5. Open Serial Monitor at 115200 baud — you'll see the IP address

---

## 🪪 Visitor Badge QR

All visitors use the **same shared badge QR code**. Generate it once:

1. Go to any free QR generator (e.g. qr-code-generator.com)
2. Set content to exactly: `VISITOR_ACCESS_2024_SECRET`
   *(or whatever you set as `VALID_QR_TOKEN` in `.env`)*
3. Print or display on a card/lanyard

> **Security note:** For production, consider generating per-visitor tokens stored in the database and validating against those instead of a shared secret.

---

## ☁️ Deployment (Render)

### Backend → Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Configure:

| Setting | Value |
|---|---|
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Instance Type | Free (or Starter for no sleep) |

5. Add all environment variables from `.env`
6. Set `REGISTRATION_FORM_URL` to `https://your-app.onrender.com/register`

### Frontend → Vercel

```bash
# In your React project
vercel deploy
```

Set `VITE_API_URL=https://your-app.onrender.com` in Vercel environment variables.

### MongoDB → Atlas

## ⚡ WebSocket Events

### Server → Client (emitted by server)

| Event | Payload | Trigger |
|---|---|---|
| `visitor:badge-scanned` | `{ timestamp }` | ESP32 scans valid badge |
| `visitor:registered` | `{ name, badge, time }` | Visitor completes form |
| `visitor_checkin` | `visitor object` | Any check-in method |
| `visitor_checkout` | `visitor object` | Visitor checks out |

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `register` | `userId` | Associate socket with user ID |

### Usage in React
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5001');
socket.emit('register', userId);

socket.on('visitor:registered', ({ name, badge }) => {
  console.log(`${name} checked in with badge ${badge}`);
});
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Real-time | Socket.IO + SSE |
| Auth | JWT (jsonwebtoken) |
| Hardware | ESP32-CAM (Arduino) |
| QR Scanning | quirc library (on-device) |
| Frontend (separate) | React + Vite |
| Deployment | Render (backend) + Vercel (frontend) |
| DB Hosting | MongoDB Atlas |

---

## 📝 License

MIT — free to use and modify.
