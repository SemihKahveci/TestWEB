const EvaluationResult = require('../models/evaluationResult');
const htmlPdf = require('html-pdf-node');
const fs = require('fs');
const path = require('path');

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
            const { id } = req.params;
            const selectedSections = req.body;
            console.log('PDF oluşturulacak ID:', id);
            console.log('Seçilen bölümler:', selectedSections);

            const evaluation = await EvaluationResult.findOne({ ID: id });
            if (!evaluation) {
                return res.status(404).json({ message: 'Değerlendirme bulunamadı' });
            }

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
            const htmlContent = `
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
                            margin-top: 15px;
                            margin-bottom: 15px;
                            padding-left: 10px;
                            border-left: 3px solid #3498db;
                        }
                        ul { 
                            list-style-type: disc;
                            margin-left: 20px;
                        }
                        li {
                            margin-bottom: 8px;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 30px;
                        }
                        .date {
                            color: #7f8c8d;
                            font-size: 0.9em;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Değerlendirme Raporu</h1>
                        <div class="date">Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}</div>
                    </div>
                    
                    ${selectedSections.generalEvaluation === true ? `
                    <div class="section">
                        <h2>Genel Değerlendirme</h2>
                        <p>${genelDegerlendirme || 'Genel değerlendirme bulunamadı.'}</p>
                    </div>
                    ` : ''}

                    ${selectedSections.strengths === true ? `
                    <div class="section">
                        <h2>Güçlü Yönler</h2>
                        <p>${gucluYonler || 'Güçlü yönler bulunamadı.'}</p>
                    </div>
                    ` : ''}

                    ${selectedSections.development === true ? `
                    <div class="section">
                        <h2>Gelişim Alanları</h2>
                        <p>${gelisimAlanlari || 'Gelişim alanları bulunamadı.'}</p>
                    </div>
                    ` : ''}

                    ${selectedSections.interviewQuestions === true ? `
                    <div class="section">
                        <h2>Mülakat Soruları</h2>
                        <p>${mulakatSorulari || 'Mülakat soruları bulunamadı.'}</p>
                    </div>
                    ` : ''}

                    ${selectedSections.whyTheseQuestions === true ? `
                    <div class="section">
                        <h2>Neden Bu Sorular?</h2>
                        <p>${nedenBuSorular || 'Neden bu sorular bilgisi bulunamadı.'}</p>
                    </div>
                    ` : ''}

                    ${selectedSections.developmentSuggestions === true ? `
                    <div class="section">
                        <h2>Gelişim Önerileri</h2>
                        ${gelisimOnerileriHTML || '<p>Gelişim önerisi bulunamadı.</p>'}
                    </div>
                    ` : ''}
                </body>
                </html>
            `;

            const options = {
                format: 'A4',
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                }
            };

            // PDF oluştur
            const file = await htmlPdf.generatePdf({ content: htmlContent }, options);

            // PDF'i indir
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=evaluation_${evaluation.ID}.pdf`);
            res.send(file);

        } catch (error) {
            console.error('PDF oluşturma hatası:', error);
            res.status(500).json({ message: 'PDF oluşturulurken bir hata oluştu' });
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