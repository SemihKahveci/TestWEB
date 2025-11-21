const htmlPdf = require('html-pdf-node');
const { escapeHtml } = require('../utils/helpers');

const options = { 
    format: 'A4',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
};

const generatePDF = async (data) => {
    try {
        const { userCode, game, options } = data;
        
        if (!userCode || !game) {
            throw new Error('Kullanıcı kodu veya oyun verisi eksik');
        }

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
                    .info {
                        margin-bottom: 10px;
                    }
                    .score {
                        font-size: 1.2em;
                        font-weight: bold;
                        color: #2c3e50;
                    }
                    .answers {
                        margin-top: 20px;
                    }
                    .answer {
                        margin-bottom: 15px;
                        padding: 10px;
                        background-color: #f9f9f9;
                        border-radius: 5px;
                    }
                </style>
            </head>
            <body>
                <h1>Değerlendirme Raporu</h1>
                
                <div class="section">
                    <h2>Kullanıcı Bilgileri</h2>
                    <div class="info">
                    <p><strong>Ad Soyad:</strong> ${escapeHtml(userCode.name || '-')}</p>
                    <p><strong>E-posta:</strong> ${escapeHtml(userCode.email || '-')}</p>
                    <p><strong>Planet:</strong> ${escapeHtml(userCode.planet || '-')}</p>
                    <p><strong>Kod:</strong> ${escapeHtml(userCode.code || '-')}</p>
                        <p><strong>Gönderim Tarihi:</strong> ${userCode.sentDate ? new Date(userCode.sentDate).toLocaleString('tr-TR') : '-'}</p>
                        <p><strong>Tamamlanma Tarihi:</strong> ${userCode.completionDate ? new Date(userCode.completionDate).toLocaleString('tr-TR') : '-'}</p>
                    </div>
                </div>

                <div class="section">
                    <h2>Oyun Sonuçları</h2>
                    <div class="info">
                        <p><strong>Bölüm:</strong> ${game.section || '-'}</p>
                        <p class="score">Toplam Puan: ${game.totalScore ? game.totalScore.toFixed(2) : '0.00'}</p>
                    </div>

                    <div class="answers">
                        <h3>Cevaplar</h3>
                        ${game.answers && game.answers.length > 0 ? game.answers.map(answer => `
                            <div class="answer">
                                <p><strong>Soru ID:</strong> ${answer.questionId || '-'}</p>
                                <p><strong>Gezegen:</strong> ${answer.planetName || '-'}</p>
                                <p><strong>Soru:</strong> ${answer.questionText || '-'}</p>
                                <p><strong>Seçilen Cevap 1:</strong> ${answer.selectedAnswer1 || '-'}</p>
                                <p><strong>Seçilen Cevap 2:</strong> ${answer.selectedAnswer2 || '-'}</p>
                                <p><strong>Cevap Tipi 1:</strong> ${answer.answerType1 || '-'}</p>
                                <p><strong>Cevap Tipi 2:</strong> ${answer.answerType2 || '-'}</p>
                                <p><strong>Alt Kategori:</strong> ${answer.answerSubCategory || '-'}</p>
                            </div>
                        `).join('') : '<p>Henüz cevap bulunmamaktadır.</p>'}
                    </div>
                </div>
            </body>
            </html>
        `;

        // PDF oluştur
        const file = await htmlPdf.generatePdf({ content: html }, options);
        return file;
    } catch (error) {
            const { safeLog } = require('../utils/helpers');
            safeLog('error', 'PDF oluşturma hatası', error);
        throw error;
    }
};

module.exports = {
    generatePDF
}; 