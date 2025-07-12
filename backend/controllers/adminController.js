const mongoose = require('mongoose');
const EvaluationResult = require('../models/evaluationResult');
const { generatePDF } = require('../services/pdfService');
const { sendEmail } = require('../services/emailService');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const UserCode = require('../models/userCode');
const Game = require('../models/game');

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
            expiryDate.setHours(expiryDate.getHours() + 72);
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
                    <p>Sevgili ${name},</p>

                    <p>Andron Yetkinlik Değerlendirme Oyununu oynamaya davetlisin.</p>

                    <p>Oyunu, dikkatinin dağılmayacağı sessiz bir ortamda yapmanızı öneriyoruz. Oyuna tabletinden veya akıllı telefonundan erişebilirsin.</p>

                    <p>Oyunla ilgili aşağıda dikkat etmen gereken bazı önemli noktalar bulunmaktadır.</p>

                    <ul style="list-style-type: none; padding-left: 0;">
                        <li style="margin-bottom: 10px;">► Oyunun başında gelen oyun oynama talimatlarını dikkatlice incelemen ve oyun için istenen izinleri vermen gereklidir.</li>
                        <li style="margin-bottom: 10px;">► Her bir soru için belirli bir süren olacaktır.</li>
                        <li style="margin-bottom: 10px;">► Her soru için belirlenen süre içinde seçim yapmadığın durumda en üstte bulunan seçenek senin seçimin olarak kabul edilir.</li>
                        <li style="margin-bottom: 10px;">► Oyunu oynarken parlaklığı en üst seviyede tutmanı ve telefonunun sesinin açık olmasını öneriyoruz.</li>
                    </ul>

                    <p>Oyunu en geç ${formattedExpiryDate} tarihine kadar tamamlamanızı önemle rica ediyoruz.</p>

                    <p>Oyunu başlatmak için lütfen aşağıdaki linkden oyunu indirip size gönderilen kod ile oyuna giriş yapınız.</p>

                    <p>IOS linki : https://apps.apple.com/us/app/andron-mission-venus/id6739467164 <br>
                    ANDROID linki : https://play.google.com/store/apps/details?id=com.Fugi.Andron <br>
                    <strong>Kod: ${code}</strong></p>

                    <p>Herhangi bir sorunuz olduğunda info@androngame.com üzerinden Andron ekibi ile iletişime geçebilirsiniz.</p>

                    <p>Saygılarımızla,</p>
                </div>
            `;

            // E-posta gönder
            const emailResult = await sendEmail(
                email,
                'Yetkinlik Değerlendirme Oyunu Daveti',
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
            res.json({
                success: true,
                results: results.map(result => ({
                    code: result.code,
                    name: result.name,
                    status: result.status,
                    sentDate: result.sentDate,
                    completionDate: result.completionDate,
                    expiryDate: result.expiryDate,
                    customerFocusScore: result.customerFocusScore,
                    uncertaintyScore: result.uncertaintyScore
                }))
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
            const { email, password, name, role, isActive } = req.body;

            // Admin'i bul
            const admin = await Admin.findById(id);
            if (!admin) {
                return res.status(404).json({ message: 'Admin bulunamadı' });
            }

            // Güncelleme
            if (email) admin.email = email;
            if (password) admin.password = password;
            if (name) admin.name = name;
            if (role) admin.role = role;
            if (typeof isActive === 'boolean') admin.isActive = isActive;

            await admin.save();

            res.json({
                message: 'Admin başarıyla güncellendi',
                admin: {
                    id: admin._id,
                    email: admin.email,
                    name: admin.name,
                    role: admin.role,
                    isActive: admin.isActive
                }
            });
        } catch (error) {
            res.status(500).json({ message: 'Sunucu hatası' });
        }
    },

    // Admin listesi
    getAdmins: async (req, res) => {
        try {
            const admins = await Admin.find().select('-password');
            res.json(admins);
        } catch (error) {
            res.status(500).json({ message: 'Sunucu hatası' });
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
    }
};

module.exports = adminController; 