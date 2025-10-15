import React, { useState, useEffect, useRef } from 'react';
import { evaluationAPI, creditAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Dinamik API base URL - hem local hem live'da çalışır
const API_BASE_URL = (import.meta as any).env?.DEV 
  ? `${window.location.protocol}//${window.location.hostname}:5000`  // Development
  : '';  // Production (aynı domain'de serve edilir)

interface UserResult {
  code: string;
  name: string;
  email: string;
  status: string;
  sentDate: string;
  completionDate: string;
  expiryDate: string;
  reportExpiryDate: string;
  reportId?: string;
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
  const { user } = useAuth();
  const [results, setResults] = useState<UserResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<UserResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showExpiredWarning, setShowExpiredWarning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Popup states
  const [showPDFPopup, setShowPDFPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showAnswersPopup, setShowAnswersPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [pdfOptions, setPdfOptions] = useState<PDFOptions>({
    generalEvaluation: true,
    strengths: true,
    interviewQuestions: true,
    whyTheseQuestions: true,
    developmentSuggestions: true
  });
  
  const hasLoaded = useRef(false);
  
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
    // Sadece bir kere çalıştır (React Strict Mode için)
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      loadData();
    }
  }, []);

  useEffect(() => {
    // Sadece results yüklendiyse filtreleme yap
    if (results.length > 0) {
      filterResults();
    }
  }, [results, searchTerm, statusFilter, showExpiredWarning]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const response = await evaluationAPI.getAll();
      
      
      if (response.data.success) {
        // HTML'deki gibi gruplama uygula
        const groupedResults = groupByEmail(response.data.results);
        setResults(groupedResults);
        setFilteredResults(groupedResults);
      } else {
        console.error('❌ API hatası:', response.data.message);
        console.error('❌ Tam yanıt:', response.data);
      }
    } catch (error) {
      console.error('💥 Veri yükleme hatası:', error);
      console.error('💥 Hata detayı:', error.response?.data);
      console.error('💥 Hata status:', error.response?.status);
    } finally {
      setIsLoading(false);
    }
  };

  const filterResults = () => {
    let filtered = results;

    // HTML'deki gibi sadece isim ile arama
    if (searchTerm) {
      filtered = filtered.filter(result =>
        result.name && result.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // HTML'deki gibi: switch açık değilse süresi dolanları gizle
    if (!showExpiredWarning) {
      filtered = filtered.filter(result => result.status !== 'Süresi Doldu');
    }

    if (statusFilter) {
      filtered = filtered.filter(result => result.status === statusFilter);
    }

    setFilteredResults(filtered);
    setCurrentPage(1);
  };

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
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: statusStyle.bg,
        color: statusStyle.text,
        border: `1px solid ${statusStyle.border}`
      }}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
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
        const latestItem = group[0]; // En yeni olan
        
        // Grupta süresi dolmuş kod var mı kontrol et
        const hasExpiredCode = group.some(item => item.status === 'Süresi Doldu');
        
        groupedData.push({
          ...latestItem,
          isGrouped: true,
          groupCount: group.length,
          allGroupItems: group, // Ham grup (sıralama yapılmamış)
          hasExpiredCode: hasExpiredCode
        });
      }
    });
    
    return groupedData;
  };

  // Grup içindeki oyunları sıralama fonksiyonu
  const sortGroupItems = (groupItems: UserResult[]): UserResult[] => {
    return [...groupItems].sort((a, b) => {
      const statusOrderA = getStatusOrder(a.status);
      const statusOrderB = getStatusOrder(b.status);
      
      //   orderA: statusOrderA,
      //   statusB: b.status,
      //   orderB: statusOrderB
      // });
      
      // Önce statüye göre sırala
      if (statusOrderA !== statusOrderB) {
        return statusOrderA - statusOrderB;
      }
      
      // Aynı statüde ise gönderim tarihine göre sırala (en yeni önce)
      return new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime();
    });
  };

  // Grup açma/kapama fonksiyonu
  const toggleGroup = (email: string) => {
    const newExpandedGroups = new Set(expandedGroups);
    if (newExpandedGroups.has(email)) {
      newExpandedGroups.delete(email);
    } else {
      newExpandedGroups.add(email);
    }
    setExpandedGroups(newExpandedGroups);
  };

  const handleView = async (code: string) => {
    
    try {
      // Backend'den cevapları çek
      const response = await fetch(`${API_BASE_URL}/api/user-results?code=${code}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Cevaplar getirilemedi');
      }
      
      const data = await response.json();
      if (!data.success || !data.results || data.results.length === 0) {
        alert('Bu kod için veri bulunamadı.');
        return;
      }
      
      const existingData = data.results[0];
      setSelectedUser(existingData);
      setShowAnswersPopup(true);
    } catch (error) {
      console.error('Cevapları getirme hatası:', error);
      alert('Cevaplar getirilirken bir hata oluştu: ' + error.message);
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
      alert('Bu kod için veri bulunamadı.');
      return;
    }
    setSelectedUser(existingData);
    setShowPDFPopup(true);
  };

  const handleExcel = async (code: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/export-excel/${code}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Excel indirme işlemi başarısız oldu');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Kullanıcı bilgilerini al
      const userResponse = await fetch(`${API_BASE_URL}/api/user-results?code=${code}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const userData = await userResponse.json();
      
      let fileName = `ANDRON_DeğerlendirmeRaporu_${code}.xlsx`;
      if (userData.success && userData.results && userData.results.length > 0) {
        const user = userData.results[0];
        const date = user.completionDate ? new Date(user.completionDate) : new Date();
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear()}`;
        fileName = `ANDRON_DeğerlendirmeRaporu_${user.name.replace(/\s+/g, '_')}_${formattedDate}.xlsx`;
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
      alert('Excel indirilirken bir hata oluştu: ' + error.message);
    }
  };

  const handleWord = async (code: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/evaluation/generateWord`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userCode: code,
          selectedOptions: pdfOptions // PDF ile aynı seçenekleri kullan
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Word indirme işlemi başarısız oldu');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Kullanıcı bilgilerini al
      const userResponse = await fetch(`${API_BASE_URL}/api/user-results?code=${code}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const userData = await userResponse.json();
      
      let fileName = `ANDRON_DeğerlendirmeRaporu_${code}.docx`;
      if (userData.success && userData.results && userData.results.length > 0) {
        const user = userData.results[0];
        const date = user.completionDate ? new Date(user.completionDate) : new Date();
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear()}`;
        fileName = `ANDRON_DeğerlendirmeRaporu_${user.name.replace(/\s+/g, '_')}_${formattedDate}.docx`;
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
      alert('Word indirilirken bir hata oluştu: ' + error.message);
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
      alert('Bu kod için veri bulunamadı.');
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
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ code: selectedUser.code })
      });

      if (!response.ok) {
        throw new Error('Silme işlemi başarısız oldu');
      }

      // Başarılı silme sonrası
      setShowDeletePopup(false);
      setSelectedUser(null);
      
      // Sadece veriyi yeniden yükle (sayfa yenilenmesin)
      await loadData();
      
      alert('Değerlendirme başarıyla silindi.');
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme işlemi sırasında bir hata oluştu: ' + error.message);
    }
  };

  const handleViewAnswers = (result: UserResult) => {
    // Cevaplar popup'ını aç
  };

  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);

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
            Genel Takip Sistemi
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
            placeholder="Tüm sütunlarda akıllı arama yapın..."
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value;
              setSearchTerm(value);
              // HTML'deki gibi anlık filtreleme
              setTimeout(() => {
                filterResults();
              }, 100);
            }}
            onInput={(e) => {
              // onInput event'i daha güvenilir
              const value = (e.target as HTMLInputElement).value;
              setSearchTerm(value);
              setTimeout(() => {
                filterResults();
              }, 100);
            }}
            onKeyDown={(e) => {
              // Tüm metni seçip silme durumunu yakala
              if (e.key === 'Delete' || e.key === 'Backspace') {
                const input = e.target as HTMLInputElement;
                if (input.selectionStart === 0 && input.selectionEnd === input.value.length) {
                  setSearchTerm('');
                  setTimeout(() => {
                    filterResults();
                  }, 100);
                }
              }
              if (e.key === 'Enter') {
                filterResults();
              }
            }}
            onKeyUp={(e) => {
              // Ctrl+A + Delete/Backspace kombinasyonunu yakala
              const input = e.target as HTMLInputElement;
              if (input.value === '') {
                setSearchTerm('');
                setTimeout(() => {
                  filterResults();
                }, 100);
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
          {/* Refresh Button */}
          <button
            onClick={loadData}
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
            Yenile
          </button>

          {/* Switch */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}>
            <span style={{
              position: 'relative',
              display: 'inline-block',
              width: '44px',
              height: '24px',
              verticalAlign: 'middle'
            }}>
              <input
                type="checkbox"
                checked={showExpiredWarning}
                onChange={(e) => setShowExpiredWarning(e.target.checked)}
                style={{
                  opacity: 0,
                  width: 0,
                  height: 0
                }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: showExpiredWarning ? '#0286F7' : '#E9ECEF',
                transition: '0.3s',
                borderRadius: '24px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '18px',
                  width: '18px',
                  left: '3px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  transition: '0.3s',
                  borderRadius: '50%',
                  transform: showExpiredWarning ? 'translateX(20px)' : 'translateX(0px)'
                }}></span>
              </span>
            </span>
            <span style={{
              marginLeft: '10px',
              fontSize: '14px',
              color: '#232D42',
              fontFamily: 'Inter',
              fontWeight: 500,
              cursor: 'pointer',
              userSelect: 'none'
            }}>
              Süresi Dolan Oyunları Göster
            </span>
          </label>
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
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#232D42',
                  fontFamily: 'Inter',
                  borderRight: '1px solid #E9ECEF'
                }}>Ad Soyad</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#232D42',
                  fontFamily: 'Inter',
                  borderRight: '1px solid #E9ECEF'
                }}>Email</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#232D42',
                  fontFamily: 'Inter',
                  borderRight: '1px solid #E9ECEF'
                }}>Statü</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#232D42',
                  fontFamily: 'Inter',
                  borderRight: '1px solid #E9ECEF'
                }}>Gönderim Tarihi</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#232D42',
                  fontFamily: 'Inter',
                  borderRight: '1px solid #E9ECEF'
                }}>Tamamlama Tarihi</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#232D42',
                  fontFamily: 'Inter',
                  borderRight: '1px solid #E9ECEF'
                }}>Kod Geçerlilik Tarihi</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#232D42',
                  fontFamily: 'Inter',
                  borderRight: '1px solid #E9ECEF'
                }}>Rapor Geçerlilik Tarihi</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#232D42',
                  fontFamily: 'Inter'
                }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {paginatedResults.filter(result => {
                // HTML'deki gibi: switch açık değilse süresi dolanları gizle
                return showExpiredWarning || result.status !== 'Süresi Doldu';
              }).map((result, index) => (
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
                    borderRight: '1px solid #E9ECEF',
                    textAlign: 'left'
                  }}>
                     {result.isGrouped && result.groupCount && result.groupCount > 1 && (() => {
                       // HTML'deki gibi görünür grup sayısını hesapla
                       let visibleGroupCount = 1;
                       if (result.allGroupItems) {
                         visibleGroupCount = 1 + result.allGroupItems.slice(1).filter(sub => 
                           showExpiredWarning || sub.status !== 'Süresi Doldu'
                         ).length;
                       }
                       return visibleGroupCount > 1 ? (
                         <span
                           onClick={() => toggleGroup(result.email)}
                           style={{
                             display: 'inline-block',
                             width: '20px',
                             height: '20px',
                             lineHeight: '18px',
                             textAlign: 'center',
                             background: '#0286F7',
                             color: 'white',
                             borderRadius: '3px',
                             cursor: 'pointer',
                             marginRight: '8px',
                             fontSize: '12px',
                             fontWeight: 'bold'
                           }}
                         >
                           {expandedGroups.has(result.email) ? '-' : '+'}
                         </span>
                       ) : null;
                     })()}
                    {result.name}
                     {result.isGrouped && result.groupCount && result.groupCount > 1 && (() => {
                       // HTML'deki gibi görünür grup sayısını hesapla
                       let visibleGroupCount = 1;
                       if (result.allGroupItems) {
                         visibleGroupCount = 1 + result.allGroupItems.slice(1).filter(sub => 
                           showExpiredWarning || sub.status !== 'Süresi Doldu'
                         ).length;
                       }
                       return visibleGroupCount > 1 ? (
                         <span style={{
                           color: '#666',
                           fontSize: '12px',
                           marginLeft: '8px'
                         }}>
                           ({visibleGroupCount} sonuç)
                         </span>
                       ) : null;
                     })()}
                     {result.hasExpiredCode && showExpiredWarning && (
                       <span style={{
                         marginLeft: '8px',
                         color: '#FF6B35',
                         fontSize: '14px'
                       }} title="Oynanmamış oyun var">
                         <i className="fas fa-exclamation-triangle"></i>
                       </span>
                     )}
                  </td>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    color: '#8A92A6',
                    fontFamily: 'Inter',
                    borderRight: '1px solid #E9ECEF',
                    textAlign: 'center'
                  }}>
                    {result.email}
                  </td>
                  <td style={{
                    padding: '16px',
                    borderRight: '1px solid #E9ECEF',
                    textAlign: 'center'
                  }}>
                    {getStatusBadge(result.status)}
                  </td>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    color: '#8A92A6',
                    fontFamily: 'Inter',
                    borderRight: '1px solid #E9ECEF',
                    textAlign: 'center'
                  }}>
                    {formatDate(result.sentDate)}
                  </td>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    color: '#8A92A6',
                    fontFamily: 'Inter',
                    borderRight: '1px solid #E9ECEF',
                    textAlign: 'center'
                  }}>
                    {result.completionDate ? formatDate(result.completionDate) : '-'}
                  </td>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    color: '#8A92A6',
                    fontFamily: 'Inter',
                    borderRight: '1px solid #E9ECEF',
                    textAlign: 'center'
                  }}>
                    {formatDate(result.expiryDate)}
                  </td>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    color: '#8A92A6',
                    fontFamily: 'Inter',
                    borderRight: '1px solid #E9ECEF',
                    textAlign: 'center'
                  }}>
                    {(() => {
                      // Rapor geçerlilik tarihini hesapla (Gönderim tarihi + 6 ay)
                      const sentDate = new Date(result.sentDate);
                      const reportExpiryDate = new Date(sentDate);
                      reportExpiryDate.setMonth(reportExpiryDate.getMonth() + 6);
                      return formatDate(reportExpiryDate.toISOString());
                    })()}
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
                          title="Cevapları Görüntüle"
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
                        title="PDF İndir"
                      >
                        <i className="fas fa-file-pdf"></i>
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
                          title="Excel İndir"
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
                          title="Word İndir"
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
                        title="Sil"
                      >
                        <i className="fas fa-trash"></i>
                      </div>
                    </div>
                  </td>
                  </tr>
                  
                  {/* Alt satırlar (gruplandırılmış ise) */}
                  {result.isGrouped && result.groupCount && result.groupCount > 1 && result.allGroupItems && expandedGroups.has(result.email) && 
                    sortGroupItems(result.allGroupItems).slice(1).filter(groupItem => {
                      // HTML'deki gibi: switch açık değilse süresi dolanları gizle
                      return showExpiredWarning || groupItem.status !== 'Süresi Doldu';
                    }).map((groupItem, subIndex) => {
                      const subReportExpiryDate = new Date(groupItem.sentDate);
                      subReportExpiryDate.setMonth(subReportExpiryDate.getMonth() + 6);
                      
                      return (
                        <tr key={groupItem.code} style={{
                          borderBottom: '1px solid #F1F3F4',
                          background: subIndex % 2 === 0 ? '#ECECEC' : 'white'
                        }}>
                          <td style={{
                            padding: '16px',
                            paddingLeft: '46px',
                            fontSize: '14px',
                            color: '#232D42',
                            fontFamily: 'Inter',
                            fontWeight: 500,
                            borderRight: '1px solid #E9ECEF',
                            textAlign: 'left'
                          }}>
                            {groupItem.name}
                          </td>
                          <td style={{
                            padding: '16px',
                            fontSize: '14px',
                            color: '#8A92A6',
                            fontFamily: 'Inter',
                            borderRight: '1px solid #E9ECEF',
                            textAlign: 'center'
                          }}>
                            {groupItem.email}
                          </td>
                           <td style={{
                             padding: '16px',
                             fontSize: '14px',
                             fontFamily: 'Inter',
                             borderRight: '1px solid #E9ECEF',
                             textAlign: 'center'
                           }}>
                             {getStatusBadge(groupItem.status)}
                           </td>
                          <td style={{
                            padding: '16px',
                            fontSize: '14px',
                            color: '#8A92A6',
                            fontFamily: 'Inter',
                            borderRight: '1px solid #E9ECEF',
                            textAlign: 'center'
                          }}>
                            {formatDate(groupItem.sentDate)}
                          </td>
                          <td style={{
                            padding: '16px',
                            fontSize: '14px',
                            color: '#8A92A6',
                            fontFamily: 'Inter',
                            borderRight: '1px solid #E9ECEF',
                            textAlign: 'center'
                          }}>
                            {groupItem.completionDate ? formatDate(groupItem.completionDate) : '-'}
                          </td>
                          <td style={{
                            padding: '16px',
                            fontSize: '14px',
                            color: '#8A92A6',
                            fontFamily: 'Inter',
                            borderRight: '1px solid #E9ECEF',
                            textAlign: 'center'
                          }}>
                            {formatDate(groupItem.expiryDate)}
                          </td>
                          <td style={{
                            padding: '16px',
                            fontSize: '14px',
                            color: '#8A92A6',
                            fontFamily: 'Inter',
                            borderRight: '1px solid #E9ECEF',
                            textAlign: 'center'
                          }}>
                            {formatDate(subReportExpiryDate.toISOString())}
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
                                  onClick={() => handleView(groupItem.code)}
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
                                  title="Cevapları Görüntüle"
                                >
                                  <i className="fas fa-info-circle"></i>
                                </div>
                              )}
                              <div
                                onClick={() => groupItem.status === 'Tamamlandı' ? handlePDF(groupItem.code) : null}
                                style={{
                                  cursor: groupItem.status === 'Tamamlandı' ? 'pointer' : 'not-allowed',
                                  color: groupItem.status === 'Tamamlandı' ? '#0286F7' : '#ADB5BD',
                                  opacity: groupItem.status === 'Tamamlandı' ? 1 : 0.5,
                                  fontSize: '16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '24px',
                                  height: '24px'
                                }}
                                title="PDF İndir"
                              >
                                <i className="fas fa-file-pdf"></i>
                              </div>
                              {isSuperAdmin && (
                                <div
                                  onClick={() => groupItem.status === 'Tamamlandı' ? handleExcel(groupItem.code) : null}
                                  style={{
                                    cursor: groupItem.status === 'Tamamlandı' ? 'pointer' : 'not-allowed',
                                    color: groupItem.status === 'Tamamlandı' ? '#1D6F42' : '#ADB5BD',
                                    opacity: groupItem.status === 'Tamamlandı' ? 1 : 0.5,
                                    fontSize: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '24px',
                                    height: '24px'
                                  }}
                                  title="Excel İndir"
                                >
                                  <i className="fas fa-file-excel"></i>
                                </div>
                              )}
                              {isSuperAdmin && (
                                <div
                                  onClick={() => groupItem.status === 'Tamamlandı' ? handleWord(groupItem.code) : null}
                                  style={{
                                    cursor: groupItem.status === 'Tamamlandı' ? 'pointer' : 'not-allowed',
                                    color: groupItem.status === 'Tamamlandı' ? '#2B579A' : '#ADB5BD',
                                    opacity: groupItem.status === 'Tamamlandı' ? 1 : 0.5,
                                    fontSize: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '24px',
                                    height: '24px'
                                  }}
                                  title="Word İndir"
                                >
                                  <i className="fas fa-file-word"></i>
                                </div>
                              )}
                              <div
                                onClick={() => handleDelete(groupItem.code)}
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
                                title="Sil"
                              >
                                <i className="fas fa-trash"></i>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  }
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
            {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredResults.length)} arası, toplam {filteredResults.length} kayıt
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
                PDF İndir
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
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  id="generalEvaluation"
                  checked={pdfOptions.generalEvaluation}
                  onChange={(e) => setPdfOptions(prev => ({ ...prev, generalEvaluation: e.target.checked }))}
                  style={{ marginRight: '8px' }}
                />
                <label htmlFor="generalEvaluation" style={{ fontSize: '14px', color: '#232D42' }}>
                  Tanım ve Genel Değerlendirme
                </label>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  id="strengths"
                  checked={pdfOptions.strengths}
                  onChange={(e) => setPdfOptions(prev => ({ ...prev, strengths: e.target.checked }))}
                  style={{ marginRight: '8px' }}
                />
                <label htmlFor="strengths" style={{ fontSize: '14px', color: '#232D42' }}>
                  Güçlü Yönler ve Gelişim Alanları
                </label>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  id="interviewQuestions"
                  checked={pdfOptions.interviewQuestions}
                  onChange={(e) => setPdfOptions(prev => ({ ...prev, interviewQuestions: e.target.checked }))}
                  style={{ marginRight: '8px' }}
                />
                <label htmlFor="interviewQuestions" style={{ fontSize: '14px', color: '#232D42' }}>
                  Mülakat Soruları
                </label>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  id="whyTheseQuestions"
                  checked={pdfOptions.whyTheseQuestions}
                  onChange={(e) => setPdfOptions(prev => ({ ...prev, whyTheseQuestions: e.target.checked }))}
                  style={{ marginRight: '8px' }}
                />
                <label htmlFor="whyTheseQuestions" style={{ fontSize: '14px', color: '#232D42' }}>
                  Neden Bu Sorular?
                </label>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  id="developmentSuggestions"
                  checked={pdfOptions.developmentSuggestions}
                  onChange={(e) => setPdfOptions(prev => ({ ...prev, developmentSuggestions: e.target.checked }))}
                  style={{ marginRight: '8px' }}
                />
                <label htmlFor="developmentSuggestions" style={{ fontSize: '14px', color: '#232D42' }}>
                  Gelişim Planı
                </label>
              </div>
            </div>
            <div style={{
              padding: '20px',
              borderTop: '1px solid #E9ECEF',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={async () => {
                  if (!selectedUser) return;
                  
                  try {
                    // PDFOptions'ı URLSearchParams için uygun formata çevir
                    const pdfParams = new URLSearchParams();
                    Object.entries(pdfOptions).forEach(([key, value]) => {
                      pdfParams.append(key, value.toString());
                    });
                    
                    const response = await fetch(`${API_BASE_URL}/api/preview-pdf?code=${selectedUser.code}&${pdfParams.toString()}`, {
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      }
                    });
                    
                    if (!response.ok) {
                      throw new Error('PDF oluşturulurken bir hata oluştu');
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
                    alert('PDF önizlenirken bir hata oluştu: ' + error.message);
                  }
                }}
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
                Önizleme
              </button>
              <button
                onClick={async () => {
                  if (!selectedUser) return;
                  
                  try {
                    const response = await fetch(`${API_BASE_URL}/api/evaluation/generatePDF`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      },
                      body: JSON.stringify({
                        userCode: selectedUser.code,
                        selectedOptions: pdfOptions
                      })
                    });
                    
                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.message || 'PDF oluşturulurken bir hata oluştu');
                    }
                    
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    
                    // Kullanıcı bilgilerini al
                    const userResponse = await fetch(`${API_BASE_URL}/api/user-results?code=${selectedUser.code}`, {
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      }
                    });
                    const userData = await userResponse.json();
                    
                    if (!userData.success || !userData.results || userData.results.length === 0) {
                      throw new Error('Kullanıcı bilgileri alınamadı');
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
                    alert('PDF indirilirken bir hata oluştu: ' + error.message);
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
                PDF İndir
              </button>
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
                Oyun Cevapları
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
                  Oyun Bilgileri
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  fontSize: '14px'
                }}>
                  <div><strong>Kod:</strong> {selectedUser.code}</div>
                  <div><strong>Ad Soyad:</strong> {selectedUser.name}</div>
                  <div><strong>Email:</strong> {selectedUser.email}</div>
                  <div><strong>Durum:</strong> {selectedUser.status}</div>
                  {selectedUser.reportId && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>Rapor ID:</strong> {selectedUser.reportId}
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
                        Soru {index + 1} {answer.questionId ? `(${answer.questionId})` : ''}
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
                            Seçilen Cevap 1:
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
                            Seçilen Cevap 2:
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
                            Alt Kategori:
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
                            Gezegen:
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
                  Bu oyun için cevap bulunamadı.
                </div>
              )}
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
                PDF Önizleme
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
                title="PDF Önizleme"
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
                Sonucu Sil
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
                Bu sonucu silmek istediğinizden emin misiniz?
              </p>
              <p style={{ fontSize: '12px', color: '#DC2626', fontWeight: 500 }}>
                Bu işlem geri alınamaz ve sonuç kalıcı olarak silinecektir.
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
                Hayır
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
                Evet, Sil
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
      `}</style>
    </div>
  );
};

export default AdminPanel;