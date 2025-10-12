import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizationAPI } from '../services/api';
import * as XLSX from 'xlsx';

interface Organization {
  _id: string;
  genelMudurYardimciligi?: string;
  direktörlük?: string;
  müdürlük?: string;
  grupLiderligi?: string;
  pozisyon?: string;
}

const Organization: React.FC = () => {
  // CSS animasyonu için style tag'i ekle
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showImportPopup, setShowImportPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    genelMudurYardimciligi: '',
    direktörlük: '',
    müdürlük: '',
    grupLiderligi: '',
    pozisyon: ''
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Responsive kontrolü
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    const checkIsMobile = () => {
      setIsMobile(mediaQuery.matches);
    };
    
    checkIsMobile();
    mediaQuery.addEventListener('change', checkIsMobile);
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      mediaQuery.removeEventListener('change', checkIsMobile);
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, []);

  // Debounce search term
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadOrganizations = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Organizasyonlar yükleniyor...');
      
      const result = await organizationAPI.getAll();
      console.log('✅ Organizasyonlar yüklendi:', result);
      
      if (result.data.success) {
        setOrganizations(result.data.organizations || []);
      } else {
        throw new Error(result.data.message || 'Organizasyon listesi alınamadı');
      }
    } catch (error: any) {
      console.error('💥 Organizasyon yükleme hatası:', error);
      setErrorMessage('Organizasyonlar yüklenirken bir hata oluştu');
      setShowErrorPopup(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOrganization = () => {
    setFormData({
      genelMudurYardimciligi: '',
      direktörlük: '',
      müdürlük: '',
      grupLiderligi: '',
      pozisyon: ''
    });
    setShowAddPopup(true);
  };

  const handleEditOrganization = (organization: Organization) => {
    setSelectedOrganization(organization);
    setFormData({
      genelMudurYardimciligi: organization.genelMudurYardimciligi || '',
      direktörlük: organization.direktörlük || '',
      müdürlük: organization.müdürlük || '',
      grupLiderligi: organization.grupLiderligi || '',
      pozisyon: organization.pozisyon || ''
    });
    setShowEditPopup(true);
  };

  const handleDeleteOrganization = (organization: Organization) => {
    setSelectedOrganization(organization);
    setShowDeletePopup(true);
  };

  const handleSubmitAdd = async () => {
    try {
      setIsSubmitting(true);
      
      // Form validasyonu
      if (!formData.genelMudurYardimciligi || formData.genelMudurYardimciligi.trim() === '') {
        setErrorMessage('Genel Müdür Yardımcılığı alanı boş olamaz!');
        setShowErrorPopup(true);
        return;
      }
      
      if (!formData.pozisyon || formData.pozisyon.trim() === '') {
        setErrorMessage('Pozisyon alanı boş olamaz!');
        setShowErrorPopup(true);
        return;
      }
      
      // Diğer alanları temizle - boş olanları "-" yap, "-" olanları olduğu gibi bırak
      const cleanedFormData = {
        genelMudurYardimciligi: formData.genelMudurYardimciligi.trim(),
        direktörlük: formData.direktörlük.trim() === '' ? '-' : formData.direktörlük.trim(),
        müdürlük: formData.müdürlük.trim() === '' ? '-' : formData.müdürlük.trim(),
        grupLiderligi: formData.grupLiderligi.trim() === '' ? '-' : formData.grupLiderligi.trim(),
        pozisyon: formData.pozisyon.trim()
      };
      
      // Birebir aynı satır kontrolü
      const isDuplicate = organizations.some(org => 
        org.genelMudurYardimciligi === cleanedFormData.genelMudurYardimciligi &&
        org.direktörlük === cleanedFormData.direktörlük &&
        org.müdürlük === cleanedFormData.müdürlük &&
        org.grupLiderligi === cleanedFormData.grupLiderligi &&
        org.pozisyon === cleanedFormData.pozisyon
      );
      
      if (isDuplicate) {
        setErrorMessage('Bu organizasyon yapısı zaten mevcut! Aynı bilgilerle tekrar ekleyemezsiniz.');
        setShowErrorPopup(true);
        return;
      }
      
      console.log('🔄 Yeni organizasyon ekleniyor:', cleanedFormData);
      
      const result = await organizationAPI.create(cleanedFormData);
      console.log('✅ Organizasyon başarıyla eklendi:', result);
      
      // Yeni organizasyonu listeye ekle
      setOrganizations(prev => [...prev, result.data.organization]);
      
      // Başarı mesajı göster
      setShowAddPopup(false);
      setShowSuccessPopup(true);
      setSuccessMessage('Organizasyon başarıyla eklendi!');
    } catch (error: any) {
      console.error('💥 Organizasyon ekleme hatası:', error);
      setErrorMessage(error.response?.data?.message || 'Organizasyon eklenirken bir hata oluştu');
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    try {
      if (!selectedOrganization) return;
      setIsSubmitting(true);
      
      // Form validasyonu
      if (!formData.genelMudurYardimciligi || formData.genelMudurYardimciligi.trim() === '') {
        setErrorMessage('Genel Müdür Yardımcılığı alanı boş olamaz!');
        setShowErrorPopup(true);
        return;
      }
      
      if (!formData.pozisyon || formData.pozisyon.trim() === '') {
        setErrorMessage('Pozisyon alanı boş olamaz!');
        setShowErrorPopup(true);
        return;
      }
      
      // Diğer alanları temizle - boş olanları "-" yap, "-" olanları olduğu gibi bırak
      const cleanedFormData = {
        genelMudurYardimciligi: formData.genelMudurYardimciligi.trim(),
        direktörlük: formData.direktörlük.trim() === '' ? '-' : formData.direktörlük.trim(),
        müdürlük: formData.müdürlük.trim() === '' ? '-' : formData.müdürlük.trim(),
        grupLiderligi: formData.grupLiderligi.trim() === '' ? '-' : formData.grupLiderligi.trim(),
        pozisyon: formData.pozisyon.trim()
      };
      
      // Birebir aynı satır kontrolü (kendi kaydı hariç)
      const isDuplicate = organizations.some(org => 
        org._id !== selectedOrganization._id &&
        org.genelMudurYardimciligi === cleanedFormData.genelMudurYardimciligi &&
        org.direktörlük === cleanedFormData.direktörlük &&
        org.müdürlük === cleanedFormData.müdürlük &&
        org.grupLiderligi === cleanedFormData.grupLiderligi &&
        org.pozisyon === cleanedFormData.pozisyon
      );
      
      if (isDuplicate) {
        setErrorMessage('Bu organizasyon yapısı zaten mevcut! Aynı bilgilerle tekrar ekleyemezsiniz.');
        setShowErrorPopup(true);
        return;
      }
      
      console.log('🔄 Organizasyon güncelleniyor:', selectedOrganization._id, cleanedFormData);
      
      const result = await organizationAPI.update(selectedOrganization._id, cleanedFormData);
      console.log('✅ Organizasyon başarıyla güncellendi:', result);
      
      // Güncellenen organizasyonu listede güncelle
      setOrganizations(prev => prev.map(org => 
        org._id === selectedOrganization._id ? result.data.organization : org
      ));
      
      // Başarı mesajı göster
      setShowEditPopup(false);
      setShowSuccessPopup(true);
      setSuccessMessage('Organizasyon başarıyla güncellendi!');
    } catch (error: any) {
      console.error('💥 Organizasyon güncelleme hatası:', error);
      setErrorMessage(error.response?.data?.message || 'Organizasyon güncellenirken bir hata oluştu');
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (!selectedOrganization) return;
      setIsSubmitting(true);
      console.log('🔄 Organizasyon siliniyor:', selectedOrganization._id);
      
      await organizationAPI.delete(selectedOrganization._id);
      console.log('✅ Organizasyon başarıyla silindi');
      
      // Silinen organizasyonu listeden çıkar
      setOrganizations(prev => prev.filter(org => org._id !== selectedOrganization._id));
      
      // Başarı mesajı göster
      setShowDeletePopup(false);
      setShowSuccessPopup(true);
      setSuccessMessage('Organizasyon başarıyla silindi!');
    } catch (error: any) {
      console.error('💥 Organizasyon silme hatası:', error);
      setErrorMessage(error.response?.data?.message || 'Organizasyon silinirken bir hata oluştu');
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter organizations based on search term
  const filteredOrganizations = organizations.filter(org => {
    const searchLower = debouncedSearchTerm.toLowerCase();
    return (
      (org.genelMudurYardimciligi && org.genelMudurYardimciligi.toLowerCase().includes(searchLower)) ||
      (org.direktörlük && org.direktörlük.toLowerCase().includes(searchLower)) ||
      (org.müdürlük && org.müdürlük.toLowerCase().includes(searchLower)) ||
      (org.grupLiderligi && org.grupLiderligi.toLowerCase().includes(searchLower)) ||
      (org.pozisyon && org.pozisyon.toLowerCase().includes(searchLower))
    );
  });

  // Highlight search term in text
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} style={{ 
          backgroundColor: '#FEF3C7', 
          color: '#92400E',
          fontWeight: '600',
          padding: '2px 4px',
          borderRadius: '4px'
        }}>
          {part}
        </span>
      ) : part
    );
  };

  // Pagination
  const totalPages = Math.ceil(filteredOrganizations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrganizations = filteredOrganizations.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Excel Import Functions
  const handleOpenImportPopup = () => {
    setShowImportPopup(true);
    setSelectedFile(null);
  };

  const handleCloseImportPopup = () => {
    setShowImportPopup(false);
    setSelectedFile(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.style.borderColor = '#3B82F6';
    event.currentTarget.style.backgroundColor = '#EFF6FF';
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.style.borderColor = '#D1D5DB';
    event.currentTarget.style.backgroundColor = '#FAFAFA';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.style.borderColor = '#D1D5DB';
    event.currentTarget.style.backgroundColor = '#FAFAFA';
    
    const file = event.dataTransfer.files[0];
    if (file) {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
      } else {
        setErrorMessage('Lütfen sadece Excel dosyası (.xlsx, .xls) seçin!');
        setShowErrorPopup(true);
      }
    }
  };

  const downloadTemplate = () => {
    try {
      // Excel template verilerini oluştur
      const headers = [
        'Genel Müdür Yardımcılığı',
        'Direktörlük',
        'Müdürlük',
        'Grup Liderliği',
        'Pozisyon'
      ];

      // Örnek veri satırı
      const exampleRow = [
        'Örnek Genel Müdür Yardımcılığı',
        'Örnek Direktörlük',
        'Örnek Müdürlük',
        'Örnek Grup Liderliği',
        'Örnek Pozisyon'
      ];

      // Boş satırlar için veri
      const emptyRows: string[][] = [];
      for (let i = 0; i < 10; i++) {
        emptyRows.push(['', '', '', '', '']);
      }

      // Tüm veriyi birleştir
      const allData = [headers, exampleRow, ...emptyRows];

      // Excel workbook oluştur
      const wb = XLSX.utils.book_new();
      
      // Worksheet oluştur
      const ws = XLSX.utils.aoa_to_sheet(allData);
      
      // Sütun genişliklerini ayarla
      ws['!cols'] = [
        { wch: 25 }, // Genel Müdür Yardımcılığı
        { wch: 20 }, // Direktörlük
        { wch: 20 }, // Müdürlük
        { wch: 20 }, // Grup Liderliği
        { wch: 20 }  // Pozisyon
      ];

      // Worksheet'i workbook'a ekle
      XLSX.utils.book_append_sheet(wb, ws, "Organizasyon Template");

      // Excel dosyasını indir
      XLSX.writeFile(wb, 'organizasyon_template.xlsx');
      
      setSuccessMessage('Excel template başarıyla indirildi!');
      setShowSuccessPopup(true);
      
    } catch (error) {
      console.error('Template indirme hatası:', error);
      setErrorMessage('Template indirilirken bir hata oluştu!');
      setShowErrorPopup(true);
    }
  };

  const handleImportExcel = async () => {
    if (!selectedFile) {
      setErrorMessage('Lütfen önce bir Excel dosyası seçin!');
      setShowErrorPopup(true);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append('excelFile', selectedFile);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/organization/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      // HTTP status koduna göre hata yönetimi
      if (!response.ok) {
        if (response.status === 401) {
          setErrorMessage('Yetkiniz bulunmuyor. Lütfen tekrar giriş yapın.');
          setShowErrorPopup(true);
          return;
        } else if (response.status === 413) {
          setErrorMessage('Dosya çok büyük. Lütfen daha küçük bir dosya seçin.');
          setShowErrorPopup(true);
          return;
        } else if (response.status === 400) {
          // Backend'den gelen detaylı hata mesajını kullan
          const errorResult = await response.json();
          let errorMessage = errorResult.message || 'Dosya formatı hatalı. Lütfen geçerli bir Excel dosyası seçin.';
          if (errorResult.errors && errorResult.errors.length > 0) {
            errorMessage += '\n\nDetaylar:\n';
            errorResult.errors.forEach((error: any) => {
              errorMessage += `• Satır ${error.row}: ${error.message}\n`;
            });
          }
          setErrorMessage(errorMessage);
          setShowErrorPopup(true);
          return;
        } else {
          setErrorMessage(`Sunucu hatası (${response.status}). Lütfen tekrar deneyin.`);
          setShowErrorPopup(true);
          return;
        }
      }

      const result = await response.json();
      
      if (result.success) {
        let message = result.message;
        
        // Hatalı satırlar varsa onları da göster
        if (result.errors && result.errors.length > 0) {
          message += `\n\nHatalı satırlar:\n`;
          result.errors.forEach((error: any) => {
            message += `• Satır ${error.row}: ${error.message}\n`;
          });
          
          // Hata varsa success popup yerine error popup göster
          setErrorMessage(message);
          setShowErrorPopup(true);
          setShowImportPopup(false);
          return; // Verileri yenileme
        }
        
        setSuccessMessage(message);
        setShowSuccessPopup(true);
        setShowImportPopup(false);
        loadOrganizations(); // Verileri yenile
      } else {
        let errorMessage = result.message || 'Excel dosyası işlenirken bir hata oluştu';
        
        // Detaylı hata mesajları varsa onları da göster
        if (result.errors && result.errors.length > 0) {
          errorMessage += '\n\nDetaylar:\n';
          result.errors.forEach((error: any) => {
            errorMessage += `• Satır ${error.row}: ${error.message}\n`;
          });
        }
        
        setErrorMessage(errorMessage);
        setShowErrorPopup(true);
      }

    } catch (error: any) {
      console.error('Import hatası:', error);
      
      let errorMessage = 'Excel dosyası işlenirken bir hata oluştu';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.';
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }
      
      setErrorMessage(errorMessage);
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '16px',
        color: '#6B7280'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #E5E7EB',
            borderTop: '4px solid #3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <div>Organizasyonlar yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: 'Inter, sans-serif',
      background: '#F8F9FA',
      minHeight: '100vh',
      padding: '24px 32px 0 10px'
    }}>
      {/* Page Title - Mavi Box */}
      <div style={{
        width: '100%',
        height: '75px',
        background: 'radial-gradient(ellipse 150.93% 36.28% at 50.00% 50.00%, #3B8AFF 0%, #0048B2 100%)',
        borderBottomRightRadius: '16px',
        borderBottomLeftRadius: '16px',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: '0 32px',
        marginLeft: '0px',
        marginBottom: '20px'
      }}>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center'
          }}>
            <div style={{
              color: 'white',
              fontSize: '30px',
              fontFamily: 'Inter',
              fontWeight: 700
            }}>
              Organizasyon
            </div>
          </div>
        </div>

        {/* Tab Container */}
        <div style={{
          display: 'flex',
          gap: '30px',
          marginBottom: '20px'
        }}>
          <div style={{
            flex: 1,
            padding: '16px',
            borderRadius: '6px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: '#3A57E8',
            color: 'white',
            fontSize: '14px',
            fontWeight: 700,
            lineHeight: '20px'
          }}>
            Organizasyon
          </div>
          <div 
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '6px',
              textAlign: 'center',
              cursor: 'pointer',
              border: '1px solid rgba(0, 0, 0, 0.30)',
              color: 'rgba(0, 0, 0, 0.30)',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: '20px'
            }}
            onClick={() => navigate('/grouping')}
          >
            Gruplama
          </div>
          <div 
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '6px',
              textAlign: 'center',
              cursor: 'pointer',
              border: '1px solid rgba(0, 0, 0, 0.30)',
              color: 'rgba(0, 0, 0, 0.30)',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: '20px'
            }}
            onClick={() => navigate('/authorization')}
          >
            Kişiler
          </div>
        </div>

        {/* Controls */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            {isSearching ? (
              <div style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #E5E7EB',
                  borderTop: '2px solid #3B82F6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              </div>
            ) : (
              <i className="fas fa-search" style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6B7280',
                fontSize: '16px',
                zIndex: 1
              }} />
            )}
            <input
              type="text"
              placeholder="Tüm sütunlarda akıllı arama yapın..."
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setSearchTerm(value);
              }}
              onInput={(e) => {
                // onInput event'i daha güvenilir
                const value = (e.target as HTMLInputElement).value;
                setSearchTerm(value);
              }}
              onKeyDown={(e) => {
                // Tüm metni seçip silme durumunu yakala
                if (e.key === 'Delete' || e.key === 'Backspace') {
                  const input = e.target as HTMLInputElement;
                  if (input.selectionStart === 0 && input.selectionEnd === input.value.length) {
                    setSearchTerm('');
                  }
                }
              }}
              onKeyUp={(e) => {
                // Ctrl+A + Delete/Backspace kombinasyonunu yakala
                const input = e.target as HTMLInputElement;
                if (input.value === '') {
                  setSearchTerm('');
                }
              }}
              style={{
                padding: '12px 16px 12px 48px',
                border: '2px solid #E5E7EB',
                borderRadius: '10px',
                fontSize: '14px',
                width: '350px',
                outline: 'none',
                backgroundColor: '#FAFAFA',
                transition: 'all 0.2s ease',
                fontFamily: 'Inter',
                fontWeight: '500'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3B82F6';
                e.target.style.backgroundColor = 'white';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E5E7EB';
                e.target.style.backgroundColor = '#FAFAFA';
                e.target.style.boxShadow = 'none';
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9CA3AF',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '4px',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#F3F4F6';
                  (e.target as HTMLButtonElement).style.color = '#6B7280';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                  (e.target as HTMLButtonElement).style.color = '#9CA3AF';
                }}
              >
                ×
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleOpenImportPopup}
              style={{
                backgroundColor: '#17A2B8',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-file-excel"></i>
              Excel Yükle
            </button>
            <button
              onClick={handleAddOrganization}
              style={{
                backgroundColor: '#3A57E8',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              EKLE
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}>
          <div style={{
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: isMobile ? '400px' : '600px'
            }}>
            <thead>
              <tr style={{ backgroundColor: '#F8F9FA' }}>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  Genel Müdür Yardımcılığı
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  Direktörlük
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  Müdürlük
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  Grup Liderliği
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  Pozisyon
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'right',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {searchTerm && (
                <tr>
                  <td colSpan={6} style={{
                    padding: '12px 16px',
                    backgroundColor: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    fontSize: '13px',
                    color: '#64748B',
                    fontFamily: 'Inter',
                    fontWeight: '500'
                  }}>
                    🔍 "{debouncedSearchTerm}" için {filteredOrganizations.length} sonuç bulundu
                  </td>
                </tr>
              )}
              {currentOrganizations.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#8A92A6',
                    fontSize: '14px'
                  }}>
                    {searchTerm ? `"${searchTerm}" için arama sonucu bulunamadı` : 'Henüz organizasyon bulunmuyor'}
                  </td>
                </tr>
              ) : (
                currentOrganizations.map((organization) => (
                  <tr key={organization._id} style={{
                    borderBottom: '1px solid #E9ECEF'
                  }}>
                    <td style={{
                      padding: '16px',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 500
                    }}>
                      {highlightText(organization.genelMudurYardimciligi || '-', searchTerm)}
                    </td>
                    <td style={{
                      padding: '16px',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 500
                    }}>
                      {highlightText(organization.direktörlük || '-', searchTerm)}
                    </td>
                    <td style={{
                      padding: '16px',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 500
                    }}>
                      {highlightText(organization.müdürlük || '-', searchTerm)}
                    </td>
                    <td style={{
                      padding: '16px',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 500
                    }}>
                      {highlightText(organization.grupLiderligi || '-', searchTerm)}
                    </td>
                    <td style={{
                      padding: '16px',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 500
                    }}>
                      {highlightText(organization.pozisyon || '-', searchTerm)}
                    </td>
                    <td style={{
                      padding: '16px',
                      textAlign: 'right'
                    }}>
                      <i 
                        className="fas fa-edit" 
                        style={{
                          color: '#0286F7',
                          marginRight: '16px',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                        onClick={() => handleEditOrganization(organization)}
                      />
                      <i 
                        className="fas fa-trash" 
                        style={{
                          color: '#A30D11',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                        onClick={() => handleDeleteOrganization(organization)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '20px'
          }}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px',
                border: '1px solid #E9ECEF',
                borderRadius: '6px',
                backgroundColor: currentPage === 1 ? '#F8F9FA' : 'white',
                color: currentPage === 1 ? '#ADB5BD' : '#232D42',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Önceki
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #E9ECEF',
                  borderRadius: '6px',
                  backgroundColor: currentPage === page ? '#3A57E8' : 'white',
                  color: currentPage === page ? 'white' : '#232D42',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 12px',
                border: '1px solid #E9ECEF',
                borderRadius: '6px',
                backgroundColor: currentPage === totalPages ? '#F8F9FA' : 'white',
                color: currentPage === totalPages ? '#ADB5BD' : '#232D42',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Sonraki
            </button>
          </div>
        )}

        {/* Add Popup */}
        {showAddPopup && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '32px',
                paddingBottom: '16px',
                borderBottom: '2px solid #F1F5F9'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#3B82F6',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>+</span>
                </div>
                <div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#1E293B',
                    fontFamily: 'Inter',
                    marginBottom: '4px'
                  }}>
                    Yeni Organizasyon Ekle
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#64748B',
                    fontFamily: 'Inter'
                  }}>
                    Organizasyon bilgilerini girin
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Genel Müdür Yardımcılığı <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.genelMudurYardimciligi}
                    onChange={(e) => setFormData({ ...formData, genelMudurYardimciligi: e.target.value })}
                    placeholder="Genel Müdür Yardımcılığı girin"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#FAFAFA'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3B82F6';
                      e.target.style.backgroundColor = 'white';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#E5E7EB';
                      e.target.style.backgroundColor = '#FAFAFA';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Direktörlük
                  </label>
                  <input
                    type="text"
                    value={formData.direktörlük}
                    onChange={(e) => setFormData({ ...formData, direktörlük: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Müdürlük
                  </label>
                  <input
                    type="text"
                    value={formData.müdürlük}
                    onChange={(e) => setFormData({ ...formData, müdürlük: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Grup Liderliği
                  </label>
                  <input
                    type="text"
                    value={formData.grupLiderligi}
                    onChange={(e) => setFormData({ ...formData, grupLiderligi: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Pozisyon <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.pozisyon}
                    onChange={(e) => setFormData({ ...formData, pozisyon: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '16px',
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '1px solid #F1F5F9'
              }}>
                <button
                  onClick={() => setShowAddPopup(false)}
                  style={{
                    padding: '14px 28px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#6B7280',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'Inter'
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.borderColor = '#D1D5DB';
                    (e.target as HTMLButtonElement).style.backgroundColor = '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.borderColor = '#E5E7EB';
                    (e.target as HTMLButtonElement).style.backgroundColor = 'white';
                  }}
                >
                  İptal
                </button>
                <button
                  onClick={handleSubmitAdd}
                  disabled={isSubmitting}
                  style={{
                    padding: '14px 28px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: '#3B82F6',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'Ekleniyor...' : 'Ekle'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Popup */}
        {showEditPopup && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '32px',
                paddingBottom: '16px',
                borderBottom: '2px solid #F1F5F9'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#10B981',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>✏️</span>
                </div>
                <div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#1E293B',
                    fontFamily: 'Inter',
                    marginBottom: '4px'
                  }}>
                    Organizasyon Düzenle
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#64748B',
                    fontFamily: 'Inter'
                  }}>
                    Organizasyon bilgilerini güncelleyin
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Genel Müdür Yardımcılığı
                  </label>
                  <input
                    type="text"
                    value={formData.genelMudurYardimciligi}
                    onChange={(e) => setFormData({ ...formData, genelMudurYardimciligi: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Direktörlük
                  </label>
                  <input
                    type="text"
                    value={formData.direktörlük}
                    onChange={(e) => setFormData({ ...formData, direktörlük: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Müdürlük
                  </label>
                  <input
                    type="text"
                    value={formData.müdürlük}
                    onChange={(e) => setFormData({ ...formData, müdürlük: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Grup Liderliği
                  </label>
                  <input
                    type="text"
                    value={formData.grupLiderligi}
                    onChange={(e) => setFormData({ ...formData, grupLiderligi: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Pozisyon <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.pozisyon}
                    onChange={(e) => setFormData({ ...formData, pozisyon: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '16px',
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '1px solid #F1F5F9'
              }}>
                <button
                  onClick={() => setShowEditPopup(false)}
                  style={{
                    padding: '14px 28px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#6B7280',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'Inter'
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.borderColor = '#D1D5DB';
                    (e.target as HTMLButtonElement).style.backgroundColor = '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.borderColor = '#E5E7EB';
                    (e.target as HTMLButtonElement).style.backgroundColor = 'white';
                  }}
                >
                  İptal
                </button>
                <button
                  onClick={handleSubmitEdit}
                  disabled={isSubmitting}
                  style={{
                    padding: '14px 28px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: '#10B981',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                    fontFamily: 'Inter'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      (e.target as HTMLButtonElement).style.backgroundColor = '#059669';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) {
                      (e.target as HTMLButtonElement).style.backgroundColor = '#10B981';
                    }
                  }}
                >
                  {isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Popup */}
        {showDeletePopup && selectedOrganization && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#232D42',
                marginBottom: '16px',
                fontFamily: 'Inter'
              }}>
                Organizasyonu Sil
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '24px',
                lineHeight: '1.5',
                fontFamily: 'Inter'
              }}>
                Bu organizasyonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px'
              }}>
                <button
                  onClick={() => setShowDeletePopup(false)}
                  style={{
                    padding: '12px 24px',
                    border: '1px solid #E9ECEF',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#6B7280',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  İptal
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isSubmitting}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#DC2626',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'Siliniyor...' : 'Sil'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Popup */}
        {showSuccessPopup && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#059669',
                marginBottom: '16px',
                fontFamily: 'Inter'
              }}>
                Başarılı!
              </div>
              <div style={{
                fontSize: '14px',
                color: '#374151',
                marginBottom: '24px',
                lineHeight: '1.5',
                fontFamily: 'Inter'
              }}>
                {successMessage}
              </div>
              <button
                onClick={() => setShowSuccessPopup(false)}
                style={{
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Tamam
              </button>
            </div>
          </div>
        )}

        {/* Error Popup */}
        {showErrorPopup && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#DC2626',
                marginBottom: '16px',
                fontFamily: 'Inter'
              }}>
                Hata!
              </div>
              <div style={{
                fontSize: '14px',
                color: '#374151',
                marginBottom: '24px',
                lineHeight: '1.5',
                fontFamily: 'Inter',
                whiteSpace: 'pre-line'
              }}>
                {errorMessage}
              </div>
              <button
                onClick={() => setShowErrorPopup(false)}
                style={{
                  backgroundColor: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Tamam
              </button>
            </div>
          </div>
        )}

        {/* Excel Import Popup */}
        {showImportPopup && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1500
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#232D42',
                  fontFamily: 'Inter'
                }}>
                  Excel Import
                </div>
                <button
                  onClick={handleCloseImportPopup}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6B7280'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <i className="fas fa-info-circle" style={{
                    color: '#1976D2',
                    fontSize: '18px'
                  }} />
                  <strong style={{
                    color: '#1976D2',
                    fontSize: '14px'
                  }}>
                    Excel Dosyası Yükle
                  </strong>
                </div>
                <button
                  onClick={downloadTemplate}
                  style={{
                    backgroundColor: '#17A2B8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="fas fa-download"></i>
                  Template İndir
                </button>
              </div>

              <div
                onClick={() => document.getElementById('excelFileInput')?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: '2px dashed #D1D5DB',
                  borderRadius: '8px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#FAFAFA',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{
                  fontSize: '48px',
                  color: '#10B981',
                  marginBottom: '16px'
                }}>
                  <i className="fas fa-file-excel"></i>
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Excel dosyasını seçin veya sürükleyin
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6B7280'
                }}>
                  .xlsx, .xls formatları desteklenir
                </div>
              </div>

              <input
                type="file"
                id="excelFileInput"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {selectedFile && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  backgroundColor: '#D1FAE5',
                  color: '#065F46',
                  border: '1px solid #A7F3D0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}>
                  Dosya seçildi: {selectedFile.name}
                </div>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '1px solid #E5E7EB'
              }}>
                <button
                  onClick={handleCloseImportPopup}
                  style={{
                    backgroundColor: '#F3F4F6',
                    color: '#374151',
                    border: '1px solid #D1D5DB',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  İptal
                </button>
                <button
                  onClick={handleImportExcel}
                  disabled={!selectedFile || isSubmitting}
                  style={{
                    backgroundColor: selectedFile && !isSubmitting ? '#3B82F6' : '#9CA3AF',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: selectedFile && !isSubmitting ? 'pointer' : 'not-allowed'
                  }}
                >
                  {isSubmitting ? 'Yükleniyor...' : 'Yükle'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default Organization;
