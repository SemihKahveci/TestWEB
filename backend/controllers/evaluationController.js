const Evaluation = require('../models/evaluation');
const pdf = require('html-pdf-node');
const options = { format: 'A4' };

class EvaluationController {
    async getEvaluationById(req, res) {
        try {
            const evaluation = await Evaluation.findById(req.params.id);
            if (!evaluation) {
                return res.status(404).json({ message: 'Değerlendirme bulunamadı' });
            }
            res.json(evaluation);
        } catch (error) {
            res.status(500).json({ message: 'Sunucu hatası', error: error.message });
        }
    }

    async generatePDF(req, res) {
        try {
            const evaluation = await Evaluation.findById(req.params.id);
            if (!evaluation) {
                return res.status(404).json({ message: 'Değerlendirme bulunamadı' });
            }

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
                    
                    <div class="section">
                        <h2>Değerlendirme Bilgileri</h2>
                        <p><strong>ID:</strong> ${evaluation._id}</p>
                        <p><strong>Tarih:</strong> ${new Date(evaluation.createdAt).toLocaleDateString('tr-TR')}</p>
                    </div>

                    ${evaluation.results.map((result, index) => `
                        <div class="section">
                            <h2>${index + 1}. ${result.title}</h2>
                            <p>${result.content}</p>
                        </div>
                    `).join('')}
                </body>
                </html>
            `;

            // PDF oluştur
            const file = await pdf.generatePdf({ content: htmlContent }, options);
            
            // PDF'i gönder
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=evaluation-${evaluation._id}.pdf`);
            res.send(file);

        } catch (error) {
            console.error('PDF oluşturma hatası:', error);
            res.status(500).json({ error: 'PDF oluşturulurken bir hata oluştu' });
        }
    }
}

module.exports = new EvaluationController();