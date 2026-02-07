const Organization = require('../models/Organization');
const CompanyManagement = require('../models/companyManagement');
const Admin = require('../models/Admin');
const { safeLog, getSafeErrorMessage } = require('../utils/helpers');
const { getCompanyFilter, addCompanyIdToData } = require('../middleware/auth');

const DEFAULT_TITLE_OPTIONS = [
    'Direktör',
    'Müdür/Yönetici',
    'Kıdemli Uzman',
    'Uzman',
    'Uzman Yardımcısı',
    'MT/Stajyer'
];

const normalizeTitleOptions = (list) =>
    list
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item !== '');

const validateTitleOptions = (list) => {
    if (!Array.isArray(list)) {
        return { valid: false, message: 'Unvan listesi geçersiz.' };
    }

    const normalized = normalizeTitleOptions(list);
    if (normalized.length === 0) {
        return { valid: false, message: 'Unvan listesi boş olamaz.' };
    }

    if (normalized.length < 3 || normalized.length > 6) {
        return { valid: false, message: 'Unvan sayısı 3 ile 6 arasında olmalıdır.' };
    }

    const seen = new Set();
    for (const item of normalized) {
        const key = item.toLowerCase();
        if (seen.has(key)) {
            return { valid: false, message: 'Unvan listesinde tekrar eden değerler var.' };
        }
        seen.add(key);
    }

    return { valid: true, normalized };
};

const resolveCompanyIdForTitles = (req, companyIdOverride) => {
    if (req.admin && req.admin.role === 'superadmin') {
        return companyIdOverride || null;
    }
    return req.admin?.companyId || null;
};

const getCompanyTitleOptions = async (req, companyIdOverride) => {
    const companyId = resolveCompanyIdForTitles(req, companyIdOverride);

    if (req.admin?.role === 'superadmin' && !companyId) {
        const admin = await Admin.findById(req.admin._id);
        const list = Array.isArray(admin?.titleOptions) && admin.titleOptions.length > 0
            ? admin.titleOptions
            : DEFAULT_TITLE_OPTIONS;
        return { titleOptions: list, companyId: null, company: null };
    }

    if (!companyId) {
        return { titleOptions: DEFAULT_TITLE_OPTIONS, companyId: null, company: null };
    }

    const company = await CompanyManagement.findById(companyId);
    if (!company) {
        return { titleOptions: DEFAULT_TITLE_OPTIONS, companyId, company: null };
    }

    const list = Array.isArray(company.titleOptions) && company.titleOptions.length > 0
        ? company.titleOptions
        : DEFAULT_TITLE_OPTIONS;

    return { titleOptions: list, companyId, company };
};

// Tüm organizasyonları getir
const getAllOrganizations = async (req, res) => {
    try {
        // Multi-tenant: Super admin için tüm veriler, normal admin için sadece kendi company'si
        const filter = getCompanyFilter(req);
        const organizations = await Organization.find(filter).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            organizations: organizations
        });
    } catch (error) {
        safeLog('error', 'Organizasyon listesi getirme hatası', error);
        res.status(500).json({
            success: false,
            message: 'Organizasyon listesi alınamadı'
        });
    }
};

const getTitleOptions = async (req, res) => {
    try {
        const companyIdOverride = req.admin?.role === 'superadmin' ? req.query.companyId : null;

        if (req.admin?.role === 'superadmin' && !companyIdOverride) {
            const admin = await Admin.findById(req.admin._id);
            const list = Array.isArray(admin?.titleOptions) && admin.titleOptions.length > 0
                ? admin.titleOptions
                : DEFAULT_TITLE_OPTIONS;
            return res.json({
                success: true,
                titleOptions: list,
                requiresCompanyId: true
            });
        }

        const companyId = resolveCompanyIdForTitles(req, companyIdOverride);
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID bulunamadı. Lütfen sistem yöneticinizle iletişime geçin.'
            });
        }

        const company = await CompanyManagement.findById(companyId);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Firma bulunamadı.'
            });
        }

        const titleOptions = Array.isArray(company.titleOptions) && company.titleOptions.length > 0
            ? company.titleOptions
            : DEFAULT_TITLE_OPTIONS;

        res.json({ success: true, titleOptions });
    } catch (error) {
        safeLog('error', 'Unvan listesi getirme hatası', error);
        res.status(500).json({
            success: false,
            message: 'Unvan listesi alınamadı'
        });
    }
};

const updateTitleOptions = async (req, res) => {
    try {
        const { titleOptions, companyId } = req.body || {};
        const companyIdOverride = req.admin?.role === 'superadmin' ? companyId : null;

        const validation = validateTitleOptions(titleOptions);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        if (req.admin?.role === 'superadmin' && !companyIdOverride) {
            const updatedAdmin = await Admin.findByIdAndUpdate(
                req.admin._id,
                { titleOptions: validation.normalized },
                { new: true }
            );

            if (!updatedAdmin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin bulunamadı.'
                });
            }

            const adminController = require('./adminController');
            if (typeof adminController.clearDashboardStatsCache === 'function') {
                adminController.clearDashboardStatsCache();
            }

            return res.json({
                success: true,
                message: 'Unvan listesi güncellendi',
                titleOptions: updatedAdmin.titleOptions
            });
        }

        const resolvedCompanyId = resolveCompanyIdForTitles(req, companyIdOverride);
        if (!resolvedCompanyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID bulunamadı. Lütfen sistem yöneticinizle iletişime geçin.'
            });
        }

        const updatedCompany = await CompanyManagement.findByIdAndUpdate(
            resolvedCompanyId,
            { titleOptions: validation.normalized },
            { new: true }
        );

        if (!updatedCompany) {
            return res.status(404).json({
                success: false,
                message: 'Firma bulunamadı.'
            });
        }

        const adminController = require('./adminController');
        if (typeof adminController.clearDashboardStatsCache === 'function') {
            adminController.clearDashboardStatsCache();
        }

        res.json({
            success: true,
            message: 'Unvan listesi güncellendi',
            titleOptions: updatedCompany.titleOptions
        });
    } catch (error) {
        safeLog('error', 'Unvan listesi güncelleme hatası', error);
        res.status(500).json({
            success: false,
            message: 'Unvan listesi güncellenemedi'
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
            unvan,
            pozisyon
        } = req.body;

        // Gerekli alanları kontrol et - Pozisyon, Unvan ve Departman zorunlu
        if (!pozisyon || pozisyon.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Pozisyon alanı boş olamaz'
            });
        }
        
        if (!unvan || unvan.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Unvan alanı boş olamaz'
            });
        }

        if (!grupLiderligi || grupLiderligi.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Departman alanı boş olamaz'
            });
        }

        const normalizedUnvan = unvan.trim();
        const { titleOptions } = await getCompanyTitleOptions(req, req.body?.companyId);
        if (!titleOptions.includes(normalizedUnvan)) {
            return res.status(400).json({
                success: false,
                message: `Unvan alanı geçersiz. Değer şu seçeneklerden biri olmalıdır: ${titleOptions.join(', ')}.`
            });
        }

        // Diğer alanları temizle - boş olanları "-" yap, "-" olanları olduğu gibi bırak
        const cleanedData = {
            genelMudurYardimciligi: genelMudurYardimciligi && genelMudurYardimciligi.trim() !== '' ? genelMudurYardimciligi.trim() : '-',
            direktörlük: direktörlük && direktörlük.trim() !== '' ? direktörlük.trim() : '-',
            müdürlük: müdürlük && müdürlük.trim() !== '' ? müdürlük.trim() : '-',
            grupLiderligi: grupLiderligi.trim(),
            unvan: normalizedUnvan,
            pozisyon: pozisyon.trim()
        };

        // Birebir aynı organizasyon var mı kontrol et (tüm alanlar aynıysa)
        // Multi-tenant: companyId filtresi ekle
        const companyFilter = getCompanyFilter(req);
        const existingOrganization = await Organization.findOne({
            ...companyFilter,
            genelMudurYardimciligi: cleanedData.genelMudurYardimciligi,
            direktörlük: cleanedData.direktörlük,
            müdürlük: cleanedData.müdürlük,
            grupLiderligi: cleanedData.grupLiderligi,
            unvan: cleanedData.unvan,
            pozisyon: cleanedData.pozisyon
        });

        if (existingOrganization) {
            return res.status(400).json({
                success: false,
                message: 'Bu organizasyon yapısı zaten mevcut! Aynı bilgilerle tekrar ekleyemezsiniz.'
            });
        }

        // Yeni organizasyon oluştur - companyId otomatik eklenir
        const dataWithCompanyId = addCompanyIdToData(req, cleanedData);
        const newOrganization = new Organization(dataWithCompanyId);

        const savedOrganization = await newOrganization.save();

        res.status(201).json({
            success: true,
            message: 'Organizasyon başarıyla eklendi',
            organization: savedOrganization
        });

    } catch (error) {
        safeLog('error', 'Organizasyon ekleme hatası', error);
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
            unvan,
            pozisyon
        } = req.body;

        // Gerekli alanları kontrol et - Pozisyon, Unvan ve Departman zorunlu
        if (!pozisyon || pozisyon.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Pozisyon alanı boş olamaz'
            });
        }
        
        if (!unvan || unvan.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Unvan alanı boş olamaz'
            });
        }

        if (!grupLiderligi || grupLiderligi.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Departman alanı boş olamaz'
            });
        }

        const normalizedUnvan = unvan.trim();
        const { titleOptions } = await getCompanyTitleOptions(req, req.body?.companyId);
        if (!titleOptions.includes(normalizedUnvan)) {
            return res.status(400).json({
                success: false,
                message: `Unvan alanı geçersiz. Değer şu seçeneklerden biri olmalıdır: ${titleOptions.join(', ')}.`
            });
        }

        // Diğer alanları temizle - boş olanları "-" yap, "-" olanları olduğu gibi bırak
        const cleanedData = {
            genelMudurYardimciligi: genelMudurYardimciligi && genelMudurYardimciligi.trim() !== '' ? genelMudurYardimciligi.trim() : '-',
            direktörlük: direktörlük && direktörlük.trim() !== '' ? direktörlük.trim() : '-',
            müdürlük: müdürlük && müdürlük.trim() !== '' ? müdürlük.trim() : '-',
            grupLiderligi: grupLiderligi.trim(),
            unvan: normalizedUnvan,
            pozisyon: pozisyon.trim()
        };

        // Birebir aynı organizasyon var mı kontrol et (tüm alanlar aynıysa, kendisi hariç)
        // Multi-tenant: companyId filtresi ekle
        const companyFilter = getCompanyFilter(req);
        const existingOrganization = await Organization.findOne({
            ...companyFilter,
            genelMudurYardimciligi: cleanedData.genelMudurYardimciligi,
            direktörlük: cleanedData.direktörlük,
            müdürlük: cleanedData.müdürlük,
            grupLiderligi: cleanedData.grupLiderligi,
            unvan: cleanedData.unvan,
            pozisyon: cleanedData.pozisyon,
            _id: { $ne: id }
        });

        if (existingOrganization) {
            return res.status(400).json({
                success: false,
                message: 'Bu organizasyon yapısı zaten mevcut! Aynı bilgilerle tekrar ekleyemezsiniz.'
            });
        }

        // Organizasyonu güncelle - companyId kontrolü yap (companyFilter zaten tanımlı)
        const existingOrg = await Organization.findOne({ _id: id, ...companyFilter });
        if (!existingOrg) {
            return res.status(404).json({
                success: false,
                message: 'Organizasyon bulunamadı veya yetkiniz yok'
            });
        }
        
        // companyFilter zaten tanımlı (satır 140)
        const updatedOrganization = await Organization.findOneAndUpdate(
            { _id: id, ...companyFilter },
            cleanedData,
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
        safeLog('error', 'Organizasyon güncelleme hatası', error);
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
        
        // Multi-tenant: companyId kontrolü yap
        const companyFilter = getCompanyFilter(req);
        const deletedOrganization = await Organization.findOneAndDelete({ _id: id, ...companyFilter });

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
        safeLog('error', 'Organizasyon silme hatası', error);
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
        
        // Multi-tenant: companyId kontrolü yap
        const companyFilter = getCompanyFilter(req);
        const organization = await Organization.findOne({ _id: id, ...companyFilter });

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
        safeLog('error', 'Organizasyon getirme hatası', error);
        res.status(500).json({
            success: false,
            message: 'Organizasyon alınırken bir hata oluştu'
        });
    }
};

// Bulk organizasyon ekleme (Excel import için)
const bulkCreateOrganizations = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Excel dosyası seçilmedi. Lütfen .xlsx veya .xls formatında bir dosya seçin.'
            });
        }

        // Memory'den Excel dosyasını oku
        const XLSX = require('xlsx');
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // İlk satırı header olarak ignore et, sadece veri satırlarını al
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        const data = [];
        
        // 1. satır header (0), 2. satırdan itibaren veri (1'den başla)
        for (let rowNum = 1; rowNum <= range.e.r; rowNum++) {
            const row = [];
            for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
                const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: colNum });
                const cell = worksheet[cellAddress];
                row.push(cell ? cell.v : '');
            }
            data.push(row);
        }

        if (data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Excel dosyası boş veya okunamıyor. Lütfen geçerli bir Excel dosyası (.xlsx, .xls) seçin.'
            });
        }

        const { titleOptions } = await getCompanyTitleOptions(req, req.query?.companyId);
        const allowedTitles = new Set(titleOptions);

        const organizations = [];
        const errors = [];

        // Sütun sırası: Genel Müdür Yardımcılığı, Direktörlük, Müdürlük, Departman/Şeflik, Unvan, Pozisyon
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // Excel'de satır numarası (header + 1)

            try {
                // Boş satır kontrolü - tüm hücreler boşsa bu satırı ignore et
                const isRowEmpty = row.every(cell => !cell || cell.toString().trim() === '');
                if (isRowEmpty) {
                    continue; // Bu satırı atla, hata verme
                }

                if (row.length < 6) {
                    errors.push({
                        row: rowNumber,
                        message: 'Satırda yeterli sütun bulunmuyor. 6 sütun gerekli: Genel Müdür Yardımcılığı, Direktörlük, Müdürlük, Departman/Şeflik, Unvan, Pozisyon'
                    });
                    continue;
                }

                const [genelMudurYardimciligi, direktörlük, müdürlük, grupLiderligi, unvan, pozisyon] = row;


                // Zorunlu alan kontrolü: Pozisyon, Unvan ve Departman zorunlu
                const isEmpty = (value) => !value || value.toString().trim() === '';
                
                if (isEmpty(pozisyon)) {
                    errors.push({
                        row: rowNumber,
                        message: 'Pozisyon alanı boş olamaz. Bu alan zorunludur.'
                    });
                    continue;
                }
                
                if (isEmpty(unvan)) {
                    errors.push({
                        row: rowNumber,
                        message: 'Unvan alanı boş olamaz. Bu alan zorunludur.'
                    });
                    continue;
                }

                const normalizedUnvan = unvan.toString().trim();
                if (!allowedTitles.has(normalizedUnvan)) {
                    errors.push({
                        row: rowNumber,
                        message: `Unvan alanı geçersiz. Değer şu seçeneklerden biri olmalıdır: ${titleOptions.join(', ')}.`
                    });
                    continue;
                }

                if (isEmpty(grupLiderligi)) {
                    errors.push({
                        row: rowNumber,
                        message: 'Departman alanı boş olamaz. Bu alan zorunludur.'
                    });
                    continue;
                }

                // Diğer alanları temizle - boş olanları "-" yap, "-" olanları olduğu gibi bırak
                const cleanedOrgData = {
                    genelMudurYardimciligi: genelMudurYardimciligi && genelMudurYardimciligi.toString().trim() !== '' ? genelMudurYardimciligi.toString().trim() : '-',
                    direktörlük: direktörlük && direktörlük.toString().trim() !== '' ? direktörlük.toString().trim() : '-',
                    müdürlük: müdürlük && müdürlük.toString().trim() !== '' ? müdürlük.toString().trim() : '-',
                    grupLiderligi: grupLiderligi.toString().trim(),
                    unvan: normalizedUnvan,
                    pozisyon: pozisyon.toString().trim()
                };

                organizations.push(cleanedOrgData);

            } catch (error) {
                errors.push({
                    row: rowNumber,
                    message: error.message || 'Bilinmeyen hata'
                });
            }
        }


        const results = {
            success: [],
            errors: errors // Excel parsing hatalarını ekle
        };

        for (let i = 0; i < organizations.length; i++) {
            const org = organizations[i];
            const rowNumber = i + 2; // Excel'de satır numarası
            
            try {
                // Birebir aynı organizasyon var mı kontrol et - companyId filtresi ekle
                const companyFilter = getCompanyFilter(req);
                const existingOrganization = await Organization.findOne({
                    ...companyFilter,
                    genelMudurYardimciligi: org.genelMudurYardimciligi,
                    direktörlük: org.direktörlük,
                    müdürlük: org.müdürlük,
                    grupLiderligi: org.grupLiderligi,
                    unvan: org.unvan,
                    pozisyon: org.pozisyon
                });

                if (existingOrganization) {
                    results.errors.push({
                        row: rowNumber,
                        message: 'Bu organizasyon yapısı zaten mevcut! Aynı bilgilerle tekrar ekleyemezsiniz.'
                    });
                    continue;
                }

                // Yeni organizasyon oluştur - companyId otomatik eklenir
                const dataWithCompanyId = addCompanyIdToData(req, org);
                
                // Normal admin için companyId kontrolü
                if (req.admin && req.admin.role !== 'superadmin' && !dataWithCompanyId.companyId) {
                    results.errors.push({
                        row: rowNumber,
                        message: 'Company ID bulunamadı. Lütfen sistem yöneticinizle iletişime geçin.'
                    });
                    continue;
                }
                
                const newOrganization = new Organization(dataWithCompanyId);
                await newOrganization.save();
                results.success.push({
                    row: rowNumber,
                    organization: newOrganization
                });

            } catch (error) {
                // MongoDB validation hatalarını daha iyi göster
                let errorMessage = error.message || 'Bilinmeyen hata';
                if (error.name === 'ValidationError') {
                    const validationErrors = Object.values(error.errors || {}).map((err) => err.message);
                    if (validationErrors.length > 0) {
                        errorMessage = validationErrors.join(', ');
                    }
                }
                results.errors.push({
                    row: rowNumber,
                    message: errorMessage
                });
            }
        }

        // Sonuçları döndür
        if (results.success.length === 0 && results.errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Hiçbir organizasyon eklenemedi',
                errors: results.errors
            });
        }

        // Eğer hem başarılı hem de hatalı kayıtlar varsa, kısmi başarı döndür
        if (results.success.length > 0 && results.errors.length > 0) {
            return res.status(200).json({
                success: true,
                message: `${results.success.length} organizasyon başarıyla eklendi, ${results.errors.length} satırda hata oluştu`,
                count: results.success.length,
                errors: results.errors
            });
        }

        // Sadece hata varsa ve hiç başarılı kayıt yoksa
        if (results.errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Excel dosyasında hatalar bulundu. Lütfen hataları düzeltip tekrar deneyin.',
                errors: results.errors
            });
        }

        // Tüm kayıtlar başarılı
        res.json({
            success: true,
            message: `${results.success.length} organizasyon başarıyla eklendi`,
            count: results.success.length
        });

    } catch (error) {
        safeLog('error', 'Bulk organizasyon ekleme hatası', error);
        res.status(500).json({
            success: false,
            message: 'Organizasyonlar eklenirken bir hata oluştu'
        });
    }
};

module.exports = {
    getAllOrganizations,
    getTitleOptions,
    updateTitleOptions,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getOrganizationById,
    bulkCreateOrganizations
};
