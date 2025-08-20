const { answerMultipliers } = require('../config/constants');

class ScoreCalculator {
    /**
     * Temel skor hesaplama fonksiyonu
     * @param {Array} answers - Cevap dizisi
     * @returns {number} - Hesaplanan skor
     */
    static calculateBasicScore(answers) {
        if (!answers || answers.length === 0) return 0;
        
        const totalScore = answers.reduce((acc, answer) => {
            const multiplier1 = answerMultipliers[answer.answerType1] || 0;
            const multiplier2 = answerMultipliers[answer.answerType2] || 0;
            return acc + ((multiplier1 + (multiplier2 / 2)) * 2) / 3;
        }, 0);
        
        return (totalScore / answers.length) * 100;
    }

    /**
     * Venus - Müşteri Odaklılık skorunu hesaplar
     * @param {Array} answers - Tüm cevaplar
     * @returns {number} - MO skoru
     */
    static calculateCustomerFocusScore(answers) {
        const moAnswers = answers.filter(answer => answer.answerSubCategory === 'MO');
        return this.calculateBasicScore(moAnswers);
    }

    /**
     * Venus - Belirsizlik Yönetimi skorunu hesaplar (özel hesaplama)
     * @param {Array} answers - Tüm cevaplar
     * @returns {number} - BY skoru
     */
    static calculateUncertaintyScore(answers) {
        const byAnswers = answers.filter(answer => answer.answerSubCategory === 'BY');
        
        if (byAnswers.length === 0) return 0;

        // 4. sorunun cevabı A ise özel hesaplama yap
        const question3Answer = byAnswers.find(answer => answer.questionNumber === 3);
        const question4Answer = byAnswers.find(answer => answer.questionNumber === 4);
        const question5Answer = byAnswers.find(answer => answer.questionNumber === 5);
        
        // Özel hesaplama koşulları: 3. soru A, 4. soru A veya B, 5. soru var
        const isSpecialCalculation = question3Answer && 
            question4Answer && 
            question5Answer &&
            question3Answer.answerType1 === 'A' && 
            (question4Answer.answerType1 === 'A' || question4Answer.answerType1 === 'B');
        
        if (isSpecialCalculation) {
            // 4. ve 5. sorunun puanlarının ortalamasını al
            const score4 = ((answerMultipliers[question4Answer.answerType1] || 0) + (answerMultipliers[question4Answer.answerType2] || 0) / 2) * 2 / 3;
            const score5 = ((answerMultipliers[question5Answer.answerType1] || 0) + (answerMultipliers[question5Answer.answerType2] || 0) / 2) * 2 / 3;
            const combinedScore = (score4 + score5) / 2;
            
            // Diğer soruları normal hesapla
            const otherAnswers = byAnswers.filter(answer => answer.questionNumber !== 4 && answer.questionNumber !== 5);
            let otherScores = 0;
            
            if (otherAnswers.length > 0) {
                otherScores = otherAnswers.reduce((acc, answer) => {
                    const multiplier1 = answerMultipliers[answer.answerType1] || 0;
                    const multiplier2 = answerMultipliers[answer.answerType2] || 0;
                    return acc + ((multiplier1 + (multiplier2 / 2)) * 2) / 3;
                }, 0);
            }
            
            // Toplam skoru hesapla (4-5 kombinasyonu + diğer sorular)
            const totalScore = combinedScore + otherScores;
            return (totalScore / (otherAnswers.length + 1)) * 100; // +1 çünkü 4-5 kombinasyonu tek soru sayılıyor
        } else {
            // Normal hesaplama (4. soru A değilse veya 5. soru yoksa)
            return this.calculateBasicScore(byAnswers);
        }
    }

    /**
     * Titan - İnsanları Etkileme skorunu hesaplar
     * @param {Array} answers - Tüm cevaplar
     * @returns {number} - IE skoru
     */
    static calculateIEScore(answers) {
        const ieAnswers = answers.filter(answer => answer.answerSubCategory === 'IE');
        return this.calculateBasicScore(ieAnswers);
    }

    /**
     * Titan - Güven Veren İşbirlikçi ve Sinerji skorunu hesaplar
     * @param {Array} answers - Tüm cevaplar
     * @returns {number} - IDIK skoru
     */
    static calculateIDIKScore(answers) {
        const idikAnswers = answers.filter(answer => answer.answerSubCategory === 'IDIK');
        return this.calculateBasicScore(idikAnswers);
    }

    /**
     * Tüm skorları hesaplar
     * @param {Array} answers - Tüm cevaplar
     * @returns {Object} - Tüm skorlar
     */
    static calculateAllScores(answers) {
        return {
            customerFocusScore: Math.round(this.calculateCustomerFocusScore(answers)),
            uncertaintyScore: Math.round(this.calculateUncertaintyScore(answers)),
            ieScore: Math.round(this.calculateIEScore(answers)),
            idikScore: Math.round(this.calculateIDIKScore(answers))
        };
    }
}

module.exports = ScoreCalculator;
