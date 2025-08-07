const CompanyManagement = require('../models/companyManagement');

exports.createCompany = async (req, res) => {
    try {
        const { vkn, firmName, firmMail } = req.body;
        if (!vkn || !firmName || !firmMail) {
            return res.status(400).json({ success: false, message: 'Tüm alanlar zorunludur.' });
        }
        // Email formatı kontrolü
        if (!/^\S+@\S+\.\S+$/.test(firmMail)) {
            return res.status(400).json({ success: false, message: 'Geçerli bir email adresi giriniz.' });
        }
        
        // VKN'nin daha önce kaydedilip kaydedilmediğini kontrol et
        const existingCompany = await CompanyManagement.findOne({ vkn: vkn });
        if (existingCompany) {
            return res.status(400).json({ success: false, message: 'Bu VKN ile kayıtlı bir firma zaten mevcut!' });
        }
        
        const newCompany = new CompanyManagement({ vkn, firmName, firmMail });
        await newCompany.save();
        res.status(201).json({ success: true, message: 'Firma başarıyla kaydedildi.' });
    } catch (err) {
        // MongoDB unique constraint hatası kontrolü
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Bu VKN ile kayıtlı bir firma zaten mevcut!' });
        }
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: err.message });
    }
};

// Tüm şirketleri getir
exports.getAllCompanies = async (req, res) => {
    try {
        const companies = await CompanyManagement.find({}, 'vkn firmName firmMail');
        res.json({ success: true, companies });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: err.message });
    }
};

// Şirketi sil
exports.deleteCompany = async (req, res) => {
    try {
        const { vkn } = req.params;
        const deletedCompany = await CompanyManagement.findOneAndDelete({ vkn: vkn });
        
        if (!deletedCompany) {
            return res.status(404).json({ success: false, message: 'Firma bulunamadı.' });
        }
        
        res.json({ success: true, message: 'Firma başarıyla silindi.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: err.message });
    }
};

// Şirketi güncelle
exports.updateCompany = async (req, res) => {
    try {
        const { vkn } = req.params;
        const { firmName, firmMail } = req.body;
        
        if (!firmName || !firmMail) {
            return res.status(400).json({ success: false, message: 'Tüm alanlar zorunludur.' });
        }
        
        // Email formatı kontrolü
        if (!/^\S+@\S+\.\S+$/.test(firmMail)) {
            return res.status(400).json({ success: false, message: 'Geçerli bir email adresi giriniz.' });
        }
        
        const updatedCompany = await CompanyManagement.findOneAndUpdate(
            { vkn: vkn },
            { firmName, firmMail },
            { new: true }
        );
        
        if (!updatedCompany) {
            return res.status(404).json({ success: false, message: 'Firma bulunamadı.' });
        }
        
        res.json({ success: true, message: 'Firma başarıyla güncellendi.', company: updatedCompany });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: err.message });
    }
}; 