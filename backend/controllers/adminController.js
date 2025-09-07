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

const adminController = {
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: 'Email ve şifre gereklidir' });
            }

            // Admin'i bul
            const admin = await Admin.findOne({ email });
            if (!admin) {
              
                return res.status(401).json({ message: 'Geçersiz email veya şifre' });
            }

            // Şifreyi kontrol et
            const isMatch = await admin.comparePassword(password);
            if (!isMatch) {
          
                return res.status(401).json({ message: 'Geçersiz email veya şifre' });
            }

            // Admin aktif değilse
            if (!admin.isActive) {
       
                return res.status(401).json({ message: 'Hesabınız aktif değil' });
            }

            // Token oluştur
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

            res.json({
                success: true,
                token,
                admin: {
                    id: admin._id,
                    email: admin.email,
                    name: admin.name,
                    role: admin.role
                }
            });
        } catch (error) {
            console.error('Login hatası:', error);
            res.status(500).json({ message: 'Sunucu hatası', error: error.message });
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

            // Oyun sonuçlarını bul
            const game = await Game.findOne({ playerCode: code });
            if (!game) {
          
                return res.status(404).json({ message: 'Oyun sonuçları bulunamadı' });
            }
           

            // PDF oluştur
            const pdfBuffer = await generatePDF({
                userCode,
                game,
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

            // Oyun sonuçlarını bul
            const game = await Game.findOne({ playerCode: code });
            if (!game) {
                return res.status(404).json({ message: 'Oyun sonuçları bulunamadı' });
            }

            // PDF oluştur
            const pdfBuffer = await generatePDF({
                userCode,
                game,
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

            // E-posta içeriği
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <p><strong>Kaptan ${name},</strong></p>

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
                res.status(500).json({ success: false, message: 'E-posta gönderilirken bir hata oluştu' });
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
            const { code } = req.query;
            let results;
            if (code) {
                results = await UserCode.find({ code });
            } else {
                results = await UserCode.find().sort({ sentDate: -1 });
            }
            

            
            // Her sonuç için Game modelinden de veri al
            const mappedResults = await Promise.all(results.map(async (result) => {
                // Game modelinden ilgili tüm oyunları bul (Venus ve Titan için)
                const games = await Game.find({ playerCode: result.code });
                
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
                    
                    // UserCode'u güncelle
                    if (Object.keys(updateData).length > 0) {
                        await UserCode.findByIdAndUpdate(result._id, updateData);
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
                    // Oyun cevaplarını da ekle (tüm oyunların cevaplarını birleştir)
                    answers: games.length > 0 ? games.flatMap(g => g.answers || []) : null,
                    // Rapor ID'sini ekle
                    reportId: reportId
                };
            }));
            
            res.json({
                success: true,
                results: mappedResults
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

            const completionEmailHtml = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <p><strong>Kaptan ${name},</strong></p>

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
    }
};

module.exports = adminController; 