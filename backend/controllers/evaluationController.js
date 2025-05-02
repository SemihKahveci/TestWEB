const EvaluationResult = require('../models/evaluationResult');
const htmlPdf = require('html-pdf-node');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const evaluationController = {
    async getEvaluationById(req, res) {
        try {
            const { id } = req.params;
            console.log('Aranan ID:', id);

            const evaluation = await EvaluationResult.findOne({ ID: id });
            console.log('Bulunan değerlendirme:', JSON.stringify(evaluation, null, 2));

            if (!evaluation) {
                return res.status(404).json({ error: 'Değerlendirme bulunamadı' });
            }

            res.json(evaluation);
        } catch (error) {
            console.error('Değerlendirme getirme hatası:', error);
            res.status(500).json({ error: 'Değerlendirme yüklenirken bir hata oluştu' });
        }
    },

    generatePDF: async (req, res) => {
        try {
            const { code, options } = req.body;
            console.log('PDF oluşturulacak kod:', code);
            console.log('Seçilen bölümler:', options);

            const userCode = await mongoose.model('UserCode').findOne({ code });
            if (!userCode) {
                return res.status(404).json({ message: 'Kullanıcı kodu bulunamadı' });
            }

            if (!userCode.evaluationResult) {
                return res.status(404).json({ message: 'Değerlendirme sonucu bulunamadı' });
            }

            const evaluation = userCode.evaluationResult;

            // Verileri al
            const genelDegerlendirme = evaluation['Genel Değerlendirme'];
            const gucluYonler = evaluation['Güçlü Yönler'];
            const gelisimAlanlari = evaluation['Gelişim Alanları'];
            const mulakatSorulari = evaluation['Mülakat Soruları'];
            const nedenBuSorular = evaluation['Neden Bu Sorular?'];
            const gelisimOnerileri1 = evaluation['Gelişim Önerileri -1'];
            const gelisimOnerileri2 = evaluation['Gelişim Önerileri -2'];
            const gelisimOnerileri3 = evaluation['Gelişim Önerileri - 3'];

            // Gelişim önerilerini ayrı başlıklar altında oluştur
            let gelisimOnerileriHTML = '';
            const gelisimOnerileriKeys = [
                { key: 'Gelişim Önerileri -1', title: 'Gelişim Önerisi 1' },
                { key: 'Gelişim Önerileri -2', title: 'Gelişim Önerisi 2' },
                { key: 'Gelişim Önerileri - 3', title: 'Gelişim Önerisi 3' }
            ];
            
            gelisimOnerileriKeys.forEach(item => {
                if (evaluation[item.key]) {
                    gelisimOnerileriHTML += `
                        <div class="subsection">
                            <h3>${item.title}</h3>
                            <p>${evaluation[item.key]}</p>
                        </div>
                    `;
                }
            });

            // HTML içeriğini oluştur
            let htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            padding: 20px;
                            line-height: 1.6;
                        }
                        h1 { 
                            text-align: center;
                            color: #2c3e50;
                            margin-bottom: 30px;
                        }
                        h2 { 
                            color: #34495e;
                            border-bottom: 2px solid #eee;
                            padding-bottom: 10px;
                            margin-top: 25px;
                        }
                        h3 {
                            color: #2c3e50;
                            margin-top: 15px;
                            margin-bottom: 10px;
                        }
                        .section { 
                            margin-bottom: 25px;
                            padding: 15px;
                            background-color: #f9f9f9;
                            border-radius: 5px;
                        }
                        .subsection {
                            margin-bottom: 15px;
                        }
                        p {
                            margin: 10px 0;
                        }
                    </style>
                </head>
                <body>
                    <h1>Değerlendirme Raporu</h1>
            `;

            // Seçilen bölümleri ekle
            if (options.generalEvaluation) {
                htmlContent += `
                    <div class="section">
                        <h2>Tanım ve Genel Değerlendirme</h2>
                        <p>${genelDegerlendirme || 'Değerlendirme bulunamadı'}</p>
                    </div>
                `;
            }

            if (options.strengths) {
                htmlContent += `
                    <div class="section">
                        <h2>Güçlü Yönler ve Gelişim Alanları</h2>
                        <div class="subsection">
                            <h3>Güçlü Yönler</h3>
                            <p>${gucluYonler || 'Değerlendirme bulunamadı'}</p>
                        </div>
                        <div class="subsection">
                            <h3>Gelişim Alanları</h3>
                            <p>${gelisimAlanlari || 'Değerlendirme bulunamadı'}</p>
                        </div>
                    </div>
                `;
            }

            if (options.interviewQuestions) {
                htmlContent += `
                    <div class="section">
                        <h2>Mülakat Soruları</h2>
                        <div class="subsection">
                            <h3>Sorular</h3>
                            <p>${mulakatSorulari || 'Değerlendirme bulunamadı'}</p>
                        </div>
                        <div class="subsection">
                            <h3>Neden Bu Sorular?</h3>
                            <p>${nedenBuSorular || 'Değerlendirme bulunamadı'}</p>
                        </div>
                    </div>
                `;
            }

            if (options.developmentSuggestions) {
                htmlContent += `
                    <div class="section">
                        <h2>Gelişim Planı</h2>
                        ${gelisimOnerileriHTML}
                    </div>
                `;
            }

            htmlContent += `
                </body>
                </html>
            `;

            // PDF oluştur
            const pdfOptions = {
                format: 'A4',
                margin: { top: 20, right: 20, bottom: 20, left: 20 }
            };

            const file = { content: htmlContent };
            const pdfBuffer = await htmlPdf.generatePdf(file, pdfOptions);

            // PDF'i gönder
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=degerlendirme_${code}.pdf`);
            res.send(pdfBuffer);
        } catch (error) {
            console.error('PDF oluşturma hatası:', error);
            res.status(500).json({ message: 'PDF oluşturulurken bir hata oluştu' });
        }
    },

    previewPDF: async (req, res) => {
        try {
            const { code } = req.query;
            const options = {
                generalEvaluation: req.query.generalEvaluation === 'true',
                strengths: req.query.strengths === 'true',
                interviewQuestions: req.query.interviewQuestions === 'true',
                developmentSuggestions: req.query.developmentSuggestions === 'true'
            };

            const userCode = await mongoose.model('UserCode').findOne({ code });
            if (!userCode) {
                return res.status(404).json({ message: 'Kullanıcı kodu bulunamadı' });
            }

            if (!userCode.evaluationResult) {
                return res.status(404).json({ message: 'Değerlendirme sonucu bulunamadı' });
            }

            const evaluation = userCode.evaluationResult;

            // Verileri al
            const genelDegerlendirme = evaluation['Genel Değerlendirme'];
            const gucluYonler = evaluation['Güçlü Yönler'];
            const gelisimAlanlari = evaluation['Gelişim Alanları'];
            const mulakatSorulari = evaluation['Mülakat Soruları'];
            const nedenBuSorular = evaluation['Neden Bu Sorular?'];
            const gelisimOnerileri1 = evaluation['Gelişim Önerileri -1'];
            const gelisimOnerileri2 = evaluation['Gelişim Önerileri -2'];
            const gelisimOnerileri3 = evaluation['Gelişim Önerileri - 3'];

            // Gelişim önerilerini ayrı başlıklar altında oluştur
            let gelisimOnerileriHTML = '';
            const gelisimOnerileriKeys = [
                { key: 'Gelişim Önerileri -1', title: 'Gelişim Önerisi 1' },
                { key: 'Gelişim Önerileri -2', title: 'Gelişim Önerisi 2' },
                { key: 'Gelişim Önerileri - 3', title: 'Gelişim Önerisi 3' }
            ];
            
            gelisimOnerileriKeys.forEach(item => {
                if (evaluation[item.key]) {
                    gelisimOnerileriHTML += `
                        <div class="subsection">
                            <h3>${item.title}</h3>
                            <p>${evaluation[item.key]}</p>
                        </div>
                    `;
                }
            });

            // HTML içeriğini oluştur
            let htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            padding: 20px;
                            line-height: 1.6;
                        }
                        h1 { 
                            text-align: center;
                            color: #2c3e50;
                            margin-bottom: 30px;
                        }
                        h2 { 
                            color: #34495e;
                            border-bottom: 2px solid #eee;
                            padding-bottom: 10px;
                            margin-top: 25px;
                        }
                        h3 {
                            color: #2c3e50;
                            margin-top: 15px;
                            margin-bottom: 10px;
                        }
                        .section { 
                            margin-bottom: 25px;
                            padding: 15px;
                            background-color: #f9f9f9;
                            border-radius: 5px;
                        }
                        .subsection {
                            margin-bottom: 15px;
                        }
                        p {
                            margin: 10px 0;
                        }
                    </style>
                </head>
                <body>
                    <h1>Değerlendirme Raporu</h1>
            `;

            // Seçilen bölümleri ekle
            if (options.generalEvaluation) {
                htmlContent += `
                    <div class="section">
                        <h2>Tanım ve Genel Değerlendirme</h2>
                        <p>${genelDegerlendirme || 'Değerlendirme bulunamadı'}</p>
                    </div>
                `;
            }

            if (options.strengths) {
                htmlContent += `
                    <div class="section">
                        <h2>Güçlü Yönler ve Gelişim Alanları</h2>
                        <div class="subsection">
                            <h3>Güçlü Yönler</h3>
                            <p>${gucluYonler || 'Değerlendirme bulunamadı'}</p>
                        </div>
                        <div class="subsection">
                            <h3>Gelişim Alanları</h3>
                            <p>${gelisimAlanlari || 'Değerlendirme bulunamadı'}</p>
                        </div>
                    </div>
                `;
            }

            if (options.interviewQuestions) {
                htmlContent += `
                    <div class="section">
                        <h2>Mülakat Soruları</h2>
                        <div class="subsection">
                            <h3>Sorular</h3>
                            <p>${mulakatSorulari || 'Değerlendirme bulunamadı'}</p>
                        </div>
                        <div class="subsection">
                            <h3>Neden Bu Sorular?</h3>
                            <p>${nedenBuSorular || 'Değerlendirme bulunamadı'}</p>
                        </div>
                    </div>
                `;
            }

            if (options.developmentSuggestions) {
                htmlContent += `
                    <div class="section">
                        <h2>Gelişim Planı</h2>
                        ${gelisimOnerileriHTML}
                    </div>
                `;
            }

            htmlContent += `
                </body>
                </html>
            `;

            res.setHeader('Content-Type', 'text/html');
            res.send(htmlContent);
        } catch (error) {
            console.error('PDF önizleme hatası:', error);
            res.status(500).json({ message: 'PDF önizleme oluşturulurken bir hata oluştu' });
        }
    },

    // Tüm değerlendirmeleri getir
    getAllEvaluations: async (req, res) => {
        try {
            const evaluations = await EvaluationResult.find().sort({ createdAt: -1 });
            res.json(evaluations);
        } catch (error) {
            console.error('Değerlendirmeleri getirme hatası:', error);
            res.status(500).json({ error: 'Değerlendirmeler yüklenirken bir hata oluştu' });
        }
    }
};

module.exports = evaluationController;