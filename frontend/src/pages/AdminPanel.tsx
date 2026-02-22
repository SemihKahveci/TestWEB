import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluationAPI, creditAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import * as XLSX from 'xlsx';

// Dinamik API base URL - hem local hem live'da çalışır
const API_BASE_URL = (import.meta as any).env?.DEV 
  ? `${window.location.protocol}//${window.location.hostname}:5000`  // Development
  : '';  // Production (aynı domain'de serve edilir)

interface UserResult {
  code: string;
  name: string;
  email: string;
  status: string;
  personType?: string;
  sentDate: string;
  completionDate: string;
  expiryDate: string;
  reportExpiryDate: string;
  reportId?: string;
  planet?: string;
  allPlanets?: string[];
  unvan?: string;
  pozisyon?: string;
  departman?: string;
  customerFocusScore?: string | number;
  uncertaintyScore?: string | number;
  ieScore?: string | number;
  idikScore?: string | number;
  isGrouped?: boolean;
  groupCount?: number;
  allGroupItems?: UserResult[];
  hasExpiredCode?: boolean;
  answers?: Array<{
    questionId?: string;
    answerType1?: string;
    answerType2?: string;
    answerSubCategory?: string;
    planetName?: string;
    selectedAnswer1?: string;
    selectedAnswer2?: string;
    subCategory?: string;
    planet?: string;
    question?: string;
    answer?: string;
  }>;
}

interface PDFOptions {
  generalEvaluation: boolean;
  strengths: boolean;
  interviewQuestions: boolean;
  whyTheseQuestions: boolean;
  developmentSuggestions: boolean;
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [results, setResults] = useState<UserResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<UserResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [isWordDownloading, setIsWordDownloading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [wordProgress, setWordProgress] = useState(0);
  const [isSearching, setIsSearching] = useState(false); // Backend arama için ayrı loading
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const showExpiredWarning = true;
  const [activePersonTab, setActivePersonTab] = useState<'all' | 'candidate' | 'employee'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Popup states
  const [showPDFPopup, setShowPDFPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showQuickSendPopup, setShowQuickSendPopup] = useState(false);
  const [showAnswersPopup, setShowAnswersPopup] = useState(false);
  const [showAddPersonPopup, setShowAddPersonPopup] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModal, setMessageModal] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info'
  });
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBulkDeletePopup, setShowBulkDeletePopup] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pdfOptions, setPdfOptions] = useState<PDFOptions>({
    generalEvaluation: true,
    strengths: true,
    interviewQuestions: true,
    whyTheseQuestions: true,
    developmentSuggestions: true
  });
  const [remainingCredits, setRemainingCredits] = useState(0);
  const [quickSendPlanets, setQuickSendPlanets] = useState<string[]>([]);
  const [isQuickSending, setIsQuickSending] = useState(false);
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [addPersonTab, setAddPersonTab] = useState<'single' | 'bulk'>('single');
  const [addPersonExcelFile, setAddPersonExcelFile] = useState<File | null>(null);
  const [isBulkAddingPerson, setIsBulkAddingPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonEmail, setNewPersonEmail] = useState('');
  const [newPersonTitle, setNewPersonTitle] = useState('');
  const [newPersonPosition, setNewPersonPosition] = useState('');
  const [newPersonDepartment, setNewPersonDepartment] = useState('');
  const [newPersonType, setNewPersonType] = useState('');
  const [showBulkSendPopup, setShowBulkSendPopup] = useState(false);
  const [bulkSendTargets, setBulkSendTargets] = useState<UserResult[]>([]);
  const [bulkSendPlanets, setBulkSendPlanets] = useState<Record<string, string[]>>({});
  const [isBulkSending, setIsBulkSending] = useState(false);

  const availablePlanets = useMemo(() => ([
    { value: 'venus', label: `${t('labels.planetVenus')} (${t('competency.uncertainty')} - ${t('competency.customerFocus')})` },
    { value: 'titan', label: `${t('labels.planetTitan')} (${t('competency.ie')} - ${t('competency.idik')})` }
  ]), [t]);

  const formatStatusLabel = (status: string) => {
    if (language === 'tr') return status;
    const normalized = status.toLowerCase().trim();
    if (normalized === 'oyun devam ediyor') return t('status.inProgress');
    if (normalized === 'beklemede') return t('status.pending');
    if (normalized === 'tamamlandı') return t('status.completed');
    if (normalized === 'süresi doldu' || normalized === 'süresi dolmuş') return t('status.expired');
    return status;
  };

  const formatNoDataForCode = () => t('errors.noDataForCode');

  const formatTemplate = (template: string, params: Record<string, string | number>) =>
    Object.entries(params).reduce(
      (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
      template
    );

  const formatAnswersFetchFailed = (message: string) =>
    `${t('errors.answersFetchFailed')}: ${message}`;

  const formatExcelDownloadFailed = (message: string) =>
    `${t('errors.excelDownloadFailed')}: ${message}`;

  const formatWordDownloadFailed = (message: string) =>
    `${t('errors.wordDownloadFailed')}: ${message}`;

  const formatPdfPreviewFailed = (message: string) =>
    `${t('errors.pdfPreviewFailed')}: ${message}`;

  const formatPdfDownloadFailed = (message: string) =>
    `${t('errors.pdfDownloadFailed')}: ${message}`;

  const formatInsufficientCredits = (remaining: number, needed: number) =>
    formatTemplate(t('errors.insufficientCredits'), { remaining, needed });

  const formatCodeSent = (creditCost: number) =>
    formatTemplate(t('messages.codeSent'), { creditCost });

  const formatCreditDeductionFailed = (message: string) =>
    formatTemplate(t('errors.creditDeductionFailed'), { message });

  const formatSendFailed = (message: string) =>
    formatTemplate(t('errors.sendFailed'), { message });

  const formatDeleteFailed = (message: string) =>
    `${t('errors.deleteFailed')}: ${message}`;

  const formatBulkDeleteFailed = (message: string) =>
    `${t('errors.bulkDeleteFailed')}: ${message}`;

  const formatBulkDeleteSuccess = (count: number) =>
    formatTemplate(t('messages.bulkDeleteSuccess'), { count });

  const formatBulkDeleteConfirm = (count: number) =>
    formatTemplate(t('labels.bulkDeleteConfirm'), { count });

  const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '-';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  const getAvatarStyle = (name = '') => {
    const palette = [
      { bg: '#DBEAFE', text: '#2563EB' },
      { bg: '#EDE9FE', text: '#7C3AED' },
      { bg: '#FFEDD5', text: '#F97316' },
      { bg: '#FCE7F3', text: '#DB2777' },
      { bg: '#F3F4F6', text: '#4B5563' }
    ];
    const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return palette[sum % palette.length];
  };

  const formatAverageScore = (result: UserResult) => {
    const values = [
      result.customerFocusScore,
      result.uncertaintyScore,
      result.ieScore,
      result.idikScore
    ]
      .map((score) => {
        const parsed = typeof score === 'number' ? score : parseFloat(String(score));
        return Number.isFinite(parsed) ? parsed : null;
      })
      .filter((value): value is number => value !== null);

    if (values.length === 0) return '-';
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length).toString();
  };

  const getMeasuredCompetencies = (result: UserResult) => {
    const planets = Array.isArray(result.allPlanets) && result.allPlanets.length > 0
      ? result.allPlanets
      : result.planet ? [result.planet] : [];

    const labels: string[] = [];
    planets.forEach((planet) => {
      const key = String(planet).toLowerCase();
      if (key.includes('venus') || key === '0') {
        labels.push(t('competency.uncertainty'), t('competency.customerFocus'));
      } else if (key.includes('titan') || key === '1') {
        labels.push(t('competency.ie'), t('competency.idik'));
      } else if (planet) {
        labels.push(String(planet));
      }
    });

    const unique = Array.from(new Set(labels.filter(Boolean)));
    return unique.length > 0 ? unique.join(', ') : '-';
  };

  const getMeasuredCompetencyList = (result: UserResult) => {
    const text = getMeasuredCompetencies(result);
    if (text === '-') return [];
    return text.split(',').map((item) => item.trim()).filter(Boolean);
  };
  
  const hasLoaded = useRef(false);
  const requestIdRef = useRef(0);
  const resultsCache = useRef(new Map<string, {
    results: UserResult[];
    filteredResults: UserResult[];
    totalCount: number;
    totalPages: number;
    fetchedAt: number;
  }>());
  
  // Super admin kontrolü
  const isSuperAdmin = user?.role === 'superadmin';

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
    if (isSuperAdmin) {
      return undefined;
    }

    let isMounted = true;
    const loadCredits = async () => {
      try {
        const response = await creditAPI.getUserCredits();
        const { remainingCredits: fetchedRemaining } = response.data.credit;
        if (isMounted) {
          setRemainingCredits(fetchedRemaining);
        }
        localStorage.setItem('remainingCredits', fetchedRemaining.toString());
      } catch (error) {
        const fallbackRemaining = parseInt(localStorage.getItem('remainingCredits') || '0', 10);
        if (isMounted && Number.isFinite(fallbackRemaining)) {
          setRemainingCredits(fallbackRemaining);
        }
      }
    };

    loadCredits();

    return () => {
      isMounted = false;
    };
  }, [isSuperAdmin]);

  const loadData = useCallback(async (showLoading = true, forceFetch = false) => {
    const requestId = ++requestIdRef.current;
    try {
      // Sadece ilk yüklemede veya sayfa değiştiğinde loading göster
      // Arama için loading gösterme (arka planda çalışsın)
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsSearching(true);
      }
      
      const cacheKey = JSON.stringify({
        page: currentPage,
        limit: itemsPerPage,
        searchTerm: debouncedSearchTerm,
        statusFilter,
        showExpiredWarning,
        personType: activePersonTab
      });

      if (!forceFetch) {
        const cached = resultsCache.current.get(cacheKey);
        if (cached && Date.now() - cached.fetchedAt < 60000) {
          if (requestId !== requestIdRef.current) {
            return;
          }
          setResults(cached.results);
          setFilteredResults(cached.filteredResults);
          setTotalCount(cached.totalCount);
          setTotalPages(cached.totalPages);
          setIsLoading(false);
          setIsSearching(false);
          return;
        }
      }

      // Pagination ile veri çek (filtreleme parametrelerini de gönder)
      const response = await evaluationAPI.getAll(
        currentPage, 
        itemsPerPage, 
        debouncedSearchTerm, // Debounced search term kullan
        statusFilter, 
        showExpiredWarning,
        activePersonTab === 'all' ? undefined : activePersonTab
      );
      
      
      if (response.data.success) {
        if (requestId !== requestIdRef.current) {
          return;
        }
        // Pagination bilgilerini kaydet
        if (response.data.pagination) {
          setTotalCount(response.data.pagination.total);
          setTotalPages(response.data.pagination.totalPages);
        }
        
        // Gruplama yok, tüm veriler güncelliğe göre sıralanmış şekilde geliyor
        const formattedResults = response.data.results.map((result: any) => ({
          ...result,
          isGrouped: false,
          groupCount: 1,
          hasExpiredCode: result.status === 'Süresi Doldu'
        }));
        
        setResults(formattedResults);
        setFilteredResults(formattedResults);

        resultsCache.current.set(cacheKey, {
          results: formattedResults,
          filteredResults: formattedResults,
          totalCount: response.data.pagination?.total || formattedResults.length,
          totalPages: response.data.pagination?.totalPages || 1,
          fetchedAt: Date.now()
        });
      } else {
        console.error('❌ API hatası:', response.data.message);
        console.error('❌ Tam yanıt:', response.data);
      }
    } catch (error) {
      console.error('💥 Veri yükleme hatası:', error);
      console.error('💥 Hata detayı:', error.response?.data);
      console.error('💥 Hata status:', error.response?.status);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsSearching(false);
      }
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, statusFilter, activePersonTab]);

  const refreshAfterMutation = async () => {
    await loadData(true, true);
  };

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
      // Frontend'de anlık filtreleme yap (isim ve email üzerinde)
      const searchLower = searchTerm.toLowerCase();
      const filtered = results.filter(result =>
        (result.name && result.name.toLowerCase().includes(searchLower)) ||
        (result.email && result.email.toLowerCase().includes(searchLower))
      );
      setFilteredResults(filtered);
    } else {
      // Arama yoksa tüm sonuçları göster
      setFilteredResults(results);
    }
  }, [searchTerm, results]);

  useEffect(() => {
    // İlk yükleme ve sayfa değiştiğinde veri çek (loading göster)
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      loadData(true); // İlk yüklemede loading göster
    } else {
      loadData(false); // Sonraki yüklemelerde loading gösterme
    }
  }, [currentPage, statusFilter, activePersonTab]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedItems([]);
  }, [activePersonTab]);

  // Debounced search term değiştiğinde backend'den veri çek (arka planda)
  useEffect(() => {
    if (hasLoaded.current) {
      loadData(false); // Arama için loading gösterme
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    // Search/filter değiştiğinde sayfayı 1'e resetle
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    if (!isPdfDownloading) {
      setPdfProgress(0);
      return;
    }
    setPdfProgress(5);
    const interval = setInterval(() => {
      setPdfProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 8) + 3;
        return next >= 95 ? 95 : next;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [isPdfDownloading]);

  useEffect(() => {
    if (!isWordDownloading) {
      setWordProgress(0);
      return;
    }
    setWordProgress(5);
    const interval = setInterval(() => {
      setWordProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 12) + 8;
        return next >= 95 ? 95 : next;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [isWordDownloading]);

  // Sayfa değiştiğinde seçimleri temizle
  useEffect(() => {
    setSelectedItems([]);
  }, [currentPage]);

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      'Oyun Devam ediyor': { bg: '#E0F2FE', text: '#0C4A6E', border: '#BAE6FD' },
      'Tamamlandı': { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' },
      'Beklemede': { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
      'Süresi Doldu': { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' }
    };

    const statusStyle = statusClasses[status as keyof typeof statusClasses] || { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' };

    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: statusStyle.bg,
        color: statusStyle.text,
        border: `1px solid ${statusStyle.border}`,
        whiteSpace: 'nowrap'
      }}>
        {formatStatusLabel(status)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const locale = language === 'en' ? 'en-US' : 'tr-TR';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Statü sıralama fonksiyonu
  const getStatusOrder = (status: string): number => {
    // Statü isimlerini normalize et (büyük/küçük harf duyarsız)
    const normalizedStatus = status.toLowerCase().trim();
    
    // Oyun devam ediyor için farklı varyasyonları kontrol et
    if (normalizedStatus.includes('devam') || normalizedStatus.includes('oyun') && normalizedStatus.includes('ediyor')) {
      return 1;
    }
    
    // Diğer statüler için exact match
    const statusOrder = {
      'beklemede': 2,
      'tamamlandı': 3,
      'tamamlandi': 3, // Türkçe karakter olmadan
      'süresi doldu': 4,
      'suresi doldu': 4, // Türkçe karakter olmadan
      'süresi dolmuş': 4,
      'suresi dolmus': 4 // Türkçe karakter olmadan
    };
    
    return statusOrder[normalizedStatus as keyof typeof statusOrder] || 5;
  };

  // HTML'deki gibi e-posta adresine göre gruplama
  const groupByEmail = (data: UserResult[]): UserResult[] => {
    const emailGroups: { [key: string]: UserResult[] } = {};
    
    // Verileri e-posta adresine göre grupla
    data.forEach(item => {
      const email = item.email || 'no-email';
      if (!emailGroups[email]) {
        emailGroups[email] = [];
      }
      emailGroups[email].push(item);
    });
    
    // Gruplandırılmış verileri düzleştir
    const groupedData: UserResult[] = [];
    
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
        // Birden fazla sonuç varsa gruplandır (sıralama yapmadan)
        // Önce tarihe göre sırala (en yeni üstte)
        const sortedGroup = [...group].sort((a, b) => {
          return new Date(b.sentDate || 0).getTime() - new Date(a.sentDate || 0).getTime();
        });
        const latestItem = sortedGroup[0]; // En yeni olan
        
        // Grupta süresi dolmuş kod var mı kontrol et
        const hasExpiredCode = group.some(item => item.status === 'Süresi Doldu');
        
        groupedData.push({
          ...latestItem,
          isGrouped: true,
          groupCount: group.length,
          allGroupItems: [latestItem], // Sadece en güncel sonucu tut (performans için)
          hasExpiredCode: hasExpiredCode
        });
      }
    });
    
    return groupedData;
  };



  const handleView = async (code: string) => {
    
    try {
      // Backend'den cevapları çek (cookie otomatik gönderilecek)
      const response = await fetch(`${API_BASE_URL}/api/user-results?code=${code}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(t('errors.answersFetchFailed'));
      }
      
      const data = await response.json();
      if (!data.success || !data.results || data.results.length === 0) {
        showMessage(t('labels.error'), formatNoDataForCode(), 'error');
        return;
      }
      
      const existingData = data.results[0];
      setSelectedUser(existingData);
      setShowAnswersPopup(true);
    } catch (error) {
      console.error('Cevapları getirme hatası:', error);
      showMessage(t('labels.error'), formatAnswersFetchFailed((error as Error).message), 'error');
    }
  };

  const handlePDF = (code: string) => {
    
    // Önce ana results'ta ara
    let existingData = results.find(item => item.code === code);
    
    // Bulunamazsa, gruplandırılmış verilerde ara
    if (!existingData) {
      for (const result of results) {
        if (result.allGroupItems) {
          const foundInGroup = result.allGroupItems.find(item => item.code === code);
          if (foundInGroup) {
            existingData = foundInGroup;
            break;
          }
        }
      }
    }
    
    if (!existingData) {
      showMessage(t('labels.error'), formatNoDataForCode(), 'error');
      return;
    }
    setSelectedUser(existingData);
    setShowPDFPopup(true);
  };

  const handleExcel = async (code: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/export-excel/${code}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(t('errors.excelDownloadFailed'));
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Kullanıcı bilgilerini al
      const userResponse = await fetch(`${API_BASE_URL}/api/user-results?code=${code}`, {
        credentials: 'include'
      });
      const userData = await userResponse.json();
      
      let fileName = `${t('labels.evaluationReportFile')}_${code}.xlsx`;
      if (userData.success && userData.results && userData.results.length > 0) {
        const user = userData.results[0];
        const date = user.completionDate ? new Date(user.completionDate) : new Date();
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear()}`;
        fileName = `${t('labels.evaluationReportFile')}_${user.name.replace(/\s+/g, '_')}_${formattedDate}.xlsx`;
      }
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Excel indirme hatası:', error);
      showMessage(t('labels.error'), formatExcelDownloadFailed((error as Error).message), 'error');
    }
  };

  const handleWord = async (code: string) => {
    try {
      setIsWordDownloading(true);
      const response = await fetch(`${API_BASE_URL}/api/evaluation/generateWordFromTemplate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          userCode: code,
          selectedOptions: pdfOptions // PDF ile aynı seçenekleri kullan
        })
      });
      
      if (!response.ok) {
        let message = t('errors.wordDownloadFailed');
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              const errorData = JSON.parse(errorText);
              message = errorData?.message || message;
            } catch {
              message = errorText;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new Error(message);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Kullanıcı bilgilerini al
      const userResponse = await fetch(`${API_BASE_URL}/api/user-results?code=${code}`, {
        credentials: 'include'
      });
      const userData = await userResponse.json().catch(() => ({}));
      
      let fileName = `${t('labels.evaluationReportFile')}_${code}.docx`;
      if (userData?.success && Array.isArray(userData?.results) && userData.results.length > 0) {
        const user = userData.results[0];
        const date = user.completionDate ? new Date(user.completionDate) : new Date();
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear()}`;
        fileName = `${t('labels.evaluationReportFile')}_${user.name.replace(/\s+/g, '_')}_${formattedDate}.docx`;
      }
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Word indirme hatası:', error);
      showMessage(t('labels.error'), formatWordDownloadFailed((error as Error).message), 'error');
    } finally {
      setIsWordDownloading(false);
    }
  };

  const handleQuickSendPopup = (code: string) => {
    let existingData = results.find(item => item.code === code);

    if (!existingData) {
      for (const result of results) {
        if (result.allGroupItems) {
          const foundInGroup = result.allGroupItems.find(item => item.code === code);
          if (foundInGroup) {
            existingData = foundInGroup;
            break;
          }
        }
      }
    }

    if (!existingData) {
      showMessage(t('labels.error'), formatNoDataForCode(), 'error');
      return;
    }

    setSelectedUser(existingData);
    setQuickSendPlanets([]);
    setShowQuickSendPopup(true);
  };

  const handleBulkSendPopup = () => {
    if (selectedItems.length === 0) {
      showMessage(t('labels.warning'), t('warnings.selectRecordsToDelete'), 'warning');
      return;
    }

    const selectedUsers: UserResult[] = [];
    const missingCodes: string[] = [];

    selectedItems.forEach((code) => {
      let existingData = results.find(item => item.code === code);

      if (!existingData) {
        for (const result of results) {
          if (result.allGroupItems) {
            const foundInGroup = result.allGroupItems.find(item => item.code === code);
            if (foundInGroup) {
              existingData = foundInGroup;
              break;
            }
          }
        }
      }

      if (existingData) {
        selectedUsers.push(existingData);
      } else {
        missingCodes.push(code);
      }
    });

    if (missingCodes.length > 0) {
      showMessage(t('labels.error'), formatNoDataForCode(), 'error');
      return;
    }

    const initialPlanets: Record<string, string[]> = {};
    selectedUsers.forEach((user) => {
      initialPlanets[user.code] = [];
    });

    setBulkSendTargets(selectedUsers);
    setBulkSendPlanets(initialPlanets);
    setShowBulkSendPopup(true);
  };

  const toggleBulkSendPlanet = (code: string, planet: string) => {
    setBulkSendPlanets((prev) => {
      const current = prev[code] || [];
      const next = current.includes(planet)
        ? current.filter((item) => item !== planet)
        : [...current, planet];
      return { ...prev, [code]: next };
    });
  };

  const toggleQuickSendPlanet = (value: string) => {
    setQuickSendPlanets((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleQuickSend = async () => {
    if (!selectedUser) return;
    if (quickSendPlanets.length === 0) {
      showMessage(t('labels.error'), t('errors.selectPlanet'), 'error');
      return;
    }
    const creditCost = quickSendPlanets.length;
    if (!isSuperAdmin && remainingCredits < creditCost) {
      showMessage(
        t('labels.error'),
        formatInsufficientCredits(remainingCredits, creditCost),
        'error'
      );
      return;
    }

    try {
      setIsQuickSending(true);
      const primaryPlanet = quickSendPlanets[0];

      const codeResponse = await fetch('/api/generate-code', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedUser.name,
          email: selectedUser.email,
          planet: primaryPlanet,
          allPlanets: quickSendPlanets,
          personType: selectedUser.personType || '',
          unvan: selectedUser.unvan || '',
          pozisyon: selectedUser.pozisyon || '',
          departman: selectedUser.departman || ''
        })
      });

      const codeData = await codeResponse.json();
      if (!codeData.success || !codeData.code) {
        throw new Error(t('errors.codeGenerateInvalid'));
      }

      const sendResponse = await fetch('/api/send-code', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeData.code,
          name: selectedUser.name,
          email: selectedUser.email,
          planet: primaryPlanet,
          allPlanets: quickSendPlanets,
          personType: selectedUser.personType || '',
          unvan: selectedUser.unvan || '',
          pozisyon: selectedUser.pozisyon || '',
          departman: selectedUser.departman || ''
        })
      });

      const sendData = await sendResponse.json();
      if (!sendData.success) {
        throw new Error(sendData.message || t('errors.sendFailedGeneric'));
      }

      showMessage(t('labels.success'), formatCodeSent(creditCost), 'success');
      setShowQuickSendPopup(false);
      setQuickSendPlanets([]);
      
      if (!isSuperAdmin) {
        try {
          const deductResponse = await creditAPI.deductCredits({
            amount: creditCost,
            type: 'game_send',
            description: `${t('labels.personSend')}: ${selectedUser.name} (${creditCost} ${t('labels.planet')})`
          });

          if (deductResponse.data.success) {
            const { totalCredits, usedCredits, remainingCredits } = deductResponse.data.credit;
            localStorage.setItem('remainingCredits', remainingCredits.toString());
            localStorage.setItem('usedCredits', usedCredits.toString());
            localStorage.setItem('totalCredits', totalCredits.toString());
            setRemainingCredits(remainingCredits);
          }
        } catch (error) {
          const message = error.response?.data?.message || (error as Error).message;
          showMessage(t('labels.error'), formatCreditDeductionFailed(message), 'error');
        }
      }

      await refreshAfterMutation();
    } catch (error) {
      console.error('Hızlı değerlendirme gönderim hatası:', error);
      showMessage(t('labels.error'), formatSendFailed((error as Error).message), 'error');
    } finally {
      setIsQuickSending(false);
    }
  };

  const handleBulkSend = async () => {
    if (bulkSendTargets.length === 0) return;

    const missingPlanets = bulkSendTargets
      .filter((user) => (bulkSendPlanets[user.code] || []).length === 0)
      .map((user) => user.name || user.email || user.code);

    if (missingPlanets.length > 0) {
      showMessage(
        t('labels.error'),
        `Lütfen tüm kişiler için en az bir gezegen seçin: ${missingPlanets.join(', ')}`,
        'error'
      );
      return;
    }

    const totalCreditCost = bulkSendTargets.reduce(
      (sum, user) => sum + (bulkSendPlanets[user.code]?.length || 0),
      0
    );

    if (!isSuperAdmin && remainingCredits < totalCreditCost) {
      showMessage(
        t('labels.error'),
        formatInsufficientCredits(remainingCredits, totalCreditCost),
        'error'
      );
      return;
    }

    try {
      setIsBulkSending(true);
      let successCount = 0;
      let totalSentPlanets = 0;

      for (const user of bulkSendTargets) {
        const selectedPlanets = bulkSendPlanets[user.code] || [];
        if (selectedPlanets.length === 0) {
          continue;
        }
        const primaryPlanet = selectedPlanets[0];

        const codeResponse = await fetch('/api/generate-code', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: user.name,
            email: user.email,
            planet: primaryPlanet,
            allPlanets: selectedPlanets,
            personType: user.personType || '',
            unvan: user.unvan || '',
            pozisyon: user.pozisyon || '',
            departman: user.departman || ''
          })
        });

        const codeData = await codeResponse.json();
        if (!codeData.success || !codeData.code) {
          throw new Error(t('errors.codeGenerateInvalid'));
        }

        const sendResponse = await fetch('/api/send-code', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: codeData.code,
            name: user.name,
            email: user.email,
            planet: primaryPlanet,
            allPlanets: selectedPlanets,
            personType: user.personType || '',
            unvan: user.unvan || '',
            pozisyon: user.pozisyon || '',
            departman: user.departman || ''
          })
        });

        const sendData = await sendResponse.json();
        if (!sendData.success) {
          throw new Error(sendData.message || t('errors.sendFailedGeneric'));
        }

        successCount += 1;
        totalSentPlanets += selectedPlanets.length;
      }

      if (!isSuperAdmin && totalSentPlanets > 0) {
        try {
          const deductResponse = await creditAPI.deductCredits({
            amount: totalSentPlanets,
            type: 'game_send',
            description: `Toplu Gönderim: ${successCount} kişi (${totalSentPlanets} ${t('labels.planet')})`
          });

          if (deductResponse.data.success) {
            const { totalCredits, usedCredits, remainingCredits } = deductResponse.data.credit;
            localStorage.setItem('remainingCredits', remainingCredits.toString());
            localStorage.setItem('usedCredits', usedCredits.toString());
            localStorage.setItem('totalCredits', totalCredits.toString());
            setRemainingCredits(remainingCredits);
          }
        } catch (error) {
          const message = error.response?.data?.message || (error as Error).message;
          showMessage(t('labels.error'), formatCreditDeductionFailed(message), 'error');
        }
      }

      showMessage(t('labels.success'), formatCodeSent(totalSentPlanets), 'success');
      setShowBulkSendPopup(false);
      setBulkSendTargets([]);
      setBulkSendPlanets({});
      await refreshAfterMutation();
    } catch (error) {
      console.error('Toplu gönderim hatası:', error);
      showMessage(t('labels.error'), formatSendFailed((error as Error).message), 'error');
    } finally {
      setIsBulkSending(false);
    }
  };

  const handleAddPerson = async () => {
    const payload = {
      name: newPersonName.trim(),
      email: newPersonEmail.trim(),
      unvan: newPersonTitle.trim(),
      pozisyon: newPersonPosition.trim(),
      departman: newPersonDepartment.trim(),
      personType: newPersonType.trim()
    };

    if (!payload.name || !payload.email || !payload.unvan || !payload.pozisyon || !payload.departman || !payload.personType) {
      showMessage(t('labels.error'), 'Lütfen tüm alanları doldurun.', 'error');
      return;
    }

    try {
      setIsAddingPerson(true);
      const response = await fetch(`${API_BASE_URL}/api/user-results/pending`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || t('errors.sendFailedGeneric'));
      }

      showMessage(t('labels.success'), 'Kişi başarıyla eklendi.', 'success');
      setShowAddPersonPopup(false);
      setNewPersonName('');
      setNewPersonEmail('');
      setNewPersonTitle('');
      setNewPersonPosition('');
      setNewPersonDepartment('');
      setNewPersonType('');
      await refreshAfterMutation();
    } catch (error) {
      showMessage(t('labels.error'), (error as Error).message, 'error');
    } finally {
      setIsAddingPerson(false);
    }
  };

  const handleBulkAddPerson = async () => {
    if (!addPersonExcelFile) {
      showMessage(t('labels.error'), 'Lütfen bir Excel dosyası seçin.', 'error');
      return;
    }

    try {
      setIsBulkAddingPerson(true);
      const formData = new FormData();
      formData.append('excelFile', addPersonExcelFile);
      const response = await fetch(`${API_BASE_URL}/api/user-results/pending/import`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || t('errors.sendFailedGeneric'));
      }

      showMessage(t('labels.success'), data.message || 'Toplu kişi ekleme başarılı.', 'success');
      setShowAddPersonPopup(false);
      setAddPersonExcelFile(null);
      setAddPersonTab('single');
      await refreshAfterMutation();
    } catch (error) {
      showMessage(t('labels.error'), (error as Error).message, 'error');
    } finally {
      setIsBulkAddingPerson(false);
    }
  };

  const downloadAddPersonTemplate = () => {
    try {
      const headers = [
        'Ad Soyad',
        'Email',
        'Ünvan',
        'Pozisyon',
        'Departman',
        'Çalışan Tipi'
      ];
      const exampleRow = [
        'Serdar Kahveci',
        'serdar.kahveci@firma.com',
        'Uzman',
        'Satış',
        'İnsan Kaynakları',
        'Çalışan'
      ];
      const emptyRows: string[][] = [];
      for (let i = 0; i < 10; i += 1) {
        emptyRows.push(['', '', '', '', '', '']);
      }
      const allData = [headers, exampleRow, ...emptyRows];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(allData);
      ws['!cols'] = [
        { wch: 24 },
        { wch: 28 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 16 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, t('labels.peopleTemplate'));
      XLSX.writeFile(wb, t('labels.peopleTemplateFile'));
      showMessage(t('labels.success'), t('messages.templateDownloadSuccess'), 'success');
    } catch (error) {
      showMessage(t('labels.error'), t('errors.templateDownloadError'), 'error');
    }
  };

  const handleDelete = async (code: string) => {
    
    // Önce ana results'ta ara
    let existingData = results.find(item => item.code === code);
    
    // Bulunamazsa, gruplandırılmış verilerde ara
    if (!existingData) {
      for (const result of results) {
        if (result.allGroupItems) {
          const foundInGroup = result.allGroupItems.find(item => item.code === code);
          if (foundInGroup) {
            existingData = foundInGroup;
            break;
          }
        }
      }
    }
    
    if (!existingData) {
      showMessage(t('labels.error'), formatNoDataForCode(), 'error');
      return;
    }
    setSelectedUser(existingData);
    setShowDeletePopup(true);
  };


  const confirmDelete = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/delete-result`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ code: selectedUser.code })
      });

      if (!response.ok) {
        throw new Error(t('errors.deleteFailed'));
      }

      // Başarılı silme sonrası
      setShowDeletePopup(false);
      setSelectedUser(null);
      
      // Sadece veriyi yeniden yükle (cache'i bypass et)
      await refreshAfterMutation();
      
      showMessage(t('labels.success'), t('messages.evaluationDeleted'), 'success');
    } catch (error) {
      console.error('Silme hatası:', error);
      showMessage(t('labels.error'), formatDeleteFailed((error as Error).message), 'error');
    }
  };

  const handleViewAnswers = (result: UserResult) => {
    // Cevaplar popup'ını aç
  };

  // Checkbox seçim fonksiyonları
  const handleSelectItem = (code: string) => {
    setSelectedItems(prev => 
      prev.includes(code) 
        ? prev.filter(item => item !== code)
        : [...prev, code]
    );
  };

  const handleSelectAll = () => {
    const visibleResults = paginatedResults;
    
    if (selectedItems.length === visibleResults.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(visibleResults.map(r => r.code));
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) {
      showMessage(t('labels.warning'), t('warnings.selectRecordsToDelete'), 'warning');
      return;
    }
    setShowBulkDeletePopup(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      // Her bir kaydı tek tek sil
      const deletePromises = selectedItems.map(code => 
        fetch(`${API_BASE_URL}/api/delete-result`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ code })
        })
      );
      
      const responses = await Promise.all(deletePromises);
      
      // Tüm silme işlemlerinin başarılı olduğunu kontrol et
      const failedDeletes = responses.filter(response => !response.ok);
      if (failedDeletes.length > 0) {
        throw new Error(t('errors.deleteFailed'));
      }

      // Başarılı silme sonrası
      setShowBulkDeletePopup(false);
      setSelectedItems([]);
      
      // Veriyi yeniden yükle (cache'i bypass et)
      await refreshAfterMutation();
      
      showMessage(t('labels.success'), formatBulkDeleteSuccess(selectedItems.length), 'success');
    } catch (error) {
      console.error('Toplu silme hatası:', error);
      showMessage(t('labels.error'), formatBulkDeleteFailed((error as Error).message), 'error');
    }
  };

  // Modal functions
  const showMessage = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setMessageModal({ title, message, type });
    setShowMessageModal(true);
  };

  const closeMessageModal = () => {
    setShowMessageModal(false);
  };

  // Pagination artık backend'de yapılıyor, filteredResults zaten sayfalanmış veri
  const paginatedResults = filteredResults;

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
          Veriler yükleniyor...
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
      <div
        className="header-gradient"
        style={{
        width: '100%',
        height: '75px',
        borderBottomRightRadius: '16px',
        borderBottomLeftRadius: '16px',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: '0 32px',
        marginLeft: '0px',
        marginBottom: '20px'
      }}
      >
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
            {t('titles.adminPanel')}
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
            placeholder={t('placeholders.searchAllColumns')}
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
          gap: '16px'
        }}>
          <button
            onClick={() => setShowAddPersonPopup(true)}
            className="btn btn-primary btn-lg"
          >
            <i className="fas fa-user-plus"></i>
            Kişi Ekle
          </button>
          {/* Toplu Silme Button */}
          {selectedItems.length > 0 && (
            <>
              <button
                onClick={handleBulkSendPopup}
                className="btn btn-primary"
              >
                <i className="fas fa-paper-plane"></i>
                Toplu Gönder ({selectedItems.length})
              </button>
              <button
                onClick={handleBulkDelete}
                className="btn btn-danger"
              >
                <i className="fas fa-trash"></i>
                {t('buttons.bulkDelete')} ({selectedItems.length})
              </button>
            </>
          )}

          {/* Person Type Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px',
            background: '#F3F4F6',
            borderRadius: '12px',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
            border: '1px solid #E5E7EB'
          }}>
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'candidate', label: 'Adaylar' },
              { id: 'employee', label: 'Çalışanlar' }
            ].map((tab) => {
              const isActive = activePersonTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePersonTab(tab.id as 'all' | 'candidate' | 'employee')}
                  style={{
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? 'white' : '#6B7280',
                    background: isActive ? '#9f8fbe' : 'transparent',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 10px rgba(159, 143, 190, 0.25)' : 'none'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadData(true, true)}
            className="btn btn-secondary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('buttons.refresh')}
          </button>

        </div>
      </div>

      {/* Results Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        border: '1px solid #F3F4F6'
      }}>
        <div style={{
          overflowX: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: 'none'
          }}>
            <thead>
              <tr style={{
                background: '#F9FAFB',
                borderBottom: '1px solid #F1F5F9'
              }}>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#232D42',
                  fontFamily: 'Inter',
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
                      checked={selectedItems.length > 0 && selectedItems.length === paginatedResults.length}
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
                      backgroundColor: selectedItems.length > 0 && selectedItems.length === paginatedResults.length ? '#0286F7' : 'white',
                      border: `2px solid ${selectedItems.length > 0 && selectedItems.length === paginatedResults.length ? '#0286F7' : '#E9ECEF'}`,
                      borderRadius: '4px',
                      transition: 'all 0.3s ease',
                      transform: selectedItems.length > 0 && selectedItems.length === paginatedResults.length ? 'scale(1.1)' : 'scale(1)'
                    }}>
                      {selectedItems.length > 0 && selectedItems.length === paginatedResults.length && (
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
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#6B7280',
                  fontFamily: 'Inter',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>{t('labels.nameSurname')}</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#6B7280',
                  fontFamily: 'Inter',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>{t('labels.statusShort')}</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#6B7280',
                  fontFamily: 'Inter',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>{t('labels.averageScore')}</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#6B7280',
                  fontFamily: 'Inter',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>{t('labels.measuredCompetencies')}</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#6B7280',
                  fontFamily: 'Inter',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>{t('labels.title')}</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#6B7280',
                  fontFamily: 'Inter',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>{t('labels.position')}</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#6B7280',
                  fontFamily: 'Inter',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>{t('labels.departmentLeadership')}</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#6B7280',
                  fontFamily: 'Inter',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>{t('labels.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedResults.map((result, index) => (
                <React.Fragment key={result.code}>
                  <tr style={{
                    borderBottom: '1px solid #F1F5F9',
                    background: 'white'
                  }}>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    color: '#232D42',
                    fontFamily: 'Inter',
                    fontWeight: 500,
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
                        checked={selectedItems.includes(result.code)}
                        onChange={() => handleSelectItem(result.code)}
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
                        backgroundColor: selectedItems.includes(result.code) ? '#0286F7' : 'white',
                        border: `2px solid ${selectedItems.includes(result.code) ? '#0286F7' : '#E9ECEF'}`,
                        borderRadius: '4px',
                        transition: 'all 0.3s ease',
                        transform: selectedItems.includes(result.code) ? 'scale(1.1)' : 'scale(1)'
                      }}>
                        {selectedItems.includes(result.code) && (
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
                    fontSize: '14px',
                    color: '#232D42',
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    textAlign: 'left'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '999px',
                        backgroundColor: getAvatarStyle(result.name).bg,
                        color: getAvatarStyle(result.name).text,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700
                      }}>
                        {getInitials(result.name)}
                      </div>
                      <div>
                        <div
                          onClick={() => navigate('/person-results', { state: { selectedUser: result } })}
                          style={{
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#1F2937'
                          }}
                        >
                          {result.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                          {result.email || '-'}
                        </div>
                      </div>
                    </div>
                     {result.isGrouped && result.groupCount && result.groupCount > 1 && (() => {
                       // HTML'deki gibi görünür grup sayısını hesapla
                       let visibleGroupCount = 1;
                       if (result.allGroupItems) {
                         visibleGroupCount = result.allGroupItems.length;
                       }
                       return visibleGroupCount > 1 ? (
                         <span style={{
                           color: '#666',
                           fontSize: '12px',
                           marginLeft: '8px'
                         }}>
                          {formatTemplate(t('labels.resultsCount'), { count: visibleGroupCount })}
                         </span>
                       ) : null;
                     })()}
                     {result.hasExpiredCode && (
                       <span style={{
                         marginLeft: '8px',
                         color: '#FF6B35',
                         fontSize: '14px'
                       }} title={t('labels.hasUnplayedGame')}>
                         <i className="fas fa-exclamation-triangle"></i>
                       </span>
                     )}
                  </td>
                  <td style={{
                    padding: '16px',
                    fontSize: '12px',
                    color: '#6B7280',
                    fontFamily: 'Inter',
                    textAlign: 'center'
                  }}>
                    {getStatusBadge(result.status)}
                  </td>
                  <td style={{
                    padding: '16px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#1F2937'
                  }}>
                    {formatAverageScore(result)}
                  </td>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    color: '#8A92A6',
                    fontFamily: 'Inter',
                    textAlign: 'left'
                  }}>
                    {(() => {
                      const items = getMeasuredCompetencyList(result);
                      if (items.length === 0) {
                        return <span style={{ color: '#9CA3AF' }}>-</span>;
                      }
                      return (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {items.map((item) => (
                            <span
                              key={item}
                              style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: '999px',
                                backgroundColor: '#F3F4F6',
                                color: '#6B7280',
                                fontWeight: 600
                              }}
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </td>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    color: '#8A92A6',
                    fontFamily: 'Inter',
                    textAlign: 'center'
                  }}>
                    {result.unvan || '-'}
                  </td>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    color: '#8A92A6',
                    fontFamily: 'Inter',
                    textAlign: 'center'
                  }}>
                    {result.pozisyon || '-'}
                  </td>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    color: '#8A92A6',
                    fontFamily: 'Inter',
                    textAlign: 'center'
                  }}>
                    {result.departman || '-'}
                  </td>
                  <td style={{
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      {isSuperAdmin && (
                        <div
                          onClick={() => handleView(result.code)}
                          style={{
                            cursor: 'pointer',
                            color: '#17A2B8',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px'
                          }}
                          title={t('labels.viewAnswers')}
                        >
                          <i className="fas fa-info-circle"></i>
                        </div>
                      )}
                      <div
                        onClick={() => result.status === 'Tamamlandı' ? handlePDF(result.code) : null}
                        style={{
                          cursor: result.status === 'Tamamlandı' ? 'pointer' : 'not-allowed',
                          color: result.status === 'Tamamlandı' ? '#0286F7' : '#ADB5BD',
                          opacity: result.status === 'Tamamlandı' ? 1 : 0.5,
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px'
                        }}
                        title={t('labels.downloadPdf')}
                      >
                        <i className="fas fa-file-pdf"></i>
                      </div>
                      <div
                        onClick={() => handleQuickSendPopup(result.code)}
                        style={{
                          cursor: 'pointer',
                          color: '#7C3AED',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px'
                        }}
                        title={t('buttons.send')}
                      >
                        <i className="fas fa-paper-plane"></i>
                      </div>
                      {isSuperAdmin && (
                        <div
                          onClick={() => result.status === 'Tamamlandı' ? handleExcel(result.code) : null}
                          style={{
                            cursor: result.status === 'Tamamlandı' ? 'pointer' : 'not-allowed',
                            color: result.status === 'Tamamlandı' ? '#1D6F42' : '#ADB5BD',
                            opacity: result.status === 'Tamamlandı' ? 1 : 0.5,
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px'
                          }}
                        title={t('labels.downloadExcel')}
                        >
                          <i className="fas fa-file-excel"></i>
                        </div>
                      )}
                      {isSuperAdmin && (
                        <div
                          onClick={() => result.status === 'Tamamlandı' ? handleWord(result.code) : null}
                          style={{
                            cursor: result.status === 'Tamamlandı' ? 'pointer' : 'not-allowed',
                            color: result.status === 'Tamamlandı' ? '#2B579A' : '#ADB5BD',
                            opacity: result.status === 'Tamamlandı' ? 1 : 0.5,
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px'
                          }}
                        title={t('labels.downloadWord')}
                        >
                          <i className="fas fa-file-word"></i>
                        </div>
                      )}
                      <div
                        onClick={() => handleDelete(result.code)}
                        style={{
                          cursor: 'pointer',
                          color: '#FF0000',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px'
                        }}
                        title={t('buttons.delete')}
                      >
                        <i className="fas fa-trash"></i>
                      </div>
                    </div>
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
            {formatTemplate(t('labels.recordsRange'), {
              start: ((currentPage - 1) * itemsPerPage) + 1,
              end: Math.min(currentPage * itemsPerPage, totalCount),
              total: totalCount
            })}
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

      {/* PDF Popup */}
      {showPDFPopup && (
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
                {t('labels.downloadReport')}
              </div>
              <div
                onClick={() => setShowPDFPopup(false)}
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
              {/*
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB', marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  id="generalEvaluation"
                  checked={pdfOptions.generalEvaluation}
                  onChange={(e) => setPdfOptions(prev => ({ ...prev, generalEvaluation: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: '#0286F7' }}
                />
                <span style={{ fontSize: '14px', color: '#232D42' }}>{t('labels.generalEvaluation')}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB', marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  id="strengths"
                  checked={pdfOptions.strengths}
                  onChange={(e) => setPdfOptions(prev => ({ ...prev, strengths: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: '#0286F7' }}
                />
                <span style={{ fontSize: '14px', color: '#232D42' }}>{t('labels.strengthsDev')}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB', marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  id="interviewQuestions"
                  checked={pdfOptions.interviewQuestions}
                  onChange={(e) => setPdfOptions(prev => ({ ...prev, interviewQuestions: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: '#0286F7' }}
                />
                <span style={{ fontSize: '14px', color: '#232D42' }}>{t('labels.interviewQuestions')}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB', marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  id="whyTheseQuestions"
                  checked={pdfOptions.whyTheseQuestions}
                  onChange={(e) => setPdfOptions(prev => ({ ...prev, whyTheseQuestions: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: '#0286F7' }}
                />
                <span style={{ fontSize: '14px', color: '#232D42' }}>{t('labels.whyTheseQuestions')}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                <input
                  type="checkbox"
                  id="developmentSuggestions"
                  checked={pdfOptions.developmentSuggestions}
                  onChange={(e) => setPdfOptions(prev => ({ ...prev, developmentSuggestions: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: '#0286F7' }}
                />
                <span style={{ fontSize: '14px', color: '#232D42' }}>{t('labels.developmentPlan')}</span>
              </label>
              */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center'
              }}>
              <button
                onClick={async () => {
                  if (!selectedUser) return;
                  
                  try {
                    setIsPdfDownloading(true);
                    // PDFOptions'ı URLSearchParams için uygun formata çevir
                    const pdfParams = new URLSearchParams();
                    Object.entries(pdfOptions).forEach(([key, value]) => {
                      pdfParams.append(key, value.toString());
                    });
                    
                    const response = await fetch(`${API_BASE_URL}/api/preview-pdf?code=${selectedUser.code}&${pdfParams.toString()}`, {
                      credentials: 'include'
                    });
                    
                    if (!response.ok) {
                      throw new Error(t('errors.pdfCreateFailed'));
                    }
                    
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    
                    // PDF önizleme popup'ını aç ve iframe'e yükle
                    setShowPDFPopup(false);
                    setShowPDFPreview(true);
                    
                    // iframe'i güncelle
                    setTimeout(() => {
                      const iframe = document.getElementById('pdfPreviewFrame') as HTMLIFrameElement;
                      if (iframe) {
                        iframe.src = url;
                      }
                    }, 100);
                  } catch (error) {
                    console.error('PDF önizleme hatası:', error);
                    showMessage(t('labels.error'), formatPdfPreviewFailed((error as Error).message), 'error');
                  } finally {
                    setIsPdfDownloading(false);
                  }
                }}
                disabled={isPdfDownloading}
                style={{
                  padding: '8px 16px',
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'Inter',
                  fontWeight: 500
                }}
              >
                {t('labels.preview')}
              </button>
              <button
                onClick={async () => {
                  if (!selectedUser) return;
                  
                  try {
                    setIsPdfDownloading(true);
                    const response = await fetch(`${API_BASE_URL}/api/evaluation/generatePDF`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      credentials: 'include',
                      body: JSON.stringify({
                        userCode: selectedUser.code,
                        selectedOptions: pdfOptions
                      })
                    });
                    
                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.message || t('errors.pdfCreateFailed'));
                    }
                    
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    
                    // Kullanıcı bilgilerini al
                    const userResponse = await fetch(`${API_BASE_URL}/api/user-results?code=${selectedUser.code}`, {
                      credentials: 'include'
                    });
                    const userData = await userResponse.json();
                    
                    if (!userData.success || !userData.results || userData.results.length === 0) {
                      throw new Error(t('errors.userInfoFetchFailed'));
                    }
                    
                    const user = userData.results[0];
                    const date = user.completionDate ? new Date(user.completionDate) : new Date();
                    const formattedDate = `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear()}`;
                    
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ANDRON_DeğerlendirmeRaporu_${user.name.replace(/\s+/g, '_')}_${formattedDate}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    
                    setShowPDFPopup(false);
                  } catch (error) {
                    console.error('PDF indirme hatası:', error);
                    showMessage(t('labels.error'), formatPdfDownloadFailed((error as Error).message), 'error');
                  } finally {
                    setIsPdfDownloading(false);
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'Inter',
                  fontWeight: 500
                }}
              >
                {isPdfDownloading ? t('labels.pdfLoading') : t('labels.downloadReport')}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Answers Popup */}
      {showAnswersPopup && selectedUser && (
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
            width: isMobile ? '95%' : '80%',
            maxWidth: isMobile ? '95%' : '800px',
            maxHeight: '80%',
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
                {t('labels.gameAnswersTitle')}
              </div>
              <div
                onClick={() => setShowAnswersPopup(false)}
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
              {/* Oyun Bilgileri Bölümü */}
              <div style={{
                marginBottom: '20px',
                padding: '16px',
                background: '#E3F2FD',
                borderRadius: '8px',
                borderLeft: '4px solid #0286F7'
              }}>
                <div style={{
                  fontWeight: 600,
                  color: '#0286F7',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  {t('labels.gameInfo')}
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  fontSize: '14px'
                }}>
                  <div><strong>{t('labels.code')}:</strong> {selectedUser.code}</div>
                  <div><strong>{t('labels.nameSurname')}:</strong> {selectedUser.name}</div>
                  <div><strong>{t('labels.email')}:</strong> {selectedUser.email}</div>
                  <div><strong>{t('labels.status')}:</strong> {formatStatusLabel(selectedUser.status)}</div>
                  {selectedUser.reportId && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>{t('labels.reportId')}:</strong> {selectedUser.reportId}
                    </div>
                  )}
                </div>
              </div>

              {/* Cevaplar Bölümü */}
              {selectedUser.answers && selectedUser.answers.length > 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {selectedUser.answers.map((answer: any, index: number) => (
                    <div key={index} style={{
                      background: '#F8F9FA',
                      border: '1px solid #E9ECEF',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        fontWeight: 600,
                        color: '#232D42',
                        marginBottom: '8px',
                        fontSize: '14px'
                      }}>
                        {t('labels.question')} {index + 1} {answer.questionId ? `(${answer.questionId})` : ''}
                      </div>
                      
                      {/* HTML'deki gibi 2 sütunlu yapı */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        fontSize: '14px'
                      }}>
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          border: '1px solid #E9ECEF'
                        }}>
                          <div style={{
                            fontWeight: 500,
                            color: '#6C757D',
                            marginBottom: '4px',
                            fontSize: '12px'
                          }}>
                            {t('labels.selectedAnswer1')}:
                          </div>
                          <div style={{
                            color: '#232D42',
                            fontSize: '14px'
                          }}>
                            {answer.answerType1 || answer.selectedAnswer1 || '-'}
                          </div>
                        </div>
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          border: '1px solid #E9ECEF'
                        }}>
                          <div style={{
                            fontWeight: 500,
                            color: '#6C757D',
                            marginBottom: '4px',
                            fontSize: '12px'
                          }}>
                            {t('labels.selectedAnswer2')}:
                          </div>
                          <div style={{
                            color: '#232D42',
                            fontSize: '14px'
                          }}>
                            {answer.answerType2 || answer.selectedAnswer2 || '-'}
                          </div>
                        </div>
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          border: '1px solid #E9ECEF'
                        }}>
                          <div style={{
                            fontWeight: 500,
                            color: '#6C757D',
                            marginBottom: '4px',
                            fontSize: '12px'
                          }}>
                            {t('labels.subCategory')}:
                          </div>
                          <div style={{
                            color: '#232D42',
                            fontSize: '14px'
                          }}>
                            {answer.answerSubCategory || '-'}
                          </div>
                        </div>
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          border: '1px solid #E9ECEF'
                        }}>
                          <div style={{
                            fontWeight: 500,
                            color: '#6C757D',
                            marginBottom: '4px',
                            fontSize: '12px'
                          }}>
                            {t('labels.planet')}:
                          </div>
                          <div style={{
                            color: '#232D42',
                            fontSize: '14px'
                          }}>
                            {answer.planetName || '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: '#6C757D',
                  padding: '40px'
                }}>
                  {t('labels.noAnswersFound')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isPdfDownloading && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            width: '90%',
            maxWidth: '420px',
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              {t('labels.pdfLoading')}
            </div>
            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
              PDF oluşturuluyor ve indiriliyor, lütfen bekleyin.
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: '#E5E7EB',
              borderRadius: '999px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${pdfProgress}%`,
                height: '100%',
                background: '#3B82F6',
                transition: 'width 0.4s ease'
              }} />
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#6B7280' }}>
              {pdfProgress}%
            </div>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setIsPdfDownloading(false)}
              >
                {t('buttons.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isWordDownloading && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            width: '90%',
            maxWidth: '420px',
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              {t('labels.loading')}
            </div>
            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
              Word oluşturuluyor ve indiriliyor, lütfen bekleyin.
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: '#E5E7EB',
              borderRadius: '999px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${wordProgress}%`,
                height: '100%',
                background: '#3B82F6',
                transition: 'width 0.4s ease'
              }} />
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#6B7280' }}>
              {wordProgress}%
            </div>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setIsWordDownloading(false)}
              >
                {t('buttons.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddPersonPopup && (
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
            width: isMobile ? '92%' : '520px',
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
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#232D42' }}>
                Kişi Ekle
              </div>
              <div
                onClick={() => {
                  setShowAddPersonPopup(false);
                  setAddPersonTab('single');
                  setAddPersonExcelFile(null);
                }}
                style={{ cursor: 'pointer', fontSize: '24px', color: '#666' }}
              >
                ×
              </div>
            </div>
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #E9ECEF',
              background: '#F8F9FA'
            }}>
              <button
                className={addPersonTab === 'single' ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ borderRadius: 0, flex: 1 }}
                onClick={() => setAddPersonTab('single')}
              >
                Tekil Ekle
              </button>
              <button
                className={addPersonTab === 'bulk' ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ borderRadius: 0, flex: 1 }}
                onClick={() => setAddPersonTab('bulk')}
              >
                Toplu Ekle
              </button>
            </div>
            <div style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {addPersonTab === 'single' && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                      İsim Soyisim *
                    </div>
                    <input
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      placeholder="Örn: Ayşe Yılmaz"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'Inter'
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                      E-posta *
                    </div>
                    <input
                      value={newPersonEmail}
                      onChange={(e) => setNewPersonEmail(e.target.value)}
                      placeholder="ornek@firma.com"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'Inter'
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                      Ünvan *
                    </div>
                  <select
                    value={newPersonTitle}
                    onChange={(e) => setNewPersonTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      background: 'white'
                    }}
                  >
                    <option value="">Seçiniz</option>
                    <option value="Üst Seviye Yönetici">Üst Seviye Yönetici</option>
                    <option value="Ara Kademe Yönetici">Ara Kademe Yönetici</option>
                    <option value="Takım Lideri / Supervisor">Takım Lideri / Supervisor</option>
                    <option value="Kıdemli Uzman">Kıdemli Uzman</option>
                    <option value="Uzman">Uzman</option>
                    <option value="Uzman Yardımcısı">Uzman Yardımcısı</option>
                    <option value="MT / Stajyer">MT / Stajyer</option>
                  </select>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                      Pozisyon *
                    </div>
                    <input
                      value={newPersonPosition}
                      onChange={(e) => setNewPersonPosition(e.target.value)}
                      placeholder="Örn: Satış"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'Inter'
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                      Departman *
                    </div>
                    <input
                      value={newPersonDepartment}
                      onChange={(e) => setNewPersonDepartment(e.target.value)}
                      placeholder="Örn: İnsan Kaynakları"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'Inter'
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                      Çalışan Tipi *
                    </div>
                    <select
                      value={newPersonType}
                      onChange={(e) => setNewPersonType(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'Inter',
                        background: 'white'
                      }}
                    >
                      <option value="">Seçiniz</option>
                      <option value="Aday">Aday</option>
                      <option value="Çalışan">Çalışan</option>
                    </select>
                  </div>
                </div>
              )}
              {addPersonTab === 'bulk' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={downloadAddPersonTemplate}
                    >
                      {t('buttons.downloadTemplate')}
                    </button>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    id="add-person-excel-input"
                    style={{ display: 'none' }}
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setAddPersonExcelFile(file);
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => document.getElementById('add-person-excel-input')?.click()}
                    >
                      {t('buttons.uploadExcel')}
                    </button>
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>
                      {addPersonExcelFile ? addPersonExcelFile.name : 'Dosya seçilmedi'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #E9ECEF',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              background: '#F8F9FA'
            }}>
              <button
                onClick={() => {
                  setShowAddPersonPopup(false);
                  setAddPersonTab('single');
                  setAddPersonExcelFile(null);
                }}
                className="btn btn-secondary"
              >
                {t('buttons.cancel')}
              </button>
              {addPersonTab === 'single' ? (
                <button
                  onClick={handleAddPerson}
                  disabled={isAddingPerson}
                  className="btn btn-primary"
                >
                  {isAddingPerson ? t('labels.loading') : 'Kişi Ekle'}
                </button>
              ) : (
                <button
                  onClick={handleBulkAddPerson}
                  disabled={isBulkAddingPerson}
                  className="btn btn-primary"
                >
                  {isBulkAddingPerson ? t('labels.uploading') : t('buttons.upload')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showQuickSendPopup && (
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
            width: isMobile ? '90%' : '420px',
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
                {t('labels.planetSelection')}
              </div>
              <div
                onClick={() => setShowQuickSendPopup(false)}
                style={{
                  cursor: 'pointer',
                  fontSize: '24px',
                  color: '#666'
                }}
              >
                ×
              </div>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {availablePlanets.map((planet) => (
                <label key={planet.value} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #E0E7FF',
                  background: '#F8FAFF',
                  cursor: 'pointer'
                }}>
                  <span style={{ fontSize: '14px', color: '#232D42' }}>{planet.label}</span>
                  <input
                    type="checkbox"
                    checked={quickSendPlanets.includes(planet.value)}
                    onChange={() => toggleQuickSendPlanet(planet.value)}
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
                    backgroundColor: quickSendPlanets.includes(planet.value) ? '#0286F7' : 'white',
                    border: `2px solid ${quickSendPlanets.includes(planet.value) ? '#0286F7' : '#E9ECEF'}`,
                    borderRadius: '4px',
                    transition: 'all 0.3s ease',
                    transform: quickSendPlanets.includes(planet.value) ? 'scale(1.05)' : 'scale(1)'
                  }}>
                    {quickSendPlanets.includes(planet.value) && (
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
              ))}
            </div>
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #E9ECEF',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              background: '#F8F9FA'
            }}>
              <button
                onClick={() => setShowQuickSendPopup(false)}
                className="btn btn-secondary"
              >
                {t('buttons.cancel')}
              </button>
              <button
                onClick={handleQuickSend}
                disabled={isQuickSending}
                className="btn btn-primary"
              >
                {isQuickSending ? t('labels.loading') : t('buttons.send')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkSendPopup && (
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
            width: isMobile ? '92%' : '640px',
            maxHeight: '85vh',
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
                Toplu Gönder
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    const allPlanets = availablePlanets.map((planet) => planet.value);
                    setBulkSendPlanets((prev) => {
                      const next = { ...prev };
                      bulkSendTargets.forEach((user) => {
                        next[user.code] = allPlanets;
                      });
                      return next;
                    });
                  }}
                  style={{
                    border: '1px solid #C7D2FE',
                    background: '#EEF2FF',
                    color: '#4338CA',
                    borderRadius: '999px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Herkeste Tümü
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBulkSendPlanets((prev) => {
                      const next = { ...prev };
                      bulkSendTargets.forEach((user) => {
                        next[user.code] = [];
                      });
                      return next;
                    });
                  }}
                  style={{
                    border: '1px solid #E5E7EB',
                    background: '#F3F4F6',
                    color: '#6B7280',
                    borderRadius: '999px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Herkeste Temizle
                </button>
                <div
                  onClick={() => setShowBulkSendPopup(false)}
                  style={{
                    cursor: 'pointer',
                    fontSize: '24px',
                    color: '#666',
                    marginLeft: '4px'
                  }}
                >
                  ×
                </div>
              </div>
            </div>
            <div style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflowY: 'auto'
            }}>
              {bulkSendTargets.map((user) => (
                <div key={user.code} style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  background: '#F9FAFB'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '6px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                      {user.name || '-'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                      {(bulkSendPlanets[user.code] || []).length}/{availablePlanets.length} seçili
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                      {user.email || user.code}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setBulkSendPlanets((prev) => ({
                          ...prev,
                          [user.code]: availablePlanets.map((planet) => planet.value)
                        }))}
                        style={{
                          border: '1px solid #C7D2FE',
                          background: '#EEF2FF',
                          color: '#4338CA',
                          borderRadius: '999px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Tümü
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkSendPlanets((prev) => ({
                          ...prev,
                          [user.code]: []
                        }))}
                        style={{
                          border: '1px solid #E5E7EB',
                          background: '#F3F4F6',
                          color: '#6B7280',
                          borderRadius: '999px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Temizle
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {availablePlanets.map((planet) => (
                      <label key={`${user.code}-${planet.value}`} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid #E0E7FF',
                        background: '#F8FAFF',
                        cursor: 'pointer'
                      }}>
                        <span style={{ fontSize: '13px', color: '#232D42' }}>{planet.label}</span>
                        <input
                          type="checkbox"
                          checked={(bulkSendPlanets[user.code] || []).includes(planet.value)}
                          onChange={() => toggleBulkSendPlanet(user.code, planet.value)}
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
                          backgroundColor: (bulkSendPlanets[user.code] || []).includes(planet.value) ? '#0286F7' : 'white',
                          border: `2px solid ${(bulkSendPlanets[user.code] || []).includes(planet.value) ? '#0286F7' : '#E9ECEF'}`,
                          borderRadius: '4px',
                          transition: 'all 0.3s ease',
                          transform: (bulkSendPlanets[user.code] || []).includes(planet.value) ? 'scale(1.05)' : 'scale(1)'
                        }}>
                          {(bulkSendPlanets[user.code] || []).includes(planet.value) && (
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
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #E9ECEF',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              background: '#F8F9FA'
            }}>
              <button
                onClick={() => setShowBulkSendPopup(false)}
                className="btn btn-secondary"
              >
                {t('buttons.cancel')}
              </button>
              <button
                onClick={handleBulkSend}
                disabled={isBulkSending}
                className="btn btn-primary"
              >
                {isBulkSending ? t('labels.loading') : t('buttons.send')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Popup */}
      {showPDFPreview && (
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
            width: '90%',
            height: '90%',
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
                {t('labels.pdfPreview')}
              </div>
              <div
                onClick={() => setShowPDFPreview(false)}
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
              <iframe
                id="pdfPreviewFrame"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 'none' }}
                title={t('labels.pdfPreview')}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Popup */}
      {showDeletePopup && (
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
            width: '400px',
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
                {t('titles.deleteResult')}
              </div>
              <div
                onClick={() => setShowDeletePopup(false)}
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
              <p style={{ fontSize: '14px', color: '#232D42', marginBottom: '8px' }}>
                {t('labels.deleteResultConfirm')}
              </p>
              <p style={{ fontSize: '12px', color: '#DC2626', fontWeight: 500 }}>
                {t('labels.deleteResultWarning')}
              </p>
            </div>
            <div style={{
              padding: '20px',
              borderTop: '1px solid #E9ECEF',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowDeletePopup(false)}
                style={{
                  padding: '8px 16px',
                  background: '#6C757D',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'Inter',
                  fontWeight: 500
                }}
              >
                {t('buttons.no')}
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '8px 16px',
                  background: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'Inter',
                  fontWeight: 500
                }}
              >
                {t('buttons.confirmDelete')}
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
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '400px',
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
                {t('titles.bulkDelete')}
              </div>
              <div
                onClick={() => setShowBulkDeletePopup(false)}
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
              <p style={{ fontSize: '14px', color: '#232D42', marginBottom: '8px' }}>
                {formatBulkDeleteConfirm(selectedItems.length)}
              </p>
              <p style={{ fontSize: '12px', color: '#DC2626', fontWeight: 500 }}>
                {t('labels.bulkDeleteWarning')}
              </p>
            </div>
            <div style={{
              padding: '20px',
              borderTop: '1px solid #E9ECEF',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowBulkDeletePopup(false)}
                style={{
                  padding: '8px 16px',
                  background: '#6C757D',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'Inter',
                  fontWeight: 500
                }}
              >
                {t('buttons.no')}
              </button>
              <button
                onClick={confirmBulkDelete}
                style={{
                  padding: '8px 16px',
                  background: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'Inter',
                  fontWeight: 500
                }}
              >
                {t('buttons.confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '0',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            animation: 'modalSlideIn 0.3s ease-out'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '24px 24px 16px 24px',
              borderBottom: '1px solid #E9ECEF'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0,
                background: messageModal.type === 'success' ? '#D4EDDA' : 
                           messageModal.type === 'error' ? '#F8D7DA' :
                           messageModal.type === 'warning' ? '#FFF3CD' : '#D1ECF1',
                color: messageModal.type === 'success' ? '#155724' : 
                       messageModal.type === 'error' ? '#721C24' :
                       messageModal.type === 'warning' ? '#856404' : '#0C5460'
              }}>
                <i className={`fas ${
                  messageModal.type === 'success' ? 'fa-check-circle' :
                  messageModal.type === 'error' ? 'fa-times-circle' :
                  messageModal.type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'
                }`}></i>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#232D42',
                margin: 0
              }}>
                {messageModal.title}
              </h3>
            </div>
            <div style={{
              padding: '16px 24px 24px 24px',
              color: '#495057',
              fontSize: '14px',
              lineHeight: 1.5
            }}>
              {messageModal.message}
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              padding: '0 24px 24px 24px'
            }}>
              <button
                onClick={closeMessageModal}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '80px',
                  background: '#3A57E8',
                  color: 'white'
                }}
              >
                {t('buttons.ok')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;