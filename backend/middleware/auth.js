const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { safeLog } = require("../utils/helpers");

exports.authenticateAdmin = async (req, res, next) => {
    try {
        // Önce cookie'den token al, yoksa Authorization header'dan al
        let token = req.cookies?.access_token;
        
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith("Bearer ")) {
                token = authHeader.split(" ")[1];
            }
        }

        if (!token) {
            return res.status(401).json({ message: "Yetkilendirme token'ı eksik" });
        }

        // Token boş veya geçersiz format kontrolü
        if (typeof token !== 'string' || token.trim() === '') {
            return res.status(401).json({ message: "Geçersiz token formatı" });
        }

        // JWT_SECRET zorunlu - fallback yok
        if (!process.env.JWT_SECRET) {
            safeLog('error', "JWT_SECRET environment variable is not set!");
            return res.status(500).json({ message: "Sunucu yapılandırma hatası" });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const admin = await Admin.findById(decoded.id);
        if (!admin || !admin.isActive) {
            return res.status(401).json({ message: "Geçersiz oturum" });
        }

        req.admin = admin;
        next();
    } catch (error) {
        safeLog('error', "JWT doğrulama hatası", error);
        return res.status(401).json({ message: "Oturum doğrulanamadı" });
    }
};


exports.isSuperAdmin = (req, res, next) => {
    if (!req.admin || req.admin.role !== "superadmin") {
        return res.status(403).json({ message: "Süper admin yetkisi gerekli" });
    }
    next();
};