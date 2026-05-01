const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

router.get("/profile", protect, (req, res) => {
  res.json({
    message: "Profile access granted",
    user: req.user,
  });
});

router.get("/admin", protect, authorizeRoles("Admin"), (req, res) => {
  res.json({ message: "Welcome Admin" });
});

router.get("/staff", protect, authorizeRoles("Staff", "Admin"), (req, res) => {
  res.json({ message: "Welcome Staff/Admin" });
});

module.exports = router;
