import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { organizationAPI } from '../services/api';
import * as XLSX from 'xlsx';

interface Organization {
  _id: string;
  genelMudurYardimciligi?: string;
  direktörlük?: string;
  müdürlük?: string;
  grupLiderligi?: string;
  unvan?: string;
  pozisyon?: string;
}

const Organization: React.FC = () => {
  const { t } = useLanguage();
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
  const [showBulkDeletePopup, setShowBulkDeletePopup] = useState(false);
  const [showImportPopup, setShowImportPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const formatTemplate = (template: string, params: Record<string, string | number>) =>
    Object.entries(params).reduce(
      (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
      template
    );

  const formatNoResultsText = (term: string) => {
    if (term) {
      return formatTemplate(t('labels.noSearchResults'), { query: term });
    }
    return t('labels.noOrganizationYet');
  };

  const formatSearchResultsCount = (term: string, count: number) =>
    formatTemplate(t('labels.searchResultsCount'), { term, count });

  const formatBulkDeleteConfirm = (count: number) =>
    formatTemplate(t('labels.bulkDeleteOrganizationsConfirm'), { count });

  const formatSingleDeleteConfirm = () => t('labels.deleteOrganizationConfirm');

  const getTemplateFileName = () => t('labels.organizationTemplateFile');
  
  // Form states
  const [formData, setFormData] = useState({
    genelMudurYardimciligi: '',
    direktörlük: '',
    müdürlük: '',
    grupLiderligi: '',
    unvan: '',
    pozisyon: ''
  });
  const defaultTitleOptions = [
    'Direktör',
    'Müdür/Yönetici',
    'Kıdemli Uzman',
    'Uzman',
    'Uzman Yardımcısı',
    'MT/Stajyer'
  ];
  const [titleOptions, setTitleOptions] = useState<string[]>(defaultTitleOptions);
  const [showTitlePopup, setShowTitlePopup] = useState(false);
  const [editTitleOptions, setEditTitleOptions] = useState<string[]>([]);
  const [isTitleSaving, setIsTitleSaving] = useState(false);

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
    loadTitleOptions();
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

  // Sayfa değiştiğinde seçimleri temizle
  useEffect(() => {
    setSelectedItems([]);
  }, [currentPage]);

  const loadOrganizations = async () => {
    try {
      setIsLoading(true);
      
      const result = await organizationAPI.getAll();
      
      if (result.data.success) {
        setOrganizations(result.data.organizations || []);
      } else {
        throw new Error(result.data.message || t('errors.organizationListFetch'));
      }
    } catch (error: any) {
      console.error('💥 Organizasyon yükleme hatası:', error);
      setErrorMessage(t('errors.organizationLoadFailed'));
      setShowErrorPopup(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTitleOptions = async () => {
    try {
      const result = await organizationAPI.getTitleOptions();
      if (result.data?.success && Array.isArray(result.data.titleOptions)) {
        setTitleOptions(result.data.titleOptions.length > 0 ? result.data.titleOptions : defaultTitleOptions);
      } else {
        setTitleOptions(defaultTitleOptions);
      }
    } catch (error: any) {
      console.error('💥 Unvan listesi yükleme hatası:', error);
      setErrorMessage(t('errors.titleOptionsFetch'));
      setShowErrorPopup(true);
      setTitleOptions(defaultTitleOptions);
    }
  };

  const handleAddOrganization = () => {
    setFormData({
      genelMudurYardimciligi: '',
      direktörlük: '',
      müdürlük: '',
      grupLiderligi: '',
      unvan: '',
      pozisyon: ''
    });
    setShowAddPopup(true);
  };

  const openTitlePopup = () => {
    setEditTitleOptions(titleOptions.length > 0 ? [...titleOptions] : ['']);
    setShowTitlePopup(true);
  };

  const closeTitlePopup = () => {
    setShowTitlePopup(false);
    setEditTitleOptions([]);
  };

  const updateTitleOption = (index: number, value: string) => {
    setEditTitleOptions(prev =>
      prev.map((item, i) => (i === index ? value : item))
    );
  };

  const addTitleOption = () => {
    setEditTitleOptions(prev => [...prev, '']);
  };

  const removeTitleOption = (index: number) => {
    setEditTitleOptions(prev => {
      if (prev.length === 1) {
        return [''];
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const moveTitleOption = (fromIndex: number, toIndex: number) => {
    setEditTitleOptions(prev => {
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const handleSaveTitleOptions = async () => {
    const trimmed = editTitleOptions.map(item => item.trim());
    if (trimmed.length < 3 || trimmed.length > 6) {
      setErrorMessage(t('errors.titleOptionsMinMax'));
      setShowErrorPopup(true);
      return;
    }
    if (trimmed.some(item => item === '')) {
      setErrorMessage(t('errors.titleOptionsEmpty'));
      setShowErrorPopup(true);
      return;
    }

    const seen = new Set<string>();
    for (const item of trimmed) {
      const key = item.toLowerCase();
      if (seen.has(key)) {
        setErrorMessage(t('errors.titleOptionsDuplicate'));
        setShowErrorPopup(true);
        return;
      }
      seen.add(key);
    }

    try {
      setIsTitleSaving(true);
      const result = await organizationAPI.updateTitleOptions(trimmed);
      if (result.data?.success) {
        setTitleOptions(trimmed);
        setSuccessMessage(result.data.message || t('labels.success'));
        setShowSuccessPopup(true);
        closeTitlePopup();
      } else {
        setErrorMessage(result.data?.message || t('errors.titleOptionsUpdate'));
        setShowErrorPopup(true);
      }
    } catch (error: any) {
      console.error('💥 Unvan listesi güncelleme hatası:', error);
      setErrorMessage(error.response?.data?.message || t('errors.titleOptionsUpdate'));
      setShowErrorPopup(true);
    } finally {
      setIsTitleSaving(false);
    }
  };

  const handleEditOrganization = (organization: Organization) => {
    setSelectedOrganization(organization);
    setFormData({
      genelMudurYardimciligi: organization.genelMudurYardimciligi || '',
      direktörlük: organization.direktörlük || '',
      müdürlük: organization.müdürlük || '',
      grupLiderligi: organization.grupLiderligi || '',
      unvan: organization.unvan || '',
      pozisyon: organization.pozisyon || ''
    });
    setShowEditPopup(true);
  };

  const handleDeleteOrganization = (organization: Organization) => {
    setSelectedOrganization(organization);
    setShowDeletePopup(true);
  };

  // Checkbox seçim fonksiyonları
  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const visibleOrganizations = filteredOrganizations;
    if (selectedItems.length === visibleOrganizations.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(visibleOrganizations.map(org => org._id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) {
      setErrorMessage('Lütfen silmek istediğiniz kayıtları seçiniz!');
      setShowErrorPopup(true);
      return;
    }
    setShowBulkDeletePopup(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      setIsSubmitting(true);
      // Her bir organizasyonu tek tek sil
      const deletePromises = selectedItems.map(id => 
        organizationAPI.delete(id)
      );
      
      await Promise.all(deletePromises);

      // Başarılı silme sonrası
      setShowBulkDeletePopup(false);
      setSelectedItems([]);
      
      // Veriyi yeniden yükle
      await loadOrganizations();
      
      setSuccessMessage(formatTemplate(t('messages.organizationsDeleted'), { count: selectedItems.length }));
      setShowSuccessPopup(true);
    } catch (error: any) {
      console.error('Toplu silme hatası:', error);
      setErrorMessage(error.response?.data?.message || t('errors.bulkDeleteFailed'));
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAdd = async () => {
    try {
      setIsSubmitting(true);
      
      // Form validasyonu - Pozisyon ve Unvan zorunlu
      if (!formData.pozisyon || formData.pozisyon.trim() === '') {
        setErrorMessage(t('errors.positionRequired'));
        setShowErrorPopup(true);
        return;
      }
      
      if (!formData.unvan || formData.unvan.trim() === '') {
        setErrorMessage(t('errors.titleRequired'));
        setShowErrorPopup(true);
        return;
      }

      if (!formData.grupLiderligi || formData.grupLiderligi.trim() === '') {
        setErrorMessage(t('errors.departmentRequired'));
        setShowErrorPopup(true);
        return;
      }
      
      // Diğer alanları temizle - boş olanları "-" yap, "-" olanları olduğu gibi bırak
      const cleanedFormData = {
        genelMudurYardimciligi: formData.genelMudurYardimciligi.trim(),
        direktörlük: formData.direktörlük.trim() === '' ? '-' : formData.direktörlük.trim(),
        müdürlük: formData.müdürlük.trim() === '' ? '-' : formData.müdürlük.trim(),
        grupLiderligi: formData.grupLiderligi.trim(),
        unvan: formData.unvan.trim() === '' ? '-' : formData.unvan.trim(),
        pozisyon: formData.pozisyon.trim()
      };
      
      // Birebir aynı satır kontrolü
      const isDuplicate = organizations.some(org => 
        org.genelMudurYardimciligi === cleanedFormData.genelMudurYardimciligi &&
        org.direktörlük === cleanedFormData.direktörlük &&
        org.müdürlük === cleanedFormData.müdürlük &&
        org.grupLiderligi === cleanedFormData.grupLiderligi &&
        org.unvan === cleanedFormData.unvan &&
        org.pozisyon === cleanedFormData.pozisyon
      );
      
      if (isDuplicate) {
        setErrorMessage(t('errors.organizationStructureExists'));
        setShowErrorPopup(true);
        return;
      }
      
      
      const result = await organizationAPI.create(cleanedFormData);
      
      // Yeni organizasyonu listenin en üstüne ekle
      setOrganizations(prev => [result.data.organization, ...prev]);
      
      // Başarı mesajı göster
      setShowAddPopup(false);
      setShowSuccessPopup(true);
      setSuccessMessage(t('messages.organizationAdded'));
    } catch (error: any) {
      console.error('💥 Organizasyon ekleme hatası:', error);
      setErrorMessage(error.response?.data?.message || t('errors.organizationAddError'));
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    try {
      if (!selectedOrganization) return;
      setIsSubmitting(true);
      
      // Form validasyonu - Pozisyon ve Unvan zorunlu
      if (!formData.pozisyon || formData.pozisyon.trim() === '') {
        setErrorMessage(t('errors.positionRequired'));
        setShowErrorPopup(true);
        return;
      }
      
      if (!formData.unvan || formData.unvan.trim() === '') {
        setErrorMessage(t('errors.titleRequired'));
        setShowErrorPopup(true);
        return;
      }

      if (!formData.grupLiderligi || formData.grupLiderligi.trim() === '') {
        setErrorMessage(t('errors.departmentRequired'));
        setShowErrorPopup(true);
        return;
      }
      
      // Diğer alanları temizle - boş olanları "-" yap, "-" olanları olduğu gibi bırak
      const cleanedFormData = {
        genelMudurYardimciligi: formData.genelMudurYardimciligi.trim(),
        direktörlük: formData.direktörlük.trim() === '' ? '-' : formData.direktörlük.trim(),
        müdürlük: formData.müdürlük.trim() === '' ? '-' : formData.müdürlük.trim(),
        grupLiderligi: formData.grupLiderligi.trim(),
        unvan: formData.unvan.trim() === '' ? '-' : formData.unvan.trim(),
        pozisyon: formData.pozisyon.trim()
      };
      
      // Birebir aynı satır kontrolü (kendi kaydı hariç)
      const isDuplicate = organizations.some(org => 
        org._id !== selectedOrganization._id &&
        org.genelMudurYardimciligi === cleanedFormData.genelMudurYardimciligi &&
        org.direktörlük === cleanedFormData.direktörlük &&
        org.müdürlük === cleanedFormData.müdürlük &&
        org.grupLiderligi === cleanedFormData.grupLiderligi &&
        org.unvan === cleanedFormData.unvan &&
        org.pozisyon === cleanedFormData.pozisyon
      );
      
      if (isDuplicate) {
        setErrorMessage(t('errors.organizationStructureExists'));
        setShowErrorPopup(true);
        return;
      }
      
      
      const result = await organizationAPI.update(selectedOrganization._id, cleanedFormData);
      
      // Güncellenen organizasyonu listede güncelle
      setOrganizations(prev => prev.map(org => 
        org._id === selectedOrganization._id ? result.data.organization : org
      ));
      
      // Başarı mesajı göster
      setShowEditPopup(false);
      setShowSuccessPopup(true);
      setSuccessMessage(t('messages.organizationUpdated'));
    } catch (error: any) {
      console.error('💥 Organizasyon güncelleme hatası:', error);
      setErrorMessage(error.response?.data?.message || t('errors.organizationUpdateError'));
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (!selectedOrganization) return;
      setIsSubmitting(true);
      
      await organizationAPI.delete(selectedOrganization._id);
      
      // Silinen organizasyonu listeden çıkar
      setOrganizations(prev => prev.filter(org => org._id !== selectedOrganization._id));
      
      // Başarı mesajı göster
      setShowDeletePopup(false);
      setShowSuccessPopup(true);
      setSuccessMessage(t('messages.organizationDeleted'));
    } catch (error: any) {
      console.error('💥 Organizasyon silme hatası:', error);
      setErrorMessage(error.response?.data?.message || t('errors.organizationDeleteError'));
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter organizations based on search term
  const filteredOrganizations = organizations.filter(org => {
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
      (org.genelMudurYardimciligi && normalizeText(org.genelMudurYardimciligi).includes(searchNormalized)) ||
      (org.direktörlük && normalizeText(org.direktörlük).includes(searchNormalized)) ||
      (org.müdürlük && normalizeText(org.müdürlük).includes(searchNormalized)) ||
      (org.grupLiderligi && normalizeText(org.grupLiderligi).includes(searchNormalized)) ||
      (org.unvan && normalizeText(org.unvan).includes(searchNormalized)) ||
      (org.pozisyon && normalizeText(org.pozisyon).includes(searchNormalized))
    );
  });

  // Highlight search term in text
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text;
    
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
          fontWeight: '600',
          padding: '2px 4px',
          borderRadius: '4px'
        }}>
          {match}
        </span>
        {afterMatch}
      </>
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
        setErrorMessage(t('errors.onlyExcelAllowed'));
        setShowErrorPopup(true);
      }
    }
  };

  const downloadTemplate = () => {
    try {
      // Excel template verilerini oluştur
      const headers = [
        t('labels.generalManagerAssistant'),
        t('labels.directorate'),
        t('labels.management'),
        `${t('labels.departmentLeadership')} (${t('labels.required')})`,
        `${t('labels.title')} (${t('labels.required')})`,
        `${t('labels.position')} (${t('labels.required')})`
      ];

      // Örnek veri satırı
      const exampleRow = [
        t('labels.sampleGeneralManagerAssistant'),
        t('labels.sampleDirectorate'),
        t('labels.sampleManagement'),
        t('labels.sampleDepartmentLeadership'),
        t('labels.sampleTitle'),
        t('labels.samplePosition')
      ];

      // Boş satırlar için veri
      const emptyRows: string[][] = [];
      for (let i = 0; i < 10; i++) {
        emptyRows.push(['', '', '', '', '', '']);
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
        { wch: 20 }, // Departman
        { wch: 20 }, // Unvan
        { wch: 20 }  // Pozisyon
      ];

      // Worksheet'i workbook'a ekle
      XLSX.utils.book_append_sheet(wb, ws, t('labels.organizationTemplate'));

      // Excel dosyasını indir
      XLSX.writeFile(wb, getTemplateFileName());
      
      setSuccessMessage(t('messages.templateDownloadSuccess'));
      setShowSuccessPopup(true);
      
    } catch (error) {
      console.error('Template indirme hatası:', error);
      setErrorMessage(t('errors.templateDownloadError'));
      setShowErrorPopup(true);
    }
  };

  const handleImportExcel = async () => {
    if (!selectedFile) {
      setErrorMessage(t('errors.selectExcelFirst'));
      setShowErrorPopup(true);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append('excelFile', selectedFile);

      const response = await fetch('/api/organization/import', {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend
      });

      // HTTP status koduna göre hata yönetimi
      if (!response.ok) {
        if (response.status === 401) {
          setErrorMessage(t('errors.noPermissionRelogin'));
          setShowErrorPopup(true);
          return;
        } else if (response.status === 413) {
          setErrorMessage(t('errors.fileTooLarge'));
          setShowErrorPopup(true);
          return;
        } else if (response.status === 400) {
          // Backend'den gelen detaylı hata mesajını kullan
          const errorResult = await response.json();
          let errorMessage = errorResult.message || t('errors.invalidExcelFormat');
          if (errorResult.errors && errorResult.errors.length > 0) {
            errorMessage += `\n\n${t('labels.details')}:\n`;
            errorResult.errors.forEach((error: any) => {
              errorMessage += `• ${t('labels.row')} ${error.row}: ${error.message}\n`;
            });
          }
          setErrorMessage(errorMessage);
          setShowErrorPopup(true);
          return;
        } else {
          setErrorMessage(`${t('errors.serverError')} (${response.status}). ${t('errors.tryAgain')}`);
          setShowErrorPopup(true);
          return;
        }
      }

      const result = await response.json();
      
      if (result.success) {
        let message = result.message;
        
        // Hatalı satırlar varsa onları da göster
        if (result.errors && result.errors.length > 0) {
          message += `\n\n${t('labels.invalidRows')}:\n`;
          result.errors.forEach((error: any) => {
            message += `• ${t('labels.row')} ${error.row}: ${error.message}\n`;
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
        let errorMessage = result.message || t('errors.importError');
        
        // Detaylı hata mesajları varsa onları da göster
        if (result.errors && result.errors.length > 0) {
          errorMessage += `\n\n${t('labels.details')}:\n`;
          result.errors.forEach((error: any) => {
            errorMessage += `• ${t('labels.row')} ${error.row}: ${error.message}\n`;
          });
        }
        
        setErrorMessage(errorMessage);
        setShowErrorPopup(true);
      }

    } catch (error: any) {
      console.error('Import hatası:', error);
      
      let errorMessage = t('errors.importError');
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = t('errors.serverUnreachable');
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
          <div>{t('labels.organizationsLoading')}</div>
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
              {t('titles.organization')}
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
            {t('titles.organization')}
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
            {t('titles.grouping')}
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
            {t('titles.authorization')}
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
              placeholder={t('placeholders.searchAllColumns')}
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
            {selectedItems.length > 0 && (
              <button
                onClick={handleBulkDelete}
                style={{
                  backgroundColor: '#DC3545',
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
                <i className="fas fa-trash"></i>
                {formatTemplate(t('labels.bulkDeleteWithCount'), { count: selectedItems.length })}
              </button>
            )}
            <button
              onClick={openTitlePopup}
              style={{
                backgroundColor: '#6F42C1',
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
              <i className="fas fa-list"></i>
              {t('buttons.editTitles')}
            </button>
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
              {t('buttons.uploadExcel')}
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
              {t('buttons.add')}
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
                  textAlign: 'center',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat',
                  width: '50px'
                }}>
                  <label style={{
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedItems.length > 0 && selectedItems.length === filteredOrganizations.length}
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
                      backgroundColor: selectedItems.length > 0 && selectedItems.length === filteredOrganizations.length ? '#0286F7' : 'white',
                      border: `2px solid ${selectedItems.length > 0 && selectedItems.length === filteredOrganizations.length ? '#0286F7' : '#E9ECEF'}`,
                      borderRadius: '4px',
                      transition: 'all 0.3s ease',
                      transform: selectedItems.length > 0 && selectedItems.length === filteredOrganizations.length ? 'scale(1.1)' : 'scale(1)'
                    }}>
                      {selectedItems.length > 0 && selectedItems.length === filteredOrganizations.length && (
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
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  {t('labels.generalManagerAssistant')}
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  {t('labels.directorate')}
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  {t('labels.management')}
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  {t('labels.departmentLeadership')}
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  {t('labels.title')}
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  {t('labels.position')}
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'right',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  {t('labels.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {searchTerm && (
                <tr>
                  <td colSpan={8} style={{
                    padding: '12px 16px',
                    backgroundColor: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    fontSize: '13px',
                    color: '#64748B',
                    fontFamily: 'Inter',
                    fontWeight: '500'
                  }}>
                    🔍 {formatSearchResultsCount(debouncedSearchTerm, filteredOrganizations.length)}
                  </td>
                </tr>
              )}
              {currentOrganizations.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#8A92A6',
                    fontSize: '14px'
                  }}>
                    {formatNoResultsText(searchTerm)}
                  </td>
                </tr>
              ) : (
                currentOrganizations.map((organization) => (
                  <tr key={organization._id} style={{
                    borderBottom: '1px solid #E9ECEF'
                  }}>
                    <td style={{
                      padding: '16px',
                      textAlign: 'center'
                    }}>
                      <label style={{
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(organization._id)}
                          onChange={() => handleSelectItem(organization._id)}
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
                          backgroundColor: selectedItems.includes(organization._id) ? '#0286F7' : 'white',
                          border: `2px solid ${selectedItems.includes(organization._id) ? '#0286F7' : '#E9ECEF'}`,
                          borderRadius: '4px',
                          transition: 'all 0.3s ease',
                          transform: selectedItems.includes(organization._id) ? 'scale(1.1)' : 'scale(1)'
                        }}>
                          {selectedItems.includes(organization._id) && (
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
                      {highlightText(organization.unvan || '-', searchTerm)}
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
              {t('buttons.previous')}
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
              {t('buttons.next')}
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
                    {t('titles.addOrganization')}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#64748B',
                    fontFamily: 'Inter'
                  }}>
                    {t('labels.addOrganizationDesc')}
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
                    {t('labels.generalManagerAssistant')}
                  </label>
                  <input
                    type="text"
                    value={formData.genelMudurYardimciligi}
                    onChange={(e) => setFormData({ ...formData, genelMudurYardimciligi: e.target.value })}
                    placeholder={t('placeholders.generalManagerAssistant')}
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
                    {t('labels.directorate')}
                  </label>
                  <input
                    type="text"
                    value={formData.direktörlük}
                    onChange={(e) => setFormData({ ...formData, direktörlük: e.target.value })}
                    placeholder={t('placeholders.directorate')}
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
                    {t('labels.management')}
                  </label>
                  <input
                    type="text"
                    value={formData.müdürlük}
                    onChange={(e) => setFormData({ ...formData, müdürlük: e.target.value })}
                    placeholder={t('placeholders.management')}
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
                    {t('labels.departmentLeadership')} <span style={{ color: '#E53E3E' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.grupLiderligi}
                    onChange={(e) => setFormData({ ...formData, grupLiderligi: e.target.value })}
                    placeholder={t('placeholders.departmentLeadership')}
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
                    {t('labels.title')} <span style={{ color: '#E53E3E' }}>*</span>
                  </label>
                  <select
                    value={formData.unvan}
                    onChange={(e) => setFormData({ ...formData, unvan: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      outline: 'none',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">{t('placeholders.title')}</option>
                    {titleOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
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
                    {t('labels.position')} <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.pozisyon}
                    onChange={(e) => setFormData({ ...formData, pozisyon: e.target.value })}
                    placeholder={t('placeholders.position')}
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
                  {t('buttons.cancel')}
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
                  {isSubmitting ? t('statuses.adding') : t('buttons.add')}
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
                    {t('titles.editOrganization')}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#64748B',
                    fontFamily: 'Inter'
                  }}>
                    {t('labels.editOrganizationDesc')}
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
                    {t('labels.generalManagerAssistant')}
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
                    {t('labels.directorate')}
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
                    {t('labels.management')}
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
                    {t('labels.departmentLeadership')} <span style={{ color: '#E53E3E' }}>*</span>
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
                    {t('labels.title')} <span style={{ color: '#E53E3E' }}>*</span>
                  </label>
                  <select
                    value={formData.unvan}
                    onChange={(e) => setFormData({ ...formData, unvan: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      outline: 'none',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">{t('placeholders.title')}</option>
                    {titleOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
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
                    {t('labels.position')} <span style={{ color: '#DC2626' }}>*</span>
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
                  {t('buttons.cancel')}
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
                  {isSubmitting ? t('statuses.updating') : t('buttons.update')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Delete Popup */}
        {showBulkDeletePopup && (
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
                marginBottom: '16px'
              }}>
                {t('titles.bulkDeleteOrganizations')}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '24px'
              }}>
                {formatBulkDeleteConfirm(selectedItems.length)}
              </div>
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => setShowBulkDeletePopup(false)}
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 20px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#6B7280',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontFamily: 'Inter'
                  }}
                >
                  {t('buttons.no')}
                </button>
                <button
                  onClick={confirmBulkDelete}
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: '#DC2626',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontFamily: 'Inter'
                  }}
                >
                  {isSubmitting ? t('labels.deleting') : t('buttons.confirmDelete')}
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
                {t('titles.deleteOrganization')}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '24px',
                lineHeight: '1.5',
                fontFamily: 'Inter'
              }}>
                {formatSingleDeleteConfirm()}
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
                  {t('buttons.cancel')}
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
                  {isSubmitting ? t('labels.deleting') : t('buttons.delete')}
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
                {t('labels.success')}
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
                {t('buttons.ok')}
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
                {t('labels.error')}
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
                {t('buttons.ok')}
              </button>
            </div>
          </div>
        )}

        {/* Title Options Popup */}
        {showTitlePopup && (
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
            zIndex: 1600
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '560px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#232D42',
                  fontFamily: 'Inter'
                }}>
                  {t('labels.editTitleOptions')}
                </div>
                <button
                  onClick={closeTitlePopup}
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {editTitleOptions.map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateTitleOption(index, e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontFamily: 'Inter',
                        outline: 'none'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => moveTitleOption(index, index - 1)}
                        disabled={index === 0}
                        style={{
                          backgroundColor: '#F3F4F6',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          color: '#374151'
                        }}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveTitleOption(index, index + 1)}
                        disabled={index === editTitleOptions.length - 1}
                        style={{
                          backgroundColor: '#F3F4F6',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          cursor: index === editTitleOptions.length - 1 ? 'not-allowed' : 'pointer',
                          color: '#374151'
                        }}
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeTitleOption(index)}
                        style={{
                          backgroundColor: '#FEE2E2',
                          border: '1px solid #FECACA',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          cursor: 'pointer',
                          color: '#B91C1C'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addTitleOption}
                disabled={editTitleOptions.length >= 6}
                style={{
                  marginTop: '16px',
                  backgroundColor: editTitleOptions.length >= 6 ? '#E5E7EB' : '#EEF2FF',
                  color: editTitleOptions.length >= 6 ? '#9CA3AF' : '#4338CA',
                  border: '1px solid #C7D2FE',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: editTitleOptions.length >= 6 ? 'not-allowed' : 'pointer'
                }}
              >
                + {t('labels.addTitleOption')}
              </button>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid #E5E7EB'
              }}>
                <button
                  onClick={closeTitlePopup}
                  disabled={isTitleSaving}
                  style={{
                    backgroundColor: '#F3F4F6',
                    color: '#374151',
                    border: '1px solid #D1D5DB',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: isTitleSaving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {t('buttons.cancel')}
                </button>
                <button
                  onClick={handleSaveTitleOptions}
                  disabled={isTitleSaving}
                  style={{
                    backgroundColor: isTitleSaving ? '#9CA3AF' : '#3B82F6',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: isTitleSaving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isTitleSaving ? t('statuses.saving') : t('buttons.save')}
                </button>
              </div>
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
                  {t('labels.excelImport')}
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
                    {t('labels.uploadExcelFile')}
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
                  {t('buttons.downloadTemplate')}
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
                  {t('labels.selectOrDropExcel')}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6B7280'
                }}>
                  {t('labels.supportedFormats')}
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
                  {t('labels.selectedFile')}: {selectedFile.name}
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
                  {t('buttons.cancel')}
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
                  {isSubmitting ? t('labels.uploading') : t('buttons.upload')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default Organization;
