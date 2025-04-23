const mongoose = require('mongoose');
const EvaluationResult = require('../models/evaluationResult');
const { generatePDF } = require('../services/pdfService');
const { sendEmail } = require('../services/emailService');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

const adminController = {
    login: async (req, res) => {
        try {
            console.log('Login isteği alındı:', req.body);
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: 'Email ve şifre gereklidir' });
            }

            // Admin'i bul
            const admin = await Admin.findOne({ email });
            if (!admin) {
                console.log('Admin bulunamadı:', email);
                return res.status(401).json({ message: 'Geçersiz email veya şifre' });
            }

            // Şifreyi kontrol et
            const isMatch = await admin.comparePassword(password);
            if (!isMatch) {
                console.log('Şifre eşleşmedi:', email);
                return res.status(401).json({ message: 'Geçersiz email veya şifre' });
            }

            // Admin aktif değilse
            if (!admin.isActive) {
                console.log('Admin aktif değil:', email);
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
                { expiresIn: '1d' }
            );

            console.log('Giriş başarılı:', email);
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
            const { id, email } = req.body;
            const evaluation = await Evaluation.findById(id);
            
            if (!evaluation) {
                return res.status(404).json({ message: 'Değerlendirme bulunamadı' });
            }

            // PDF oluştur
            const pdfBuffer = await generatePDF(evaluation);

            // E-posta içeriği
            const emailHtml = `
                <h2>Değerlendirme Raporu</h2>
                <p>Sayın ${evaluation.candidateName},</p>
                <p>Değerlendirme raporunuz ekte yer almaktadır.</p>
                <p>İyi çalışmalar dileriz.</p>
            `;

            // E-posta gönder
            const emailResult = await sendEmail(
                email,
                'Değerlendirme Raporu',
                emailHtml,
                pdfBuffer
            );

            if (emailResult.success) {
                res.json({ message: 'PDF başarıyla oluşturuldu ve e-posta ile gönderildi' });
            } else {
                res.status(500).json({ message: 'E-posta gönderilirken bir hata oluştu' });
            }
        } catch (error) {
            console.error('PDF oluşturma ve gönderme hatası:', error);
            res.status(500).json({ message: 'PDF oluşturulurken bir hata oluştu' });
        }
    },

    // Kod gönderme
    sendCode: async (req, res) => {
        try {
            const { code, email } = req.body;

            // 72 saat sonrasını hesapla
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 72);
            const formattedExpiryDate = expiryDate.toLocaleDateString('tr-TR');

            // E-posta içeriği
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <p>Sevgili Katılımcı,</p>

                    <p>Andron Yetkinlik Değerlendirme Oyununu oynamaya davetlisin.</p>

                    <p>Oyunu, dikkatinin dağılmayacağı sessiz bir ortamda yapmanızı öneriyoruz. Oyuna masaüstü bilgisayarından, tabletinden veya akıllı telefonundan erişebilirsin.</p>

                    <p>Oyunla ilgili aşağıda dikkat etmen gereken bazı önemli noktalar bulunmaktadır.</p>

                    <ul style="list-style-type: none; padding-left: 0;">
                        <li style="margin-bottom: 10px;">► Oyunun başında gelen oyun oynama talimatlarını dikkatlice incelemen ve oyun için istenen izinleri vermen gereklidir.</li>
                        <li style="margin-bottom: 10px;">► Her bir soru için belirli bir süren olacaktır. Ekranın bilerek veya yanlışlıkla kapanması geri sayımı durdurmayacaktır.</li>
                        <li style="margin-bottom: 10px;">► Her soru için belirlenen süre içinde seçim yapmadığın durumda en üstte bulunan seçenek senin seçimin olarak kabul edilir.</li>
                        <li style="margin-bottom: 10px;">► Oyunu oynarken parlaklığı en üst seviyede tutmanı ve telefonunun sesinin açık olmasını öneriyoruz.</li>
                    </ul>

                    <p>Oyunu en geç ${formattedExpiryDate} tarihine kadar tamamlamanızı önemle rica ediyoruz.</p>

                    <p>Oyunu başlatmak için lütfen aşağıdaki linkden oyunu indirip size gönderilen kod ile oyuna giriş yapınız.</p>

                    <p>IOS linki<br>
                    ANDROID linki<br>
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
                res.json({ success: true, message: 'Kod başarıyla gönderildi' });
            } else {
                res.status(500).json({ success: false, message: 'E-posta gönderilirken bir hata oluştu' });
            }
        } catch (error) {
            console.error('Kod gönderme hatası:', error);
            res.status(500).json({ success: false, message: 'Kod gönderilirken bir hata oluştu' });
        }
    },

    // Yeni admin oluşturma
    createAdmin: async (req, res) => {
        try {
            const { email, password, name, role } = req.body;

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
                role: role || 'admin'
            });

            await admin.save();

            res.status(201).json({
                message: 'Admin başarıyla oluşturuldu',
                admin: {
                    id: admin._id,
                    email: admin.email,
                    name: admin.name,
                    role: admin.role
                }
            });
        } catch (error) {
            res.status(500).json({ message: 'Sunucu hatası' });
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
    }
};

module.exports = adminController; 