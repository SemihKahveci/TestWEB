const ResponseHandler = require('../utils/responseHandler');
const CommonUtils = require('../utils/commonUtils');

/**
 * Global hata yakalama middleware'i
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error Handler:', err);

    // MongoDB/Mongoose hataları
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return ResponseHandler.error(res, `Doğrulama hatası: ${errors.join(', ')}`, 400, 'validation_error');
    }

    if (err.name === 'CastError') {
        return ResponseHandler.error(res, 'Geçersiz ID formatı', 400, 'cast_error');
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return ResponseHandler.error(res, `${field} zaten kullanımda`, 409, 'duplicate_error');
    }

    // JWT hataları
    if (err.name === 'JsonWebTokenError') {
        return ResponseHandler.error(res, 'Geçersiz token', 401, 'jwt_error');
    }

    if (err.name === 'TokenExpiredError') {
        return ResponseHandler.error(res, 'Token süresi dolmuş', 401, 'token_expired');
    }

    // Dosya yükleme hataları
    if (err.code === 'LIMIT_FILE_SIZE') {
        return ResponseHandler.error(res, 'Dosya boyutu çok büyük', 400, 'file_size_error');
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return ResponseHandler.error(res, 'Beklenmeyen dosya alanı', 400, 'file_field_error');
    }

    // Varsayılan sunucu hatası
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Sunucu hatası oluştu';

    return ResponseHandler.error(res, message, statusCode, 'server_error');
};

/**
 * 404 hata yakalama middleware'i
 */
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Sayfa bulunamadı - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

/**
 * Async hata yakalama wrapper'ı
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Request logging middleware'i
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    
    next();
};

/**
 * CORS middleware'i
 */
const corsHandler = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
};

/**
 * Rate limiting middleware'i (basit)
 */
const rateLimiter = (() => {
    const requests = new Map();
    const WINDOW_MS = 15 * 60 * 1000; // 15 dakika
    const MAX_REQUESTS = 100; // 15 dakikada maksimum 100 istek

    return (req, res, next) => {
        const ip = req.ip;
        const now = Date.now();
        
        if (!requests.has(ip)) {
            requests.set(ip, { count: 1, resetTime: now + WINDOW_MS });
        } else {
            const userRequests = requests.get(ip);
            
            if (now > userRequests.resetTime) {
                userRequests.count = 1;
                userRequests.resetTime = now + WINDOW_MS;
            } else {
                userRequests.count++;
                
                if (userRequests.count > MAX_REQUESTS) {
                    return ResponseHandler.error(res, 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.', 429, 'rate_limit');
                }
            }
        }
        
        next();
    };
})();

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    requestLogger,
    corsHandler,
    rateLimiter
};
