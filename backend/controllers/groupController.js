const Group = require('../models/Group');

// Tüm grupları getir
const getAllGroups = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = '' } = req.query;
        
        // Arama ve filtreleme kriterleri
        let filter = {};
        
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }
        
        if (status) {
            filter.status = status;
        }

        // Sayfalama için skip hesapla
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Grupları getir
        const groups = await Group.find(filter)
            .populate('createdBy', 'username email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Toplam sayıyı al
        const total = await Group.countDocuments(filter);

        res.json({
            success: true,
            groups,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Grupları getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Gruplar getirilirken bir hata oluştu',
            error: error.message
        });
    }
};

// Tek grup getir
const getGroupById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const group = await Group.findById(id).populate('createdBy', 'username email');
        
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Grup bulunamadı'
            });
        }

        res.json({
            success: true,
            group
        });
    } catch (error) {
        console.error('Grup getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Grup getirilirken bir hata oluştu',
            error: error.message
        });
    }
};

// Yeni grup oluştur
const createGroup = async (req, res) => {
    try {
        const { name, status } = req.body;
        const createdBy = req.admin.id; // Middleware'den gelen admin ID

        // Gerekli alanları kontrol et
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Grup adı gereklidir'
            });
        }

        // Aynı isimde grup var mı kontrol et
        const existingGroup = await Group.findOne({ 
            name: name.trim(),
            createdBy: createdBy
        });

        if (existingGroup) {
            return res.status(400).json({
                success: false,
                message: 'Bu isimde bir grup zaten mevcut'
            });
        }

        // Yeni grup oluştur
        const newGroup = new Group({
            name: name.trim(),
            status: status || 'Aktif',
            isActive: status === 'Aktif' || status === undefined,
            createdBy: createdBy
        });

        await newGroup.save();

        // Populate ile createdBy bilgisini ekle
        await newGroup.populate('createdBy', 'username email');

        res.status(201).json({
            success: true,
            message: 'Grup başarıyla oluşturuldu',
            group: newGroup
        });
    } catch (error) {
        console.error('Grup oluşturma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Grup oluşturulurken bir hata oluştu',
            error: error.message
        });
    }
};

// Grup güncelle
const updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, status } = req.body;
        const updatedBy = req.admin.id;

        // Grup var mı kontrol et
        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Grup bulunamadı'
            });
        }

        // Güncelleme verilerini hazırla
        const updateData = {};
        
        if (name && name.trim()) {
            // Aynı isimde başka grup var mı kontrol et
            const existingGroup = await Group.findOne({ 
                name: name.trim(),
                createdBy: group.createdBy,
                _id: { $ne: id }
            });

            if (existingGroup) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu isimde başka bir grup zaten mevcut'
                });
            }
            
            updateData.name = name.trim();
        }

        if (status !== undefined) {
            updateData.status = status;
            updateData.isActive = status === 'Aktif';
        }

        // Grubu güncelle
        const updatedGroup = await Group.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('createdBy', 'username email');

        res.json({
            success: true,
            message: 'Grup başarıyla güncellendi',
            group: updatedGroup
        });
    } catch (error) {
        console.error('Grup güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Grup güncellenirken bir hata oluştu',
            error: error.message
        });
    }
};

// Grup sil
const deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;

        // Grup var mı kontrol et
        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Grup bulunamadı'
            });
        }

        // Grubu sil
        await Group.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Grup başarıyla silindi'
        });
    } catch (error) {
        console.error('Grup silme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Grup silinirken bir hata oluştu',
            error: error.message
        });
    }
};

// Grup durumunu değiştir (toggle)
const toggleGroupStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Grup bulunamadı'
            });
        }

        // Durumu değiştir
        await group.toggleStatus();

        res.json({
            success: true,
            message: `Grup durumu ${group.status} olarak güncellendi`,
            group
        });
    } catch (error) {
        console.error('Grup durumu değiştirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Grup durumu değiştirilirken bir hata oluştu',
            error: error.message
        });
    }
};

// Aktif grupları getir
const getActiveGroups = async (req, res) => {
    try {
        const groups = await Group.getActiveGroups();
        
        res.json({
            success: true,
            groups
        });
    } catch (error) {
        console.error('Aktif grupları getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Aktif gruplar getirilirken bir hata oluştu',
            error: error.message
        });
    }
};

module.exports = {
    getAllGroups,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup,
    toggleGroupStatus,
    getActiveGroups
};
