const fs = require('fs');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://hasansemihkahveci:HHwoTrWoMuvHQeG2@admin-paneli-cluster.qypdg.mongodb.net/?retryWrites=true&w=majority&appName=admin-paneli-cluster';
const client = new MongoClient(uri);

async function importData() {
    try {
        await client.connect();
        
        const db = client.db('admin-paneli-cluster');
        const collection = db.collection('evaluationresults');

        // Önce koleksiyonu temizle
        await collection.deleteMany({});

        // CSV'yi oku ve MongoDB'ye aktar
        const results = [];
        fs.createReadStream('Semih dosya 2.csv')
            .pipe(csv({ 
                separator: ';',
                headers: ['ID', 'Genel Değerlendirme', 'Güçlü Yönler', 'Gelişim Alanları', 
                         'Mülakat Soruları', 'Neden Bu Sorular?', 'Gelişim Önerileri -1',
                         'Gelişim Önerileri -2', 'Gelişim Önerileri - 3'],
                skipLines: 1
            }))
            .on('data', (data) => {
                results.push(data);
            })
            .on('end', async () => {
                try {
                    if (results.length > 0) {
                        await collection.insertMany(results);
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