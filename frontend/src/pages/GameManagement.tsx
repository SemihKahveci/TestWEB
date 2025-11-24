import React, { useState, useEffect } from 'react';
import { companyAPI } from '../services/api';

interface Game {
  _id: string;
  firmName: string;
  invoiceNo: string;
  credit: number;
  date: string;
  invoiceFile?: {
    fileName: string;
    fileType: string;
    fileData: string;
  };
}

interface Company {
  _id: string;
  firmName: string;
}

const GameManagement: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showInvoicePopup, setShowInvoicePopup] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  
  // Error popup states
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    firmName: '',
    companyId: '',
    invoiceNo: '',
    credit: '',
    invoiceFile: null as File | null
  });

  // Error popup function
  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorPopup(true);
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
    loadGames();
    loadCompanies();
  }, []);

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCompanyDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-company-dropdown]')) {
          setShowCompanyDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCompanyDropdown]);

  const loadGames = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/game-management/games');
      if (!response.ok) throw new Error('Veriler yüklenemedi');
      
      const data = await response.json();
      setGames(data.games || []);
    } catch (error) {
      console.error('💥 Oyunlar yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await companyAPI.getAll();
      if (response.data.success) {
        const companies = response.data.companies || [];
        // Alfabetik sıralama
        const sortedCompanies = companies.sort((a: Company, b: Company) => 
          a.firmName.localeCompare(b.firmName, 'tr')
        );
        setCompanies(sortedCompanies);
        setFilteredCompanies(sortedCompanies);
      }
    } catch (error) {
      console.error('Firmalar yüklenirken hata:', error);
    }
  };

  // Firma arama fonksiyonu
  const handleCompanySearch = (searchTerm: string) => {
    setCompanySearchTerm(searchTerm);
    if (searchTerm.trim() === '') {
      setFilteredCompanies(companies);
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
      
      const filtered = companies.filter(company => {
        const nameNormalized = normalizeText(company.firmName);
        return nameNormalized.includes(searchNormalized);
      });
      
      setFilteredCompanies(filtered);
    }
  };

  // Firma seçme fonksiyonu
  const handleCompanySelect = (company: Company) => {
    setFormData({ ...formData, firmName: company.firmName, companyId: company._id });
    setCompanySearchTerm(company.firmName);
    setShowCompanyDropdown(false);
    setFilteredCompanies(companies); // Reset filter
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

  const handleAddGame = () => {
    setFormData({ firmName: '', companyId: '', invoiceNo: '', credit: '', invoiceFile: null });
    setCompanySearchTerm('');
    setShowCompanyDropdown(false);
    setFilteredCompanies(companies);
    setShowAddPopup(true);
  };

  const handleEditGame = async (game: Game) => {
    try {
      setIsLoadingEdit(true);
      const response = await fetch(`/api/game-management/games/${game._id}`);
      if (!response.ok) throw new Error('Oyun verileri alınamadı');
      
      const gameData = await response.json();
      
      setSelectedGame(gameData.game);
      setFormData({
        firmName: gameData.game.firmName || '',
        companyId: gameData.game.companyId || '',
        invoiceNo: gameData.game.invoiceNo || '',
        credit: gameData.game.credit?.toString() || '',
        invoiceFile: null
      });
      setShowEditPopup(true);
    } catch (error) {
      console.error('💥 Oyun detayları yüklenirken hata:', error);
    } finally {
      setIsLoadingEdit(false);
    }
  };

  const handleDeleteGame = (game: Game) => {
    setSelectedGame(game);
    setShowDeletePopup(true);
  };

  const handleViewInvoice = async (game: Game) => {
    try {
      setIsLoadingInvoice(true);
      
      // API'den oyun verilerini ID'ye göre al
      const response = await fetch(`/api/game-management/games/${game._id}`);
      if (!response.ok) {
        throw new Error('Oyun verileri alınamadı');
      }
      
      const gameData = await response.json();
      
      if (!gameData.game.invoiceFile) {
        showError('Bu oyun için fatura dosyası bulunamadı!');
        return;
      }
      
      // Güncellenmiş oyun verilerini kullan
      const updatedGame = {
        ...game,
        invoiceFile: gameData.game.invoiceFile
      };
      
      setSelectedGame(updatedGame);
      setShowInvoicePopup(true);
      
    } catch (error: any) {
      console.error('💥 Fatura görüntüleme hatası:', error);
      showError(error.message || 'Fatura görüntülenirken bir hata oluştu');
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData({ ...formData, invoiceFile: file });
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmitAdd = async () => {
    try {
      // Form validation
      if (!formData.firmName.trim()) {
        showError('Firma adı zorunludur!');
        return;
      }
      if (!formData.invoiceNo.trim()) {
        showError('Fatura numarası zorunludur!');
        return;
      }
      if (!formData.credit || Number(formData.credit) <= 0) {
        showError('Geçerli bir kredi miktarı giriniz!');
        return;
      }
      
      let invoiceFileData: { fileName: string; fileType: string; fileData: string } | null = null;
      if (formData.invoiceFile) {
        const fileData = await convertFileToBase64(formData.invoiceFile);
        invoiceFileData = {
          fileName: formData.invoiceFile.name,
          fileType: formData.invoiceFile.type,
          fileData: fileData
        };
      }

      const response = await fetch('/api/game-management/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firmName: formData.firmName,
          companyId: formData.companyId,
          invoiceNo: formData.invoiceNo,
          credit: Number(formData.credit),
          invoiceFile: invoiceFileData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Oyun eklenemedi');
      }

      const responseData = await response.json();
      
      // Başarı mesajı göster - popup ile
      setShowAddPopup(false);
      setShowSuccessPopup(true);
      setSuccessMessage('Oyun başarıyla eklendi!');
      
      loadGames();
    } catch (error: any) {
      console.error('💥 Oyun ekleme hatası:', error);
      showError(error.message || 'Oyun eklenirken bir hata oluştu');
    }
  };

  const handleSubmitEdit = async () => {
    try {
      if (!selectedGame) return;
      
      // Form validation
      if (!formData.invoiceNo.trim()) {
        showError('Fatura numarası zorunludur!');
        return;
      }
      if (!formData.credit || Number(formData.credit) <= 0) {
        showError('Geçerli bir kredi miktarı giriniz!');
        return;
      }
      
      const updateData: any = {
        firmName: formData.firmName,
        companyId: formData.companyId,
        invoiceNo: formData.invoiceNo,
        credit: Number(formData.credit)
      };

      if (formData.invoiceFile) {
        const fileData = await convertFileToBase64(formData.invoiceFile);
        updateData.invoiceFile = {
          fileName: formData.invoiceFile.name,
          fileType: formData.invoiceFile.type,
          fileData: fileData
        };
      }

      const response = await fetch(`/api/game-management/games/${selectedGame._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Oyun güncellenemedi');
      }

      const responseData = await response.json();
      
      // Başarı mesajı göster - popup ile
      setShowEditPopup(false);
      setShowSuccessPopup(true);
      setSuccessMessage('Oyun başarıyla güncellendi!');
      
      loadGames();
    } catch (error: any) {
      console.error('💥 Oyun güncelleme hatası:', error);
      showError(error.message || 'Oyun güncellenirken bir hata oluştu');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (!selectedGame) return;
      
      const response = await fetch(`/api/game-management/games/${selectedGame._id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Silme işlemi başarısız');
      }

      const responseData = await response.json();
      
      // Başarı mesajı göster - popup ile
      setShowDeletePopup(false);
      setShowSuccessPopup(true);
      setSuccessMessage('Oyun başarıyla silindi!');
      
      loadGames();
    } catch (error: any) {
      console.error('💥 Oyun silme hatası:', error);
      showError(error.message || 'Oyun silinirken bir hata oluştu');
    }
  };

  const filteredGames = games.filter(game =>
    game.firmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())
  );


  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'Inter'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3B82F6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{
          marginTop: '16px',
          color: '#6B7280',
          fontSize: '16px',
          fontFamily: 'Inter'
        }}>
          Veriler yükleniyor...
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
                  Andron Game
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
            Oyun Tanımlama
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
        {/* Content Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
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
                placeholder="Firma adı ve fatura no'da akıllı arama yapın..."
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
          </div>
          <button
            onClick={handleAddGame}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'Inter',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563EB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3B82F6';
            }}
          >
            <i className="fas fa-plus"></i>
            Ekle
          </button>
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
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
            gap: 0
          }}>
            {/* Table Headers */}
            <div style={{
              padding: '16px',
              background: '#F8F9FA',
              textAlign: 'center',
              color: '#232D42',
              fontSize: '14px',
              fontFamily: 'Montserrat',
              fontWeight: 700,
              borderBottom: '1px solid #E9ECEF'
            }}>
              Firma Adı
            </div>
            <div style={{
              padding: '16px',
              background: '#F8F9FA',
              textAlign: 'center',
              color: '#232D42',
              fontSize: '14px',
              fontFamily: 'Montserrat',
              fontWeight: 700,
              borderBottom: '1px solid #E9ECEF'
            }}>
              Fatura No
            </div>
            <div style={{
              padding: '16px',
              background: '#F8F9FA',
              textAlign: 'center',
              color: '#232D42',
              fontSize: '14px',
              fontFamily: 'Montserrat',
              fontWeight: 700,
              borderBottom: '1px solid #E9ECEF'
            }}>
              Kredi
            </div>
            <div style={{
              padding: '16px',
              background: '#F8F9FA',
              textAlign: 'center',
              color: '#232D42',
              fontSize: '14px',
              fontFamily: 'Montserrat',
              fontWeight: 700,
              borderBottom: '1px solid #E9ECEF'
            }}>
              Tarih
            </div>
            <div style={{
              padding: '16px',
              background: '#F8F9FA',
              textAlign: 'center',
              color: '#232D42',
              fontSize: '14px',
              fontFamily: 'Montserrat',
              fontWeight: 700,
              borderBottom: '1px solid #E9ECEF'
            }}>
              İşlemler
            </div>

            {/* Table Rows */}
            {filteredGames.map((game) => (
              <React.Fragment key={game._id}>
                <div style={{
                  padding: '16px',
                  color: '#232D42',
                  fontSize: '14px',
                  fontFamily: 'Montserrat',
                  fontWeight: 500,
                  borderBottom: '1px solid #E9ECEF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {game.firmName}
                </div>
                <div style={{
                  padding: '16px',
                  color: '#232D42',
                  fontSize: '14px',
                  fontFamily: 'Montserrat',
                  fontWeight: 500,
                  borderBottom: '1px solid #E9ECEF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {game.invoiceNo}
                </div>
                <div style={{
                  padding: '16px',
                  color: '#232D42',
                  fontSize: '14px',
                  fontFamily: 'Montserrat',
                  fontWeight: 500,
                  borderBottom: '1px solid #E9ECEF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {game.credit}
                </div>
                <div style={{
                  padding: '16px',
                  color: '#232D42',
                  fontSize: '14px',
                  fontFamily: 'Montserrat',
                  fontWeight: 500,
                  borderBottom: '1px solid #E9ECEF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {new Date(game.date).toLocaleDateString('tr-TR')}
                </div>
                <div style={{
                  padding: '16px',
                  borderBottom: '1px solid #E9ECEF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}>
                  <button
                    onClick={() => handleEditGame(game)}
                    disabled={isLoadingEdit}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: isLoadingEdit ? 'not-allowed' : 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s',
                      opacity: isLoadingEdit ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoadingEdit) {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    title={isLoadingEdit ? "Yükleniyor..." : "Düzenle"}
                  >
                    <i className="fas fa-edit" style={{ color: '#3B82F6', fontSize: '16px' }}></i>
                  </button>
                  <button
                    onClick={() => handleViewInvoice(game)}
                    disabled={isLoadingInvoice}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: isLoadingInvoice ? 'not-allowed' : 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s',
                      opacity: isLoadingInvoice ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoadingInvoice) {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    title={isLoadingInvoice ? "Yükleniyor..." : "Faturayı Görüntüle"}
                  >
                    <i className="fas fa-eye" style={{ color: '#0286F7', fontSize: '16px' }}></i>
                  </button>
                  <button
                    onClick={() => handleDeleteGame(game)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F3F4F6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    title="Sil"
                  >
                    <i className="fas fa-trash" style={{ color: '#EF4444', fontSize: '16px' }}></i>
                  </button>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Add Game Popup */}
      {showAddPopup && (
        <>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
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
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowAddPopup(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px',
                color: '#6B7280'
              }}
            >
              ×
            </button>
            <h3 style={{
              margin: '0 0 20px 0',
              color: '#232D42',
              fontFamily: 'Inter',
              fontSize: '24px',
              fontWeight: 600
            }}>
              Oyun Ekle
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#232D42',
                  fontWeight: 500,
                  fontFamily: 'Inter',
                  fontSize: '14px'
                }}>
                  Firma Adı *
                </label>
                <div style={{ position: 'relative' }} data-company-dropdown>
                  {/* Custom Dropdown */}
                  <div
                    onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                    style={{
                      padding: '12px 16px',
                      border: '1px solid #D1D5DB',
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
                    <span style={{ color: companySearchTerm ? '#232D42' : '#8A92A6' }}>
                      {companySearchTerm || `Firma seçin (${companies.length} firma mevcut)`}
                    </span>
                    <i 
                      className={`fas fa-chevron-${showCompanyDropdown ? 'up' : 'down'}`}
                      style={{ 
                        color: '#8A92A6',
                        fontSize: '12px',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                  </div>
                  {/* Dropdown Menu */}
                  {showCompanyDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D1D5DB',
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
                          placeholder="Firma ara..."
                          value={companySearchTerm}
                          onChange={(e) => {
                            handleCompanySearch(e.target.value);
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
                        {companySearchTerm && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCompanySearchTerm('');
                              handleCompanySearch('');
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
                        {filteredCompanies.length > 0 ? (
                          filteredCompanies.map((company) => (
                            <div
                              key={company._id}
                              onClick={() => handleCompanySelect(company)}
                              style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontFamily: 'Inter',
                                color: '#232D42',
                                borderBottom: '1px solid #F1F3F4',
                                transition: 'background-color 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#F8F9FA';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              {highlightText(company.firmName, companySearchTerm)}
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
                            {companySearchTerm ? `"${companySearchTerm}" için arama sonucu bulunamadı` : 'Firma bulunamadı'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#232D42',
                  fontWeight: 500,
                  fontFamily: 'Inter',
                  fontSize: '14px'
                }}>
                  Fatura No *
                </label>
                <input
                  type="text"
                  value={formData.invoiceNo}
                  onChange={(e) => setFormData({...formData, invoiceNo: e.target.value})}
                  placeholder="Fatura numarasını giriniz"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'Inter',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#232D42',
                  fontWeight: 500,
                  fontFamily: 'Inter',
                  fontSize: '14px'
                }}>
                  Kredi *
                </label>
                <input
                  type="number"
                  value={formData.credit}
                  onChange={(e) => setFormData({...formData, credit: e.target.value})}
                  placeholder="Kredi miktarını giriniz"
                  required
                  min="1"
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'Inter',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#232D42',
                  fontWeight: 500,
                  fontFamily: 'Inter',
                  fontSize: '14px'
                }}>
                  Fatura Yükle
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'Inter',
                    outline: 'none'
                  }}
                />
                {formData.invoiceFile && (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#6B7280',
                    fontFamily: 'Inter'
                  }}>
                    Seçilen dosya: {formData.invoiceFile.name}
                  </div>
                )}
              </div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '30px'
            }}>
              <button
                onClick={() => setShowAddPopup(false)}
                style={{
                  padding: '12px 24px',
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
                onClick={handleSubmitAdd}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#3B82F6',
                  color: 'white',
                  fontFamily: 'Inter',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fas fa-save"></i>
                Kaydet
              </button>
            </div>
          </div>
          </div>
        </>
      )}

      {/* Edit Game Popup */}
      {showEditPopup && (
        <>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
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
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowEditPopup(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px',
                color: '#6B7280'
              }}
            >
              ×
            </button>
            <h3 style={{
              margin: '0 0 20px 0',
              color: '#232D42',
              fontFamily: 'Inter',
              fontSize: '24px',
              fontWeight: 600
            }}>
              Oyun Düzenle
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#232D42',
                  fontWeight: 500,
                  fontFamily: 'Inter',
                  fontSize: '14px'
                }}>
                  Firma Adı *
                </label>
                <input
                  type="text"
                  value={formData.firmName}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'Inter',
                    outline: 'none',
                    backgroundColor: '#F9FAFB',
                    color: '#6B7280'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#232D42',
                  fontWeight: 500,
                  fontFamily: 'Inter',
                  fontSize: '14px'
                }}>
                  Fatura No *
                </label>
                <input
                  type="text"
                  value={formData.invoiceNo}
                  onChange={(e) => setFormData({...formData, invoiceNo: e.target.value})}
                  placeholder="Fatura numarasını giriniz"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'Inter',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#232D42',
                  fontWeight: 500,
                  fontFamily: 'Inter',
                  fontSize: '14px'
                }}>
                  Kredi *
                </label>
                <input
                  type="number"
                  value={formData.credit}
                  onChange={(e) => setFormData({...formData, credit: e.target.value})}
                  placeholder="Kredi miktarını giriniz"
                  required
                  min="1"
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'Inter',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#232D42',
                  fontWeight: 500,
                  fontFamily: 'Inter',
                  fontSize: '14px'
                }}>
                  Fatura Yükle (Opsiyonel)
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'Inter',
                    outline: 'none'
                  }}
                />
                {formData.invoiceFile && (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#6B7280',
                    fontFamily: 'Inter'
                  }}>
                    Seçilen dosya: {formData.invoiceFile.name}
                  </div>
                )}
                {selectedGame?.invoiceFile && !formData.invoiceFile && (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#6B7280',
                    fontFamily: 'Inter',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>Mevcut dosya: {selectedGame.invoiceFile.fileName}</span>
                    <button
                      type="button"
                      onClick={() => handleViewInvoice(selectedGame)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#0286F7',
                        fontSize: '12px',
                        textDecoration: 'underline'
                      }}
                    >
                      Görüntüle
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '30px'
            }}>
              <button
                onClick={() => setShowEditPopup(false)}
                style={{
                  padding: '12px 24px',
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
                onClick={handleSubmitEdit}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#3B82F6',
                  color: 'white',
                  fontFamily: 'Inter',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fas fa-save"></i>
                Güncelle
              </button>
            </div>
          </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
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
            width: '90%'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              color: '#232D42',
              fontFamily: 'Inter',
              fontSize: '24px',
              fontWeight: 600
            }}>
              Oyun Sil
            </h3>
            <div style={{
              marginBottom: '20px'
            }}>
              <p style={{
                color: '#232D42',
                fontSize: '16px',
                marginBottom: '10px',
                fontFamily: 'Inter'
              }}>
                Bu oyunu silmek istediğinizden emin misiniz?
              </p>
              <p style={{
                color: '#dc3545',
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: 'Inter'
              }}>
                Bu işlem geri alınamaz!
              </p>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowDeletePopup(false)}
                style={{
                  padding: '12px 24px',
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
                onClick={handleConfirmDelete}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#EF4444',
                  color: 'white',
                  fontFamily: 'Inter',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Sil
              </button>
            </div>
          </div>
          </div>
        </>
      )}

      {/* Invoice Preview Popup */}
      {showInvoicePopup && selectedGame?.invoiceFile && (
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
          zIndex: 2000
        }}>
          <div style={{
            width: '90%',
            maxWidth: '800px',
            height: '90%',
            background: 'white',
            borderRadius: '15px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #E9ECEF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                color: '#232D42',
                fontSize: '18px',
                fontWeight: 700,
                fontFamily: 'Montserrat'
              }}>
                Fatura Görüntüle
              </div>
              <button
                onClick={() => setShowInvoicePopup(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '24px',
                  color: '#8A92A6',
                  padding: '5px'
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              flex: 1,
              padding: '20px',
              overflow: 'auto'
            }}>
              {selectedGame.invoiceFile.fileType === 'application/pdf' ? (
                <iframe
                  src={selectedGame.invoiceFile.fileData}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                  title="Fatura PDF"
                />
              ) : (
                <img
                  src={selectedGame.invoiceFile.fileData}
                  alt="Fatura"
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px'
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Loading Overlay for Edit */}
      {isLoadingEdit && (
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
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
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
              color: '#374151',
              fontSize: '16px',
              fontWeight: 500,
              fontFamily: 'Inter'
            }}>
              Oyun detayları yükleniyor...
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay for Invoice */}
      {isLoadingInvoice && (
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
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #E5E7EB',
              borderTop: '4px solid #0286F7',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <div style={{
              color: '#374151',
              fontSize: '16px',
              fontWeight: 500,
              fontFamily: 'Inter'
            }}>
              Fatura yükleniyor...
            </div>
          </div>
        </div>
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
                lineHeight: '1.5'
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
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            {/* Error Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#FEE2E2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '32px',
              color: '#DC2626'
            }}>
              ⚠️
            </div>
            
            {/* Error Title */}
            <h3 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#1F2937',
              margin: '0 0 16px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Hata
            </h3>
            
            {/* Error Message */}
            <p style={{
              fontSize: '16px',
              color: '#6B7280',
              margin: '0 0 32px',
              lineHeight: '1.5',
              fontFamily: 'Inter, sans-serif'
            }}>
              {errorMessage}
            </p>
            
            {/* Close Button */}
            <button
              onClick={() => setShowErrorPopup(false)}
              style={{
                backgroundColor: '#DC2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#B91C1C'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default GameManagement;
