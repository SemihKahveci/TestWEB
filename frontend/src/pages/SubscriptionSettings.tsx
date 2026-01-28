import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { creditAPI } from '../services/api';
import { safeLog } from '../utils/logger';

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

const SubscriptionSettings: React.FC = () => {
  const { language, t } = useLanguage();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isSuperAdminChecked, setIsSuperAdminChecked] = useState(false); // Super admin kontrolü tamamlandı mı?

  // Super admin kontrolü
  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const response = await fetch('/api/admin/check-superadmin', {
          credentials: 'include'
        });
        const data = await response.json();
        setIsSuperAdmin(data.isSuperAdmin || false);
      } catch (error) {
        console.error('Super admin kontrolü hatası:', error);
        setIsSuperAdmin(false);
      } finally {
        setIsSuperAdminChecked(true); // Kontrol tamamlandı
      }
    };
    checkSuperAdmin();
  }, []);

  useEffect(() => {
    loadGames();
  }, []);

  // Kredi bilgilerini yeniden yükle (GameSendPage'den güncelleme için) - super admin değilse
  useEffect(() => {
    // Super admin kontrolü tamamlanana kadar bekle
    if (!isSuperAdminChecked) return;
    if (isSuperAdmin) return; // Super admin için kredi bilgisi yüklenmez
    
    const handleStorageChange = () => {
      const loadCreditInfo = async () => {
        try {
          const response = await creditAPI.getUserCredits();
          if (response.data.success) {
            const { totalCredits, usedCredits, remainingCredits } = response.data.credit;
            setUsedCredits(usedCredits);
            
            // localStorage'ı güncelle
            localStorage.setItem('remainingCredits', remainingCredits.toString());
            localStorage.setItem('usedCredits', usedCredits.toString());
            localStorage.setItem('totalCredits', totalCredits.toString());
          }
        } catch (error) {
          safeLog('error', 'Kredi bilgisi yüklenirken hata', error);
        }
      };
      
      loadCreditInfo();
    };

    // localStorage değişikliklerini dinle
    window.addEventListener('storage', handleStorageChange);
    
    // Sayfa focus olduğunda kredi bilgilerini yenile
    window.addEventListener('focus', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, [isSuperAdmin, isSuperAdminChecked]);

  const loadGames = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/game-management/games', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error(t('errors.dataLoadFailed'));
      
      const data = await response.json();
      setGames(data.games || []);
    } catch (error) {
      safeLog('error', 'Oyunlar yüklenirken hata', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Tarih formatını düzenle
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = language === 'en' ? 'en-US' : 'tr-TR';
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Toplam kredi hesapla
  const totalCredits = games.reduce((sum, game) => sum + game.credit, 0);
  
  // En eski tarihi bul
  const oldestDate = games.length > 0 
    ? games.reduce((oldest, game) => {
        const gameDate = new Date(game.date);
        const oldestDate = new Date(oldest);
        return gameDate < oldestDate ? game.date : oldest;
      }, games[0].date)
    : null;
  
  // Toplam kredi miktarı = Tablodaki kredilerin toplamı (dinamik)
  const totalCreditAmount = totalCredits; // Toplam kredi
  
  // Kullanılan kredi hesaplama
  // Credit API'den kullanılan kredi bilgisini al
  const [usedCredits, setUsedCredits] = useState(0);
  const [remainingCredits, setRemainingCredits] = useState(0);
  
  useEffect(() => {
    // Super admin kontrolü tamamlanana kadar bekle
    if (!isSuperAdminChecked) return;
    
    const loadCreditInfo = async () => {
      // Super admin için kredi bilgisi yükleme
      if (isSuperAdmin) {
        setUsedCredits(0);
        setRemainingCredits(0);
        return;
      }
      
      try {
        const response = await creditAPI.getUserCredits();
        if (response.data.success) {
          const { totalCredits, usedCredits, remainingCredits } = response.data.credit;
          setUsedCredits(usedCredits);
          setRemainingCredits(remainingCredits);
          
          // localStorage'ı güncelle
          localStorage.setItem('remainingCredits', remainingCredits.toString());
          localStorage.setItem('usedCredits', usedCredits.toString());
          localStorage.setItem('totalCredits', totalCredits.toString());
        }
      } catch (error) {
        console.error('Kredi bilgisi yüklenirken hata:', error);
        // Fallback: localStorage'dan al
        setUsedCredits(parseInt(localStorage.getItem('usedCredits') || '0'));
        setRemainingCredits(parseInt(localStorage.getItem('remainingCredits') || '0'));
      }
    };
    
    loadCreditInfo();
  }, [isSuperAdmin, isSuperAdminChecked]);

  // Toplam kredi değiştiğinde veritabanını güncelle (super admin değilse)
  useEffect(() => {
    // Super admin kontrolü tamamlanana kadar bekle
    if (!isSuperAdminChecked) return;
    
    const updateTotalCreditsInDB = async () => {
      // Super admin için kredi güncelleme yapılmaz
      if (isSuperAdmin) return;
      
      if (totalCredits > 0) {
        try {
          // Mevcut kredi bilgilerini al
          const response = await creditAPI.getUserCredits();
          if (response.data.success) {
            const currentTotalCredits = response.data.credit.totalCredits;
            
            // Eğer toplam kredi farklıysa güncelle
            if (currentTotalCredits !== totalCredits) {
              const difference = totalCredits - currentTotalCredits;
              
              if (difference !== 0) {
                await creditAPI.updateTotalCredits({
                  amount: difference,
                  description: `Oyun yönetimi güncellemesi: ${difference > 0 ? '+' : ''}${difference} kredi`
                });
                
                // Production'da kredi bilgileri loglanmaz (güvenlik)
                safeLog('debug', `Toplam kredi güncellendi: ${currentTotalCredits} -> ${totalCredits} (${difference > 0 ? '+' : ''}${difference})`);
              }
            }
          }
        } catch (error) {
          console.error('Toplam kredi güncellenirken hata:', error);
        }
      }
    };

    // Sadece games yüklendikten sonra çalıştır (super admin değilse)
    if (!isLoading && games.length > 0 && !isSuperAdmin && isSuperAdminChecked) {
      updateTotalCreditsInDB();
    }
  }, [totalCredits, isLoading, games.length, isSuperAdmin, isSuperAdminChecked]);
  
  // Super admin için sonsuz kredi
  const displayTotalCredits = isSuperAdmin ? '∞' : totalCreditAmount;
  const displayUsedCredits = isSuperAdmin ? 0 : usedCredits;
  const displayRemainingCredits = isSuperAdmin ? '∞' : (totalCreditAmount - usedCredits);
  const calculatedRemainingCredits = isSuperAdmin ? 0 : (totalCreditAmount - usedCredits); // Kalan kredi (hesaplama için)
  const usedPercentage = isSuperAdmin ? 0 : (totalCreditAmount > 0 ? (usedCredits / totalCreditAmount) * 100 : 0); // Kullanım yüzdesi

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
            {t('titles.subscriptionSettings')}
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
    
        {/* Main Content Card */}
        <div style={{
          width: '100%',
          background: 'white',
          borderRadius: '15px',
          border: '1px solid #DDDDDD',
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          gap: '40px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
        }}>
          {/* Info Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: '107px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              gap: '3px'
            }}>
              <div style={{
                alignSelf: 'stretch',
                color: '#8B8B8B',
                fontSize: '14px',
                fontFamily: 'Poppins',
                fontWeight: 400,
                wordWrap: 'break-word'
              }}>
                {t('labels.startDate')}
              </div>
              <div style={{
                alignSelf: 'stretch',
                color: 'black',
                fontSize: '14px',
                fontFamily: 'Poppins',
                fontWeight: 600,
                wordWrap: 'break-word'
              }}>
                {oldestDate ? formatDate(oldestDate) : t('labels.noData')}
              </div>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              gap: '3px'
            }}>
              <div style={{
                alignSelf: 'stretch',
                color: '#8B8B8B',
                fontSize: '14px',
                fontFamily: 'Poppins',
                fontWeight: 400,
                wordWrap: 'break-word'
              }}>
                {t('labels.totalCredits')}
              </div>
              <div style={{
                alignSelf: 'stretch',
                color: 'black',
                fontSize: '14px',
                fontFamily: 'Poppins',
                fontWeight: 600,
                wordWrap: 'break-word'
              }}>
                {isSuperAdmin ? '∞' : `${totalCredits.toLocaleString()} ${t('labels.credits')}`}
              </div>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              gap: '3px'
            }}>
              <div style={{
                alignSelf: 'stretch',
                color: '#8B8B8B',
                fontSize: '14px',
                fontFamily: 'Poppins',
                fontWeight: 400,
                wordWrap: 'break-word'
              }}>
                {t('labels.fee')}
              </div>
              <div style={{
                alignSelf: 'stretch',
                color: 'black',
                fontSize: '14px',
                fontFamily: 'Poppins',
                fontWeight: 600,
                wordWrap: 'break-word'
              }}>
                {t('labels.monthlyFeeSample')}
              </div>
            </div>
          </div>

          {/* Chart Container */}
          <div style={{
            width: '100%',
            minHeight: '250px',
            background: '#FDFDFD',
            borderRadius: '10px',
            border: '1px solid #D0D0D0',
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            {/* Chart Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '3px'
              }}>
                <div style={{
                  color: '#3A57E8',
                  fontSize: '16px',
                  fontFamily: 'Poppins',
                  fontWeight: 700,
                  lineHeight: '18px'
                }}>
                  {t('labels.creditUsage')}
                </div>
                <div style={{
                  color: '#6F6F6F',
                  fontSize: '12px',
                  fontFamily: 'Poppins',
                  fontWeight: 400,
                  lineHeight: '16px'
                }}>
                  {t('labels.usageSinceSample')}
                </div>
              </div>
              <div style={{
                width: 'fit-content',
                padding: '6px 20px',
                borderRadius: '4px',
                border: '1px solid #D1D5DB',
                background: '#F3F4F6',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'not-allowed',
                opacity: 0.6
              }}
              >
                <div style={{
                  color: '#9CA3AF',
                  fontSize: '14px',
                  fontFamily: 'Poppins',
                  fontWeight: 600,
                  lineHeight: '24px'
                }}>
                  {t('buttons.moreCredits')}
                </div>
              </div>
            </div>

            {/* Chart Content */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              {/* Progress Container */}
              <div style={{
                position: 'relative',
                width: '100%',
                height: '36px'
              }}>
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '36px',
                  background: '#A7C4FF',
                  borderRadius: '50px'
                }}></div>
                <div style={{
                  position: 'absolute',
                  width: `${100 - usedPercentage}%`,
                  height: '36px',
                  background: '#3A57E8',
                  borderRadius: '50px'
                }}></div>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  left: '10px',
                  color: 'white',
                  fontSize: '12px',
                  fontFamily: 'Poppins',
                  fontWeight: 700,
                  lineHeight: '16px'
                }}>
                  {isSuperAdmin ? '∞' : `${calculatedRemainingCredits.toLocaleString()} ${t('labels.credits')}`}
                </div>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  right: '10px',
                  color: 'black',
                  fontSize: '12px',
                  fontFamily: 'Poppins',
                  fontWeight: 700,
                  lineHeight: '16px'
                }}>
                  {isSuperAdmin ? '0' : `${usedCredits.toLocaleString()} ${t('labels.credits')}`}
                </div>
              </div>

              {/* Legend */}
              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '30px',
                    height: '16px',
                    background: '#3A57E8'
                  }}></div>
                  <div style={{
                    color: '#6C6C6C',
                    fontSize: '12px',
                    fontFamily: 'Poppins',
                    fontWeight: 500,
                    lineHeight: '16px'
                  }}>
                    {t('labels.remainingUsage')}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '30px',
                    height: '16px',
                    background: '#A7C4FF'
                  }}></div>
                  <div style={{
                    color: '#6C6C6C',
                    fontSize: '12px',
                    fontFamily: 'Poppins',
                    fontWeight: 500,
                    lineHeight: '16px'
                  }}>
                    {t('labels.usedUsage')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div style={{
          color: '#636363',
          fontSize: '16px',
          fontFamily: 'Poppins',
          fontWeight: 600,
          lineHeight: '20px',
          marginBottom: '10px'
        }}>
          {t('titles.paymentHistory')}
        </div>

        {/* History Table */}
        <div style={{
          width: '100%',
          background: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #E9ECEF',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
        }}>
          {/* Table Header */}
          <div style={{
            background: '#F2F2F2',
            display: 'flex',
            borderBottom: '1px solid rgba(0, 0, 0, 0.30)'
          }}>
            <div style={{
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '57px',
              flexShrink: 0,
              color: 'black',
              fontSize: '13px',
              fontFamily: 'Poppins',
              fontWeight: 700,
              lineHeight: '18px'
            }}>
              #
            </div>
            <div style={{
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '207px',
              flexShrink: 0,
              color: 'black',
              fontSize: '13px',
              fontFamily: 'Poppins',
              fontWeight: 700,
              lineHeight: '18px'
            }}>
              {t('labels.date')}
            </div>
            <div style={{
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '207px',
              flexShrink: 0,
              color: 'black',
              fontSize: '13px',
              fontFamily: 'Poppins',
              fontWeight: 700,
              lineHeight: '18px'
            }}>
              {t('labels.invoiceNo')}
            </div>
            <div style={{
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1
            }}></div>
            <div style={{
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '97px',
              flexShrink: 0,
              color: 'black',
              fontSize: '13px',
              fontFamily: 'Poppins',
              fontWeight: 700,
              lineHeight: '18px'
            }}>
              {t('labels.credit')}
            </div>
            <div style={{
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '97px',
              flexShrink: 0,
              color: 'black',
              fontSize: '13px',
              fontFamily: 'Poppins',
              fontWeight: 700,
              lineHeight: '18px'
            }}>
              {t('labels.fee')}
            </div>
          </div>

          {/* Table Rows */}
          {isLoading ? (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#8A92A6',
              fontSize: '14px',
              fontFamily: 'Inter'
            }}>
              {t('labels.loading')}
            </div>
          ) : games.length === 0 ? (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#8A92A6',
              fontSize: '14px',
              fontFamily: 'Inter'
            }}>
              {t('labels.noGameData')}
            </div>
          ) : (
            games.map((game, index) => (
            <div key={game._id} style={{
              display: 'flex',
              borderBottom: index === games.length - 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.30)'
            }}>
              <div style={{
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '57px',
                flexShrink: 0,
                color: 'black',
                fontSize: '13px',
                fontFamily: 'Poppins',
                fontWeight: 500,
                lineHeight: '18px'
              }}>
                {index + 1}
              </div>
              <div style={{
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '207px',
                flexShrink: 0,
                color: 'black',
                fontSize: '13px',
                fontFamily: 'Poppins',
                fontWeight: 500,
                lineHeight: '18px'
              }}>
                {formatDate(game.date)}
              </div>
              <div style={{
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '207px',
                flexShrink: 0,
                color: 'black',
                fontSize: '13px',
                fontFamily: 'Poppins',
                fontWeight: 500,
                lineHeight: '18px'
              }}>
                {game.invoiceNo}
              </div>
              <div style={{
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1
              }}></div>
              <div style={{
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '97px',
                flexShrink: 0,
                color: 'black',
                fontSize: '13px',
                fontFamily: 'Poppins',
                fontWeight: 500,
                lineHeight: '18px'
              }}>
                {game.credit.toLocaleString()}
              </div>
              <div style={{
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '97px',
                flexShrink: 0,
                color: 'black',
                fontSize: '13px',
                fontFamily: 'Poppins',
                fontWeight: 500,
                lineHeight: '18px'
              }}>
                120$
              </div>
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSettings;
