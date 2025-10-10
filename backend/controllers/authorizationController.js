const Authorization = require('../models/Authorization');

// Tüm yetkilendirmeleri getir
const getAllAuthorizations = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = '' } = req.query;
        
        // Arama ve filtreleme kriterleri
        let filter = {};
        
        if (search) {
            filter.$or = [
                { sicilNo: { $regex: search, $options: 'i' } },
                { personName: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Sayfalama için skip hesapla
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Yetkilendirmeleri getir
        const authorizations = await Authorization.find(filter)
            .populate('createdBy', 'username email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Toplam sayıyı al
        const total = await Authorization.countDocuments(filter);

        res.json({
            success: true,
            authorizations,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Yetkilendirmeleri getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Yetkilendirmeler getirilirken bir hata oluştu',
            error: error.message
        });
    }
};

// Tek yetkilendirme getir
const getAuthorizationById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const authorization = await Authorization.findById(id).populate('createdBy', 'username email');
        
        if (!authorization) {
            return res.status(404).json({
                success: false,
                message: 'Yetkilendirme bulunamadı'
            });
        }

        res.json({
            success: true,
            authorization
        });
    } catch (error) {
        console.error('Yetkilendirme getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Yetkilendirme getirilirken bir hata oluştu',
            error: error.message
        });
    }
};

// Yeni yetkilendirme oluştur
const createAuthorization = async (req, res) => {
    try {
        const { sicilNo, personName, title } = req.body;
        const createdBy = req.admin?.id; // Middleware'den gelen admin ID (opsiyonel)

        // Gerekli alanları kontrol et
        if (!sicilNo || !sicilNo.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Sicil numarası gereklidir'
            });
        }

        if (!personName || !personName.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Kişi adı gereklidir'
            });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Pozisyon gereklidir'
            });
        }

        // Aynı sicil numarasında yetkilendirme var mı kontrol et
        const existingAuthorization = await Authorization.findOne({ 
            sicilNo: sicilNo.trim()
        });

        if (existingAuthorization) {
            return res.status(400).json({
                success: false,
                message: 'Bu sicil numarasında zaten bir yetkilendirme mevcut'
            });
        }

        // Yeni yetkilendirme oluştur
        const newAuthorization = new Authorization({
            sicilNo: sicilNo.trim(),
            personName: personName.trim(),
            title: title.trim(),
            createdBy: createdBy
        });

        await newAuthorization.save();

        // Populate ile createdBy bilgisini ekle
        await newAuthorization.populate('createdBy', 'username email');

        res.status(201).json({
            success: true,
            message: 'Yetkilendirme başarıyla oluşturuldu',
            authorization: newAuthorization
        });
    } catch (error) {
        console.error('Yetkilendirme oluşturma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Yetkilendirme oluşturulurken bir hata oluştu',
            error: error.message
        });
    }
};

// Yetkilendirme güncelle
const updateAuthorization = async (req, res) => {
    try {
        const { id } = req.params;
        const { sicilNo, personName, title } = req.body;

        // Yetkilendirme var mı kontrol et
        const authorization = await Authorization.findById(id);
        if (!authorization) {
            return res.status(404).json({
                success: false,
                message: 'Yetkilendirme bulunamadı'
            });
        }

        // Güncelleme verilerini hazırla
        const updateData = {};
        
        if (sicilNo && sicilNo.trim()) {
            // Aynı sicil numarasında başka yetkilendirme var mı kontrol et
            const existingAuthorization = await Authorization.findOne({ 
                sicilNo: sicilNo.trim(),
                _id: { $ne: id }
            });

            if (existingAuthorization) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu sicil numarasında başka bir yetkilendirme zaten mevcut'
                });
            }
            
            updateData.sicilNo = sicilNo.trim();
        }

        if (personName && personName.trim()) {
            updateData.personName = personName.trim();
        }

        if (title && title.trim()) {
            updateData.title = title.trim();
        }


        // Yetkilendirmeyi güncelle
        const updatedAuthorization = await Authorization.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('createdBy', 'username email');

        res.json({
            success: true,
            message: 'Yetkilendirme başarıyla güncellendi',
            authorization: updatedAuthorization
        });
    } catch (error) {
        console.error('Yetkilendirme güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Yetkilendirme güncellenirken bir hata oluştu',
            error: error.message
        });
    }
};

// Yetkilendirme sil
const deleteAuthorization = async (req, res) => {
    try {
        const { id } = req.params;

        // Yetkilendirme var mı kontrol et
        const authorization = await Authorization.findById(id);
        if (!authorization) {
            return res.status(404).json({
                success: false,
                message: 'Yetkilendirme bulunamadı'
            });
        }

        // Yetkilendirmeyi sil
        await Authorization.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Yetkilendirme başarıyla silindi'
        });
    } catch (error) {
        console.error('Yetkilendirme silme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Yetkilendirme silinirken bir hata oluştu',
            error: error.message
        });
    }
};



module.exports = {
    getAllAuthorizations,
    getAuthorizationById,
    createAuthorization,
    updateAuthorization,
    deleteAuthorization
};
