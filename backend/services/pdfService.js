const htmlPdf = require('html-pdf-node');
const options = { format: 'A4' };

const generatePDF = async (evaluation) => {
    try {
        // HTML şablonu oluştur
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Değerlendirme Raporu</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        padding: 20px;
                    }
                    h1, h2 {
                        color: #333;
                    }
                    .section {
                        margin-bottom: 20px;
                    }
                    .strength, .development {
                        margin-bottom: 10px;
                        padding: 10px;
                        background-color: #f9f9f9;
                        border-radius: 5px;
                    }
                    .interview-question {
                        margin-bottom: 15px;
                    }
                    .suggestion {
                        margin-bottom: 10px;
                        padding: 10px;
                        background-color: #f0f8ff;
                        border-radius: 5px;
                    }
                </style>
            </head>
            <body>
                <h1>Değerlendirme Raporu</h1>
                
                <div class="section">
                    <h2>Genel Değerlendirme</h2>
                    <p>${evaluation.generalEvaluation}</p>
                </div>

                <div class="section">
                    <h2>Güçlü Yönler</h2>
                    ${evaluation.strengths.map(strength => `
                        <div class="strength">
                            <h3>${strength.title}</h3>
                            <p>${strength.description}</p>
                        </div>
                    `).join('')}
                </div>

                <div class="section">
                    <h2>Gelişim Alanları</h2>
                    ${evaluation.development.map(dev => `
                        <div class="development">
                            <h3>${dev.title}</h3>
                            <p>${dev.description}</p>
                        </div>
                    `).join('')}
                </div>

                <div class="section">
                    <h2>Mülakat Soruları</h2>
                    ${evaluation.interviewQuestions.map(category => `
                        <div class="interview-question">
                            <h3>${category.category}</h3>
                            <p><strong>Ana Soru:</strong> ${category.questions[0].mainQuestion}</p>
                            <p><strong>Alt Sorular:</strong></p>
                            <ul>
                                ${category.questions[0].followUpQuestions.map(q => `<li>${q}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>

                <div class="section">
                    <h2>Gelişim Önerileri</h2>
                    ${evaluation.developmentSuggestions.map(suggestion => `
                        <div class="suggestion">
                            <h3>${suggestion.title}</h3>
                            <p><strong>Alan:</strong> ${suggestion.area}</p>
                            <p><strong>Hedef:</strong> ${suggestion.target}</p>
                            <h4>Öneriler:</h4>
                            ${suggestion.suggestions.map(s => `
                                <div>
                                    <h5>${s.title}</h5>
                                    <p>${s.content}</p>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            </body>
            </html>
        `;

        // PDF oluştur
        const file = await htmlPdf.generatePdf({ content: html }, options);
        return file;
    } catch (error) {
        console.error('PDF oluşturma hatası:', error);
        throw error;
    }
};

module.exports = {
    generatePDF
}; 