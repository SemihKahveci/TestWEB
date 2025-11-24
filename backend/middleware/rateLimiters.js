const rateLimit = require("express-rate-limit");

// 🔐 Admin login brute-force koruma
const adminLoginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,  // 10 dakika
    max: 10,                   // 10 başarısız deneme limiti
    message: {
        success: false,
        message: "Çok fazla başarısız giriş denemesi. Lütfen birkaç dakika sonra tekrar deneyin."
    },
    standardHeaders: true,     // RateLimit-* header'ları aktif
    legacyHeaders: false,
    skipSuccessfulRequests: true // Başarılı girişleri sayma (sadece başarısız denemeleri say)
});

module.exports = {
    adminLoginLimiter
};

