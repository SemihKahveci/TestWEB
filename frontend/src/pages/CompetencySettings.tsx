import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { organizationAPI } from '../services/api';

interface Competency {
  _id: string;
  title?: string;
  customerFocus?: {
    min?: number;
    max?: number;
  };
  uncertaintyManagement?: {
    min?: number;
    max?: number;
  };
  influence?: {
    min?: number;
    max?: number;
  };
  collaboration?: {
    min?: number;
    max?: number;
  };
}

interface Organization {
  _id: string;
  genelMudurYardimciligi?: string;
  direktörlük?: string;
  müdürlük?: string;
  grupLiderligi?: string;
  pozisyon?: string;
}

const CompetencySettings: React.FC = () => {
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showImportPopup, setShowImportPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCompetency, setSelectedCompetency] = useState<Competency | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Organization states
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<string[]>([]);
  const [positionSearchTerm, setPositionSearchTerm] = useState('');
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    customerFocusMin: '',
    customerFocusMax: '',
    uncertaintyManagementMin: '',
    uncertaintyManagementMax: '',
    influenceMin: '',
    influenceMax: '',
    collaborationMin: '',
    collaborationMax: ''
  });

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
    loadCompetencies();
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

  const loadCompetencies = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/competency', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Veriler yüklenemedi');
      
      const data = await response.json();
      setCompetencies(data.competencies || []);
    } catch (error) {
      console.error('💥 Yetkinlikler yüklenirken hata:', error);
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
          .map(org => org.pozisyon)
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
    setFormData({ ...formData, title: position });
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

  const handleAddCompetency = () => {
    setFormData({
      title: '',
      customerFocusMin: '',
      customerFocusMax: '',
      uncertaintyManagementMin: '',
      uncertaintyManagementMax: '',
      influenceMin: '',
      influenceMax: '',
      collaborationMin: '',
      collaborationMax: ''
    });
    setPositionSearchTerm('');
    setShowPositionDropdown(false);
    setShowAddPopup(true);
  };

  const handleEditCompetency = () => {
    if (selectedItems.length !== 1) return;
    
    const competency = competencies.find(c => c._id === selectedItems[0]);
    if (!competency) return;
    
    setSelectedCompetency(competency);
    setFormData({
      title: competency.title || '',
      customerFocusMin: (competency.customerFocus?.min || 0).toString(),
      customerFocusMax: (competency.customerFocus?.max || 0).toString(),
      uncertaintyManagementMin: (competency.uncertaintyManagement?.min || 0).toString(),
      uncertaintyManagementMax: (competency.uncertaintyManagement?.max || 0).toString(),
      influenceMin: (competency.influence?.min || 0).toString(),
      influenceMax: (competency.influence?.max || 0).toString(),
      collaborationMin: (competency.collaboration?.min || 0).toString(),
      collaborationMax: (competency.collaboration?.max || 0).toString()
    });
    setPositionSearchTerm(competency.title || '');
    setShowPositionDropdown(false);
    setShowEditPopup(true);
  };

  const handleDeleteCompetency = () => {
    if (selectedItems.length === 0) return;
    setShowDeletePopup(true);
  };

  const handleSubmitAdd = async () => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/competency', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          customerFocusMin: Number(formData.customerFocusMin),
          customerFocusMax: Number(formData.customerFocusMax),
          uncertaintyMin: Number(formData.uncertaintyManagementMin),
          uncertaintyMax: Number(formData.uncertaintyManagementMax),
          influenceMin: Number(formData.influenceMin),
          influenceMax: Number(formData.influenceMax),
          collaborationMin: Number(formData.collaborationMin),
          collaborationMax: Number(formData.collaborationMax)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Yetkinlik eklenemedi');
      }

      const responseData = await response.json();
      
      // Yeni yetkinliği listeye ekle - form verilerinden oluştur
      const newCompetency = {
        _id: responseData._id || Date.now().toString(),
        title: formData.title,
        customerFocus: {
          min: Number(formData.customerFocusMin),
          max: Number(formData.customerFocusMax)
        },
        uncertaintyManagement: {
          min: Number(formData.uncertaintyManagementMin),
          max: Number(formData.uncertaintyManagementMax)
        },
        influence: {
          min: Number(formData.influenceMin),
          max: Number(formData.influenceMax)
        },
        collaboration: {
          min: Number(formData.collaborationMin),
          max: Number(formData.collaborationMax)
        }
      };
      
      setCompetencies(prev => [...prev, newCompetency]);
      
      // Başarı mesajı göster - popup ile
      setShowAddPopup(false);
      setShowSuccessPopup(true);
      setSuccessMessage('Yetkinlik başarıyla eklendi!');
    } catch (error: any) {
      console.error('💥 Yetkinlik ekleme hatası:', error);
      setErrorMessage(error.message || 'Yetkinlik eklenirken bir hata oluştu');
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    try {
      if (!selectedCompetency) return;
      setIsSubmitting(true);
      
      const response = await fetch(`/api/competency/${selectedCompetency._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          customerFocusMin: Number(formData.customerFocusMin),
          customerFocusMax: Number(formData.customerFocusMax),
          uncertaintyMin: Number(formData.uncertaintyManagementMin),
          uncertaintyMax: Number(formData.uncertaintyManagementMax),
          influenceMin: Number(formData.influenceMin),
          influenceMax: Number(formData.influenceMax),
          collaborationMin: Number(formData.collaborationMin),
          collaborationMax: Number(formData.collaborationMax)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Yetkinlik güncellenemedi');
      }

      const responseData = await response.json();
      
      // Güncellenen yetkinliği listede güncelle
      setCompetencies(prev => prev.map(comp => 
        comp._id === selectedCompetency._id ? {
          ...comp,
          title: formData.title,
          customerFocus: {
            min: Number(formData.customerFocusMin),
            max: Number(formData.customerFocusMax)
          },
          uncertaintyManagement: {
            min: Number(formData.uncertaintyManagementMin),
            max: Number(formData.uncertaintyManagementMax)
          },
          influence: {
            min: Number(formData.influenceMin),
            max: Number(formData.influenceMax)
          },
          collaboration: {
            min: Number(formData.collaborationMin),
            max: Number(formData.collaborationMax)
          }
        } : comp
      ));
      
      // Başarı mesajı göster - popup ile
      setShowEditPopup(false);
      setShowSuccessPopup(true);
      setSuccessMessage('Yetkinlik başarıyla güncellendi!');
    } catch (error: any) {
      console.error('💥 Yetkinlik güncelleme hatası:', error);
      setErrorMessage(error.message || 'Yetkinlik güncellenirken bir hata oluştu');
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsSubmitting(true);
      
      // Her bir yetkinliği tek tek sil
      const deletePromises = selectedItems.map(id => 
        fetch(`/api/competency/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        })
      );
      
      const responses = await Promise.all(deletePromises);
      
      // Tüm silme işlemlerinin başarılı olduğunu kontrol et
      const failedDeletes = responses.filter(response => !response.ok);
      if (failedDeletes.length > 0) {
        throw new Error('Bazı yetkinlikler silinemedi');
      }

      
      // Silinen yetkinlikleri listeden çıkar
      setCompetencies(prev => prev.filter(comp => !selectedItems.includes(comp._id)));
      
      // Başarı mesajı göster - popup ile
      setShowDeletePopup(false);
      setShowSuccessPopup(true);
      setSuccessMessage(`${selectedItems.length} yetkinlik başarıyla silindi!`);
      setSelectedItems([]);
    } catch (error: any) {
      console.error('💥 Yetkinlik silme hatası:', error);
      setErrorMessage(error.message || 'Yetkinlik silinirken bir hata oluştu');
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      
      const formData = new FormData();
      formData.append('excelFile', file);

      const response = await fetch('/api/competency/import', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        let message = `Başarıyla ${result.importedCount} yetkinlik import edildi!`;
        if (result.errors && result.errors.length > 0) {
          message += `\n\nHatalar:\n${result.errors.slice(0, 5).join('\n')}`;
          if (result.errors.length > 5) {
            message += `\n... ve ${result.errors.length - 5} hata daha`;
          }
        }
        setShowImportPopup(false);
        setShowSuccessPopup(true);
        setSuccessMessage(message);
        loadCompetencies();
      } else {
        let errorMessage = result.message || 'Import işlemi başarısız!';
        if (result.errors && result.errors.length > 0) {
          errorMessage += `\n\nHatalar:\n${result.errors.slice(0, 5).join('\n')}`;
          if (result.errors.length > 5) {
            errorMessage += `\n... ve ${result.errors.length - 5} hata daha`;
          }
        }
        setErrorMessage(errorMessage);
        setShowErrorPopup(true);
      }

    } catch (error: any) {
      console.error('💥 Import hatası:', error);
      setErrorMessage('Import işlemi sırasında bir hata oluştu: ' + error.message);
      setShowErrorPopup(true);
    } finally {
      setIsImporting(false);
    }
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
        'Pozisyon',
        'Müş. Odak. Min Değer',
        'Müş. Odak. Max Değer',
        'Bel. Yönt. Min Değer',
        'Bel. Yönt. Max Değer',
        'İns. Etk. Min Değer',
        'İns. Etk. Max Değer',
        'Güv. Ver. İş ve Sinerji Min Değer',
        'Güv. Ver. İş ve Sinerji Max Değer'
      ];

      const exampleData = [
        'Örnek Pozisyon',
        '1',
        '5',
        '1',
        '5',
        '1',
        '5',
        '1',
        '5'
      ];

      // Boş satırlar ekle
      const emptyRows = Array(4).fill(null).map(() => Array(9).fill(''));

      // Excel dosyası oluştur
      const ws = XLSX.utils.aoa_to_sheet([
        headers,
        exampleData,
        ...emptyRows
      ]);

      // Sütun genişliklerini ayarla
      ws['!cols'] = [
        { wch: 20 }, // Pozisyon
        { wch: 15 }, // Müşteri Odaklılık (Min)
        { wch: 15 }, // Müşteri Odaklılık (Max)
        { wch: 15 }, // Belirsizlik Yönetimi (Min)
        { wch: 15 }, // Belirsizlik Yönetimi (Max)
        { wch: 15 }, // İnsanları Etkileme (Min)
        { wch: 15 }, // İnsanları Etkileme (Max)
        { wch: 15 }, // İşbirliği (Min)
        { wch: 15 }  // İşbirliği (Max)
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Yetkinlik Ayarları');

      // Dosyayı indir
      XLSX.writeFile(wb, 'yetkinlik_ayarlari_template.xlsx');
    } catch (error) {
      console.error('Template indirme hatası:', error);
      setErrorMessage('Template indirilemedi!');
      setShowErrorPopup(true);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setErrorMessage('Lütfen bir Excel dosyası seçin!');
      setShowErrorPopup(true);
      return;
    }

    try {
      setIsImporting(true);
      
      const formData = new FormData();
      formData.append('excelFile', selectedFile);

      const response = await fetch('/api/competency/import', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        let message = `Başarıyla ${result.importedCount} yetkinlik import edildi!`;
        if (result.errors && result.errors.length > 0) {
          message += `\n\nHatalar:\n${result.errors.slice(0, 5).join('\n')}`;
          if (result.errors.length > 5) {
            message += `\n... ve ${result.errors.length - 5} hata daha`;
          }
        }
        setSuccessMessage(message);
        setShowSuccessPopup(true);
        setShowImportPopup(false);
        setSelectedFile(null);
        loadCompetencies();
      } else {
        setErrorMessage(result.message || 'Import işlemi başarısız!');
        setShowErrorPopup(true);
      }
    } catch (error) {
      console.error('Import error:', error);
      setErrorMessage('Import işlemi sırasında bir hata oluştu!');
      setShowErrorPopup(true);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredCompetencies.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredCompetencies.map(c => c._id));
    }
  };

  const filteredCompetencies = competencies.filter(competency =>
    (competency.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredCompetencies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCompetencies = filteredCompetencies.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Sayfa değiştiğinde en üste scroll
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        position: 'relative',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #E5E7EB',
            borderTop: '4px solid #3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{
            color: '#6B7280',
            fontSize: '16px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}>
            Yetkinlikler yükleniyor...
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div style={{
        width: '100%',
        minHeight: '100vh',
        position: 'relative',
        background: 'white',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          width: '100%',
          height: '76px',
          padding: '16px 32px',
          background: 'white',
          backdropFilter: 'blur(32px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ flex: 1 }}></div>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer'
              }}>
                <i className="fas fa-bell" style={{ color: '#8A92A6' }}></i>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
                cursor: 'pointer'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    color: '#232D42',
                    fontSize: '16px',
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    lineHeight: '28px'
                  }}>
                    Andron Games
                  </div>
                  <div style={{
                    color: '#8A92A6',
                    fontSize: '13px',
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    lineHeight: '16.90px'
                  }}>
                    Founder
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Title */}
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
          marginLeft: '10px'
        }}>
          <div style={{
            width: '100%',
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
              Yetkinlik Ayarları
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-search" style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6B7280',
                fontSize: '16px',
                zIndex: 1
              }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchTerm(value);
                  // Arama yapıldığında sayfa 1'e dön
                  setCurrentPage(1);
                }}
                onInput={(e) => {
                  // onInput event'i daha güvenilir
                  const value = (e.target as HTMLInputElement).value;
                  setSearchTerm(value);
                  // Arama yapıldığında sayfa 1'e dön
                  setCurrentPage(1);
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
                    setCurrentPage(1);
                  }
                }}
                placeholder="Yetkinlik adında akıllı arama yapın..."
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
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
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
                onClick={handleAddCompetency}
                style={{
                  padding: '12px 20px',
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontFamily: 'Inter',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fas fa-plus"></i>
                Ekle
              </button>
              <button
                onClick={() => setShowImportPopup(true)}
                style={{
                  padding: '12px 20px',
                  background: '#17A2B8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontFamily: 'Inter',
                  fontSize: '14px',
                  fontWeight: 500,
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
                onClick={handleEditCompetency}
                disabled={selectedItems.length !== 1}
                style={{
                  padding: '12px 20px',
                  background: selectedItems.length === 1 ? '#6C757D' : '#E9ECEF',
                  color: selectedItems.length === 1 ? 'white' : '#6C757D',
                  border: 'none',
                  borderRadius: '6px',
                  fontFamily: 'Inter',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: selectedItems.length === 1 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fas fa-edit"></i>
                Düzenle
              </button>
              <button
                onClick={handleDeleteCompetency}
                disabled={selectedItems.length === 0}
                style={{
                  padding: '12px 20px',
                  background: selectedItems.length > 0 ? '#DC3545' : '#E9ECEF',
                  color: selectedItems.length > 0 ? 'white' : '#6C757D',
                  border: 'none',
                  borderRadius: '6px',
                  fontFamily: 'Inter',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fas fa-trash"></i>
                Sil
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{
            width: '100%',
            background: 'white',
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
                <tr style={{ background: '#F8F9FA' }}>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    borderBottom: '1px solid #E9ECEF',
                    color: '#232D42',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: 'Inter'
                  }}>
                    <label style={{
                      position: 'relative',
                      display: 'inline-flex',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedItems.length === filteredCompetencies.length && filteredCompetencies.length > 0}
                        onChange={handleSelectAll}
                        style={{
                          opacity: 0,
                          position: 'absolute',
                          cursor: 'pointer',
                          height: 0,
                          width: 0
                        }}
                      />
                      <span style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: '18px',
                        height: '18px',
                        backgroundColor: (selectedItems.length === filteredCompetencies.length && filteredCompetencies.length > 0) ? '#0286F7' : 'white',
                        border: `2px solid ${(selectedItems.length === filteredCompetencies.length && filteredCompetencies.length > 0) ? '#0286F7' : '#E9ECEF'}`,
                        borderRadius: '4px',
                        transition: 'all 0.3s ease',
                        transform: (selectedItems.length === filteredCompetencies.length && filteredCompetencies.length > 0) ? 'scale(1.1)' : 'scale(1)',
                        marginRight: '8px'
                      }}>
                        {(selectedItems.length === filteredCompetencies.length && filteredCompetencies.length > 0) && (
                          <span style={{
                            position: 'absolute',
                            display: 'block',
                            left: '4px',
                            top: '1px',
                            width: '6px',
                            height: '10px',
                            border: 'solid white',
                            borderWidth: '0 2px 2px 0',
                            transform: 'rotate(40deg)'
                          }} />
                        )}
                      </span>
                      Seçim
                    </label>
                  </th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    borderBottom: '1px solid #E9ECEF',
                    color: '#232D42',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: 'Inter'
                  }}>
                    Pozisyon
                  </th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    borderBottom: '1px solid #E9ECEF',
                    color: '#232D42',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: 'Inter'
                  }}>
                    Müşteri Odaklılık
                  </th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    borderBottom: '1px solid #E9ECEF',
                    color: '#232D42',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: 'Inter'
                  }}>
                    Belirsizlik Yönetimi
                  </th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    borderBottom: '1px solid #E9ECEF',
                    color: '#232D42',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: 'Inter'
                  }}>
                    İnsanları Etkileme
                  </th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    borderBottom: '1px solid #E9ECEF',
                    color: '#232D42',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: 'Inter'
                  }}>
                    Güven Veren İşbirlikçi ve Sinerji
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
                      🔍 "{searchTerm}" için {filteredCompetencies.length} sonuç bulundu
                    </td>
                  </tr>
                )}
                {currentCompetencies.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#8A92A6',
                      fontSize: '14px'
                    }}>
                      {searchTerm ? `"${searchTerm}" için arama sonucu bulunamadı` : 'Henüz yetkinlik bulunmuyor'}
                    </td>
                  </tr>
                ) : (
                  currentCompetencies.map((competency) => (
                  <tr key={competency._id} style={{
                    borderBottom: '1px solid #E9ECEF',
                    background: selectedItems.includes(competency._id) ? '#F0F8FF' : 'white'
                  }}>
                    <td style={{
                      padding: '16px',
                      textAlign: 'left',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Inter'
                    }}>
                      <label style={{
                        position: 'relative',
                        display: 'inline-block',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(competency._id)}
                          onChange={() => handleSelectItem(competency._id)}
                          style={{
                            opacity: 0,
                            position: 'absolute',
                            cursor: 'pointer',
                            height: 0,
                            width: 0
                          }}
                        />
                        <span style={{
                          position: 'relative',
                          display: 'inline-block',
                          width: '18px',
                          height: '18px',
                          backgroundColor: selectedItems.includes(competency._id) ? '#0286F7' : 'white',
                          border: `2px solid ${selectedItems.includes(competency._id) ? '#0286F7' : '#E9ECEF'}`,
                          borderRadius: '4px',
                          transition: 'all 0.3s ease',
                          transform: selectedItems.includes(competency._id) ? 'scale(1.1)' : 'scale(1)'
                        }}>
                          {selectedItems.includes(competency._id) && (
                            <span style={{
                              position: 'absolute',
                              display: 'block',
                              left: '4px',
                              top: '1px',
                              width: '6px',
                              height: '10px',
                              border: 'solid white',
                              borderWidth: '0 2px 2px 0',
                              transform: 'rotate(40deg)'
                            }} />
                          )}
                        </span>
                      </label>
                    </td>
                    <td style={{
                      padding: '16px',
                      textAlign: 'left',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Inter'
                    }}>
                      {competency.title}
                    </td>
                    <td style={{
                      padding: '16px',
                      textAlign: 'left',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Inter'
                    }}>
                      {competency.customerFocus?.min || 0} - {competency.customerFocus?.max || 0}
                    </td>
                    <td style={{
                      padding: '16px',
                      textAlign: 'left',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Inter'
                    }}>
                      {competency.uncertaintyManagement?.min || 0} - {competency.uncertaintyManagement?.max || 0}
                    </td>
                    <td style={{
                      padding: '16px',
                      textAlign: 'left',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Inter'
                    }}>
                      {competency.influence?.min || 0} - {competency.influence?.max || 0}
                    </td>
                    <td style={{
                      padding: '16px',
                      textAlign: 'left',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Inter'
                    }}>
                      {competency.collaboration?.min || 0} - {competency.collaboration?.max || 0}
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
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
                backgroundColor: currentPage === page ? '#3B82F6' : 'white',
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

        {/* Add/Edit Popup */}
        {(showAddPopup || showEditPopup) && (
          <>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes fadeIn {
                0% { opacity: 0; transform: scale(0.9); }
                100% { opacity: 1; transform: scale(1); }
              }
            `}</style>
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000
            }}>
              <div style={{
                width: isMobile ? '90%' : '100%',
                maxWidth: isMobile ? '90%' : '600px',
                height: 'auto',
                padding: isMobile ? '20px' : '30px 35px',
                position: 'relative',
                background: 'white',
                borderRadius: '15px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                gap: '19px',
                animation: 'fadeIn 0.2s ease-in-out'
              }}>
                <div style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  gap: '13px'
                }}>
                  <div style={{
                    textAlign: 'center',
                    color: 'black',
                    fontSize: '20px',
                    fontFamily: 'Inter',
                    fontWeight: 700
                  }}>
                    {showAddPopup ? 'Yetkinlik Ekle' : 'Yetkinlik Düzenle'}
                  </div>
                  <div style={{
                    width: '44px',
                    height: '3px',
                    background: 'black',
                    borderRadius: '29px'
                  }}></div>
                </div>
                
                <div style={{
                  width: '100%',
                  padding: '19px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  gap: '15px'
                }}>
                  <div style={{ position: 'relative' }} data-position-dropdown>
                    <div style={{
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      marginBottom: '8px'
                    }}>
                      Pozisyon
                    </div>
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
                  
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <div style={{
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      fontWeight: 500
                    }}>
                      Müşteri Odaklılık
                    </div>
                    <div style={{
                      width: '100%',
                      display: 'flex',
                      gap: '12px'
                    }}>
                      <input
                        type="number"
                        value={formData.customerFocusMin}
                        onChange={(e) => setFormData({ ...formData, customerFocusMin: e.target.value })}
                        placeholder="Minimum"
                        min="0"
                        max="100"
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          border: '1px solid #E9ECEF',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: 'Inter',
                          outline: 'none'
                        }}
                      />
                      <input
                        type="number"
                        value={formData.customerFocusMax}
                        onChange={(e) => setFormData({ ...formData, customerFocusMax: e.target.value })}
                        placeholder="Maksimum"
                        min="0"
                        max="100"
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          border: '1px solid #E9ECEF',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: 'Inter',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                  
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <div style={{
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      fontWeight: 500
                    }}>
                      Belirsizlik Yönetimi
                    </div>
                    <div style={{
                      width: '100%',
                      display: 'flex',
                      gap: '12px'
                    }}>
                      <input
                        type="number"
                        value={formData.uncertaintyManagementMin}
                        onChange={(e) => setFormData({ ...formData, uncertaintyManagementMin: e.target.value })}
                        placeholder="Minimum"
                        min="0"
                        max="100"
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          border: '1px solid #E9ECEF',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: 'Inter',
                          outline: 'none'
                        }}
                      />
                      <input
                        type="number"
                        value={formData.uncertaintyManagementMax}
                        onChange={(e) => setFormData({ ...formData, uncertaintyManagementMax: e.target.value })}
                        placeholder="Maksimum"
                        min="0"
                        max="100"
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          border: '1px solid #E9ECEF',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: 'Inter',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                  
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <div style={{
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      fontWeight: 500
                    }}>
                      İnsanları Etkileme
                    </div>
                    <div style={{
                      width: '100%',
                      display: 'flex',
                      gap: '12px'
                    }}>
                      <input
                        type="number"
                        value={formData.influenceMin}
                        onChange={(e) => setFormData({ ...formData, influenceMin: e.target.value })}
                        placeholder="Minimum"
                        min="0"
                        max="100"
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          border: '1px solid #E9ECEF',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: 'Inter',
                          outline: 'none'
                        }}
                      />
                      <input
                        type="number"
                        value={formData.influenceMax}
                        onChange={(e) => setFormData({ ...formData, influenceMax: e.target.value })}
                        placeholder="Maksimum"
                        min="0"
                        max="100"
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          border: '1px solid #E9ECEF',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: 'Inter',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                  
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <div style={{
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      fontWeight: 500
                    }}>
                      Güven Veren İşbirlikçi ve Sinerji
                    </div>
                    <div style={{
                      width: '100%',
                      display: 'flex',
                      gap: '12px'
                    }}>
                      <input
                        type="number"
                        value={formData.collaborationMin}
                        onChange={(e) => setFormData({ ...formData, collaborationMin: e.target.value })}
                        placeholder="Minimum"
                        min="0"
                        max="100"
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          border: '1px solid #E9ECEF',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: 'Inter',
                          outline: 'none'
                        }}
                      />
                      <input
                        type="number"
                        value={formData.collaborationMax}
                        onChange={(e) => setFormData({ ...formData, collaborationMax: e.target.value })}
                        placeholder="Maksimum"
                        min="0"
                        max="100"
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          border: '1px solid #E9ECEF',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: 'Inter',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  gap: '15px'
                }}>
                  <button
                    onClick={() => {
                      setShowAddPopup(false);
                      setShowEditPopup(false);
                      setShowPositionDropdown(false);
                    }}
                    style={{
                      width: '143px',
                      height: '48px',
                      padding: '14px 20px',
                      background: '#6C757D',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{
                      color: 'white',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      fontWeight: 500
                    }}>
                      İptal
                    </div>
                  </button>
                  <button
                    onClick={showAddPopup ? handleSubmitAdd : handleSubmitEdit}
                    disabled={isSubmitting}
                    style={{
                      width: '143px',
                      height: '48px',
                      padding: '14px 20px',
                      background: isSubmitting ? '#9CA3AF' : '#3B82F6',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      opacity: isSubmitting ? 0.7 : 1
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid transparent',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          marginRight: '8px'
                        }}></div>
                        {showAddPopup ? 'Kaydediliyor...' : 'Güncelleniyor...'}
                      </>
                    ) : (
                      <div style={{
                        color: 'white',
                        fontSize: '14px',
                        fontFamily: 'Inter',
                        fontWeight: 500
                      }}>
                        {showAddPopup ? 'Kaydet' : 'Güncelle'}
                      </div>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowAddPopup(false);
                    setShowEditPopup(false);
                    setShowPositionDropdown(false);
                  }}
                  style={{
                    width: '24px',
                    height: '24px',
                    padding: '4px',
                    position: 'absolute',
                    right: '13px',
                    top: '13px',
                    background: '#E5E5E5',
                    borderRadius: '29px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fas fa-times" style={{
                    width: '10px',
                    height: '10px',
                    color: '#666'
                  }}></i>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Delete Popup */}
        {showDeletePopup && (
          <>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes fadeIn {
                0% { opacity: 0; transform: scale(0.9); }
                100% { opacity: 1; transform: scale(1); }
              }
            `}</style>
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000
            }}>
              <div style={{
                width: isMobile ? '90%' : '400px',
                background: 'white',
                borderRadius: '10px',
                padding: isMobile ? '15px' : '20px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                animation: 'fadeIn 0.2s ease-in-out'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #0286F7'
                }}>
                  <div style={{
                    color: '#0286F7',
                    fontSize: '20px',
                    fontWeight: 700
                  }}>
                    Yetkinlik Sil
                  </div>
                  <button
                    onClick={() => setShowDeletePopup(false)}
                    style={{
                      cursor: 'pointer',
                      fontSize: '24px',
                      color: '#666',
                      background: 'none',
                      border: 'none'
                    }}
                  >
                    ×
                  </button>
                </div>
                <div style={{
                  padding: '20px 0',
                  textAlign: 'center'
                }}>
                  <p style={{
                    margin: '10px 0',
                    color: '#232D42',
                    fontSize: '16px'
                  }}>
                    Bu yetkinlikleri silmek istediğinizden emin misiniz?
                  </p>
                  <p style={{
                    margin: '10px 0',
                    color: '#dc3545',
                    fontWeight: 500,
                    fontSize: '16px'
                  }}>
                    Bu işlem geri alınamaz!
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '20px',
                  paddingTop: '20px'
                }}>
                  <button
                    onClick={() => setShowDeletePopup(false)}
                    style={{
                      background: '#6C757D',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 24px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      fontWeight: 500
                    }}
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isSubmitting}
                    style={{
                      background: isSubmitting ? '#9CA3AF' : '#DC3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 24px',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      opacity: isSubmitting ? 0.7 : 1
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid transparent',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          display: 'inline-block',
                          marginRight: '8px'
                        }}></div>
                        Siliniyor...
                      </>
                    ) : (
                      'Sil'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Import Popup */}
        {showImportPopup && (
          <>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes fadeIn {
                0% { opacity: 0; transform: scale(0.9); }
                100% { opacity: 1; transform: scale(1); }
              }
            `}</style>
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000
            }}>
              <div style={{
                width: '500px',
                background: 'white',
                borderRadius: '10px',
                padding: '20px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                animation: 'fadeIn 0.2s ease-in-out'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #0286F7'
                }}>
                  <div style={{
                    color: '#0286F7',
                    fontSize: '20px',
                    fontWeight: 700
                  }}>
                    Excel Import
                  </div>
                  <button
                    onClick={() => setShowImportPopup(false)}
                    style={{
                      cursor: 'pointer',
                      fontSize: '24px',
                      color: '#666',
                      background: 'none',
                      border: 'none'
                    }}
                  >
                    ×
                  </button>
                </div>
                <div style={{
                  padding: '20px 0'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    gap: '8px'
                  }}>
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
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      id="excelFileInput"
                    />
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '16px'
                    }}>
                      <i className="fas fa-file-excel" style={{
                        fontSize: '48px',
                        color: '#28A745'
                      }}></i>
                      <div>
                        <div style={{
                          color: '#232D42',
                          fontSize: '16px',
                          fontWeight: 500,
                          marginBottom: '8px'
                        }}>
                          {selectedFile ? selectedFile.name : 'Excel dosyası seçin veya sürükleyin'}
                        </div>
                        <div style={{
                          color: '#8A92A6',
                          fontSize: '14px'
                        }}>
                          .xlsx veya .xls formatında dosya yükleyin
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '20px',
                  paddingTop: '20px'
                }}>
                  <button
                    onClick={() => setShowImportPopup(false)}
                    style={{
                      background: '#6C757D',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 24px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      fontWeight: 500
                    }}
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!selectedFile || isImporting}
                    style={{
                      background: selectedFile && !isImporting ? '#28A745' : '#6C757D',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 24px',
                      cursor: selectedFile && !isImporting ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {isImporting ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Yükleniyor...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-upload"></i>
                        Yükle
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Success Popup */}
        {showSuccessPopup && (
          <>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes fadeIn {
                0% { opacity: 0; transform: scale(0.9); }
                100% { opacity: 1; transform: scale(1); }
              }
            `}</style>
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: 'white',
                borderRadius: '8px',
                padding: '30px 35px',
                maxWidth: '400px',
                width: '90%',
                textAlign: 'center',
                animation: 'fadeIn 0.2s ease-in-out'
              }}>
                <div style={{
                  color: '#232D42',
                  fontSize: '18px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat',
                  marginBottom: '20px'
                }}>
                  Başarılı!
                </div>
                <div style={{
                  color: '#6B7280',
                  fontSize: '14px',
                  fontFamily: 'Inter',
                  marginBottom: '30px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-line'
                }}>
                  {successMessage}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={() => setShowSuccessPopup(false)}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '6px',
                      background: '#3B82F6',
                      color: 'white',
                      fontFamily: 'Inter',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Tamam
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Hata Popup */}
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
      </div>
    </>
  );
};

export default CompetencySettings;
