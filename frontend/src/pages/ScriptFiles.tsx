import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const ScriptFiles: React.FC = () => {
  const { t } = useLanguage();
  const competencies = [
    { value: 'Müşteri Odaklılık', label: t('competency.customerFocus') },
    { value: 'Uyumluluk ve Dayanıklılık', label: t('competency.uncertainty') },
    { value: 'İnsanları Etkileme', label: t('competency.ie') },
    { value: 'Güven Veren İşbirliği ve Sinerji', label: t('competency.idik') }
  ];
  const [selectedCompetency, setSelectedCompetency] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
      } else {
        setErrorMessage(t('errors.selectCsvOrExcel'));
        setShowErrorPopup(true);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.style.borderColor = '#3B82F6';
    event.currentTarget.style.backgroundColor = '#EFF6FF';
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.style.borderColor = '#D1D5DB';
    event.currentTarget.style.backgroundColor = '#FAFAFA';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.style.borderColor = '#D1D5DB';
    event.currentTarget.style.backgroundColor = '#FAFAFA';
    
    const file = event.dataTransfer.files[0];
    if (file) {
      if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
      } else {
        setErrorMessage(t('errors.selectCsvOrExcel'));
        setShowErrorPopup(true);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedCompetency) {
      setErrorMessage(t('errors.selectCompetency'));
      setShowErrorPopup(true);
      return;
    }

    if (!selectedFile) {
      setErrorMessage(t('errors.selectExcelFile'));
      setShowErrorPopup(true);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append('excelFile', selectedFile);
      formData.append('competencyName', selectedCompetency);

      const response = await fetch('/api/script-files/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMessage(result.message || t('messages.fileUploadComplete'));
        setShowSuccessPopup(true);
        // Dosya ve yetkinlik seçimini koru, sadece başarı mesajı göster
      } else {
        setErrorMessage(result.message || t('errors.fileUploadFailed'));
        setShowErrorPopup(true);
      }
    } catch (error: any) {
      console.error('💥 Dosya yükleme hatası:', error);
      setErrorMessage(`${t('errors.fileUploadFailed')}: ${error.message}`);
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateReports = async () => {
    if (!selectedCompetency) {
      setErrorMessage(t('errors.selectCompetency'));
      setShowErrorPopup(true);
      return;
    }

    if (!selectedFile) {
      setErrorMessage(t('errors.selectCsvFile'));
      setShowErrorPopup(true);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append('excelFile', selectedFile);
      formData.append('competencyName', selectedCompetency);

      const response = await fetch('/api/script-files/update', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMessage(result.message || t('messages.reportsUpdated'));
        setShowSuccessPopup(true);
      } else {
        setErrorMessage(result.message || t('errors.reportsUpdateFailed'));
        setShowErrorPopup(true);
      }
    } catch (error: any) {
      console.error('💥 Rapor güncelleme hatası:', error);
      setErrorMessage(`${t('errors.reportsUpdateFailed')}: ${error.message}`);
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateIDs = async () => {
    if (!selectedCompetency) {
      setErrorMessage(t('errors.selectCompetency'));
      setShowErrorPopup(true);
      return;
    }

    if (!selectedFile) {
      setErrorMessage(t('errors.selectCsvFile'));
      setShowErrorPopup(true);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append('excelFile', selectedFile);
      formData.append('competencyName', selectedCompetency);

      const response = await fetch('/api/script-files/update-ids', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMessage(result.message || t('messages.idsUpdated'));
        setShowSuccessPopup(true);
      } else {
        setErrorMessage(result.message || t('errors.idsUpdateFailed'));
        setShowErrorPopup(true);
      }
    } catch (error: any) {
      console.error('💥 ID güncelleme hatası:', error);
      setErrorMessage(`${t('errors.idsUpdateFailed')}: ${error.message}`);
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
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
            <div style={{ flex: 1 }}></div>
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
                    {t('labels.adminUser')}
                  </div>
                  <div style={{
                    color: '#8A92A6',
                    fontSize: '13px',
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    lineHeight: '16.90px'
                  }}>
                    {t('labels.hrManager')}
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
              {t('titles.scriptFiles')}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          maxWidth: '800px',
          margin: '0 auto',
          width: '100%'
        }}>
          {/* Yetkinlik Seçimi */}
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <label style={{
              color: '#232D42',
              fontSize: '14px',
              fontFamily: 'Inter',
              fontWeight: 500
            }}>
              {t('labels.competencyName')} *
            </label>
            <select
              value={selectedCompetency}
              onChange={(e) => setSelectedCompetency(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '1px solid #E9ECEF',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'Inter',
                outline: 'none',
                backgroundColor: 'white',
                cursor: 'pointer',
                color: selectedCompetency ? '#232D42' : '#8A92A6'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3B82F6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E9ECEF';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="">{t('placeholders.selectCompetency')}</option>
              {competencies.map((competency) => (
                <option key={competency.value} value={competency.value}>
                  {competency.label}
                </option>
              ))}
            </select>
          </div>

          {/* Excel Dosyası Yükleme */}
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <label style={{
              color: '#232D42',
              fontSize: '14px',
              fontFamily: 'Inter',
              fontWeight: 500
            }}>
              {t('labels.fileUpload')} *
            </label>
            <div
              onClick={() => document.getElementById('excelFileInput')?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: '2px dashed #D1D5DB',
                borderRadius: '8px',
                padding: '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: '#FAFAFA',
                transition: 'all 0.3s'
              }}
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="excelFileInput"
              />
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}>
                <i className="fas fa-file-excel" style={{
                  fontSize: '48px',
                  color: '#28A745'
                }}></i>
                <div>
                  <div style={{
                    color: '#232D42',
                    fontSize: '16px',
                    fontWeight: 500,
                    marginBottom: '8px'
                  }}>
                    {selectedFile ? selectedFile.name : t('labels.fileDropSelect')}
                  </div>
                  <div style={{
                    color: '#8A92A6',
                    fontSize: '14px'
                  }}>
                    {t('labels.fileFormats')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '8px'
          }}>
            <button
              onClick={handleUpdateReports}
              disabled={!selectedCompetency || !selectedFile || isSubmitting}
              style={{
                padding: '12px 24px',
                background: (!selectedCompetency || !selectedFile || isSubmitting) ? '#E9ECEF' : '#28A745',
                color: (!selectedCompetency || !selectedFile || isSubmitting) ? '#6C757D' : 'white',
                border: 'none',
                borderRadius: '6px',
                fontFamily: 'Inter',
                fontSize: '14px',
                fontWeight: 500,
                cursor: (!selectedCompetency || !selectedFile || isSubmitting) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  {t('labels.updating')}
                </>
              ) : (
                <>
                  <i className="fas fa-sync-alt"></i>
                  {t('buttons.updateReports')}
                </>
              )}
            </button>
            <button
              onClick={handleUpdateIDs}
              disabled={!selectedCompetency || !selectedFile || isSubmitting}
              style={{
                padding: '12px 24px',
                background: (!selectedCompetency || !selectedFile || isSubmitting) ? '#E9ECEF' : '#17A2B8',
                color: (!selectedCompetency || !selectedFile || isSubmitting) ? '#6C757D' : 'white',
                border: 'none',
                borderRadius: '6px',
                fontFamily: 'Inter',
                fontSize: '14px',
                fontWeight: 500,
                cursor: (!selectedCompetency || !selectedFile || isSubmitting) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  {t('labels.updating')}
                </>
              ) : (
                <>
                  <i className="fas fa-id-card"></i>
                  {t('buttons.updateIds')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Popup */}
        {showSuccessPopup && (
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
                {t('labels.success')}
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
                fontFamily: 'Inter'
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
    </>
  );
};

export default ScriptFiles;

