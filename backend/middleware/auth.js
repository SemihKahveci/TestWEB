const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Admin kimlik doğrulama middleware'i
exports.authenticateAdmin = async (req, res, next) => {
    try {
        // Token'ı al
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Yetkilendirme token\'ı bulunamadı' });
        }

        // Token'ı doğrula
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'andron2025secretkey');
        
        // Admin'i bul
        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(401).json({ message: 'Geçersiz token' });
        }

        // Admin aktif değilse
        if (!admin.isActive) {
            return res.status(401).json({ message: 'Hesabınız aktif değil' });
        }

        // Admin bilgilerini request'e ekle
        req.admin = admin;
        next();
    } catch (error) {
        console.error('Token doğrulama hatası:', error);
        res.status(401).json({ message: 'Geçersiz token' });
    }
};

// Süper admin kontrolü
exports.isSuperAdmin = async (req, res, next) => {
    try {
        if (!req.admin) {
            return res.status(401).json({ message: 'Yetkilendirme gerekli' });
        }

        if (req.admin.role !== 'superadmin') {
            return res.status(403).json({ message: 'Bu işlem için süper admin yetkisi gerekli' });
        }

        next();
    } catch (error) {
        console.error('Yetki kontrolü hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
}; 