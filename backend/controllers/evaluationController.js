const EvaluationResult = require('../models/evaluationResult');
const htmlPdf = require('html-pdf-node');
const fs = require('fs');
const path = require('path');

const evaluationController = {
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
    },

    generatePDF: async (req, res) => {
        try {
            const { id } = req.params;
            const selectedSections = req.body;
            console.log('PDF oluşturulacak ID:', id);
            console.log('Seçilen bölümler:', selectedSections);

            const evaluation = await EvaluationResult.findOne({ id: id });
            if (!evaluation) {
                return res.status(404).json({ message: 'Değerlendirme bulunamadı' });
            }

            // HTML içeriğini oluştur
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { text-align: center; }
                        h2 { color: #333; }
                        .section { margin-bottom: 20px; }
                        ul { list-style-type: disc; }
                    </style>
                </head>
                <body>
                    <h1>Değerlendirme Raporu</h1>
                    
                    ${selectedSections.generalEvaluation ? `
                    <div class="section">
                        <h2>Genel Değerlendirme</h2>
                        <p>${evaluation.generalEvaluation || 'Genel değerlendirme bulunamadı.'}</p>
                    </div>
                    ` : ''}

                    ${selectedSections.strengths ? `
                    <div class="section">
                        <h2>Güçlü Yönler</h2>
                        <ul>
                            ${(evaluation.strengths || []).map(strength => `<li>${strength.title}: ${strength.description}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}

                    ${selectedSections.development ? `
                    <div class="section">
                        <h2>Gelişim Alanları</h2>
                        <ul>
                            ${(evaluation.development || []).map(area => `<li>${area.title}: ${area.description}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}

                    ${selectedSections.interviewQuestions ? `
                    <div class="section">
                        <h2>Mülakat Soruları</h2>
                        <ul>
                            ${(evaluation.interviewQuestions || []).map(category => `
                                <li>${category.category}
                                    <ul>
                                        ${category.questions.map(q => `
                                            <li>${q.mainQuestion}
                                                <ul>
                                                    ${(q.followUpQuestions || []).map(fq => `<li>${fq}</li>`).join('')}
                                                </ul>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    ` : ''}

                    ${selectedSections.developmentSuggestions ? `
                    <div class="section">
                        <h2>Gelişim Önerileri</h2>
                        <ul>
                            ${(evaluation.developmentSuggestions || []).map(suggestion => `
                                <li>${suggestion.title}
                                    <ul>
                                        <li>Alan: ${suggestion.area}</li>
                                        <li>Hedef: ${suggestion.target}</li>
                                        <li>Öneriler:
                                            <ul>
                                                ${suggestion.suggestions.map(s => `<li>${s.title}: ${s.content}</li>`).join('')}
                                            </ul>
                                        </li>
                                    </ul>
                                </li>
                            `).join('')}
                        </ul>
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
            res.setHeader('Content-Disposition', `attachment; filename=evaluation_${evaluation.id}.pdf`);
            res.send(file);

            // Tarayıcıyı kapat
            await browser.close();
        } catch (error) {
            console.error('PDF oluşturma hatası:', error);
            res.status(500).json({ message: 'PDF oluşturulurken bir hata oluştu' });
        }
    }
};

module.exports = evaluationController;