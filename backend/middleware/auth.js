const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const errorMessages = require('../utils/errorMessages');

// Admin kimlik doğrulama middleware'i
exports.authenticateAdmin = async (req, res, next) => {
    try {
        // Token'ı al
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json(
                errorMessages.create('Yetkilendirme token\'ı bulunamadı', 'unauthorized')
            );
        }

        // Token'ı doğrula
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'andron2025secretkey');
        
        // Admin'i bul
        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(401).json(
                errorMessages.create('Geçersiz token', 'unauthorized')
            );
        }

        // Admin aktif değilse
        if (!admin.isActive) {
            return res.status(401).json(
                errorMessages.create('Hesabınız aktif değil', 'unauthorized')
            );
        }

        // Admin bilgilerini request'e ekle
        req.admin = admin;
        next();
    } catch (error) {
        console.error('Token doğrulama hatası:', error);
        res.status(401).json(
            errorMessages.create('Geçersiz token', 'unauthorized')
        );
    }
};

// Süper admin kontrolü
exports.isSuperAdmin = async (req, res, next) => {
    try {
        if (!req.admin) {
            return res.status(401).json(
                errorMessages.create('Yetkilendirme gerekli', 'unauthorized')
            );
        }

        if (req.admin.role !== 'superadmin') {
            return res.status(403).json(
                errorMessages.create('Bu işlem için süper admin yetkisi gerekli', 'forbidden')
            );
        }

        next();
    } catch (error) {
        console.error('Yetki kontrolü hatası:', error);
        res.status(500).json(
            errorMessages.create('Sunucu hatası', 'server_error')
        );
    }
}; 