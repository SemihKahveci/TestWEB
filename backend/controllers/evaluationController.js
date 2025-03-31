const Evaluation = require('../models/evaluation');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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

            // PDF dosya adı
            const fileName = `degerlendirme_${evaluation._id}_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, '..', fileName);
            
            // PDF oluştur
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                font: 'Helvetica'
            });
            
            // PDF'i dosyaya yaz
            doc.pipe(fs.createWriteStream(filePath));
            
            // Başlık
            doc.fontSize(20)
               .text('Değerlendirme Raporu', { align: 'center' })
               .moveDown();
            
            // Değerlendirme bilgileri
            doc.fontSize(14)
               .text(`Değerlendirme ID: ${evaluation._id}`)
               .text(`Tarih: ${new Date(evaluation.createdAt).toLocaleDateString('tr-TR')}`)
               .moveDown();
            
            // Seçili başlıkları ekle
            evaluation.results.forEach((result, index) => {
                if (result.isSelected) {
                    doc.fontSize(16)
                       .text(`${index + 1}. ${result.title}`)
                       .moveDown(0.5)
                       .fontSize(12)
                       .text(result.content)
                       .moveDown();
                }
            });
            
            // PDF'i sonlandır
            doc.end();
            
            // PDF oluşturulduktan sonra gönder
            res.download(filePath, fileName, (err) => {
                if (err) {
                    console.error('PDF gönderme hatası:', err);
                }
                // Dosyayı sil
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('Dosya silme hatası:', err);
                    }
                });
            });

        } catch (error) {
            console.error('PDF oluşturma hatası:', error);
            res.status(500).json({ error: 'PDF oluşturulurken bir hata oluştu' });
        }
    }
}

module.exports = new EvaluationController();