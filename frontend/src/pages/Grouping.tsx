import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Group {
  _id: string;
  groupName?: string;
  isActive?: boolean;
  details?: string;
}

const Grouping: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    groupName: '',
    isActive: true,
    details: ''
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Gruplar yükleniyor...');
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/group', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Grup listesi yüklenemedi');
      }

      const result = await response.json();
      console.log('✅ Gruplar yüklendi:', result);
      
      if (result.success) {
        setGroups(result.data || []);
      } else {
        throw new Error(result.message || 'Grup listesi alınamadı');
      }
    } catch (error: any) {
      console.error('💥 Grup yükleme hatası:', error);
      setErrorMessage('Gruplar yüklenirken bir hata oluştu');
      setShowErrorPopup(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGroup = () => {
    setFormData({
      groupName: '',
      isActive: true,
      details: ''
    });
    setShowAddPopup(true);
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setFormData({
      groupName: group.groupName || '',
      isActive: group.isActive || false,
      details: group.details || ''
    });
    setShowEditPopup(true);
  };

  const handleDeleteGroup = (group: Group) => {
    setSelectedGroup(group);
    setShowDeletePopup(true);
  };

  const handleSubmitAdd = async () => {
    try {
      setIsSubmitting(true);
      console.log('🔄 Yeni grup ekleniyor:', formData);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Grup eklenemedi');
      }

      const responseData = await response.json();
      console.log('✅ Grup başarıyla eklendi:', responseData);
      
      // Yeni grubu listeye ekle
      setGroups(prev => [...prev, responseData.data]);
      
      // Başarı mesajı göster
      setShowAddPopup(false);
      setShowSuccessPopup(true);
      setSuccessMessage('Grup başarıyla eklendi!');
    } catch (error: any) {
      console.error('💥 Grup ekleme hatası:', error);
      setErrorMessage(error.message || 'Grup eklenirken bir hata oluştu');
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    try {
      if (!selectedGroup) return;
      setIsSubmitting(true);
      console.log('🔄 Grup güncelleniyor:', selectedGroup._id, formData);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/group/${selectedGroup._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Grup güncellenemedi');
      }

      const responseData = await response.json();
      console.log('✅ Grup başarıyla güncellendi:', responseData);
      
      // Güncellenen grubu listede güncelle
      setGroups(prev => prev.map(group => 
        group._id === selectedGroup._id ? responseData.data : group
      ));
      
      // Başarı mesajı göster
      setShowEditPopup(false);
      setShowSuccessPopup(true);
      setSuccessMessage('Grup başarıyla güncellendi!');
    } catch (error: any) {
      console.error('💥 Grup güncelleme hatası:', error);
      setErrorMessage(error.message || 'Grup güncellenirken bir hata oluştu');
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (!selectedGroup) return;
      setIsSubmitting(true);
      console.log('🔄 Grup siliniyor:', selectedGroup._id);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/group/${selectedGroup._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Silme işlemi başarısız');
      }

      console.log('✅ Grup başarıyla silindi');
      
      // Silinen grubu listeden çıkar
      setGroups(prev => prev.filter(group => group._id !== selectedGroup._id));
      
      // Başarı mesajı göster
      setShowDeletePopup(false);
      setShowSuccessPopup(true);
      setSuccessMessage('Grup başarıyla silindi!');
    } catch (error: any) {
      console.error('💥 Grup silme hatası:', error);
      setErrorMessage(error.message || 'Grup silinirken bir hata oluştu');
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter groups based on search term
  const filteredGroups = groups.filter(group => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (group.groupName && group.groupName.toLowerCase().includes(searchLower)) ||
      (group.details && group.details.toLowerCase().includes(searchLower))
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentGroups = filteredGroups.slice(startIndex, endIndex);

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
          <div>Gruplar yükleniyor...</div>
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
              Gruplama
            </div>
          </div>
        </div>

        {/* Tab Container */}
        <div style={{
          display: 'flex',
          gap: '30px',
          marginBottom: '20px'
        }}>
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
            onClick={() => navigate('/organization')}
          >
            Organizasyon
          </div>
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
            onClick={handleAddGroup}
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
                  Grup Adı
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  Aktiflik Durumu
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Montserrat'
                }}>
                  Detaylar
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
              {currentGroups.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#8A92A6',
                    fontSize: '14px'
                  }}>
                    {searchTerm ? 'Arama kriterlerine uygun grup bulunamadı' : 'Henüz grup bulunmuyor'}
                  </td>
                </tr>
              ) : (
                currentGroups.map((group) => (
                  <tr key={group._id} style={{
                    borderBottom: '1px solid #E9ECEF'
                  }}>
                    <td style={{
                      padding: '16px',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 500
                    }}>
                      {group.groupName || '-'}
                    </td>
                    <td style={{
                      padding: '16px',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 500
                    }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: group.isActive ? '#D1FAE5' : '#FEE2E2',
                        color: group.isActive ? '#065F46' : '#991B1B'
                      }}>
                        {group.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td style={{
                      padding: '16px',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 500
                    }}>
                      {group.details || '-'}
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
                        onClick={() => handleEditGroup(group)}
                      />
                      <i 
                        className="fas fa-trash" 
                        style={{
                          color: '#A30D11',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                        onClick={() => handleDeleteGroup(group)}
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
                Grup Ekle
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
                    Grup Adı
                  </label>
                  <input
                    type="text"
                    value={formData.groupName}
                    onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
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
                    Aktiflik Durumu
                  </label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      outline: 'none'
                    }}
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Pasif</option>
                  </select>
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
                    Detaylar
                  </label>
                  <textarea
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      outline: 'none',
                      resize: 'vertical'
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
                Grup Düzenle
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
                    Grup Adı
                  </label>
                  <input
                    type="text"
                    value={formData.groupName}
                    onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
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
                    Aktiflik Durumu
                  </label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      outline: 'none'
                    }}
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Pasif</option>
                  </select>
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
                    Detaylar
                  </label>
                  <textarea
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E9ECEF',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      outline: 'none',
                      resize: 'vertical'
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
        {showDeletePopup && selectedGroup && (
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
                Grubu Sil
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '24px',
                lineHeight: '1.5',
                fontFamily: 'Inter'
              }}>
                Bu grubu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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

export default Grouping;
