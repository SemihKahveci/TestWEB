/**
 * Frontend için güvenli log yönetimi
 * Production'da hassas bilgileri loglamaz
 */

type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'info';

/**
 * Production ortamını tespit eder
 * Vite'da import.meta.env.DEV ve PROD otomatik olarak mevcut
 */
const getIsProduction = (): boolean => {
    // Vite'ın otomatik env değişkenleri (diğer dosyalarda da böyle kullanılıyor)
    try {
        // @ts-ignore - Vite'ın otomatik env değişkenleri
        const isDev = (import.meta as any).env?.DEV;
        // Development'ta false, production'da true döner
        return !isDev;
    } catch (e) {
        // Fallback: hostname kontrolü
        if (typeof window !== 'undefined') {
            // Production domain'leri
            const productionDomains = ['androngame.com', 'www.androngame.com'];
            const hostname = window.location.hostname;
            return productionDomains.some(domain => hostname.includes(domain));
        }
    }
    // Güvenli varsayılan: development
    return false;
};

/**
 * Production ortamında log seviyesini kontrol eder
 * @param level - Log seviyesi
 * @param message - Log mesajı
 * @param data - Ek veri (opsiyonel)
 */
export const safeLog = (level: LogLevel, message: string, data?: any) => {
    const isProduction = getIsProduction();
    
    // Production'da sadece error logları göster
    if (isProduction && level !== 'error') {
        return;
    }
    
    // Production'da hassas bilgileri loglama
    if (isProduction && data) {
        // Kredi bilgileri, şifreler, token'lar gibi hassas verileri temizle
        const sanitizedData = sanitizeData(data);
        
        switch (level) {
            case 'error':
                console.error(message, sanitizedData);
                break;
            case 'warn':
                console.warn(message, sanitizedData);
                break;
            case 'debug':
                if (!isProduction) {
                    // console.debug bazı tarayıcılarda gizli olabilir, console.log kullan
                    console.log(message, sanitizedData);
                }
                break;
            case 'info':
                if (!isProduction) {
                    console.info(message, sanitizedData);
                }
                break;
            default:
                if (!isProduction) {
                    console.log(message, sanitizedData);
                }
        }
    } else {
        // Development'ta tüm logları göster
        switch (level) {
            case 'error':
                console.error(message, data);
                break;
            case 'warn':
                console.warn(message, data);
                break;
            case 'debug':
                // console.debug bazı tarayıcılarda gizli olabilir, console.log kullan
                console.log(message, data);
                break;
            case 'info':
                console.info(message, data);
                break;
            default:
                console.log(message, data);
        }
    }
};

/**
 * Hassas bilgileri temizler
 * @param data - Temizlenecek veri
 * @returns Temizlenmiş veri
 */
const sanitizeData = (data: any): any => {
    if (!data || typeof data !== 'object') {
        return data;
    }
    
    // Hassas alanları tespit et
    const sensitiveFields = [
        'password',
        'token',
        'access_token',
        'refresh_token',
        'secret',
        'apiKey',
        'credit',
        'totalCredits',
        'usedCredits',
        'remainingCredits',
        'credit',
        'kredi',
        'email',
        'phone',
        'ssn',
        'tc',
        'vkn'
    ];
    
    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item));
    }
    
    const sanitized: any = {};
    for (const key in data) {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveFields.some(field => 
            lowerKey.includes(field.toLowerCase())
        );
        
        if (isSensitive) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof data[key] === 'object' && data[key] !== null) {
            sanitized[key] = sanitizeData(data[key]);
        } else {
            sanitized[key] = data[key];
        }
    }
    
    return sanitized;
};

/**
 * Güvenli hata mesajı döndürür (production'da detaylı bilgi göstermez)
 * @param error - Hata objesi
 * @param defaultMessage - Varsayılan mesaj
 * @returns Güvenli hata mesajı
 */
export const getSafeErrorMessage = (error: any, defaultMessage: string = 'Bir hata oluştu'): string => {
    const isProduction = getIsProduction();
    
    if (isProduction) {
        return defaultMessage;
    }
    
    if (error?.message) {
        return error.message;
    }
    
    if (typeof error === 'string') {
        return error;
    }
    
    return defaultMessage;
};

