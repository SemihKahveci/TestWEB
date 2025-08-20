class ErrorMessages {
    constructor() {
        this.messages = {
            // Genel hatalar
            serverError: 'Sunucu hatası oluştu',
            invalidData: 'Geçersiz veri formatı',
            notFound: 'Kayıt bulunamadı',
            unauthorized: 'Yetkisiz erişim',
            forbidden: 'Bu işlem için yetkiniz yok',
            
            // Kod ile ilgili hatalar
            codeRequired: 'Kod alanı zorunludur',
            invalidCode: 'Geçersiz veya kullanılmış kod',
            codeExpired: 'Kodun geçerlilik süresi dolmuş. Lütfen yeni bir kod talep edin.',
            gameCompleted: 'Oyun zaten tamamlanmış',
            codeNotFound: 'Kod bulunamadı',
            
            // Kullanıcı ile ilgili hatalar
            emailRequired: 'E-posta adresi zorunludur',
            nameRequired: 'Ad soyad zorunludur',
            invalidEmail: 'Geçersiz e-posta formatı',
            emailExists: 'Bu e-posta adresi zaten kullanımda',
            userNotFound: 'Kullanıcı bulunamadı',
            
            // Oyun ile ilgili hatalar
            gameNotFound: 'Oyun bulunamadı',
            gameInProgress: 'Oyun devam ediyor',
            gameCompleted: 'Oyun tamamlandı',
            invalidAnswers: 'Geçersiz cevap formatı',
            
            // Admin ile ilgili hatalar
            adminRequired: 'Admin yetkisi gerekli',
            adminNotFound: 'Admin bulunamadı',
            invalidCredentials: 'Geçersiz kullanıcı adı veya şifre',
            
            // Dosya ile ilgili hatalar
            fileNotFound: 'Dosya bulunamadı',
            fileUploadError: 'Dosya yükleme hatası',
            invalidFileType: 'Geçersiz dosya türü',
            
            // E-posta ile ilgili hatalar
            emailSendError: 'E-posta gönderme hatası',
            emailTemplateError: 'E-posta şablonu hatası',
            
            // PDF ile ilgili hatalar
            pdfGenerationError: 'PDF oluşturma hatası',
            pdfNotFound: 'PDF dosyası bulunamadı',
            
            // WebSocket ile ilgili hatalar
            websocketError: 'WebSocket bağlantı hatası',
            connectionFailed: 'Bağlantı başarısız',
            
            // Veritabanı ile ilgili hatalar
            databaseError: 'Veritabanı hatası',
            connectionError: 'Veritabanı bağlantı hatası',
            queryError: 'Sorgu hatası',
            
            // Doğrulama hataları
            validationError: 'Doğrulama hatası',
            requiredField: 'Bu alan zorunludur',
            invalidFormat: 'Geçersiz format',
            minLength: 'Minimum uzunluk gereksinimi karşılanmıyor',
            maxLength: 'Maksimum uzunluk aşıldı',
            
            // İşlem hataları
            operationFailed: 'İşlem başarısız',
            deleteFailed: 'Silme işlemi başarısız',
            updateFailed: 'Güncelleme işlemi başarısız',
            createFailed: 'Oluşturma işlemi başarısız',
            
            // Başarı mesajları
            success: 'İşlem başarılı',
            created: 'Başarıyla oluşturuldu',
            updated: 'Başarıyla güncellendi',
            deleted: 'Başarıyla silindi',
            saved: 'Başarıyla kaydedildi',
            sent: 'Başarıyla gönderildi'
        };
    }

    /**
     * Hata mesajını alır
     * @param {string} key - Mesaj anahtarı
     * @param {Object} params - Değiştirilecek parametreler
     * @returns {string} - Hata mesajı
     */
    get(key, params = {}) {
        let message = this.messages[key] || key;
        
        // Parametreleri değiştir
        Object.keys(params).forEach(param => {
            message = message.replace(`{${param}}`, params[param]);
        });
        
        return message;
    }

    /**
     * Özel hata mesajı oluşturur
     * @param {string} message - Mesaj
     * @param {string} type - Hata tipi
     * @returns {Object} - Hata objesi
     */
    create(message, type = 'error') {
        return {
            success: false,
            message: message,
            type: type,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Standart hata yanıtı oluşturur
     * @param {string} key - Mesaj anahtarı
     * @param {Object} params - Parametreler
     * @param {number} statusCode - HTTP durum kodu
     * @returns {Object} - Hata yanıtı
     */
    response(key, params = {}, statusCode = 400) {
        return {
            statusCode,
            ...this.create(this.get(key, params))
        };
    }
}

// Singleton instance
const errorMessages = new ErrorMessages();

module.exports = errorMessages;
