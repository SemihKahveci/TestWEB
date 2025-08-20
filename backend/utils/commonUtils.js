const mongoose = require('mongoose');

class CommonUtils {
    /**
     * Tarih formatını standartlaştırır
     * @param {Date|string} date - Formatlanacak tarih
     * @returns {string} - Formatlanmış tarih
     */
    static formatDate(date) {
        if (!date) return '-';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';
        
        return d.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * E-posta adresini normalize eder (küçük harfe çevirir)
     * @param {string} email - Normalize edilecek e-posta
     * @returns {string} - Normalize edilmiş e-posta
     */
    static normalizeEmail(email) {
        return email ? email.toLowerCase().trim() : '';
    }

    /**
     * Güvenli string temizleme
     * @param {string} str - Temizlenecek string
     * @returns {string} - Temizlenmiş string
     */
    static sanitizeString(str) {
        if (!str || typeof str !== 'string') return '';
        return str.trim();
    }

    /**
     * MongoDB ObjectId'nin geçerli olup olmadığını kontrol eder
     * @param {string} id - Kontrol edilecek ID
     * @returns {boolean} - Geçerli mi?
     */
    static isValidObjectId(id) {
        return mongoose.Types.ObjectId.isValid(id);
    }

    /**
     * Hata mesajlarını standartlaştırır
     * @param {string} message - Hata mesajı
     * @param {string} type - Hata tipi
     * @returns {Object} - Standart hata objesi
     */
    static createErrorResponse(message, type = 'error') {
        return {
            success: false,
            message: message,
            type: type,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Başarı mesajlarını standartlaştırır
     * @param {string} message - Başarı mesajı
     * @param {any} data - Ek veri
     * @returns {Object} - Standart başarı objesi
     */
    static createSuccessResponse(message, data = null) {
        return {
            success: true,
            message: message,
            data: data,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Sayısal değeri güvenli şekilde dönüştürür
     * @param {any} value - Dönüştürülecek değer
     * @param {number} defaultValue - Varsayılan değer
     * @returns {number} - Sayısal değer
     */
    static safeNumber(value, defaultValue = 0) {
        const num = parseFloat(value);
        return isNaN(num) ? defaultValue : num;
    }

    /**
     * Array'i güvenli şekilde kontrol eder
     * @param {any} arr - Kontrol edilecek değer
     * @returns {boolean} - Array mi?
     */
    static isArray(arr) {
        return Array.isArray(arr) && arr.length > 0;
    }

    /**
     * Object'i güvenli şekilde kontrol eder
     * @param {any} obj - Kontrol edilecek değer
     * @returns {boolean} - Geçerli object mi?
     */
    static isValidObject(obj) {
        return obj && typeof obj === 'object' && !Array.isArray(obj);
    }

    /**
     * Pagination parametrelerini hazırlar
     * @param {Object} query - Query parametreleri
     * @returns {Object} - Pagination objesi
     */
    static preparePagination(query) {
        const page = this.safeNumber(query.page, 1);
        const limit = this.safeNumber(query.limit, 10);
        const skip = (page - 1) * limit;

        return {
            page,
            limit,
            skip,
            sort: query.sort || { createdAt: -1 }
        };
    }

    /**
     * Filtre parametrelerini hazırlar
     * @param {Object} query - Query parametreleri
     * @returns {Object} - Filtre objesi
     */
    static prepareFilters(query) {
        const filters = {};

        // E-posta filtresi
        if (query.email) {
            filters.email = { $regex: this.normalizeEmail(query.email), $options: 'i' };
        }

        // İsim filtresi
        if (query.name) {
            filters.name = { $regex: this.sanitizeString(query.name), $options: 'i' };
        }

        // Durum filtresi
        if (query.status) {
            filters.status = query.status;
        }

        // Tarih aralığı filtresi
        if (query.startDate && query.endDate) {
            filters.createdAt = {
                $gte: new Date(query.startDate),
                $lte: new Date(query.endDate)
            };
        }

        return filters;
    }
}

module.exports = CommonUtils;
