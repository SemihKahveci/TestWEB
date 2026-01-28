const fs = require('fs');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');

// Yetkinlik adına göre koleksiyon mapping'i
const COMPETENCY_COLLECTION_MAP = {
    'Müşteri Odaklılık': 'evaluationresultsMY',
    'Uyumluluk ve Dayanıklılık': 'evaluationresults',
    'İnsanları Etkileme': 'evaluationresultsHI',
    'Güven Veren İşbirliği ve Sinerji': 'evaluationresultsTW'
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
        
        const db = client.db('admin-paneli-cluster');
        const collection = db.collection(collectionName);

        // Önce koleksiyonu temizle
        await collection.deleteMany({});

        // CSV'yi oku ve MongoDB'ye aktar
        const results = [];
        
        fs.createReadStream(fileName)
            .pipe(csv({ 
                separator: ';',
                headers: ['ID', 'Yönetici özeti güçlü yönleri', 'Yönetici özeti geliştirme', 'Genel Değerlendirme', 'Güçlü Yönler', 'Gelişim Alanları', 
                         'Mülakat Soruları', 'Neden Bu Sorular?', 'Gelişim Önerileri -1'],
                skipLines: 1
            }))
            .on('data', (data) => {
                // Sadece ID'si olan kayıtları al ve boş sütunları temizle
                if (data.ID && data.ID.trim() !== '') {
                    const cleanData = {
                        ID: data.ID,
                        'Yönetici özeti güçlü yönleri': data['Yönetici özeti güçlü yönleri'] || '',
                        'Yönetici özeti geliştirme': data['Yönetici özeti geliştirme'] || '',
                        'Genel Değerlendirme': data['Genel Değerlendirme'] || '',
                        'Güçlü Yönler': data['Güçlü Yönler'] || '',
                        'Gelişim Alanları': data['Gelişim Alanları'] || '',
                        'Mülakat Soruları': data['Mülakat Soruları'] || '',
                        'Neden Bu Sorular?': data['Neden Bu Sorular?'] || '',
                        'Gelişim Önerileri -1': data['Gelişim Önerileri -1'] || '',
                    };
                    results.push(cleanData);
                }
            })
            .on('end', async () => {
                try {
                    console.log(`Toplam ${results.length} kayıt bulundu.`);
                    if (results.length > 0) {
                        await collection.insertMany(results);
                        console.log(`${results.length} kayıt başarıyla MongoDB'ye aktarıldı.`);
                    }
                    await client.close();
                    process.exit(0);
 
                } catch (err) {
                    console.error('Kayıtlar eklenirken hata:', err);
                    await client.close();
                    process.exit(1);
                }
            })
            .on('error', async (err) => {
                console.error('CSV okuma hatası:', err);
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
    console.log('Kullanım: node importData.js <yetkinlik_adi> <dosya_adi>');
    process.exit(1);
}

importData(competencyName, fileName); 