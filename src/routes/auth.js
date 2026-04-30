const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { fullname, email, phone, password, role, room_id } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists)
      return res
        .status(400)
        .json({ message: "Email သို့မဟုတ် ဖုန်း ရှိပြီးသားပါ" });

    const newUser = new User({
      fullname,
      email,
      phone,
      password,
      role,
      room_id,
    });
    await newUser.save();
    res.status(201).json({ message: "Register လုပ်ခြင်း အောင်မြင်ပါသည်" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login/step1", async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .json({ message: "ဖုန်းနံပါတ် သို့မဟုတ် Password မှားနေသည်" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    console.log(`[OTP DEBUG] Phone: ${phone}, OTP: ${otp}`);
    res.status(200).json({ message: "OTP ပို့လိုက်ပါပြီ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login/step2", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const user = await User.findOne({
      phone,
      otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user)
      return res
        .status(400)
        .json({ message: "OTP မှားနေသည် သို့မဟုတ် သက်တမ်းကုန်ပြီ" });

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );
    res
      .status(200)
      .json({ token, user: { fullname: user.fullname, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/forgot-password/step1", async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: "အကောင့်မရှိပါ" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    console.log(`[FORGOT OTP] Phone: ${phone}, OTP: ${otp}`);
    res.status(200).json({ message: "OTP ပို့လိုက်ပါပြီ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/forgot-password/step2", async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;
    const user = await User.findOne({
      phone,
      otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "OTP မှားယွင်းနေပါသည်" });

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res
      .status(200)
      .json({ message: "Password အသစ်ပြောင်းလဲခြင်း အောင်မြင်ပါသည်" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
