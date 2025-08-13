function checkResults() {
    fetch('/api/user-results')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const results = data.results;
                if (results.length > 0) {
                    results.forEach(result => {
                        if (result.status === 'Beklemede') {
                            // Kod süresi kontrolü (72 saat sonra süresi dolmuş sayılır)
                            const now = new Date();
                            const expiryDate = new Date(result.expiryDate);
                            
                            if (now > expiryDate) {
                                // Süresi dolmuşsa durumu güncelle
                                updateResultStatus(result.code, 'Süresi Doldu');
                            } else if (result.completionDate) {
                                // Sonuç geldiğinde durumu güncelle
                                updateResultStatus(result.code, 'Tamamlandı');
                            }
                        }
                    });
                }
            }
        })
        .catch(error => {
            console.error('Sonuç kontrolü hatası:', error);
        });
}

function updateResultStatus(code, newStatus) {
    fetch('/api/update-result-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code, status: newStatus })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadResults(); // Tabloyu yenile
        }
    })
    .catch(error => {
        console.error('Durum güncelleme hatası:', error);
    });
} 