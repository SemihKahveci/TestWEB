/**
 * Frontend Utility Functions
 * Ortak kullanılan fonksiyonlar için merkezi dosya
 */

// API Response Handler
class ApiResponseHandler {
    static async handleResponse(response, errorMessage = 'İşlem başarısız') {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorMessage);
        }
        return response.json();
    }

    static handleSuccess(data, successMessage = 'İşlem başarılı') {
        if (data.success) {
            return {
                success: true,
                message: data.message || successMessage,
                data: data.data || data
            };
        } else {
            throw new Error(data.message || 'İşlem başarısız');
        }
    }

    static handleError(error, defaultMessage = 'Bir hata oluştu') {
        console.error('API Error:', error);
        return {
            success: false,
            message: error.message || defaultMessage
        };
    }
}

// UI Utility Functions
class UIUtils {
    static showAlert(message, type = 'info', duration = 3000) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        // Alert renkleri
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        alertDiv.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 300);
        }, duration);
    }

    static showLoading(elementId, message = 'Yükleniyor...') {
        const element = document.getElementById(elementId);
        if (element) {
            // Eğer element bir tbody ise, loading container kullan
            if (element.tagName === 'TBODY') {
                const table = element.closest('table');
                if (table) {
                    // Loading container yoksa oluştur
                    let loadingContainer = document.getElementById('loadingContainer');
                    if (!loadingContainer) {
                        loadingContainer = document.createElement('div');
                        loadingContainer.id = 'loadingContainer';
                        loadingContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center; padding: 40px; min-height: 200px;';
                        loadingContainer.innerHTML = `
                            <div class="loading-spinner"></div>
                            <div style="color: #666; font-size: 14px; margin-top: 16px; text-align: center;">${message}</div>
                        `;
                        table.parentNode.insertBefore(loadingContainer, table);
                    } else {
                        loadingContainer.style.display = 'flex';
                        // Mesajı güncelle
                        const messageDiv = loadingContainer.querySelector('div:last-child');
                        if (messageDiv) {
                            messageDiv.textContent = message;
                        }
                    }
                    table.style.display = 'none';
                }
            } else {
                // Diğer elementler için normal loading göster
                element.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 40px;">
                        <div class="loading-spinner"></div>
                        <div style="color: #666; font-size: 14px; text-align: center;">${message}</div>
                    </div>
                `;
            }
        }
    }

    static hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            // Eğer element bir tbody ise, loading container kullan
            if (element.tagName === 'TBODY') {
                const loadingContainer = document.getElementById('loadingContainer');
                const table = element.closest('table');
                if (loadingContainer) {
                    loadingContainer.style.display = 'none';
                }
                if (table) {
                    table.style.display = 'table';
                }
            } else {
                // Diğer elementler için normal temizleme
                element.innerHTML = '';
            }
        }
    }

    static formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Popup Management
class PopupManager {
    static showPopup(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            popup.style.display = 'flex';
        }
    }

    static hidePopup(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            popup.style.display = 'none';
        }
    }

    static showMessage(popupId, message, type = 'success') {
        const popup = document.getElementById(popupId);
        if (popup) {
            const messageDiv = popup.querySelector('.message') || popup;
            messageDiv.textContent = message;
            messageDiv.style.color = type === 'success' ? '#01A94D' : '#dc3545';
            messageDiv.style.display = 'block';
        }
    }

    static hideMessage(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            const messageDiv = popup.querySelector('.message') || popup;
            messageDiv.style.display = 'none';
            messageDiv.textContent = '';
        }
    }
}

// Data Processing Utilities
class DataUtils {
    static groupByEmail(data) {
        const groups = {};
        
        data.forEach(item => {
            const email = item.email ? item.email.toLowerCase() : 'no-email';
            if (!groups[email]) {
                groups[email] = [];
            }
            groups[email].push(item);
        });

        return Object.values(groups).map(group => {
            if (group.length === 1) {
                return group[0];
            } else {
                // En son tamamlanan oyunu ana öğe olarak al
                const sortedGroup = group.sort((a, b) => {
                    const dateA = new Date(a.completionDate || a.sentDate);
                    const dateB = new Date(b.completionDate || b.sentDate);
                    return dateB - dateA;
                });

                const mainItem = sortedGroup[0];
                return {
                    ...mainItem,
                    isGrouped: true,
                    groupCount: group.length,
                    allGroupItems: sortedGroup
                };
            }
        });
    }

    static filterData(data, filters) {
        return data.filter(item => {
            // İsim araması
            if (filters.nameSearch) {
                const itemName = (item.name || '').toLowerCase();
                if (!itemName.includes(filters.nameSearch.toLowerCase())) {
                    return false;
                }
            }

            // Skor filtreleri
            if (filters.customerFocusMin !== undefined && filters.customerFocusMax !== undefined) {
                const score = parseFloat(item.customerFocusScore);
                if (!isNaN(score) && (score < filters.customerFocusMin || score > filters.customerFocusMax)) {
                    return false;
                }
            }

            if (filters.uncertaintyMin !== undefined && filters.uncertaintyMax !== undefined) {
                const score = parseFloat(item.uncertaintyScore);
                if (!isNaN(score) && (score < filters.uncertaintyMin || score > filters.uncertaintyMax)) {
                    return false;
                }
            }

            if (filters.ieMin !== undefined && filters.ieMax !== undefined) {
                const score = parseFloat(item.ieScore);
                if (!isNaN(score) && (score < filters.ieMin || score > filters.ieMax)) {
                    return false;
                }
            }

            if (filters.idikMin !== undefined && filters.idikMax !== undefined) {
                const score = parseFloat(item.idikScore);
                if (!isNaN(score) && (score < filters.idikMin || score > filters.idikMax)) {
                    return false;
                }
            }

            // Durum filtresi
            if (filters.status && item.status !== filters.status) {
                return false;
            }

            return true;
        });
    }

    static paginateData(data, page, itemsPerPage) {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return {
            data: data.slice(startIndex, endIndex),
            totalPages: Math.ceil(data.length / itemsPerPage),
            currentPage: page,
            totalItems: data.length
        };
    }
}

// Form Utilities
class FormUtils {
    static getFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return {};

        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    static validateForm(formId, validations) {
        const form = document.getElementById(formId);
        if (!form) return { isValid: false, errors: ['Form bulunamadı'] };

        const errors = [];
        const data = this.getFormData(formId);

        for (const [field, validation] of Object.entries(validations)) {
            const value = data[field];
            
            if (validation.required && (!value || value.trim() === '')) {
                errors.push(`${validation.label || field} alanı zorunludur`);
            }
            
            if (validation.email && value && !UIUtils.validateEmail(value)) {
                errors.push(`${validation.label || field} geçerli bir e-posta adresi olmalıdır`);
            }
            
            if (validation.minLength && value && value.length < validation.minLength) {
                errors.push(`${validation.label || field} en az ${validation.minLength} karakter olmalıdır`);
            }
            
            if (validation.maxLength && value && value.length > validation.maxLength) {
                errors.push(`${validation.label || field} en fazla ${validation.maxLength} karakter olmalıdır`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            data
        };
    }

    static clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
    }
}

// Export utilities
window.ApiResponseHandler = ApiResponseHandler;
window.UIUtils = UIUtils;
window.PopupManager = PopupManager;
window.DataUtils = DataUtils;
window.FormUtils = FormUtils;
