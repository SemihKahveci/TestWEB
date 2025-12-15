import React, { useState, useEffect } from 'react';
import { companyAPI } from '../services/api';

interface Admin {
  _id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  isActive: boolean;
}

const DefineCompanyAdmin: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModal, setMessageModal] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info'
  });
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    companyId: '',
    password: ''
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
    loadAdmins();
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

  const loadAdmins = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/list', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        // Super admin'i listeden filtrele
        const filteredAdmins = data.admins.filter((admin: Admin) => admin.role !== 'superadmin');
        setAdmins(filteredAdmins);
      } else {
        console.error('❌ API hatası:', data.message);
      }
    } catch (error) {
      console.error('💥 Adminler yüklenirken hata:', error);
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
        const sortedCompanies = companies.sort((a: any, b: any) => 
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
      
      const filtered = companies.filter((company: any) => {
        const nameNormalized = normalizeText(company.firmName);
        return nameNormalized.includes(searchNormalized);
      });
      
      setFilteredCompanies(filtered);
    }
  };

  // Firma seçme fonksiyonu
  const handleCompanySelect = (company: any) => {
    setFormData({ ...formData, company: company.firmName, companyId: company._id });
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

  const handleAddAdmin = () => {
    setFormData({ name: '', email: '', company: '', companyId: '', password: '' });
    setCompanySearchTerm('');
    setShowCompanyDropdown(false);
    setFilteredCompanies(companies);
    setShowAddPopup(true);
  };

  const handleEditAdmin = async (admin: Admin) => {
    try {
      const response = await fetch(`/api/admin/${admin._id}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setSelectedAdmin(data.admin);
        setFormData({
          name: data.admin.name || '',
          email: data.admin.email || '',
          company: data.admin.company || '',
          companyId: data.admin.companyId || '',
          password: ''
        });
        setShowEditPopup(true);
      }
    } catch (error) {
      console.error('Admin detayları yüklenirken hata:', error);
    }
  };

  const handleDeleteAdmin = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowDeletePopup(true);
  };

  // Modal functions
  const showMessage = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setMessageModal({ title, message, type });
    setShowMessageModal(true);
  };

  const closeMessageModal = () => {
    setShowMessageModal(false);
  };

  const handleSubmitAdd = async () => {
    try {
      const response = await fetch('/api/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          companyId: formData.companyId,
          password: formData.password,
          role: 'admin'
        })
      });
      const data = await response.json();
      if (data.success) {
        setShowAddPopup(false);
        loadAdmins();
      } else {
        console.error('❌ Admin ekleme hatası:', data.message);
        showMessage('Hata', data.message, 'error');
      }
    } catch (error: any) {
      console.error('💥 Admin ekleme hatası:', error);
      const errorMessage = error.response?.data?.message || 'Admin eklenirken bir hata oluştu';
      showMessage('Hata', errorMessage, 'error');
    }
  };

  const handleSubmitEdit = async () => {
    try {
      if (!selectedAdmin) return;
      
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        company: formData.company,
        companyId: formData.companyId
      };
      
      // Şifre varsa ekle
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/admin/${selectedAdmin._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });
      const data = await response.json();
      if (data.success) {
        setShowEditPopup(false);
        loadAdmins();
      } else {
        console.error('❌ Admin güncelleme hatası:', data.message);
        showMessage('Hata', data.message, 'error');
      }
    } catch (error: any) {
      console.error('💥 Admin güncelleme hatası:', error);
      const errorMessage = error.response?.data?.message || 'Admin güncellenirken bir hata oluştu';
      showMessage('Hata', errorMessage, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (!selectedAdmin) return;
      const response = await fetch(`/api/admin/${selectedAdmin._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setShowDeletePopup(false);
        loadAdmins();
      } else {
        console.error('❌ Admin silme hatası:', data.message);
        showMessage('Hata', data.message, 'error');
      }
    } catch (error: any) {
      console.error('💥 Admin silme hatası:', error);
      const errorMessage = error.response?.data?.message || 'Admin silinirken bir hata oluştu';
      showMessage('Hata', errorMessage, 'error');
    }
  };


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
            Firma Admini Tanımlama
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
          <div></div>
          <button
            onClick={handleAddAdmin}
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
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: isMobile ? '400px' : '600px'
            }}>
            <thead>
              <tr style={{
                background: '#F8F9FA'
              }}>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontFamily: 'Montserrat',
                  fontWeight: 700,
                  borderBottom: '1px solid #E9ECEF'
                }}>
                  Ad Soyad
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontFamily: 'Montserrat',
                  fontWeight: 700,
                  borderBottom: '1px solid #E9ECEF'
                }}>
                  Firma
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontFamily: 'Montserrat',
                  fontWeight: 700,
                  borderBottom: '1px solid #E9ECEF'
                }}>
                  E-posta
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontFamily: 'Montserrat',
                  fontWeight: 700,
                  borderBottom: '1px solid #E9ECEF'
                }}>
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin._id} style={{
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(2, 134, 247, 0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}>
                  <td style={{
                    padding: '16px',
                    color: '#232D42',
                    fontSize: '14px',
                    fontFamily: 'Montserrat',
                    fontWeight: 500,
                    borderBottom: '1px solid #E9ECEF'
                  }}>
                    {admin.name}
                  </td>
                  <td style={{
                    padding: '16px',
                    color: '#232D42',
                    fontSize: '14px',
                    fontFamily: 'Montserrat',
                    fontWeight: 500,
                    borderBottom: '1px solid #E9ECEF'
                  }}>
                    {admin.company}
                  </td>
                  <td style={{
                    padding: '16px',
                    color: '#232D42',
                    fontSize: '14px',
                    fontFamily: 'Montserrat',
                    fontWeight: 500,
                    borderBottom: '1px solid #E9ECEF'
                  }}>
                    {admin.email}
                  </td>
                  <td style={{
                    padding: '16px',
                    borderBottom: '1px solid #E9ECEF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <button
                      onClick={() => handleEditAdmin(admin)}
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
                    >
                      <i className="fas fa-edit" style={{ color: '#3B82F6', fontSize: '16px' }}></i>
                    </button>
                    <button
                      onClick={() => handleDeleteAdmin(admin)}
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
                    >
                      <i className="fas fa-trash" style={{ color: '#EF4444', fontSize: '16px' }}></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Add Admin Popup */}
      {showAddPopup && (
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
            padding: isMobile ? '20px' : '30px 35px',
            maxWidth: isMobile ? '90%' : '600px',
            width: isMobile ? '90%' : '90%',
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
              Admin Ekle
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
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ad soyad giriniz"
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
                  E-posta
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="E-posta giriniz"
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
                  Firma
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
                          filteredCompanies.map((company: any) => (
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
                  Şifre
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Şifre giriniz"
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
      )}

      {/* Edit Admin Popup */}
      {showEditPopup && (
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
              Admin Düzenle
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
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ad soyad giriniz"
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
                  E-posta
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="E-posta giriniz"
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
                  Firma
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
                      overflow: 'hidden',
                      marginTop: '4px'
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
                          filteredCompanies.map((company: any) => (
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
                            Firma bulunamadı
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
                  Yeni Şifre (Opsiyonel)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Yeni şifre giriniz (değiştirmek istemiyorsanız boş bırakın)"
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
      )}

      {/* Delete Confirmation Popup */}
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
              Admin Sil
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
                Bu admini silmek istediğinizden emin misiniz?
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
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
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

export default DefineCompanyAdmin;
