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

        // Pozisyon duplicate kontrolü (sadece pozisyon için)
        const existingPosition = await Organization.findOne({
            pozisyon: pozisyon.trim()
        });

        if (existingPosition) {
            return res.status(400).json({
                success: false,
                message: 'Bu pozisyon zaten mevcut! Farklı bir pozisyon girin.'
            });
        }

        // Aynı organizasyon var mı kontrol et (tüm alanlar aynıysa)
        const existingOrganization = await Organization.findOne({
            genelMudurYardimciligi: genelMudurYardimciligi.trim(),
            direktörlük: direktörlük.trim(),
            müdürlük: müdürlük.trim(),
            grupLiderligi: grupLiderligi.trim(),
            pozisyon: pozisyon.trim()
        });

        if (existingOrganization) {
            return res.status(400).json({
                success: false,
                message: 'Bu organizasyon zaten mevcut!'
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

        // Pozisyon duplicate kontrolü (sadece pozisyon için, kendisi hariç)
        const existingPosition = await Organization.findOne({
            pozisyon: pozisyon.trim(),
            _id: { $ne: id }
        });

        if (existingPosition) {
            return res.status(400).json({
                success: false,
                message: 'Bu pozisyon zaten mevcut! Farklı bir pozisyon girin.'
            });
        }

        // Aynı organizasyon var mı kontrol et (tüm alanlar aynıysa, kendisi hariç)
        const existingOrganization = await Organization.findOne({
            genelMudurYardimciligi: genelMudurYardimciligi.trim(),
            direktörlük: direktörlük.trim(),
            müdürlük: müdürlük.trim(),
            grupLiderligi: grupLiderligi.trim(),
            pozisyon: pozisyon.trim(),
            _id: { $ne: id }
        });

        if (existingOrganization) {
            return res.status(400).json({
                success: false,
                message: 'Bu organizasyon zaten mevcut!'
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

        const organizations = [];
        const errors = [];

        // Sütun sırası: Genel Müdür Yardımcılığı, Direktörlük, Müdürlük, Grup Liderliği, Pozisyon
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // Excel'de satır numarası (header + 1)

            try {
                if (row.length < 5) {
                    errors.push({
                        row: rowNumber,
                        message: 'Satırda yeterli sütun bulunmuyor. 5 sütun gerekli: Genel Müdür Yardımcılığı, Direktörlük, Müdürlük, Grup Liderliği, Pozisyon'
                    });
                    continue;
                }

                const [genelMudurYardimciligi, direktörlük, müdürlük, grupLiderligi, pozisyon] = row;

                // Boş alan kontrolü: null, undefined, boş string veya sadece '-' karakteri
                const isEmpty = (value) => !value || value.toString().trim() === '' || value.toString().trim() === '-';
                
                if (isEmpty(genelMudurYardimciligi) || isEmpty(direktörlük) || isEmpty(müdürlük) || isEmpty(grupLiderligi) || isEmpty(pozisyon)) {
                    const missingFields = [];
                    if (isEmpty(genelMudurYardimciligi)) missingFields.push('Genel Müdür Yardımcılığı');
                    if (isEmpty(direktörlük)) missingFields.push('Direktörlük');
                    if (isEmpty(müdürlük)) missingFields.push('Müdürlük');
                    if (isEmpty(grupLiderligi)) missingFields.push('Grup Liderliği');
                    if (isEmpty(pozisyon)) missingFields.push('Pozisyon');
                    
                    errors.push({
                        row: rowNumber,
                        message: `Eksik/geçersiz alanlar: ${missingFields.join(', ')}. Tüm alanlar dolu olmalıdır (boş veya '-' karakteri kabul edilmez).`
                    });
                    continue;
                }

                organizations.push({
                    genelMudurYardimciligi: genelMudurYardimciligi.toString().trim(),
                    direktörlük: direktörlük.toString().trim(),
                    müdürlük: müdürlük.toString().trim(),
                    grupLiderligi: grupLiderligi.toString().trim(),
                    pozisyon: pozisyon.toString().trim()
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

        for (let i = 0; i < organizations.length; i++) {
            const org = organizations[i];
            const rowNumber = i + 2; // Excel'de satır numarası
            
            try {
                // Pozisyon duplicate kontrolü
                const existingPosition = await Organization.findOne({
                    pozisyon: org.pozisyon
                });

                if (existingPosition) {
                    results.errors.push({
                        row: rowNumber,
                        message: 'Bu pozisyon zaten mevcut! Farklı bir pozisyon girin.'
                    });
                    continue;
                }

                // Aynı organizasyon var mı kontrol et
                const existingOrganization = await Organization.findOne({
                    genelMudurYardimciligi: org.genelMudurYardimciligi,
                    direktörlük: org.direktörlük,
                    müdürlük: org.müdürlük,
                    grupLiderligi: org.grupLiderligi,
                    pozisyon: org.pozisyon
                });

                if (existingOrganization) {
                    results.errors.push({
                        row: rowNumber,
                        message: 'Bu organizasyon zaten mevcut!'
                    });
                    continue;
                }

                // Yeni organizasyon oluştur
                const newOrganization = new Organization(org);
                await newOrganization.save();
                results.success.push({
                    row: rowNumber,
                    organization: newOrganization
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
                message: 'Hiçbir organizasyon eklenemedi',
                errors: results.errors
            });
        }

        res.json({
            success: true,
            message: `${results.success.length} organizasyon başarıyla eklendi`,
            count: results.success.length,
            errors: results.errors.length > 0 ? results.errors : undefined
        });

    } catch (error) {
        console.error('Bulk organizasyon ekleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Organizasyonlar eklenirken bir hata oluştu'
        });
    }
};

module.exports = {
    getAllOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getOrganizationById,
    bulkCreateOrganizations
};
