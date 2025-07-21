const GameManagement = require('../models/gameManagement');

class GameManagementController {
    // Tüm oyun yönetimi verilerini getir
    async getAllGames(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;
            const games = await GameManagement.find({}, 'firmName invoiceNo credit date')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            const total = await GameManagement.countDocuments();
            res.json({ games, total });
        } catch (error) {
            console.error('Oyun verileri getirme hatası:', error);
            res.status(500).json({ message: 'Oyun verileri getirilemedi' });
        }
    }

    // Yeni oyun verisi ekle
    async addGame(req, res) {
        try {
            const { firmName, invoiceNo, credit, invoiceFile } = req.body;

            // Validasyon
            if (!firmName || !invoiceNo || !credit || !invoiceFile) {
                return res.status(400).json({ message: 'Tüm alanlar zorunludur' });
            }

            // Dosya formatı kontrolü
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(invoiceFile.fileType)) {
                return res.status(400).json({ message: 'Sadece PDF, JPEG ve PNG formatları kabul edilir' });
            }

            const newGame = new GameManagement({
                firmName,
                invoiceNo,
                credit: Number(credit),
                invoiceFile
            });

            await newGame.save();
            res.status(201).json(newGame);
        } catch (error) {
            console.error('Oyun ekleme hatası:', error);
            res.status(500).json({ message: 'Oyun eklenemedi' });
        }
    }

    // Oyun verisini güncelle
    async updateGame(req, res) {
        try {
            const { id } = req.params;
            const { firmName, invoiceNo, credit, invoiceFile } = req.body;

            const updatedGame = await GameManagement.findByIdAndUpdate(
                id,
                {
                    firmName,
                    invoiceNo,
                    credit: Number(credit),
                    invoiceFile,
                    updatedAt: Date.now()
                },
                { new: true }
            );

            if (!updatedGame) {
                return res.status(404).json({ message: 'Oyun bulunamadı' });
            }

            res.json(updatedGame);
        } catch (error) {
            console.error('Oyun güncelleme hatası:', error);
            res.status(500).json({ message: 'Oyun güncellenemedi' });
        }
    }

    // Oyun verisini sil
    async deleteGame(req, res) {
        try {
            const { id } = req.params;
            const deletedGame = await GameManagement.findByIdAndDelete(id);

            if (!deletedGame) {
                return res.status(404).json({ message: 'Oyun bulunamadı' });
            }

            res.json({ message: 'Oyun başarıyla silindi' });
        } catch (error) {
            console.error('Oyun silme hatası:', error);
            res.status(500).json({ message: 'Oyun silinemedi' });
        }
    }

    // Firma adına göre oyun verisi getir
    async getGameByFirmName(req, res) {
        try {
            const { firmName } = req.params;
            const game = await GameManagement.findOne({ firmName });

            if (!game) {
                return res.status(404).json({ message: 'Oyun bulunamadı' });
            }

            res.json(game);
        } catch (error) {
            console.error('Oyun getirme hatası:', error);
            res.status(500).json({ message: 'Oyun getirilemedi' });
        }
    }
}

module.exports = new GameManagementController(); 