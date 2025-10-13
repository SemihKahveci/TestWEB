import React, { useState, useEffect } from 'react';

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
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/game-management/games', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Veriler yüklenemedi');
      
      const data = await response.json();
      setGames(data.games || []);
    } catch (error) {
      console.error('Oyunlar yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Tarih formatını düzenle
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
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
  
  // Sabit toplam kredi limiti (örnek: 10,000)
  const creditLimit = 10000;
  const remainingCredits = Math.max(0, creditLimit - totalCredits);
  const usedPercentage = Math.min((totalCredits / creditLimit) * 100, 100);

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
            Abonelik Ayarları
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
                Başlangıç Tarihi
              </div>
              <div style={{
                alignSelf: 'stretch',
                color: 'black',
                fontSize: '14px',
                fontFamily: 'Poppins',
                fontWeight: 600,
                wordWrap: 'break-word'
              }}>
                {oldestDate ? formatDate(oldestDate) : 'Veri yok'}
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
                Toplam Kredi
              </div>
              <div style={{
                alignSelf: 'stretch',
                color: 'black',
                fontSize: '14px',
                fontFamily: 'Poppins',
                fontWeight: 600,
                wordWrap: 'break-word'
              }}>
                {totalCredits.toLocaleString()} Kredi
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
                Ücret
              </div>
              <div style={{
                alignSelf: 'stretch',
                color: 'black',
                fontSize: '14px',
                fontFamily: 'Poppins',
                fontWeight: 600,
                wordWrap: 'break-word'
              }}>
                120$ /Aylık
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
                  Kredi Kullanımları
                </div>
                <div style={{
                  color: '#6F6F6F',
                  fontSize: '12px',
                  fontFamily: 'Poppins',
                  fontWeight: 400,
                  lineHeight: '16px'
                }}>
                  10/04/2025 12:16 tarihinden bugüne
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
                  Daha Fazla Kredi
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
                  width: `${usedPercentage}%`,
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
                  {totalCredits.toLocaleString()} Kredi
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
                  {remainingCredits.toLocaleString()} Kredi
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
                    Kalan Kullanımlarım
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
                    Harcanan Kullanımlarım
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
          Geçmiş Ödemeler
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
              Tarih
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
              Fatura No
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
              Kredi
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
              Ücret
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
              Yükleniyor...
            </div>
          ) : games.length === 0 ? (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#8A92A6',
              fontSize: '14px',
              fontFamily: 'Inter'
            }}>
              Henüz oyun verisi bulunmuyor
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
