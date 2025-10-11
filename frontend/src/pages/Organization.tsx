import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Organization {
  _id: string;
  generalManagerDeputy?: string;
  directorate?: string;
  management?: string;
  department?: string;
  unit?: string;
  position?: string;
}

const Organization: React.FC = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    generalManagerDeputy: '',
    directorate: '',
    management: '',
    department: '',
    unit: '',
    position: ''
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Organizasyonlar yükleniyor...');
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/organization', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Organizasyon listesi yüklenemedi');
      }

      const result = await response.json();
      console.log('✅ Organizasyonlar yüklendi:', result);
      
      if (result.success) {
        setOrganizations(result.data || []);
      } else {
        throw new Error(result.message || 'Organizasyon listesi alınamadı');
      }
    } catch (error: any) {
      console.error('💥 Organizasyon yükleme hatası:', error);
      setErrorMessage('Organizasyonlar yüklenirken bir hata oluştu');
      setShowErrorPopup(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOrganization = () => {
    setFormData({
      generalManagerDeputy: '',
      directorate: '',
      management: '',
      department: '',
      unit: '',
      position: ''
    });
    setShowAddPopup(true);
  };

  const handleEditOrganization = (organization: Organization) => {
    setSelectedOrganization(organization);
    setFormData({
      generalManagerDeputy: organization.generalManagerDeputy || '',
      directorate: organization.directorate || '',
      management: organization.management || '',
      department: organization.department || '',
      unit: organization.unit || '',
      position: organization.position || ''
    });
    setShowEditPopup(true);
  };

  const handleDeleteOrganization = (organization: Organization) => {
    setSelectedOrganization(organization);
    setShowDeletePopup(true);
  };

  const handleSubmitAdd = async () => {
    try {
      setIsSubmitting(true);
      console.log('🔄 Yeni organizasyon ekleniyor:', formData);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Organizasyon eklenemedi');
      }

      const responseData = await response.json();
      console.log('✅ Organizasyon başarıyla eklendi:', responseData);
      
      // Yeni organizasyonu listeye ekle
      setOrganizations(prev => [...prev, responseData.data]);
      
      // Başarı mesajı göster
      setShowAddPopup(false);
      setShowSuccessPopup(true);
      setSuccessMessage('Organizasyon başarıyla eklendi!');
    } catch (error: any) {
      console.error('💥 Organizasyon ekleme hatası:', error);
      setErrorMessage(error.message || 'Organizasyon eklenirken bir hata oluştu');
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    try {
      if (!selectedOrganization) return;
      setIsSubmitting(true);
      console.log('🔄 Organizasyon güncelleniyor:', selectedOrganization._id, formData);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/organization/${selectedOrganization._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Organizasyon güncellenemedi');
      }

      const responseData = await response.json();
      console.log('✅ Organizasyon başarıyla güncellendi:', responseData);
      
      // Güncellenen organizasyonu listede güncelle
      setOrganizations(prev => prev.map(org => 
        org._id === selectedOrganization._id ? responseData.data : org
      ));
      
      // Başarı mesajı göster
      setShowEditPopup(false);
      setShowSuccessPopup(true);
      setSuccessMessage('Organizasyon başarıyla güncellendi!');
    } catch (error: any) {
      console.error('💥 Organizasyon güncelleme hatası:', error);
      setErrorMessage(error.message || 'Organizasyon güncellenirken bir hata oluştu');
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (!selectedOrganization) return;
      setIsSubmitting(true);
      console.log('🔄 Organizasyon siliniyor:', selectedOrganization._id);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/organization/${selectedOrganization._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Silme işlemi başarısız');
      }

      console.log('✅ Organizasyon başarıyla silindi');
      
      // Silinen organizasyonu listeden çıkar
      setOrganizations(prev => prev.filter(org => org._id !== selectedOrganization._id));
      
      // Başarı mesajı göster
      setShowDeletePopup(false);
      setShowSuccessPopup(true);
      setSuccessMessage('Organizasyon başarıyla silindi!');
    } catch (error: any) {
      console.error('💥 Organizasyon silme hatası:', error);
      setErrorMessage(error.message || 'Organizasyon silinirken bir hata oluştu');
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter organizations based on search term
  const filteredOrganizations = organizations.filter(org => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (org.generalManagerDeputy && org.generalManagerDeputy.toLowerCase().includes(searchLower)) ||
      (org.directorate && org.directorate.toLowerCase().includes(searchLower)) ||
      (org.management && org.management.toLowerCase().includes(searchLower)) ||
      (org.department && org.department.toLowerCase().includes(searchLower)) ||
      (org.unit && org.unit.toLowerCase().includes(searchLower)) ||
      (org.position && org.position.toLowerCase().includes(searchLower))
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrganizations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrganizations = filteredOrganizations.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
          <div>Organizasyonlar yükleniyor...</div>
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
              Organizasyon
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
            Organizasyon
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
            Gruplama
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
            Kişiler
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
            <i className="fas fa-search" style={{
              position: 'absolute',
              left: '12px',
              color: '#ADB5BD',
              fontSize: '14px'
            }} />
            <input
              type="text"
              placeholder="Arama yapın..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 16px 8px 40px',
                border: '1px solid #E9ECEF',
                borderRadius: '6px',
                fontSize: '14px',
                width: '300px',
                outline: 'none'
              }}
            />
          </div>
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
            EKLE
          </button>
        </div>

        {/* Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#F8F9FA' }}>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  Genel Müdür Yardımcılığı
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  Direktörlük
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  Müdürlük
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  Departman
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  Birim
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  Pozisyon
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'right',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {currentOrganizations.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#8A92A6',
                    fontSize: '14px'
                  }}>
                    {searchTerm ? 'Arama kriterlerine uygun organizasyon bulunamadı' : 'Henüz organizasyon bulunmuyor'}
                  </td>
                </tr>
              ) : (
                currentOrganizations.map((organization) => (
                  <tr key={organization._id} style={{
                    borderBottom: '1px solid #E9ECEF'
                  }}>
                    <td style={{
                      padding: '16px',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 500
                    }}>
                      {organization.generalManagerDeputy || '-'}
                    </td>
                    <td style={{
                      padding: '16px',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 500
                    }}>
                      {organization.directorate || '-'}
                    </td>
                    <td style={{
                      padding: '16px',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 500
                    }}>
                      {organization.management || '-'}
                    </td>
                    <td style={{
                      padding: '16px',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 500
                    }}>
                      {organization.department || '-'}
                    </td>
                    <td style={{
                      padding: '16px',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 500
                    }}>
                      {organization.unit || '-'}
                    </td>
                    <td style={{
                      padding: '16px',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 500
                    }}>
                      {organization.position || '-'}
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
              Önceki
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
              Sonraki
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
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#232D42',
                marginBottom: '24px',
                fontFamily: 'Inter'
              }}>
                Organizasyon Ekle
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#232D42',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Genel Müdür Yardımcılığı
                  </label>
                  <input
                    type="text"
                    value={formData.generalManagerDeputy}
                    onChange={(e) => setFormData({ ...formData, generalManagerDeputy: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
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
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#232D42',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Direktörlük
                  </label>
                  <input
                    type="text"
                    value={formData.directorate}
                    onChange={(e) => setFormData({ ...formData, directorate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
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
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#232D42',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Müdürlük
                  </label>
                  <input
                    type="text"
                    value={formData.management}
                    onChange={(e) => setFormData({ ...formData, management: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
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
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#232D42',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Departman
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
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
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#232D42',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Birim
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
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
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#232D42',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Pozisyon
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
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
                marginTop: '24px'
              }}>
                <button
                  onClick={() => setShowAddPopup(false)}
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
                  İptal
                </button>
                <button
                  onClick={handleSubmitAdd}
                  disabled={isSubmitting}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#3A57E8',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'Ekleniyor...' : 'Ekle'}
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
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#232D42',
                marginBottom: '24px',
                fontFamily: 'Inter'
              }}>
                Organizasyon Düzenle
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#232D42',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Genel Müdür Yardımcılığı
                  </label>
                  <input
                    type="text"
                    value={formData.generalManagerDeputy}
                    onChange={(e) => setFormData({ ...formData, generalManagerDeputy: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
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
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#232D42',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Direktörlük
                  </label>
                  <input
                    type="text"
                    value={formData.directorate}
                    onChange={(e) => setFormData({ ...formData, directorate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
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
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#232D42',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Müdürlük
                  </label>
                  <input
                    type="text"
                    value={formData.management}
                    onChange={(e) => setFormData({ ...formData, management: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
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
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#232D42',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Departman
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
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
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#232D42',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Birim
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
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
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#232D42',
                    marginBottom: '8px',
                    fontFamily: 'Inter'
                  }}>
                    Pozisyon
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
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
                marginTop: '24px'
              }}>
                <button
                  onClick={() => setShowEditPopup(false)}
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
                  İptal
                </button>
                <button
                  onClick={handleSubmitEdit}
                  disabled={isSubmitting}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#3A57E8',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
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
                Organizasyonu Sil
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '24px',
                lineHeight: '1.5',
                fontFamily: 'Inter'
              }}>
                Bu organizasyonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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
                  İptal
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
                  {isSubmitting ? 'Siliniyor...' : 'Sil'}
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
            zIndex: 1000
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
                Başarılı!
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
                Tamam
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
            zIndex: 1000
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
                Hata!
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
                Tamam
              </button>
            </div>
          </div>
        )}
      </div>
  );
};

export default Organization;
