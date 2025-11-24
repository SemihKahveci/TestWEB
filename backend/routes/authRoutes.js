const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticateAdmin } = require("../middleware/auth");
const { adminLoginLimiter } = require("../middleware/rateLimiters");

// 🔑 Admin Login (rate-limit aktif!)
router.post("/login", adminLoginLimiter, adminController.login);

// 🚪 Logout - Cookie'yi temizle
router.post("/logout", (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie("access_token", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax"
    });
    return res.json({ success: true, message: "Çıkış başarılı" });
});

// 🛂 Token doğrulama
router.get("/verify", authenticateAdmin, (req, res) => {
    res.json({ user: req.admin });
});

module.exports = router;
