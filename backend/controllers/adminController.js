const mongoose = require('mongoose');
const EvaluationResult = require('../models/evaluationResult');
const { sendEmail } = require('../services/emailService');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const CompanyManagement = require('../models/companyManagement');
const bcrypt = require('bcryptjs');
const UserCode = require('../models/userCode');
const Game = require('../models/game');
const Authorization = require('../models/Authorization');
const Competency = require('../models/Competency');
const { capitalizeName, escapeHtml, safeLog, getSafeErrorMessage } = require('../utils/helpers');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { adminLoginLimiter } = require('../middleware/rateLimiters');

const dashboardStatsCache = new Map();
const DASHBOARD_STATS_TTL_MS = 60 * 1000;

const DEFAULT_TITLE_OPTIONS = [
    'Direktör',
    'Müdür/Yönetici',
    'Kıdemli Uzman',
    'Uzman',
    'Uzman Yardımcısı',
    'MT/Stajyer'
];

// Şifre validasyon fonksiyonu
const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (password.length < minLength) {
        return {
            isValid: false,
            message: `Şifre en az ${minLength} karakter olmalıdır`
        };
    }

    if (!hasUpperCase) {
        return {
            isValid: false,
            message: 'Şifre en az 1 büyük harf içermelidir'
        };
    }

    if (!hasLowerCase) {
        return {
            isValid: false,
            message: 'Şifre en az 1 küçük harf içermelidir'
        };
    }

    if (!hasNumbers) {
        return {
            isValid: false,
            message: 'Şifre en az 1 sayı içermelidir'
        };
    }

    if (!hasSymbols) {
        return {
            isValid: false,
            message: 'Şifre en az 1 özel karakter (!@#$%^&* vb.) içermelidir'
        };
    }

    return {
        isValid: true,
        message: 'Şifre geçerli'
    };
};

const adminController = {
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: 'Email ve şifre gereklidir' });
            }

            const admin = await Admin.findOne({ email });
            if (!admin) {
                return res.status(401).json({ message: 'Geçersiz email veya şifre' });
            }

            const isMatch = await admin.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Geçersiz email veya şifre' });
            }

            if (!admin.isActive) {
                return res.status(401).json({ message: 'Hesabınız aktif değil' });
            }

            // JWT_SECRET kontrolü
            if (!process.env.JWT_SECRET) {
                safeLog('error', 'JWT_SECRET environment variable is not set!');
                return res.status(500).json({ message: 'Sunucu yapılandırma hatası' });
            }

            // JWT oluştur
            const token = jwt.sign(
                {
                    id: admin._id,
                    email: admin.email,
                    role: admin.role,
                    name: admin.name
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Token'ı Cookie'ye yaz
            // Development'ta secure: false, production'da secure: true
            const isProduction = process.env.NODE_ENV === 'production';
            res.cookie("access_token", token, {
                httpOnly: true,
                secure: isProduction, // Production'da HTTPS zorunlu
                sameSite: isProduction ? "strict" : "lax", // Development'ta lax, production'da strict
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            // Başarılı girişte rate limit'i resetle
            try {
                const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
                if (adminLoginLimiter && typeof adminLoginLimiter.resetKey === 'function') {
                    adminLoginLimiter.resetKey(clientIp);
                }
            } catch (resetError) {
                // Rate limit reset hatası kritik değil, sadece logla
                safeLog('warn', 'Rate limit reset hatası:', resetError);
            }

            return res.json({
                success: true,
                token: token,
                admin: {
                    id: admin._id,
                    email: admin.email,
                    name: admin.name,
                    role: admin.role
                }
            });

        } catch (error) {
            safeLog('error', 'Login hatası', error);
            res.status(500).json({ message: getSafeErrorMessage(error, "Sunucu hatası") });
        }
    },

    createEvaluation: async (req, res) => {
        try {
            const evaluationData = req.body;
            
            // Multi-tenant: companyId kontrolü yap
            const { getCompanyFilter, addCompanyIdToData } = require('../middleware/auth');
            const companyFilter = getCompanyFilter(req);
            // Aynı ID'ye sahip değerlendirme var mı kontrol et
            const existingEvaluation = await EvaluationResult.findOne({ id: evaluationData.id, ...companyFilter });
            if (existingEvaluation) {
                return res.status(400).json({ message: 'Bu ID\'ye sahip bir değerlendirme zaten mevcut' });
            }

            // Yeni değerlendirmeyi oluştur - companyId otomatik eklenir
            const dataWithCompanyId = addCompanyIdToData(req, evaluationData);
            const evaluation = await EvaluationResult.create(dataWithCompanyId);
            res.status(201).json({ message: 'Değerlendirme başarıyla oluşturuldu', evaluation });
        } catch (error) {
            safeLog('error', 'Değerlendirme oluşturma hatası', error);
            res.status(500).json({ message: getSafeErrorMessage(error, 'Değerlendirme oluşturulurken bir hata oluştu') });
        }
    },

    deleteEvaluation: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Multi-tenant: companyId kontrolü yap
            const { getCompanyFilter } = require('../middleware/auth');
            const companyFilter = getCompanyFilter(req);
            // Değerlendirmeyi bul ve sil
            const evaluation = await EvaluationResult.findOneAndDelete({ id: id, ...companyFilter });
            
            if (!evaluation) {
                return res.status(404).json({ message: 'Değerlendirme bulunamadı' });
            }

            res.json({ message: 'Değerlendirme başarıyla silindi' });
        } catch (error) {
            safeLog('error', 'Değerlendirme silme hatası', error);
            res.status(500).json({ message: getSafeErrorMessage(error, 'Değerlendirme silinirken bir hata oluştu') });
        }
    },

    // Kod gönderme
    sendCode: async (req, res) => {
        try {
            const { code, email, name, planet, personType, unvan, pozisyon, departman } = req.body;

            if (!code) {
                return res.status(400).json({ success: false, message: 'Kod bulunamadı' });
            }

            // 72 saat sonrasını hesapla
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 240);
            const formattedExpiryDate = expiryDate.toLocaleDateString('tr-TR');

            // Multi-tenant: Önce kodu bul ve companyId kontrolü yap
            const { getCompanyFilter } = require('../middleware/auth');
            const companyFilter = getCompanyFilter(req);
            
            // Önce kodu bul (companyFilter ile) - sadece kontrol için
            const existingCode = await UserCode.findOne({ code, ...companyFilter });
            
            if (!existingCode) {
                safeLog('error', 'Kod bulunamadı veya yetkisiz erişim', { 
                    code, 
                    adminId: req.admin?._id?.toString(),
                    adminRole: req.admin?.role,
                    companyFilter 
                });
                return res.status(400).json({ success: false, message: 'Kod bulunamadı veya bu koda erişim yetkiniz yok' });
            }

            // E-posta içeriği (XSS koruması ile)
            const safeName = escapeHtml(capitalizeName(name));
            const safeCode = escapeHtml(code);
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <p><strong>Kaptan ${safeName},</strong></p>

                    <p>Artık komuta sende, yeni yetkinlik değerlendirme çözümümüz ile ANDRON Evreni'ne ilk adımını at ve 15-20 dakikalık maceraya hazır ol! 🚀</p>

                    <p>🎥 Görevine başlamadan önce <a href="https://www.youtube.com/watch?v=QALP4qOnFws" style="color: #0286F7; text-decoration: none; font-weight: bold;">"Oyun Deneyim Rehberi"</a>ni izle ve dikkat edilmesi gereken püf noktaları öğren.</p>

                    <p><strong>🔺Giriş Bilgileri:</strong></p>
                    <p>🗝 Tek Kullanımlık Giriş Kodu: <strong>${safeCode}</strong><br>
                    ⏱️ <strong>${escapeHtml(formattedExpiryDate)}</strong> tarihine kadar geçerlidir.</p>

                    <p><strong>🔺Uygulamayı İndir ve Başla:</strong></p>
                    <p>
                        <a href="https://play.google.com/store/apps/details?id=com.Fugi.Andron" style="color: #0286F7; text-decoration: none; font-weight: bold;">Google Play Store</a><br>
                        <a href="https://apps.apple.com/us/app/andron-mission-venus/id6739467164" style="color: #0286F7; text-decoration: none; font-weight: bold;">App Store</a>
                    </p>

                    <p><strong>⚠️ Unutma!</strong> Oyun Deneyim Rehberini atlamak, görev verimliliği düşürülebilir ve keşif esnasında sorun yaşayabilirsin!</p>

                    <p>Herhangi bir teknik aksaklıkta <a href="mailto:info@androngame.com" style="color: #0286F7; text-decoration: none;">info@androngame.com</a> üzerinden bize ulaşabilirsin.</p>

                    <p>Keyifli keşifler, Kaptan!<br>
                    <strong>ANDRON Game Ekibi</strong></p>
                    <strong>Bu mail otomatik olarak gönderilmiştir, lütfen yanıtlamayınız.</strong></p>
                </div>
            `;

            // E-posta gönder (retry mekanizması ile)
            let emailResult = null;
            const maxRetries = 3;
            let retryCount = 0;
            let lastError = null;

            while (retryCount < maxRetries) {
                try {
                    emailResult = await sendEmail(
                        email,
                        'ANDRON Game Deneyimine Davetlisin!',
                        emailHtml
                    );

                    if (emailResult && emailResult.success) {
                        break; // Başarılı, döngüden çık
                    } else {
                        lastError = emailResult?.error || 'Bilinmeyen hata';
                        retryCount++;
                        if (retryCount < maxRetries) {
                            // Exponential backoff: 1s, 2s, 4s
                            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                            safeLog('warn', `E-posta gönderimi başarısız, tekrar deneniyor (${retryCount}/${maxRetries})`, {
                                email,
                                error: lastError
                            });
                        }
                    }
                } catch (emailError) {
                    lastError = getSafeErrorMessage(emailError);
                    emailResult = null; // Hata durumunda emailResult'ı sıfırla
                    retryCount++;
                    if (retryCount < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                        safeLog('warn', `E-posta gönderimi hatası, tekrar deneniyor (${retryCount}/${maxRetries})`, {
                            email,
                            error: lastError
                        });
                    }
                }
            }

            if (emailResult && emailResult.success) {
                // Mail başarıyla gönderildi, şimdi UserCode'u güncelle (results sayfasına eklemek için)
                // Retry mekanizması ile güncelleme yap
                let userCode = null;
                const dbMaxRetries = 3;
                let dbRetryCount = 0;

                while (dbRetryCount < dbMaxRetries) {
                    try {
                        userCode = await UserCode.findOneAndUpdate(
                            { code, ...companyFilter },
                            {
                                name,
                                email,
                                planet,
                                personType: personType || '',
                                unvan: unvan || '',
                                pozisyon: pozisyon || '',
                                departman: departman || '',
                                status: 'Beklemede',
                                sentDate: new Date(),
                                expiryDate
                            },
                            { new: true }
                        );

                        if (userCode) {
                            break; // Başarılı, döngüden çık
                        } else {
                            dbRetryCount++;
                            if (dbRetryCount < dbMaxRetries) {
                                await new Promise(resolve => setTimeout(resolve, 500 * dbRetryCount));
                                safeLog('warn', `UserCode güncelleme başarısız, tekrar deneniyor (${dbRetryCount}/${dbMaxRetries})`, { code });
                            }
                        }
                    } catch (updateError) {
                        dbRetryCount++;
                        if (dbRetryCount < dbMaxRetries) {
                            await new Promise(resolve => setTimeout(resolve, 500 * dbRetryCount));
                            safeLog('warn', `UserCode güncelleme hatası, tekrar deneniyor (${dbRetryCount}/${dbMaxRetries})`, {
                                error: getSafeErrorMessage(updateError),
                                code
                            });
                        } else {
                            // Son denemede hata logla ama mail gönderildiği için devam et
                            safeLog('error', 'UserCode güncelleme tüm denemelerde başarısız (mail gönderildi)', {
                                error: getSafeErrorMessage(updateError),
                                code
                            });
                        }
                    }
                }

                if (!userCode) {
                    safeLog('warn', 'Mail gönderildi ama UserCode güncellenemedi (tüm denemeler başarısız)', { code });
                }

                // 72 saat sonra kodu sil
                // setTimeout(async () => {
                //     try {
                //         await UserCode.findOneAndDelete({ code });
                //     } catch (error) {
                //     }
                // }, 72 * 60 * 60 * 1000); // 72 saat

                res.json({ success: true, message: 'Kod başarıyla gönderildi' });
            } else {
                safeLog('error', 'E-posta gönderimi tüm denemelerde başarısız', {
                    email,
                    code,
                    error: lastError,
                    retryCount
                });
                
                // Daha açıklayıcı hata mesajı
                let errorMessage = `E-posta gönderilemedi: ${lastError || 'Bilinmeyen hata'}`;
                if (lastError && lastError.includes('yapılandırılmamış')) {
                    errorMessage = 'Mail servisi yapılandırması eksik. Lütfen sunucu yöneticisi ile iletişime geçin.';
                } else if (lastError && lastError.includes('API anahtarı')) {
                    errorMessage = 'Mail servisi API anahtarı geçersiz. Lütfen sunucu yöneticisi ile iletişime geçin.';
                } else if (lastError && lastError.includes('domain')) {
                    errorMessage = 'Mail servisi domain doğrulaması başarısız. Lütfen sunucu yöneticisi ile iletişime geçin.';
                }
                
                res.status(500).json({ 
                    success: false, 
                    message: errorMessage,
                    ...(process.env.NODE_ENV !== 'production' && { 
                        error: lastError,
                        details: emailResult?.details || null
                    })
                });
            }
        } catch (error) {
            safeLog('error', 'Kod gönderme hatası', {
                error: getSafeErrorMessage(error),
                code: req.body?.code,
                email: req.body?.email,
                name: req.body?.name,
                stack: error.stack
            });
            res.status(500).json({ 
                success: false, 
                message: 'Kod gönderilirken bir hata oluştu',
                error: process.env.NODE_ENV === 'development' ? getSafeErrorMessage(error) : undefined
            });
        }
    },

    // Sonuçlar geldiğinde durumu güncelle
    updateCodeStatus: async (req, res) => {
        try {
            const { code } = req.body;

            if (!code) {
                return res.status(400).json({ success: false, message: 'Kod gerekli' });
            }

            const userCode = await UserCode.findOneAndUpdate(
                { code },
                {
                    status: 'Tamamlandı',
                    completionDate: new Date()
                },
                { new: true }
            );

            if (!userCode) {
                return res.status(404).json({ success: false, message: 'Kod bulunamadı' });
            }

            res.json({ success: true, message: 'Durum başarıyla güncellendi' });
        } catch (error) {
            console.error('Durum güncelleme hatası:', error);
            res.status(500).json({ success: false, message: 'Durum güncellenirken bir hata oluştu' });
        }
    },

    // Kullanıcı sonuçlarını getir
    getUserResults: async (req, res) => {
        try {
            const { code, page, limit, searchTerm, statusFilter, showExpiredWarning, personType } = req.query;
            
            // Pagination parametreleri (page ve limit undefined ise tüm verileri getir)
            const pageNum = page ? parseInt(page) : undefined;
            const limitNum = limit ? parseInt(limit) : undefined;
            const skip = (pageNum && limitNum) ? (pageNum - 1) * limitNum : undefined;
            
            // Multi-tenant: companyId kontrolü yap
            const { getCompanyFilter } = require('../middleware/auth');
            const companyFilter = getCompanyFilter(req);
            
            // Debug: companyFilter'ı logla
            safeLog('debug', 'getUserResults - companyFilter', { 
                companyFilter, 
                adminId: req.admin?._id?.toString(),
                adminEmail: req.admin?.email,
                adminRole: req.admin?.role,
                adminCompanyId: req.admin?.companyId?.toString()
            });
            
            let results;
            let totalCount;
            let query = { ...companyFilter };
            const buildTurkishInsensitiveRegex = (value = '') => {
                const escaped = value
                    .toString()
                    .trim()
                    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return escaped.replace(/[iIİı]/g, '[iIİı]');
            };
            const normalizePersonType = (value) => {
                const normalized = (value || '').toString().toLowerCase().trim();
                if (normalized.includes('aday') || normalized.includes('candidate')) return 'candidate';
                if (normalized.includes('calisan') || normalized.includes('çalışan') || normalized.includes('employee')) return 'employee';
                return '';
            };
            
            if (code) {
                // Tek kod için pagination yok
                results = await UserCode.find({ code, ...companyFilter });
                totalCount = results.length;
            } else {
                // Filtreleme query'si oluştur
                if (statusFilter) {
                    query.status = statusFilter;
                } else {
                    // showExpiredWarning false ise "Süresi Doldu" statüsündeki kayıtları filtrele
                    // (statusFilter yoksa)
                    if (showExpiredWarning === 'false' || showExpiredWarning === false) {
                        query.status = { $ne: 'Süresi Doldu' };
                    } else if (showExpiredWarning !== 'true' && showExpiredWarning !== true) {
                        // Varsayılan olarak "Süresi Doldu" kayıtlarını gizle
                        query.status = { $ne: 'Süresi Doldu' };
                    }
                }
                
                // Search term varsa akıllı arama alanlarıyla filtrele
                if (searchTerm) {
                    const searchRegex = buildTurkishInsensitiveRegex(searchTerm);
                    query.$or = [
                        { name: { $regex: searchRegex, $options: 'i' } },
                        { email: { $regex: searchRegex, $options: 'i' } },
                        { unvan: { $regex: searchRegex, $options: 'i' } },
                        { pozisyon: { $regex: searchRegex, $options: 'i' } },
                        { departman: { $regex: searchRegex, $options: 'i' } }
                    ];
                }
                
                // Person type filtresi
                const normalizedPersonType = normalizePersonType(personType);
                if (normalizedPersonType === 'candidate') {
                    query.personType = { $in: [/aday/i, /candidate/i] };
                } else if (normalizedPersonType === 'employee') {
                    query.personType = { $in: [/calisan/i, /çalışan/i, /employee/i] };
                }

                // Toplam sayıyı hesapla (filtrelemeden sonra)
                totalCount = await UserCode.countDocuments(query);
                
                // Sorguyu çalıştır (pagination varsa uygula, yoksa tüm verileri getir)
                let queryBuilder = UserCode.find(query).sort({ sentDate: -1 });
                
                if (skip !== undefined && limitNum !== undefined) {
                    queryBuilder = queryBuilder.skip(skip).limit(limitNum);
                }
                
                results = await queryBuilder;
            }
            
            // Performans: Tüm Game'leri tek sorguda çek (N+1 sorgu problemini çöz)
            const playerCodes = results.map(r => r.code);
            const allGames = await Game.find({ 
                playerCode: { $in: playerCodes },
                ...companyFilter
            }).select('playerCode section customerFocusScore uncertaintyScore ieScore idikScore evaluationResult answers');
            
            // Game'leri playerCode'a göre grupla (memory'de hızlı erişim için)
            const gamesByPlayerCode = {};
            allGames.forEach(game => {
                if (!gamesByPlayerCode[game.playerCode]) {
                    gamesByPlayerCode[game.playerCode] = [];
                }
                gamesByPlayerCode[game.playerCode].push(game);
            });
            
            // UserCode güncellemelerini topla (non-blocking için)
            const updatePromises = [];

            const emails = results
                .map(r => r.email)
                .filter(Boolean)
                .map(email => email.toLowerCase());
            const authorizations = await Authorization.find({
                email: { $in: emails },
                ...companyFilter
            }).populate('organizationId').lean();
            const normalizeText = (value = '') =>
                value
                    .toString()
                    .trim()
                    .toLowerCase();
            const authByEmailAndName = {};
            authorizations.forEach(auth => {
                const emailKey = normalizeText(auth.email || '');
                const nameKey = normalizeText(auth.personName || '');
                if (emailKey && nameKey) {
                    authByEmailAndName[`${emailKey}|${nameKey}`] = auth;
                }
            });
            
            // Her sonuç için Game modelinden de veri al
            const mappedResults = results.map((result) => {
                // Memory'den ilgili oyunları al (sorgu yok, çok hızlı)
                const games = gamesByPlayerCode[result.code] || [];
                
                // Tüm oyunlardaki evaluationResult array'lerinden rapor ID'lerini bul
                let reportIds = [];
                for (const game of games) {
                    if (game.evaluationResult && game.evaluationResult.length > 0) {
                        // evaluationResult array'inde tüm data.ID'leri topla
                        for (const evalResult of game.evaluationResult) {
                            if (evalResult.data && evalResult.data.ID) {
                                reportIds.push(evalResult.data.ID);
                            }
                        }
                    }
                }
                const reportId = reportIds.length > 0 ? reportIds.join(', ') : null;
                

                
                // Game'den Venus skorlarını al ve UserCode'a kopyala
                const venusGame = games.find(g => g.section === '0' || g.section === 0);
                if (venusGame && (venusGame.customerFocusScore || venusGame.uncertaintyScore)) {
                    let updateData = {};
                    
                    if (venusGame.customerFocusScore && (!result.customerFocusScore || result.customerFocusScore === '-' || result.customerFocusScore === null)) {
                        updateData.customerFocusScore = venusGame.customerFocusScore;
                    }
                    
                    if (venusGame.uncertaintyScore && (!result.uncertaintyScore || result.uncertaintyScore === '-' || result.uncertaintyScore === null)) {
                        updateData.uncertaintyScore = venusGame.uncertaintyScore;
                    }
                    
                    // UserCode güncellemesini topla (non-blocking) - companyId kontrolü ile
                    if (Object.keys(updateData).length > 0) {
                        updatePromises.push(
                            UserCode.findOneAndUpdate(
                                { _id: result._id, ...companyFilter },
                                updateData
                            )
                        );
                    }
                }
                
                // Titan oyununu bul
                const titanGame = games.find(g => g.section === '1' || g.section === 1);
                
                const emailKey = normalizeText(result.email || '');
                const nameKey = normalizeText(result.name || '');
                const auth = authByEmailAndName[`${emailKey}|${nameKey}`];
                const organization = auth?.organizationId || {};
                const unvan = auth
                    ? (organization.unvan || auth?.unvan || auth?.title || '-')
                    : (result.unvan || '-');
                const pozisyon = auth
                    ? (organization.pozisyon || auth?.pozisyon || auth?.title || '-')
                    : (result.pozisyon || '-');
                const departman = auth
                    ? (organization.grupLiderligi || '-')
                    : (result.departman || '-');

                return {
                    code: result.code,
                    name: result.name,
                    email: result.email,
                    status: result.status,
                    personType: result.personType,
                    planet: result.planet,
                    allPlanets: result.allPlanets,
                    unvan,
                    pozisyon,
                    departman,
                    sentDate: result.sentDate,
                    completionDate: result.completionDate,
                    expiryDate: result.expiryDate,
                    // Venus skorları Game'den al, Titan skorları Game'den al
                    customerFocusScore: (venusGame ? venusGame.customerFocusScore : null) || result.customerFocusScore || '-',
                    uncertaintyScore: (venusGame ? venusGame.uncertaintyScore : null) || result.uncertaintyScore || '-',
                    ieScore: (titanGame ? titanGame.ieScore : null) || result.ieScore || '-',
                    idikScore: (titanGame ? titanGame.idikScore : null) || result.idikScore || '-',
                    // Oyun cevaplarını sadece code parametresi varsa ekle (performans için)
                    answers: code && games.length > 0 ? games.flatMap(g => g.answers || []) : null,
                    // Rapor ID'sini ekle
                    reportId: reportId
                };
            });
            
            // UserCode güncellemelerini arka planda çalıştır (response'u beklemeden)
            if (updatePromises.length > 0) {
                Promise.all(updatePromises).catch(err => {
                    safeLog('error', 'UserCode güncelleme hatası (non-blocking)', err);
                });
            }
            
            res.json({
                success: true,
                results: mappedResults,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limitNum)
                }
            });
        } catch (error) {
            safeLog('error', 'Sonuçları getirme hatası', error);
            res.status(500).json({
                success: false,
                message: getSafeErrorMessage(error, 'Sonuçlar alınırken bir hata oluştu')
            });
        }
    },

    createPendingPerson: async (req, res) => {
        try {
            const { name, email, unvan, pozisyon, departman, personType } = req.body;

            if (!name || !email || !unvan || !pozisyon || !departman || !personType) {
                return res.status(400).json({
                    success: false,
                    message: 'Tüm alanlar zorunludur'
                });
            }

            const { getCompanyFilter, addCompanyIdToData } = require('../middleware/auth');
            const companyFilter = getCompanyFilter(req);
            const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const emailRegex = new RegExp(`^${escapeRegex(email.trim())}$`, 'i');

            const existing = await UserCode.findOne({ email: emailRegex, ...companyFilter });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu e-posta ile kayıt zaten mevcut'
                });
            }

            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 10);

            const code = await UserCode.generateUniqueCode();
            const codeData = addCompanyIdToData(req, {
                code,
                name,
                email,
                planet: '',
                allPlanets: [],
                personType,
                unvan,
                pozisyon,
                departman,
                status: 'Beklemede',
                sentDate: new Date(),
                expiryDate,
                isPlaceholder: true
            });

            if (!codeData.companyId && req.admin && req.admin.role !== 'superadmin') {
                return res.status(400).json({
                    success: false,
                    message: 'Admin companyId\'si bulunamadı. Lütfen admin hesabınızı kontrol edin.'
                });
            }

            const newCode = new UserCode(codeData);
            await newCode.save();

            return res.json({
                success: true,
                result: newCode
            });
        } catch (error) {
            safeLog('error', 'Kişi ekleme hatası', error);
            return res.status(500).json({
                success: false,
                message: getSafeErrorMessage(error, 'Kişi eklenirken bir hata oluştu')
            });
        }
    },

    bulkCreatePendingPersons: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Excel dosyası seçilmedi. Lütfen .xlsx veya .xls formatında bir dosya seçin.'
                });
            }

            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            const range = XLSX.utils.decode_range(worksheet['!ref']);
            const data = [];

            for (let rowNum = 1; rowNum <= range.e.r; rowNum++) {
                const row = [];
                for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: colNum });
                    const cell = worksheet[cellAddress];
                    row.push(cell ? cell.v : '');
                }
                data.push(row);
            }

            if (data.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Excel dosyası boş veya okunamıyor. Lütfen geçerli bir Excel dosyası (.xlsx, .xls) seçin.'
                });
            }

            const { getCompanyFilter, addCompanyIdToData } = require('../middleware/auth');
            const companyFilter = getCompanyFilter(req);
            const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const normalizePersonType = (value) => {
                const normalized = (value || '').toString().toLowerCase().trim();
                if (normalized.includes('aday') || normalized.includes('candidate')) return 'Aday';
                if (normalized.includes('calisan') || normalized.includes('çalışan') || normalized.includes('employee')) return 'Çalışan';
                return '';
            };

            const results = {
                success: [],
                errors: []
            };

            const seenEmails = new Set();

            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const rowNumber = i + 2;

                try {
                    const isRowEmpty = row.every(cell => !cell || cell.toString().trim() === '');
                    if (isRowEmpty) {
                        continue;
                    }

                    if (row.length < 6) {
                        results.errors.push({
                            row: rowNumber,
                            message: 'Satırda yeterli sütun bulunmuyor. 6 sütun gerekli: Ad Soyad, Email, Ünvan, Pozisyon, Departman, Çalışan Tipi'
                        });
                        continue;
                    }

                    const [name, email, unvan, pozisyon, departman, rawPersonType] = row;

                    const isEmpty = (value) => !value || value.toString().trim() === '' || value.toString().trim() === '-';
                    if (isEmpty(name) || isEmpty(email) || isEmpty(unvan) || isEmpty(pozisyon) || isEmpty(departman) || isEmpty(rawPersonType)) {
                        const missingFields = [];
                        if (isEmpty(name)) missingFields.push('Ad Soyad');
                        if (isEmpty(email)) missingFields.push('Email');
                        if (isEmpty(unvan)) missingFields.push('Ünvan');
                        if (isEmpty(pozisyon)) missingFields.push('Pozisyon');
                        if (isEmpty(departman)) missingFields.push('Departman');
                        if (isEmpty(rawPersonType)) missingFields.push('Çalışan Tipi');
                        results.errors.push({
                            row: rowNumber,
                            message: `Eksik/geçersiz alanlar: ${missingFields.join(', ')}. Tüm alanlar dolu olmalıdır (boş veya '-' karakteri kabul edilmez).`
                        });
                        continue;
                    }

                    const normalizedEmail = email.toString().trim().toLowerCase();
                    if (seenEmails.has(normalizedEmail)) {
                        results.errors.push({
                            row: rowNumber,
                            message: 'Excel dosyasında aynı email birden fazla kez girilmiş.'
                        });
                        continue;
                    }
                    seenEmails.add(normalizedEmail);

                    const personType = normalizePersonType(rawPersonType);
                    if (!personType) {
                        results.errors.push({
                            row: rowNumber,
                            message: `Çalışan Tipi geçersiz: ${rawPersonType}`
                        });
                        continue;
                    }

                    const emailRegex = new RegExp(`^${escapeRegex(email.toString().trim())}$`, 'i');
                    const existing = await UserCode.findOne({ email: emailRegex, ...companyFilter });
                    if (existing) {
                        results.errors.push({
                            row: rowNumber,
                            message: 'Bu e-posta ile kayıt zaten mevcut'
                        });
                        continue;
                    }

                    const expiryDate = new Date();
                    expiryDate.setFullYear(expiryDate.getFullYear() + 10);
                    const code = await UserCode.generateUniqueCode();
                    const codeData = addCompanyIdToData(req, {
                        code,
                        name: name.toString().trim(),
                        email: email.toString().trim(),
                        planet: '',
                        allPlanets: [],
                        personType,
                        unvan: unvan.toString().trim(),
                        pozisyon: pozisyon.toString().trim(),
                        departman: departman.toString().trim(),
                        status: 'Beklemede',
                        sentDate: new Date(),
                        expiryDate,
                        isPlaceholder: true
                    });

                    if (!codeData.companyId && req.admin && req.admin.role !== 'superadmin') {
                        results.errors.push({
                            row: rowNumber,
                            message: 'Admin companyId bulunamadı. Lütfen admin hesabınızı kontrol edin.'
                        });
                        continue;
                    }

                    const newCode = new UserCode(codeData);
                    await newCode.save();
                    results.success.push({ row: rowNumber, result: newCode });
                } catch (error) {
                    results.errors.push({
                        row: rowNumber,
                        message: error.message || 'Bilinmeyen hata'
                    });
                }
            }

            if (results.success.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Hiçbir kişi eklenemedi',
                    errors: results.errors
                });
            }

            res.json({
                success: true,
                message: `${results.success.length} kişi başarıyla eklendi`,
                count: results.success.length,
                errors: results.errors.length > 0 ? results.errors : undefined
            });
        } catch (error) {
            safeLog('error', 'Toplu kişi ekleme hatası', error);
            res.status(500).json({
                success: false,
                message: getSafeErrorMessage(error, 'Toplu kişi eklenirken bir hata oluştu')
            });
        }
    },

    // Son tamamlayan kullanıcı ve son 3 sonucu getir
    getLatestUserSummary: async (req, res) => {
        try {
            const { getCompanyFilter } = require('../middleware/auth');
            const companyFilter = getCompanyFilter(req);
            const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const buildCompanyAverageScores = async () => {
                const users = await UserCode.find({
                    ...companyFilter,
                    status: 'Tamamlandı',
                    completionDate: { $ne: null }
                })
                    .select('customerFocusScore uncertaintyScore ieScore idikScore')
                    .lean();
                const sums = {
                    customerFocusScore: 0,
                    uncertaintyScore: 0,
                    ieScore: 0,
                    idikScore: 0
                };
                const counts = {
                    customerFocusScore: 0,
                    uncertaintyScore: 0,
                    ieScore: 0,
                    idikScore: 0
                };
                const fields = Object.keys(sums);
                users.forEach((user) => {
                    fields.forEach((field) => {
                        const value = Number(user[field]);
                        if (!Number.isNaN(value)) {
                            sums[field] += value;
                            counts[field] += 1;
                        }
                    });
                });
                return fields.reduce((acc, field) => {
                    acc[field] = counts[field] ? sums[field] / counts[field] : null;
                    return acc;
                }, {});
            };
            const buildPositionNorms = async (position) => {
                if (!position) return null;
                const competency = await Competency.findOne({
                    title: new RegExp(`^${escapeRegex(position.toString().trim())}$`, 'i'),
                    ...companyFilter
                })
                    .sort({ updatedAt: -1, createdAt: -1 })
                    .lean();
                if (!competency) return null;
                return {
                    customerFocusScore: `${competency.customerFocus.min}-${competency.customerFocus.max}`,
                    uncertaintyScore: `${competency.uncertaintyManagement.min}-${competency.uncertaintyManagement.max}`,
                    ieScore: `${competency.influence.min}-${competency.influence.max}`,
                    idikScore: `${competency.collaboration.min}-${competency.collaboration.max}`
                };
            };

            const latestUser = await UserCode.findOne({
                ...companyFilter,
                status: 'Tamamlandı',
                completionDate: { $ne: null }
            })
                .sort({ completionDate: -1 })
                .lean();

            if (!latestUser) {
                return res.status(404).json({ success: false, message: 'Tamamlanan kullanıcı bulunamadı' });
            }

            const historyQuery = {
                ...companyFilter,
                status: 'Tamamlandı',
                completionDate: { $ne: null }
            };

            if (latestUser.email) {
                historyQuery.email = latestUser.email;
            } else if (latestUser.name) {
                historyQuery.name = latestUser.name;
            }

            const userHistory = await UserCode.find(historyQuery)
                .sort({ completionDate: 1 })
                .lean();

            const codes = userHistory.map((user) => user.code);
            const games = await Game.find({
                playerCode: { $in: codes },
                ...companyFilter
            })
                .select('playerCode section customerFocusScore uncertaintyScore ieScore idikScore')
                .lean();

            const gamesByCode = new Map();
            games.forEach((game) => {
                if (!gamesByCode.has(game.playerCode)) {
                    gamesByCode.set(game.playerCode, []);
                }
                gamesByCode.get(game.playerCode).push(game);
            });

            const mapUserScores = (user) => {
                const userGames = gamesByCode.get(user.code) || [];
                const venusGame = userGames.find((g) => g.section === '0' || g.section === 0);
                const titanGame = userGames.find((g) => g.section === '1' || g.section === 1);

                const customerFocusScore = (venusGame ? venusGame.customerFocusScore : null) || user.customerFocusScore || '-';
                const uncertaintyScore = (venusGame ? venusGame.uncertaintyScore : null) || user.uncertaintyScore || '-';
                const ieScore = (titanGame ? titanGame.ieScore : null) || user.ieScore || '-';
                const idikScore = (titanGame ? titanGame.idikScore : null) || user.idikScore || '-';

                return {
                    ...user,
                    customerFocusScore,
                    uncertaintyScore,
                    ieScore,
                    idikScore
                };
            };

            const historyWithScores = userHistory.map(mapUserScores);
            const latestWithScores = mapUserScores(latestUser);
            const lastThree = historyWithScores.slice(-3);
            const companyAverageScores = await buildCompanyAverageScores();
            const positionNorms = await buildPositionNorms(latestWithScores?.pozisyon);

            res.json({
                success: true,
                latestUser: latestWithScores,
                history: lastThree,
                companyAverageScores,
                positionNorms
            });
        } catch (error) {
            safeLog('error', 'Son kullanıcı özeti hatası', error);
            res.status(500).json({
                success: false,
                message: getSafeErrorMessage(error, 'Özet veriler alınırken bir hata oluştu')
            });
        }
    },

    // Belirli kullanıcı için son 3 sonucu getir (code ile)
    getUserSummaryByCode: async (req, res) => {
        try {
            const { code } = req.query;
            if (!code) {
                return res.status(400).json({ success: false, message: 'Kod gereklidir' });
            }

            const { getCompanyFilter } = require('../middleware/auth');
            const companyFilter = getCompanyFilter(req);
            const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const buildCompanyAverageScores = async () => {
                const users = await UserCode.find({
                    ...companyFilter,
                    status: 'Tamamlandı',
                    completionDate: { $ne: null }
                })
                    .select('customerFocusScore uncertaintyScore ieScore idikScore')
                    .lean();
                const sums = {
                    customerFocusScore: 0,
                    uncertaintyScore: 0,
                    ieScore: 0,
                    idikScore: 0
                };
                const counts = {
                    customerFocusScore: 0,
                    uncertaintyScore: 0,
                    ieScore: 0,
                    idikScore: 0
                };
                const fields = Object.keys(sums);
                users.forEach((user) => {
                    fields.forEach((field) => {
                        const value = Number(user[field]);
                        if (!Number.isNaN(value)) {
                            sums[field] += value;
                            counts[field] += 1;
                        }
                    });
                });
                return fields.reduce((acc, field) => {
                    acc[field] = counts[field] ? sums[field] / counts[field] : null;
                    return acc;
                }, {});
            };
            const buildPositionNorms = async (position) => {
                if (!position) return null;
                const competency = await Competency.findOne({
                    title: new RegExp(`^${escapeRegex(position.toString().trim())}$`, 'i'),
                    ...companyFilter
                })
                    .sort({ updatedAt: -1, createdAt: -1 })
                    .lean();
                if (!competency) return null;
                return {
                    customerFocusScore: `${competency.customerFocus.min}-${competency.customerFocus.max}`,
                    uncertaintyScore: `${competency.uncertaintyManagement.min}-${competency.uncertaintyManagement.max}`,
                    ieScore: `${competency.influence.min}-${competency.influence.max}`,
                    idikScore: `${competency.collaboration.min}-${competency.collaboration.max}`
                };
            };

            const user = await UserCode.findOne({ code, ...companyFilter }).lean();
            if (!user) {
                return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
            }

            const historyQuery = {
                ...companyFilter,
                status: 'Tamamlandı',
                completionDate: { $ne: null }
            };

            if (user.email) {
                historyQuery.email = user.email;
            } else if (user.name) {
                historyQuery.name = user.name;
            } else {
                historyQuery.code = user.code;
            }

            const userHistory = await UserCode.find(historyQuery)
                .sort({ completionDate: 1 })
                .lean();

            const codes = userHistory.map((item) => item.code);
            const games = await Game.find({
                playerCode: { $in: codes },
                ...companyFilter
            })
                .select('playerCode section customerFocusScore uncertaintyScore ieScore idikScore')
                .lean();

            const gamesByCode = new Map();
            games.forEach((game) => {
                if (!gamesByCode.has(game.playerCode)) {
                    gamesByCode.set(game.playerCode, []);
                }
                gamesByCode.get(game.playerCode).push(game);
            });

            const mapUserScores = (userItem) => {
                const userGames = gamesByCode.get(userItem.code) || [];
                const venusGame = userGames.find((g) => g.section === '0' || g.section === 0);
                const titanGame = userGames.find((g) => g.section === '1' || g.section === 1);

                const customerFocusScore = (venusGame ? venusGame.customerFocusScore : null) || userItem.customerFocusScore || '-';
                const uncertaintyScore = (venusGame ? venusGame.uncertaintyScore : null) || userItem.uncertaintyScore || '-';
                const ieScore = (titanGame ? titanGame.ieScore : null) || userItem.ieScore || '-';
                const idikScore = (titanGame ? titanGame.idikScore : null) || userItem.idikScore || '-';

                return {
                    ...userItem,
                    customerFocusScore,
                    uncertaintyScore,
                    ieScore,
                    idikScore
                };
            };

            const historyWithScores = userHistory.map(mapUserScores);
            const latestWithScores = mapUserScores(user);
            const lastThree = historyWithScores.slice(-3);
            const companyAverageScores = await buildCompanyAverageScores();
            const positionNorms = await buildPositionNorms(latestWithScores?.pozisyon);

            res.json({
                success: true,
                latestUser: latestWithScores,
                history: lastThree,
                companyAverageScores,
                positionNorms
            });
        } catch (error) {
            safeLog('error', 'Kullanıcı özeti hatası', error);
            res.status(500).json({
                success: false,
                message: getSafeErrorMessage(error, 'Özet veriler alınırken bir hata oluştu')
            });
        }
    },

    // Rapor detaylarını getir (yetkinlik bazlı)
    getUserReportDetails: async (req, res) => {
        try {
            const { code } = req.query;
            if (!code) {
                return res.status(400).json({ success: false, message: 'Kod gereklidir' });
            }

            const { getCompanyFilter } = require('../middleware/auth');
            const companyFilter = getCompanyFilter(req);

            const games = await Game.find({ playerCode: code, ...companyFilter }).select('evaluationResult').lean();
            let allEvaluationResults = [];

            if (games && games.length > 0) {
                for (const game of games) {
                    if (game.evaluationResult) {
                        if (Array.isArray(game.evaluationResult)) {
                            allEvaluationResults = allEvaluationResults.concat(game.evaluationResult);
                        } else {
                            allEvaluationResults.push(game.evaluationResult);
                        }
                    }
                }
            }

            if (allEvaluationResults.length === 0) {
                const evaluation = await EvaluationResult.findOne({ ID: code, ...companyFilter }).lean();
                if (evaluation) {
                    allEvaluationResults = Array.isArray(evaluation) ? evaluation : [evaluation];
                }
            }

            if (allEvaluationResults.length === 0) {
                return res.status(404).json({ success: false, message: 'Rapor verisi bulunamadı' });
            }

            const getValue = (data, keys = []) => {
                for (const key of keys) {
                    const value = data?.[key];
                    if (value && value !== '-') return value;
                }
                return '';
            };

            const reports = {};
            const seen = new Set();
            allEvaluationResults.forEach((result) => {
                const type = result?.type || result?.data?.type;
                const data = result?.data || result || {};
                if (!type) return;
                const idKey = `${type}:${data?.ID || result?._id || Math.random()}`;
                if (seen.has(idKey)) return;
                seen.add(idKey);

                reports[type] = {
                    executiveSummaryStrengths: getValue(data, [
                        'Yönetici özeti güçlü yönleri',
                        'Yonetici ozeti guclu yonleri',
                        'Yönetici Özeti Güçlü Yönleri'
                    ]),
                    executiveSummaryDevelopment: getValue(data, [
                        'Yönetici özeti geliştirme',
                        'Yonetici ozeti gelistirme',
                        'Yönetici Özeti Geliştirme'
                    ]),
                    generalEvaluation: getValue(data, ['Genel Değerlendirme', 'Genel Değerlendirme ']),
                    strengths: getValue(data, ['Güçlü Yönler', 'Guclu Yonler', 'Güçlü yönler']),
                    developmentAreas: getValue(data, ['Gelişim Alanları', 'Gelisim Alanlari', 'Gelişim alanları']),
                    interviewQuestions: getValue(data, ['Mülakat Soruları', 'Mulakat Sorulari']),
                    whyTheseQuestions: getValue(data, ['Neden Bu Sorular?', 'Neden Bu Sorular', 'Neden bu sorular?']),
                    developmentPlan: getValue(data, [
                        'Gelişim Önerileri -1',
                        'Gelişim Önerileri',
                        'Gelisim Onerileri'
                    ])
                };
            });

            res.json({ success: true, reports });
        } catch (error) {
            safeLog('error', 'Rapor detayları hatası', error);
            res.status(500).json({
                success: false,
                message: getSafeErrorMessage(error, 'Rapor detayları alınırken bir hata oluştu')
            });
        }
    },

    getDashboardStats: async (req, res) => {
        try {
            const { getCompanyFilter } = require('../middleware/auth');
            const companyFilter = getCompanyFilter(req);
            let cacheKey = 'all';
            if (req.admin?.role !== 'superadmin') {
                if (req.admin?.companyId) {
                    cacheKey = `company:${req.admin.companyId.toString()}`;
                } else if (req.admin?._id) {
                    cacheKey = `admin:${req.admin._id.toString()}`;
                } else {
                    cacheKey = 'admin:unknown';
                }
            }
            const cached = dashboardStatsCache.get(cacheKey);
            const now = Date.now();

            if (cached && now - cached.fetchedAt < DASHBOARD_STATS_TTL_MS) {
                return res.json({ success: true, stats: cached.data, cached: true });
            }

            const initBuckets = () => new Array(10).fill(0);
            const initStatsSet = () => ({
                totalSentGames: 0,
                statusCounts: { completed: 0, inProgress: 0, expired: 0, pending: 0 },
                scoreDistributions: {
                    customerFocus: initBuckets(),
                    uncertainty: initBuckets(),
                    ie: initBuckets(),
                    idik: initBuckets()
                },
                completedCandidateCount: 0,
                completedEmployeeCount: 0,
                titleCounts: {},
                scoreTotals: {
                    customerFocusScore: 0,
                    uncertaintyScore: 0,
                    ieScore: 0,
                    idikScore: 0
                },
                scoreCounts: {
                    customerFocusScore: 0,
                    uncertaintyScore: 0,
                    ieScore: 0,
                    idikScore: 0
                }
            });

            const addScoreToBuckets = (buckets, score) => {
                if (score === null || score === undefined || score === '-' || score === 0 || score === '0') {
                    return;
                }
                const parsed = Number(score);
                if (Number.isNaN(parsed)) return;
                const clamped = Math.max(0, Math.min(100, parsed));
                const index = Math.min(9, Math.floor(clamped / 10));
                buckets[index] += 1;
            };

            const normalizeText = (value) =>
                (value || '')
                    .toString()
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, ' ');

            const normalizePersonType = (value) => {
                const normalized = normalizeText(value);
                if (normalized.includes('aday') || normalized.includes('candidate')) return 'candidate';
                if (normalized.includes('calisan') || normalized.includes('çalışan') || normalized.includes('employee')) return 'employee';
                return '';
            };

            let titleOptions = DEFAULT_TITLE_OPTIONS;
            if (req.admin?.role === 'superadmin') {
                if (Array.isArray(req.admin?.titleOptions) && req.admin.titleOptions.length > 0) {
                    titleOptions = req.admin.titleOptions;
                }
            } else if (req.admin?.companyId) {
                const company = await CompanyManagement.findById(req.admin.companyId)
                    .select('titleOptions')
                    .lean();
                if (Array.isArray(company?.titleOptions) && company.titleOptions.length > 0) {
                    titleOptions = company.titleOptions;
                }
            }

            const userCodes = await UserCode.find(companyFilter)
                .select('code email name status completionDate planet allPlanets customerFocusScore uncertaintyScore ieScore idikScore personType unvan')
                .lean();

            const codes = userCodes.map((item) => item.code).filter(Boolean);
            const games = codes.length
                ? await Game.find({
                    playerCode: { $in: codes },
                    ...companyFilter
                }).select('playerCode section customerFocusScore uncertaintyScore ieScore idikScore').lean()
                : [];
            const gamesByCode = new Map();
            games.forEach((game) => {
                if (!gamesByCode.has(game.playerCode)) {
                    gamesByCode.set(game.playerCode, []);
                }
                gamesByCode.get(game.playerCode).push(game);
            });
            const getMergedScores = (item) => {
                const userGames = gamesByCode.get(item.code) || [];
                const venusGame = userGames.find((g) => g.section === '0' || g.section === 0);
                const titanGame = userGames.find((g) => g.section === '1' || g.section === 1);
                return {
                    customerFocusScore: (venusGame ? venusGame.customerFocusScore : null) || item.customerFocusScore,
                    uncertaintyScore: (venusGame ? venusGame.uncertaintyScore : null) || item.uncertaintyScore,
                    ieScore: (titanGame ? titanGame.ieScore : null) || item.ieScore,
                    idikScore: (titanGame ? titanGame.idikScore : null) || item.idikScore
                };
            };

            const normalizeStatus = (status) => status.toLowerCase().replace(/\s+/g, ' ').trim();
            let uniquePeopleCount = 0;
            const statsAll = initStatsSet();
            const statsCandidate = initStatsSet();
            const statsEmployee = initStatsSet();
            const uniqueKeys = new Set();
            const scoreFields = [
                { bucketKey: 'customerFocus', field: 'customerFocusScore' },
                { bucketKey: 'uncertainty', field: 'uncertaintyScore' },
                { bucketKey: 'ie', field: 'ieScore' },
                { bucketKey: 'idik', field: 'idikScore' }
            ];

            const applyItemToStats = (statsSet, item, personType) => {
                const normalized = normalizeStatus(item.status || '');
                const mergedScores = getMergedScores(item);
                if (normalized === 'tamamlandı' || normalized === 'tamamlandi') {
                    statsSet.statusCounts.completed += 1;
                    if (personType === 'candidate') {
                        statsSet.completedCandidateCount += 1;
                    } else if (personType === 'employee') {
                        statsSet.completedEmployeeCount += 1;
                    }

                    const titleKey = normalizeText(item.unvan);
                    if (titleKey) {
                        statsSet.titleCounts[titleKey] = (statsSet.titleCounts[titleKey] || 0) + 1;
                    }

                    if (item.completionDate) {
                        scoreFields.forEach(({ field }) => {
                            const value = Number(mergedScores[field]);
                            if (!Number.isNaN(value)) {
                                statsSet.scoreTotals[field] += value;
                                statsSet.scoreCounts[field] += 1;
                            }
                        });
                    }
                } else if (normalized.includes('devam') || (normalized.includes('oyun') && normalized.includes('ediyor'))) {
                    statsSet.statusCounts.inProgress += 1;
                } else if (normalized.includes('süresi doldu') || normalized.includes('suresi doldu')) {
                    statsSet.statusCounts.expired += 1;
                } else if (normalized === 'beklemede') {
                    statsSet.statusCounts.pending += 1;
                }

                const rawPlanets = Array.isArray(item.allPlanets) && item.allPlanets.length > 0
                    ? item.allPlanets
                    : (item.planet ? [item.planet] : []);
                const normalizedPlanets = rawPlanets
                    .filter(Boolean)
                    .map((planet) => planet.toString().toLowerCase());

                statsSet.totalSentGames += normalizedPlanets.length;

                scoreFields.forEach(({ bucketKey, field }) => {
                    addScoreToBuckets(statsSet.scoreDistributions[bucketKey], mergedScores[field]);
                });
            };

            userCodes.forEach((item) => {
                const uniqueKey = (item.email || item.name || '').trim().toLowerCase();
                if (uniqueKey) {
                    uniqueKeys.add(uniqueKey);
                }

                const personType = normalizePersonType(item.personType);
                applyItemToStats(statsAll, item, personType);

                if (personType === 'candidate') {
                    applyItemToStats(statsCandidate, item, personType);
                }
                if (personType === 'employee') {
                    applyItemToStats(statsEmployee, item, personType);
                }
            });

            uniquePeopleCount = uniqueKeys.size;

            const finalizeStats = (statsSet) => {
                const averageScores = Object.keys(statsSet.scoreTotals).reduce((acc, field) => {
                    acc[field] = statsSet.scoreCounts[field] ? statsSet.scoreTotals[field] / statsSet.scoreCounts[field] : null;
                    return acc;
                }, {});
                const { scoreTotals, scoreCounts, ...rest } = statsSet;
                return { ...rest, averageScores };
            };

            const statsAllFinal = finalizeStats(statsAll);
            const statsCandidateFinal = finalizeStats(statsCandidate);
            const statsEmployeeFinal = finalizeStats(statsEmployee);

            const stats = {
                totalSentGames: statsAllFinal.totalSentGames,
                uniquePeopleCount,
                statusCounts: statsAllFinal.statusCounts,
                scoreDistributions: statsAllFinal.scoreDistributions,
                averageScores: statsAllFinal.averageScores,
                completedCandidateCount: statsAllFinal.completedCandidateCount,
                completedEmployeeCount: statsAllFinal.completedEmployeeCount,
                titleOptions,
                titleCounts: statsAllFinal.titleCounts,
                byPersonType: {
                    all: statsAllFinal,
                    candidate: statsCandidateFinal,
                    employee: statsEmployeeFinal
                }
            };

            dashboardStatsCache.set(cacheKey, { fetchedAt: now, data: stats });
            return res.json({ success: true, stats });
        } catch (error) {
            safeLog('error', 'Dashboard istatistik hatası', error);
            res.status(500).json({
                success: false,
                message: getSafeErrorMessage(error, 'Dashboard istatistikleri alınırken bir hata oluştu')
            });
        }
    },



    updateResultStatus: async (req, res) => {
        try {
            const { code, status } = req.body;
    
            if (!code || !status) {
                return res.status(400).json({
                    success: false,
                    message: 'Kod ve durum bilgisi gereklidir'
                });
            }

            const result = await UserCode.findOneAndUpdate(
                { code },
                { 
                    status,
                    completionDate: status === 'Tamamlandı' ? new Date() : null
                },
                { new: true }
            );

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: 'Sonuç bulunamadı'
                });
            }

            res.json({
                success: true,
                message: 'Durum başarıyla güncellendi',
                result
            });
        } catch (error) {
            safeLog('error', 'Durum güncelleme hatası', error);
            res.status(500).json({
                success: false,
                message: getSafeErrorMessage(error, 'Durum güncellenirken bir hata oluştu')
            });
        }
    },

    // Yeni admin oluşturma
    createAdmin: async (req, res) => {
        try {
            const { email, password, name, role, companyId, company } = req.body;

            // Email kontrolü
            const existingAdmin = await Admin.findOne({ email });
            if (existingAdmin) {
                return res.status(400).json({ message: 'Bu email adresi zaten kullanımda' });
            }

            // Super admin için companyId zorunlu değil, normal admin için zorunlu
            if (role !== 'superadmin' && !companyId) {
                return res.status(400).json({ message: 'Normal admin için companyId zorunludur' });
            }

            // Yeni admin oluştur
            const admin = new Admin({
                email,
                password,
                name,
                companyId: role === 'superadmin' ? undefined : companyId,
                company: company || undefined, // Company name (display için)
                role: role || 'admin'
            });

            await admin.save();

            res.status(201).json({
                success: true,
                message: 'Admin başarıyla oluşturuldu',
                admin: {
                    id: admin._id,
                    email: admin.email,
                    name: admin.name,
                    companyId: admin.companyId,
                    company: admin.company,
                    role: admin.role
                }
            });
        } catch (error) {
            safeLog('error', 'Admin oluşturma hatası', error);
            res.status(500).json({ 
                success: false,
                message: getSafeErrorMessage(error, 'Admin oluşturulurken bir hata oluştu'),
                ...(process.env.NODE_ENV !== 'production' && { error: error.message })
            });
        }
    },

    // Admin güncelleme
    updateAdmin: async (req, res) => {
        try {
            const { id } = req.params;
            const { email, password, name, companyId, company, role, isActive } = req.body;

            // Admin'i bul
            const admin = await Admin.findById(id);
            if (!admin) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Admin bulunamadı' 
                });
            }

            // Güncelleme
            if (email) admin.email = email;
            if (password) admin.password = password;
            if (name) admin.name = name;
            if (companyId !== undefined) {
                // Super admin için companyId zorunlu değil, normal admin için zorunlu
                if (role !== 'superadmin' && !companyId) {
                    return res.status(400).json({ message: 'Normal admin için companyId zorunludur' });
                }
                admin.companyId = role === 'superadmin' ? undefined : companyId;
            }
            if (company !== undefined) admin.company = company; // Company name
            if (role) admin.role = role;
            if (typeof isActive === 'boolean') admin.isActive = isActive;

            await admin.save();

            res.json({
                success: true,
                message: 'Admin başarıyla güncellendi',
                admin: {
                    id: admin._id,
                    email: admin.email,
                    name: admin.name,
                    companyId: admin.companyId,
                    company: admin.company,
                    role: admin.role,
                    isActive: admin.isActive
                }
            });
        } catch (error) {
            safeLog('error', 'Admin güncelleme hatası', error);
            res.status(500).json({ 
                success: false,
                message: getSafeErrorMessage(error, 'Admin güncellenirken bir hata oluştu'),
                ...(process.env.NODE_ENV !== 'production' && { error: error.message })
            });
        }
    },

    // Admin listesi
    getAdmins: async (req, res) => {
        try {
            const admins = await Admin.find().select('-password');
            res.json({
                success: true,
                admins: admins
            });
        } catch (error) {
            safeLog('error', 'Admin listesi alma hatası', error);
            res.status(500).json({ 
                success: false,
                message: getSafeErrorMessage(error, 'Admin listesi alınırken bir hata oluştu'),
                ...(process.env.NODE_ENV !== 'production' && { error: error.message })
            });
        }
    },

    // Tekil admin getirme
    getAdminById: async (req, res) => {
        try {
            const { id } = req.params;
            
            const admin = await Admin.findById(id).select('-password');
            if (!admin) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Admin bulunamadı' 
                });
            }

            res.json({
                success: true,
                admin: admin
            });
        } catch (error) {
            safeLog('error', 'Admin getirme hatası', error);
            res.status(500).json({ 
                success: false,
                message: getSafeErrorMessage(error, 'Admin bilgileri alınırken bir hata oluştu'),
                ...(process.env.NODE_ENV !== 'production' && { error: error.message })
            });
        }
    },

    // Sonuç silme
    async deleteResult(req, res) {
        try {
            const { code } = req.body;
            
            if (!code) {
                return res.status(400).json({ message: 'Kod gereklidir' });
            }

            // Multi-tenant: companyId kontrolü yap
            const { getCompanyFilter } = require('../middleware/auth');
            const companyFilter = getCompanyFilter(req);

            // Game modelinden sil
            await mongoose.model('Game').deleteMany({ playerCode: code, ...companyFilter });
            
            // UserCode modelinden tamamen sil
            await mongoose.model('UserCode').findOneAndDelete({ code, ...companyFilter });

            res.json({ message: 'Sonuç başarıyla silindi' });
        } catch (error) {
            safeLog('error', 'Sonuç silme hatası', error);
            res.status(500).json({ message: getSafeErrorMessage(error, 'Sonuç silinirken bir hata oluştu') });
        }
    },

    // Admin silme
    deleteAdmin: async (req, res) => {
        try {
            const { id } = req.params;

            // Admin'i bul ve sil
            const admin = await Admin.findByIdAndDelete(id);
            
            if (!admin) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Admin bulunamadı' 
                });
            }

            res.json({ 
                success: true,
                message: 'Admin başarıyla silindi' 
            });
        } catch (error) {
            safeLog('error', 'Admin silme hatası', error);
            res.status(500).json({ 
                success: false,
                message: getSafeErrorMessage(error, 'Admin silinirken bir hata oluştu'),
                ...(process.env.NODE_ENV !== 'production' && { error: error.message })
            });
        }
    },

    // Oyun tamamlandığında e-posta gönder
    sendCompletionEmail: async (req, res) => {
        try {
            const { code, email, name } = req.body;

            if (!code || !email || !name) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Kod, e-posta ve isim gereklidir' 
                });
            }

            // E-posta içeriği (XSS koruması ile)
            const safeName = escapeHtml(capitalizeName(name));
            const completionEmailHtml = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <p><strong>Kaptan ${safeName},</strong></p>

                    <p>Tebrikler, ANDRON Evreni'ndeki keşif maceranı başarıyla tamamladın! 🚀</p>

                    <p>Görev boyunca aldığın veriler ve kararların, ANDRON Komuta Merkezi'ne eksiksiz ulaştı.</p>

                    <p>Keyifli keşifler ve yeni görevlerde görüşmek üzere, Kaptan!<br>
                    <strong>ANDRON Game Ekibi</strong></p>
                </div>
            `;

            const emailResult = await sendEmail(
                email,
                'ANDRON Evreni Keşif Maceran Tamamlandı!',
                completionEmailHtml
            );

            if (emailResult.success) {
                res.json({
                    success: true,
                    message: 'Tamamlanma e-postası başarıyla gönderildi'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'E-posta gönderilirken bir hata oluştu',
                    error: emailResult.error
                });
            }

        } catch (error) {
            safeLog('error', 'Tamamlanma e-postası gönderme hatası', error);
            res.status(500).json({
                success: false,
                message: getSafeErrorMessage(error, 'E-posta gönderilirken bir hata oluştu'),
                ...(process.env.NODE_ENV !== 'production' && { error: error.message })
            });
        }
    },

    // Şirket raporlarını toplu export et (Excel)
    exportCompanyReports: async (req, res) => {
        try {
            const { companyId } = req.params;
            
            if (!companyId) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Company ID gereklidir' 
                });
            }

            // Multi-tenant: Super admin tüm şirketleri görebilir, normal admin sadece kendi şirketini
            const { getCompanyFilter } = require('../middleware/auth');
            const companyFilter = getCompanyFilter(req);
            
            // Normal admin başka şirketin raporlarını göremez
            if (req.admin.role !== 'superadmin' && req.admin.companyId?.toString() !== companyId) {
                return res.status(403).json({ 
                    success: false,
                    message: 'Bu şirketin raporlarını görme yetkiniz yok' 
                });
            }

            // Şirketi bul
            const CompanyManagement = require('../models/companyManagement');
            const company = await CompanyManagement.findById(companyId);
            if (!company) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Şirket bulunamadı' 
                });
            }

            // Script'teki export fonksiyonunu kullan
            const { exportToExcel } = require('../../scripts/exportCompanyReports');
            
            // Geçici olarak dosyayı oluştur
            const filePath = await exportToExcel(companyId, company.firmName);
            
            if (!filePath) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Bu şirket için export edilecek veri bulunamadı' 
                });
            }

            // Dosyayı oku ve gönder
            const fileBuffer = fs.readFileSync(filePath);
            const fileName = path.basename(filePath);

            // Dosyayı gönder
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.send(fileBuffer);

            // Dosyayı sil (opsiyonel - disk alanı için)
            // fs.unlinkSync(filePath);

        } catch (error) {
            safeLog('error', 'Şirket raporları export hatası', error);
            res.status(500).json({ 
                success: false,
                message: getSafeErrorMessage(error, 'Raporlar export edilirken bir hata oluştu'),
                ...(process.env.NODE_ENV !== 'production' && { error: error.message })
            });
        }
    },

    // Excel export fonksiyonu
    exportExcel: async (req, res) => {
        try {
            const { code } = req.params;

            if (!code) {
                return res.status(400).json({ message: 'Kod gereklidir' });
            }

            // Multi-tenant: companyId kontrolü yap
            const { getCompanyFilter } = require('../middleware/auth');
            const companyFilter = getCompanyFilter(req);
            // Kullanıcı kodunu bul
            const userCode = await UserCode.findOne({ code, ...companyFilter });
            if (!userCode) {
                return res.status(404).json({ message: 'Kod bulunamadı' });
            }

            // Oyun sonuçlarını bul
            const games = await Game.find({ playerCode: code, ...companyFilter });
            if (!games || games.length === 0) {
                return res.status(404).json({ message: 'Oyun sonuçları bulunamadı' });
            }

            // Excel verilerini hazırla
            const excelData = [];

            // Game modelinden skorları al
            const venusGame = games.find(g => g.section === '0' || g.section === 0);
            const titanGame = games.find(g => g.section === '1' || g.section === 1);
            
            // getUserResults'daki mantığı kullan - doğru skor alma
            let customerFocusScore = (venusGame ? venusGame.customerFocusScore : null) || userCode.customerFocusScore || '-';
            let uncertaintyScore = (venusGame ? venusGame.uncertaintyScore : null) || userCode.uncertaintyScore || '-';
            let ieScore = (titanGame ? titanGame.ieScore : null) || userCode.ieScore || '-';
            let idikScore = (titanGame ? titanGame.idikScore : null) || userCode.idikScore || '-';
            
            safeLog('debug', 'Doğru skorlar:', {
                customerFocusScore: customerFocusScore,
                uncertaintyScore: uncertaintyScore,
                ieScore: ieScore,
                idikScore: idikScore
            });
            
            // Tüm oyunlardan skorları topla
            let allScores = {
                customerFocusScore: customerFocusScore,
                uncertaintyScore: uncertaintyScore,
                ieScore: ieScore,
                idikScore: idikScore
            };


            // Her oyun için ayrı satır oluştur
            for (const game of games) {
                // Game'den evaluationResult array'ini al
                if (game.evaluationResult && game.evaluationResult.length > 0) {
                    for (const evalResult of game.evaluationResult) {
                        if (evalResult.data && evalResult.data.ID) {
                            // Yetkinlik adını belirle
                            let yetkinlikAdi = 'Bilinmeyen Yetkinlik';
                            if (evalResult.type === 'MO') {
                                yetkinlikAdi = 'Müşteri Odaklılık';
                            } else if (evalResult.type === 'BY') {
                                yetkinlikAdi = 'Belirsizlik Yönetimi';
                            } else if (evalResult.type === 'IE') {
                                yetkinlikAdi = 'İnsanları Etkileme';
                            } else if (evalResult.type === 'IDIK') {
                                yetkinlikAdi = 'Güven Veren İşbirlikçi ve Sinerji';
                            }

                            // Yetkinlik skorunu belirle - tüm skorlardan al
                            let yetkinlikSkoru = '-';
                            if (evalResult.type === 'MO') {
                                yetkinlikSkoru = allScores.customerFocusScore;
                            } else if (evalResult.type === 'BY') {
                                yetkinlikSkoru = allScores.uncertaintyScore;
                            } else if (evalResult.type === 'IE') {
                                yetkinlikSkoru = allScores.ieScore;
                            } else if (evalResult.type === 'IDIK') {
                                yetkinlikSkoru = allScores.idikScore;
                            }

                            excelData.push({
                                'Ad Soyad': userCode.name,
                                'Ölçülen Yetkinlik': yetkinlikAdi,
                                'Yetkinlik Skoru': yetkinlikSkoru,
                                'Yönetici özeti güçlü yönleri': evalResult.data['Yönetici özeti güçlü yönleri'] || '-',
                                'Yönetici özeti geliştirme': evalResult.data['Yönetici özeti geliştirme'] || '-',
                                'Genel Değerlendirme': evalResult.data['Genel Değerlendirme'] || '-',
                                'Güçlü Yönler': evalResult.data['Güçlü Yönler'] || '-',
                                'Gelişim Alanları': evalResult.data['Gelişim Alanları'] || '-',
                                'Mülakat Soruları': evalResult.data['Mülakat Soruları'] || '-',
                                'Neden Bu Sorular?': evalResult.data['Neden Bu Sorular?'] || '-',
                                'Gelişim Planı': evalResult.data['Gelişim Önerileri -1'] || '-'
                            });
                        }
                    }
                }
            }

            // Eğer hiç veri yoksa
            if (excelData.length === 0) {
                return res.status(404).json({ message: 'Bu kod için değerlendirme verisi bulunamadı' });
            }

            // Excel dosyası oluştur
            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Değerlendirme Sonuçları');

            // Excel dosyasını buffer olarak oluştur
            const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            // Excel dosyasını indir
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=degerlendirme_${code}.xlsx`);
            res.send(excelBuffer);

        } catch (error) {
            safeLog('error', 'Excel export hatası', error);
            res.status(500).json({ 
                message: getSafeErrorMessage(error, 'Excel oluşturulurken bir hata oluştu'),
                ...(process.env.NODE_ENV !== 'production' && { error: error.message })
            });
        }
    },

    // Çoklu Excel export (Dashboard filtreleri için)
    exportExcelBulk: async (req, res) => {
        try {
            const { codes, selectedOptions } = req.body;

            if (!Array.isArray(codes) || codes.length === 0) {
                return res.status(400).json({ message: 'Kod listesi gereklidir' });
            }

            // Multi-tenant: companyId kontrolü yap
            const { getCompanyFilter } = require('../middleware/auth');
            const companyFilter = getCompanyFilter(req);

            const options = {
                generalEvaluation: selectedOptions?.generalEvaluation !== false,
                strengths: selectedOptions?.strengths !== false,
                interviewQuestions: selectedOptions?.interviewQuestions !== false,
                whyTheseQuestions: selectedOptions?.whyTheseQuestions !== false,
                developmentSuggestions: selectedOptions?.developmentSuggestions !== false,
                competencyScore: selectedOptions?.competencyScore !== false
            };

            const userCodes = await UserCode.find({ code: { $in: codes }, ...companyFilter }).lean();
            const games = await Game.find({ playerCode: { $in: codes }, ...companyFilter }).lean();

            const userMap = new Map(userCodes.map((user) => [user.code, user]));
            const gamesByCode = new Map();
            games.forEach((game) => {
                if (!gamesByCode.has(game.playerCode)) {
                    gamesByCode.set(game.playerCode, []);
                }
                gamesByCode.get(game.playerCode).push(game);
            });

            const getCompetencyName = (type) => {
                if (type === 'MO') return 'Müşteri Odaklılık';
                if (type === 'BY') return 'Belirsizlik Yönetimi';
                if (type === 'IE') return 'İnsanları Etkileme';
                if (type === 'IDIK') return 'Güven Veren İşbirliği ve Sinerji';
                return 'Bilinmeyen Yetkinlik';
            };

            const getDevelopmentSuggestion = (data) =>
                data['Gelişim Önerileri -1'] ||
                '-';

            const appendSection = (current, competencyName, value) => {
                if (!value || value === '-') return current;
                const line = `${competencyName}: ${value}`;
                return current ? `${current}\n\n${line}` : line;
            };

            const excelData = [];

            codes.forEach((code) => {
                const user = userMap.get(code);
                if (!user) return;

                const userGames = gamesByCode.get(code) || [];
                const venusGame = userGames.find((g) => g.section === '0' || g.section === 0);
                const titanGame = userGames.find((g) => g.section === '1' || g.section === 1);

                const customerFocusScore = (venusGame ? venusGame.customerFocusScore : null) || user.customerFocusScore || '-';
                const uncertaintyScore = (venusGame ? venusGame.uncertaintyScore : null) || user.uncertaintyScore || '-';
                const ieScore = (titanGame ? titanGame.ieScore : null) || user.ieScore || '-';
                const idikScore = (titanGame ? titanGame.idikScore : null) || user.idikScore || '-';

            let generalEvaluationText = '';
            let strengthsText = '';
            let developmentAreasText = '';
            let interviewQuestionsText = '';
            let whyTheseQuestionsText = '';
            let developmentPlanText = '';
            let executiveSummaryStrengthsText = '';
            let executiveSummaryDevelopmentText = '';

                userGames.forEach((game) => {
                    if (game.evaluationResult && game.evaluationResult.length > 0) {
                        game.evaluationResult.forEach((evalResult) => {
                            if (!evalResult.data || !evalResult.type) return;
                            const competencyName = getCompetencyName(evalResult.type);

                            if (options.generalEvaluation) {
                                generalEvaluationText = appendSection(
                                    generalEvaluationText,
                                    competencyName,
                                    evalResult.data['Genel Değerlendirme'] || '-'
                                );
                                executiveSummaryStrengthsText = appendSection(
                                    executiveSummaryStrengthsText,
                                    competencyName,
                                    evalResult.data['Yönetici özeti güçlü yönleri'] || '-'
                                );
                                executiveSummaryDevelopmentText = appendSection(
                                    executiveSummaryDevelopmentText,
                                    competencyName,
                                    evalResult.data['Yönetici özeti geliştirme'] || '-'
                                );
                            }
                            if (options.strengths) {
                                strengthsText = appendSection(
                                    strengthsText,
                                    competencyName,
                                    evalResult.data['Güçlü Yönler'] || '-'
                                );
                                developmentAreasText = appendSection(
                                    developmentAreasText,
                                    competencyName,
                                    evalResult.data['Gelişim Alanları'] || '-'
                                );
                            }
                            if (options.interviewQuestions) {
                                interviewQuestionsText = appendSection(
                                    interviewQuestionsText,
                                    competencyName,
                                    evalResult.data['Mülakat Soruları'] || '-'
                                );
                            }
                            if (options.whyTheseQuestions) {
                                whyTheseQuestionsText = appendSection(
                                    whyTheseQuestionsText,
                                    competencyName,
                                    evalResult.data['Neden Bu Sorular?'] || '-'
                                );
                            }
                            if (options.developmentSuggestions) {
                                developmentPlanText = appendSection(
                                    developmentPlanText,
                                    competencyName,
                                    getDevelopmentSuggestion(evalResult.data)
                                );
                            }
                        });
                    }
                });

                const row = {
                    'Ad Soyad': user.name || '-'
                };

                if (options.competencyScore) {
                    row['Müşteri Odaklılık Puanı'] = customerFocusScore || '-';
                    row['Belirsizlik Yönetimi Puanı'] = uncertaintyScore || '-';
                    row['İnsanları Etkileme Puanı'] = ieScore || '-';
                    row['Güven Veren İşbirliği ve Sinerji Puanı'] = idikScore || '-';
                }
                if (options.generalEvaluation) {
                    row['Tanım ve Genel Değerlendirme'] = generalEvaluationText || '-';
                    row['Yönetici özeti güçlü yönleri'] = executiveSummaryStrengthsText || '-';
                    row['Yönetici özeti geliştirme'] = executiveSummaryDevelopmentText || '-';
                }
                if (options.strengths) {
                    row['Güçlü Yönler'] = strengthsText || '-';
                    row['Gelişim Alanları'] = developmentAreasText || '-';
                }
                if (options.interviewQuestions) {
                    row['Mülakat Soruları'] = interviewQuestionsText || '-';
                }
                if (options.whyTheseQuestions) {
                    row['Neden Bu Sorular?'] = whyTheseQuestionsText || '-';
                }
                if (options.developmentSuggestions) {
                    row['Gelişim Planı'] = developmentPlanText || '-';
                }

                excelData.push(row);
            });

            if (excelData.length === 0) {
                return res.status(404).json({ message: 'Excel için veri bulunamadı' });
            }

            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Kişi Sonuçları');

            const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=kisi_sonuclari.xlsx');
            res.send(excelBuffer);
        } catch (error) {
            safeLog('error', 'Toplu Excel export hatası', error);
            res.status(500).json({
                message: getSafeErrorMessage(error, 'Excel oluşturulurken bir hata oluştu'),
                ...(process.env.NODE_ENV !== 'production' && { error: error.message })
            });
        }
    },

    // Şifremi Unuttum - E-posta gönderme
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'E-posta adresi gereklidir' 
                });
            }

            // Admin'i bul
            const admin = await Admin.findOne({ email });
            if (!admin) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Bu e-posta adresi ile kayıtlı admin bulunamadı' 
                });
            }

            // 6 haneli rastgele kod oluştur
            const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

            // Reset kodunu veritabanına kaydet (5 dakika geçerli)
            const resetCodeData = {
                email,
                code: resetCode,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 dakika
                used: false
            };

            // Eski kodları sil
            await mongoose.connection.db.collection('resetcodes').deleteMany({ email });

            // Yeni kodu kaydet
            await mongoose.connection.db.collection('resetcodes').insertOne(resetCodeData);

            // E-posta içeriği (XSS koruması ile)
            const safeAdminName = escapeHtml(capitalizeName(admin.name));
            const safeResetCode = escapeHtml(resetCode);
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <p><strong>Merhaba ${safeAdminName},</strong></p>

                    <p>Şifre sıfırlama talebiniz alınmıştır. Aşağıdaki kodu kullanarak şifrenizi sıfırlayabilirsiniz:</p>

                    <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                        <h2 style="color: #3B82F6; margin: 0; font-size: 32px; letter-spacing: 5px;">${safeResetCode}</h2>
                    </div>

                    <p><strong>Önemli:</strong></p>
                    <ul>
                        <li>Bu kod 5 dakika geçerlidir</li>
                        <li>Kodu kimseyle paylaşmayın</li>
                        <li>Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz</li>
                    </ul>

                    <p>Herhangi bir sorunuz varsa lütfen bizimle iletişime geçin.</p>

                    <p>İyi günler,<br>
                    <strong>Admin Paneli Ekibi</strong></p>
                </div>
            `;

            // E-posta gönder
            const emailResult = await sendEmail(
                email,
                'Şifre Sıfırlama Kodu',
                emailHtml
            );

            if (emailResult.success) {
                res.json({ 
                    success: true, 
                    message: 'Şifre sıfırlama kodu e-posta adresinize gönderildi' 
                });
            } else {
                res.status(500).json({ 
                    success: false, 
                    message: 'E-posta gönderilirken bir hata oluştu' 
                });
            }

        } catch (error) {
            safeLog('error', 'Şifre sıfırlama kodu gönderme hatası', error);
            res.status(500).json({ 
                success: false, 
                message: getSafeErrorMessage(error, 'Şifre sıfırlama kodu gönderilirken bir hata oluştu')
            });
        }
    },

    // Şifremi Unuttum - Kod doğrulama
    verifyResetCode: async (req, res) => {
        try {
            const { email, code } = req.body;

            if (!email || !code) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'E-posta adresi ve kod gereklidir' 
                });
            }

            // Reset kodunu bul
            const resetCodeData = await mongoose.connection.db.collection('resetcodes').findOne({
                email,
                code,
                used: false,
                expiresAt: { $gt: new Date() }
            });

            if (!resetCodeData) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Geçersiz veya süresi dolmuş kod' 
                });
            }

            res.json({ 
                success: true, 
                message: 'Kod doğrulandı' 
            });

        } catch (error) {
            safeLog('error', 'Kod doğrulama hatası', error);
            res.status(500).json({ 
                success: false, 
                message: getSafeErrorMessage(error, 'Kod doğrulanırken bir hata oluştu')
            });
        }
    },

    // Şifremi Unuttum - Şifre sıfırlama
    resetPassword: async (req, res) => {
        try {
            const { email, code, newPassword } = req.body;

            if (!email || !code || !newPassword) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'E-posta adresi, kod ve yeni şifre gereklidir' 
                });
            }

            // Şifre kriterleri kontrolü
            const passwordValidation = validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                return res.status(400).json({ 
                    success: false, 
                    message: passwordValidation.message 
                });
            }

            // Reset kodunu bul ve doğrula
            const resetCodeData = await mongoose.connection.db.collection('resetcodes').findOne({
                email,
                code,
                used: false,
                expiresAt: { $gt: new Date() }
            });

            if (!resetCodeData) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Geçersiz veya süresi dolmuş kod' 
                });
            }

            // Admin'i bul
            const admin = await Admin.findOne({ email });
            if (!admin) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Admin bulunamadı' 
                });
            }

            // Şifreyi güncelle
            admin.password = newPassword;
            await admin.save();

            // Reset kodunu kullanıldı olarak işaretle
            await mongoose.connection.db.collection('resetcodes').updateOne(
                { _id: resetCodeData._id },
                { $set: { used: true } }
            );

            res.json({ 
                success: true, 
                message: 'Şifreniz başarıyla güncellendi' 
            });

        } catch (error) {
            safeLog('error', 'Şifre sıfırlama hatası', error);
            res.status(500).json({ 
                success: false, 
                message: getSafeErrorMessage(error, 'Şifre sıfırlanırken bir hata oluştu')
            });
        }
    },

    // Contact form email gönderme
    sendContactEmail: async (req, res) => {
        try {
            const { to, subject, html, replyTo } = req.body;

            safeLog('debug', 'Contact email request received:', {
                to,
                subject,
                hasHtml: !!html,
                replyTo
            });

            if (!to || !subject || !html) {
                safeLog('error', 'Missing required fields:', { to, subject, hasHtml: !!html });
                return res.status(400).json({ 
                    success: false, 
                    message: 'To, subject ve html gereklidir' 
                });
            }

            safeLog('debug', 'Sending email via emailService...');
            // Contact form için özel from email: sekahveci@androngame.com
            const contactFromEmail = process.env.CONTACT_FROM_EMAIL || 'sekahveci@androngame.com';
            const emailResult = await sendEmail(to, subject, html, replyTo, contactFromEmail);

            safeLog('debug', 'Email result:', emailResult);

            if (emailResult.success) {
                safeLog('debug', 'Email sent successfully, messageId:', emailResult.messageId);
                res.json({
                    success: true,
                    message: 'E-posta başarıyla gönderildi',
                    messageId: emailResult.messageId
                });
            } else {
                safeLog('error', 'Email sending failed:', emailResult.error, emailResult.details);
                res.status(500).json({
                    success: false,
                    message: getSafeErrorMessage(new Error(emailResult.error), 'E-posta gönderilirken bir hata oluştu'),
                    ...(process.env.NODE_ENV !== 'production' && { error: emailResult.error, details: emailResult.details })
                });
            }

        } catch (error) {
            safeLog('error', 'Contact e-postası gönderme hatası', error);
            res.status(500).json({
                success: false,
                message: getSafeErrorMessage(error, 'E-posta gönderilirken bir hata oluştu'),
                ...(process.env.NODE_ENV !== 'production' && { error: error.message })
            });
        }
    }
};

adminController.clearDashboardStatsCache = () => {
    dashboardStatsCache.clear();
};

module.exports = adminController; 