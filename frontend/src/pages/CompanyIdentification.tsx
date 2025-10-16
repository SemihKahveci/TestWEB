import React, { useState, useEffect } from 'react';
import { companyAPI } from '../services/api';

interface Company {
  _id?: string;
  vkn: string;
  firmName: string;
  firmMail: string;
}

const CompanyIdentification: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
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
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    vkn: '',
    firmName: '',
    firmMail: ''
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
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const response = await companyAPI.getAll();
      if (response.data.success) {
        setCompanies(response.data.companies);
      } else {
        console.error('❌ API hatası:', response.data.message);
      }
    } catch (error) {
      console.error('💥 Firmalar yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCompany = () => {
    setFormData({ vkn: '', firmName: '', firmMail: '' });
    setShowAddPopup(true);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      vkn: company.vkn,
      firmName: company.firmName,
      firmMail: company.firmMail
    });
    setShowEditPopup(true);
  };

  const handleDeleteCompany = (company: Company) => {
    setSelectedCompany(company);
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
      const response = await companyAPI.create(formData);
      if (response.data.success) {
        setShowAddPopup(false);
        loadCompanies();
      } else {
        console.error('❌ Firma ekleme hatası:', response.data.message);
        showMessage('Hata', response.data.message, 'error');
      }
    } catch (error: any) {
      console.error('💥 Firma ekleme hatası:', error);
      const errorMessage = error.response?.data?.message || 'Firma eklenirken bir hata oluştu';
      showMessage('Hata', errorMessage, 'error');
    }
  };

  const handleSubmitEdit = async () => {
    try {
      if (!selectedCompany) return;
      const response = await companyAPI.update(selectedCompany.vkn, {
        firmName: formData.firmName,
        firmMail: formData.firmMail
      });
      if (response.data.success) {
        setShowEditPopup(false);
        loadCompanies();
      } else {
        console.error('❌ Firma güncelleme hatası:', response.data.message);
        showMessage('Hata', response.data.message, 'error');
      }
    } catch (error: any) {
      console.error('💥 Firma güncelleme hatası:', error);
      const errorMessage = error.response?.data?.message || 'Firma güncellenirken bir hata oluştu';
      showMessage('Hata', errorMessage, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (!selectedCompany) return;
      const response = await companyAPI.delete(selectedCompany.vkn);
      if (response.data.success) {
        setShowDeletePopup(false);
        loadCompanies();
      } else {
        console.error('❌ Firma silme hatası:', response.data.message);
        showMessage('Hata', response.data.message, 'error');
      }
    } catch (error: any) {
      console.error('💥 Firma silme hatası:', error);
      const errorMessage = error.response?.data?.message || 'Firma silinirken bir hata oluştu';
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
            Firma Tanımlama
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
            onClick={handleAddCompany}
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
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
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
              VKN
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
              FİRMA ADI
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
              FİRMA MAİLİ
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
              İŞLEMLER
            </div>

            {/* Table Rows */}
            {companies.map((company) => (
              <React.Fragment key={company.vkn}>
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
                  {company.vkn}
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
                  {company.firmName}
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
                  {company.firmMail}
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
                    onClick={() => handleEditCompany(company)}
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
                    onClick={() => handleDeleteCompany(company)}
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
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Add Company Popup */}
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
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              color: '#232D42',
              fontFamily: 'Inter',
              fontSize: '18px',
              fontWeight: 600
            }}>
              Yeni Firma Ekle
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#232D42',
                  fontWeight: 500,
                  fontFamily: 'Inter',
                  fontSize: '14px'
                }}>
                  VKN
                </label>
                <input
                  type="text"
                  value={formData.vkn}
                  onChange={(e) => setFormData({...formData, vkn: e.target.value})}
                  placeholder="VKN giriniz"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #D1D5DB',
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
                  marginBottom: '8px',
                  color: '#232D42',
                  fontWeight: 500,
                  fontFamily: 'Inter',
                  fontSize: '14px'
                }}>
                  Firma Adı
                </label>
                <input
                  type="text"
                  value={formData.firmName}
                  onChange={(e) => setFormData({...formData, firmName: e.target.value})}
                  placeholder="Firma adını giriniz"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #D1D5DB',
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
                  marginBottom: '8px',
                  color: '#232D42',
                  fontWeight: 500,
                  fontFamily: 'Inter',
                  fontSize: '14px'
                }}>
                  Firma E-posta
                </label>
                <input
                  type="email"
                  value={formData.firmMail}
                  onChange={(e) => setFormData({...formData, firmMail: e.target.value})}
                  placeholder="Firma e-postasını giriniz"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
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
              marginTop: '20px'
            }}>
              <button
                onClick={() => setShowAddPopup(false)}
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
                onClick={handleSubmitAdd}
                style={{
                  padding: '8px 16px',
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
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Company Popup */}
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
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              color: '#232D42',
              fontFamily: 'Inter',
              fontSize: '18px',
              fontWeight: 600
            }}>
              Firma Düzenle
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#232D42',
                  fontWeight: 500,
                  fontFamily: 'Inter',
                  fontSize: '14px'
                }}>
                  VKN
                </label>
                <input
                  type="text"
                  value={formData.vkn}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
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
                  Firma Adı
                </label>
                <input
                  type="text"
                  value={formData.firmName}
                  onChange={(e) => setFormData({...formData, firmName: e.target.value})}
                  placeholder="Firma adını giriniz"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #D1D5DB',
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
                  marginBottom: '8px',
                  color: '#232D42',
                  fontWeight: 500,
                  fontFamily: 'Inter',
                  fontSize: '14px'
                }}>
                  Firma E-posta
                </label>
                <input
                  type="email"
                  value={formData.firmMail}
                  onChange={(e) => setFormData({...formData, firmMail: e.target.value})}
                  placeholder="Firma e-postasını giriniz"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
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
              marginTop: '20px'
            }}>
              <button
                onClick={() => setShowEditPopup(false)}
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
                onClick={handleSubmitEdit}
                style={{
                  padding: '8px 16px',
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
            padding: '24px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              color: '#232D42',
              fontFamily: 'Inter',
              fontSize: '18px',
              fontWeight: 600
            }}>
              Firma Sil
            </h3>
            <p style={{
              margin: '0 0 20px 0',
              color: '#6B7280',
              fontFamily: 'Inter',
              fontSize: '14px',
              lineHeight: '20px'
            }}>
              "{selectedCompany?.firmName}" firmasını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowDeletePopup(false)}
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
                onClick={handleConfirmDelete}
                style={{
                  padding: '8px 16px',
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

export default CompanyIdentification;
