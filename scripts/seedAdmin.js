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

        // Super admin bilgileri
        const superAdminData = {
            email: 'info@androngame.com',
            password: 'andron2025',
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
        console.log('Şifre:', superAdminData.password);

    } catch (error) {
        console.error('Super admin oluşturma hatası:', error);
    } finally {
        await mongoose.disconnect();
    }
};

createSuperAdmin(); 