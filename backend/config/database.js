const mongoose = require('mongoose');
const path = require('path');

const connectDB = async () => {
    try {
        // URI'yi kontrol et
        console.log('Environment variables:', {
            NODE_ENV: process.env.NODE_ENV,
            MONGODB_URI_exists: !!process.env.MONGODB_URI,
            envPath: path.join(__dirname, '..', '..', '.env')
        });

        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not defined');
        }

        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Sunucu seçim zaman aşımı
            socketTimeoutMS: 45000, // Socket zaman aşımı
            family: 4 // IPv4'ü zorla
        });


        // Bağlantı hatalarını dinle
        mongoose.connection.on('error', err => {
            console.error('MongoDB bağlantı hatası:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB bağlantısı kesildi');
        });

    } catch (error) {
        console.error(`MongoDB Bağlantı Hatası: ${error.message}`);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
};

module.exports = connectDB; 