const Competency = require('../models/Competency');

const competencyController = {
    // Tüm yetkinlikleri getir
    getCompetencies: async (req, res) => {
        try {
            const competencies = await Competency.find()
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 });
            
            res.json({
                success: true,
                competencies
            });
        } catch (error) {
            console.error('Yetkinlik listesi alma hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Yetkinlik listesi alınırken bir hata oluştu',
                error: error.message
            });
        }
    },

    // Tekil yetkinlik getir
    getCompetencyById: async (req, res) => {
        try {
            const { id } = req.params;
            const competency = await Competency.findById(id)
                .populate('createdBy', 'name email');
            
            if (!competency) {
                return res.status(404).json({
                    success: false,
                    message: 'Yetkinlik bulunamadı'
                });
            }
            
            res.json({
                success: true,
                competency
            });
        } catch (error) {
            console.error('Yetkinlik getirme hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Yetkinlik getirilirken bir hata oluştu',
                error: error.message
            });
        }
    },

    // Yeni yetkinlik oluştur
    createCompetency: async (req, res) => {
        try {
            const {
                title,
                customerFocusMin,
                customerFocusMax,
                uncertaintyMin,
                uncertaintyMax,
                influenceMin,
                influenceMax,
                collaborationMin,
                collaborationMax
            } = req.body;

            // Validasyon
            if (!title || !customerFocusMin || !customerFocusMax || 
                !uncertaintyMin || !uncertaintyMax || 
                !influenceMin || !influenceMax || 
                !collaborationMin || !collaborationMax) {
                return res.status(400).json({
                    success: false,
                    message: 'Tüm alanlar gereklidir'
                });
            }

            // Min-Max değerlerini kontrol et
            const errors = [];
            if (parseInt(customerFocusMin) > parseInt(customerFocusMax)) {
                errors.push('Müşteri Odaklılık');
            }
            if (parseInt(uncertaintyMin) > parseInt(uncertaintyMax)) {
                errors.push('Belirsizlik Yönetimi');
            }
            if (parseInt(influenceMin) > parseInt(influenceMax)) {
                errors.push('İnsanları Etkileme');
            }
            if (parseInt(collaborationMin) > parseInt(collaborationMax)) {
                errors.push('Güven Veren İşbirlikçi ve Sinerji');
            }

            if (errors.length > 0) {
                const errorText = errors.length === 1 
                    ? `Minimum değer maksimum değerden büyük olamaz! (${errors[0]})`
                    : `Minimum değer maksimum değerden büyük olamaz! (${errors.join(', ')})`;
                
                return res.status(400).json({
                    success: false,
                    message: errorText
                });
            }

            // Yeni yetkinlik oluştur
            const competency = new Competency({
                title,
                customerFocus: {
                    min: parseInt(customerFocusMin),
                    max: parseInt(customerFocusMax)
                },
                uncertaintyManagement: {
                    min: parseInt(uncertaintyMin),
                    max: parseInt(uncertaintyMax)
                },
                influence: {
                    min: parseInt(influenceMin),
                    max: parseInt(influenceMax)
                },
                collaboration: {
                    min: parseInt(collaborationMin),
                    max: parseInt(collaborationMax)
                },
                createdBy: req.admin.id
            });

            await competency.save();
            await competency.populate('createdBy', 'name email');

            res.status(201).json({
                success: true,
                message: 'Yetkinlik başarıyla oluşturuldu',
                competency
            });
        } catch (error) {
            console.error('Yetkinlik oluşturma hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Yetkinlik oluşturulurken bir hata oluştu',
                error: error.message
            });
        }
    },

    // Yetkinlik güncelle
    updateCompetency: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                title,
                customerFocusMin,
                customerFocusMax,
                uncertaintyMin,
                uncertaintyMax,
                influenceMin,
                influenceMax,
                collaborationMin,
                collaborationMax
            } = req.body;

            // Yetkinliği bul
            const competency = await Competency.findById(id);
            if (!competency) {
                return res.status(404).json({
                    success: false,
                    message: 'Yetkinlik bulunamadı'
                });
            }

            // Validasyon
            if (!title || !customerFocusMin || !customerFocusMax || 
                !uncertaintyMin || !uncertaintyMax || 
                !influenceMin || !influenceMax || 
                !collaborationMin || !collaborationMax) {
                return res.status(400).json({
                    success: false,
                    message: 'Tüm alanlar gereklidir'
                });
            }

            // Min-Max değerlerini kontrol et
            const errors = [];
            if (parseInt(customerFocusMin) > parseInt(customerFocusMax)) {
                errors.push('Müşteri Odaklılık');
            }
            if (parseInt(uncertaintyMin) > parseInt(uncertaintyMax)) {
                errors.push('Belirsizlik Yönetimi');
            }
            if (parseInt(influenceMin) > parseInt(influenceMax)) {
                errors.push('İnsanları Etkileme');
            }
            if (parseInt(collaborationMin) > parseInt(collaborationMax)) {
                errors.push('Güven Veren İşbirlikçi ve Sinerji');
            }

            if (errors.length > 0) {
                const errorText = errors.length === 1 
                    ? `Minimum değer maksimum değerden büyük olamaz! (${errors[0]})`
                    : `Minimum değer maksimum değerden büyük olamaz! (${errors.join(', ')})`;
                
                return res.status(400).json({
                    success: false,
                    message: errorText
                });
            }

            // Yetkinliği güncelle
            competency.title = title;
            competency.customerFocus = {
                min: parseInt(customerFocusMin),
                max: parseInt(customerFocusMax)
            };
            competency.uncertaintyManagement = {
                min: parseInt(uncertaintyMin),
                max: parseInt(uncertaintyMax)
            };
            competency.influence = {
                min: parseInt(influenceMin),
                max: parseInt(influenceMax)
            };
            competency.collaboration = {
                min: parseInt(collaborationMin),
                max: parseInt(collaborationMax)
            };
            competency.updatedAt = new Date();

            await competency.save();
            await competency.populate('createdBy', 'name email');

            res.json({
                success: true,
                message: 'Yetkinlik başarıyla güncellendi',
                competency
            });
        } catch (error) {
            console.error('Yetkinlik güncelleme hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Yetkinlik güncellenirken bir hata oluştu',
                error: error.message
            });
        }
    },

    // Yetkinlik sil
    deleteCompetency: async (req, res) => {
        try {
            const { id } = req.params;
            
            const competency = await Competency.findByIdAndDelete(id);
            if (!competency) {
                return res.status(404).json({
                    success: false,
                    message: 'Yetkinlik bulunamadı'
                });
            }

            res.json({
                success: true,
                message: 'Yetkinlik başarıyla silindi'
            });
        } catch (error) {
            console.error('Yetkinlik silme hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Yetkinlik silinirken bir hata oluştu',
                error: error.message
            });
        }
    }
};

module.exports = competencyController;
