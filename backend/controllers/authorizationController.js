const Authorization = require('../models/Authorization');
const { safeLog, getSafeErrorMessage } = require('../utils/helpers');

// Tüm kişileri getir
const getAllAuthorizations = async (req, res) => {
    try {
        const { page = 1, limit, search = '', status = '' } = req.query;
        
        // Arama ve filtreleme kriterleri
        let filter = {};
        
        if (search) {
            filter.$or = [
                { sicilNo: { $regex: search, $options: 'i' } },
                { personName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } }
            ];
        }
        
        let query = Authorization.find(filter)
            .populate('createdBy', 'username email')
            .sort({ createdAt: -1 });

        // Limit belirtilmişse sayfalama uygula
        if (limit) {
            const skip = (parseInt(page) - 1) * parseInt(limit);
            query = query.skip(skip).limit(parseInt(limit));
        }

        // Kişileri getir
        const authorizations = await query;

        // Toplam sayıyı al
        const total = await Authorization.countDocuments(filter);

        // Limit belirtilmişse pagination bilgilerini ekle
        const response = {
            success: true,
            authorizations
        };

        if (limit) {
            response.pagination = {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            };
        }

        res.json(response);
    } catch (error) {
        safeLog('error', 'Kişileri getirme hatası', error);
        res.status(500).json({
            success: false,
            message: 'Kişiler getirilirken bir hata oluştu',
            error: error.message
        });
    }
};

// Tek kişi getir
const getAuthorizationById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const authorization = await Authorization.findById(id).populate('createdBy', 'username email');
        
        if (!authorization) {
            return res.status(404).json({
                success: false,
                message: 'Kişi bulunamadı'
            });
        }

        res.json({
            success: true,
            authorization
        });
    } catch (error) {
        safeLog('error', 'Kişi getirme hatası', error);
        res.status(500).json({
            success: false,
            message: 'Kişi getirilirken bir hata oluştu',
            error: error.message
        });
    }
};

// Yeni kişi oluştur
const createAuthorization = async (req, res) => {
    try {
        const { sicilNo, personName, email, title } = req.body;
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

        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Email gereklidir'
            });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Pozisyon gereklidir'
            });
        }

        // Aynı sicil numarasında kişi var mı kontrol et
        const existingAuthorization = await Authorization.findOne({ 
            sicilNo: sicilNo.trim()
        });

        if (existingAuthorization) {
            return res.status(400).json({
                success: false,
                message: 'Bu sicil numarasında zaten bir kişi mevcut'
            });
        }

        // Aynı email adresinde kişi var mı kontrol et
        const existingEmail = await Authorization.findOne({ 
            email: email.trim().toLowerCase()
        });

        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Bu email adresinde zaten bir kişi mevcut'
            });
        }

        // Yeni kişi oluştur
        const newAuthorization = new Authorization({
            sicilNo: sicilNo.trim(),
            personName: personName.trim(),
            email: email.trim().toLowerCase(),
            title: title.trim(),
            createdBy: createdBy
        });

        await newAuthorization.save();

        // Populate ile createdBy bilgisini ekle
        await newAuthorization.populate('createdBy', 'username email');

        res.status(201).json({
            success: true,
            message: 'Kişi başarıyla oluşturuldu',
            authorization: newAuthorization
        });
    } catch (error) {
        safeLog('error', 'Kişi oluşturma hatası', error);
        res.status(500).json({
            success: false,
            message: 'Kişi oluşturulurken bir hata oluştu',
            error: error.message
        });
    }
};

// Kişi güncelle
const updateAuthorization = async (req, res) => {
    try {
        const { id } = req.params;
        const { sicilNo, personName, email, title } = req.body;

        // Kişi var mı kontrol et
        const authorization = await Authorization.findById(id);
        if (!authorization) {
            return res.status(404).json({
                success: false,
                message: 'Kişi bulunamadı'
            });
        }

        // Güncelleme verilerini hazırla
        const updateData = {};
        
        if (sicilNo && sicilNo.trim()) {
            // Aynı sicil numarasında başka kişi var mı kontrol et
            const existingAuthorization = await Authorization.findOne({ 
                sicilNo: sicilNo.trim(),
                _id: { $ne: id }
            });

            if (existingAuthorization) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu sicil numarasında başka bir kişi zaten mevcut'
                });
            }
            
            updateData.sicilNo = sicilNo.trim();
        }

        if (personName && personName.trim()) {
            updateData.personName = personName.trim();
        }

        if (email && email.trim()) {
            // Aynı email adresinde başka kişi var mı kontrol et
            const existingEmail = await Authorization.findOne({ 
                email: email.trim().toLowerCase(),
                _id: { $ne: id }
            });

            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu email adresinde başka bir kişi zaten mevcut'
                });
            }
            
            updateData.email = email.trim().toLowerCase();
        }

        if (title && title.trim()) {
            updateData.title = title.trim();
        }

        // Kişiyi güncelle
        const updatedAuthorization = await Authorization.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('createdBy', 'username email');

        res.json({
            success: true,
            message: 'Kişi başarıyla güncellendi',
            authorization: updatedAuthorization
        });
    } catch (error) {
        safeLog('error', 'Kişi güncelleme hatası', error);
        res.status(500).json({
            success: false,
            message: 'Kişi güncellenirken bir hata oluştu',
            error: error.message
        });
    }
};

// Kişi sil
const deleteAuthorization = async (req, res) => {
    try {
        const { id } = req.params;

        // Kişi var mı kontrol et
        const authorization = await Authorization.findById(id);
        if (!authorization) {
            return res.status(404).json({
                success: false,
                message: 'Kişi bulunamadı'
            });
        }

        // Kişiyi sil
        await Authorization.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Kişi başarıyla silindi'
        });
    } catch (error) {
        safeLog('error', 'Kişi silme hatası', error);
        res.status(500).json({
            success: false,
            message: 'Kişi silinirken bir hata oluştu',
            error: error.message
        });
    }
};



// Bulk yetkilendirme ekleme (Excel import için)
const bulkCreateAuthorizations = async (req, res) => {
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

        const authorizations = [];
        const errors = [];

        // Sütun sırası: Sicil No, Ad Soyad, Email, Pozisyon
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // Excel'de satır numarası (header + 1)

            try {
                // Boş satır kontrolü - tüm hücreler boşsa bu satırı ignore et
                const isRowEmpty = row.every(cell => !cell || cell.toString().trim() === '');
                if (isRowEmpty) {
                    continue; // Bu satırı atla, hata verme
                }

                if (row.length < 4) {
                    errors.push({
                        row: rowNumber,
                        message: 'Satırda yeterli sütun bulunmuyor. 4 sütun gerekli: Sicil No, Ad Soyad, Email, Pozisyon'
                    });
                    continue;
                }

                const [sicilNo, personName, email, title] = row;

                // Boş alan kontrolü: null, undefined, boş string veya sadece '-' karakteri
                const isEmpty = (value) => !value || value.toString().trim() === '' || value.toString().trim() === '-';
                
                if (isEmpty(sicilNo) || isEmpty(personName) || isEmpty(email) || isEmpty(title)) {
                    const missingFields = [];
                    if (isEmpty(sicilNo)) missingFields.push('Sicil No');
                    if (isEmpty(personName)) missingFields.push('Ad Soyad');
                    if (isEmpty(email)) missingFields.push('Email');
                    if (isEmpty(title)) missingFields.push('Pozisyon');
                    
                    errors.push({
                        row: rowNumber,
                        message: `Eksik/geçersiz alanlar: ${missingFields.join(', ')}. Tüm alanlar dolu olmalıdır (boş veya '-' karakteri kabul edilmez).`
                    });
                    continue;
                }

                authorizations.push({
                    sicilNo: sicilNo.toString().trim(),
                    personName: personName.toString().trim(),
                    email: email.toString().trim(),
                    title: title.toString().trim()
                });

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

        for (let i = 0; i < authorizations.length; i++) {
            const auth = authorizations[i];
            const rowNumber = i + 2; // Excel'de satır numarası
            
            try {
                // Sicil No duplicate kontrolü
                const existingSicilNo = await Authorization.findOne({
                    sicilNo: auth.sicilNo
                });

                if (existingSicilNo) {
                    results.errors.push({
                        row: rowNumber,
                        message: 'Bu sicil numarası zaten mevcut! Farklı bir sicil numarası girin.'
                    });
                    continue;
                }

                // Email duplicate kontrolü
                const existingEmail = await Authorization.findOne({
                    email: auth.email
                });

                if (existingEmail) {
                    results.errors.push({
                        row: rowNumber,
                        message: 'Bu email adresi zaten mevcut! Farklı bir email adresi girin.'
                    });
                    continue;
                }

                // Aynı yetkilendirme var mı kontrol et
                const existingAuthorization = await Authorization.findOne({
                    sicilNo: auth.sicilNo,
                    personName: auth.personName,
                    email: auth.email,
                    title: auth.title
                });

                if (existingAuthorization) {
                    results.errors.push({
                        row: rowNumber,
                        message: 'Bu yetkilendirme zaten mevcut!'
                    });
                    continue;
                }

                // Yeni yetkilendirme oluştur
                const newAuthorization = new Authorization(auth);
                await newAuthorization.save();
                results.success.push({
                    row: rowNumber,
                    authorization: newAuthorization
                });

            } catch (error) {
                results.errors.push({
                    row: rowNumber,
                    message: error.message || 'Bilinmeyen hata'
                });
            }
        }

        // Sonuçları döndür
        if (results.success.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Hiçbir yetkilendirme eklenemedi',
                errors: results.errors
            });
        }

        res.json({
            success: true,
            message: `${results.success.length} yetkilendirme başarıyla eklendi`,
            count: results.success.length,
            errors: results.errors.length > 0 ? results.errors : undefined
        });

    } catch (error) {
        safeLog('error', 'Bulk yetkilendirme ekleme hatası', error);
        res.status(500).json({
            success: false,
            message: 'Yetkilendirmeler eklenirken bir hata oluştu'
        });
    }
};

module.exports = {
    getAllAuthorizations,
    getAuthorizationById,
    createAuthorization,
    updateAuthorization,
    deleteAuthorization,
    bulkCreateAuthorizations
};
