const EvaluationResult = require('../models/evaluationResult');
const htmlPdf = require('html-pdf-node');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const UserCode = require('../models/userCode');
const Game = require('../models/game');

const evaluationController = {
    async getEvaluationById(req, res) {
        try {
            const { id } = req.params;
     
            const evaluation = await EvaluationResult.findOne({ ID: id });
          
            if (!evaluation) {
                return res.status(404).json({ error: 'Değerlendirme bulunamadı' });
            }

            res.json(evaluation);
        } catch (error) {
            res.status(500).json({ error: 'Değerlendirme yüklenirken bir hata oluştu' });
        }
    },

    async generatePDF(req, res) {
        try {
            const { userCode, selectedOptions } = req.body;
          
            // Seçenekleri kontrol et
            const options = {
                generalEvaluation: selectedOptions.generalEvaluation === true || selectedOptions.generalEvaluation === 'true',
                strengths: selectedOptions.strengths === true || selectedOptions.strengths === 'true',
                development: selectedOptions.development === true || selectedOptions.development === 'true',
                interviewQuestions: selectedOptions.interviewQuestions === true || selectedOptions.interviewQuestions === 'true',
                whyTheseQuestions: selectedOptions.whyTheseQuestions === true || selectedOptions.whyTheseQuestions === 'true',
                developmentSuggestions: selectedOptions.developmentSuggestions === true || selectedOptions.developmentSuggestions === 'true'
            };

            // Önce Game koleksiyonunda ara
            let game = await Game.findOne({ playerCode: userCode });
            if (!game) {
                // Game bulunamazsa EvaluationResult koleksiyonunda ara
                const evaluation = await EvaluationResult.findOne({ ID: userCode });
                if (!evaluation) {
                    return res.status(404).json({ message: 'Değerlendirme bulunamadı' });
                }
                return generateAndSendPDF(evaluation, options, res, userCode);
            }

            // Game içindeki evaluationResult'u kontrol et
            if (!game.evaluationResult || Object.keys(game.evaluationResult).length === 0) {
                const evaluation = await EvaluationResult.findOne({ ID: userCode });
                if (!evaluation) {
                    return res.status(404).json({ message: 'Değerlendirme bulunamadı' });
                }
                
                // Game modelini güncelle
                game.evaluationResult = evaluation;
                await game.save();
                
                return generateAndSendPDF(evaluation, options, res, userCode);
            }

            return generateAndSendPDF(game.evaluationResult, options, res, userCode);
        } catch (error) {
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

            // Önce Game koleksiyonunda ara
            let game = await Game.findOne({ playerCode: code });
            if (!game) {
                // Game bulunamazsa EvaluationResult koleksiyonunda ara
                const evaluation = await EvaluationResult.findOne({ ID: code });
                if (!evaluation) {
                    return res.status(404).json({ message: 'Değerlendirme bulunamadı' });
                }
                return generateAndSendPreview(evaluation, options, res, code);
            }
            
            // Game içindeki evaluationResult'u kontrol et
            if (!game.evaluationResult || Object.keys(game.evaluationResult).length === 0) {
                const evaluation = await EvaluationResult.findOne({ ID: code });
                if (!evaluation) {
                    return res.status(404).json({ message: 'Değerlendirme bulunamadı' });
                }
                
                // Game modelini güncelle
                game.evaluationResult = evaluation;
                await game.save();
                
                return generateAndSendPreview(evaluation, options, res, code);
            }

            return generateAndSendPreview(game.evaluationResult, options, res, code);
        } catch (error) {
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

// Yetenek türüne göre başlık belirleme fonksiyonu
function getReportTitle(type) {
    switch (type) {
        case 'BY': return 'Belirsizlik Yönetimi Raporu';
        case 'MO': return 'Müşteri Odaklılık Raporu';
        case 'IE': return 'İnsanları Etkileme Raporu';
        case 'IDIK': return 'Güven Veren İşbirlikçi ve Sinerji Raporu';
        default: return 'Bilinmeyen Yetenek Raporu';
    }
}

// Gezegen seçim sırasına göre raporları sıralama fonksiyonu
async function sortReportsByPlanetOrder(evaluation, userCode) {
    try {
        if (!userCode) return evaluation;
        
        const userCodeData = await UserCode.findOne({ code: userCode });
        if (!userCodeData || !userCodeData.allPlanets || userCodeData.allPlanets.length === 0) {
            return evaluation;
        }
        
        console.log('Gezegen seçim sırası:', userCodeData.allPlanets);
        
        // Gezegen-yetenek eşleştirmesi
        const planetToSkills = {
            'venus': ['BY', 'MO'],
            'titan': ['IE', 'IDIK']
        };
        
        // Gezegen sırasına göre yetenekleri sırala
        const skillOrder = [];
        userCodeData.allPlanets.forEach(planet => {
            if (planetToSkills[planet]) {
                skillOrder.push(...planetToSkills[planet]);
            }
        });
        
        // Raporları gezegen sırasına göre sırala
        const sortedEvaluation = [...evaluation].sort((a, b) => {
            const aIndex = skillOrder.indexOf(a.type);
            const bIndex = skillOrder.indexOf(b.type);
            return aIndex - bIndex;
        });
        
        console.log('Sıralanmış raporlar:', sortedEvaluation.map(r => r.type));
        return sortedEvaluation;
        
    } catch (error) {
        console.error('Gezegen sırası alınırken hata:', error);
        return evaluation;
    }
}

async function generateAndSendPDF(evaluation, options, res, userCode) {
    try {
        // Eğer evaluation bir dizi ise (hem BY hem MO raporları)
        if (Array.isArray(evaluation)) {
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
                            margin-top: 15px;
                            margin-bottom: 15px;
                            padding-left: 10px;
                            border-left: 3px solid #3498db;
                        }
                        .report-type {
                            background-color: #2c3e50;
                            color: white;
                            padding: 10px;
                            margin-bottom: 20px;
                            border-radius: 5px;
                        }
                    </style>
                </head>
                <body>
                    <h1>Değerlendirme Raporu</h1>
                    <div class="date">Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}</div>
            `;

            // Gezegen seçim sırasına göre raporları sırala
            const sortedEvaluation = await sortReportsByPlanetOrder(evaluation, userCode);

            // Her bir rapor için içerik oluştur
            for (const report of sortedEvaluation) {
                const data = report.data;
                
                htmlContent += `
                    <div class="report-type">
                        <h2>${getReportTitle(report.type)}</h2>
                    </div>
                `;

                if (options.generalEvaluation && data['Genel Değerlendirme']) {
                    htmlContent += `
                        <div class="section">
                            <h2>Genel Değerlendirme</h2>
                            <p>${data['Genel Değerlendirme']}</p>
                        </div>
                    `;
                }

                if (options.strengths) {
                    if (data['Güçlü Yönler']) {
                        htmlContent += `
                            <div class="section">
                                <h2>Güçlü Yönler</h2>
                                <p>${data['Güçlü Yönler']}</p>
                            </div>
                        `;
                    }
                    if (data['Gelişim Alanları']) {
                        htmlContent += `
                            <div class="section">
                                <h2>Gelişim Alanları</h2>
                                <p>${data['Gelişim Alanları']}</p>
                            </div>
                        `;
                    }
                }

                if (options.interviewQuestions && data['Mülakat Soruları']) {
                    htmlContent += `
                        <div class="section">
                            <h2>Mülakat Soruları</h2>
                            <p>${data['Mülakat Soruları']}</p>
                        </div>
                    `;
                }

                if (options.whyTheseQuestions) {
                    htmlContent += `
                        <div class="section">
                            <h2>Neden Bu Sorular?</h2>
                            <p>${data['Neden Bu Sorular?'] || 'Neden bu sorular bilgisi bulunamadı.'}</p>
                        </div>
                    `;
                }

                if (options.developmentSuggestions) {
                    let gelisimOnerileriHTML = '';
                    const gelisimOnerileriKeys = [
                        { key: 'Gelişim Önerileri -1', title: 'Gelişim Önerisi 1' },
                        { key: 'Gelişim Önerileri -2', title: 'Gelişim Önerisi 2' },
                        { key: 'Gelişim Önerileri - 3', title: 'Gelişim Önerisi 3' }
                    ];
                    
                    gelisimOnerileriKeys.forEach(item => {
                        if (data[item.key]) {
                            gelisimOnerileriHTML += `
                                <div class="subsection">
                                    <h3>${item.title}</h3>
                                    <p>${data[item.key]}</p>
                                </div>
                            `;
                        }
                    });

                    if (gelisimOnerileriHTML) {
                        htmlContent += `
                            <div class="section">
                                <h2>Gelişim Önerileri</h2>
                                ${gelisimOnerileriHTML}
                            </div>
                        `;
                    }
                }
            }

            htmlContent += `
                </body>
                </html>
            `;

            const pdfOptions = {
                format: 'A4',
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                }
            };

            // PDF oluştur
            const file = await htmlPdf.generatePdf({ content: htmlContent }, pdfOptions);

            // PDF'i indir
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=evaluation_${evaluation[0].data.ID}.pdf`);
            res.send(file);
        } else {
            // Tek rapor için eski format
            // ... mevcut tek rapor kodu ...
        }
    } catch (error) {
        console.error('PDF oluşturma hatası:', error);
        throw error;
    }
}

async function generateAndSendPreview(evaluation, options, res, userCode) {
    try {
        // Eğer evaluation bir dizi ise (hem BY hem MO raporları)
        if (Array.isArray(evaluation)) {
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
                            margin-top: 15px;
                            margin-bottom: 15px;
                            padding-left: 10px;
                            border-left: 3px solid #3498db;
                        }
                        .report-type {
                            background-color: #2c3e50;
                            color: white;
                            padding: 10px;
                            margin-bottom: 20px;
                            border-radius: 5px;
                        }
                    </style>
                </head>
                <body>
                    <h1>Değerlendirme Raporu</h1>
                    <div class="date">Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}</div>
            `;

            // Gezegen seçim sırasına göre raporları sırala
            const sortedEvaluation = await sortReportsByPlanetOrder(evaluation, userCode);

            // Her bir rapor için içerik oluştur
            for (const report of sortedEvaluation) {
                const data = report.data;
                
                htmlContent += `
                    <div class="report-type">
                        <h2>${getReportTitle(report.type)}</h2>
                    </div>
                `;

                if (options.generalEvaluation && data['Genel Değerlendirme']) {
                    htmlContent += `
                        <div class="section">
                            <h2>Genel Değerlendirme</h2>
                            <p>${data['Genel Değerlendirme']}</p>
                        </div>
                    `;
                }

                if (options.strengths) {
                    if (data['Güçlü Yönler']) {
                        htmlContent += `
                            <div class="section">
                                <h2>Güçlü Yönler</h2>
                                <p>${data['Güçlü Yönler']}</p>
                            </div>
                        `;
                    }
                    if (data['Gelişim Alanları']) {
                        htmlContent += `
                            <div class="section">
                                <h2>Gelişim Alanları</h2>
                                <p>${data['Gelişim Alanları']}</p>
                            </div>
                        `;
                    }
                }

                if (options.interviewQuestions && data['Mülakat Soruları']) {
                    htmlContent += `
                        <div class="section">
                            <h2>Mülakat Soruları</h2>
                            <p>${data['Mülakat Soruları']}</p>
                        </div>
                    `;
                }

                if (options.whyTheseQuestions) {
                    htmlContent += `
                        <div class="section">
                            <h2>Neden Bu Sorular?</h2>
                            <p>${data['Neden Bu Sorular?']}</p>
                        </div>
                    `;
                }

                if (options.developmentSuggestions) {
                    let gelisimOnerileriHTML = '';
                    const gelisimOnerileriKeys = [
                        { key: 'Gelişim Önerileri -1', title: 'Gelişim Önerisi 1' },
                        { key: 'Gelişim Önerileri -2', title: 'Gelişim Önerisi 2' },
                        { key: 'Gelişim Önerileri - 3', title: 'Gelişim Önerisi 3' }
                    ];
                    
                    gelisimOnerileriKeys.forEach(item => {
                        if (data[item.key]) {
                            gelisimOnerileriHTML += `
                                <div class="subsection">
                                    <h3>${item.title}</h3>
                                    <p>${data[item.key]}</p>
                                </div>
                            `;
                        }
                    });

                    if (gelisimOnerileriHTML) {
                        htmlContent += `
                            <div class="section">
                                <h2>Gelişim Önerileri</h2>
                                ${gelisimOnerileriHTML}
                            </div>
                        `;
                    }
                }
            }

            htmlContent += `
                </body>
                </html>
            `;

            const pdfOptions = {
                format: 'A4',
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                }
            };

            // PDF oluştur
            const file = await htmlPdf.generatePdf({ content: htmlContent }, pdfOptions);

            // PDF'i önizle
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=evaluation_${evaluation[0].data.ID}.pdf`);
            res.send(file);
        } else {
            // Tek rapor için eski format
            // ... mevcut tek rapor kodu ...
        }
    } catch (error) {
        console.error('PDF önizleme hatası:', error);
        throw error;
    }
}

module.exports = evaluationController; 