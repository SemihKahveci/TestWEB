/**
 * Yardımcı fonksiyonlar - Tekrarlanan kodlar için merkezi yer
 */

/**
 * İsmin ilk harfini büyük yapar
 * @param {string} name - İsim
 * @returns {string} - Formatlanmış isim
 */
const capitalizeName = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

/**
 * Güvenli HTML escape fonksiyonu (XSS koruması)
 * @param {string} text - Escape edilecek metin
 * @returns {string} - Güvenli metin
 */
const escapeHtml = (text) => {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, (m) => map[m]);
};

/**
 * Production ortamında log seviyesini kontrol eder
 * @param {string} level - log, error, warn, debug
 * @param {string} message - Log mesajı
 * @param {any} data - Ek veri (opsiyonel)
 */
const safeLog = (level, message, data = null) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Production'da sadece error logları göster
    if (isProduction && level !== 'error') {
        return;
    }
    
    const logData = data ? { message, data } : message;
    
    switch (level) {
        case 'error':
            console.error(logData);
            break;
        case 'warn':
            console.warn(logData);
            break;
        case 'debug':
            if (!isProduction) {
                console.debug(logData);
            }
            break;
        default:
            console.log(logData);
    }
};

/**
 * Email validasyonu
 * @param {string} email - Email adresi
 * @returns {boolean} - Geçerli mi?
 */
const isValidEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Güvenli hata mesajı döndürür (production'da detaylı bilgi göstermez)
 * @param {Error} error - Hata objesi
 * @param {string} defaultMessage - Varsayılan mesaj
 * @returns {string} - Güvenli hata mesajı
 */
const getSafeErrorMessage = (error, defaultMessage = 'Bir hata oluştu') => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
        return defaultMessage;
    }
    
    return error.message || defaultMessage;
};

module.exports = {
    capitalizeName,
    escapeHtml,
    safeLog,
    isValidEmail,
    getSafeErrorMessage
};

