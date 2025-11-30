const fs = require('fs');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');

// Yetkinlik adına göre koleksiyon mapping'i
const COMPETENCY_COLLECTION_MAP = {
    'Müşteri Odaklılık': 'evaluationanswersMY',
    'Uyumluluk ve Dayanıklılık': 'evaluationanswers',
    'İnsanları Etkileme': 'evaluationanswersHI',
    'Güven Veren İşbirliği ve Sinerji': 'evaluationanswersTW'
};

const uri = 'mongodb+srv://hasansemihkahveci:HHwoTrWoMuvHQeG2@admin-paneli-cluster.qypdg.mongodb.net/?retryWrites=true&w=majority&appName=admin-paneli-cluster';
const client = new MongoClient(uri);

async function importData(competencyName, fileName) {
    try {
        // Koleksiyon adını al
        const collectionName = COMPETENCY_COLLECTION_MAP[competencyName];
        if (!collectionName) {
            console.error(`Hata: Geçersiz yetkinlik adı: ${competencyName}`);
            process.exit(1);
        }

        // Dosya varlığını kontrol et
        if (!fs.existsSync(fileName)) {
            console.error(`Hata: Dosya bulunamadı: ${fileName}`);
            process.exit(1);
        }

        await client.connect();
        console.log('MongoDB Atlas\'a bağlandı');
        
        const db = client.db('admin-paneli-cluster');
        const collection = db.collection(collectionName);

        // Önce koleksiyonu temizle
        await collection.deleteMany({});
        console.log('Koleksiyon temizlendi');

        // CSV'yi oku ve MongoDB'ye aktar
        const results = [];
        let rowCount = 0;

        fs.createReadStream(fileName)
            .pipe(csv({ 
                separator: ';',
                headers: ['ID', 'Cevaplar'],
                skipLines: 1
            }))
            .on('data', (data) => {
                rowCount++;
                console.log(`Satır ${rowCount} okunuyor:`, data);
                results.push(data);
            })
            .on('end', async () => {
                try {
                    if (results.length > 0) {
                        console.log('Toplam okunan satır sayısı:', results.length);
                        console.log('İlk kayıt örneği:', results[0]);
                        
                        const insertResult = await collection.insertMany(results);
                        console.log(`${insertResult.insertedCount} kayıt başarıyla eklendi`);
                        
                        // Eklenen kayıtları kontrol et
                        const count = await collection.countDocuments();
                        console.log('Koleksiyondaki toplam kayıt sayısı:', count);
                        
                        // İlk kaydı göster
                        const firstRecord = await collection.findOne({});
                        console.log('Veritabanındaki ilk kayıt:', firstRecord);
                    } else {
                        console.log('Hiç kayıt okunamadı!');
                    }
                    await client.close();
                    console.log('İşlem tamamlandı');
                    process.exit(0);
                } catch (err) {
                    console.error('Kayıtlar eklenirken hata:', err);
                    await client.close();
                    process.exit(1);
                }
            })
            .on('error', async (error) => {
                console.error('CSV okuma hatası:', error);
                await client.close();
                process.exit(1);
            });

    } catch (err) {
        console.error('Bağlantı hatası:', err);
        await client.close();
        process.exit(1);
    }
}

// Komut satırı parametrelerini al
const args = process.argv.slice(2);
const competencyName = args[0];
const fileName = args[1];

if (!competencyName || !fileName) {
    console.error('Hata: Yetkinlik adı ve dosya adı gereklidir.');
    console.log('Kullanım: node importDataID.js <yetkinlik_adi> <dosya_adi>');
    process.exit(1);
}

importData(competencyName, fileName);