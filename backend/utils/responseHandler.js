const CommonUtils = require('./commonUtils');
const errorMessages = require('./errorMessages');

class ResponseHandler {
    /**
     * Başarılı yanıt gönderir
     * @param {Object} res - Express response objesi
     * @param {string} message - Başarı mesajı
     * @param {any} data - Yanıt verisi
     * @param {number} statusCode - HTTP durum kodu
     */
    static success(res, message, data = null, statusCode = 200) {
        return res.status(statusCode).json(
            CommonUtils.createSuccessResponse(message, data)
        );
    }

    /**
     * Hata yanıtı gönderir
     * @param {Object} res - Express response objesi
     * @param {string} message - Hata mesajı
     * @param {number} statusCode - HTTP durum kodu
     * @param {string} type - Hata tipi
     */
    static error(res, message, statusCode = 400, type = 'error') {
        return res.status(statusCode).json(
            errorMessages.create(message, type)
        );
    }

    /**
     * Hata mesajı anahtarından yanıt gönderir
     * @param {Object} res - Express response objesi
     * @param {string} messageKey - Hata mesajı anahtarı
     * @param {Object} params - Mesaj parametreleri
     * @param {number} statusCode - HTTP durum kodu
     */
    static errorFromKey(res, messageKey, params = {}, statusCode = 400) {
        const message = errorMessages.get(messageKey, params);
        return this.error(res, message, statusCode);
    }

    /**
     * Doğrulama hatası gönderir
     * @param {Object} res - Express response objesi
     * @param {string} field - Hatalı alan
     * @param {string} message - Hata mesajı
     */
    static validationError(res, field, message) {
        return res.status(400).json({
            success: false,
            message: message,
            field: field,
            type: 'validation_error',
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Sayfa bulunamadı hatası gönderir
     * @param {Object} res - Express response objesi
     * @param {string} resource - Bulunamayan kaynak
     */
    static notFound(res, resource = 'Kayıt') {
        return this.error(res, `${resource} bulunamadı`, 404, 'not_found');
    }

    /**
     * Yetkisiz erişim hatası gönderir
     * @param {Object} res - Express response objesi
     */
    static unauthorized(res) {
        return this.error(res, 'Yetkisiz erişim', 401, 'unauthorized');
    }

    /**
     * Sunucu hatası gönderir
     * @param {Object} res - Express response objesi
     * @param {Error} error - Hata objesi
     */
    static serverError(res, error) {
        console.error('Server Error:', error);
        return this.error(res, 'Sunucu hatası oluştu', 500, 'server_error');
    }

    /**
     * Try-catch wrapper fonksiyonu
     * @param {Function} asyncFunction - Çalıştırılacak async fonksiyon
     * @returns {Function} - Express middleware fonksiyonu
     */
    static asyncHandler(asyncFunction) {
        return (req, res, next) => {
            Promise.resolve(asyncFunction(req, res, next)).catch(next);
        };
    }

    /**
     * Pagination yanıtı oluşturur
     * @param {Object} res - Express response objesi
     * @param {Array} data - Veri listesi
     * @param {Object} pagination - Pagination bilgileri
     * @param {string} message - Başarı mesajı
     */
    static paginated(res, data, pagination, message = 'Veriler başarıyla getirildi') {
        return res.status(200).json({
            success: true,
            message: message,
            data: data,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total: data.length,
                hasNext: data.length === pagination.limit
            },
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = ResponseHandler;
