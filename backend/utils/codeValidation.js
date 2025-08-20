const UserCode = require('../models/userCode');

class CodeValidationUtils {
    /**
     * Kod geçerlilik süresini kontrol eder
     * @param {Date} expiryDate - Kodun son kullanma tarihi
     * @returns {Object} - Kontrol sonucu
     */
    static checkCodeExpiry(expiryDate) {
        const now = new Date();
        const earlyExpiryDate = new Date(expiryDate);
        earlyExpiryDate.setHours(earlyExpiryDate.getHours() - 1); // 1 saat önce süresi dolmuş sayılır
        
        return {
            isExpired: now > earlyExpiryDate,
            earlyExpiryDate
        };
    }

    /**
     * Kodu doğrular ve UserCode nesnesini döndürür
     * @param {string} code - Doğrulanacak kod
     * @returns {Object} - Doğrulama sonucu
     */
    static async validateCode(code) {
        if (!code || typeof code !== 'string') {
            throw new Error('Geçersiz kod formatı');
        }

        const trimmedCode = code.trimEnd();
        const userCode = await UserCode.findOne({ code: trimmedCode });
        
        if (!userCode) {
            throw new Error('Geçersiz kod');
        }

        // Süre kontrolü
        const expiryCheck = this.checkCodeExpiry(userCode.expiryDate);
        if (expiryCheck.isExpired) {
            // Süresi dolmuşsa durumu güncelle
            userCode.status = 'Süresi Doldu';
            await userCode.save();
            throw new Error('Kodun geçerlilik süresi dolmuş. Lütfen yeni bir kod talep edin.');
        }

        if (userCode.isUsed) {
            throw new Error('Oyun zaten tamamlanmış');
        }

        return userCode;
    }

    /**
     * Gezegen adını section numarasına çevirir
     * @param {string} planet - Gezegen adı
     * @returns {string} - Section numarası
     */
    static planetToSection(planet) {
        switch (planet.toLowerCase()) {
            case 'venus':
                return '0';
            case 'titan':
                return '1';
            default:
                return '0'; // Varsayılan
        }
    }
}

module.exports = CodeValidationUtils;
