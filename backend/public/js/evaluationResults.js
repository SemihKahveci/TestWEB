// Sayfalama için gerekli değişkenler
let currentPage = 1;
const itemsPerPage = 10; // Her sayfada 10 kişi gösterilecek
let totalItems = 0;
let allData = [];
let filteredData = [];

// Yükleme göstergesi göster
function showLoadingIndicator() {
    const tbody = document.getElementById('resultsBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px;">
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

// Yenileme fonksiyonu
function refreshData() {
    loadData(true); // Filtreleri sıfırla
}

// Verileri yükle
async function loadData(resetFilters = false) {
    // Yükleme göstergesi göster
    showLoadingIndicator();
    
    try {
        const response = await fetch('/api/user-results');
        if (!response.ok) {
            throw new Error('Veri çekme hatası');
        }
        const data = await response.json();
        
        if (data.success) {
            console.log('Yüklenen veri:', data.results);
            allData = data.results;
            
            if (resetFilters) {
                document.getElementById('customerFocusMin').value = '0';
                document.getElementById('customerFocusMax').value = '100';
                document.getElementById('uncertaintyMin').value = '0';
                document.getElementById('uncertaintyMax').value = '100';
                document.getElementById('nameSearch').value = '';
                document.getElementById('customerFocusMinValue').textContent = '0';
                document.getElementById('customerFocusMaxValue').textContent = '100';
                document.getElementById('uncertaintyMinValue').textContent = '0';
                document.getElementById('uncertaintyMaxValue').textContent = '100';
                filteredData = [...allData];
            } else {
                // Mevcut filtreleri koru
                const customerFocusMin = document.getElementById('customerFocusMin').value;
                const customerFocusMax = document.getElementById('customerFocusMax').value;
                const uncertaintyMin = document.getElementById('uncertaintyMin').value;
                const uncertaintyMax = document.getElementById('uncertaintyMax').value;
                const nameSearch = document.getElementById('nameSearch').value.toLowerCase();

                filteredData = allData.filter(item => {
                    try {
                        if (!item || !item.name) {
                            console.log('Name özelliği eksik:', item);
                            return false;
                        }

                        const itemName = item.name.toString().toLowerCase();
                        const customerFocusScore = item.customerFocusScore === '-' ? null : parseFloat(item.customerFocusScore);
                        const uncertaintyScore = item.uncertaintyScore === '-' ? null : parseFloat(item.uncertaintyScore);
                        const hiScore = item.hiScore === '-' ? null : parseFloat(item.hiScore);
                        const twScore = item.twScore === '-' ? null : parseFloat(item.twScore);

                        // İsim araması
                        let nameMatch = true;
                        if (nameSearch) {
                            nameMatch = itemName.includes(nameSearch);
                        }

                        // Müşteri Odaklılık Skoru filtresi
                        let customerFocusMatch = true;
                        if (customerFocusScore !== null) {
                            const min = parseFloat(customerFocusMin);
                            const max = parseFloat(customerFocusMax);
                            customerFocusMatch = customerFocusScore >= min && customerFocusScore <= max;
                        }

                        // Belirsizlik Yönetimi Skoru filtresi
                        let uncertaintyMatch = true;
                        if (uncertaintyScore !== null) {
                            const min = parseFloat(uncertaintyMin);
                            const max = parseFloat(uncertaintyMax);
                            uncertaintyMatch = uncertaintyScore >= min && uncertaintyScore <= max;
                        }

                        // HI Skoru filtresi
                        let hiMatch = true;
                        if (hiScore !== null) {
                            const min = parseFloat(document.getElementById('hiMin').value);
                            const max = parseFloat(document.getElementById('hiMax').value);
                            hiMatch = hiScore >= min && hiScore <= max;
                        }

                        // TW Skoru filtresi
                        let twMatch = true;
                        if (twScore !== null) {
                            const min = parseFloat(document.getElementById('twMin').value);
                            const max = parseFloat(document.getElementById('twMax').value);
                            twMatch = twScore >= min && twScore <= max;
                        }

                        return nameMatch && customerFocusMatch && uncertaintyMatch && hiMatch && twMatch;
                    } catch (error) {
                        console.error('Öğe filtreleme hatası:', error, item);
                        return false;
                    }
                });
            }
            
            totalItems = filteredData.length;
            displayData();
            updatePagination();
            // Yükleme göstergesini gizle
            hideLoadingIndicator();
        } else {
            console.error('Veri çekme başarısız:', data.error);
            // Hata durumunda da yükleme göstergesini gizle
            hideLoadingIndicator();
        }
    } catch (error) {
        console.error('Veri yükleme hatası:', error);
        // Hata durumunda da yükleme göstergesini gizle
        hideLoadingIndicator();
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
    const pageData = filteredData.slice(startIndex, endIndex);

    console.log('Görüntülenecek veri:', pageData);

    tbody.innerHTML = '';

    pageData.forEach(item => {
        if (!item || !item.name) {
            console.log('Geçersiz öğe:', item);
            return;
        }

        const row = document.createElement('tr');
        
        const customerFocusScore = (item.customerFocusScore && !isNaN(item.customerFocusScore)) ? 
            Math.round(parseFloat(item.customerFocusScore)) : '-';
        const uncertaintyScore = (item.uncertaintyScore && !isNaN(item.uncertaintyScore)) ? 
            Math.round(parseFloat(item.uncertaintyScore)) : '-';
        const hiScore = (item.hiScore && !isNaN(item.hiScore)) ? 
            Math.round(parseFloat(item.hiScore)) : '-';
        const twScore = (item.twScore && !isNaN(item.twScore)) ? 
            Math.round(parseFloat(item.twScore)) : '-';
        
        row.innerHTML = `
            <td>
                <a href="/admin-panel.html" style="color: #0286F7; text-decoration: none; font-weight: 500;">
                    ${item.name}
                </a>
            </td>
            <td>
                <span class="score-badge ${getScoreColorClass(customerFocusScore)}">
                    ${customerFocusScore}
                </span>
            </td>
            <td>
                <span class="score-badge ${getScoreColorClass(uncertaintyScore)}">
                    ${uncertaintyScore}
                </span>
            </td>
            <td>
                <span class="score-badge ${getScoreColorClass(hiScore)}">
                    ${hiScore}
                </span>
            </td>
            <td>
                <span class="score-badge ${getScoreColorClass(twScore)}">
                    ${twScore}
                </span>
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
    if (page < 1 || page > Math.ceil(totalItems / itemsPerPage)) {
        return;
    }
    currentPage = page;
    displayData();
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
        await loadData();
    } catch (error) {
        console.error('Sonuç silme hatası:', error);
        alert('Sonuç silinirken bir hata oluştu');
    }
}

// Filtreleme popup'ını göster
function showFilterPopup() {
    const popup = document.getElementById('filterPopup');
    popup.style.display = 'flex';
}

// Filtreleme popup'ını kapat
function closeFilterPopup() {
    const popup = document.getElementById('filterPopup');
    popup.style.display = 'none';
}

// Filtreleri uygula
function applyFilters() {
    try {
        const customerFocusMin = document.getElementById('customerFocusMin').value;
        const customerFocusMax = document.getElementById('customerFocusMax').value;
        const uncertaintyMin = document.getElementById('uncertaintyMin').value;
        const uncertaintyMax = document.getElementById('uncertaintyMax').value;
        const nameSearch = document.getElementById('nameSearch').value.toLowerCase();

        console.log('Filtreler:', {
            nameSearch,
            customerFocusMin,
            customerFocusMax,
            uncertaintyMin,
            uncertaintyMax
        });

        filteredData = allData.filter(item => {
            try {
                if (!item || !item.name) {
                    console.log('Name özelliği eksik:', item);
                    return false;
                }

                const itemName = item.name.toString().toLowerCase();
                const customerFocusScore = item.customerFocusScore === '-' ? null : parseFloat(item.customerFocusScore);
                const uncertaintyScore = item.uncertaintyScore === '-' ? null : parseFloat(item.uncertaintyScore);

                // İsim araması
                let nameMatch = true;
                if (nameSearch) {
                    nameMatch = itemName.includes(nameSearch);
                }

                // Müşteri Odaklılık Skoru filtresi
                let customerFocusMatch = true;
                if (customerFocusScore !== null) {
                    const min = parseFloat(customerFocusMin);
                    const max = parseFloat(customerFocusMax);
                    customerFocusMatch = customerFocusScore >= min && customerFocusScore <= max;
                }

                // Belirsizlik Yönetimi Skoru filtresi
                let uncertaintyMatch = true;
                if (uncertaintyScore !== null) {
                    const min = parseFloat(uncertaintyMin);
                    const max = parseFloat(uncertaintyMax);
                    uncertaintyMatch = uncertaintyScore >= min && uncertaintyScore <= max;
                }

                return nameMatch && customerFocusMatch && uncertaintyMatch;
            } catch (error) {
                console.error('Öğe filtreleme hatası:', error, item);
                return false;
            }
        });

        console.log('Filtrelenmiş veri sayısı:', filteredData.length);
        totalItems = filteredData.length;
        currentPage = 1;
        displayData();
        updatePagination();
        closeFilterPopup();
    } catch (error) {
        console.error('Filtreleme hatası:', error);
    }
}

// Filtreleri temizle
function clearFilters() {
    try {
        // Input ve select elementlerini temizle
        document.getElementById('nameSearch').value = '';
        document.getElementById('customerFocusMin').value = '0';
        document.getElementById('customerFocusMax').value = '100';
        document.getElementById('uncertaintyMin').value = '0';
        document.getElementById('uncertaintyMax').value = '100';
        document.getElementById('hiMin').value = '0';
        document.getElementById('hiMax').value = '100';
        document.getElementById('twMin').value = '0';
        document.getElementById('twMax').value = '100';
        document.getElementById('customerFocusMinValue').textContent = '0';
        document.getElementById('customerFocusMaxValue').textContent = '100';
        document.getElementById('uncertaintyMinValue').textContent = '0';
        document.getElementById('uncertaintyMaxValue').textContent = '100';
        document.getElementById('hiMinValue').textContent = '0';
        document.getElementById('hiMaxValue').textContent = '100';
        document.getElementById('twMinValue').textContent = '0';
        document.getElementById('twMaxValue').textContent = '100';

        // Range görünümünü güncelle
        ['customerFocus', 'uncertainty', 'hi', 'tw'].forEach(prefix => {
            const range = document.querySelector(`#${prefix}Min`).parentElement.querySelector('.range');
            const leftThumb = document.querySelector(`#${prefix}Min`).parentElement.querySelector('.thumb.left');
            const rightThumb = document.querySelector(`#${prefix}Min`).parentElement.querySelector('.thumb.right');

            range.style.left = '0%';
            range.style.right = '0%';
            leftThumb.style.left = '0%';
            rightThumb.style.right = '0%';
        });

        // Filtrelenmiş veriyi orijinal veriye eşitle
        filteredData = [...allData];
        
        // Sayfalama ve görüntülemeyi güncelle
        totalItems = filteredData.length;
        currentPage = 1;
        displayData();
        updatePagination();
        
        console.log('Filtreler temizlendi');
    } catch (error) {
        console.error('Filtre temizleme hatası:', error);
    }
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    loadData(true);
    
    // Multi-range input'ları başlat
    initMultiRange('customerFocus');
    initMultiRange('uncertainty');
    initMultiRange('hi');
    initMultiRange('tw');
});

// Multi-range input'ları başlat
function initMultiRange(prefix) {
    const minInput = document.getElementById(`${prefix}Min`);
    const maxInput = document.getElementById(`${prefix}Max`);
    const minValue = document.getElementById(`${prefix}MinValue`);
    const maxValue = document.getElementById(`${prefix}MaxValue`);
    const range = document.querySelector(`#${prefix}Min`).parentElement.querySelector('.range');
    const leftThumb = document.querySelector(`#${prefix}Min`).parentElement.querySelector('.thumb.left');
    const rightThumb = document.querySelector(`#${prefix}Min`).parentElement.querySelector('.thumb.right');

    function updateRange() {
        const min = parseInt(minInput.value);
        const max = parseInt(maxInput.value);
        
        if (min > max) {
            minInput.value = max;
            minValue.textContent = max;
        } else {
            minValue.textContent = min;
        }
        
        if (max < min) {
            maxInput.value = min;
            maxValue.textContent = min;
        } else {
            maxValue.textContent = max;
        }

        const minPercent = (min / 100) * 100;
        const maxPercent = (max / 100) * 100;
        
        range.style.left = `${minPercent}%`;
        range.style.right = `${100 - maxPercent}%`;
        leftThumb.style.left = `${minPercent}%`;
        rightThumb.style.right = `${100 - maxPercent}%`;
    }

    minInput.addEventListener('input', updateRange);
    maxInput.addEventListener('input', updateRange);

    // Thumb hover ve active efektleri
    [leftThumb, rightThumb].forEach(thumb => {
        thumb.addEventListener('mouseenter', () => thumb.classList.add('hover'));
        thumb.addEventListener('mouseleave', () => thumb.classList.remove('hover'));
        thumb.addEventListener('mousedown', () => thumb.classList.add('active'));
        thumb.addEventListener('mouseup', () => thumb.classList.remove('active'));
    });
}

function getScoreColorClass(score) {
    if (score === '-' || isNaN(score)) return '';
    const numScore = parseFloat(score);
    if (numScore <= 37) return 'red';
    if (numScore <= 65) return 'yellow';
    if (numScore <= 89.99999999999) return 'green';
    return 'red';
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
function downloadExcel() {
    try {
        // Tüm filtrelenmiş verileri al
        const dataToExport = filteredData.map(item => ({
            'Ad Soyad': item.name || '-',
            'Venus - MO': item.customerFocusScore || '-',
            'Venus - BY': item.uncertaintyScore || '-',
            'Titan - HI': item.hiScore || '-',
            'Titan - TW': item.twScore || '-'
        }));

        if (dataToExport.length === 0) {
            alert('İndirilecek veri bulunamadı!');
            return;
        }

        // SheetJS ile Excel dosyası oluştur
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);

        // Sütun genişliklerini ayarla
        const columnWidths = [
            { wch: 20 }, // Ad Soyad
            { wch: 15 }, // Venus - MO
            { wch: 15 }, // Venus - BY
            { wch: 15 }, // Titan - HI
            { wch: 15 }  // Titan - TW
        ];
        worksheet['!cols'] = columnWidths;

        // Çalışma sayfasını workbook'a ekle
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sonuçlar');

        // Dosya adı oluştur
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        const fileName = `sonuclar_${dateStr}_${timeStr}.xlsx`;

        // Excel dosyasını indir
        XLSX.writeFile(workbook, fileName);

    } catch (error) {
        console.error('Excel indirme hatası:', error);
        alert('Excel dosyası indirilirken bir hata oluştu!');
    }
} 