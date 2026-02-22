import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { evaluationAPI, adminAPI, organizationAPI } from '../services/api';

interface UserResult {
  code: string;
  name: string;
  email: string;
  status: string;
  unvan?: string;
  pozisyon?: string;
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

const allCompetencyKeys = ['customerFocus', 'uncertainty', 'ie', 'idik'] as const;

const ResultsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const competencyLabelMap = useMemo(() => ({
    customerFocus: t('competency.customerFocus'),
    uncertainty: t('competency.uncertainty'),
    ie: t('competency.ie'),
    idik: t('competency.idik')
  }), [t]);
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
  
  // Popup states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Filter states (dashboard ile aynı)
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>([...allCompetencyKeys]);
  const [tempSelectedCompetencies, setTempSelectedCompetencies] = useState<string[]>([]);
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [tempSelectedTitles, setTempSelectedTitles] = useState<string[]>([]);
  const [tempSelectedPositions, setTempSelectedPositions] = useState<string[]>([]);
  const [titleOptions, setTitleOptions] = useState<string[]>([]);
  const [positionOptions, setPositionOptions] = useState<string[]>([]);
  const [fullResults, setFullResults] = useState<UserResult[]>([]);
  const [isFullResultsLoading, setIsFullResultsLoading] = useState(false);
  const [downloadOptions, setDownloadOptions] = useState({
    generalEvaluation: true,
    strengths: true,
    interviewQuestions: true,
    whyTheseQuestions: true,
    developmentSuggestions: true,
    competencyScore: true
  });
  const [isMobile, setIsMobile] = useState(false);
  
  const hasLoaded = useRef(false);
  const lastSearchTerm = useRef<string>('');

  const formatTemplate = (template: string, params: Record<string, string | number>) =>
    Object.entries(params).reduce(
      (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
      template
    );

  const formatRangeInfo = (start: number, end: number, total: number) =>
    formatTemplate(t('labels.recordsRange'), { start, end, total });

  const formatGroupCount = (count: number) =>
    formatTemplate(t('labels.resultsCount'), { count });

  const formatNoSearchResults = (query: string) =>
    formatTemplate(t('labels.noSearchResults'), { query });


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
        if (response.data.pagination) {
          setTotalCount(response.data.pagination.total);
          setTotalPages(response.data.pagination.totalPages);
        }
        
        // Gruplama yok, tüm veriler güncelliğe göre sıralanmış şekilde geliyor
        const formattedResults = response.data.results.map((result: any) => ({
          ...result,
          isGrouped: false,
          groupCount: 1
        }));
        
        setResults(formattedResults);
        setFilteredResults(formattedResults);
      } else {
        console.error('❌ API başarısız:', response.data.message);
        setResults([]);
        setFilteredResults([]);
      }
    } catch (error) {
      console.error('❌ Results veri yükleme hatası:', error);
      setResults([]);
      setFilteredResults([]);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm]);

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
    const loadOrganizationOptions = async () => {
      try {
        const response = await organizationAPI.getAll();
        if (response.data?.success && response.data.organizations) {
          const organizations: any[] = response.data.organizations || [];
          const isValidOption = (value: unknown): value is string =>
            typeof value === 'string' && value.trim().length > 0;
          const titles = Array.from(new Set(organizations.map((item: any) => item.unvan).filter(isValidOption))).sort();
          const positions = Array.from(new Set(organizations.map((item: any) => item.pozisyon).filter(isValidOption))).sort();
          setTitleOptions(titles);
          setPositionOptions(positions);
        }
      } catch (error) {
        console.error('Unvan/pozisyon yükleme hatası:', error);
      }
    };

    loadOrganizationOptions();
  }, []);

  // Debounce search term - kullanıcı yazmayı bitirdikten 500ms sonra arama yap
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Frontend'de anlık filtreleme (akıllı arama)
  useEffect(() => {
    if (searchTerm) {
      const filtered = results.filter(result =>
        result.name && result.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredResults(filtered);
    } else {
      setFilteredResults(results);
    }
  }, [searchTerm, results]);

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
    const locale = language === 'en' ? 'en-US' : 'tr-TR';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatScore = (score: number | string) => {
    if (score === null || score === undefined || score === '-' || score === 0 || score === '0') return '-';
    return typeof score === 'number' ? score.toFixed(1) : score;
  };

  const getScoreColors = (score: number | string) => {
    if (score === '-' || score === 0 || score === '0' || isNaN(Number(score))) {
      return { background: 'transparent', text: '#8A92A6' };
    }
    const numScore = parseFloat(score.toString());
    if (numScore <= 20) return { background: '#ff625f', text: '#FFFFFF' };
    if (numScore <= 50) return { background: '#ff751f', text: '#FFFFFF' };
    if (numScore <= 70) return { background: '#efd775', text: '#111827' };
    if (numScore <= 80) return { background: '#7ed957', text: '#111827' };
    return { background: '#00bf63', text: '#FFFFFF' };
  };

  const getScoreBadgeStyle = (score: number | string) => {
    const colors = getScoreColors(score);
    return {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 500,
      backgroundColor: colors.background,
      color: colors.text
    } as const;
  };

  const openFilterModal = () => {
    setTempSelectedCompetencies(selectedCompetencies);
    setTempSelectedTitles(selectedTitles);
    setTempSelectedPositions(selectedPositions);
    setIsFilterModalOpen(true);
  };

  const closeFilterModal = () => {
    setIsFilterModalOpen(false);
  };

  const saveFilterModal = () => {
    if (tempSelectedCompetencies.length === 0) {
      return;
    }
    setSelectedCompetencies(tempSelectedCompetencies);
    setSelectedTitles(tempSelectedTitles);
    setSelectedPositions(tempSelectedPositions);
    setIsFilterModalOpen(false);
    setCurrentPage(1);
  };

  const resetFilterModal = () => {
    setTempSelectedCompetencies([...allCompetencyKeys]);
    setTempSelectedTitles([]);
    setTempSelectedPositions([]);
    setSelectedCompetencies([...allCompetencyKeys]);
    setSelectedTitles([]);
    setSelectedPositions([]);
    setIsFilterModalOpen(false);
    setCurrentPage(1);
  };

  const toggleTempCompetency = (competency: string) => {
    setTempSelectedCompetencies((prev) => {
      if (prev.includes(competency)) {
        return prev.filter((item) => item !== competency);
      }
      return [...prev, competency];
    });
  };

  const toggleTempTitle = (title: string) => {
    setTempSelectedTitles((prev) => {
      if (prev.includes(title)) {
        return prev.filter((item) => item !== title);
      }
      return [...prev, title];
    });
  };

  const toggleTempPosition = (position: string) => {
    setTempSelectedPositions((prev) => {
      if (prev.includes(position)) {
        return prev.filter((item) => item !== position);
      }
      return [...prev, position];
    });
  };

  const hasScoreValue = (score: number | string) =>
    score !== null && score !== undefined && score !== '-' && score !== 0 && score !== '0';

  const getScoreByCompetency = (item: UserResult, competency: string) => {
    switch (competency) {
      case 'customerFocus':
        return item.customerFocusScore;
      case 'uncertainty':
        return item.uncertaintyScore;
      case 'ie':
        return item.ieScore;
      case 'idik':
        return item.idikScore;
      default:
        return null;
    }
  };

  const isFilterActive =
    selectedTitles.length > 0 ||
    selectedPositions.length > 0 ||
    (selectedCompetencies.length > 0 && selectedCompetencies.length < allCompetencyKeys.length);

  const applyResultFilters = (items: UserResult[]) =>
    items.filter((item) => {
      const matchesTitle =
        selectedTitles.length === 0 ||
        selectedTitles.includes((item.unvan || '').trim());
      const matchesPosition =
        selectedPositions.length === 0 ||
        selectedPositions.includes((item.pozisyon || '').trim());
      const matchesCompetency =
        selectedCompetencies.length === 0 ||
        selectedCompetencies.some((comp) => hasScoreValue(getScoreByCompetency(item, comp) as number | string));
      return matchesTitle && matchesPosition && matchesCompetency;
    });

  useEffect(() => {
    if (!isFilterActive) {
      return;
    }

    const loadFullResults = async () => {
      try {
        setIsFullResultsLoading(true);
        const response = await evaluationAPI.getAll(undefined, undefined, '', 'Tamamlandı', true);
        if (response.data?.success && response.data.results) {
          setFullResults(response.data.results);
        } else {
          setFullResults([]);
        }
      } catch (error) {
        console.error('Tüm sonuçları yükleme hatası:', error);
        setFullResults([]);
      } finally {
        setIsFullResultsLoading(false);
      }
    };

    loadFullResults();
  }, [isFilterActive]);

  const handleExcelDownload = async () => {
    if (effectiveResults.length === 0) {
      setErrorMessage(t('errors.noDataToDownload'));
      setShowErrorPopup(true);
      return;
    }

    try {
      const response = await adminAPI.exportExcelBulk({
        codes: effectiveResults.map((item) => item.code),
        selectedOptions: downloadOptions
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const date = new Date();
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}${date.getFullYear()}`;
      const fileName = formatTemplate(t('labels.dashboardExcelFileName'), { date: formattedDate });

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setShowDownloadPopup(false);
    } catch (error) {
      console.error(t('errors.excelDownloadFailed'), error);
      setErrorMessage(t('errors.excelDownloadFailed'));
      setShowErrorPopup(true);
    }
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


  // Hata popup'ını kapat
  const closeErrorPopup = () => {
    setShowErrorPopup(false);
    setErrorMessage('');
  };



  const baseResults = isFilterActive ? fullResults : filteredResults;
  const searchFilteredResults = searchTerm
    ? baseResults.filter(result =>
        result.name && result.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : baseResults;
  const effectiveResults = isFilterActive ? applyResultFilters(searchFilteredResults) : searchFilteredResults;
  const effectiveTotalCount = isFilterActive ? effectiveResults.length : totalCount;
  const effectiveTotalPages = isFilterActive ? Math.ceil(effectiveResults.length / itemsPerPage) : totalPages;

  // Pagination: Eğer filtreleme yapılmışsa frontend'de sayfalama yap, yoksa backend'den gelen sayfalanmış veriyi kullan
  const paginatedResults = isFilterActive
    ? effectiveResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : effectiveResults;

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
            className="btn btn-secondary"
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
            onClick={openFilterModal}
            className="btn btn-secondary"
          >
            <i className="fas fa-filter"></i>
            {t('buttons.filter')}
          </button>

          {/* Download Button */}
          <button
            onClick={() => setShowDownloadPopup(true)}
            className="btn btn-primary"
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
                      <span
                        onClick={() => navigate('/person-results', { state: { selectedUser: result } })}
                        style={{
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        {result.name}
                      </span>
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
                    <span style={getScoreBadgeStyle(result.customerFocusScore)}>
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
                    <span style={getScoreBadgeStyle(result.uncertaintyScore)}>
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
                    <span style={getScoreBadgeStyle(result.ieScore)}>
                      {formatScore(result.ieScore)}
                    </span>
                  </td>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    fontFamily: 'Inter',
                    textAlign: 'center'
                  }}>
                    <span style={getScoreBadgeStyle(result.idikScore)}>
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
      {effectiveTotalPages > 1 && (
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
              Math.min(currentPage * itemsPerPage, effectiveTotalCount),
              effectiveTotalCount
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
              let endPage = Math.min(effectiveTotalPages, startPage + maxVisiblePages - 1);
              
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
              if (endPage < effectiveTotalPages) {
                if (endPage < effectiveTotalPages - 1) {
                  pages.push(
                    <span key="ellipsis2" style={{ padding: '0 8px', color: '#9CA3AF', fontSize: '14px' }}>...</span>
                  );
                }
                pages.push(
                  <button key={effectiveTotalPages} onClick={() => setCurrentPage(effectiveTotalPages)} style={pageButtonStyle(false)}>
                    {effectiveTotalPages}
                  </button>
                );
              }

              return pages;
            })()}

            {/* Sonraki sayfa */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, effectiveTotalPages))}
              disabled={currentPage === effectiveTotalPages}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: currentPage === effectiveTotalPages ? '#F3F4F6' : 'white',
                color: currentPage === effectiveTotalPages ? '#9CA3AF' : '#374151',
                border: '1px solid #E5E7EB',
                borderRadius: '4px',
                cursor: currentPage === effectiveTotalPages ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              <i className="fas fa-angle-right"></i>
            </button>

            {/* Son sayfa */}
            <button
              onClick={() => setCurrentPage(effectiveTotalPages)}
              disabled={currentPage === effectiveTotalPages}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: currentPage === effectiveTotalPages ? '#F3F4F6' : 'white',
                color: currentPage === effectiveTotalPages ? '#9CA3AF' : '#374151',
                border: '1px solid #E5E7EB',
                borderRadius: '4px',
                cursor: currentPage === effectiveTotalPages ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              <i className="fas fa-angle-double-right"></i>
            </button>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      {isFilterModalOpen && (
        <div
          onClick={closeFilterModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 1000
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '560px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              overflow: 'hidden'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid #E5E7EB'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827' }}>{t('titles.filtering')}</h3>
              <button
                onClick={closeFilterModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '22px',
                  color: '#6B7280',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '20px 24px', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                {t('labels.competencySelection')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#F9FAFB', borderRadius: '10px', padding: '16px' }}>
                {allCompetencyKeys.map((competency) => (
                  <label key={competency} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ fontSize: '13px', color: '#111827' }}>{competencyLabelMap[competency]}</span>
                    <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={tempSelectedCompetencies.includes(competency)}
                        onChange={() => toggleTempCompetency(competency)}
                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                      />
                            <span style={{
                              width: '42px',
                              height: '24px',
                              background: tempSelectedCompetencies.includes(competency) ? '#9f8fbe' : 'rgba(159, 143, 190, 0.25)',
                              borderRadius: '999px',
                              position: 'relative',
                              transition: 'all 0.2s'
                            }}>
                        <span style={{
                          position: 'absolute',
                          top: '2px',
                          left: tempSelectedCompetencies.includes(competency) ? '20px' : '2px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'white',
                          transition: 'all 0.2s'
                        }} />
                      </span>
                    </label>
                  </label>
                ))}
              </div>

              <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>{t('labels.title')}</div>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px', maxHeight: '160px', overflowY: 'auto' }}>
                    {titleOptions.length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{t('labels.noRecords')}</div>
                    ) : (
                      titleOptions.map((title) => (
                        <label key={title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '12px' }}>
                          <span style={{ fontSize: '13px', color: '#111827' }}>{title}</span>
                          <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={tempSelectedTitles.includes(title)}
                              onChange={() => toggleTempTitle(title)}
                              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                              width: '42px',
                              height: '24px',
                              background: tempSelectedTitles.includes(title) ? '#9f8fbe' : 'rgba(159, 143, 190, 0.25)',
                              borderRadius: '999px',
                              position: 'relative',
                              transition: 'all 0.2s'
                            }}>
                              <span style={{
                                position: 'absolute',
                                top: '2px',
                                left: tempSelectedTitles.includes(title) ? '20px' : '2px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: 'white',
                                transition: 'all 0.2s'
                              }} />
                            </span>
                          </label>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>{t('labels.position')}</div>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px', maxHeight: '160px', overflowY: 'auto' }}>
                    {positionOptions.length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{t('labels.noRecords')}</div>
                    ) : (
                      positionOptions.map((position) => (
                        <label key={position} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '12px' }}>
                          <span style={{ fontSize: '13px', color: '#111827' }}>{position}</span>
                          <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={tempSelectedPositions.includes(position)}
                              onChange={() => toggleTempPosition(position)}
                              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                              width: '42px',
                              height: '24px',
                              background: tempSelectedPositions.includes(position) ? '#9f8fbe' : 'rgba(159, 143, 190, 0.25)',
                              borderRadius: '999px',
                              position: 'relative',
                              transition: 'all 0.2s'
                            }}>
                              <span style={{
                                position: 'absolute',
                                top: '2px',
                                left: tempSelectedPositions.includes(position) ? '20px' : '2px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: 'white',
                                transition: 'all 0.2s'
                              }} />
                            </span>
                          </label>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '16px 24px', borderTop: '1px solid #E5E7EB' }}>
              <button
                onClick={resetFilterModal}
                className="btn btn-secondary"
              >
                {t('buttons.clearFilters')}
              </button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={closeFilterModal}
                  className="btn btn-secondary"
                >
                  {t('buttons.cancel')}
                </button>
                <button
                  onClick={saveFilterModal}
                  className="btn btn-primary"
                >
                  {t('buttons.applyFilters')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDownloadPopup && (
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
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #E9ECEF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8F9FA'
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#232D42'
              }}>
                {t('labels.downloadExcel')}
              </div>
              <div
                onClick={() => setShowDownloadPopup(false)}
                style={{
                  cursor: 'pointer',
                  fontSize: '24px',
                  color: '#666'
                }}
              >
                ×
              </div>
            </div>
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB', marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  id="generalEvaluation"
                  checked={downloadOptions.generalEvaluation}
                  onChange={(e) => setDownloadOptions(prev => ({ ...prev, generalEvaluation: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: '#0286F7' }}
                />
                <span style={{ fontSize: '14px', color: '#232D42' }}>{t('labels.generalEvaluation')}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB', marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  id="strengths"
                  checked={downloadOptions.strengths}
                  onChange={(e) => setDownloadOptions(prev => ({ ...prev, strengths: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: '#0286F7' }}
                />
                <span style={{ fontSize: '14px', color: '#232D42' }}>{t('labels.strengthsDev')}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB', marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  id="interviewQuestions"
                  checked={downloadOptions.interviewQuestions}
                  onChange={(e) => setDownloadOptions(prev => ({ ...prev, interviewQuestions: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: '#0286F7' }}
                />
                <span style={{ fontSize: '14px', color: '#232D42' }}>{t('labels.interviewQuestions')}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB', marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  id="whyTheseQuestions"
                  checked={downloadOptions.whyTheseQuestions}
                  onChange={(e) => setDownloadOptions(prev => ({ ...prev, whyTheseQuestions: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: '#0286F7' }}
                />
                <span style={{ fontSize: '14px', color: '#232D42' }}>{t('labels.whyTheseQuestions')}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB', marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  id="developmentSuggestions"
                  checked={downloadOptions.developmentSuggestions}
                  onChange={(e) => setDownloadOptions(prev => ({ ...prev, developmentSuggestions: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: '#0286F7' }}
                />
                <span style={{ fontSize: '14px', color: '#232D42' }}>{t('labels.developmentPlan')}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                <input
                  type="checkbox"
                  id="competencyScore"
                  checked={downloadOptions.competencyScore}
                  onChange={(e) => setDownloadOptions(prev => ({ ...prev, competencyScore: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: '#0286F7' }}
                />
                <span style={{ fontSize: '14px', color: '#232D42' }}>{t('labels.competencyScore')}</span>
              </label>
            </div>
            <div style={{
              padding: '20px',
              borderTop: '1px solid #E9ECEF',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowDownloadPopup(false)}
                style={{
                  padding: '8px 16px',
                  background: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'Inter',
                  fontWeight: 500
                }}
              >
                {t('buttons.cancel')}
              </button>
              <button
                onClick={handleExcelDownload}
                style={{
                  padding: '8px 16px',
                  background: '#16A34A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'Inter',
                  fontWeight: 500
                }}
              >
                {t('labels.downloadExcel')}
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