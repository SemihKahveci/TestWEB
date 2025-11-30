const fs = require('fs');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://hasansemihkahveci:HHwoTrWoMuvHQeG2@admin-paneli-cluster.qypdg.mongodb.net/?retryWrites=true&w=majority&appName=admin-paneli-cluster';
const client = new MongoClient(uri);

async function importData() {
    try {
        await client.connect();
        
        const db = client.db('admin-paneli-cluster');
        const collection = db.collection('evaluationresultsMY');

        // Önce koleksiyonu temizle
        await collection.deleteMany({});

        // CSV'yi oku ve MongoDB'ye aktar
        const results = [];
        fs.createReadStream('Müşteri Odaklılık_18.11.2025.csv')
            .pipe(csv({ 
                separator: ';',
                headers: ['ID', 'Genel Değerlendirme', 'Güçlü Yönler', 'Gelişim Alanları', 
                         'Mülakat Soruları', 'Neden Bu Sorular?', 'Gelişim Önerileri -1'],
                skipLines: 1
            }))
            .on('data', (data) => {
                // Sadece ID'si olan kayıtları al ve boş sütunları temizle
                if (data.ID && data.ID.trim() !== '') {
                    const cleanData = {
                        ID: data.ID,
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
 
                } catch (err) {
                    console.error('Kayıtlar eklenirken hata:', err);
                    await client.close();
                }
            });

    } catch (err) {
        console.error('Bağlantı hatası:', err);
        await client.close();
    }
}

importData(); 