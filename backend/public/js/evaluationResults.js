// Sayfalama için gerekli değişkenler
let currentPage = 1;
const itemsPerPage = 10; // Her sayfada 10 kişi gösterilecek
let totalItems = 0;
let allData = [];

// Verileri yükle
async function loadEvaluationData() {
    try {
        const response = await fetch('/api/user-results');
        if (!response.ok) {
            throw new Error('Veri çekme hatası');
        }
        const data = await response.json();
        
        if (data.success) {
            allData = data.results;
            totalItems = allData.length;
            displayEvaluationData();
            updatePagination();
        } else {
            console.error('Veri çekme başarısız:', data.error);
        }
    } catch (error) {
        console.error('Veri yükleme hatası:', error);
    }
}

// Verileri görüntüle
function displayEvaluationData() {
    const tbody = document.getElementById('resultsBody');
    if (!tbody) {
        console.error('Tablo gövdesi bulunamadı');
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = allData.slice(startIndex, endIndex);

    tbody.innerHTML = '';

    pageData.forEach(item => {
        const row = document.createElement('tr');
        const isInactive = item.status === 'Beklemede' || item.status === 'Oyun Devam Ediyor';
        
        if (isInactive) {
            row.classList.add('inactive');
        }
        
        // Skorları kontrol et ve dönüştür
        const customerFocusScore = (item.customerFocusScore && !isNaN(item.customerFocusScore)) ? 
            Math.round(item.customerFocusScore) : '-';
        const uncertaintyScore = (item.uncertaintyScore && !isNaN(item.uncertaintyScore)) ? 
            Math.round(item.uncertaintyScore) : '-';
        
        row.innerHTML = `
            <td>${item.name}</td>
            <td>
                <span class="score-badge ${customerFocusScore === '-' ? '' : getScoreColorClass(customerFocusScore)}">
                    ${customerFocusScore}
                </span>
            </td>
            <td>
                <span class="score-badge ${uncertaintyScore === '-' ? '' : getScoreColorClass(uncertaintyScore)}">
                    ${uncertaintyScore}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Müşteri Odaklılık Skorunu Hesapla
function calculateCustomerFocusScore(answers) {
    if (!answers || !Array.isArray(answers)) return '-';
    
    const customerFocusAnswers = answers.filter(answer => 
        answer.answerSubCategory === 'MO'
    );
    
    if (customerFocusAnswers.length === 0) return '-';
    
    const totalScore = customerFocusAnswers.reduce((acc, answer) => {
        const multiplier1 = answerMultipliers[answer.answerType1] || 0;
        const multiplier2 = answerMultipliers[answer.answerType2] || 0;
        return acc + ((multiplier1 + (multiplier2 / 2)) * 2) / 3;
    }, 0) / customerFocusAnswers.length;
    
    return totalScore.toFixed(2);
}

// Belirsizlik Yönetimi Skorunu Hesapla
function calculateUncertaintyManagementScore(answers) {
    if (!answers || !Array.isArray(answers)) return '-';
    
    const uncertaintyAnswers = answers.filter(answer => 
        answer.answerSubCategory === 'BY'
    );
    
    if (uncertaintyAnswers.length === 0) return '-';
    
    const totalScore = uncertaintyAnswers.reduce((acc, answer) => {
        const multiplier1 = answerMultipliers[answer.answerType1] || 0;
        const multiplier2 = answerMultipliers[answer.answerType2] || 0;
        return acc + ((multiplier1 + (multiplier2 / 2)) * 2) / 3;
    }, 0) / uncertaintyAnswers.length;
    
    return totalScore.toFixed(2);
}

// Sayfalama kontrollerini güncelle
function updatePagination() {
    const paginationContent = document.querySelector('.pagination-content');
    if (!paginationContent) {
        console.error('Sayfalama içeriği bulunamadı');
        return;
    }

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    let paginationHTML = `
        <div class="page-nav" ${currentPage === 1 ? 'style="opacity: 0.5; pointer-events: none;"' : ''} onclick="changePage(${currentPage - 1})">Önceki Sayfa</div>
    `;

    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <div class="page-button ${currentPage === i ? 'active' : ''}" onclick="changePage(${i})">
                <div class="page-text">${i}</div>
            </div>
        `;
    }

    paginationHTML += `
        <div class="page-nav" ${currentPage === totalPages ? 'style="opacity: 0.5; pointer-events: none;"' : ''} onclick="changePage(${currentPage + 1})">Sonraki Sayfa</div>
    `;

    paginationContent.innerHTML = paginationHTML;
}

// Sayfa değiştir
function changePage(page) {
    if (page < 1 || page > Math.ceil(totalItems / itemsPerPage)) {
        return;
    }
    currentPage = page;
    displayEvaluationData();
    updatePagination();
}

// Tarih formatla
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Silme popup'ını göster
function showDeletePopup(code) {
    const popup = document.getElementById('deletePopup');
    popup.style.display = 'flex';
    popup.dataset.code = code;
}

// Silme popup'ını kapat
function closeDeletePopup() {
    const popup = document.getElementById('deletePopup');
    popup.style.display = 'none';
    delete popup.dataset.code;
}

// Silme işlemini onayla
async function confirmDelete() {
    const popup = document.getElementById('deletePopup');
    const code = popup.dataset.code;
    
    if (!code) {
        console.error('Silme kodu bulunamadı');
        return;
    }

    try {
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

        // Popup'ı kapat ve tabloyu yenile
        closeDeletePopup();
        await loadEvaluationData();
    } catch (error) {
        console.error('Sonuç silme hatası:', error);
        alert('Sonuç silinirken bir hata oluştu');
    }
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    loadEvaluationData();
    // Her 30 saniyede bir verileri güncelle
    setInterval(loadEvaluationData, 30000);
});

function getScoreColorClass(score) {
    if (score === '-' || isNaN(score)) return '';
    const numScore = parseFloat(score);
    if (numScore <= 37 || numScore >= 90) return 'red';
    if (numScore <= 65) return 'yellow';
    if (numScore <= 89.99999999999) return 'green';
    return 'red';
} 