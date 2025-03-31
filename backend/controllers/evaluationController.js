const EvaluationResult = require('../models/evaluationResult');
const pdf = require('html-pdf-node');
const options = { format: 'A4' };

class EvaluationController {
    async getEvaluationById(req, res) {
        try {
            const { id } = req.params;
            console.log('Aranan ID:', id);

            const evaluation = await EvaluationResult.findOne({ id: id });
            console.log('Bulunan değerlendirme:', evaluation);

            if (!evaluation) {
                return res.status(404).json({ error: 'Değerlendirme bulunamadı' });
            }

            res.json(evaluation);
        } catch (error) {
            console.error('Değerlendirme getirme hatası:', error);
            res.status(500).json({ error: 'Değerlendirme yüklenirken bir hata oluştu' });
        }
    }

    async generatePDF(req, res) {
        try {
            const { id } = req.params;
            const selectedSections = req.body;
            console.log('PDF oluşturulacak ID:', id);
            console.log('Seçilen bölümler:', selectedSections);

            const evaluation = await EvaluationResult.findOne({ id: id });
            if (!evaluation) {
                return res.status(404).json({ error: 'Değerlendirme bulunamadı' });
            }

            console.log('Değerlendirme bulundu, PDF oluşturuluyor...');

            // HTML içeriği oluştur
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            padding: 20px;
                        }
                        h1 { text-align: center; font-size: 24px; margin-bottom: 30px; }
                        h2 { font-size: 20px; margin-top: 20px; }
                        h3 { font-size: 16px; margin-top: 15px; }
                        p { margin-bottom: 10px; }
                        ul { margin-left: 20px; }
                        li { margin-bottom: 5px; }
                        .section { margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <h1>Değerlendirme Raporu</h1>
                    
                    ${selectedSections.generalEvaluation ? `
                    <div class="section">
                        <h2>Genel Değerlendirme</h2>
                        <p>${evaluation.generalEvaluation}</p>
                    </div>
                    ` : ''}

                    ${selectedSections.strengths ? `
                    <div class="section">
                        <h2>Güçlü Yönler</h2>
                        ${evaluation.strengths.map(strength => `
                            <div>
                                <h3>${strength.title}</h3>
                                <p>${strength.description}</p>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}

                    ${selectedSections.development ? `
                    <div class="section">
                        <h2>Gelişim Alanları</h2>
                        ${evaluation.development.map(dev => `
                            <div>
                                <h3>${dev.title}</h3>
                                <p>${dev.description}</p>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}

                    ${selectedSections.interviewQuestions ? `
                    <div class="section">
                        <h2>Mülakat Soruları</h2>
                        ${evaluation.interviewQuestions.map(category => `
                            <div>
                                <h3>${category.category}</h3>
                                ${category.questions.map(q => `
                                    <div>
                                        <p><strong>${q.mainQuestion}</strong></p>
                                        ${q.followUpQuestions ? `
                                            <ul>
                                                ${q.followUpQuestions.map(fq => `<li>${fq}</li>`).join('')}
                                            </ul>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}

                    ${selectedSections.developmentSuggestions ? `
                    <div class="section">
                        <h2>Gelişim Önerileri</h2>
                        ${evaluation.developmentSuggestions.map(suggestion => `
                            <div>
                                <h3>${suggestion.title}</h3>
                                <p><strong>Alan:</strong> ${suggestion.area}</p>
                                <p><strong>Hedef:</strong> ${suggestion.target}</p>
                                <h4>Öneriler:</h4>
                                <ul>
                                    ${suggestion.suggestions.map(s => `
                                        <li>
                                            <strong>${s.title}:</strong> ${s.content}
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                </body>
                </html>
            `;

            console.log('HTML içeriği oluşturuldu, PDF oluşturuluyor...');
            const file = await pdf.generatePdf({ content: htmlContent }, options);
            
            console.log('PDF oluşturuldu, gönderiliyor...');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=evaluation-${id}.pdf`);
            res.send(file);

        } catch (error) {
            console.error('PDF oluşturma hatası:', error);
            res.status(500).json({ 
                error: 'PDF oluşturulurken bir hata oluştu',
                details: error.message 
            });
        }
    }
}

module.exports = new EvaluationController();