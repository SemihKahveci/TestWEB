const EvaluationResult = require('../models/evaluationResult');
const htmlPdf = require('html-pdf-node');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const UserCode = require('../models/userCode');
const Game = require('../models/game');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Footer, PageNumber, BorderStyle } = require('docx');

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

    async generateWord(req, res) {
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
                return generateAndSendWord(evaluation, options, res, userCode);
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
                return generateAndSendWord(evaluation, options, res, userCode);
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

            return generateAndSendWord(uniqueResults, options, res, userCode);
        } catch (error) {
            console.error('Word oluşturma hatası:', error);
            res.status(500).json({ message: 'Word oluşturulurken bir hata oluştu' });
        }
    },

    previewPDF: async (req, res) => {
        try {
            const { code } = req.query;
            const options = {
                generalEvaluation: req.query.generalEvaluation === 'true',
                strengths: req.query.strengths === 'true',
                interviewQuestions: req.query.interviewQuestions === 'true',
                whyTheseQuestions: req.query.whyTheseQuestions === 'true',
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
        case 'BY': return 'Uyumluluk ve Dayanıklılık Raporu';
        case 'MO': return 'Müşteri Odaklılık Raporu';
        case 'IE': return 'İnsanları Etkileme Raporu';
        case 'IDIK': return 'Güven Veren İşbirliği ve Sinerji Raporu';
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
                    padding: 0;
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
                    margin: 20px 0 70px 0;
                    padding-left: 10px;
                    padding-right: 10px;
                    padding-bottom: 90px;
                    position: relative;
                    margin-bottom: 90px;
                    margin-left: 0;
                    margin-right: 0;
                    page-break-inside: avoid;
                }

                .subsection + .subsection {
                    page-break-before: always;
                }

                .section-start + .subsection {
                    page-break-before: auto !important;
                }

                /* Her alt başlık yeni sayfada başlasın ama ilkinden sonra */
                .subsection:not(:first-child){
                    page-break-before: avoid;
                }

                .sub-subsection {
                    margin: 8px 0;
                    padding-left: 20px;
                }

                .section-table {
                    width: 100%;
                    border-collapse: collapse;
                    page-break-inside: auto;
                }

                .section-table thead {
                    display: table-header-group;
                }

                .section-table tbody {
                    display: table-row-group;
                }

                .section-table td {
                    vertical-align: top;
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
                    color: #CC0000;
                    margin-bottom: 40px;
                    text-shadow: 4px 4px 8px rgba(0,0,0,0.3);
                    font-family: Cambria, Georgia, serif;
                    line-height: 1.1;
                    text-align: right;
                    width: 100%;
                    max-width: 600px;
                }

                .cover-divider {
                    width: 100%;
                    border-bottom: 1px solid #000;
                    margin: 30px 0;
                }

                .cover-info {
                    text-align: right;
                    font-size: 18px;
                    color: #2c3e50;
                    line-height: 2;
                    font-style: italic;
                    max-width: 600px;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                }

                /* Üst Bar (Sol bar + Sağda Yetkinlik Adı) */
                .competency-header-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                    margin-top: 32px;
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
                     border: 1px solid #999;
                 }

                 /* Dolu kısım - renk dinamik olarak ayarlanacak */
                 .competency-header-bar .bar .filled {
                     height: 100%;
                     border-right: 1px solid rgba(0,0,0,0.2); /* kenar çizgisi */
                     box-shadow: inset 0 0 2px rgba(255,255,255,0.4);
                     display: flex;
                     align-items: center;
                     justify-content: center;
                     color: white;
                     font-size: 11px;
                     font-weight: bold;
                     text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                 }

                /* Sol taraftaki yetkinlik ismi */
                .competency-header-bar .competency-name {
                    font-weight: 700;
                    color: #283c9b;
                    font-size: 20px;
                    text-shadow: 0 1px 1px rgba(0,0,0,0.1);
                }

                /* Sabit Footer */
                .page-footer {
                    position: fixed;
                    bottom: 0;
                    right: ${isPreview ? '20px' : '2.5cm'};
                    left: ${isPreview ? '20px' : '2.5cm'};
                    height: 50px;
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
            <div class="section-start" style="
                page-break-before: always;
                text-align:right; 
                padding:180px 20px; 
                min-height:682px; 
                display:flex; 
                align-items:center; 
                justify-content:flex-end;">
                <h1 style="font-size:80px; font-weight:bold; 
                        text-shadow:4px 4px 8px rgba(0,0,0,0.3); 
                        font-family: Impact,Haettenschweiler,Franklin Gothic Bold,Charcoal,Helvetica Inserat,Bitstream Vera Sans Bold,Arial Black,sans serif;
                        line-height: 0.9;
                        max-width: 600px;
                        word-wrap: break-word;">
                    ${competencyName.split(' ').map(word => {
                        return word.split('').map((char, index) => {
                            const totalChars = word.length;
                            const intensity = totalChars > 1 ? index / (totalChars - 1) : 0;
                            const r = Math.round(35 + (15 - 35) * intensity);
                            const g = Math.round(37 + (18 - 37) * intensity);
                            const b = Math.round(133 + (51 - 133) * intensity);
                            const color = `rgb(${r}, ${g}, ${b})`;
                            return `<span style="color: ${color};">${char}</span>`;
                        }).join('');
                    }).join(' ')}
                </h1>
            </div>
        `;

         // Bölüm ekleme fonksiyonu
         const addSection = async (title, content, isLastSection) => {
            let score = 0;
        
            // Game modelinden skorları al
            const games = await Game.find({ playerCode: userCode });
        
            // Skor değerini yetkinlik tipine göre al
            switch (report.type) {
                case 'MO':
                    const venusGame = games.find(g => g.section === '0' || g.section === 0);
                    score = venusGame ? venusGame.customerFocusScore : 0;
                    break;
                case 'BY':
                    const venusGame2 = games.find(g => g.section === '0' || g.section === 0);
                    score = venusGame2 ? venusGame2.uncertaintyScore : 0;
                    break;
                case 'IE':
                    const titanGame = games.find(g => g.section === '1' || g.section === 1);
                    score = titanGame ? titanGame.ieScore : 0;
                    break;
                case 'IDIK':
                    const titanGame2 = games.find(g => g.section === '1' || g.section === 1);
                    score = titanGame2 ? titanGame2.idikScore : 0;
                    break;
                default:
                    score = 0;
            }
        
            score = (!score || score === '-') ? 0 : Math.round(parseFloat(score));
        
            let barColor = '#0286F7';
            if (score <= 37) barColor = '#FF0000';
            else if (score <= 65) barColor = '#FFD700';
            else if (score <= 89.99) barColor = '#00FF00';
            else barColor = '#FF0000';
                
            const isDevelopmentSuggestion = title.includes("Gelişim Önerisi");

            // 🔹 Eğer bu son Gelişim Önerisi ise, page-break ekleme
            let sectionStyle = '';
            if (!(isDevelopmentSuggestion && isLastSection)) {
                sectionStyle = 'page-break-before: always;';
            }
            
            // 🔹 Ek güvenlik için: son Gelişim Önerisinden sonra yapay boş blok koyma
            const afterSectionSpacer = (isDevelopmentSuggestion && isLastSection)
                ? '<div style="height: 0;"></div>'
                : '';
            
            return `
              <div class="subsection" style="${sectionStyle}">
                <table class="section-table">
                  <thead>
                    <tr>
                      <td>
                        <div class="competency-header-bar">
                          <div class="competency-name">${competencyName}</div>
                          <div style="display:flex; flex-direction:column;">
                            <div class="bar">
                              <div class="filled" style="width: ${score}%; background-color: ${barColor};">${score}</div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <h3>${title}</h3>
                        <p style="text-align: justify; text-justify: inter-word;">${content}</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              ${afterSectionSpacer}
            `;
            
        };
                
        // İçerikler
        if (options.generalEvaluation && data['Genel Değerlendirme']) {
            htmlContent += await addSection('Genel Değerlendirme', data['Genel Değerlendirme']);
        }
        if (options.strengths && data['Güçlü Yönler']) {
            htmlContent += await addSection('Güçlü Yönler', data['Güçlü Yönler']);
        }
        if (options.strengths && data['Gelişim Alanları']) {
            htmlContent += await addSection('Gelişim Alanları', data['Gelişim Alanları']);

        }
        if (options.interviewQuestions && data['Mülakat Soruları']) {
            htmlContent += await addSection('Mülakat Soruları', data['Mülakat Soruları']);
        }
        if (options.whyTheseQuestions && data['Neden Bu Sorular?']) {
            htmlContent += await addSection('Neden Bu Sorular?', data['Neden Bu Sorular?']);
        }

        if (options.developmentSuggestions) {
            const suggestionKeys = [
                { key: 'Gelişim Önerileri -1', title: 'Gelişim Önerisi 1' },
                { key: 'Gelişim Önerileri -2', title: 'Gelişim Önerisi 2' },
                { key: 'Gelişim Önerileri - 3', title: 'Gelişim Önerisi 3' },
                { key: 'Gelişim Önerileri -4', title: 'Gelişim Önerisi 4' }
            ];
            const validSuggestions = suggestionKeys.filter(item => data[item.key]);

            for (let i = 0; i < validSuggestions.length; i++) {
                const item = validSuggestions[i];
                const isLastSuggestion = (i === validSuggestions.length - 1); // sonuncu mu?
                htmlContent += await addSection(item.title, data[item.key], isLastSuggestion);
            }
        }
    }

    // 📎 Footer
    htmlContent += `
        </div>
        </body>
        </html>
    `;

    return htmlContent;
}


async function generateAndSendPDF(evaluation, options, res, userCode) {
    const htmlContent = await buildEvaluationHTML(evaluation, options, userCode, false);
    const pdfOptions = { 
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: true,
        margin: {right: '2.5cm', bottom: '2.2cm', left: '2.5cm' },
        headerTemplate: '<div></div>', // başlık kullanmıyoruz
        footerTemplate: `
          <div style="font-size:10px; color:#666; width:100%;">
            <div style="width: calc(100% - 5cm); margin: 0 auto; border-top:1px solid #ddd; padding-top:4px; text-align:right;">
              <span style="font-weight:700; color:#2c3e50;">ANDRON Game</span>
              <span style="margin-left:8px;">GİZLİ © ANDRON Game 2025, İzinsiz paylaşılamaz.</span>
              <span style="margin-left:12px;"><span class="pageNumber"></span>/<span class="totalPages"></span></span>
            </div>
          </div>`
      };
    const file = await htmlPdf.generatePdf({ content: htmlContent }, pdfOptions);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=evaluation_${evaluation[0].data.ID}.pdf`);
    res.send(file);
}

async function generateAndSendPreview(evaluation, options, res, userCode) {
    const htmlContent = await buildEvaluationHTML(evaluation, options, userCode, true);
    const pdfOptions = { 
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: true,
        margin: {right: '2.5cm', bottom: '2.2cm', left: '2.5cm' },
        headerTemplate: '<div></div>', // başlık kullanmıyoruz
        footerTemplate: `
          <div style="font-size:10px; color:#666; width:100%;">
            <div style="width: calc(100% - 5cm); margin: 0 auto; border-top:1px solid #ddd; padding-top:4px; text-align:right;">
              <span style="font-weight:700; color:#2c3e50;">ANDRON Game</span>
              <span style="margin-left:8px;">GİZLİ © ANDRON Game 2025, İzinsiz paylaşılamaz.</span>
              <span style="margin-left:12px;"><span class="pageNumber"></span>/<span class="totalPages"></span></span>
            </div>
          </div>`
      };
    const file = await htmlPdf.generatePdf({ content: htmlContent }, pdfOptions);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=evaluation_${evaluation[0].data.ID}.pdf`);
    res.send(file);
}

async function generateAndSendWord(evaluation, options, res, userCode) {
    try {
        const sortedEvaluation = await sortReportsByPlanetOrder(evaluation, userCode);
        const userInfo = await getUserInfo(userCode);
        const formattedDate = userInfo.completionDate.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Footer oluştur
        const footer = new Footer({
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "ANDRON Game",
                            bold: true,
                            size: 14,
                            color: "2c3e50"
                        })
                    ],
                    alignment: AlignmentType.RIGHT,
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "GİZLİ © ANDRON Game 2025, İzinsiz paylaşılamaz.    ",
                            size: 12,
                            color: "666666"
                        }),
                        new TextRun({
                            children: [PageNumber.CURRENT],
                            size: 12,
                            color: "666666"
                        }),
                        new TextRun({
                            text: " / ",
                            size: 12,
                            color: "666666"
                        }),
                        new TextRun({
                            children: [PageNumber.TOTAL_PAGES],
                            size: 12,
                            color: "666666"
                        })
                    ],
                    alignment: AlignmentType.RIGHT
                })
            ]
        });

        // Word belgesi oluştur - İlk section kapak sayfası olacak
        // Dinamik font boyutu hesaplama - sayfanın solundan sağına kadar uzanacak şekilde
        const pageWidth = 595; // A4 sayfa genişliği (pt)
        const margin = 100; // Sol ve sağ margin
        const availableWidth = pageWidth - margin;
        const titleFontSize = Math.floor(availableWidth / 6); // 8'den 6'ya düşürüldü (daha büyük font)
        
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    // Boşluk için üst kısım - sayfa ortasına getirmek için
                    new Paragraph({
                        children: [new TextRun({ text: "" })],
                        spacing: { before: 3500, after: 0 }
                    }),
                    // Ana başlık - sağa yaslı, iki satır, gölgeli ve koyulaşan harfler
                    // DEĞERLENDİRME başlığı
                    new Paragraph({
                        children: "DEĞERLENDİRME".split('').map((char, index) => {
                            const totalChars = "DEĞERLENDİRME".length;
                            const intensity = index / (totalChars - 1);
                            const r = Math.round(204 + (102 - 204) * intensity); // CC0000'dan 660000'a
                            const g = Math.round(0 + (0 - 0) * intensity);
                            const b = Math.round(0 + (0 - 0) * intensity);
                            const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                            return new TextRun({
                                text: char,
                                bold: true,
                                size: titleFontSize,
                                color: color,
                                font: "Cambria",
                                shading: {
                                    fill: "auto",
                                    type: "clear"
                                }
                            });
                        }),
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 0, after: 0 }
                    }),
                    // RAPORU başlığı
                    new Paragraph({
                        children: "RAPORU".split('').map((char, index) => {
                            const totalChars = "RAPORU".length;
                            const intensity = index / (totalChars - 1);
                            const r = Math.round(204 + (102 - 204) * intensity); // CC0000'dan 660000'a
                            const g = Math.round(0 + (0 - 0) * intensity);
                            const b = Math.round(0 + (0 - 0) * intensity);
                            const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                            return new TextRun({
                                text: char,
                                bold: true,
                                size: titleFontSize,
                                color: color,
                                font: "Cambria",
                                shading: {
                                    fill: "auto",
                                    type: "clear"
                                }
                            });
                        }),
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 0, after: 300 }
                    }),
                    // Çizgi - yatay çizgi
                    new Paragraph({
                        children: [new TextRun({ text: "" })],
                        spacing: { before: 0, after: 200 },
                        border: {
                            bottom: {
                                color: "000000",
                                space: 1,
                                style: BorderStyle.SINGLE,
                                size: 6
                            }
                        }
                    }),
                    // İsim ve tarih - sağa yaslı
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: userInfo.name,
                                bold: true,
                                size: 24,
                                color: "2c3e50",
                                font: "Cambria"
                            })
                        ],
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 200, after: 100 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: formattedDate,
                                size: 22,
                                color: "2c3e50",
                                font: "Cambria"
                            })
                        ],
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 0, after: 0 }
                    })
                ],
                footers: {
                    default: footer
                }
            }]
        });

        // Her yetkinlik için bölüm
        for (let i = 0; i < sortedEvaluation.length; i++) {
            const report = sortedEvaluation[i];
            const data = report.data;
            const reportTitle = getReportTitle(report.type);
            const competencyName = reportTitle.replace(' Raporu', '');

            // Yetkinlik başlığı
            doc.addSection({
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: competencyName,
                                bold: true,
                                size: 48,
                                color: "283C9B"
                            })
                        ],
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 400, after: 600 }
                    })
                ],
                footers: {
                    default: footer
                }
            });

            // Skor hesaplama
            let score = 0;
            const games = await Game.find({ playerCode: userCode });
            
            switch (report.type) {
                case 'MO':
                    const venusGame = games.find(g => g.section === '0' || g.section === 0);
                    score = venusGame ? venusGame.customerFocusScore : 0;
                    break;
                case 'BY':
                    const venusGame2 = games.find(g => g.section === '0' || g.section === 0);
                    score = venusGame2 ? venusGame2.uncertaintyScore : 0;
                    break;
                case 'IE':
                    const titanGame = games.find(g => g.section === '1' || g.section === 1);
                    score = titanGame ? titanGame.ieScore : 0;
                    break;
                case 'IDIK':
                    const titanGame2 = games.find(g => g.section === '1' || g.section === 1);
                    score = titanGame2 ? titanGame2.idikScore : 0;
                    break;
                default:
                    score = 0;
            }
            
            score = (!score || score === '-') ? 0 : Math.round(parseFloat(score));

            // Skor gösterimi
            doc.addSection({
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${competencyName} - Skor: ${score}`,
                                bold: true,
                                size: 20
                            })
                        ],
                        spacing: { after: 300 }
                    })
                ],
                footers: {
                    default: footer
                }
            });

            // İçerikler
            if (options.generalEvaluation && data['Genel Değerlendirme']) {
                doc.addSection({
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Genel Değerlendirme",
                                    bold: true,
                                    size: 24
                                })
                            ],
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: data['Genel Değerlendirme'],
                                    size: 20
                                })
                            ],
                            spacing: { after: 400 }
                        })
                    ],
                    footers: {
                        default: footer
                    }
                });
            }

            if (options.strengths && data['Güçlü Yönler']) {
                doc.addSection({
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Güçlü Yönler",
                                    bold: true,
                                    size: 24
                                })
                            ],
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: data['Güçlü Yönler'],
                                    size: 20
                                })
                            ],
                            spacing: { after: 400 }
                        })
                    ],
                    footers: {
                        default: footer
                    }
                });
            }

            if (options.strengths && data['Gelişim Alanları']) {
                doc.addSection({
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Gelişim Alanları",
                                    bold: true,
                                    size: 24
                                })
                            ],
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: data['Gelişim Alanları'],
                                    size: 20
                                })
                            ],
                            spacing: { after: 400 }
                        })
                    ],
                    footers: {
                        default: footer
                    }
                });
            }

            if (options.interviewQuestions && data['Mülakat Soruları']) {
                doc.addSection({
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Mülakat Soruları",
                                    bold: true,
                                    size: 24
                                })
                            ],
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: data['Mülakat Soruları'],
                                    size: 20
                                })
                            ],
                            spacing: { after: 400 }
                        })
                    ],
                    footers: {
                        default: footer
                    }
                });
            }

            if (options.whyTheseQuestions && data['Neden Bu Sorular?']) {
                doc.addSection({
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Neden Bu Sorular?",
                                    bold: true,
                                    size: 24
                                })
                            ],
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: data['Neden Bu Sorular?'],
                                    size: 20
                                })
                            ],
                            spacing: { after: 400 }
                        })
                    ],
                    footers: {
                        default: footer
                    }
                });
            }

            if (options.developmentSuggestions) {
                const suggestionKeys = [
                    { key: 'Gelişim Önerileri -1', title: 'Gelişim Önerisi 1' },
                    { key: 'Gelişim Önerileri -2', title: 'Gelişim Önerisi 2' },
                    { key: 'Gelişim Önerileri - 3', title: 'Gelişim Önerisi 3' },
                    { key: 'Gelişim Önerileri -4', title: 'Gelişim Önerisi 4' }
                ];
                const validSuggestions = suggestionKeys.filter(item => data[item.key]);

                for (const item of validSuggestions) {
                    doc.addSection({
                        properties: {},
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: item.title,
                                        bold: true,
                                        size: 24
                                    })
                                ],
                                spacing: { after: 200 }
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: data[item.key],
                                        size: 20
                                    })
                                ],
                                spacing: { after: 400 }
                            })
                        ],
                        footers: {
                            default: footer
                        }
                    });
                }
            }
        }

        // Word dosyasını oluştur ve gönder
        const buffer = await Packer.toBuffer(doc);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=evaluation_${evaluation[0].data.ID}.docx`);
        res.send(buffer);
        
    } catch (error) {
        console.error('Word oluşturma hatası:', error);
        res.status(500).json({ message: 'Word oluşturulurken bir hata oluştu' });
    }
}

module.exports = evaluationController; 