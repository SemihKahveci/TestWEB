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
        const newCompany = new CompanyManagement({ vkn, firmName, firmMail });
        await newCompany.save();
        res.status(201).json({ success: true, message: 'Firma başarıyla kaydedildi.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: err.message });
    }
};

// Tüm şirketleri getir
exports.getAllCompanies = async (req, res) => {
    try {
        const companies = await CompanyManagement.find({}, 'firmName');
        res.json({ success: true, companies });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: err.message });
    }
}; 