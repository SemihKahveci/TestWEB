const Group = require('../models/Group');
const { safeLog, getSafeErrorMessage } = require('../utils/helpers');
const { getCompanyFilter, addCompanyIdToData } = require('../middleware/auth');

// Tüm grupları getir
const getAllGroups = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = '' } = req.query;
        
        // Arama ve filtreleme kriterleri
        // Multi-tenant: Super admin için tüm veriler, normal admin için sadece kendi company'si
        const companyFilter = getCompanyFilter(req);
        let filter = { ...companyFilter };
        
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
        safeLog('error', 'Grupları getirme hatası', error);
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
        
        // Multi-tenant: companyId kontrolü yap
        const companyFilter = getCompanyFilter(req);
        const group = await Group.findOne({ _id: id, ...companyFilter }).populate('createdBy', 'username email');
        
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Grup bulunamadı veya yetkiniz yok'
            });
        }

        res.json({
            success: true,
            group
        });
    } catch (error) {
        safeLog('error', 'Grup getirme hatası', error);
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
        const { name, status, organizations, persons, planets } = req.body;
        const createdBy = req.admin?.id; // Middleware'den gelen admin ID (optional)

        // Gerekli alanları kontrol et
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Grup adı gereklidir'
            });
        }

        // En az bir organizasyon VEYA en az bir kişi seçilmiş olmalı
        if ((!organizations || organizations.length === 0) && (!persons || persons.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'En az bir organizasyon veya kişi seçilmelidir'
            });
        }

        if (!planets || planets.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'En az bir gezegen seçilmelidir'
            });
        }

        // Aynı isimde grup var mı kontrol et
        const existingGroup = await Group.findOne({ 
            name: name.trim()
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
            organizations: organizations,
            persons: persons,
            planets: planets,
            isActive: status === 'Aktif' || status === undefined,
            createdBy: createdBy
        });

        await newGroup.save();

        // Populate ile createdBy bilgisini ekle (eğer varsa)
        if (createdBy) {
            await newGroup.populate('createdBy', 'username email');
        }

        res.status(201).json({
            success: true,
            message: 'Grup başarıyla oluşturuldu',
            group: newGroup
        });
    } catch (error) {
        safeLog('error', 'Grup oluşturma hatası', error);
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
        const { name, status, organizations, persons, planets } = req.body;
        const updatedBy = req.admin?.id;

        // Multi-tenant: companyId kontrolü yap
        const companyFilter = getCompanyFilter(req);
        // Grup var mı kontrol et
        const group = await Group.findOne({ _id: id, ...companyFilter });
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Grup bulunamadı veya yetkiniz yok'
            });
        }

        // Güncelleme verilerini hazırla
        const updateData = {};
        
        if (name && name.trim()) {
            // Aynı isimde başka grup var mı kontrol et (aynı company içinde)
            const existingGroup = await Group.findOne({ 
                name: name.trim(),
                _id: { $ne: id },
                ...companyFilter
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

        // Organizasyon ve kişi güncellemeleri için validation
        if (organizations !== undefined && persons !== undefined) {
            // En az bir organizasyon VEYA en az bir kişi seçilmiş olmalı
            if (organizations.length === 0 && persons.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'En az bir organizasyon veya kişi seçilmelidir'
                });
            }
        }

        if (organizations && organizations.length > 0) {
            updateData.organizations = organizations;
        }

        if (persons && persons.length > 0) {
            updateData.persons = persons;
        }

        if (planets && planets.length > 0) {
            updateData.planets = planets;
        }

        // Grubu güncelle - companyId kontrolü ile
        const updatedGroup = await Group.findOneAndUpdate(
            { _id: id, ...companyFilter },
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!updatedGroup) {
            return res.status(404).json({
                success: false,
                message: 'Grup bulunamadı veya yetkiniz yok'
            });
        }

        // Populate ile createdBy bilgisini ekle (eğer varsa)
        if (updatedGroup.createdBy) {
            await updatedGroup.populate('createdBy', 'username email');
        }

        res.json({
            success: true,
            message: 'Grup başarıyla güncellendi',
            group: updatedGroup
        });
    } catch (error) {
        safeLog('error', 'Grup güncelleme hatası', error);
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

        // Multi-tenant: companyId kontrolü yap
        const companyFilter = getCompanyFilter(req);
        // Grup var mı kontrol et
        const group = await Group.findOne({ _id: id, ...companyFilter });
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Grup bulunamadı veya yetkiniz yok'
            });
        }

        // Grubu sil
        await Group.findOneAndDelete({ _id: id, ...companyFilter });

        res.json({
            success: true,
            message: 'Grup başarıyla silindi'
        });
    } catch (error) {
        safeLog('error', 'Grup silme hatası', error);
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

        // Multi-tenant: companyId kontrolü yap
        const companyFilter = getCompanyFilter(req);
        const group = await Group.findOne({ _id: id, ...companyFilter });
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Grup bulunamadı veya yetkiniz yok'
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
        safeLog('error', 'Grup durumu değiştirme hatası', error);
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
        safeLog('error', 'Aktif grupları getirme hatası', error);
        res.status(500).json({
            success: false,
            message: 'Aktif gruplar getirilirken bir hata oluştu',
            error: error.message
        });
    }
};

// Organizasyon seçimine göre eşleşen kişileri getir
const getMatchingPersonsByOrganizations = async (req, res) => {
    try {
        const { organizations } = req.body;
        
        if (!organizations || !Array.isArray(organizations) || organizations.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Organizasyon listesi gereklidir'
            });
        }

        // Authorization modelini import et
        const Authorization = require('../models/Authorization');
        
        // Seçilen organizasyonlardan pozisyonları çıkar
        const positions = [];
        const organizationData = [];
        
        organizations.forEach(org => {
            if (org.includes(':')) {
                const [type, value] = org.split(':');
                if (type === 'pozisyon') {
                    positions.push(value);
                } else {
                    // Organizasyon verilerini topla
                    organizationData.push({ type, value });
                }
            }
        });

        // Organizasyon verilerinden eşleşen pozisyonları bul
        if (organizationData.length > 0) {
            const Organization = require('../models/Organization');
            
            // Her organizasyon türü için eşleşen kayıtları bul
            for (const orgItem of organizationData) {
                let query = {};
                
                // Organizasyon türüne göre sorgu oluştur
                switch (orgItem.type) {
                    case 'genelMudurYardimciligi':
                        query.genelMudurYardimciligi = orgItem.value;
                        break;
                    case 'direktörlük':
                        query.direktörlük = orgItem.value;
                        break;
                    case 'müdürlük':
                        query.müdürlük = orgItem.value;
                        break;
                    case 'grupLiderligi':
                        query.grupLiderligi = orgItem.value;
                        break;
                }
                
                // Bu kriterlere uyan organizasyonları bul
                const matchingOrgs = await Organization.find(query);
                
                // Bu organizasyonlardaki pozisyonları topla
                matchingOrgs.forEach(org => {
                    if (org.pozisyon && !positions.includes(org.pozisyon)) {
                        positions.push(org.pozisyon);
                    }
                });
            }
        }

        if (positions.length === 0) {
            return res.json({
                success: true,
                persons: [],
                message: 'Seçilen organizasyonlarda pozisyon bulunamadı veya organizasyon seçilmemiş'
            });
        }

        // Bu pozisyonlardaki kişileri bul
        const matchingPersons = await Authorization.find({
            title: { $in: positions }
        }).select('personName email title');

        // Kişileri formatla
        const formattedPersons = matchingPersons.map(person => ({
            value: `personName:${person.personName}`,
            label: person.personName,
            email: person.email,
            title: person.title
        }));

        res.json({
            success: true,
            persons: formattedPersons,
            positions: positions,
            organizationData: organizationData,
            message: `${formattedPersons.length} kişi bulundu (${positions.length} farklı pozisyondan)`
        });

    } catch (error) {
        safeLog('error', 'Eşleşen kişileri getirme hatası', error);
        res.status(500).json({
            success: false,
            message: 'Eşleşen kişiler getirilirken bir hata oluştu',
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
    getActiveGroups,
    getMatchingPersonsByOrganizations
};
