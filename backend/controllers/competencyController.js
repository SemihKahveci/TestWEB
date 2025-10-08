const Competency = require('../models/Competency');
const multer = require('multer');
const XLSX = require('xlsx');

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

            // Değer aralığı kontrolü (1-100 arası)
            const rangeErrors = [];
            const competencyFields = [
                { name: 'Müşteri Odaklılık', min: customerFocusMin, max: customerFocusMax },
                { name: 'Belirsizlik Yönetimi', min: uncertaintyMin, max: uncertaintyMax },
                { name: 'İnsanları Etkileme', min: influenceMin, max: influenceMax },
                { name: 'Güven Veren İşbirlikçi ve Sinerji', min: collaborationMin, max: collaborationMax }
            ];

            competencyFields.forEach(field => {
                if (parseInt(field.min) < 1 || parseInt(field.min) > 100 || 
                    parseInt(field.max) < 1 || parseInt(field.max) > 100) {
                    rangeErrors.push(field.name);
                }
            });

            if (rangeErrors.length > 0) {
                const errorText = rangeErrors.length === 1 
                    ? `1 ile 100 arasında bir veri girmeniz gerekiyor! (${rangeErrors[0]})`
                    : `1 ile 100 arasında bir veri girmeniz gerekiyor! (${rangeErrors.join(', ')})`;
                
                return res.status(400).json({
                    success: false,
                    message: errorText
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

            // Değer aralığı kontrolü (1-100 arası)
            const rangeErrors = [];
            const competencyFields = [
                { name: 'Müşteri Odaklılık', min: customerFocusMin, max: customerFocusMax },
                { name: 'Belirsizlik Yönetimi', min: uncertaintyMin, max: uncertaintyMax },
                { name: 'İnsanları Etkileme', min: influenceMin, max: influenceMax },
                { name: 'Güven Veren İşbirlikçi ve Sinerji', min: collaborationMin, max: collaborationMax }
            ];

            competencyFields.forEach(field => {
                if (parseInt(field.min) < 1 || parseInt(field.min) > 100 || 
                    parseInt(field.max) < 1 || parseInt(field.max) > 100) {
                    rangeErrors.push(field.name);
                }
            });

            if (rangeErrors.length > 0) {
                const errorText = rangeErrors.length === 1 
                    ? `1 ile 100 arasında bir veri girmeniz gerekiyor! (${rangeErrors[0]})`
                    : `1 ile 100 arasında bir veri girmeniz gerekiyor! (${rangeErrors.join(', ')})`;
                
                return res.status(400).json({
                    success: false,
                    message: errorText
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
    },

    // Excel'den yetkinlik import et
    importCompetencies: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Excel dosyası bulunamadı'
                });
            }

            // Memory'den Excel dosyasını oku
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

            console.log(`Excel'den okunan satır sayısı: ${data.length}`);
            console.log(`İlk veri satırı:`, data[0]);
            
            if (data.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Excel dosyası boş veya geçersiz format'
                });
            }

            const adminId = req.admin.id;
            const importedCompetencies = [];
            const errors = [];

            // Sütun sırası: Unvan, Müşteri Odaklılık Min, Müşteri Odaklılık Max, 
            // Belirsizlik Yönetimi Min, Belirsizlik Yönetimi Max, İnsanları Etkileme Min, 
            // İnsanları Etkileme Max, Güven Veren İşbirlikçi ve Sinerji Min, Güven Veren İşbirlikçi ve Sinerji Max
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const rowNumber = i + 2; // Excel'de satır numarası (header + 1)

                try {
                    // Sütun sırasına göre değerleri al
                    const title = row[0]; // A sütunu - Unvan
                    const customerFocusMin = row[1]; // B sütunu - Müşteri Odaklılık Min
                    const customerFocusMax = row[2]; // C sütunu - Müşteri Odaklılık Max
                    const uncertaintyMin = row[3]; // D sütunu - Belirsizlik Yönetimi Min
                    const uncertaintyMax = row[4]; // E sütunu - Belirsizlik Yönetimi Max
                    const influenceMin = row[5]; // F sütunu - İnsanları Etkileme Min
                    const influenceMax = row[6]; // G sütunu - İnsanları Etkileme Max
                    const collaborationMin = row[7]; // H sütunu - Güven Veren İşbirlikçi ve Sinerji Min
                    const collaborationMax = row[8]; // I sütunu - Güven Veren İşbirlikçi ve Sinerji Max

                    // Boş alan kontrolü
                    if (!title || !customerFocusMin || !customerFocusMax || 
                        !uncertaintyMin || !uncertaintyMax || 
                        !influenceMin || !influenceMax || 
                        !collaborationMin || !collaborationMax) {
                        errors.push(`Satır ${rowNumber}: Tüm alanlar doldurulmalıdır`);
                        continue;
                    }

                    // Sayısal değer kontrolü
                    const numericValues = {
                        customerFocusMin: parseInt(customerFocusMin),
                        customerFocusMax: parseInt(customerFocusMax),
                        uncertaintyMin: parseInt(uncertaintyMin),
                        uncertaintyMax: parseInt(uncertaintyMax),
                        influenceMin: parseInt(influenceMin),
                        influenceMax: parseInt(influenceMax),
                        collaborationMin: parseInt(collaborationMin),
                        collaborationMax: parseInt(collaborationMax)
                    };

                    // 1-100 aralığı kontrolü
                    const rangeErrors = [];
                    const competencyFields = [
                        { name: 'Müşteri Odaklılık', min: numericValues.customerFocusMin, max: numericValues.customerFocusMax },
                        { name: 'Belirsizlik Yönetimi', min: numericValues.uncertaintyMin, max: numericValues.uncertaintyMax },
                        { name: 'İnsanları Etkileme', min: numericValues.influenceMin, max: numericValues.influenceMax },
                        { name: 'Güven Veren İşbirlikçi ve Sinerji', min: numericValues.collaborationMin, max: numericValues.collaborationMax }
                    ];

                    competencyFields.forEach(field => {
                        if (field.min < 1 || field.min > 100 || field.max < 1 || field.max > 100) {
                            rangeErrors.push(field.name);
                        }
                    });

                    if (rangeErrors.length > 0) {
                        errors.push(`Satır ${rowNumber}: 1 ile 100 arasında bir veri girmeniz gerekiyor! (${rangeErrors.join(', ')})`);
                        continue;
                    }

                    // Min-Max kontrolü
                    const minMaxErrors = [];
                    if (numericValues.customerFocusMin > numericValues.customerFocusMax) {
                        minMaxErrors.push('Müşteri Odaklılık');
                    }
                    if (numericValues.uncertaintyMin > numericValues.uncertaintyMax) {
                        minMaxErrors.push('Belirsizlik Yönetimi');
                    }
                    if (numericValues.influenceMin > numericValues.influenceMax) {
                        minMaxErrors.push('İnsanları Etkileme');
                    }
                    if (numericValues.collaborationMin > numericValues.collaborationMax) {
                        minMaxErrors.push('Güven Veren İşbirlikçi ve Sinerji');
                    }

                    if (minMaxErrors.length > 0) {
                        errors.push(`Satır ${rowNumber}: Minimum değer maksimum değerden büyük olamaz! (${minMaxErrors.join(', ')})`);
                        continue;
                    }

                    // Önce mevcut kaydı ara (case-insensitive ve trim ile)
                    const trimmedTitle = title.trim();
                    console.log(`Aranan unvan: "${trimmedTitle}"`);
                    
                    const existingCompetency = await Competency.findOne({ 
                        title: { $regex: new RegExp(`^${trimmedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
                    });

                    console.log(`Bulunan kayıt:`, existingCompetency ? `ID: ${existingCompetency._id}, Title: "${existingCompetency.title}"` : 'Bulunamadı');

                    let competency;
                    if (existingCompetency) {
                        // Mevcut kaydı güncelle
                        console.log(`Güncelleniyor: ${existingCompetency._id}`);
                        competency = await Competency.findByIdAndUpdate(
                            existingCompetency._id,
                            {
                                title: trimmedTitle,
                                customerFocus: { min: numericValues.customerFocusMin, max: numericValues.customerFocusMax },
                                uncertaintyManagement: { min: numericValues.uncertaintyMin, max: numericValues.uncertaintyMax },
                                influence: { min: numericValues.influenceMin, max: numericValues.influenceMax },
                                collaboration: { min: numericValues.collaborationMin, max: numericValues.collaborationMax },
                                createdBy: adminId
                            },
                            { new: true, runValidators: true }
                        );
                        console.log(`Güncellendi: ${competency._id}`);
                    } else {
                        // Yeni kayıt oluştur
                        console.log(`Yeni kayıt oluşturuluyor: "${trimmedTitle}"`);
                        competency = new Competency({
                            title: trimmedTitle,
                            customerFocus: { min: numericValues.customerFocusMin, max: numericValues.customerFocusMax },
                            uncertaintyManagement: { min: numericValues.uncertaintyMin, max: numericValues.uncertaintyMax },
                            influence: { min: numericValues.influenceMin, max: numericValues.influenceMax },
                            collaboration: { min: numericValues.collaborationMin, max: numericValues.collaborationMax },
                            createdBy: adminId
                        });
                        await competency.save();
                        console.log(`Yeni kayıt oluşturuldu: ${competency._id}`);
                    }

                    importedCompetencies.push(competency);

                } catch (error) {
                    errors.push(`Satır ${rowNumber}: ${error.message}`);
                }
            }

            // Dosya memory'de olduğu için silme işlemi gerekmiyor

            if (importedCompetencies.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Hiçbir yetkinlik import edilemedi',
                    errors: errors
                });
            }

            res.status(200).json({
                success: true,
                message: `${importedCompetencies.length} yetkinlik başarıyla işlendi (güncellendi/eklendi)`,
                importedCount: importedCompetencies.length,
                errors: errors.length > 0 ? errors : undefined
            });

        } catch (error) {
            console.error('Excel import hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Excel import işlemi sırasında bir hata oluştu',
                error: error.message
            });
        }
    }
};

module.exports = competencyController;
