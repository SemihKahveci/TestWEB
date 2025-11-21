const mongoose = require('mongoose');
const Admin = require('../backend/models/Admin');
require('dotenv').config();

const createSuperAdmin = async () => {
    try {
        // MongoDB bağlantısı
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Super admin bilgileri - Şifre environment variable'dan alınmalı
        const defaultPassword = process.env.SUPER_ADMIN_PASSWORD || 'CHANGE_ME_IN_PRODUCTION';
        
        if (defaultPassword === 'CHANGE_ME_IN_PRODUCTION') {
            console.warn('⚠️  UYARI: SUPER_ADMIN_PASSWORD environment variable ayarlanmamış!');
            console.warn('⚠️  Production ortamında mutlaka güçlü bir şifre ayarlayın!');
        }

        const superAdminData = {
            email: 'info@androngame.com',
            password: defaultPassword,
            name: 'Super Admin',
            role: 'superadmin',
            isActive: true
        };

        // Mevcut super admin kontrolü
        const existingAdmin = await Admin.findOne({ email: superAdminData.email });
        if (existingAdmin) {
            console.log('Super admin zaten mevcut.');
            return;
        }

        // Yeni super admin oluştur
        const superAdmin = new Admin(superAdminData);
        await superAdmin.save();

        console.log('Super admin başarıyla oluşturuldu:');
        console.log('Email:', superAdminData.email);
        // Production'da şifreyi loglamayın
        if (process.env.NODE_ENV !== 'production') {
            console.log('Şifre:', superAdminData.password);
        } else {
            console.log('Şifre: [GÜVENLİK NEDENİYLE GİZLENDİ]');
        }

    } catch (error) {
        console.error('Super admin oluşturma hatası:', error);
    } finally {
        await mongoose.disconnect();
    }
};

createSuperAdmin(); 