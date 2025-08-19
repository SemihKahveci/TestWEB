// Sayfalama için gerekli değişkenler
let currentPage = 1;
const itemsPerPage = 10; // Her sayfada 10 kişi gösterilecek
let totalItems = 0;
let allData = [];
let filteredData = [];
let expandedGroups = new Set(); // Açık olan grupları takip et

// Yükleme göstergesi göster
function showLoadingIndicator() {
    const tbody = document.getElementById('resultsBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
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
            console.log('İlk sonuç örneği:', data.results[0]);
            
            // Sadece oynanmış oyunların sonuçlarını al (status === 'Tamamlandı' olanlar)
            // E-posta adreslerini küçük harfe çevir
            allData = data.results
                .filter(item => item.status === 'Tamamlandı')
                .map(item => ({
                    ...item,
                    email: item.email ? item.email.toLowerCase() : 'no-email'
                }));
            
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
                 
                 // IE ve IDIK elementlerini sıfırla (eğer varsa)
                 const ieMinElement = document.getElementById('ieMin');
                 const ieMaxElement = document.getElementById('ieMax');
                 const idikMinElement = document.getElementById('idikMin');
                 const idikMaxElement = document.getElementById('idikMax');
                 const ieMinValueElement = document.getElementById('ieMinValue');
                 const ieMaxValueElement = document.getElementById('ieMaxValue');
                 const idikMinValueElement = document.getElementById('idikMinValue');
                 const idikMaxValueElement = document.getElementById('idikMaxValue');
                 
                 if (ieMinElement) ieMinElement.value = '0';
                 if (ieMaxElement) ieMaxElement.value = '100';
                 if (idikMinElement) idikMinElement.value = '0';
                 if (idikMaxElement) idikMaxElement.value = '100';
                 if (ieMinValueElement) ieMinValueElement.textContent = '0';
                 if (ieMaxValueElement) ieMaxValueElement.textContent = '100';
                 if (idikMinValueElement) idikMinValueElement.textContent = '0';
                 if (idikMaxValueElement) idikMaxValueElement.textContent = '100';
                 
                 // Gruplandırılmış verileri oluştur
                 const groupedData = groupByEmail(allData);
                 filteredData = groupedData;
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
                        const ieScore = item.ieScore === '-' ? null : parseFloat(item.ieScore);
                        const idikScore = item.idikScore === '-' ? null : parseFloat(item.idikScore);

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

                                                 // IE Skoru filtresi
                         let ieMatch = true;
                         const ieMinElement = document.getElementById('ieMin');
                         const ieMaxElement = document.getElementById('ieMax');
                         if (ieScore !== null && ieMinElement && ieMaxElement) {
                             const min = parseFloat(ieMinElement.value);
                             const max = parseFloat(ieMaxElement.value);
                             ieMatch = ieScore >= min && ieScore <= max;
                         }

                         // IDIK Skoru filtresi
                         let idikMatch = true;
                         const idikMinElement = document.getElementById('idikMin');
                         const idikMaxElement = document.getElementById('idikMax');
                         if (idikScore !== null && idikMinElement && idikMaxElement) {
                             const min = parseFloat(idikMinElement.value);
                             const max = parseFloat(idikMaxElement.value);
                             idikMatch = idikScore >= min && idikScore <= max;
                         }

                        return nameMatch && customerFocusMatch && uncertaintyMatch && ieMatch && idikMatch;
                    } catch (error) {
                        console.error('Öğe filtreleme hatası:', error, item);
                        return false;
                    }
                });
                
                // Filtrelenmiş verileri gruplandır
                const groupedData = groupByEmail(filteredData);
                filteredData = groupedData;
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

        // Gruplandırılmış satır için özel stil
        if (item.isGrouped && item.groupCount > 1) {
            const row = document.createElement('tr');
            row.classList.add('grouped-row');
            const normalizedEmail = item.email.toLowerCase();
            row.setAttribute('data-email', normalizedEmail);
            
            const customerFocusScore = (item.customerFocusScore && !isNaN(item.customerFocusScore)) ? 
                Math.round(parseFloat(item.customerFocusScore)) : '-';
            const uncertaintyScore = (item.uncertaintyScore && !isNaN(item.uncertaintyScore)) ? 
                Math.round(parseFloat(item.uncertaintyScore)) : '-';
            const ieScore = (item.ieScore && !isNaN(item.ieScore)) ? 
                Math.round(parseFloat(item.ieScore)) : '-';
            const idikScore = (item.idikScore && !isNaN(item.idikScore)) ? 
                Math.round(parseFloat(item.idikScore)) : '-';
            
            // Eğer grup açıksa - işareti göster, değilse + işareti göster
            const isExpanded = expandedGroups.has(normalizedEmail);
            const expandIcon = isExpanded ? '-' : '+';
            
                         row.innerHTML = `
                 <td>
                     <span class="expand-icon" onclick="toggleGroup('${normalizedEmail}')">${expandIcon}</span>
                     <a href="/admin-panel.html" style="color: #0286F7; text-decoration: none; font-weight: 500;">
                         ${item.name}
                     </a>
                     <span class="group-count">(${item.groupCount} sonuç)</span>
                 </td>
                 <td>
                     <span style="color: #666; font-size: 12px;">
                         ${formatDate(item.sentDate)}
                     </span>
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
                     <span class="score-badge ${getScoreColorClass(ieScore)}">
                         ${ieScore}
                     </span>
                 </td>
                 <td>
                     <span class="score-badge ${getScoreColorClass(idikScore)}">
                         ${idikScore}
                     </span>
                 </td>
             `;
            tbody.appendChild(row);

            // Alt satırları oluştur
            if (item.isGrouped && item.groupCount > 1) {
                                 item.allGroupItems.slice(1).forEach(groupItem => {
                     const subRow = document.createElement('tr');
                     subRow.classList.add('sub-row');
                     subRow.setAttribute('data-parent-email', normalizedEmail);
                    
                    // Eğer grup açıksa alt satırları göster, değilse gizle
                    if (!isExpanded) {
                        subRow.classList.add('hidden');
                    }
                    
                    const subCustomerFocusScore = (groupItem.customerFocusScore && !isNaN(groupItem.customerFocusScore)) ? 
                        Math.round(parseFloat(groupItem.customerFocusScore)) : '-';
                    const subUncertaintyScore = (groupItem.uncertaintyScore && !isNaN(groupItem.uncertaintyScore)) ? 
                        Math.round(parseFloat(groupItem.uncertaintyScore)) : '-';
                    const subIeScore = (groupItem.ieScore && !isNaN(groupItem.ieScore)) ? 
                        Math.round(parseFloat(groupItem.ieScore)) : '-';
                    const subIdikScore = (groupItem.idikScore && !isNaN(groupItem.idikScore)) ? 
                        Math.round(parseFloat(groupItem.idikScore)) : '-';
                    
                                         subRow.innerHTML = `
                         <td style="padding-left: 30px;">
                             <a href="/admin-panel.html" style="color: #0286F7; text-decoration: none; font-weight: 500;">
                                 ${groupItem.name}
                             </a>
                         </td>
                         <td>
                             <span style="color: #666; font-size: 12px;">
                                 ${formatDate(groupItem.sentDate)}
                             </span>
                         </td>
                         <td>
                             <span class="score-badge ${getScoreColorClass(subCustomerFocusScore)}">
                                 ${subCustomerFocusScore}
                             </span>
                         </td>
                         <td>
                             <span class="score-badge ${getScoreColorClass(subUncertaintyScore)}">
                                 ${subUncertaintyScore}
                             </span>
                         </td>
                         <td>
                             <span class="score-badge ${getScoreColorClass(subIeScore)}">
                                 ${subIeScore}
                             </span>
                         </td>
                         <td>
                             <span class="score-badge ${getScoreColorClass(subIdikScore)}">
                                 ${subIdikScore}
                             </span>
                         </td>
                     `;
                    tbody.appendChild(subRow);
                });
            }
        } else {
            // Normal satır
            const row = document.createElement('tr');
            
            const customerFocusScore = (item.customerFocusScore && !isNaN(item.customerFocusScore)) ? 
                Math.round(parseFloat(item.customerFocusScore)) : '-';
            const uncertaintyScore = (item.uncertaintyScore && !isNaN(item.uncertaintyScore)) ? 
                Math.round(parseFloat(item.uncertaintyScore)) : '-';
            const ieScore = (item.ieScore && !isNaN(item.ieScore)) ? 
                Math.round(parseFloat(item.ieScore)) : '-';
            const idikScore = (item.idikScore && !isNaN(item.idikScore)) ? 
                Math.round(parseFloat(item.idikScore)) : '-';
            
                         row.innerHTML = `
                 <td>
                     <a href="/admin-panel.html" style="color: #0286F7; text-decoration: none; font-weight: 500;">
                         ${item.name}
                     </a>
                 </td>
                 <td>
                     <span style="color: #666; font-size: 12px;">
                         ${formatDate(item.sentDate)}
                     </span>
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
                     <span class="score-badge ${getScoreColorClass(ieScore)}">
                         ${ieScore}
                     </span>
                 </td>
                 <td>
                     <span class="score-badge ${getScoreColorClass(idikScore)}">
                         ${idikScore}
                     </span>
                 </td>
             `;
            tbody.appendChild(row);
        }
    });
    
    // Açık olan grupları tekrar aç
    restoreExpandedGroups();
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

        const filteredItems = allData.filter(item => {
            try {
                if (!item || !item.name) {
                    console.log('Name özelliği eksik:', item);
                    return false;
                }

                const itemName = item.name.toString().toLowerCase();
                const customerFocusScore = item.customerFocusScore === '-' ? null : parseFloat(item.customerFocusScore);
                const uncertaintyScore = item.uncertaintyScore === '-' ? null : parseFloat(item.uncertaintyScore);
                const ieScore = item.ieScore === '-' ? null : parseFloat(item.ieScore);
                const idikScore = item.idikScore === '-' ? null : parseFloat(item.idikScore);

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

                // IE Skoru filtresi
                let ieMatch = true;
                const ieMinElement = document.getElementById('ieMin');
                const ieMaxElement = document.getElementById('ieMax');
                if (ieScore !== null && ieMinElement && ieMaxElement) {
                    const min = parseFloat(ieMinElement.value);
                    const max = parseFloat(ieMaxElement.value);
                    ieMatch = ieScore >= min && ieScore <= max;
                }

                // IDIK Skoru filtresi
                let idikMatch = true;
                const idikMinElement = document.getElementById('idikMin');
                const idikMaxElement = document.getElementById('idikMax');
                if (idikScore !== null && idikMinElement && idikMaxElement) {
                    const min = parseFloat(idikMinElement.value);
                    const max = parseFloat(idikMaxElement.value);
                    idikMatch = idikScore >= min && idikScore <= max;
                }

                return nameMatch && customerFocusMatch && uncertaintyMatch && ieMatch && idikMatch;
            } catch (error) {
                console.error('Öğe filtreleme hatası:', error, item);
                return false;
            }
        });

        // Filtrelenmiş verileri gruplandır
        const groupedData = groupByEmail(filteredItems);
        filteredData = groupedData;

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
        
        const ieMinElement = document.getElementById('ieMin');
        const ieMaxElement = document.getElementById('ieMax');
        const idikMinElement = document.getElementById('idikMin');
        const idikMaxElement = document.getElementById('idikMax');
        const ieMinValueElement = document.getElementById('ieMinValue');
        const ieMaxValueElement = document.getElementById('ieMaxValue');
        const idikMinValueElement = document.getElementById('idikMinValue');
        const idikMaxValueElement = document.getElementById('idikMaxValue');
        
        if (ieMinElement) ieMinElement.value = '0';
        if (ieMaxElement) ieMaxElement.value = '100';
        if (idikMinElement) idikMinElement.value = '0';
        if (idikMaxElement) idikMaxElement.value = '100';
        
        document.getElementById('customerFocusMinValue').textContent = '0';
        document.getElementById('customerFocusMaxValue').textContent = '100';
        document.getElementById('uncertaintyMinValue').textContent = '0';
        document.getElementById('uncertaintyMaxValue').textContent = '100';
        
        if (ieMinValueElement) ieMinValueElement.textContent = '0';
        if (ieMaxValueElement) ieMaxValueElement.textContent = '100';
        if (idikMinValueElement) idikMinValueElement.textContent = '0';
        if (idikMaxValueElement) idikMaxValueElement.textContent = '100';

                 // Range görünümünü güncelle
         ['customerFocus', 'uncertainty'].forEach(prefix => {
             const minElement = document.querySelector(`#${prefix}Min`);
             if (minElement && minElement.parentElement) {
                 const range = minElement.parentElement.querySelector('.range');
                 const leftThumb = minElement.parentElement.querySelector('.thumb.left');
                 const rightThumb = minElement.parentElement.querySelector('.thumb.right');

                 if (range) range.style.left = '0%';
                 if (range) range.style.right = '0%';
                 if (leftThumb) leftThumb.style.left = '0%';
                 if (rightThumb) rightThumb.style.right = '0%';
             }
         });
         
         // IE ve IDIK range'lerini güncelle (eğer varsa)
         ['ie', 'idik'].forEach(prefix => {
             const minElement = document.querySelector(`#${prefix}Min`);
             if (minElement && minElement.parentElement) {
                 const range = minElement.parentElement.querySelector('.range');
                 const leftThumb = minElement.parentElement.querySelector('.thumb.left');
                 const rightThumb = minElement.parentElement.querySelector('.thumb.right');

                 if (range) range.style.left = '0%';
                 if (range) range.style.right = '0%';
                 if (leftThumb) leftThumb.style.left = '0%';
                 if (rightThumb) rightThumb.style.right = '0%';
             }
         });

        // Filtrelenmiş veriyi orijinal veriye eşitle ve gruplandır
        const groupedData = groupByEmail(allData);
        filteredData = groupedData;
        
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
     
     // IE ve IDIK elementleri varsa başlat
     if (document.getElementById('ieMin')) {
         initMultiRange('ie');
     }
     if (document.getElementById('idikMin')) {
         initMultiRange('idik');
     }
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
        const groupedData = groupByEmail(allData);
        filteredData = groupedData;
    } else {
        // Arama terimini ad soyad sütununda ara
        const filteredItems = allData.filter(item => {
            const name = (item.name || '').toLowerCase();
            return name.includes(searchTerm);
        });
        const groupedData = groupByEmail(filteredItems);
        filteredData = groupedData;
    }
    
    // Sayfalama sıfırla
    currentPage = 1;
    totalItems = filteredData.length;
    
    // Tabloyu güncelle
    displayData();
    updatePagination();
}

// Eksik skorları güncelle
async function updateMissingScores() {
    try {
        console.log('Eksik skorlar güncelleniyor...');
        
        const response = await fetch('/api/update-missing-scores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Skor güncelleme hatası');
        }

        const data = await response.json();
        
        if (data.success) {
            console.log('Skorlar güncellendi:', data.message);
            alert(`Skorlar başarıyla güncellendi! ${data.updatedCount} kayıt güncellendi.`);
            
            // Verileri yeniden yükle
            await loadData(true);
        } else {
            alert('Skorlar güncellenirken bir hata oluştu!');
        }
    } catch (error) {
        console.error('Skor güncelleme hatası:', error);
        alert('Skorlar güncellenirken bir hata oluştu!');
    }
}

// Excel indirme fonksiyonu
function downloadExcel() {
    try {
        // Tüm sonuçları al (gruplandırılmamış, sadece tamamlanmış oyunlar)
        let dataToExport = allData
            .filter(item => item.status === 'Tamamlandı')
            .map(item => ({
                'Ad Soyad': item.name || '-',
                'E-posta': item.email || '-',
                'Tamamlanma Tarihi': formatDate(item.sentDate) || '-',
                'Venus - Müşteri Odaklılık': item.customerFocusScore || '-',
                'Venus - Belirsizlik Yönetimi': item.uncertaintyScore || '-',
                'Titan - İnsanları Etkileme': item.ieScore || '-',
                'Titan - Güven Veren İşbirlikçi ve Sinerji': item.idikScore || '-'
            }));

        // Eğer filtreler uygulanmışsa, filtrelenmiş verileri kullan
        if (filteredData.length !== allData.length) {
            // Filtrelenmiş verilerden tüm sonuçları al
            const filteredEmails = new Set();
            filteredData.forEach(item => {
                if (item.isGrouped && item.allGroupItems) {
                    // Gruplandırılmış veriler için tüm alt öğeleri ekle
                    item.allGroupItems.forEach(groupItem => {
                        filteredEmails.add(groupItem.email.toLowerCase());
                    });
                } else {
                    filteredEmails.add(item.email.toLowerCase());
                }
            });

            // Sadece filtrelenmiş e-posta adreslerine ait sonuçları al
            dataToExport = allData
                .filter(item => item.status === 'Tamamlandı' && filteredEmails.has(item.email.toLowerCase()))
                .map(item => ({
                    'Ad Soyad': item.name || '-',
                    'E-posta': item.email || '-',
                    'Tamamlanma Tarihi': formatDate(item.sentDate) || '-',
                    'Venus - Müşteri Odaklılık': item.customerFocusScore || '-',
                    'Venus - Belirsizlik Yönetimi': item.uncertaintyScore || '-',
                    'Titan - İnsanları Etkileme': item.ieScore || '-',
                    'Titan - Güven Veren İşbirlikçi ve Sinerji': item.idikScore || '-'
                }));
        }

        if (dataToExport.length === 0) {
            alert('İndirilecek veri bulunamadı!');
            return;
        }

        // Verileri tarihe göre sırala (en yeni üstte)
        dataToExport.sort((a, b) => {
            const dateA = new Date(a['Tamamlanma Tarihi'] === '-' ? 0 : a['Tamamlanma Tarihi']);
            const dateB = new Date(b['Tamamlanma Tarihi'] === '-' ? 0 : b['Tamamlanma Tarihi']);
            return dateB - dateA;
        });

        // SheetJS ile Excel dosyası oluştur
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);

        // Sütun genişliklerini ayarla
        const columnWidths = [
            { wch: 20 }, // Ad Soyad
            { wch: 30 }, // E-posta
            { wch: 20 }, // Tamamlanma Tarihi
            { wch: 25 }, // Venus - Müşteri Odaklılık
            { wch: 25 }, // Venus - Belirsizlik Yönetimi
            { wch: 25 }, // Titan - İnsanları Etkileme
            { wch: 35 }  // Titan - Güven Veren İşbirlikçi ve Sinerji
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

        console.log(`Excel dosyası indirildi. Toplam ${dataToExport.length} sonuç eklendi.`);

    } catch (error) {
        console.error('Excel indirme hatası:', error);
        alert('Excel dosyası indirilirken bir hata oluştu!');
    }
}

// Aynı e-posta adresine sahip kişileri grupla
function groupByEmail(data) {
    const emailGroups = {};
    
    // Verileri e-posta adresine göre grupla (e-posta adresleri zaten küçük harf)
    data.forEach(item => {
        const email = (item.email || 'no-email').toLowerCase();
        if (!emailGroups[email]) {
            emailGroups[email] = [];
        }
        emailGroups[email].push(item);
    });
    
    // Her grup içindeki verileri tarihe göre sırala (en yeni üstte)
    Object.keys(emailGroups).forEach(email => {
        emailGroups[email].sort((a, b) => new Date(b.sentDate || 0) - new Date(a.sentDate || 0));
    });
    
    // Gruplandırılmış verileri düzleştir
    const groupedData = [];
    Object.keys(emailGroups).forEach(email => {
        const group = emailGroups[email];
        if (group.length === 1) {
            // Tek sonuç varsa normal göster
            groupedData.push({
                ...group[0],
                isGrouped: false,
                groupCount: 1
            });
        } else {
            // Birden fazla sonuç varsa gruplandır
            const latestItem = group[0]; // En yeni olan
            
            groupedData.push({
                ...latestItem,
                isGrouped: true,
                groupCount: group.length,
                allGroupItems: group
            });
        }
    });
    
    return groupedData;
}

// Açık olan grupları tekrar aç
function restoreExpandedGroups() {
    expandedGroups.forEach(email => {
        const normalizedEmail = email.toLowerCase();
        const expandIcon = document.querySelector(`tr[data-email="${normalizedEmail}"] .expand-icon`);
        const subRows = document.querySelectorAll(`tr[data-parent-email="${normalizedEmail}"]`);
        
        if (expandIcon && subRows.length > 0) {
            subRows.forEach(row => {
                row.classList.remove('hidden');
                row.style.display = ''; // CSS display özelliğini de sıfırla
            });
            expandIcon.textContent = '-';
        }
    });
}

// Grup açma/kapama fonksiyonu
function toggleGroup(email) {
    const expandIcon = event.target;
    const normalizedEmail = email.toLowerCase();
    const subRows = document.querySelectorAll(`tr[data-parent-email="${normalizedEmail}"]`);
    const isExpanded = !subRows[0].classList.contains('hidden');
    
    if (isExpanded) {
        // Grubu kapat
        subRows.forEach(row => row.classList.add('hidden'));
        expandIcon.textContent = '+';
        expandedGroups.delete(normalizedEmail);
    } else {
        // Grubu aç
        subRows.forEach(row => row.classList.remove('hidden'));
        expandIcon.textContent = '-';
        expandedGroups.add(normalizedEmail);
    }
} 