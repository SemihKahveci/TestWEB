const express = require('express');
const router = express.Router();

module.exports = (gameController) => {
    // Oyun başlamadan önce kodu doğrula
    router.post('/verify-code', gameController.verifyGameCode.bind(gameController));
    
    // Oyun sonuçlarını kaydet
    router.post('/register', gameController.registerGame.bind(gameController));
    
    // Sonuçları getir
    router.get('/results', gameController.getResults.bind(gameController));

    // Tüm sonuçları sil
    router.delete('/results', gameController.deleteAllResults.bind(gameController));

    // Test verilerini ekle
    router.post('/add-test-data', gameController.addTestData.bind(gameController));

    // Cevap tiplerini ekle
    router.post('/add-answer-types', gameController.addAnswerTypes.bind(gameController));
    
    // Oyun cevaplarını getir
    router.get('/answers/:code', gameController.getGameAnswers.bind(gameController));
    
    return router;
}; 