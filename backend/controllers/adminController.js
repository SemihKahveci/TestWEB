const mongoose = require('mongoose');
const EvaluationResult = require('../models/evaluationResult');

const adminController = {
    login: async (req, res) => {
        const { username, password } = req.body;
        
        // Basit bir admin kontrolü - gerçek uygulamada bu bilgiler .env dosyasında saklanmalı
        if (username === 'admin' && password === 'admin123') {
            res.json({ message: 'Giriş başarılı' });
        } else {
            res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
        }
    },

    createEvaluation: async (req, res) => {
        try {
            const evaluationData = req.body;
            
            // Aynı ID'ye sahip değerlendirme var mı kontrol et
            const existingEvaluation = await EvaluationResult.findOne({ id: evaluationData.id });
            if (existingEvaluation) {
                return res.status(400).json({ message: 'Bu ID\'ye sahip bir değerlendirme zaten mevcut' });
            }

            // Yeni değerlendirmeyi oluştur
            const evaluation = await EvaluationResult.create(evaluationData);
            res.status(201).json({ message: 'Değerlendirme başarıyla oluşturuldu', evaluation });
        } catch (error) {
            console.error('Değerlendirme oluşturma hatası:', error);
            res.status(500).json({ message: 'Değerlendirme oluşturulurken bir hata oluştu' });
        }
    },

    deleteEvaluation: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Değerlendirmeyi bul ve sil
            const evaluation = await EvaluationResult.findOneAndDelete({ id: id });
            
            if (!evaluation) {
                return res.status(404).json({ message: 'Değerlendirme bulunamadı' });
            }

            res.json({ message: 'Değerlendirme başarıyla silindi' });
        } catch (error) {
            console.error('Değerlendirme silme hatası:', error);
            res.status(500).json({ message: 'Değerlendirme silinirken bir hata oluştu' });
        }
    }
};

module.exports = adminController; 