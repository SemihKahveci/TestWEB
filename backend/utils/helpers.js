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

/**
 * Venus (0) ve Titan (1) ayrı Game kaydı olarak biter; UserCode tek satır.
 * Bu turdaki skorları mevcut UserCode ile birleştirir — diğer gezegen skorları silinmez.
 * @param {string|number} section
 * @param {{ customerFocusScore?: any, uncertaintyScore?: any, ieScore?: any, idikScore?: any }} userCode
 * @param {{ customerFocusScore: number, uncertaintyScore: number, ieScore: number, idikScore: number }} rounded
 */
const mergeUserCodeScoresBySection = (section, userCode, rounded) => {
    const s = String(section);
    if (s === '0') {
        return {
            customerFocusScore: rounded.customerFocusScore,
            uncertaintyScore: rounded.uncertaintyScore,
            ieScore: userCode.ieScore,
            idikScore: userCode.idikScore
        };
    }
    if (s === '1') {
        return {
            customerFocusScore: userCode.customerFocusScore,
            uncertaintyScore: userCode.uncertaintyScore,
            ieScore: rounded.ieScore,
            idikScore: rounded.idikScore
        };
    }
    return {
        customerFocusScore: rounded.customerFocusScore,
        uncertaintyScore: rounded.uncertaintyScore,
        ieScore: rounded.ieScore,
        idikScore: rounded.idikScore
    };
};

/**
 * BY/MO raporları Venus, IE/IDIK Titan tamamlandığında gelir; UserCode'da dörtlü birleşik tutulur.
 */
const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Skor alanını sayıya çevirir; yoksa veya '-' ise null.
 * @param {unknown} val
 * @returns {number|null}
 */
const parseNumericScore = (val) => {
    if (val === null || val === undefined || val === '' || val === '-') return null;
    const n = typeof val === 'number' ? val : parseFloat(String(val));
    return Number.isFinite(n) ? n : null;
};

const COMPETENCY_SCORE_WEIGHT_KEYS = [
    { scoreKey: 'customerFocusScore', compKey: 'customerFocus' },
    { scoreKey: 'uncertaintyScore', compKey: 'uncertaintyManagement' },
    { scoreKey: 'ieScore', compKey: 'influence' },
    { scoreKey: 'idikScore', compKey: 'collaboration' }
];

/**
 * Pozisyon yetkinlik şemasındaki ağırlık (yüzde). Tanımsız kayıtlar için 25 (toplam 100 varsayımı).
 */
const getCompetencyWeight = (competencyDoc, compKey) => {
    const w = competencyDoc?.[compKey]?.weight;
    if (w === null || w === undefined || w === '') return 25;
    const n = Number(w);
    if (Number.isNaN(n)) return 25;
    return Math.max(0, Math.min(100, n));
};

/**
 * Sadece geçerli skoru olan yetkinliklerin ağırlıklarıyla ağırlıklı ortalama (0–100).
 * Eksik oyunlar (skor '-') paydada yer almaz; örn. yalnızca MO+BY tamamlandıysa payda (w_MO+w_BY).
 * @param {Record<string, unknown>} mergedScores
 * @param {Record<string, any>|null|undefined} competencyDoc
 * @returns {number|null}
 */
const computeWeightedCompetencyOverall = (mergedScores, competencyDoc) => {
    if (!mergedScores || typeof mergedScores !== 'object') return null;
    let sumW = 0;
    let sumWS = 0;
    for (const { scoreKey, compKey } of COMPETENCY_SCORE_WEIGHT_KEYS) {
        const s = parseNumericScore(mergedScores[scoreKey]);
        const w = getCompetencyWeight(competencyDoc, compKey);
        if (s === null || w <= 0) continue;
        sumW += w;
        sumWS += w * s;
    }
    if (sumW <= 0) return null;
    return Math.round(sumWS / sumW);
};

const mergeEvaluationResultsByType = (existing, incoming) => {
    if (incoming == null && (existing == null || existing === undefined)) return null;
    if (incoming == null) return existing ?? null;
    const inc = Array.isArray(incoming) ? incoming : [incoming];
    const incFiltered = inc.filter((item) => item && item.type);
    if (existing == null || existing === undefined) {
        return incFiltered.length ? incFiltered : null;
    }
    const ex = Array.isArray(existing) ? existing : [existing];
    const map = new Map();
    for (const item of ex) {
        if (item && item.type) map.set(item.type, item);
    }
    for (const item of incFiltered) {
        map.set(item.type, item);
    }
    const order = ['BY', 'MO', 'IE', 'IDIK'];
    const merged = order.filter((t) => map.has(t)).map((t) => map.get(t));
    return merged.length ? merged : null;
};

module.exports = {
    capitalizeName,
    escapeHtml,
    safeLog,
    isValidEmail,
    getSafeErrorMessage,
    mergeUserCodeScoresBySection,
    mergeEvaluationResultsByType,
    escapeRegex,
    parseNumericScore,
    computeWeightedCompetencyOverall,
    getCompetencyWeight,
    COMPETENCY_SCORE_WEIGHT_KEYS
};

