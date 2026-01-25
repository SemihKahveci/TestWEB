import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { evaluationAPI } from '../services/api';
import * as XLSX from 'xlsx';

// Dinamik API base URL - hem local hem live'da çalışır
const API_BASE_URL = (import.meta as any).env?.DEV 
  ? `${window.location.protocol}//${window.location.hostname}:5000`  // Development
  : '';  // Production (aynı domain'de serve edilir

interface UserResult {
  code: string;
  name: string;
  email: string;
  status: string;
  sentDate: string;
  completionDate: string;
  expiryDate: string;
  customerFocusScore: number | string;
  uncertaintyScore: number | string;
  ieScore: number | string;
  idikScore: number | string;
  isGrouped?: boolean;
  groupCount?: number;
  allGroupItems?: UserResult[];
}

const ResultsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [results, setResults] = useState<UserResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<UserResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false); // Backend arama için ayrı loading
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [originalTotalCount, setOriginalTotalCount] = useState(0); // Filtreleme öncesi toplam kayıt sayısı
  
  // Popup states
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    customerFocusMin: 5 as number | string,
    customerFocusMax: 95 as number | string,
    uncertaintyMin: 5 as number | string,
    uncertaintyMax: 95 as number | string,
    ieMin: 5 as number | string,
    ieMax: 95 as number | string,
    idikMin: 5 as number | string,
    idikMax: 95 as number | string,
    startDate: '',
    endDate: ''
  });
  const [filtersApplied, setFiltersApplied] = useState(false); // Filtreleme yapıldı mı?
  const [isMobile, setIsMobile] = useState(false);
  
  const hasLoaded = useRef(false);
  const lastSearchTerm = useRef<string>('');

  const formatDateRangeError = () =>
    language === 'en'
      ? 'Start date cannot be after end date!'
      : 'Başlangıç tarihi bitiş tarihinden sonra olamaz!';

  const formatMinMaxError = (label: string) =>
    language === 'en'
      ? `${label} score: Minimum must be less than maximum!`
      : `${label} Skoru: Minimum değer maksimum değerden küçük olmalıdır!`;

  const formatRangeInfo = (start: number, end: number, total: number) =>
    language === 'en'
      ? `${start}-${end} of ${total} records`
      : `${start}-${end} arası, toplam ${total} kayıt`;

  const formatGroupCount = (count: number) =>
    language === 'en' ? `(${count} results)` : `(${count} sonuç)`;

  const formatNoSearchResults = (query: string) =>
    language === 'en'
      ? `No search results for "${query}"`
      : `"${query}" için arama sonucu bulunamadı`;

  const formatExcelFileName = (dateStr: string, timeStr: string) =>
    language === 'en'
      ? `Andron_Competency_Results_${dateStr}_${timeStr}.xlsx`
      : `Andron_Yetkinlik_Sonuçları_${dateStr}_${timeStr}.xlsx`;

  const parseDateInput = (value: string) => {
    if (!value) return null;
    const normalized = value.trim();
    if (!normalized) return null;

    if (language === 'en') {
      const match = normalized.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
      if (!match) return null;
      const month = Number(match[1]);
      const day = Number(match[2]);
      const year = Number(match[3]);
      const date = new Date(year, month - 1, day);
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
      return date;
    }

    const match = normalized.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if (!match) return null;
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return date;
  };

  const loadData = useCallback(async (showLoading = true, page?: number, search?: string) => {
    try {
      // Parametreler verilmediyse state'ten al
      const pageToUse = page ?? currentPage;
      const searchToUse = search ?? debouncedSearchTerm;
      
      // Sadece ilk yüklemede veya sayfa değiştiğinde loading göster
      // Arama için loading gösterme (arka planda çalışsın)
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsSearching(true);
      }
      
      // Pagination ile veri çek (sadece "Tamamlandı" statüsündeki kayıtlar)
      const response = await evaluationAPI.getAll(
        pageToUse, 
        itemsPerPage, 
        searchToUse, // Debounced search term kullan
        'Tamamlandı', // Sadece tamamlanan sonuçlar
        true // showExpiredWarning (tüm kayıtları göster)
      );
      
      if (response.data.success && response.data.results) {
        // Pagination bilgilerini kaydet (sadece filtreleme yapılmamışsa)
        if (response.data.pagination && !filtersApplied) {
          setTotalCount(response.data.pagination.total);
          setTotalPages(response.data.pagination.totalPages);
          setOriginalTotalCount(response.data.pagination.total);
        }
        
        // Gruplama yok, tüm veriler güncelliğe göre sıralanmış şekilde geliyor
        const formattedResults = response.data.results.map((result: any) => ({
          ...result,
          isGrouped: false,
          groupCount: 1
        }));
        
        setResults(formattedResults);
        // Eğer filtreleme yapılmamışsa filteredResults'ı güncelle
        // Filtreleme yapılmışsa, filtreleme sonuçlarını koru
        if (!filtersApplied) {
          setFilteredResults(formattedResults);
        }
      } else {
        console.error('❌ API başarısız:', response.data.message);
        setResults([]);
        if (!filtersApplied) {
          setFilteredResults([]);
        }
      }
    } catch (error) {
      console.error('❌ Results veri yükleme hatası:', error);
      setResults([]);
      if (!filtersApplied) {
        setFilteredResults([]);
      }
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, filtersApplied]);

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

  // Debounce search term - kullanıcı yazmayı bitirdikten 500ms sonra arama yap
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Frontend'de anlık filtreleme (akıllı arama)
  // Eğer filtreleme yapılmışsa, filtreleme sonuçları üzerinde arama yap
  useEffect(() => {
    if (filtersApplied) {
      // Filtreleme yapılmışsa, filtreleme sonuçlarını koru ve sadece arama yap
      // Bu useEffect filtreleme sonuçlarını bozmaz
      return;
    }
    
    // Filtreleme yapılmamışsa normal arama yap
    if (searchTerm) {
      // Frontend'de anlık filtreleme yap
      const filtered = results.filter(result =>
        result.name && result.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredResults(filtered);
    } else {
      // Arama yoksa tüm sonuçları göster
      setFilteredResults(results);
    }
  }, [searchTerm, results, filtersApplied]);

  // Debounced search term değiştiğinde sayfayı 1'e resetle ve veri çek
  useEffect(() => {
    if (hasLoaded.current && lastSearchTerm.current !== debouncedSearchTerm) {
      // Arama değiştiğinde sayfayı 1'e resetle ve veri çek
      lastSearchTerm.current = debouncedSearchTerm;
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        // Sayfa zaten 1'deyse direkt veri çek
        loadData(false, 1, debouncedSearchTerm);
      }
    }
  }, [debouncedSearchTerm, loadData, currentPage]);

  // İlk yükleme ve sayfa değiştiğinde veri çek (arama değişmediğinde)
  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      lastSearchTerm.current = debouncedSearchTerm;
      loadData(true); // İlk yüklemede loading göster
    } else if (lastSearchTerm.current === debouncedSearchTerm) {
      // Sadece sayfa değiştiğinde veri çek (arama değişmediğinde)
      // Arama değiştiğinde yukarıdaki useEffect zaten çağrılıyor
      loadData(false); // Sayfa değiştiğinde loading gösterme
    }
  }, [currentPage, loadData, debouncedSearchTerm]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatScore = (score: number | string) => {
    if (score === null || score === undefined || score === '-' || score === 0 || score === '0') return '-';
    return typeof score === 'number' ? score.toFixed(1) : score;
  };

  const getScoreColorClass = (score: number | string) => {
    if (score === '-' || score === 0 || score === '0' || isNaN(Number(score))) return '';
    const numScore = parseFloat(score.toString());
    if (numScore <= 37) return 'red';
    if (numScore <= 65) return 'yellow';
    if (numScore <= 89.99999999999) return 'green';
    return 'red';
  };

  // HTML'deki gibi e-posta adresine göre gruplama
  const groupByEmail = (data: UserResult[]): UserResult[] => {
    const emailGroups: { [key: string]: UserResult[] } = {};
    
    // Verileri e-posta adresine göre grupla
    data.forEach(item => {
      const email = (item.email || 'no-email').toLowerCase();
      if (!emailGroups[email]) {
        emailGroups[email] = [];
      }
      emailGroups[email].push(item);
    });
    
    // Her grup içindeki verileri tarihe göre sırala (en yeni üstte)
    Object.keys(emailGroups).forEach(email => {
      emailGroups[email].sort((a, b) => new Date(b.sentDate || 0).getTime() - new Date(a.sentDate || 0).getTime());
    });
    
    // Gruplandırılmış verileri düzleştir
    const groupedData: UserResult[] = [];
    
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
        // En yeni olan zaten sıralanmış durumda (yukarıda sıralandı)
        const latestItem = group[0]; // En yeni olan
        
        groupedData.push({
          ...latestItem,
          isGrouped: true,
          groupCount: group.length,
          allGroupItems: [latestItem] // Sadece en güncel sonucu tut (performans için)
        });
      }
    });
    
    return groupedData;
  };


  // Filtreleme fonksiyonu
  const applyFilters = async () => {
    try {

      // Tarih kontrolü
      if (filters.startDate || filters.endDate) {
        const startDate = parseDateInput(filters.startDate);
        const endDate = parseDateInput(filters.endDate);
        if ((filters.startDate && !startDate) || (filters.endDate && !endDate)) {
          setErrorMessage(t('errors.invalidDate'));
          setShowErrorPopup(true);
          return;
        }
        if (startDate && endDate && startDate > endDate) {
          setErrorMessage(formatDateRangeError());
          setShowErrorPopup(true);
          return;
        }
      }

      // Minimum ve maksimum değer kontrolü
      const customerFocusMin = typeof filters.customerFocusMin === 'string' ? 5 : filters.customerFocusMin;
      const customerFocusMax = typeof filters.customerFocusMax === 'string' ? 95 : filters.customerFocusMax;
      if (customerFocusMin >= customerFocusMax) {
        setErrorMessage(formatMinMaxError(t('labels.customerFocusScore')));
        setShowErrorPopup(true);
        return;
      }
      
      const uncertaintyMin = typeof filters.uncertaintyMin === 'string' ? 5 : filters.uncertaintyMin;
      const uncertaintyMax = typeof filters.uncertaintyMax === 'string' ? 95 : filters.uncertaintyMax;
      if (uncertaintyMin >= uncertaintyMax) {
        setErrorMessage(formatMinMaxError(t('labels.adaptabilityScore')));
        setShowErrorPopup(true);
        return;
      }
      
      const ieMin = typeof filters.ieMin === 'string' ? 5 : filters.ieMin;
      const ieMax = typeof filters.ieMax === 'string' ? 95 : filters.ieMax;
      if (ieMin >= ieMax) {
        setErrorMessage(formatMinMaxError(t('labels.influenceScore')));
        setShowErrorPopup(true);
        return;
      }
      
      const idikMin = typeof filters.idikMin === 'string' ? 5 : filters.idikMin;
      const idikMax = typeof filters.idikMax === 'string' ? 95 : filters.idikMax;
      if (idikMin >= idikMax) {
        setErrorMessage(formatMinMaxError(t('labels.trustScore')));
        setShowErrorPopup(true);
        return;
      }

      // Filtreleme yapmadan önce backend'den TÜM verileri çek
      setIsSearching(true);
      const response = await evaluationAPI.getAll(
        undefined, // page: undefined (tüm sayfalar)
        undefined, // limit: undefined (limit yok, tüm veriler)
        debouncedSearchTerm || '', // searchTerm korunuyor
        'Tamamlandı', // Sadece tamamlanan sonuçlar
        true // showExpiredWarning
      );

      if (!response.data.success || !response.data.results) {
        setErrorMessage(t('errors.dataLoadFailed'));
        setShowErrorPopup(true);
        setIsSearching(false);
        return;
      }

      // Tüm sonuçları al
      const allResults = response.data.results.map((result: any) => ({
        ...result,
        isGrouped: false,
        groupCount: 1
      }));

      // Tüm veriler üzerinde filtreleme yap
      const filteredItems = allResults.filter(item => {
        try {
          if (!item || !item.name) {
            return false;
          }

          const itemName = item.name.toString().toLowerCase();
          const customerFocusScore = item.customerFocusScore === '-' ? null : parseFloat(item.customerFocusScore.toString());
          const uncertaintyScore = item.uncertaintyScore === '-' ? null : parseFloat(item.uncertaintyScore.toString());
          const ieScore = item.ieScore === '-' ? null : parseFloat(item.ieScore.toString());
          const idikScore = item.idikScore === '-' ? null : parseFloat(item.idikScore.toString());

          // İsim araması (kaldırıldı - sadece üstteki arama kutusu kullanılıyor)
          let nameMatch = true;

          // Müşteri Odaklılık Skoru filtresi
          let customerFocusMatch = true;
          if (customerFocusScore !== null) {
            const min = typeof filters.customerFocusMin === 'string' ? 5 : filters.customerFocusMin;
            const max = typeof filters.customerFocusMax === 'string' ? 95 : filters.customerFocusMax;
            customerFocusMatch = customerFocusScore >= min && customerFocusScore <= max;
          }

          // Belirsizlik Yönetimi Skoru filtresi
          let uncertaintyMatch = true;
          if (uncertaintyScore !== null) {
            const min = typeof filters.uncertaintyMin === 'string' ? 5 : filters.uncertaintyMin;
            const max = typeof filters.uncertaintyMax === 'string' ? 95 : filters.uncertaintyMax;
            uncertaintyMatch = uncertaintyScore >= min && uncertaintyScore <= max;
          }

          // IE Skoru filtresi
          let ieMatch = true;
          if (ieScore !== null) {
            const min = typeof filters.ieMin === 'string' ? 5 : filters.ieMin;
            const max = typeof filters.ieMax === 'string' ? 95 : filters.ieMax;
            ieMatch = ieScore >= min && ieScore <= max;
          }

          // IDIK Skoru filtresi
          let idikMatch = true;
          if (idikScore !== null) {
            const min = typeof filters.idikMin === 'string' ? 5 : filters.idikMin;
            const max = typeof filters.idikMax === 'string' ? 95 : filters.idikMax;
            idikMatch = idikScore >= min && idikScore <= max;
          }

          // Tarih filtresi
          let dateMatch = true;
          if (filters.startDate || filters.endDate) {
            const completionDate = new Date(item.completionDate);
            const startDate = parseDateInput(filters.startDate);
            const endDate = parseDateInput(filters.endDate);
            if (startDate) {
              dateMatch = dateMatch && completionDate >= startDate;
            }
            if (endDate) {
              endDate.setHours(23, 59, 59, 999); // Günün sonuna kadar
              dateMatch = dateMatch && completionDate <= endDate;
            }
          }

          return nameMatch && customerFocusMatch && uncertaintyMatch && ieMatch && idikMatch && dateMatch;
        } catch (error) {
          console.error('Öğe filtreleme hatası:', error, item);
          return false;
        }
      });

      // Gruplama yok, sadece filtreleme yap
      setFilteredResults(filteredItems);
      setFiltersApplied(true); // Filtreleme yapıldığını işaretle
      
      // Filtreleme sonuçlarına göre sayfalama bilgilerini güncelle
      const filteredCount = filteredItems.length;
      setTotalCount(filteredCount);
      setTotalPages(Math.ceil(filteredCount / itemsPerPage));
      setCurrentPage(1);

      setIsSearching(false);
      setShowFilterPopup(false);
    } catch (error) {
      console.error('Filtreleme hatası:', error);
      setIsSearching(false);
      setErrorMessage(t('errors.filterFailed'));
      setShowErrorPopup(true);
    }
  };

  // Filtreleri temizle
  const clearFilters = () => {
    setFilters({
      customerFocusMin: 5,
      customerFocusMax: 95,
      uncertaintyMin: 5,
      uncertaintyMax: 95,
      ieMin: 5,
      ieMax: 95,
      idikMin: 5,
      idikMax: 95,
      startDate: '',
      endDate: ''
    });
    setFiltersApplied(false); // Filtreleme temizlendiğini işaretle
    
    // Backend'den tekrar veri çek (pagination ile)
    setCurrentPage(1);
    loadData(true); // Loading göster
  };

  // Filtre popup'ını kapat
  const closeFilterPopup = () => {
    setShowFilterPopup(false);
  };

  // Hata popup'ını kapat
  const closeErrorPopup = () => {
    setShowErrorPopup(false);
    setErrorMessage('');
  };


  const handleDownloadExcel = async () => {
    try {
      // Loading gösterme - arka planda çalışsın
      
      // Skor değerini formatla - 0 ise "-" göster
      const formatScoreForExcel = (score: number | string) => {
        if (score === null || score === undefined || score === '-' || score === 0 || score === '0') return '-';
        return typeof score === 'number' ? score.toFixed(1) : score;
      };

      let dataToExport: any[] = [];

      // Eğer filtreleme yapılmışsa, sadece filtreli sonuçları kullan
      if (filtersApplied) {
        // Filtreli sonuçları kullan
        dataToExport = filteredResults
          .filter(item => item.status === 'Tamamlandı')
          .map(item => ({
            [t('labels.nameSurname')]: item.name || '-',
            [t('labels.email')]: item.email || '-',
            [t('labels.completionDate')]: formatDate(item.completionDate) || '-',
            [t('labels.customerFocusScore')]: formatScoreForExcel(item.customerFocusScore),
            [t('labels.adaptabilityScore')]: formatScoreForExcel(item.uncertaintyScore),
            [t('labels.influenceScore')]: formatScoreForExcel(item.ieScore),
            [t('labels.trustScore')]: formatScoreForExcel(item.idikScore)
          }));
      } else {
        // Filtreleme yapılmamışsa, backend'den tüm verileri çek
        const response = await evaluationAPI.getAll(
          undefined, // page: undefined (tüm sayfalar)
          undefined, // limit: undefined (limit yok, tüm veriler)
          debouncedSearchTerm || '', // searchTerm korunuyor
          'Tamamlandı', // Sadece tamamlanan sonuçlar
          true // showExpiredWarning
        );

        if (!response.data.success || !response.data.results) {
          setErrorMessage(t('errors.dataLoadFailed'));
          setShowErrorPopup(true);
          return;
        }

        // Tüm sonuçları al
        const allResults = response.data.results;

        // Excel için veriyi formatla
        dataToExport = allResults
          .filter(item => item.status === 'Tamamlandı')
          .map(item => ({
            [t('labels.nameSurname')]: item.name || '-',
            [t('labels.email')]: item.email || '-',
            [t('labels.completionDate')]: formatDate(item.completionDate) || '-',
            [t('labels.customerFocusScore')]: formatScoreForExcel(item.customerFocusScore),
            [t('labels.adaptabilityScore')]: formatScoreForExcel(item.uncertaintyScore),
            [t('labels.influenceScore')]: formatScoreForExcel(item.ieScore),
            [t('labels.trustScore')]: formatScoreForExcel(item.idikScore)
          }));
      }

      if (dataToExport.length === 0) {
        setErrorMessage(t('errors.noDataToDownload'));
        setShowErrorPopup(true);
        return;
      }

      // Excel workbook oluştur
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);

      // Sütun genişliklerini ayarla
      const columnWidths = [
        { wch: 20 }, // Ad Soyad
        { wch: 25 }, // E-posta
        { wch: 18 }, // Tamamlanma Tarihi
        { wch: 25 }, // Müşteri Odaklılık
        { wch: 25 }, // Belirsizlik Yönetimi
        { wch: 25 }, // İnsanları Etkileme
        { wch: 35 }  // Güven Veren İşbirliği
      ];
      worksheet['!cols'] = columnWidths;

      // Worksheet'i workbook'a ekle
      XLSX.utils.book_append_sheet(workbook, worksheet, t('labels.personScoresSheet'));

      // Dosya adını oluştur
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = formatExcelFileName(dateStr, timeStr);

      // Excel dosyasını indir
      XLSX.writeFile(workbook, fileName);

    } catch (error) {
      console.error('Excel indirme hatası:', error);
      setErrorMessage(t('errors.excelDownloadFailed'));
      setShowErrorPopup(true);
    }
  };

  // Pagination: Eğer filtreleme yapılmışsa frontend'de sayfalama yap, yoksa backend'den gelen sayfalanmış veriyi kullan
  const paginatedResults = filtersApplied 
    ? filteredResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredResults;

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '2px solid #3B82F6',
          borderTop: '2px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{
          color: '#666',
          fontSize: '14px',
          fontFamily: 'Inter'
        }}>
          {t('labels.loadingData')}
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
            {t('titles.personScores')}
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        {/* Search Box */}
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
            placeholder={t('placeholders.searchByNameSmart')}
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value;
              setSearchTerm(value);
              // Filtreleme backend'de yapılıyor, sadece state'i güncelle
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

        {/* Right Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* Refresh Button */}
          <button
            onClick={() => loadData(true)}
            style={{
              background: '#0286F7',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.3s',
              fontFamily: 'Inter'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0275D8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0286F7';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('buttons.refresh')}
          </button>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilterPopup(true)}
            style={{
              background: '#0286F7',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.3s',
              fontFamily: 'Inter'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0275D8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0286F7';
            }}
          >
            <i className="fas fa-filter"></i>
            {t('buttons.filter')}
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownloadExcel}
            style={{
              background: '#1D6F42',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.3s',
              fontFamily: 'Inter'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1A5F2E';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1D6F42';
            }}
          >
            <i className="fas fa-download"></i>
            {t('buttons.downloadResults')}
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          overflowX: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #E9ECEF'
          }}>
            <thead>
              <tr style={{
                background: '#F8F9FA',
                borderBottom: '1px solid #E9ECEF'
              }}>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#232D42',
                  fontFamily: 'Inter',
                  borderRight: '1px solid #E9ECEF'
                }}>{t('labels.nameSurname')}</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#232D42',
                  fontFamily: 'Inter',
                  borderRight: '1px solid #E9ECEF'
                }}>{t('labels.completionDate')}</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#232D42',
                  fontFamily: 'Inter',
                  borderRight: '1px solid #E9ECEF'
                }}>{t('labels.customerFocusScore')}</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#232D42',
                  fontFamily: 'Inter',
                  borderRight: '1px solid #E9ECEF'
                }}>{t('labels.adaptabilityScore')}</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#232D42',
                  fontFamily: 'Inter',
                  borderRight: '1px solid #E9ECEF'
                }}>{t('labels.influenceScore')}</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#232D42',
                  fontFamily: 'Inter'
                }}>{t('labels.trustScore')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedResults.map((result, index) => (
                <React.Fragment key={result.code}>
                  <tr style={{
                    borderBottom: '1px solid #F1F3F4',
                    background: index % 2 === 0 ? '#E3F2FD' : 'white'
                  }}>
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                      color: '#232D42',
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      textAlign: 'left',
                      borderRight: '1px solid #E9ECEF'
                    }}>
                      {result.name}
                      {result.isGrouped && result.groupCount && result.groupCount > 1 && (
                        <span style={{
                          color: '#666',
                          fontSize: '12px',
                          marginLeft: '8px'
                        }}>
                          {formatGroupCount(result.groupCount)}
                        </span>
                      )}
                    </td>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    color: '#8A92A6',
                    fontFamily: 'Inter',
                    textAlign: 'center',
                    borderRight: '1px solid #E9ECEF'
                  }}>
                    {formatDate(result.completionDate)}
                  </td>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    fontFamily: 'Inter',
                    textAlign: 'center',
                    borderRight: '1px solid #E9ECEF'
                  }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      backgroundColor: getScoreColorClass(result.customerFocusScore) === 'red' ? '#FF0000' : 
                                     getScoreColorClass(result.customerFocusScore) === 'yellow' ? '#FFD700' : 
                                     getScoreColorClass(result.customerFocusScore) === 'green' ? '#00FF00' : 'transparent',
                      color: getScoreColorClass(result.customerFocusScore) === 'red' ? '#FFF' : 
                             getScoreColorClass(result.customerFocusScore) === 'yellow' ? '#000' : 
                             getScoreColorClass(result.customerFocusScore) === 'green' ? '#000' : '#8A92A6'
                    }}>
                      {formatScore(result.customerFocusScore)}
                    </span>
                  </td>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    fontFamily: 'Inter',
                    textAlign: 'center',
                    borderRight: '1px solid #E9ECEF'
                  }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      backgroundColor: getScoreColorClass(result.uncertaintyScore) === 'red' ? '#FF0000' : 
                                     getScoreColorClass(result.uncertaintyScore) === 'yellow' ? '#FFD700' : 
                                     getScoreColorClass(result.uncertaintyScore) === 'green' ? '#00FF00' : 'transparent',
                      color: getScoreColorClass(result.uncertaintyScore) === 'red' ? '#FFF' : 
                             getScoreColorClass(result.uncertaintyScore) === 'yellow' ? '#000' : 
                             getScoreColorClass(result.uncertaintyScore) === 'green' ? '#000' : '#8A92A6'
                    }}>
                      {formatScore(result.uncertaintyScore)}
                    </span>
                  </td>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    fontFamily: 'Inter',
                    textAlign: 'center',
                    borderRight: '1px solid #E9ECEF'
                  }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      backgroundColor: getScoreColorClass(result.ieScore) === 'red' ? '#FF0000' : 
                                     getScoreColorClass(result.ieScore) === 'yellow' ? '#FFD700' : 
                                     getScoreColorClass(result.ieScore) === 'green' ? '#00FF00' : 'transparent',
                      color: getScoreColorClass(result.ieScore) === 'red' ? '#FFF' : 
                             getScoreColorClass(result.ieScore) === 'yellow' ? '#000' : 
                             getScoreColorClass(result.ieScore) === 'green' ? '#000' : '#8A92A6'
                    }}>
                      {formatScore(result.ieScore)}
                    </span>
                  </td>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    fontFamily: 'Inter',
                    textAlign: 'center'
                  }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      backgroundColor: getScoreColorClass(result.idikScore) === 'red' ? '#FF0000' : 
                                     getScoreColorClass(result.idikScore) === 'yellow' ? '#FFD700' : 
                                     getScoreColorClass(result.idikScore) === 'green' ? '#00FF00' : 'transparent',
                      color: getScoreColorClass(result.idikScore) === 'red' ? '#FFF' : 
                             getScoreColorClass(result.idikScore) === 'yellow' ? '#000' : 
                             getScoreColorClass(result.idikScore) === 'green' ? '#000' : '#8A92A6'
                    }}>
                      {formatScore(result.idikScore)}
                    </span>
                  </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          marginTop: '24px',
          padding: '16px 0'
        }}>
          {/* Pagination Info */}
          <div style={{
            fontSize: '14px',
            color: '#6B7280',
            fontFamily: 'Inter'
          }}>
            {formatRangeInfo(
              ((currentPage - 1) * itemsPerPage) + 1,
              Math.min(currentPage * itemsPerPage, totalCount),
              totalCount
            )}
          </div>

          {/* Pagination Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {/* İlk sayfa */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: currentPage === 1 ? '#F3F4F6' : 'white',
                color: currentPage === 1 ? '#9CA3AF' : '#374151',
                border: '1px solid #E5E7EB',
                borderRadius: '4px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              <i className="fas fa-angle-double-left"></i>
            </button>

            {/* Önceki sayfa */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: currentPage === 1 ? '#F3F4F6' : 'white',
                color: currentPage === 1 ? '#9CA3AF' : '#374151',
                border: '1px solid #E5E7EB',
                borderRadius: '4px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              <i className="fas fa-angle-left"></i>
            </button>

            {/* Sayfa numaraları */}
            {(() => {
              const maxVisiblePages = 5;
              let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
              let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
              
              if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
              }

              const pageButtonStyle = (isActive: boolean) => ({
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? '#3B82F6' : 'white',
                color: isActive ? 'white' : '#374151',
                border: '1px solid #E5E7EB',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'Inter',
                fontWeight: 500
              });

              const pages: JSX.Element[] = [];
              
              // Başlangıçta ellipsis
              if (startPage > 1) {
                pages.push(
                  <button key={1} onClick={() => setCurrentPage(1)} style={pageButtonStyle(false)}>
                    1
                  </button>
                );
                if (startPage > 2) {
                  pages.push(
                    <span key="ellipsis1" style={{ padding: '0 8px', color: '#9CA3AF', fontSize: '14px' }}>...</span>
                  );
                }
              }

              // Sayfa numaraları
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button key={i} onClick={() => setCurrentPage(i)} style={pageButtonStyle(currentPage === i)}>
                    {i}
                  </button>
                );
              }

              // Sonda ellipsis
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(
                    <span key="ellipsis2" style={{ padding: '0 8px', color: '#9CA3AF', fontSize: '14px' }}>...</span>
                  );
                }
                pages.push(
                  <button key={totalPages} onClick={() => setCurrentPage(totalPages)} style={pageButtonStyle(false)}>
                    {totalPages}
                  </button>
                );
              }

              return pages;
            })()}

            {/* Sonraki sayfa */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: currentPage === totalPages ? '#F3F4F6' : 'white',
                color: currentPage === totalPages ? '#9CA3AF' : '#374151',
                border: '1px solid #E5E7EB',
                borderRadius: '4px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              <i className="fas fa-angle-right"></i>
            </button>

            {/* Son sayfa */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: currentPage === totalPages ? '#F3F4F6' : 'white',
                color: currentPage === totalPages ? '#9CA3AF' : '#374151',
                border: '1px solid #E5E7EB',
                borderRadius: '4px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              <i className="fas fa-angle-double-right"></i>
            </button>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      {/* Filter Popup */}
      {showFilterPopup && (
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
            padding: '0',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                margin: 0,
                color: '#232D42',
                fontFamily: 'Inter',
                fontSize: '18px',
                fontWeight: 600
              }}>
                Filtrele
              </h3>
              <button
                onClick={closeFilterPopup}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#6B7280',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div style={{
              padding: '24px'
            }}>
              {/* Tarih Filtresi */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#232D42',
                  fontWeight: 500,
                  fontFamily: 'Inter',
                  fontSize: '14px'
                }}>
                  {t('labels.completionDate')}
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>{t('labels.startDate')}</span>
                    <input
                      type="text"
                      placeholder={language === 'en' ? 'mm/dd/yyyy' : 'gg.aa.yyyy'}
                      inputMode="numeric"
                      value={filters.startDate}
                      onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontFamily: 'Inter',
                        outline: 'none',
                        width: '100%'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '14px', color: '#6B7280', marginTop: '20px' }}>-</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>{t('labels.endDate')}</span>
                    <input
                      type="text"
                      placeholder={language === 'en' ? 'mm/dd/yyyy' : 'gg.aa.yyyy'}
                      inputMode="numeric"
                      value={filters.endDate}
                      onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontFamily: 'Inter',
                        outline: 'none',
                        width: '100%'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Müşteri Odaklılık Skoru */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#232D42',
                  fontWeight: 500,
                  fontFamily: 'Inter',
                  fontSize: '14px'
                }}>
                  {t('labels.customerFocusScore')}
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>{t('labels.minimum')}</span>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={filters.customerFocusMin}
                      onChange={(e) => setFilters({...filters, customerFocusMin: parseInt(e.target.value)})}
                      style={{ width: '100%' }}
                    />
                    <input
                      type="number"
                      min="5"
                      max="95"
                      value={filters.customerFocusMin}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setFilters({...filters, customerFocusMin: '' as any});
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue)) {
                            setFilters({...filters, customerFocusMin: numValue});
                          } else {
                            setFilters({...filters, customerFocusMin: value as any});
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value !== '') {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue)) {
                            setFilters({...filters, customerFocusMin: Math.min(Math.max(numValue, 5), 95)});
                          } else {
                            setFilters({...filters, customerFocusMin: 5});
                          }
                        }
                      }}
                      style={{
                        width: '50px',
                        padding: '4px 6px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 600,
                        textAlign: 'center',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '14px', color: '#6B7280', marginTop: '20px' }}>-</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>{t('labels.maximum')}</span>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={filters.customerFocusMax}
                      onChange={(e) => setFilters({...filters, customerFocusMax: parseInt(e.target.value)})}
                      style={{ width: '100%' }}
                    />
                    <input
                      type="number"
                      min="5"
                      max="95"
                      value={filters.customerFocusMax}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setFilters({...filters, customerFocusMax: '' as any});
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue)) {
                            setFilters({...filters, customerFocusMax: numValue});
                          } else {
                            setFilters({...filters, customerFocusMax: value as any});
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value !== '') {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue)) {
                            setFilters({...filters, customerFocusMax: Math.min(Math.max(numValue, 5), 95)});
                          } else {
                            setFilters({...filters, customerFocusMax: 95});
                          }
                        }
                      }}
                      style={{
                        width: '50px',
                        padding: '4px 6px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 600,
                        textAlign: 'center',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Belirsizlik Yönetimi Skoru */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#232D42',
                  fontWeight: 500,
                  fontFamily: 'Inter',
                  fontSize: '14px'
                }}>
                  {t('labels.adaptabilityScore')}
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>{t('labels.minimum')}</span>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={filters.uncertaintyMin}
                      onChange={(e) => setFilters({...filters, uncertaintyMin: parseInt(e.target.value)})}
                      style={{ width: '100%' }}
                    />
                    <input
                      type="number"
                      min="5"
                      max="95"
                      value={filters.uncertaintyMin}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setFilters({...filters, uncertaintyMin: '' as any});
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue)) {
                            setFilters({...filters, uncertaintyMin: numValue});
                          } else {
                            setFilters({...filters, uncertaintyMin: value as any});
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value !== '') {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue)) {
                            setFilters({...filters, uncertaintyMin: Math.min(Math.max(numValue, 5), 95)});
                          } else {
                            setFilters({...filters, uncertaintyMin: 5});
                          }
                        }
                      }}
                      style={{
                        width: '50px',
                        padding: '4px 6px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 600,
                        textAlign: 'center',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '14px', color: '#6B7280', marginTop: '20px' }}>-</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>{t('labels.maximum')}</span>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={filters.uncertaintyMax}
                      onChange={(e) => setFilters({...filters, uncertaintyMax: parseInt(e.target.value)})}
                      style={{ width: '100%' }}
                    />
                    <input
                      type="number"
                      min="5"
                      max="95"
                      value={filters.uncertaintyMax}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setFilters({...filters, uncertaintyMax: '' as any});
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue)) {
                            setFilters({...filters, uncertaintyMax: numValue});
                          } else {
                            setFilters({...filters, uncertaintyMax: value as any});
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value !== '') {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue)) {
                            setFilters({...filters, uncertaintyMax: Math.min(Math.max(numValue, 5), 95)});
                          } else {
                            setFilters({...filters, uncertaintyMax: 95});
                          }
                        }
                      }}
                      style={{
                        width: '50px',
                        padding: '4px 6px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 600,
                        textAlign: 'center',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* IE Skoru */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#232D42',
                  fontWeight: 500,
                  fontFamily: 'Inter',
                  fontSize: '14px'
                }}>
                  {t('labels.influenceScore')}
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>{t('labels.minimum')}</span>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={filters.ieMin}
                      onChange={(e) => setFilters({...filters, ieMin: parseInt(e.target.value)})}
                      style={{ width: '100%' }}
                    />
                    <input
                      type="number"
                      min="5"
                      max="95"
                      value={filters.ieMin}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setFilters({...filters, ieMin: '' as any});
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue)) {
                            setFilters({...filters, ieMin: numValue});
                          } else {
                            setFilters({...filters, ieMin: value as any});
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value !== '') {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue)) {
                            setFilters({...filters, ieMin: Math.min(Math.max(numValue, 5), 95)});
                          } else {
                            setFilters({...filters, ieMin: 5});
                          }
                        }
                      }}
                      style={{
                        width: '50px',
                        padding: '4px 6px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 600,
                        textAlign: 'center',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '14px', color: '#6B7280', marginTop: '20px' }}>-</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>{t('labels.maximum')}</span>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={filters.ieMax}
                      onChange={(e) => setFilters({...filters, ieMax: parseInt(e.target.value)})}
                      style={{ width: '100%' }}
                    />
                    <input
                      type="number"
                      min="5"
                      max="95"
                      value={filters.ieMax}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setFilters({...filters, ieMax: '' as any});
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue)) {
                            setFilters({...filters, ieMax: numValue});
                          } else {
                            setFilters({...filters, ieMax: value as any});
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value !== '') {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue)) {
                            setFilters({...filters, ieMax: Math.min(Math.max(numValue, 5), 95)});
                          } else {
                            setFilters({...filters, ieMax: 95});
                          }
                        }
                      }}
                      style={{
                        width: '50px',
                        padding: '4px 6px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 600,
                        textAlign: 'center',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* IDIK Skoru */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#232D42',
                  fontWeight: 500,
                  fontFamily: 'Inter',
                  fontSize: '14px'
                }}>
                  {t('labels.trustScore')}
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>{t('labels.minimum')}</span>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={filters.idikMin}
                      onChange={(e) => setFilters({...filters, idikMin: parseInt(e.target.value)})}
                      style={{ width: '100%' }}
                    />
                    <input
                      type="number"
                      min="5"
                      max="95"
                      value={filters.idikMin}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setFilters({...filters, idikMin: '' as any});
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue)) {
                            setFilters({...filters, idikMin: numValue});
                          } else {
                            setFilters({...filters, idikMin: value as any});
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value !== '') {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue)) {
                            setFilters({...filters, idikMin: Math.min(Math.max(numValue, 5), 95)});
                          } else {
                            setFilters({...filters, idikMin: 5});
                          }
                        }
                      }}
                      style={{
                        width: '50px',
                        padding: '4px 6px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 600,
                        textAlign: 'center',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '14px', color: '#6B7280', marginTop: '20px' }}>-</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>{t('labels.maximum')}</span>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={filters.idikMax}
                      onChange={(e) => setFilters({...filters, idikMax: parseInt(e.target.value)})}
                      style={{ width: '100%' }}
                    />
                    <input
                      type="number"
                      min="5"
                      max="95"
                      value={filters.idikMax}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setFilters({...filters, idikMax: '' as any});
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue)) {
                            setFilters({...filters, idikMax: numValue});
                          } else {
                            setFilters({...filters, idikMax: value as any});
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value !== '') {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue)) {
                            setFilters({...filters, idikMax: Math.min(Math.max(numValue, 5), 95)});
                          } else {
                            setFilters({...filters, idikMax: 95});
                          }
                        }
                      }}
                      style={{
                        width: '50px',
                        padding: '4px 6px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 600,
                        textAlign: 'center',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '20px 24px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={closeFilterPopup}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#6B7280',
                  fontFamily: 'Inter',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {t('buttons.cancel')}
              </button>
              <button
                onClick={clearFilters}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#6B7280',
                  fontFamily: 'Inter',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {t('buttons.clearFilters')}
              </button>
              <button
                onClick={applyFilters}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#2563EB',
                  color: 'white',
                  fontFamily: 'Inter',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {t('buttons.applyFilters')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hata Popup */}
      {showErrorPopup && (
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
          zIndex: 1001
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '0',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            animation: 'slideIn 0.3s ease-out'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#FEF2F2'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#FCA5A5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#DC2626',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  !
                </div>
                <h3 style={{
                  margin: 0,
                  color: '#DC2626',
                  fontFamily: 'Inter',
                  fontSize: '18px',
                  fontWeight: 600
                }}>
                  {t('labels.filterErrorTitle')}
                </h3>
              </div>
              <button
                onClick={closeErrorPopup}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#6B7280',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1,
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div style={{
              padding: '24px'
            }}>
              <p style={{
                margin: 0,
                color: '#374151',
                fontFamily: 'Inter',
                fontSize: '16px',
                lineHeight: '1.5'
              }}>
                {errorMessage}
              </p>
            </div>

            {/* Footer */}
            <div style={{
              padding: '20px 24px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={closeErrorPopup}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#DC2626',
                  color: 'white',
                  fontFamily: 'Inter',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#B91C1C';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#DC2626';
                }}
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          0% { 
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          100% { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ResultsPage;