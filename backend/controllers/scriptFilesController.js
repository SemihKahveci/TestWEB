const XLSX = require('xlsx');
const mongoose = require('mongoose');
const { safeLog, getSafeErrorMessage } = require('../utils/helpers');

// Yetkinlik adına göre koleksiyon mapping'i
const COMPETENCY_COLLECTION_MAP = {
    'Müşteri Odaklılık': 'evaluationresultsMY',
    'Uyumluluk ve Dayanıklılık': 'evaluationresults',
    'İnsanları Etkileme': 'evaluationresultsHI',
    'Güven Veren İşbirliği ve Sinerji': 'evaluationresultsTW'
};

// Geçerli yetkinlik listesi
const VALID_COMPETENCIES = Object.keys(COMPETENCY_COLLECTION_MAP);

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const scriptFilesController = {
    // Script çalıştırma (Raporları Güncelle butonu)
    updateScriptFile: async (req, res) => {
        let tempCsvPath = null;
        try {
            const { competencyName } = req.body;
            const file = req.file;

            if (!competencyName) {
                return res.status(400).json({
                    success: false,
                    message: 'Yetkinlik adı gereklidir'
                });
            }

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: 'Dosya gereklidir'
                });
            }

            // Yetkinlik adını kontrol et
            if (!VALID_COMPETENCIES.includes(competencyName)) {
                return res.status(400).json({
                    success: false,
                    message: `Geçersiz yetkinlik adı. Geçerli yetkinlikler: ${VALID_COMPETENCIES.join(', ')}`
                });
            }

            // Excel dosyası ise CSV'ye çevir, CSV ise direkt kullan
            let csvBuffer;
            if (file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
                // Excel dosyasını CSV'ye çevir
                const workbook = XLSX.read(file.buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                // CSV formatına çevir (noktalı virgül ile ayrılmış)
                const csvData = XLSX.utils.sheet_to_csv(worksheet, { 
                    FS: ';', // Field separator (noktalı virgül)
                    RS: '\n' // Row separator
                });
                csvBuffer = Buffer.from(csvData, 'utf8');
            } else {
                // CSV dosyası, direkt kullan
                csvBuffer = file.buffer;
            }

            // Geçici CSV dosyası oluştur
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Dosya adını temizle (özel karakterleri kaldır)
            const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
            const csvFileName = cleanFileName.replace(/\.(xlsx|xls)$/i, '.csv');
            tempCsvPath = path.join(tempDir, csvFileName);

            // CSV dosyasını kaydet
            fs.writeFileSync(tempCsvPath, csvBuffer, 'utf8');
            safeLog('info', `CSV dosyası kaydedildi: ${tempCsvPath}`);

            // Script'i çalıştır
            const scriptPath = path.join(__dirname, '../scripts/importData.js');
            const command = `node "${scriptPath}" "${competencyName}" "${tempCsvPath}"`;

            safeLog('info', `Script çalıştırılıyor: ${command}`);

            const { stdout, stderr } = await execAsync(command, {
                cwd: path.join(__dirname, '../'),
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer
            });

            if (stderr && !stderr.includes('Toplam') && !stderr.includes('kayıt')) {
                safeLog('warn', 'Script stderr:', stderr);
            }

            safeLog('info', 'Script çıktısı:', stdout);

            // Geçici dosyayı sil
            if (tempCsvPath && fs.existsSync(tempCsvPath)) {
                fs.unlinkSync(tempCsvPath);
                safeLog('info', 'Geçici dosya silindi:', tempCsvPath);
            }

            res.json({
                success: true,
                message: `Raporlar başarıyla güncellendi. Script çalıştırıldı.`,
                output: stdout
            });

        } catch (error) {
            // Geçici dosyayı temizle
            if (tempCsvPath && fs.existsSync(tempCsvPath)) {
                try {
                    fs.unlinkSync(tempCsvPath);
                } catch (unlinkError) {
                    safeLog('warn', 'Geçici dosya silinirken hata:', unlinkError);
                }
            }

            safeLog('error', 'Script güncelleme hatası', error);
            res.status(500).json({
                success: false,
                message: 'Güncelleme sırasında bir hata oluştu',
                error: getSafeErrorMessage(error)
            });
        }
    },

    // ID'leri güncelleme script'i (ID'leri Güncelle butonu)
    updateIDsScriptFile: async (req, res) => {
        let tempCsvPath = null;
        try {
            const { competencyName } = req.body;
            const file = req.file;

            if (!competencyName) {
                return res.status(400).json({
                    success: false,
                    message: 'Yetkinlik adı gereklidir'
                });
            }

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: 'Dosya gereklidir'
                });
            }

            // Yetkinlik adını kontrol et
            if (!VALID_COMPETENCIES.includes(competencyName)) {
                return res.status(400).json({
                    success: false,
                    message: `Geçersiz yetkinlik adı. Geçerli yetkinlikler: ${VALID_COMPETENCIES.join(', ')}`
                });
            }

            // Excel dosyası ise CSV'ye çevir, CSV ise direkt kullan
            let csvBuffer;
            if (file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
                // Excel dosyasını CSV'ye çevir
                const workbook = XLSX.read(file.buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                // CSV formatına çevir (noktalı virgül ile ayrılmış)
                const csvData = XLSX.utils.sheet_to_csv(worksheet, { 
                    FS: ';', // Field separator (noktalı virgül)
                    RS: '\n' // Row separator
                });
                csvBuffer = Buffer.from(csvData, 'utf8');
            } else {
                // CSV dosyası, direkt kullan
                csvBuffer = file.buffer;
            }

            // Geçici CSV dosyası oluştur
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Dosya adını temizle (özel karakterleri kaldır)
            const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
            const csvFileName = cleanFileName.replace(/\.(xlsx|xls)$/i, '.csv');
            tempCsvPath = path.join(tempDir, csvFileName);

            // CSV dosyasını kaydet
            fs.writeFileSync(tempCsvPath, csvBuffer, 'utf8');
            safeLog('info', `CSV dosyası kaydedildi: ${tempCsvPath}`);

            // Script'i çalıştır
            const scriptPath = path.join(__dirname, '../scripts/importDataID.js');
            const command = `node "${scriptPath}" "${competencyName}" "${tempCsvPath}"`;

            safeLog('info', `ID Script çalıştırılıyor: ${command}`);

            const { stdout, stderr } = await execAsync(command, {
                cwd: path.join(__dirname, '../'),
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer
            });

            if (stderr && !stderr.includes('Toplam') && !stderr.includes('kayıt') && !stderr.includes('Satır')) {
                safeLog('warn', 'Script stderr:', stderr);
            }

            safeLog('info', 'Script çıktısı:', stdout);

            // Geçici dosyayı sil
            if (tempCsvPath && fs.existsSync(tempCsvPath)) {
                fs.unlinkSync(tempCsvPath);
                safeLog('info', 'Geçici dosya silindi:', tempCsvPath);
            }

            res.json({
                success: true,
                message: `ID'ler başarıyla güncellendi. Script çalıştırıldı.`,
                output: stdout
            });

        } catch (error) {
            // Geçici dosyayı temizle
            if (tempCsvPath && fs.existsSync(tempCsvPath)) {
                try {
                    fs.unlinkSync(tempCsvPath);
                } catch (unlinkError) {
                    safeLog('warn', 'Geçici dosya silinirken hata:', unlinkError);
                }
            }

            safeLog('error', 'ID Script güncelleme hatası', error);
            res.status(500).json({
                success: false,
                message: 'ID güncelleme sırasında bir hata oluştu',
                error: getSafeErrorMessage(error)
            });
        }
    }
};

module.exports = scriptFilesController;

