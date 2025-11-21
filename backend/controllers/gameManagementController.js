const GameManagement = require('../models/gameManagement');
const { invalidateCache } = require('./creditController');
const { safeLog, getSafeErrorMessage } = require('../utils/helpers');
const { getCompanyFilter, addCompanyIdToData } = require('../middleware/auth');

class GameManagementController {
    // Tüm oyun yönetimi verilerini getir
    async getAllGames(req, res) {
        try {
            // Multi-tenant: Super admin için tüm veriler, normal admin için sadece kendi company'si
            const companyFilter = getCompanyFilter(req);
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;
            const games = await GameManagement.find(companyFilter, 'firmName invoiceNo credit date')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            const total = await GameManagement.countDocuments(companyFilter);
            res.json({ games, total });
        } catch (error) {
            safeLog('error', 'Oyun verileri getirme hatası', error);
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

            // Yeni oyun oluştur - companyId otomatik eklenir
            const dataWithCompanyId = addCompanyIdToData(req, {
                firmName,
                invoiceNo,
                credit: Number(credit),
                invoiceFile
            });
            const newGame = new GameManagement(dataWithCompanyId);

            await newGame.save();
            
            // Kredi cache'ini invalidate et çünkü toplam kredi değişmiş olabilir
            invalidateCache();
            
            res.status(201).json(newGame);
        } catch (error) {
            safeLog('error', 'Oyun ekleme hatası', error);
            res.status(500).json({ message: 'Oyun eklenemedi' });
        }
    }

    // Oyun verisini güncelle
    async updateGame(req, res) {
        try {
            const { id } = req.params;
            const { firmName, invoiceNo, credit, invoiceFile } = req.body;

            // Validasyon
            if (!firmName || !invoiceNo || !credit) {
                return res.status(400).json({ success: false, message: 'Tüm zorunlu alanlar doldurulmalıdır' });
            }

            // Mevcut oyunu kontrol et - companyId kontrolü yap
            const companyFilter = getCompanyFilter(req);
            const existingGame = await GameManagement.findOne({ _id: id, ...companyFilter });
            if (!existingGame) {
                return res.status(404).json({ success: false, message: 'Oyun bulunamadı veya yetkiniz yok' });
            }

            // Güncelleme verisi hazırla
            const updateData = {
                firmName,
                invoiceNo,
                credit: Number(credit),
                updatedAt: Date.now()
            };

            // Eğer yeni dosya varsa ekle
            if (invoiceFile) {
                // Dosya formatı kontrolü
                const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
                if (!allowedTypes.includes(invoiceFile.fileType)) {
                    return res.status(400).json({ success: false, message: 'Sadece PDF, JPEG ve PNG formatları kabul edilir' });
                }
                updateData.invoiceFile = invoiceFile;
            }

            // companyFilter zaten tanımlı (satır 76)
            const updatedGame = await GameManagement.findOneAndUpdate(
                { _id: id, ...companyFilter },
                updateData,
                { new: true }
            );
            
            if (!updatedGame) {
                return res.status(404).json({ success: false, message: 'Oyun bulunamadı veya yetkiniz yok' });
            }

            // Kredi cache'ini invalidate et çünkü toplam kredi değişmiş olabilir
            invalidateCache();

            res.json({ success: true, message: 'Oyun başarıyla güncellendi', game: updatedGame });
        } catch (error) {
            safeLog('error', 'Oyun güncelleme hatası', error);
            res.status(500).json({ success: false, message: 'Oyun güncellenemedi' });
        }
    }

    // Oyun verisini sil
    async deleteGame(req, res) {
        try {
            const { id } = req.params;
            // Multi-tenant: companyId kontrolü yap
            const companyFilter = getCompanyFilter(req);
            const deletedGame = await GameManagement.findOneAndDelete({ _id: id, ...companyFilter });

            if (!deletedGame) {
                return res.status(404).json({ message: 'Oyun bulunamadı' });
            }

            // Kredi cache'ini invalidate et çünkü toplam kredi değişmiş olabilir
            invalidateCache();

            res.json({ message: 'Oyun başarıyla silindi' });
        } catch (error) {
            safeLog('error', 'Oyun silme hatası', error);
            res.status(500).json({ message: 'Oyun silinemedi' });
        }
    }

    // ID'ye göre oyun verisi getir
    async getGameById(req, res) {
        try {
            const { id } = req.params;
            // Multi-tenant: companyId kontrolü yap
            const companyFilter = getCompanyFilter(req);
            const game = await GameManagement.findOne({ _id: id, ...companyFilter });

            if (!game) {
                return res.status(404).json({ success: false, message: 'Oyun bulunamadı' });
            }

            res.json({ success: true, game });
        } catch (error) {
            safeLog('error', 'Oyun getirme hatası', error);
            res.status(500).json({ success: false, message: 'Oyun getirilemedi' });
        }
    }

    // Firma adına göre oyun verisi getir
    async getGameByFirmName(req, res) {
        try {
            const { firmName } = req.params;
            // Multi-tenant: companyId kontrolü yap
            const companyFilter = getCompanyFilter(req);
            const game = await GameManagement.findOne({ firmName, ...companyFilter });

            if (!game) {
                return res.status(404).json({ message: 'Oyun bulunamadı' });
            }

            res.json(game);
        } catch (error) {
            safeLog('error', 'Oyun getirme hatası', error);
            res.status(500).json({ message: 'Oyun getirilemedi' });
        }
    }
}

module.exports = new GameManagementController(); 