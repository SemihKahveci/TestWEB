const mongoose = require('mongoose');
const { safeLog } = require('../utils/helpers');

/**
 * MongoDB bağlantısını retry mekanizması ile kurar
 * @param {number} retryCount - Mevcut deneme sayısı
 * @param {number} maxRetries - Maksimum deneme sayısı
 */
const connectWithRetry = async (retryCount = 0, maxRetries = 5) => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not defined');
        }

        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000, // 30 saniye - daha uzun timeout
            socketTimeoutMS: 60000, // 60 saniye - daha uzun socket timeout
            connectTimeoutMS: 30000, // 30 saniye - daha uzun bağlantı timeout
            maxPoolSize: 20, // Daha fazla bağlantı havuzu
            minPoolSize: 5, // Daha fazla minimum bağlantı
            maxIdleTimeMS: 60000, // 60 saniye idle time
            retryWrites: true,
            retryReads: true,
            family: 4, // IPv4 kullan
            heartbeatFrequencyMS: 10000, // Daha sık heartbeat
            maxStalenessSeconds: 90, // Stale okuma toleransı
        });
        safeLog('debug', '✅ MongoDB bağlantısı başarılı');
    } catch (err) {
        safeLog('error', `❌ MongoDB bağlantı hatası (Deneme ${retryCount + 1}/${maxRetries}):`, err);
        
        if (retryCount < maxRetries - 1) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s, 8s, 16s
            safeLog('debug', `⏳ ${delay/1000} saniye sonra tekrar denenecek...`);
            setTimeout(() => connectWithRetry(retryCount + 1, maxRetries), delay);
        } else {
            safeLog('error', '💥 MongoDB bağlantısı kurulamadı, maksimum deneme sayısına ulaşıldı');
            process.exit(1);
        }
    }
};

/**
 * MongoDB bağlantı event listener'larını ayarlar
 */
const setupConnectionListeners = () => {
    mongoose.connection.on('connected', () => {
        safeLog('debug', '✅ MongoDB bağlantısı aktif');
    });

    mongoose.connection.on('error', (err) => {
        safeLog('error', '❌ MongoDB bağlantı hatası:', err);
        safeLog('error', 'Hata detayları:', {
            name: err.name,
            message: err.message,
            code: err.code,
            codeName: err.codeName
        });
    });

    mongoose.connection.on('disconnected', () => {
        safeLog('warn', '⚠️ MongoDB bağlantısı kesildi');
    });

    mongoose.connection.on('reconnected', () => {
        safeLog('debug', '🔄 MongoDB bağlantısı yeniden kuruldu');
    });

    mongoose.connection.on('close', () => {
        safeLog('debug', '🔒 MongoDB bağlantısı kapatıldı');
    });

    mongoose.connection.on('open', () => {
        safeLog('debug', '🚀 MongoDB bağlantısı açık ve hazır');
    });
};

/**
 * MongoDB bağlantısını başlatır
 */
const connectDB = async () => {
    // Event listener'ları ayarla
    setupConnectionListeners();
    
    // Bağlantıyı retry mekanizması ile başlat
    await connectWithRetry();
};

/**
 * Graceful shutdown için MongoDB bağlantısını kapatır
 */
const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        safeLog('debug', 'MongoDB bağlantısı kapatıldı');
    } catch (error) {
        safeLog('error', 'MongoDB bağlantısı kapatılırken hata:', error);
    }
};

module.exports = {
    connectDB,
    disconnectDB,
    connectWithRetry
};
