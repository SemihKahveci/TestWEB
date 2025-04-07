const mongoose = require('mongoose');
const EvaluationResult = require('../models/evaluationResult');
const { generatePDF } = require('../services/pdfService');
const { sendEmail } = require('../services/emailService');

const adminController = {
    login: async (req, res) => {
        const { username, password } = req.body;
        
        // Email ve şifre kontrolü
        if (username === 'andron@andron' && password === 'andron2025') {
            res.json({ message: 'Giriş başarılı' });
        } else {
            res.status(401).json({ message: 'Geçersiz email veya şifre' });
        }
    },

    seedData: async (req, res) => {
        try {
            // Örnek veri
            const sampleData = {
                id: "1024",
                generalEvaluation: "Genel değerlendirme örneği",
                strengths: [
                    {
                        title: "Güçlü Yön 1",
                        description: "Güçlü yön açıklaması"
                    }
                ],
                development: [
                    {
                        title: "Gelişim Alanı 1",
                        description: "Gelişim alanı açıklaması"
                    }
                ],
                interviewQuestions: [
                    {
                        category: "Kategori 1",
                        questions: [
                            {
                                mainQuestion: "Ana soru",
                                followUpQuestions: ["Alt soru 1", "Alt soru 2"]
                            }
                        ]
                    }
                ],
                developmentSuggestions: [
                    {
                        title: "Öneri Başlığı",
                        area: "Alan",
                        target: "Hedef",
                        suggestions: [
                            {
                                title: "Öneri 1",
                                content: "Öneri içeriği"
                            }
                        ]
                    }
                ]
            };

            // Veriyi kaydet
            const evaluation = await EvaluationResult.create(sampleData);
            res.status(201).json({ message: 'Örnek veri başarıyla eklendi', evaluation });
        } catch (error) {
            console.error('Örnek veri ekleme hatası:', error);
            res.status(500).json({ message: 'Örnek veri eklenirken bir hata oluştu' });
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
    }
};

module.exports = adminController; 