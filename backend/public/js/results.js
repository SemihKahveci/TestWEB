// Sayfalama için gerekli değişkenler
let currentPage = 1;
const itemsPerPage = 10; // Her sayfada 10 kişi gösterilecek
let totalItems = 0;
let allData = [];
let ws = null;

// WebSocket bağlantısını kur
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    
    ws.onopen = () => {

        loadData();
    };
    
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'newResult' || data.type === 'resultUpdate') {
                loadData();
            }
        } catch (error) {
            console.error('WebSocket mesaj işleme hatası:', error);
        }
    };
    
    ws.onclose = () => {

        setTimeout(connectWebSocket, 3000);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket hatası:', error);
    };
}

// Verileri yükle
async function loadData() {
    try {
        const response = await fetch('/api/user-results');
        if (!response.ok) {
            throw new Error('Veri çekme hatası');
        }
        const data = await response.json();
        
        if (data.success) {
            allData = data.results;
            totalItems = allData.length;
            
            // Sonuçları kontrol et ve durumları güncelle
            allData.forEach(result => {
                if (result.status === 'Beklemede' && result.completionDate) {
                    updateResultStatus(result.code, 'Tamamlandı');
                }
            });
            
            displayData();
            updatePagination();
        }
    } catch (error) {
        console.error('Veri yükleme hatası:', error);
    }
}

// Verileri görüntüle
function displayData() {
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
        const isPDFDisabled = item.status !== 'Tamamlandı';
        const isInactive = item.status === 'Beklemede' || item.status === 'Oyun Devam Ediyor';
        
        if (isInactive) {
            row.classList.add('inactive');
        }
        
        // Rapor geçerlilik tarihini hesapla (Gönderim tarihi + 6 ay)
        const sentDate = new Date(item.sentDate);
        const reportExpiryDate = new Date(sentDate);
        reportExpiryDate.setMonth(reportExpiryDate.getMonth() + 6);
        
        row.innerHTML = `
            <td>${item.name}</td>
            <td>
                <span class="status-badge ${item.status === 'Oyun Devam Ediyor' ? 'oyun-devam-ediyor' : item.status.toLowerCase()}">${item.status}</span>
            </td>
            <td>${formatDate(item.sentDate)}</td>
            <td>${item.completionDate ? formatDate(item.completionDate) : '-'}</td>
            <td>${formatDate(item.expiryDate)}</td>
            <td>${formatDate(reportExpiryDate)}</td>
            <td class="action-buttons">
                <div class="action-button ${isPDFDisabled ? 'disabled' : ''}" ${isPDFDisabled ? '' : `onclick="showPDFPopup('${item.code}')"`}>
                    <i class="fas fa-file-pdf" style="color: #0286F7;"></i>
                </div>
                <div class="action-button" onclick="showDeletePopup('${item.code}')">
                    <i class="fas fa-trash" style="color: #FF0000;"></i>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
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
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        displayData();
        updatePagination();
    }
}

// Tarih formatla
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// CRUD işlemleri
async function viewItem(id) {
    try {
        const response = await fetch(`/api/evaluation/${id}`);
        const data = await response.json();
        // Görüntüleme işlemleri burada yapılacak
    } catch (error) {
        console.error('Görüntüleme hatası:', error);
    }
}

async function editItem(id) {
    try {
        const response = await fetch(`/api/evaluation/${id}`);
        const data = await response.json();
        // Düzenleme işlemleri burada yapılacak
    } catch (error) {
        console.error('Düzenleme hatası:', error);
    }
}

async function deleteItem(id) {
    if (confirm('Bu öğeyi silmek istediğinizden emin misiniz?')) {
        try {
            const response = await fetch(`/api/evaluation/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                loadData(); // Verileri yeniden yükle
            }
        } catch (error) {
            console.error('Silme hatası:', error);
        }
    }
}

async function downloadPDF(id) {
    try {
        const response = await fetch(`/api/evaluation/${id}/pdf`, {
            method: 'POST'
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `evaluation-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('PDF indirme hatası:', error);
    }
}

function printItem(id) {
    console.log('Yazdır:', id);
    // Yazdırma işlemleri burada yapılacak
}

// Toplu işlemler için checkbox kontrolü
function handleCheckboxes() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const selectedIds = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.dataset.id);
        });
    });
}

// Durum güncelle
async function updateResultStatus(code, newStatus) {
    try {
        const response = await fetch('/api/update-result-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code, status: newStatus })
        });
        
        const data = await response.json();
        if (data.success) {
            loadData();
        }
    } catch (error) {
        console.error('Durum güncelleme hatası:', error);
    }
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
        await loadData();
    } catch (error) {
        console.error('Sonuç silme hatası:', error);
        alert('Sonuç silinirken bir hata oluştu');
    }
}

// PDF Önizleme Popup'ını göster
function showPDFPreviewPopup() {
    const popup = document.getElementById('pdfPreviewPopup');
    if (!popup) {
        console.error('PDF önizleme popup\'ı bulunamadı');
        return;
    }
    popup.style.display = 'flex';
}

// PDF Önizleme Popup'ını kapat
function closePDFPreviewPopup() {
    const popup = document.getElementById('pdfPreviewPopup');
    if (!popup) {
        console.error('PDF önizleme popup\'ı bulunamadı');
        return;
    }
    popup.style.display = 'none';
    const frame = document.getElementById('pdfPreviewFrame');
    if (frame) {
        frame.src = ''; // iframe'i temizle
    }
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    connectWebSocket();
    handleCheckboxes();
    loadData();
    // Her 5 saniyede bir verileri güncelle
    setInterval(loadData, 5000);
}); 