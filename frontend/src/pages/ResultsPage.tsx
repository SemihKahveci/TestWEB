import React, { useState, useEffect, useRef } from 'react';
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
  const [results, setResults] = useState<UserResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<UserResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Popup states
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
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
  const [isMobile, setIsMobile] = useState(false);
  
  const hasLoaded = useRef(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/user-results`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.results) {
        // Sadece "Tamamlandı" olan sonuçları filtrele
        const completedResults = data.results.filter((result: any) => result.status === 'Tamamlandı');
        
        // HTML'deki gibi gruplama uygula
        const groupedResults = groupByEmail(completedResults);
        setResults(groupedResults);
        setFilteredResults(groupedResults);
      } else {
        console.error('❌ API başarısız:', data.message);
        setResults([]);
        setFilteredResults([]);
      }
    } catch (error) {
      console.error('❌ Results veri yükleme hatası:', error);
      setResults([]);
      setFilteredResults([]);
    } finally {
      setIsLoading(false);
    }
  };

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
  }, [results, searchTerm]);


  const filterResults = () => {
    let filtered = results;

    // HTML'deki gibi sadece isim ile arama
    if (searchTerm) {
      filtered = filtered.filter(result =>
        result.name && result.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredResults(filtered);
    setCurrentPage(1);
  };

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

  // Filtreleme fonksiyonu
  const applyFilters = () => {
    try {

      // Tarih kontrolü
      if (filters.startDate && filters.endDate) {
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        if (startDate > endDate) {
          setErrorMessage('Başlangıç tarihi bitiş tarihinden sonra olamaz!');
          setShowErrorPopup(true);
          return;
        }
      }

      // Minimum ve maksimum değer kontrolü
      const customerFocusMin = typeof filters.customerFocusMin === 'string' ? 5 : filters.customerFocusMin;
      const customerFocusMax = typeof filters.customerFocusMax === 'string' ? 95 : filters.customerFocusMax;
      if (customerFocusMin >= customerFocusMax) {
        setErrorMessage('Müşteri Odaklılık Skoru: Minimum değer maksimum değerden küçük olmalıdır!');
        setShowErrorPopup(true);
        return;
      }
      
      const uncertaintyMin = typeof filters.uncertaintyMin === 'string' ? 5 : filters.uncertaintyMin;
      const uncertaintyMax = typeof filters.uncertaintyMax === 'string' ? 95 : filters.uncertaintyMax;
      if (uncertaintyMin >= uncertaintyMax) {
        setErrorMessage('Belirsizlik Yönetimi Skoru: Minimum değer maksimum değerden küçük olmalıdır!');
        setShowErrorPopup(true);
        return;
      }
      
      const ieMin = typeof filters.ieMin === 'string' ? 5 : filters.ieMin;
      const ieMax = typeof filters.ieMax === 'string' ? 95 : filters.ieMax;
      if (ieMin >= ieMax) {
        setErrorMessage('İnsanları Etkileme Skoru: Minimum değer maksimum değerden küçük olmalıdır!');
        setShowErrorPopup(true);
        return;
      }
      
      const idikMin = typeof filters.idikMin === 'string' ? 5 : filters.idikMin;
      const idikMax = typeof filters.idikMax === 'string' ? 95 : filters.idikMax;
      if (idikMin >= idikMax) {
        setErrorMessage('Güven Veren İşbirliği ve Sinerji Skoru: Minimum değer maksimum değerden küçük olmalıdır!');
        setShowErrorPopup(true);
        return;
      }

      const filteredItems = results.filter(item => {
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
            if (filters.startDate) {
              const startDate = new Date(filters.startDate);
              dateMatch = dateMatch && completionDate >= startDate;
            }
            if (filters.endDate) {
              const endDate = new Date(filters.endDate);
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

      // Filtrelenmiş verileri gruplandır
      const groupedData = groupByEmail(filteredItems);
      setFilteredResults(groupedData);
      setCurrentPage(1);

      setShowFilterPopup(false);
    } catch (error) {
      console.error('Filtreleme hatası:', error);
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
    setFilteredResults(results);
    setCurrentPage(1);
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


  const handleDownloadExcel = () => {
    try {
      // Skor değerini formatla - 0 ise "-" göster
      const formatScoreForExcel = (score: number | string) => {
        if (score === null || score === undefined || score === '-' || score === 0 || score === '0') return '-';
        return typeof score === 'number' ? score.toFixed(1) : score;
      };

      // Filtrelenmiş sonuçları al (sadece tamamlanmış oyunlar)
      let dataToExport = filteredResults
        .filter(item => item.status === 'Tamamlandı')
        .map(item => ({
          'Ad Soyad': item.name || '-',
          'E-posta': item.email || '-',
          'Tamamlanma Tarihi': formatDate(item.completionDate) || '-',
          'Müşteri Odaklılık Skoru': formatScoreForExcel(item.customerFocusScore),
          'Belirsizlik Yönetimi Skoru': formatScoreForExcel(item.uncertaintyScore),
          'İnsanları Etkileme Skoru': formatScoreForExcel(item.ieScore),
          'Güven Veren İşbirliği ve Sinerji Skoru': formatScoreForExcel(item.idikScore)
        }));

      if (dataToExport.length === 0) {
        setErrorMessage('İndirilecek veri bulunamadı.');
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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Kişi Skorları');

      // Dosya adını oluştur
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `Andron_Yetkinlik_Sonuçları_${dateStr}_${timeStr}.xlsx`;

      // Excel dosyasını indir
      XLSX.writeFile(workbook, fileName);

    } catch (error) {
      console.error('Excel indirme hatası:', error);
      setErrorMessage('Excel dosyası indirilirken bir hata oluştu!');
      setShowErrorPopup(true);
    }
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
            Kişi Skorları Sayfası
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
            placeholder="Kişi adına göre akıllı arama yapın..."
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
          gap: '12px'
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
            Filtrele
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
            Excel İndir
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
                }}>Tamamlanma Tarihi</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#232D42',
                  fontFamily: 'Inter',
                  borderRight: '1px solid #E9ECEF'
                }}>Müşteri Odaklılık Skoru</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#232D42',
                  fontFamily: 'Inter',
                  borderRight: '1px solid #E9ECEF'
                }}>Belirsizlik Yönetimi Skoru</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#232D42',
                  fontFamily: 'Inter',
                  borderRight: '1px solid #E9ECEF'
                }}>İnsanları Etkileme Skoru</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#232D42',
                  fontFamily: 'Inter'
                }}>Güven Veren İşbirliği ve Sinerji Skoru</th>
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
                      {result.isGrouped && result.groupCount && result.groupCount > 1 && (
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
                      )}
                      {result.name}
                      {result.isGrouped && result.groupCount && result.groupCount > 1 && (
                        <span style={{
                          color: '#666',
                          fontSize: '12px',
                          marginLeft: '8px'
                        }}>
                          ({result.groupCount} sonuç)
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
                  
                  {/* Alt satırlar (gruplandırılmış ise) */}
                  {result.isGrouped && result.groupCount && result.groupCount > 1 && result.allGroupItems && expandedGroups.has(result.email) && 
                    result.allGroupItems.slice(1).map((groupItem, subIndex) => (
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
                          textAlign: 'left',
                          borderRight: '1px solid #E9ECEF'
                        }}>
                          {groupItem.name}
                        </td>
                        <td style={{
                          padding: '16px',
                          fontSize: '14px',
                          color: '#8A92A6',
                          fontFamily: 'Inter',
                          textAlign: 'center',
                          borderRight: '1px solid #E9ECEF'
                        }}>
                          {formatDate(groupItem.completionDate)}
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
                            backgroundColor: getScoreColorClass(groupItem.customerFocusScore) === 'red' ? '#FF0000' : 
                                           getScoreColorClass(groupItem.customerFocusScore) === 'yellow' ? '#FFD700' : 
                                           getScoreColorClass(groupItem.customerFocusScore) === 'green' ? '#00FF00' : 'transparent',
                            color: getScoreColorClass(groupItem.customerFocusScore) === 'red' ? '#FFF' : 
                                   getScoreColorClass(groupItem.customerFocusScore) === 'yellow' ? '#000' : 
                                   getScoreColorClass(groupItem.customerFocusScore) === 'green' ? '#000' : '#8A92A6'
                          }}>
                            {formatScore(groupItem.customerFocusScore)}
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
                            backgroundColor: getScoreColorClass(groupItem.uncertaintyScore) === 'red' ? '#FF0000' : 
                                           getScoreColorClass(groupItem.uncertaintyScore) === 'yellow' ? '#FFD700' : 
                                           getScoreColorClass(groupItem.uncertaintyScore) === 'green' ? '#00FF00' : 'transparent',
                            color: getScoreColorClass(groupItem.uncertaintyScore) === 'red' ? '#FFF' : 
                                   getScoreColorClass(groupItem.uncertaintyScore) === 'yellow' ? '#000' : 
                                   getScoreColorClass(groupItem.uncertaintyScore) === 'green' ? '#000' : '#8A92A6'
                          }}>
                            {formatScore(groupItem.uncertaintyScore)}
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
                            backgroundColor: getScoreColorClass(groupItem.ieScore) === 'red' ? '#FF0000' : 
                                           getScoreColorClass(groupItem.ieScore) === 'yellow' ? '#FFD700' : 
                                           getScoreColorClass(groupItem.ieScore) === 'green' ? '#00FF00' : 'transparent',
                            color: getScoreColorClass(groupItem.ieScore) === 'red' ? '#FFF' : 
                                   getScoreColorClass(groupItem.ieScore) === 'yellow' ? '#000' : 
                                   getScoreColorClass(groupItem.ieScore) === 'green' ? '#000' : '#8A92A6'
                          }}>
                            {formatScore(groupItem.ieScore)}
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
                            backgroundColor: getScoreColorClass(groupItem.idikScore) === 'red' ? '#FF0000' : 
                                           getScoreColorClass(groupItem.idikScore) === 'yellow' ? '#FFD700' : 
                                           getScoreColorClass(groupItem.idikScore) === 'green' ? '#00FF00' : 'transparent',
                            color: getScoreColorClass(groupItem.idikScore) === 'red' ? '#FFF' : 
                                   getScoreColorClass(groupItem.idikScore) === 'yellow' ? '#000' : 
                                   getScoreColorClass(groupItem.idikScore) === 'green' ? '#000' : '#8A92A6'
                          }}>
                            {formatScore(groupItem.idikScore)}
                          </span>
                        </td>
                      </tr>
                    ))
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
                  Tamamlanma Tarihi
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Başlangıç Tarihi</span>
                    <input
                      type="date"
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
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Bitiş Tarihi</span>
                    <input
                      type="date"
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
                  Müşteri Odaklılık Skoru
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Minimum</span>
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
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Maksimum</span>
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
                  Belirsizlik Yönetimi Skoru
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Minimum</span>
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
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Maksimum</span>
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
                  IE Skoru
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Minimum</span>
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
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Maksimum</span>
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
                  IDIK Skoru
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Minimum</span>
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
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Maksimum</span>
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
                İptal
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
                Filtreleri Temizle
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
                Uygula
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
                  Filtre Hatası
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