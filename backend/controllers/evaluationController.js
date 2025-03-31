const EvaluationResult = require('../models/evaluationResult');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class EvaluationController {
    async getEvaluationById(req, res) {
        try {
            const evaluation = await EvaluationResult.findOne({ id: req.params.id });
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
            const evaluation = await EvaluationResult.findOne({ id: req.params.id });
            if (!evaluation) {
                return res.status(404).json({ message: 'Değerlendirme bulunamadı' });
            }

            // PDF dosya adı
            const fileName = `degerlendirme_${evaluation.id}_${Date.now()}.pdf`;
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
               .text(`Değerlendirme ID: ${evaluation.id}`)
               .text(`Tarih: ${new Date(evaluation.createdAt).toLocaleDateString('tr-TR')}`)
               .moveDown();
            
            // Genel değerlendirme
            if (evaluation.generalEvaluation) {
                doc.fontSize(16)
                   .text('Genel Değerlendirme')
                   .moveDown(0.5)
                   .fontSize(12)
                   .text(evaluation.generalEvaluation)
                   .moveDown();
            }

            // Güçlü yönler
            if (evaluation.strengths && evaluation.strengths.length > 0) {
                doc.fontSize(16)
                   .text('Güçlü Yönler')
                   .moveDown(0.5);
                
                evaluation.strengths.forEach((strength, index) => {
                    doc.fontSize(14)
                       .text(`${index + 1}. ${strength.title}`)
                       .moveDown(0.5)
                       .fontSize(12)
                       .text(strength.description)
                       .moveDown();
                });
            }

            // Gelişim alanları
            if (evaluation.development && evaluation.development.length > 0) {
                doc.fontSize(16)
                   .text('Gelişim Alanları')
                   .moveDown(0.5);
                
                evaluation.development.forEach((dev, index) => {
                    doc.fontSize(14)
                       .text(`${index + 1}. ${dev.title}`)
                       .moveDown(0.5)
                       .fontSize(12)
                       .text(dev.description)
                       .moveDown();
                });
            }

            // Mülakat soruları
            if (evaluation.interviewQuestions && evaluation.interviewQuestions.length > 0) {
                doc.fontSize(16)
                   .text('Mülakat Soruları')
                   .moveDown(0.5);
                
                evaluation.interviewQuestions.forEach((category, index) => {
                    doc.fontSize(14)
                       .text(`${index + 1}. ${category.category}`)
                       .moveDown(0.5);
                    
                    category.questions.forEach((q, qIndex) => {
                        doc.fontSize(12)
                           .text(`${qIndex + 1}. ${q.mainQuestion}`);
                        
                        if (q.followUpQuestions && q.followUpQuestions.length > 0) {
                            doc.fontSize(10)
                               .text('Alt Sorular:')
                               .moveDown(0.5);
                            
                            q.followUpQuestions.forEach((fq, fqIndex) => {
                                doc.text(`• ${fq}`)
                                   .moveDown(0.5);
                            });
                        }
                        doc.moveDown();
                    });
                });
            }

            // Gelişim önerileri
            if (evaluation.developmentSuggestions && evaluation.developmentSuggestions.length > 0) {
                doc.fontSize(16)
                   .text('Gelişim Önerileri')
                   .moveDown(0.5);
                
                evaluation.developmentSuggestions.forEach((suggestion, index) => {
                    doc.fontSize(14)
                       .text(`${index + 1}. ${suggestion.title}`)
                       .moveDown(0.5)
                       .fontSize(12)
                       .text(`Alan: ${suggestion.area}`)
                       .text(`Hedef: ${suggestion.target}`)
                       .moveDown(0.5)
                       .text('Öneriler:');
                    
                    suggestion.suggestions.forEach((s, sIndex) => {
                        doc.text(`• ${s.title}: ${s.content}`)
                           .moveDown(0.5);
                    });
                    doc.moveDown();
                });
            }
            
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