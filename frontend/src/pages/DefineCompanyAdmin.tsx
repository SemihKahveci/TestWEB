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
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
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
  }, []);

  const loadAdmins = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Adminler yükleniyor...');
      const response = await fetch('/api/admin/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAdmins(data.admins);
        console.log('✅ Adminler başarıyla yüklendi:', data.admins.length);
      } else {
        console.error('❌ API hatası:', data.message);
      }
    } catch (error) {
      console.error('💥 Adminler yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAdmin = () => {
    setFormData({ name: '', email: '', company: '', password: '' });
    setShowAddPopup(true);
  };

  const handleEditAdmin = async (admin: Admin) => {
    try {
      const response = await fetch(`/api/admin/${admin._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSelectedAdmin(data.admin);
        setFormData({
          name: data.admin.name || '',
          email: data.admin.email || '',
          company: data.admin.company || '',
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

  const handleSubmitAdd = async () => {
    try {
      console.log('🔄 Yeni admin ekleniyor:', formData);
      const response = await fetch('/api/admin/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          password: formData.password,
          role: 'admin'
        })
      });
      const data = await response.json();
      if (data.success) {
        console.log('✅ Admin başarıyla eklendi');
        setShowAddPopup(false);
        loadAdmins();
      } else {
        console.error('❌ Admin ekleme hatası:', data.message);
        alert(data.message);
      }
    } catch (error: any) {
      console.error('💥 Admin ekleme hatası:', error);
      const errorMessage = error.response?.data?.message || 'Admin eklenirken bir hata oluştu';
      alert(errorMessage);
    }
  };

  const handleSubmitEdit = async () => {
    try {
      if (!selectedAdmin) return;
      console.log('🔄 Admin güncelleniyor:', selectedAdmin._id, formData);
      
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        company: formData.company
      };
      
      // Şifre varsa ekle
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/admin/${selectedAdmin._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      const data = await response.json();
      if (data.success) {
        console.log('✅ Admin başarıyla güncellendi');
        setShowEditPopup(false);
        loadAdmins();
      } else {
        console.error('❌ Admin güncelleme hatası:', data.message);
        alert(data.message);
      }
    } catch (error: any) {
      console.error('💥 Admin güncelleme hatası:', error);
      const errorMessage = error.response?.data?.message || 'Admin güncellenirken bir hata oluştu';
      alert(errorMessage);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (!selectedAdmin) return;
      console.log('🔄 Admin siliniyor:', selectedAdmin._id);
      const response = await fetch(`/api/admin/${selectedAdmin._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        console.log('✅ Admin başarıyla silindi');
        setShowDeletePopup(false);
        loadAdmins();
      } else {
        console.error('❌ Admin silme hatası:', data.message);
        alert(data.message);
      }
    } catch (error: any) {
      console.error('💥 Admin silme hatası:', error);
      const errorMessage = error.response?.data?.message || 'Admin silinirken bir hata oluştu';
      alert(errorMessage);
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
                  Şirket
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
                  Şirket
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  placeholder="Şirket adını giriniz"
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
                  Şirket
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  placeholder="Şirket adını giriniz"
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
    </div>
  );
};

export default DefineCompanyAdmin;
