const express = require('express');
const router = express.Router();

module.exports = (gameController) => {
    router.get('/results', gameController.getResults.bind(gameController));
    router.post('/register', gameController.registerGame.bind(gameController));
    
    return router;
}; 