const fs = require('fs');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://hasansemihkahveci:HHwoTrWoMuvHQeG2@admin-paneli-cluster.qypdg.mongodb.net/?retryWrites=true&w=majority&appName=admin-paneli-cluster';
const client = new MongoClient(uri);

async function importData() {
    try {
        await client.connect();
        console.log('MongoDB Atlas\'a bağlandı');
        
        const db = client.db('admin-paneli-cluster');
        const collection = db.collection('evaluationanswersMY');

        // Önce koleksiyonu temizle
        await collection.deleteMany({});
        console.log('Koleksiyon temizlendi');

        // CSV'yi oku ve MongoDB'ye aktar
        const results = [];
        let rowCount = 0;

        fs.createReadStream('Musteri_Odaklilik_Rapor_IDler.csv')
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
                } catch (err) {
                    console.error('Kayıtlar eklenirken hata:', err);
                    await client.close();
                }
            })
            .on('error', (error) => {
                console.error('CSV okuma hatası:', error);
            });

    } catch (err) {
        console.error('Bağlantı hatası:', err);
        await client.close();
    }
}

importData(); 