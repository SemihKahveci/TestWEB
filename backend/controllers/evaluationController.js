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

            // Tüm oyunları bul (2 gezegen için 2 farklı Game kaydı olabilir)
            const games = await Game.find({ playerCode: userCode });
            if (!games || games.length === 0) {
                // Game bulunamazsa EvaluationResult koleksiyonunda ara
                const evaluation = await EvaluationResult.findOne({ ID: userCode });
                if (!evaluation) {
                    return res.status(404).json({ message: 'Değerlendirme bulunamadı' });
                }
                return generateAndSendPDF(evaluation, options, res, userCode);
            }
            
            // Tüm oyunlardaki evaluationResult'ları birleştir
            let allEvaluationResults = [];
            for (const game of games) {
                if (game.evaluationResult) {
                    // Eğer evaluationResult bir dizi ise (çoklu rapor)
                    if (Array.isArray(game.evaluationResult)) {
                        allEvaluationResults = allEvaluationResults.concat(game.evaluationResult);
                    } else {
                        // Eğer tek rapor ise diziye çevir
                        allEvaluationResults.push(game.evaluationResult);
                    }
                }
            }

            // Eğer hiç evaluationResult bulunamadıysa, EvaluationResult koleksiyonunda ara
            if (allEvaluationResults.length === 0) {
                const evaluation = await EvaluationResult.findOne({ ID: userCode });
                if (!evaluation) {
                    return res.status(404).json({ message: 'Değerlendirme bulunamadı' });
                }
                return generateAndSendPDF(evaluation, options, res, userCode);
            }

            // Benzersiz raporları filtrele (aynı ID'li raporları tekrarlama)
            const uniqueResults = [];
            const seenIds = new Set();
            
            for (const result of allEvaluationResults) {
                if (result.data && result.data.ID && !seenIds.has(result.data.ID)) {
                    seenIds.add(result.data.ID);
                    uniqueResults.push(result);
                }
            }

            return generateAndSendPDF(uniqueResults, options, res, userCode);
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

            // Tüm oyunları bul (2 gezegen için 2 farklı Game kaydı olabilir)
            const games = await Game.find({ playerCode: code });
            if (!games || games.length === 0) {
                // Game bulunamazsa EvaluationResult koleksiyonunda ara
                const evaluation = await EvaluationResult.findOne({ ID: code });
                if (!evaluation) {
                    return res.status(404).json({ message: 'Değerlendirme bulunamadı' });
                }
                return generateAndSendPreview(evaluation, options, res, code);
            }
            
            // Tüm oyunlardaki evaluationResult'ları birleştir
            let allEvaluationResults = [];
            for (const game of games) {
                if (game.evaluationResult) {
                    // Eğer evaluationResult bir dizi ise (çoklu rapor)
                    if (Array.isArray(game.evaluationResult)) {
                        allEvaluationResults = allEvaluationResults.concat(game.evaluationResult);
                    } else {
                        // Eğer tek rapor ise diziye çevir
                        allEvaluationResults.push(game.evaluationResult);
                    }
                }
            }

            // Eğer hiç evaluationResult bulunamadıysa, EvaluationResult koleksiyonunda ara
            if (allEvaluationResults.length === 0) {
                const evaluation = await EvaluationResult.findOne({ ID: code });
                if (!evaluation) {
                    return res.status(404).json({ message: 'Değerlendirme bulunamadı' });
                }
                return generateAndSendPreview(evaluation, options, res, code);
            }

            // Benzersiz raporları filtrele (aynı ID'li raporları tekrarlama)
            const uniqueResults = [];
            const seenIds = new Set();
            
            for (const result of allEvaluationResults) {
                if (result.data && result.data.ID && !seenIds.has(result.data.ID)) {
                    seenIds.add(result.data.ID);
                    uniqueResults.push(result);
                }
            }

            return generateAndSendPreview(uniqueResults, options, res, code);
        } catch (error) {
            console.error('PDF önizleme hatası:', error);
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

// Kullanıcı bilgilerini al
async function getUserInfo(userCode) {
    try {
        const userCodeData = await UserCode.findOne({ code: userCode });
        if (userCodeData) {
            return {
                name: userCodeData.name || 'Bilinmeyen',
                completionDate: userCodeData.completionDate || new Date()
            };
        }
        return {
            name: 'Bilinmeyen',
            completionDate: new Date()
        };
    } catch (error) {
        console.error('Kullanıcı bilgisi alınırken hata:', error);
        return {
            name: 'Bilinmeyen',
            completionDate: new Date()
        };
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

        return sortedEvaluation;
        
    } catch (error) {
        console.error('Gezegen sırası alınırken hata:', error);
        return evaluation;
    }
}

// 🔧 Ortak PDF HTML oluşturucu
async function buildEvaluationHTML(evaluation, options, userCode, isPreview = false) {
    const sortedEvaluation = await sortReportsByPlanetOrder(evaluation, userCode);
    const userInfo = await getUserInfo(userCode);
    const formattedDate = userInfo.completionDate.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @page { margin: ${isPreview ? '20px' : '2.5cm'}; }

                body { 
                    font-family: Arial, sans-serif; 
                    line-height: 1.6;
                    margin: 0;
                    padding-bottom: 50px;
                }

                h1, h2, h3, h4 {
                    color: #2c3e50;
                    margin-bottom: 10px;
                }

                h3 {
                    color: #001c55;
                }

                h2 { 
                    border-bottom: 2px solid #eee; 
                    padding-bottom: 5px; 
                }

                .subsection {
                    margin: 20px 0;
                    padding-left: 10px;
                    position: relative;
                }

                /* Her alt başlık yeni sayfada başlasın ama ilkinden sonra */
                .subsection:not(:first-child) {
                    page-break-before: always;
                }

                .sub-subsection {
                    margin: 8px 0;
                    padding-left: 20px;
                }

                /* Kapak Sayfası */
                .cover-page {
                    text-align: center;
                    padding: 100px 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 80vh;
                }

                .cover-title {
                    font-size: 64px;
                    font-weight: bold;
                    color: #c0392b;
                    margin-bottom: 40px;
                    text-shadow: 4px 4px 8px rgba(0,0,0,0.3);
                    font-family: serif;
                    line-height: 1.1;
                    text-align: right;
                    width: 100%;
                    max-width: 600px;
                }

                .cover-divider {
                    width: 100%;
                    border-bottom: 3px solid #000;
                    margin: 30px 0;
                }

                .cover-info {
                    text-align: right;
                    font-size: 18px;
                    color: #2c3e50;
                    line-height: 2;
                    font-style: italic;
                    max-width: 600px;
                }

                /* Üst Bar (Sol bar + Sağda Yetkinlik Adı) */
                .competency-header-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                    margin-top: 5px;
                    page-break-inside: avoid;
                }

                /* Sol tarafta bar */
                .competency-header-bar .bar {
                    width: 150px;
                    height: 22px;
                    background-color: #d3d3d3; /* düz gri */
                    border-radius: 6px;
                    overflow: hidden;
                    box-shadow: inset 0 0 3px rgba(0,0,0,0.3), 0 0 2px rgba(0,0,0,0.15);
                    border: 1px solid #999;);
                }

                /* Mavi dolu kısım */
                .competency-header-bar .bar .filled {
                    height: 100%;
                    width: 60%; /* şimdilik sabit */
                    background: linear-gradient(90deg, #4169E1 0%, #3154C4 100%); /* ✅ canlı mavi degrade */
                    border-right: 1px solid rgba(0,0,0,0.2); /* kenar çizgisi */
                    box-shadow: inset 0 0 2px rgba(255,255,255,0.4);
                }

                /* Sağ taraftaki yetkinlik ismi */
                .competency-header-bar .competency-name {
                    font-weight: 700;
                    color: #283c9b;
                    font-size: 16px;
                    text-shadow: 0 1px 1px rgba(0,0,0,0.1);
                }

                /* Sabit Footer */
                .page-footer {
                    position: fixed;
                    bottom: ${isPreview ? '20px' : '15px'};
                    right: ${isPreview ? '20px' : '2.5cm'};
                    left: ${isPreview ? '20px' : '2.5cm'};
                    font-size: 10px;
                    color: #666;
                    text-align: right;
                    border-top: 1px solid #ddd;
                    padding-top: 4px;
                    line-height: 1.2;
                    height: 30px;
                    background-color: white;
                    z-index: 1000;
                }

                .page-footer .company-name { font-weight: bold; color: #2c3e50; }
                .page-footer .copyright { color: #888; font-size: 9px; }
            </style>
        </head>
        <body>

            <!-- 📄 Kapak Sayfası -->
            <div class="cover-page">
                <div class="cover-title">
                    <span class="line1">DEĞERLENDİRME</span><br>
                    <span class="line2">RAPORU</span>
                </div>
                <div class="cover-divider"></div>
                <div class="cover-info">
                    <div><strong>${userInfo.name}</strong></div>
                    <div>${formattedDate}</div>
                </div>
            </div>
    `;

    // 📘 Her yetkinlik için sayfa
    for (let i = 0; i < sortedEvaluation.length; i++) {
        const report = sortedEvaluation[i];
        const data = report.data;
        const reportTitle = getReportTitle(report.type);
        const competencyName = reportTitle.replace(' Raporu', '');

        // Başlık sayfası
        htmlContent += `
            <div style="${i === 0 ? 'page-break-before:auto;' : 'page-break-before:always;'}
                        text-align:center; 
                        padding:200px 20px; 
                        min-height:700px; 
                        display:flex; 
                        align-items:center; 
                        justify-content:center;">
                <h1 style="font-size:64px; font-weight:bold; color:#1e3a8a;
                           text-shadow:4px 4px 8px rgba(0,0,0,0.3); font-family:sans-serif;">
                    ${competencyName}
                </h1>
            </div>
        `;

        // Bölüm ekleme fonksiyonu
        const addSection = (title, content) => `
            <div class="subsection">
                <div class="competency-header-bar">
                    <div class="bar"><div class="filled"></div></div>
                    <div class="competency-name">${competencyName}</div>
                </div>
                <h3>${title}</h3>
                <p>${content}</p>
            </div>
        `;

        // İçerikler
        if (options.generalEvaluation && data['Genel Değerlendirme'])
            htmlContent += addSection('Genel Değerlendirme', data['Genel Değerlendirme']);
        if (options.strengths && data['Güçlü Yönler'])
            htmlContent += addSection('Güçlü Yönler', data['Güçlü Yönler']);
        if (options.strengths && data['Gelişim Alanları'])
            htmlContent += addSection('Gelişim Alanları', data['Gelişim Alanları']);
        if (options.interviewQuestions && data['Mülakat Soruları'])
            htmlContent += addSection('Mülakat Soruları', data['Mülakat Soruları']);
        if (options.whyTheseQuestions && data['Neden Bu Sorular?'])
            htmlContent += addSection('Neden Bu Sorular?', data['Neden Bu Sorular?']);

        if (options.developmentSuggestions) {
            const suggestionKeys = [
                { key: 'Gelişim Önerileri -1', title: 'Gelişim Önerisi 1' },
                { key: 'Gelişim Önerileri -2', title: 'Gelişim Önerisi 2' },
                { key: 'Gelişim Önerileri - 3', title: 'Gelişim Önerisi 3' },
                { key: 'Gelişim Önerileri -4', title: 'Gelişim Önerisi 4' }
            ];
            suggestionKeys.forEach(item => {
                if (data[item.key])
                    htmlContent += addSection(item.title, data[item.key]);
            });
        }
    }

    // 📎 Footer
    htmlContent += `
        <div class="page-footer">
            <div class="company-name">ANDRON Game</div>
            <div class="copyright">GİZLİ © ANDRON Game 2025, İzinsiz paylaşılamaz.</div>
        </div>
        </body>
        </html>
    `;

    return htmlContent;
}


async function generateAndSendPDF(evaluation, options, res, userCode) {
    const htmlContent = await buildEvaluationHTML(evaluation, options, userCode, false);
    const pdfOptions = { format: 'A4', printBackground: true };
    const file = await htmlPdf.generatePdf({ content: htmlContent }, pdfOptions);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=evaluation_${evaluation[0].data.ID}.pdf`);
    res.send(file);
}

async function generateAndSendPreview(evaluation, options, res, userCode) {
    const htmlContent = await buildEvaluationHTML(evaluation, options, userCode, true);
    const pdfOptions = { format: 'A4', printBackground: true };
    const file = await htmlPdf.generatePdf({ content: htmlContent }, pdfOptions);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=evaluation_${evaluation[0].data.ID}.pdf`);
    res.send(file);
}

module.exports = evaluationController; 