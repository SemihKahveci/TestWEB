import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { organizationAPI } from '../services/api';

interface Authorization {
  _id: string;
  sicilNo?: string;
  personName?: string;
  email?: string;
  title?: string;
  organizationId?: any; // Populated organization object
}

interface Organization {
  _id: string;
  genelMudurYardimciligi?: string;
  direktörlük?: string;
  müdürlük?: string;
  grupLiderligi?: string;
  pozisyon?: string;
}

const AuthorizationPage: React.FC = () => {
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
  const [authorizations, setAuthorizations] = useState<Authorization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [showImportPopup, setShowImportPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedAuthorization, setSelectedAuthorization] = useState<Authorization | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMessage, setImportMessage] = useState('');
  const [importMessageType, setImportMessageType] = useState<'success' | 'error'>('success');
  
  // Organization states
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<string[]>([]);
  const [positionSearchTerm, setPositionSearchTerm] = useState('');
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    sicilNo: '',
    personName: '',
    email: '',
    title: '',
    organizationId: ''
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
    loadAuthorizations();
    loadOrganizations();
  }, []);

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-position-dropdown]')) {
        setShowPositionDropdown(false);
      }
    };

    if (showPositionDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPositionDropdown]);

  // Debounce search term
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
      // Arama yapıldığında sayfa 1'e dön
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadAuthorizations = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/authorization', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Yetkilendirme listesi yüklenemedi');
      }

      const result = await response.json();
      
      if (result.success) {
        const authorizations = result.authorizations || [];
        // En son eklenenler en üstte olacak şekilde sırala (MongoDB ObjectId'den tarih çıkar)
        const sortedAuthorizations = authorizations.sort((a: Authorization, b: Authorization) => {
          // ObjectId'nin ilk 8 karakteri timestamp'i temsil eder (hex)
          const timestampA = a._id ? parseInt(a._id.substring(0, 8), 16) : 0;
          const timestampB = b._id ? parseInt(b._id.substring(0, 8), 16) : 0;
          return timestampB - timestampA; // En yeni en üstte
        });
        setAuthorizations(sortedAuthorizations);
      } else {
        throw new Error(result.message || 'Yetkilendirme listesi alınamadı');
      }
    } catch (error: any) {
      console.error('💥 Yetkilendirme yükleme hatası:', error);
      setErrorMessage('Yetkilendirmeler yüklenirken bir hata oluştu');
      setShowErrorPopup(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      
      const result = await organizationAPI.getAll();
      
      if (result.data.success) {
        const organizations = result.data.organizations || [];
        setOrganizations(organizations);
        
        // Pozisyonları çıkar ve alfabetik sırala
        
        const allPositions = organizations
          .map(org => {
            return org.pozisyon;
          })
          .filter(pos => pos && pos.trim() !== '')
          .filter((pos, index, arr) => arr.indexOf(pos) === index) // Tekrarları kaldır
          .sort((a, b) => a.localeCompare(b, 'tr')); // Türkçe alfabetik sıralama
        
        setPositions(allPositions);
        setFilteredPositions(allPositions); // İlk yüklemede tüm pozisyonları göster
      } else {
        throw new Error(result.data.message || 'Organizasyon listesi alınamadı');
      }
    } catch (error) {
      console.error('❌ Organizasyon yükleme hatası:', error);
    }
  };

  // Pozisyon arama fonksiyonu
  const handlePositionSearch = (searchTerm: string) => {
    setPositionSearchTerm(searchTerm);
    
    if (searchTerm.trim() === '') {
      setFilteredPositions(positions);
    } else {
      // Türkçe karakterleri normalize et
      const normalizeText = (text: string) => {
        return text
          .trim()
          .replace(/İ/g, 'i') // Büyük İ'yi noktasız i'ye çevir
          .replace(/I/g, 'i') // Büyük I'yi noktasız i'ye çevir
          .replace(/Ç/g, 'c') // Ç'yi c'ye çevir
          .replace(/Ğ/g, 'g') // Ğ'yi g'ye çevir
          .replace(/Ö/g, 'o') // Ö'yi o'ya çevir
          .replace(/Ş/g, 's') // Ş'yi s'ye çevir
          .replace(/Ü/g, 'u') // Ü'yi u'ya çevir
          .toLowerCase()
          .replace(/i̇/g, 'i') // Noktalı küçük i'yi noktasız i'ye çevir
          .replace(/ı/g, 'i') // Noktasız küçük i'yi noktasız i'ye çevir
          .replace(/ç/g, 'c') // Ç'yi c'ye çevir
          .replace(/ğ/g, 'g') // Ğ'yi g'ye çevir
          .replace(/ö/g, 'o') // Ö'yi o'ya çevir
          .replace(/ş/g, 's') // Ş'yi s'ye çevir
          .replace(/ü/g, 'u'); // Ü'yi u'ya çevir
      };
      
      const searchNormalized = normalizeText(searchTerm);
      
      const filtered = positions.filter(position => {
        const positionNormalized = normalizeText(position);
        return positionNormalized.includes(searchNormalized);
      });
      
      setFilteredPositions(filtered);
    }
  };

  // Pozisyon seçme fonksiyonu
  const handlePositionSelect = (position: string) => {
    // Pozisyon seçildiğinde organization ID'sini bul
    const matchingOrg = organizations.find(org => org.pozisyon === position);
    setFormData({ 
      ...formData, 
      title: position,
      organizationId: matchingOrg?._id || ''
    });
    setPositionSearchTerm(position);
    setShowPositionDropdown(false);
  };

  // Highlight search term in text
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text;
    
    // Türkçe karakterleri normalize et
    const normalizeText = (text: string) => {
      return text
        .trim()
        .toLowerCase()
        .replace(/ı/g, 'i') // I'yi i'ye çevir
        .replace(/ğ/g, 'g') // Ğ'yi g'ye çevir
        .replace(/ü/g, 'u') // Ü'yi u'ya çevir
        .replace(/ş/g, 's') // Ş'yi s'ye çevir
        .replace(/ö/g, 'o') // Ö'yi o'ya çevir
        .replace(/ç/g, 'c') // Ç'yi c'ye çevir
        .replace(/İ/g, 'i') // İ'yi i'ye çevir
        .replace(/Ğ/g, 'g') // Ğ'yi g'ye çevir
        .replace(/Ü/g, 'u') // Ü'yi u'ya çevir
        .replace(/Ş/g, 's') // Ş'yi s'ye çevir
        .replace(/Ö/g, 'o') // Ö'yi o'ya çevir
        .replace(/Ç/g, 'c'); // Ç'yi c'ye çevir
    };
    
    const normalizedText = normalizeText(text);
    const normalizedSearchTerm = normalizeText(searchTerm);
    
    // Normalize edilmiş metinde arama yap
    const searchIndex = normalizedText.indexOf(normalizedSearchTerm);
    if (searchIndex === -1) return text;
    
    // Orijinal metinde eşleşen kısmı bul
    const beforeMatch = text.substring(0, searchIndex);
    const matchLength = searchTerm.length;
    const match = text.substring(searchIndex, searchIndex + matchLength);
    const afterMatch = text.substring(searchIndex + matchLength);
    
    return (
      <>
        {beforeMatch}
        <span style={{ 
          backgroundColor: '#FEF3C7', 
          color: '#92400E',
          fontWeight: 600,
          padding: '1px 2px',
          borderRadius: '2px'
        }}>
          {match}
        </span>
        {afterMatch}
      </>
    );
  };

  const handleAddAuthorization = () => {
    setFormData({
      sicilNo: '',
      personName: '',
      email: '',
      title: '',
      organizationId: ''
    });
    setPositionSearchTerm('');
    setShowPositionDropdown(false);
    setShowAddPopup(true);
  };

  const handleEditAuthorization = (authorization: Authorization) => {
    setSelectedAuthorization(authorization);
    // organizationId varsa populate edilmiş organization'dan pozisyonu al
    const title = (authorization as any).organizationId?.pozisyon || authorization.title || '';
    setFormData({
      sicilNo: authorization.sicilNo || '',
      personName: authorization.personName || '',
      email: authorization.email || '',
      title: title,
      organizationId: (authorization as any).organizationId?._id || ''
    });
    setPositionSearchTerm(title);
    setShowPositionDropdown(false);
    setShowEditPopup(true);
  };

  const handleDeleteAuthorization = (authorization: Authorization) => {
    setSelectedAuthorization(authorization);
    setShowDeletePopup(true);
  };

  const handleSubmitAdd = async () => {
    // Validasyon kontrolleri
    if (!formData.sicilNo || !formData.sicilNo.trim()) {
      setErrorMessage('Lütfen sicil numarasını giriniz!');
      setShowErrorPopup(true);
      return;
    }

    if (!formData.personName || !formData.personName.trim()) {
      setErrorMessage('Lütfen kişi adını giriniz!');
      setShowErrorPopup(true);
      return;
    }

    if (!formData.email || !formData.email.trim()) {
      setErrorMessage('Lütfen email adresini giriniz!');
      setShowErrorPopup(true);
      return;
    }

    if (!formData.title || !formData.title.trim()) {
      setErrorMessage('Lütfen pozisyon seçiniz!');
      setShowErrorPopup(true);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/authorization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Yetkilendirme eklenemedi');
      }

      const responseData = await response.json();
      
      // Yeni yetkilendirmeyi listenin en üstüne ekle
      setAuthorizations(prev => [responseData.authorization, ...prev]);
      
      // Başarı mesajı göster
      setShowAddPopup(false);
      setShowSuccessPopup(true);
      setSuccessMessage('Yetkilendirme başarıyla eklendi!');
    } catch (error: any) {
      console.error('💥 Yetkilendirme ekleme hatası:', error);
      setErrorMessage(error.message || 'Yetkilendirme eklenirken bir hata oluştu');
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedAuthorization) return;

    // Validasyon kontrolleri
    if (!formData.sicilNo || !formData.sicilNo.trim()) {
      setErrorMessage('Lütfen sicil numarasını giriniz!');
      setShowErrorPopup(true);
      return;
    }

    if (!formData.personName || !formData.personName.trim()) {
      setErrorMessage('Lütfen kişi adını giriniz!');
      setShowErrorPopup(true);
      return;
    }

    if (!formData.email || !formData.email.trim()) {
      setErrorMessage('Lütfen email adresini giriniz!');
      setShowErrorPopup(true);
      return;
    }

    if (!formData.title || !formData.title.trim()) {
      setErrorMessage('Lütfen pozisyon seçiniz!');
      setShowErrorPopup(true);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/authorization/${selectedAuthorization._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Yetkilendirme güncellenemedi');
      }

      const responseData = await response.json();
      
      // Güncellenen yetkilendirmeyi listede güncelle
      setAuthorizations(prev => prev.map(auth => 
        auth._id === selectedAuthorization._id ? responseData.authorization : auth
      ));
      
      // Başarı mesajı göster
      setShowEditPopup(false);
      setShowSuccessPopup(true);
      setSuccessMessage('Yetkilendirme başarıyla güncellendi!');
    } catch (error: any) {
      console.error('💥 Yetkilendirme güncelleme hatası:', error);
      setErrorMessage(error.message || 'Yetkilendirme güncellenirken bir hata oluştu');
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (!selectedAuthorization) return;
      setIsSubmitting(true);
      
      const response = await fetch(`/api/authorization/${selectedAuthorization._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Silme işlemi başarısız');
      }

      
      // Silinen yetkilendirmeyi listeden çıkar
      setAuthorizations(prev => prev.filter(auth => auth._id !== selectedAuthorization._id));
      
      // Başarı mesajı göster
      setShowDeletePopup(false);
      setShowSuccessPopup(true);
      setSuccessMessage('Yetkilendirme başarıyla silindi!');
    } catch (error: any) {
      console.error('💥 Yetkilendirme silme hatası:', error);
      setErrorMessage(error.message || 'Yetkilendirme silinirken bir hata oluştu');
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter authorizations based on search term (sadece kişi adına göre)
  const filteredAuthorizations = authorizations.filter(auth => {
    // Türkçe karakterleri normalize et
    const normalizeText = (text: string) => {
      return text
        .trim()
        .replace(/İ/g, 'i') // Büyük İ'yi noktasız i'ye çevir
        .replace(/I/g, 'i') // Büyük I'yi noktasız i'ye çevir
        .replace(/Ç/g, 'c') // Ç'yi c'ye çevir
        .replace(/Ğ/g, 'g') // Ğ'yi g'ye çevir
        .replace(/Ö/g, 'o') // Ö'yi o'ya çevir
        .replace(/Ş/g, 's') // Ş'yi s'ye çevir
        .replace(/Ü/g, 'u') // Ü'yi u'ya çevir
        .toLowerCase()
        .replace(/i̇/g, 'i') // Noktalı küçük i'yi noktasız i'ye çevir
        .replace(/ı/g, 'i') // Noktasız küçük i'yi noktasız i'ye çevir
        .replace(/ç/g, 'c') // Ç'yi c'ye çevir
        .replace(/ğ/g, 'g') // Ğ'yi g'ye çevir
        .replace(/ö/g, 'o') // Ö'yi o'ya çevir
        .replace(/ş/g, 's') // Ş'yi s'ye çevir
        .replace(/ü/g, 'u'); // Ü'yi u'ya çevir
    };
    
    const searchNormalized = normalizeText(debouncedSearchTerm);
    
    return (
      auth.personName && normalizeText(auth.personName).includes(searchNormalized)
    );
  }).sort((a, b) => {
    // Filtrelenmiş sonuçları da tarihe göre sırala
    const timestampA = a._id ? parseInt(a._id.substring(0, 8), 16) : 0;
    const timestampB = b._id ? parseInt(b._id.substring(0, 8), 16) : 0;
    return timestampB - timestampA; // En yeni en üstte
  });


  // Pagination
  const totalPages = Math.ceil(filteredAuthorizations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAuthorizations = filteredAuthorizations.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Sayfa değiştiğinde en üste scroll
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  // Excel Import Functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportMessage('');
    }
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
      setImportMessage('');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const downloadTemplate = () => {
    try {
      // Excel template verilerini oluştur - kişi sütunları
      const headers = [
        'Sicil No',
        'Ad Soyad',
        'Email',
        'Pozisyon'
      ];

      // Örnek veri satırı
      const exampleRow = [
        '12345',
        'Serdar Kahveci',
        'serdar.kahveci@example.com',
        'Yazılım Geliştirici'
      ];

      // Boş satırlar için veri
      const emptyRows: string[][] = [];
      for (let i = 0; i < 10; i++) {
        emptyRows.push(['', '', '', '']);
      }

      // Tüm veriyi birleştir
      const allData = [headers, exampleRow, ...emptyRows];

      // Excel workbook oluştur
      const wb = XLSX.utils.book_new();
      
      // Worksheet oluştur
      const ws = XLSX.utils.aoa_to_sheet(allData);
      
      // Sütun genişliklerini ayarla
      ws['!cols'] = [
        { wch: 15 }, // Sicil No
        { wch: 25 }, // Ad Soyad
        { wch: 30 }, // Email
        { wch: 25 }  // Pozisyon
      ];

      // Worksheet'i workbook'a ekle
      XLSX.utils.book_append_sheet(wb, ws, "Kişiler Template");

      // Excel dosyasını indir
      XLSX.writeFile(wb, 'kişiler_template.xlsx');
      
      setSuccessMessage('Excel template başarıyla indirildi!');
      setShowSuccessPopup(true);
      
    } catch (error) {
      console.error('Template indirme hatası:', error);
      setErrorMessage('Template indirilirken bir hata oluştu!');
      setShowErrorPopup(true);
    }
  };

  const importExcelData = async () => {
    if (!selectedFile) {
      setImportMessage('Lütfen önce bir Excel dosyası seçin!');
      setImportMessageType('error');
      return;
    }

    try {
      setImportMessage('Excel dosyası yükleniyor...');
      setImportMessageType('success');
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('excelFile', selectedFile);

      const response = await fetch('/api/authorization/import', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        if (response.status === 401) {
          setImportMessage('Yetkiniz bulunmuyor. Lütfen tekrar giriş yapın.');
        } else if (response.status === 413) {
          setImportMessage('Dosya çok büyük. Lütfen daha küçük bir dosya seçin.');
        } else if (response.status === 400) {
          const errorResult = await response.json();
          let errorMessage = errorResult.message || 'Dosya formatı hatalı. Lütfen geçerli bir Excel dosyası seçin.';
          if (errorResult.errors && errorResult.errors.length > 0) {
            errorMessage += '\n\nDetaylar:\n';
            errorResult.errors.forEach((error: any) => {
              errorMessage += `• Satır ${error.row}: ${error.message}\n`;
            });
          }
          setImportMessage(errorMessage);
        } else {
          setImportMessage('Dosya yüklenirken bir hata oluştu.');
        }
        setImportMessageType('error');
        setIsSubmitting(false);
        return;
      }

      const result = await response.json();
      if (result.success) {
        setImportMessage(`Başarıyla ${result.importedCount} kişi eklendi!`);
        setImportMessageType('success');
        setShowImportPopup(false);
        setSelectedFile(null);
        loadAuthorizations(); // Verileri yenile
      } else {
        setImportMessage(result.message || 'Dosya yüklenirken bir hata oluştu.');
        setImportMessageType('error');
      }
    } catch (error) {
      console.error('Excel import hatası:', error);
      setImportMessage('Dosya yüklenirken bir hata oluştu.');
      setImportMessageType('error');
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
          <div>Yetkilendirmeler yükleniyor...</div>
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
              Kişiler
            </div>
          </div>
        </div>

        {/* Tab Container */}
        <div style={{
          display: 'flex',
          gap: '30px',
          marginBottom: '20px'
        }}>
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
            onClick={() => navigate('/organization')}
          >
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
              placeholder="Kişi adına göre akıllı arama yapın..."
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
              onClick={() => setShowImportPopup(true)}
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
              <i className="fas fa-file-excel" />
              Excel Yükle
            </button>
            <button
              onClick={handleAddAuthorization}
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
                  Sicil No
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  Ad Soyad
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  Email
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
                  <td colSpan={5} style={{
                    padding: '12px 16px',
                    backgroundColor: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    fontSize: '13px',
                    color: '#64748B',
                    fontFamily: 'Inter',
                    fontWeight: '500'
                  }}>
                    🔍 "{debouncedSearchTerm}" için {filteredAuthorizations.length} sonuç bulundu
                  </td>
                </tr>
              )}
              {currentAuthorizations.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#8A92A6',
                    fontSize: '14px'
                  }}>
                    {searchTerm ? `"${searchTerm}" için arama sonucu bulunamadı` : 'Henüz kişi bulunmuyor'}
                  </td>
                </tr>
              ) : (
                currentAuthorizations.map((authorization) => (
                  <tr key={authorization._id} style={{
                    borderBottom: '1px solid #E9ECEF'
                  }}>
                    <td style={{
                      padding: '16px',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 500
                    }}>
                      {authorization.sicilNo || '-'}
                    </td>
                    <td style={{
                      padding: '16px',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 500
                    }}>
                      {highlightText(authorization.personName || '-', searchTerm)}
                    </td>
                    <td style={{
                      padding: '16px',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 500
                    }}>
                      {authorization.email || '-'}
                    </td>
                    <td style={{
                      padding: '16px',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 500
                    }}>
                      {authorization.organizationId?.pozisyon || authorization.title || '-'}
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
                        onClick={() => handleEditAuthorization(authorization)}
                      />
                      <i 
                        className="fas fa-trash" 
                        style={{
                          color: '#A30D11',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                        onClick={() => handleDeleteAuthorization(authorization)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {(
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
      </div>


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
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#232D42',
                marginBottom: '24px',
                fontFamily: 'Inter'
              }}>
                Kişi Ekle
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#232D42',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Sicil No <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sicilNo}
                    onChange={(e) => setFormData({ ...formData, sicilNo: e.target.value })}
                    placeholder="Lütfen Sicil No Giriniz"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
                      borderRadius: '6px',
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
                    fontWeight: 500,
                    color: '#232D42',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Kişi Adı <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.personName}
                    onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                    placeholder="Lütfen Kişi Adını Giriniz"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
                      borderRadius: '6px',
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
                    fontWeight: 500,
                    color: '#232D42',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Email <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Lütfen Email Giriniz"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div style={{ position: 'relative' }} data-position-dropdown>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#232D42',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Pozisyon <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  {/* Custom Dropdown */}
                  <div
                    onClick={() => setShowPositionDropdown(!showPositionDropdown)}
                    style={{
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#232D42',
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      userSelect: 'none',
                      fontFamily: 'Inter'
                    }}
                  >
                    <span style={{ color: positionSearchTerm ? '#232D42' : '#8A92A6' }}>
                      {positionSearchTerm || `Pozisyon seçin (${positions.length} pozisyon mevcut)`}
                    </span>
                    <i 
                      className={`fas fa-chevron-${showPositionDropdown ? 'up' : 'down'}`}
                      style={{ 
                        color: '#8A92A6',
                        fontSize: '12px',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                  </div>
                  {showPositionDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E9ECEF',
                      borderRadius: '6px',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                      zIndex: 9999,
                      maxHeight: '400px',
                      overflow: 'hidden'
                    }}>
                      {/* Search Input */}
                      <div style={{ padding: '8px', borderBottom: '1px solid #E9ECEF', position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Pozisyon ara..."
                          value={positionSearchTerm}
                          onChange={(e) => {
                            handlePositionSearch(e.target.value);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px 8px 32px',
                            border: '1px solid #E9ECEF',
                            borderRadius: '4px',
                            fontSize: '14px',
                            outline: 'none',
                            fontFamily: 'Inter'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <i className="fas fa-search" style={{
                          position: 'absolute',
                          left: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#6B7280',
                          fontSize: '12px'
                        }} />
                        {positionSearchTerm && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPositionSearchTerm('');
                              handlePositionSearch('');
                            }}
                            style={{
                              position: 'absolute',
                              right: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              color: '#6B7280',
                              cursor: 'pointer',
                              fontSize: '12px',
                              padding: '2px'
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </div>

                      {/* Options */}
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {filteredPositions.length > 0 ? (
                          filteredPositions.map((position, index) => (
                            <div
                              key={index}
                              onClick={() => handlePositionSelect(position)}
                              style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontFamily: 'Inter',
                                color: '#232D42',
                                borderBottom: index < filteredPositions.length - 1 ? '1px solid #F1F3F4' : 'none',
                                transition: 'background-color 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#F8F9FA';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              {highlightText(position, positionSearchTerm)}
                            </div>
                          ))
                        ) : (
                          <div style={{
                            padding: '12px 16px',
                            fontSize: '14px',
                            fontFamily: 'Inter',
                            color: '#8A92A6',
                            textAlign: 'center'
                          }}>
                            {positionSearchTerm ? `"${positionSearchTerm}" için arama sonucu bulunamadı` : 'Pozisyon bulunamadı'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '24px'
              }}>
                <button
                  onClick={() => {
                    setShowAddPopup(false);
                    setShowPositionDropdown(false);
                  }}
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
                  onClick={handleSubmitAdd}
                  disabled={isSubmitting}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#3A57E8',
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
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#232D42',
                marginBottom: '24px',
                fontFamily: 'Inter'
              }}>
                Kişi Düzenle
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#232D42',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Sicil No <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sicilNo}
                    onChange={(e) => setFormData({ ...formData, sicilNo: e.target.value })}
                    placeholder="Lütfen Sicil No Giriniz"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
                      borderRadius: '6px',
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
                    fontWeight: 500,
                    color: '#232D42',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Kişi Adı <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.personName}
                    onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                    placeholder="Lütfen Kişi Adını Giriniz"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
                      borderRadius: '6px',
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
                    fontWeight: 500,
                    color: '#232D42',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Email <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Lütfen Email Giriniz"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div style={{ position: 'relative' }} data-position-dropdown>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#232D42',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Pozisyon <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  {/* Custom Dropdown */}
                  <div
                    onClick={() => setShowPositionDropdown(!showPositionDropdown)}
                    style={{
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#232D42',
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      userSelect: 'none',
                      fontFamily: 'Inter'
                    }}
                  >
                    <span style={{ color: positionSearchTerm ? '#232D42' : '#8A92A6' }}>
                      {positionSearchTerm || `Pozisyon seçin (${positions.length} pozisyon mevcut)`}
                    </span>
                    <i 
                      className={`fas fa-chevron-${showPositionDropdown ? 'up' : 'down'}`}
                      style={{ 
                        color: '#8A92A6',
                        fontSize: '12px',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                  </div>
                  {showPositionDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E9ECEF',
                      borderRadius: '6px',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                      zIndex: 9999,
                      maxHeight: '400px',
                      overflow: 'hidden'
                    }}>
                      {/* Search Input */}
                      <div style={{ padding: '8px', borderBottom: '1px solid #E9ECEF', position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Pozisyon ara..."
                          value={positionSearchTerm}
                          onChange={(e) => {
                            handlePositionSearch(e.target.value);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px 8px 32px',
                            border: '1px solid #E9ECEF',
                            borderRadius: '4px',
                            fontSize: '14px',
                            outline: 'none',
                            fontFamily: 'Inter'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <i className="fas fa-search" style={{
                          position: 'absolute',
                          left: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#6B7280',
                          fontSize: '12px'
                        }} />
                        {positionSearchTerm && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPositionSearchTerm('');
                              handlePositionSearch('');
                            }}
                            style={{
                              position: 'absolute',
                              right: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              color: '#6B7280',
                              cursor: 'pointer',
                              fontSize: '12px',
                              padding: '2px'
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </div>

                      {/* Options */}
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {filteredPositions.length > 0 ? (
                          filteredPositions.map((position, index) => (
                            <div
                              key={index}
                              onClick={() => handlePositionSelect(position)}
                              style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontFamily: 'Inter',
                                color: '#232D42',
                                borderBottom: index < filteredPositions.length - 1 ? '1px solid #F1F3F4' : 'none',
                                transition: 'background-color 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#F8F9FA';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              {highlightText(position, positionSearchTerm)}
                            </div>
                          ))
                        ) : (
                          <div style={{
                            padding: '12px 16px',
                            fontSize: '14px',
                            fontFamily: 'Inter',
                            color: '#8A92A6',
                            textAlign: 'center'
                          }}>
                            {positionSearchTerm ? `"${positionSearchTerm}" için arama sonucu bulunamadı` : 'Pozisyon bulunamadı'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '24px'
              }}>
                <button
                  onClick={() => {
                    setShowEditPopup(false);
                    setShowPositionDropdown(false);
                  }}
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
                  onClick={handleSubmitEdit}
                  disabled={isSubmitting}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#3A57E8',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Popup */}
        {showDeletePopup && selectedAuthorization && (
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
                Kişiyi Sil
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '24px',
                lineHeight: '1.5',
                fontFamily: 'Inter'
              }}>
                Bu kişiyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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
            zIndex: 1000
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
            zIndex: 1000
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
            zIndex: 1000
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
                  onClick={() => setShowImportPopup(false)}
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
                  <i className="fas fa-info-circle" style={{ color: '#1976D2', fontSize: '18px' }} />
                  <strong style={{ color: '#1976D2', fontSize: '14px' }}>Excel Dosyası Yükle</strong>
                </div>
                <button
                  onClick={downloadTemplate}
                  style={{
                    background: '#17A2B8',
                    padding: '8px 16px',
                    fontSize: '13px',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="fas fa-download" />
                  Template İndir
                </button>
              </div>
              
              <div
                onClick={() => document.getElementById('excelFileInput')?.click()}
                onDrop={handleFileDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                style={{
                  border: '2px dashed #E9ECEF',
                  borderRadius: '8px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#F8F9FA',
                  marginBottom: '20px'
                }}
              >
                <div style={{
                  fontSize: '48px',
                  color: '#28A745',
                  marginBottom: '16px'
                }}>
                  <i className="fas fa-file-excel" />
                </div>
                <div style={{
                  fontSize: '16px',
                  color: '#232D42',
                  marginBottom: '8px',
                  fontFamily: 'Inter'
                }}>
                  Excel dosyasını seçin veya sürükleyin
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  fontFamily: 'Inter'
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
                  padding: '12px',
                  backgroundColor: '#E3F2FD',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  fontSize: '14px',
                  color: '#1976D2',
                  fontFamily: 'Inter'
                }}>
                  Seçilen dosya: {selectedFile.name}
                </div>
              )}
              
              {importMessage && (
                <div style={{
                  padding: '12px',
                  backgroundColor: importMessageType === 'success' ? '#D4EDDA' : '#F8D7DA',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  fontSize: '14px',
                  color: importMessageType === 'success' ? '#155724' : '#721C24',
                  fontFamily: 'Inter',
                  whiteSpace: 'pre-line'
                }}>
                  {importMessage}
                </div>
              )}
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  onClick={() => {
                    setShowImportPopup(false);
                    setSelectedFile(null);
                    setImportMessage('');
                  }}
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
                  onClick={importExcelData}
                  disabled={isSubmitting || !selectedFile}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#17A2B8',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: isSubmitting || !selectedFile ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting || !selectedFile ? 0.7 : 1
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

export default AuthorizationPage;
