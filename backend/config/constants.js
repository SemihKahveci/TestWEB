// Cevap tiplerine göre puanlar (yeni sistem)
const answerScores = {
    "AY": 0,
    "AKY": 30,
    "Y": 65,
    "CY": 100
};

module.exports = {
    answerScores,
    PORT: process.env.PORT || 5000
}; 