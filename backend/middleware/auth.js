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

/**
 * Multi-tenant query helper
 * Super admin için tüm verileri, normal admin için sadece kendi company'sini döndürür
 * @param {Object} req - Express request object
 * @returns {Object} MongoDB query filter
 */
exports.getCompanyFilter = (req) => {
    if (!req.admin) {
        return {};
    }
    
    // Super admin için tüm verileri göster
    if (req.admin.role === 'superadmin') {
        return {};
    }
    
    // Normal admin için sadece kendi company'sini göster
    if (req.admin.companyId) {
        // ObjectId'yi string'e çevir ve MongoDB ObjectId olarak kullan
        const mongoose = require('mongoose');
        const companyId = req.admin.companyId instanceof mongoose.Types.ObjectId 
            ? req.admin.companyId 
            : new mongoose.Types.ObjectId(req.admin.companyId);
        
        const { safeLog } = require('../utils/helpers');
        safeLog('debug', 'Company filter applied', { 
            adminId: req.admin._id?.toString(), 
            adminEmail: req.admin.email,
            companyId: companyId.toString(),
            role: req.admin.role
        });
        
        // Sadece bu companyId'ye sahip kayıtları göster (companyId null veya undefined olanları gösterme)
        return { companyId: companyId };
    }
    
    // CompanyId yoksa hiçbir sonuç döndürme (güvenlik)
    // Eski veriler companyId olmadan kaydedilmiş olabilir, bu yüzden onları gösterme
    // Hiçbir kayıt döndürmemek için imkansız bir filtre kullan
    return { _id: null }; // Hiçbir kayıt eşleşmeyecek
};

/**
 * Yeni kayıt oluştururken companyId'yi otomatik ekler
 * @param {Object} req - Express request object
 * @param {Object} data - Kayıt verisi
 * @returns {Object} companyId eklenmiş veri
 */
exports.addCompanyIdToData = (req, data) => {
    if (!req.admin) {
        // Admin yoksa data'yı olduğu gibi döndür (güvenlik için)
        return data;
    }
    
    // Eğer data'da zaten companyId varsa, onu kullan
    if (data.companyId) {
        return data;
    }
    
    // Super admin için: companyId ekleme (tüm verilere erişimi var)
    if (req.admin.role === 'superadmin') {
        // Super admin için companyId eklenmez, data'yı olduğu gibi döndür
        return data;
    }
    
    // Normal admin için otomatik companyId ekle
    if (req.admin.companyId) {
        return { ...data, companyId: req.admin.companyId };
    }
    
    // CompanyId yoksa data'yı olduğu gibi döndür (validation hatası verecek)
    return data;
};