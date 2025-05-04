const mongoose = require('mongoose');
const UserCode = require('../models/userCode');
const Game = require('../models/game');

async function updateScores() {
    try {
        // MongoDB bağlantısı
        await mongoose.connect('mongodb://localhost:27017/adminpanel', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Tüm UserCode kayıtlarını al
        const userCodes = await UserCode.find({ status: 'Tamamlandı' });

        // Her kayıt için skorları güncelle
        for (const userCode of userCodes) {
            const game = await Game.findOne({ playerCode: userCode.code });
            
            if (game) {
                await UserCode.findOneAndUpdate(
                    { code: userCode.code },
                    {
                        customerFocusScore: game.customerFocusScore,
                        uncertaintyScore: game.uncertaintyScore
                    }
                );
            }
        }

        process.exit(0);
    } catch (error) {   
        console.error('Hata:', error);
        process.exit(1);
    }
}

updateScores(); 