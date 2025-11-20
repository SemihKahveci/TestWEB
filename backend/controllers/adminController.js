const mongoose = require('mongoose');
const EvaluationResult = require('../models/evaluationResult');
const { generatePDF } = require('../services/pdfService');
const { sendEmail } = require('../services/emailService');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const UserCode = require('../models/userCode');
const Game = require('../models/game');
const { answerMultipliers } = require('../config/constants');
const XLSX = require('xlsx');

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

            // JWT oluştur
            const token = jwt.sign(
                {
                    id: admin._id,
                    email: admin.email,
                    role: admin.role,
                    name: admin.name
                },
                process.env.JWT_SECRET || 'andron2025secretkey',
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
            console.error("Login hatası:", error);
            res.status(500).json({ message: "Sunucu hatası" });
        }
    },

    createEvaluation: async (req, res) => {
        try {
            const evaluationData = req.body;
            
            // Aynı ID'ye sahip değerlendirme var mı kontrol et
            const existingEvaluation = await EvaluationResult.findOne({ id: evaluationData.id });
            if (existingEvaluation) {
                return res.status(400).json({ message: 'Bu ID\'ye sahip bir değerlendirme zaten mevcut' });
            }

            // Yeni değerlendirmeyi oluştur
            const evaluation = await EvaluationResult.create(evaluationData);
            res.status(201).json({ message: 'Değerlendirme başarıyla oluşturuldu', evaluation });
        } catch (error) {
            console.error('Değerlendirme oluşturma hatası:', error);
            res.status(500).json({ message: 'Değerlendirme oluşturulurken bir hata oluştu' });
        }
    },

    deleteEvaluation: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Değerlendirmeyi bul ve sil
            const evaluation = await EvaluationResult.findOneAndDelete({ id: id });
            
            if (!evaluation) {
                return res.status(404).json({ message: 'Değerlendirme bulunamadı' });
            }

            res.json({ message: 'Değerlendirme başarıyla silindi' });
        } catch (error) {
            console.error('Değerlendirme silme hatası:', error);
            res.status(500).json({ message: 'Değerlendirme silinirken bir hata oluştu' });
        }
    },

    generateAndSendPDF: async (req, res) => {
        try {
            const { code, email, options } = req.body;
                  
            // Kullanıcı kodunu bul
            const userCode = await UserCode.findOne({ code });
            if (!userCode) {
                return res.status(404).json({ message: 'Kod bulunamadı' });
            }

            // Tüm oyunları bul (2 gezegen için 2 farklı Game kaydı olabilir)
            const games = await Game.find({ playerCode: code });
            if (!games || games.length === 0) {
                return res.status(404).json({ message: 'Oyun sonuçları bulunamadı' });
            }
            
            // Tüm oyunlardaki evaluationResult'ları birleştir
            let allEvaluationResults = [];
            for (const game of games) {
                if (game.evaluationResult) {
                    // Eğer evaluationResult bir dizi ise (çoklu rapor)
                    if (Array.isArray(game.evaluationResult)) {
                        allEvaluationResults = allEvaluationResults.concat(game.evaluationResult);
                    } else {
                        // Eğer tek rapor ise diziye çevir
                        allEvaluationResults.push(game.evaluationResult);
                    }
                }
            }

            // Benzersiz raporları filtrele (aynı ID'li raporları tekrarlama)
            const uniqueResults = [];
            const seenIds = new Set();
            
            for (const result of allEvaluationResults) {
                if (result.data && result.data.ID && !seenIds.has(result.data.ID)) {
                    seenIds.add(result.data.ID);
                    uniqueResults.push(result);
                }
            }

            // PDF oluştur
            const pdfBuffer = await generatePDF({
                userCode,
                game: { evaluationResult: uniqueResults },
                options
            });

            // PDF'i indir
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=degerlendirme_${code}.pdf`);
            res.send(pdfBuffer);

        } catch (error) {
            console.error('PDF oluşturma hatası:', error);
            console.error('Hata detayı:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            res.status(500).json({ 
                message: 'PDF oluşturulurken bir hata oluştu', 
                error: error.message,
                details: error.stack
            });
        }
    },

    previewPDF: async (req, res) => {
        try {
            const { code, email, options } = req.body;
            
            // Kullanıcı kodunu bul
            const userCode = await UserCode.findOne({ code });
            if (!userCode) {
                return res.status(404).json({ message: 'Kod bulunamadı' });
            }

            // Tüm oyunları bul (2 gezegen için 2 farklı Game kaydı olabilir)
            const games = await Game.find({ playerCode: code });
            if (!games || games.length === 0) {
                return res.status(404).json({ message: 'Oyun sonuçları bulunamadı' });
            }
            
            // Tüm oyunlardaki evaluationResult'ları birleştir
            let allEvaluationResults = [];
            for (const game of games) {
                if (game.evaluationResult) {
                    // Eğer evaluationResult bir dizi ise (çoklu rapor)
                    if (Array.isArray(game.evaluationResult)) {
                        allEvaluationResults = allEvaluationResults.concat(game.evaluationResult);
                    } else {
                        // Eğer tek rapor ise diziye çevir
                        allEvaluationResults.push(game.evaluationResult);
                    }
                }
            }

            // Benzersiz raporları filtrele (aynı ID'li raporları tekrarlama)
            const uniqueResults = [];
            const seenIds = new Set();
            
            for (const result of allEvaluationResults) {
                if (result.data && result.data.ID && !seenIds.has(result.data.ID)) {
                    seenIds.add(result.data.ID);
                    uniqueResults.push(result);
                }
            }

            // PDF oluştur
            const pdfBuffer = await generatePDF({
                userCode,
                game: { evaluationResult: uniqueResults },
                options
            });

            // PDF'i önizle
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=degerlendirme_${code}.pdf`);
            res.send(pdfBuffer);

        } catch (error) {
            console.error('PDF önizleme hatası:', error);
            res.status(500).json({ message: 'PDF önizlenirken bir hata oluştu', error: error.message });
        }
    },

    // Kod gönderme
    sendCode: async (req, res) => {
        try {
            const { code, email, name, planet } = req.body;

            if (!code) {
                return res.status(400).json({ success: false, message: 'Kod bulunamadı' });
            }

            // 72 saat sonrasını hesapla
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 240);
            const formattedExpiryDate = expiryDate.toLocaleDateString('tr-TR');

            // Kodu veritabanına kaydet
            const userCode = await UserCode.findOneAndUpdate(
                { code },
                {
                    name,
                    email,
                    planet,
                    status: 'Beklemede',
                    sentDate: new Date(),
                    expiryDate
                },
                { new: true }
            );

            if (!userCode) {
                return res.status(400).json({ success: false, message: 'Kod bulunamadı' });
            }

            // Admin adının ilk harfini büyük yap
            const capitalizeName = (name) => {
                if (!name) return '';
                return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            };

            // E-posta içeriği
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <p><strong>Kaptan ${capitalizeName(name)},</strong></p>

                    <p>Artık komuta sende, yeni yetkinlik değerlendirme çözümümüz ile ANDRON Evreni'ne ilk adımını at ve 15-20 dakikalık maceraya hazır ol! 🚀</p>

                    <p>🎥 Görevine başlamadan önce <a href="https://www.youtube.com/watch?v=QALP4qOnFws" style="color: #0286F7; text-decoration: none; font-weight: bold;">"Oyun Deneyim Rehberi"</a>ni izle ve dikkat edilmesi gereken püf noktaları öğren.</p>

                    <p><strong>🔺Giriş Bilgileri:</strong></p>
                    <p>🗝 Tek Kullanımlık Giriş Kodu: <strong>${code}</strong><br>
                    ⏱️ <strong>${formattedExpiryDate}</strong> tarihine kadar geçerlidir.</p>

                    <p><strong>🔺Uygulamayı İndir ve Başla:</strong></p>
                    <p>
                        <a href="https://play.google.com/store/apps/details?id=com.Fugi.Andron" style="color: #0286F7; text-decoration: none; font-weight: bold;">Google Play Store</a><br>
                        <a href="https://apps.apple.com/us/app/andron-mission-venus/id6739467164" style="color: #0286F7; text-decoration: none; font-weight: bold;">App Store</a>
                    </p>

                    <p><strong>⚠️ Unutma!</strong> Oyun Deneyim Rehberini atlamak, görev verimliliği düşürülebilir ve keşif esnasında sorun yaşayabilirsin!</p>

                    <p>Herhangi bir teknik aksaklıkta <a href="mailto:info@androngame.com" style="color: #0286F7; text-decoration: none;">info@androngame.com</a> üzerinden bize ulaşabilirsin.</p>

                    <p>Keyifli keşifler, Kaptan!<br>
                    <strong>ANDRON Game Ekibi</strong></p>
                </div>
            `;

            // E-posta gönder
            const emailResult = await sendEmail(
                email,
                'ANDRON Game Deneyimine Davetlisin!',
                emailHtml
            );

            if (emailResult.success) {
                // 72 saat sonra kodu sil
                // setTimeout(async () => {
                //     try {
                //         await UserCode.findOneAndDelete({ code });
                //     } catch (error) {
                //     }
                // }, 72 * 60 * 60 * 1000); // 72 saat

                res.json({ success: true, message: 'Kod başarıyla gönderildi' });
            } else {
                res.status(500).json({ 
                    success: false, 
                    message: `E-posta gönderilemedi: ${emailResult.error || 'Bilinmeyen hata'}` 
                });
            }
        } catch (error) {
 
            res.status(500).json({ success: false, message: 'Kod gönderilirken bir hata oluştu' });
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
            const { code, page, limit, searchTerm, statusFilter, showExpiredWarning } = req.query;
            
            // Pagination parametreleri
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 10;
            const skip = (pageNum - 1) * limitNum;
            
            let results;
            let totalCount;
            let query = {};
            
            if (code) {
                // Tek kod için pagination yok
                results = await UserCode.find({ code });
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
                
                // Search term varsa isim ile filtrele
                if (searchTerm) {
                    query.name = { $regex: searchTerm, $options: 'i' };
                }
                
                // Toplam sayıyı hesapla (filtrelemeden sonra)
                totalCount = await UserCode.countDocuments(query);
                
                // Sorguyu çalıştır
                results = await UserCode.find(query)
                    .sort({ sentDate: -1 })
                    .skip(skip)
                    .limit(limitNum);
            }
            
            // Performans: Tüm Game'leri tek sorguda çek (N+1 sorgu problemini çöz)
            const playerCodes = results.map(r => r.code);
            const allGames = await Game.find({ 
                playerCode: { $in: playerCodes } 
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
                    
                    // UserCode güncellemesini topla (non-blocking)
                    if (Object.keys(updateData).length > 0) {
                        updatePromises.push(
                            UserCode.findByIdAndUpdate(result._id, updateData)
                        );
                    }
                }
                
                // Titan oyununu bul
                const titanGame = games.find(g => g.section === '1' || g.section === 1);
                
                return {
                    code: result.code,
                    name: result.name,
                    email: result.email,
                    status: result.status,
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
                    console.error('UserCode güncelleme hatası (non-blocking):', err);
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
            console.error('Sonuçları getirme hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Sonuçlar alınırken bir hata oluştu'
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
            console.error('Durum güncelleme hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Durum güncellenirken bir hata oluştu'
            });
        }
    },

    // Yeni admin oluşturma
    createAdmin: async (req, res) => {
        try {
            const { email, password, name, role, company } = req.body;

            // Email kontrolü
            const existingAdmin = await Admin.findOne({ email });
            if (existingAdmin) {
                return res.status(400).json({ message: 'Bu email adresi zaten kullanımda' });
            }

            // Yeni admin oluştur
            const admin = new Admin({
                email,
                password,
                name,
                company,
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
                    company: admin.company,
                    role: admin.role
                }
            });
        } catch (error) {
            console.error('Admin oluşturma hatası:', error);
            res.status(500).json({ 
                success: false,
                message: 'Admin oluşturulurken bir hata oluştu',
                error: error.message 
            });
        }
    },

    // Admin güncelleme
    updateAdmin: async (req, res) => {
        try {
            const { id } = req.params;
            const { email, password, name, company, role, isActive } = req.body;

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
            if (company) admin.company = company;
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
                    company: admin.company,
                    role: admin.role,
                    isActive: admin.isActive
                }
            });
        } catch (error) {
            console.error('Admin güncelleme hatası:', error);
            res.status(500).json({ 
                success: false,
                message: 'Admin güncellenirken bir hata oluştu',
                error: error.message 
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
            console.error('Admin listesi alma hatası:', error);
            res.status(500).json({ 
                success: false,
                message: 'Admin listesi alınırken bir hata oluştu',
                error: error.message 
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
            console.error('Admin getirme hatası:', error);
            res.status(500).json({ 
                success: false,
                message: 'Admin bilgileri alınırken bir hata oluştu',
                error: error.message 
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

            // Game modelinden sil
            await mongoose.model('Game').deleteMany({ playerCode: code });
            
            // UserCode modelinden tamamen sil
            await mongoose.model('UserCode').findOneAndDelete({ code });

            res.json({ message: 'Sonuç başarıyla silindi' });
        } catch (error) {
            console.error('Sonuç silme hatası:', error);
            res.status(500).json({ message: 'Sonuç silinirken bir hata oluştu' });
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
            console.error('Admin silme hatası:', error);
            res.status(500).json({ 
                success: false,
                message: 'Admin silinirken bir hata oluştu',
                error: error.message 
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

            // Admin adının ilk harfini büyük yap
            const capitalizeName = (name) => {
                if (!name) return '';
                return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            };

            const completionEmailHtml = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <p><strong>Kaptan ${capitalizeName(name)},</strong></p>

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
            console.error('Tamamlanma e-postası gönderme hatası:', error);
            res.status(500).json({
                success: false,
                message: 'E-posta gönderilirken bir hata oluştu',
                error: error.message
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

            // Kullanıcı kodunu bul
            const userCode = await UserCode.findOne({ code });
            if (!userCode) {
                return res.status(404).json({ message: 'Kod bulunamadı' });
            }

            // Oyun sonuçlarını bul
            const games = await Game.find({ playerCode: code });
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
            
            console.log('Doğru skorlar:', {
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
                                'Genel Değerlendirme': evalResult.data['Genel Değerlendirme'] || '-',
                                'Güçlü Yönler': evalResult.data['Güçlü Yönler'] || '-',
                                'Gelişim Alanları': evalResult.data['Gelişim Alanları'] || '-',
                                'Mülakat Soruları': evalResult.data['Mülakat Soruları'] || '-',
                                'Neden Bu Sorular?': evalResult.data['Neden Bu Sorular?'] || '-',
                                'Gelişim Planı': evalResult.data['Gelişim Önerileri -1'] || evalResult.data['Gelişim Önerileri -2'] || evalResult.data['Gelişim Önerileri - 3'] || '-'
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
            console.error('Excel export hatası:', error);
            res.status(500).json({ 
                message: 'Excel oluşturulurken bir hata oluştu', 
                error: error.message 
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

            // Admin adının ilk harfini büyük yap
            const capitalizeName = (name) => {
                if (!name) return '';
                return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            };

            // E-posta içeriği
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <p><strong>Merhaba ${capitalizeName(admin.name)},</strong></p>

                    <p>Şifre sıfırlama talebiniz alınmıştır. Aşağıdaki kodu kullanarak şifrenizi sıfırlayabilirsiniz:</p>

                    <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                        <h2 style="color: #3B82F6; margin: 0; font-size: 32px; letter-spacing: 5px;">${resetCode}</h2>
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
            console.error('Şifre sıfırlama kodu gönderme hatası:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Şifre sıfırlama kodu gönderilirken bir hata oluştu' 
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
            console.error('Kod doğrulama hatası:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Kod doğrulanırken bir hata oluştu' 
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
            console.error('Şifre sıfırlama hatası:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Şifre sıfırlanırken bir hata oluştu' 
            });
        }
    },

    // Contact form email gönderme
    sendContactEmail: async (req, res) => {
        try {
            const { to, subject, html, replyTo } = req.body;

            console.log('Contact email request received:', {
                to,
                subject,
                hasHtml: !!html,
                replyTo
            });

            if (!to || !subject || !html) {
                console.error('Missing required fields:', { to, subject, hasHtml: !!html });
                return res.status(400).json({ 
                    success: false, 
                    message: 'To, subject ve html gereklidir' 
                });
            }

            console.log('Sending email via emailService...');
            // Contact form için özel from email: sekahveci@androngame.com
            const contactFromEmail = process.env.CONTACT_FROM_EMAIL || 'sekahveci@androngame.com';
            const emailResult = await sendEmail(to, subject, html, replyTo, contactFromEmail);

            console.log('Email result:', emailResult);

            if (emailResult.success) {
                console.log('Email sent successfully, messageId:', emailResult.messageId);
                res.json({
                    success: true,
                    message: 'E-posta başarıyla gönderildi',
                    messageId: emailResult.messageId
                });
            } else {
                console.error('Email sending failed:', emailResult.error, emailResult.details);
                res.status(500).json({
                    success: false,
                    message: 'E-posta gönderilirken bir hata oluştu',
                    error: emailResult.error,
                    details: emailResult.details
                });
            }

        } catch (error) {
            console.error('Contact e-postası gönderme hatası:', error);
            res.status(500).json({
                success: false,
                message: 'E-posta gönderilirken bir hata oluştu',
                error: error.message
            });
        }
    }
};

module.exports = adminController; 