const Organization = require('../models/Organization');

// Tüm organizasyonları getir
const getAllOrganizations = async (req, res) => {
    try {
        const organizations = await Organization.find().sort({ createdAt: -1 });
        
        res.json({
            success: true,
            organizations: organizations
        });
    } catch (error) {
        console.error('Organizasyon listesi getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Organizasyon listesi alınamadı'
        });
    }
};

// Yeni organizasyon ekle
const createOrganization = async (req, res) => {
    try {
        const {
            genelMudurYardimciligi,
            direktörlük,
            müdürlük,
            grupLiderligi,
            pozisyon
        } = req.body;

        // Gerekli alanları kontrol et
        if (!genelMudurYardimciligi || !direktörlük || !müdürlük || 
            !grupLiderligi || !pozisyon) {
            return res.status(400).json({
                success: false,
                message: 'Tüm alanlar doldurulmalıdır'
            });
        }

        // Yeni organizasyon oluştur
        const newOrganization = new Organization({
            genelMudurYardimciligi,
            direktörlük,
            müdürlük,
            grupLiderligi,
            pozisyon
        });

        const savedOrganization = await newOrganization.save();

        res.status(201).json({
            success: true,
            message: 'Organizasyon başarıyla eklendi',
            organization: savedOrganization
        });

    } catch (error) {
        console.error('Organizasyon ekleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Organizasyon eklenirken bir hata oluştu'
        });
    }
};

// Organizasyon güncelle
const updateOrganization = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            genelMudurYardimciligi,
            direktörlük,
            müdürlük,
            grupLiderligi,
            pozisyon
        } = req.body;

        // Gerekli alanları kontrol et
        if (!genelMudurYardimciligi || !direktörlük || !müdürlük || 
            !grupLiderligi || !pozisyon) {
            return res.status(400).json({
                success: false,
                message: 'Tüm alanlar doldurulmalıdır'
            });
        }

        // Organizasyonu güncelle
        const updatedOrganization = await Organization.findByIdAndUpdate(
            id,
            {
                genelMudurYardimciligi,
                direktörlük,
                müdürlük,
                grupLiderligi,
                pozisyon
            },
            { new: true, runValidators: true }
        );

        if (!updatedOrganization) {
            return res.status(404).json({
                success: false,
                message: 'Organizasyon bulunamadı'
            });
        }

        res.json({
            success: true,
            message: 'Organizasyon başarıyla güncellendi',
            organization: updatedOrganization
        });

    } catch (error) {
        console.error('Organizasyon güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Organizasyon güncellenirken bir hata oluştu'
        });
    }
};

// Organizasyon sil
const deleteOrganization = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedOrganization = await Organization.findByIdAndDelete(id);

        if (!deletedOrganization) {
            return res.status(404).json({
                success: false,
                message: 'Organizasyon bulunamadı'
            });
        }

        res.json({
            success: true,
            message: 'Organizasyon başarıyla silindi'
        });

    } catch (error) {
        console.error('Organizasyon silme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Organizasyon silinirken bir hata oluştu'
        });
    }
};

// Tek organizasyon getir
const getOrganizationById = async (req, res) => {
    try {
        const { id } = req.params;

        const organization = await Organization.findById(id);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organizasyon bulunamadı'
            });
        }

        res.json({
            success: true,
            organization: organization
        });

    } catch (error) {
        console.error('Organizasyon getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Organizasyon alınırken bir hata oluştu'
        });
    }
};

module.exports = {
    getAllOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getOrganizationById
};
