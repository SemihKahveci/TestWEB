// Sonuç silme fonksiyonu
window.deleteResult = async function(code) {
    try {
        if (!confirm('Bu sonucu silmek istediğinizden emin misiniz?')) {
            return;
        }

        const response = await fetch('/api/delete-result', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });

        if (!response.ok) {
            throw new Error('Silme işlemi başarısız oldu');
        }

        // Tabloyu yenile
        await loadData();
    } catch (error) {
        console.error('Sonuç silme hatası:', error);
        alert('Sonuç silinirken bir hata oluştu');
    }
}; 