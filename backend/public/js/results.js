// Sayfalama için gerekli değişkenler
let currentPage = 1;
const itemsPerPage = 10; // Her sayfada 10 kişi gösterilecek
let totalItems = 0;
let allData = [];
let filteredData = []; // Filtrelenmiş veriler için
let ws = null;
let expandedGroups = new Set(); // Açık olan grupları takip et

// Yükleme göstergesi göster
function showLoadingIndicator() {
    const tbody = document.getElementById('resultsBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
                        <div class="loading-spinner"></div>
                        <div style="color: #666; font-size: 14px;">Veriler yükleniyor...</div>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Yükleme göstergesini gizle
function hideLoadingIndicator() {
    // Bu fonksiyon displayData() tarafından otomatik olarak çağrılır
}

// Sayfa yüklendiğinde verileri yükle
function initializeData() {
    loadData();
}

// Verileri yükle
async function loadData() {
    // Yükleme göstergesi göster
    showLoadingIndicator();
    
    try {
        const response = await fetch('/api/user-results');
        if (!response.ok) {
            throw new Error('Veri çekme hatası');
        }
        const data = await response.json();
        
        if (data.success) {
            allData = data.results;
            // Aynı e-posta adresine sahip kişileri grupla
            const groupedData = groupByEmail(allData);
            filteredData = groupedData; // Gruplandırılmış veriler
            totalItems = filteredData.length;
            
            // Sonuçları kontrol et ve durumları güncelle (sadece görüntüleme için)
            allData.forEach(result => {
                if (result.status === 'Beklemede') {
                    // Kod süresi kontrolü (72 saat sonra süresi dolmuş sayılır, sadece görüntüleme için)
                    const now = new Date();
                    const expiryDate = new Date(result.expiryDate);
                    
                    if (now > expiryDate) {
                        // Süresi dolmuşsa sadece görüntüleme için işaretle
                        result.status = 'Süresi Doldu';
                    } else if (result.completionDate) {
                        // Sonuç geldiğinde sadece görüntüleme için işaretle
                        result.status = 'Tamamlandı';
                    }
                }
            });
            
            displayData();
            updatePagination();
            // Yükleme göstergesini gizle
            hideLoadingIndicator();
        }
    } catch (error) {
        console.error('Veri yükleme hatası:', error);
        // Hata durumunda da yükleme göstergesini gizle
        hideLoadingIndicator();
    }
}

// Süresi doldu uyarılarını göster/gizle kontrolü
function isShowExpiredWarning() {
    const cb = document.getElementById('showExpiredWarning');
    return !cb || cb.checked;
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
    const showExpired = isShowExpiredWarning();

    // Süresi dolan oyunları göster kapalıysa, status'u 'Süresi Doldu' olanları gizle
    let pageData = filteredData;
    if (!showExpired) {
        pageData = pageData.filter(item => item.status !== 'Süresi Doldu');
    }
    pageData = pageData.slice(startIndex, endIndex);

    tbody.innerHTML = '';

    pageData.forEach(item => {
        // Eğer ana satır grupluysa ve alt grupta sadece 'Süresi Doldu' olanlar varsa, onları da gizle
        if (!showExpired && item.status === 'Süresi Doldu') {
            return; // Ana satırı hiç ekleme
        }
        // Aktif (gözüken) alt grup sayısını hesapla
        let visibleGroupCount = 1;
        if (item.isGrouped && item.groupCount > 1 && item.allGroupItems) {
            visibleGroupCount = 1 + item.allGroupItems.slice(1).filter(sub => showExpired || sub.status !== 'Süresi Doldu').length;
        }
        const showExpandIcon = item.isGrouped && visibleGroupCount > 1;
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
        
        // Gruplandırılmış satır için özel stil
        if (item.isGrouped && item.groupCount > 1) {
            row.classList.add('grouped-row');
            row.setAttribute('data-email', item.email);
        }
        
        row.innerHTML = `
            <td>
                ${showExpandIcon ? `<span class="expand-icon" onclick="toggleGroup('${item.email}')">+</span> ` : ''}
                ${item.name}
                ${showExpired && item.hasExpiredCode ? `<span class="expired-warning" title="Oynanmamış oyun var"><i class="fas fa-exclamation-triangle"></i></span> ` : ''}
                ${showExpandIcon ? `<span class="group-count">(${visibleGroupCount} sonuç)</span>` : ''}
            </td>
            <td>${item.email || '-'}</td>
            <td>
                <span class="status-badge ${getStatusClass(item.status)}">${item.status}</span>
            </td>
            <td>${formatDate(item.sentDate)}</td>
            <td>${item.completionDate ? formatDate(item.completionDate) : '-'}</td>
            <td>${formatDate(item.expiryDate)}</td>
            <td>${formatDate(reportExpiryDate)}</td>
            <td class="action-buttons">
                <div class="action-button" onclick="showAnswersPopup('${item.code}')">
                    <i class="fas fa-info-circle" style="color: #17A2B8;"></i>
                </div>
                <div class="action-button ${isPDFDisabled ? 'disabled' : ''}" ${isPDFDisabled ? '' : `onclick="showPDFPopup('${item.code}')"`}>
                    <i class="fas fa-file-pdf" style="color: #0286F7;"></i>
                </div>
                <div class="action-button ${isPDFDisabled ? 'disabled' : ''}" ${isPDFDisabled ? '' : `onclick="downloadExcel('${item.code}')"`}>
                    <i class="fas fa-file-excel" style="color: #1D6F42;"></i>
                </div>
                <div class="action-button" onclick="showDeletePopup('${item.code}')">
                    <i class="fas fa-trash" style="color: #FF0000;"></i>
                </div>
            </td>
        `;
        tbody.appendChild(row);
        
        // Gruplandırılmış satırlar için alt satırları ekle (başlangıçta gizli)
        if (item.isGrouped && item.groupCount > 1) {
            item.allGroupItems.slice(1).forEach(groupItem => {
                if (!showExpired && groupItem.status === 'Süresi Doldu') {
                    return; // Alt satırı da ekleme
                }
                const subRow = document.createElement('tr');
                subRow.classList.add('sub-row', 'hidden');
                subRow.setAttribute('data-parent-email', item.email);
                
                const subIsPDFDisabled = groupItem.status !== 'Tamamlandı';
                const subIsInactive = groupItem.status === 'Beklemede' || groupItem.status === 'Oyun Devam Ediyor';
                
                if (subIsInactive) {
                    subRow.classList.add('inactive');
                }
                
                const subSentDate = new Date(groupItem.sentDate);
                const subReportExpiryDate = new Date(subSentDate);
                subReportExpiryDate.setMonth(subReportExpiryDate.getMonth() + 6);
                
                subRow.innerHTML = `
                    <td style="padding-left: 30px;">${groupItem.name}</td>
                    <td>${groupItem.email || '-'}</td>
                    <td>
                        <span class="status-badge ${getStatusClass(groupItem.status)}">${groupItem.status}</span>
                    </td>
                    <td>${formatDate(groupItem.sentDate)}</td>
                    <td>${groupItem.completionDate ? formatDate(groupItem.completionDate) : '-'}</td>
                    <td>${formatDate(groupItem.expiryDate)}</td>
                    <td>${formatDate(subReportExpiryDate)}</td>
                    <td class="action-buttons">
                        <div class="action-button" onclick="showAnswersPopup('${groupItem.code}')">
                            <i class="fas fa-info-circle" style="color: #17A2B8;"></i>
                        </div>
                        <div class="action-button ${subIsPDFDisabled ? 'disabled' : ''}" ${subIsPDFDisabled ? '' : `onclick="showPDFPopup('${groupItem.code}')"`}>
                            <i class="fas fa-file-pdf" style="color: #0286F7;"></i>
                        </div>
                        <div class="action-button ${subIsPDFDisabled ? 'disabled' : ''}" ${subIsPDFDisabled ? '' : `onclick="downloadExcel('${groupItem.code}')"`}>
                            <i class="fas fa-file-excel" style="color: #1D6F42;"></i>
                        </div>
                        <div class="action-button" onclick="showDeletePopup('${groupItem.code}')">
                            <i class="fas fa-trash" style="color: #FF0000;"></i>
                        </div>
                    </td>
                `;
                tbody.appendChild(subRow);
            });
        }
    });
    
    // Açık olan grupları tekrar aç
    restoreExpandedGroups();
}

// Cevaplar popup'ını aç
async function showAnswersPopup(code) {
    try {
        console.log('Cevaplar popup açılıyor, kod:', code);
        
        // Mevcut veriyi kullan - zaten yüklenmiş olan allData'dan bul
        const existingData = allData.find(item => item.code === code);
        
        if (!existingData) {
            alert('Bu kod için veri bulunamadı.');
            return;
        }
        
        const answersContent = document.getElementById('answersContent');
        
        let html = `
            <div style="margin-bottom: 20px; padding: 16px; background: #E3F2FD; border-radius: 8px; border-left: 4px solid #0286F7;">
                <div style="font-weight: 600; color: #0286F7; margin-bottom: 8px;">Oyun Bilgileri</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
                    <div><strong>Kod:</strong> ${existingData.code}</div>
                    <div><strong>Ad Soyad:</strong> ${existingData.name}</div>
                    <div><strong>Email:</strong> ${existingData.email}</div>
                    <div><strong>Durum:</strong> ${existingData.status}</div>
                    <div><strong>Rapor ID:</strong> ${existingData.reportId || 'Rapor oluşturulmamış'}</div>
                </div>
            </div>
        `;
        
        if (existingData.answers && existingData.answers.length > 0) {
            existingData.answers.forEach((answer, index) => {
                html += `
                    <div class="answer-item">
                        <div class="answer-question">Soru ${index + 1} (${answer.questionId || `Soru ${index + 1}`})</div>
                        <div class="answer-details">
                            <div class="answer-detail">
                                <div class="answer-detail-label">Seçilen Cevap 1:</div>
                                <div class="answer-detail-value">${answer.selectedAnswer1 || answer.answerType1 || '-'}</div>
                            </div>
                            <div class="answer-detail">
                                <div class="answer-detail-label">Seçilen Cevap 2:</div>
                                <div class="answer-detail-value">${answer.selectedAnswer2 || answer.answerType2 || '-'}</div>
                            </div>
                            <div class="answer-detail">
                                <div class="answer-detail-label">Alt Kategori:</div>
                                <div class="answer-detail-value">${answer.answerSubCategory || '-'}</div>
                            </div>
                            <div class="answer-detail">
                                <div class="answer-detail-label">Gezegen:</div>
                                <div class="answer-detail-value">${answer.planetName || '-'}</div>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            html += '<div style="text-align: center; color: #6C757D; padding: 40px;">Bu oyun için cevap bulunamadı.</div>';
        }
        
        answersContent.innerHTML = html;
        document.getElementById('answersPopup').style.display = 'flex';
        
    } catch (error) {
        console.error('Cevaplar getirme hatası:', error);
        alert('Cevaplar getirilirken bir hata oluştu: ' + error.message);
    }
}

// Cevaplar popup'ını kapat
function closeAnswersPopup() {
    document.getElementById('answersPopup').style.display = 'none';
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

// Aynı e-posta adresine sahip kişileri grupla
function groupByEmail(data) {
    const emailGroups = {};
    
    // Verileri e-posta adresine göre grupla
    data.forEach(item => {
        const email = item.email || 'no-email';
        if (!emailGroups[email]) {
            emailGroups[email] = [];
        }
        emailGroups[email].push(item);
    });
    
    // Her grup içindeki verileri tarihe göre sırala (en yeni üstte)
    Object.keys(emailGroups).forEach(email => {
        emailGroups[email].sort((a, b) => new Date(b.sentDate) - new Date(a.sentDate));
    });
    
    // Gruplandırılmış verileri düzleştir
    const groupedData = [];
    Object.keys(emailGroups).forEach(email => {
        const group = emailGroups[email];
        if (group.length === 1) {
            // Tek sonuç varsa normal göster
            const hasExpiredCode = group[0].status === 'Süresi Doldu';
            groupedData.push({
                ...group[0],
                isGrouped: false,
                groupCount: 1,
                hasExpiredCode: hasExpiredCode
            });
        } else {
            // Birden fazla sonuç varsa gruplandır
            const latestItem = group[0]; // En yeni olan
            
            // Grupta süresi dolmuş kod var mı kontrol et
            const hasExpiredCode = group.some(item => item.status === 'Süresi Doldu');
            
            groupedData.push({
                ...latestItem,
                isGrouped: true,
                groupCount: group.length,
                allGroupItems: group,
                hasExpiredCode: hasExpiredCode
            });
        }
    });
    
    return groupedData;
}

// Status badge CSS sınıfını belirle
function getStatusClass(status) {
    switch (status) {
        case 'Oyun Devam Ediyor':
            return 'oyun-devam-ediyor';
        case 'Süresi Doldu':
            return 'süresi-doldu';
        case 'Tamamlandı':
            return 'tamamlandı';
        case 'Beklemede':
            return 'beklemede';
        default:
            return status.toLowerCase();
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

// Açık olan grupları tekrar aç
function restoreExpandedGroups() {
    expandedGroups.forEach(email => {
        const expandIcon = document.querySelector(`tr[data-email="${email}"] .expand-icon`);
        const subRows = document.querySelectorAll(`tr[data-parent-email="${email}"]`);
        
        if (expandIcon && subRows.length > 0) {
            subRows.forEach(row => row.classList.remove('hidden'));
            expandIcon.textContent = '-';
        }
    });
}

// Grup açma/kapama fonksiyonu
function toggleGroup(email) {
    const expandIcon = event.target;
    const subRows = document.querySelectorAll(`tr[data-parent-email="${email}"]`);
    const isExpanded = !subRows[0].classList.contains('hidden');
    
    if (isExpanded) {
        // Grubu kapat
        subRows.forEach(row => row.classList.add('hidden'));
        expandIcon.textContent = '+';
        expandedGroups.delete(email);
    } else {
        // Grubu aç
        subRows.forEach(row => row.classList.remove('hidden'));
        expandIcon.textContent = '-';
        expandedGroups.add(email);
    }
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

// Arama fonksiyonu
function filterResults() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (searchTerm === '') {
        // Arama boşsa tüm verileri göster
        filteredData = [...allData];
    } else {
        // Arama terimini ad soyad sütununda ara
        filteredData = allData.filter(item => {
            const name = (item.name || '').toLowerCase();
            return name.includes(searchTerm);
        });
    }
    
    // Sayfalama sıfırla
    currentPage = 1;
    totalItems = filteredData.length;
    
    // Tabloyu güncelle
    displayData();
    updatePagination();
}

// Excel indirme fonksiyonu
async function downloadExcel(code) {
    try {
        const response = await fetch(`/api/admin/export-excel/${code}`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error('Excel indirme işlemi başarısız oldu');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `degerlendirme_${code}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Excel indirme hatası:', error);
        alert('Excel indirilirken bir hata oluştu: ' + error.message);
    }
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    const expiredCb = document.getElementById('showExpiredWarning');
    if (expiredCb) {
        expiredCb.addEventListener('change', () => {
            displayData();
        });
    }
    handleCheckboxes();
    loadData();
}); 