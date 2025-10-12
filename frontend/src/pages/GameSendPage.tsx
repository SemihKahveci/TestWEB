import React, { useState, useEffect } from 'react';

interface Planet {
  value: string;
  label: string;
}

interface Group {
  _id: string;
  name: string;
  status: string;
  organizations: string[];
  persons: string[];
  planets: string[];
  createdAt: string;
  updatedAt: string;
}

interface Person {
  name: string;
  email: string;
  title: string;
  groupName: string;
  planets: string[];
}

const GameSendPage: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'person' | 'group'>('person');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Person tab states
  const [personName, setPersonName] = useState('');
  const [personEmail, setPersonEmail] = useState('');
  const [selectedPlanets, setSelectedPlanets] = useState<string[]>([]);
  
  // Group tab states
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  
  // Modal states
  const [showGroupDetailsModal, setShowGroupDetailsModal] = useState(false);
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<Group | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModal, setMessageModal] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info'
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    title: '',
    message: '',
    callback: null as ((result: boolean) => void) | null
  });

  // Available planets
  const availablePlanets: Planet[] = [
    { value: 'venus', label: 'Venüs (Belirsizlik Yönetimi - Müşteri Odaklılık)' },
    { value: 'titan', label: 'Titan (İnsanları Etkileme - Güven Veren İşbirlikçi ve Sinerji)' }
  ];

  // Load groups when group tab is selected
  useEffect(() => {
    if (activeTab === 'group' && groups.length === 0) {
      loadGroups();
    }
  }, [activeTab, groups.length]);

  // Load groups from API
  const loadGroups = async () => {
    try {
      setIsLoading(true);
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
      if (result.success) {
        // Only show active groups
        const activeGroups = result.groups.filter((group: Group) => group.status === 'Aktif');
        setGroups(activeGroups);
      } else {
        throw new Error(result.message || 'Grup listesi alınamadı');
      }
    } catch (error) {
      console.error('Grup listesi yükleme hatası:', error);
      showMessage('Hata', 'Grup listesi yüklenemedi', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Tab switching
  const switchTab = (tabName: 'person' | 'group') => {
    setActiveTab(tabName);
  };

  // Planet management
  const addPlanet = () => {
    const select = document.getElementById('planetSelect') as HTMLSelectElement;
    const selectedValue = select.value;

    if (!selectedValue) {
      showMessage('Hata', 'Lütfen bir gezegen seçin', 'error');
      return;
    }

    if (selectedPlanets.includes(selectedValue)) {
      showMessage('Hata', 'Bu gezegen zaten seçilmiş', 'error');
      return;
    }

    setSelectedPlanets([...selectedPlanets, selectedValue]);
    select.value = '';
  };

  const removePlanet = (planetValue: string) => {
    setSelectedPlanets(selectedPlanets.filter(p => p !== planetValue));
  };

  // Group management
  const addGroup = () => {
    const select = document.getElementById('groupSelect') as HTMLSelectElement;
    const selectedValue = select.value;

    if (!selectedValue) {
      showMessage('Hata', 'Lütfen bir grup seçin!', 'error');
      return;
    }

    if (selectedGroups.includes(selectedValue)) {
      showMessage('Hata', 'Bu grup zaten seçilmiş!', 'error');
      return;
    }

    setSelectedGroups([...selectedGroups, selectedValue]);
    select.value = '';
  };

  const removeGroup = (groupId: string) => {
    setSelectedGroups(selectedGroups.filter(g => g !== groupId));
  };

  // Show group details
  const showGroupDetails = (groupId: string) => {
    const group = groups.find(g => g._id === groupId);
    if (group) {
      setSelectedGroupDetails(group);
      setShowGroupDetailsModal(true);
    }
  };

  // Send person interview
  const sendPersonInterview = async () => {
    if (!personName || !personEmail || selectedPlanets.length === 0) {
      showMessage('Hata', 'Lütfen tüm alanları doldurun ve en az bir gezegen seçin.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const primaryPlanet = selectedPlanets[0];

      // Generate code
      const codeResponse = await fetch('/api/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: personName,
          email: personEmail,
          planet: primaryPlanet,
          allPlanets: selectedPlanets
        })
      });

      const codeData = await codeResponse.json();
      if (!codeData.success || !codeData.code) {
        throw new Error('Kod üretilemedi veya geçersiz kod döndü');
      }

      // Send code
      const sendResponse = await fetch('/api/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: codeData.code,
          name: personName,
          email: personEmail,
          planet: primaryPlanet,
          allPlanets: selectedPlanets
        })
      });

      const sendData = await sendResponse.json();
      if (sendData.success) {
        showMessage('Başarılı', 'Kod başarıyla gönderildi!', 'success');
        // Clear form
        setPersonName('');
        setPersonEmail('');
        setSelectedPlanets([]);
      } else {
        showMessage('Hata', 'Gönderilemedi: ' + sendData.message, 'error');
      }
    } catch (error) {
      console.error('Kod gönderme hatası:', error);
      showMessage('Hata', 'Gönderilemedi: Bir hata oluştu', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send group interview
  const sendGroupInterview = async () => {
    if (selectedGroups.length === 0) {
      showMessage('Hata', 'Lütfen en az bir grup seçin!', 'error');
      return;
    }

    try {
      // Get all persons from selected groups
      const allPersons: Person[] = [];

      for (const groupId of selectedGroups) {
        const group = groups.find(g => g._id === groupId);
        if (group && group.persons && group.persons.length > 0) {
          // Get person details from authorization API
          const token = localStorage.getItem('token');
          const response = await fetch('/api/authorization', {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              for (const personValue of group.persons) {
                const personName = personValue.includes(':') ? personValue.split(':')[1] : personValue;
                const personDetail = result.authorizations.find((p: any) => p.personName === personName);
                
                if (personDetail && personDetail.email) {
                  allPersons.push({
                    name: personDetail.personName,
                    email: personDetail.email,
                    title: personDetail.title,
                    groupName: group.name,
                    planets: group.planets || []
                  });
                }
              }
            }
          }
        }
      }

      if (allPersons.length === 0) {
        showMessage('Hata', 'Seçilen gruplarda email adresi olan kişi bulunamadı!', 'error');
        return;
      }

      // Show confirmation
      const confirmMessage = `${allPersons.length} kişiye oyun kodu gönderilecek. Devam etmek istiyor musunuz?`;
      showConfirm('Onay', confirmMessage, (result) => {
        if (result) {
          sendCodesToPersons(allPersons);
        }
      });
    } catch (error) {
      console.error('Grup gönderim hatası:', error);
      showMessage('Hata', 'Gönderim sırasında bir hata oluştu!', 'error');
    }
  };

  // Send codes to persons
  const sendCodesToPersons = async (allPersons: Person[]) => {
    try {
      setIsSubmitting(true);
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const person of allPersons) {
        try {
          // Generate code for each person
          const codeResponse = await fetch('/api/generate-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: person.name,
              email: person.email,
              planet: person.planets[0] || 'venus',
              allPlanets: person.planets.length > 0 ? person.planets : ['venus']
            })
          });

          if (codeResponse.ok) {
            const codeData = await codeResponse.json();
            if (codeData.success && codeData.code) {
              // Send code to person
              const sendResponse = await fetch('/api/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  code: codeData.code,
                  name: person.name,
                  email: person.email,
                  planet: person.planets[0] || 'venus',
                  allPlanets: person.planets.length > 0 ? person.planets : ['venus']
                })
              });

              if (sendResponse.ok) {
                const sendData = await sendResponse.json();
                if (sendData.success) {
                  successCount++;
                } else {
                  errorCount++;
                  errors.push(`${person.name}: ${sendData.message}`);
                }
              } else {
                errorCount++;
                errors.push(`${person.name}: Gönderim hatası`);
              }
            } else {
              errorCount++;
              errors.push(`${person.name}: Kod üretilemedi`);
            }
          } else {
            errorCount++;
            errors.push(`${person.name}: Kod üretim hatası`);
          }
        } catch (error) {
          errorCount++;
          errors.push(`${person.name}: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
        }
      }

      // Show results
      if (successCount > 0 && errorCount === 0) {
        showMessage('Başarılı', `${successCount} kişiye başarıyla gönderildi!`, 'success');
      } else if (successCount > 0 && errorCount > 0) {
        showMessage('Kısmi Başarı', `${successCount} kişiye gönderildi, ${errorCount} kişiye gönderilemedi.`, 'warning');
        console.error('Gönderim hataları:', errors);
      } else {
        showMessage('Hata', 'Hiçbir kişiye gönderilemedi!', 'error');
        console.error('Tüm gönderim hataları:', errors);
      }

      // Clear selections
      setSelectedGroups([]);
    } catch (error) {
      console.error('Grup gönderim hatası:', error);
      showMessage('Hata', 'Gönderim sırasında bir hata oluştu!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modal functions
  const showMessage = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setMessageModal({ title, message, type });
    setShowMessageModal(true);
  };

  const closeMessageModal = () => {
    setShowMessageModal(false);
  };

  const showConfirm = (title: string, message: string, callback: (result: boolean) => void) => {
    setConfirmModal({ title, message, callback });
    setShowConfirmModal(true);
  };

  const closeConfirmModal = (result: boolean) => {
    setShowConfirmModal(false);
    if (confirmModal.callback) {
      confirmModal.callback(result);
    }
  };

  const closeGroupDetailsModal = () => {
    setShowGroupDetailsModal(false);
    setSelectedGroupDetails(null);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#F8F9FA',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        width: '100%',
        height: '76px',
        padding: '16px 32px',
        background: 'white',
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                <div style={{ color: '#232D42', fontSize: '16px', fontWeight: 400, lineHeight: '28px' }}>Andron Games</div>
                <div style={{ color: '#8A92A6', fontSize: '13px', fontWeight: 400, lineHeight: '16.90px' }}>Founder</div>
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
            fontWeight: 700
          }}>
            Oyun Gönderme
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '40px',
        width: '90%',
        maxWidth: '800px',
        margin: '0 auto',
        marginTop: '60px'
      }}>
        {/* Tab Container */}
        <div style={{
          display: 'flex',
          background: '#F8F9FA',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <button
            onClick={() => switchTab('person')}
            style={{
              flex: 1,
              padding: '12px 24px',
              textAlign: 'center',
              background: activeTab === 'person' ? 'white' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: activeTab === 'person' ? '#3A57E8' : '#8A92A6',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === 'person' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Kişi
          </button>
          <button
            onClick={() => switchTab('group')}
            style={{
              flex: 1,
              padding: '12px 24px',
              textAlign: 'center',
              background: activeTab === 'group' ? 'white' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: activeTab === 'group' ? '#3A57E8' : '#8A92A6',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === 'group' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Grup
          </button>
        </div>

        {/* Person Tab Content */}
        {activeTab === 'person' && (
          <div>
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                color: 'black',
                fontSize: '14px',
                fontWeight: 700,
                marginBottom: '12px'
              }}>
                Ad Soyad
              </label>
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Lütfen Ad Soyad Giriniz"
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '1px solid #E9ECEF',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#232D42',
                  transition: 'border-color 0.3s'
                }}
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                color: 'black',
                fontSize: '14px',
                fontWeight: 700,
                marginBottom: '12px'
              }}>
                Email
              </label>
              <input
                type="email"
                value={personEmail}
                onChange={(e) => setPersonEmail(e.target.value)}
                placeholder="Lütfen Mail Adresi Giriniz"
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '1px solid #E9ECEF',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#232D42',
                  transition: 'border-color 0.3s'
                }}
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                color: 'black',
                fontSize: '14px',
                fontWeight: 700,
                marginBottom: '12px'
              }}>
                Gezegen Seçimi
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    id="planetSelect"
                    style={{
                      flex: 1,
                      padding: '16px',
                      border: '1px solid #E9ECEF',
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: '#232D42'
                    }}
                  >
                    <option value="">Lütfen Gezegen Seçiniz</option>
                    {availablePlanets
                      .filter(planet => !selectedPlanets.includes(planet.value))
                      .map(planet => (
                        <option key={planet.value} value={planet.value}>
                          {planet.label}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={addPlanet}
                    style={{
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'background-color 0.3s'
                    }}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  minHeight: '40px',
                  padding: '8px',
                  border: '1px solid #E9ECEF',
                  borderRadius: '4px',
                  background: '#f8f9fa'
                }}>
                  {selectedPlanets.map((planetValue, index) => {
                    const planet = availablePlanets.find(p => p.value === planetValue);
                    return planet ? (
                      <div
                        key={planetValue}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: '#3A57E8',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 500,
                          userSelect: 'none',
                          transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                      >
                        <div style={{ cursor: 'grab', padding: '2px', borderRadius: '3px' }}>
                          <i className="fas fa-grip-vertical"></i>
                        </div>
                        {planet.label}
                        <button
                          onClick={() => removePlanet(planetValue)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '0',
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={sendPersonInterview}
              disabled={isSubmitting}
              style={{
                background: '#3A57E8',
                color: 'white',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '30px',
                transition: 'background-color 0.3s',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              <i className="fas fa-paper-plane"></i>
              {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
            </button>
          </div>
        )}

        {/* Group Tab Content */}
        {activeTab === 'group' && (
          <div>
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                color: 'black',
                fontSize: '14px',
                fontWeight: 700,
                marginBottom: '12px'
              }}>
                Grup Seçimi
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    id="groupSelect"
                    style={{
                      flex: 1,
                      padding: '16px',
                      border: '1px solid #E9ECEF',
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: '#232D42'
                    }}
                  >
                    <option value="">Lütfen Grup Seçiniz</option>
                    {groups
                      .filter(group => !selectedGroups.includes(group._id))
                      .map(group => (
                        <option key={group._id} value={group._id}>
                          {group.name}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={addGroup}
                    disabled={isLoading}
                    style={{
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      transition: 'background-color 0.3s',
                      opacity: isLoading ? 0.7 : 1
                    }}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  minHeight: '40px',
                  padding: '8px',
                  border: '1px solid #E9ECEF',
                  borderRadius: '4px',
                  background: '#f8f9fa'
                }}>
                  {selectedGroups.map(groupId => {
                    const group = groups.find(g => g._id === groupId);
                    return group ? (
                      <div
                        key={groupId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: '#17a2b8',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 500,
                          userSelect: 'none',
                          transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                      >
                        {group.name}
                        <button
                          onClick={() => removeGroup(groupId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '0',
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                        <button
                          onClick={() => showGroupDetails(groupId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '0',
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: '4px'
                          }}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={sendGroupInterview}
              disabled={isSubmitting}
              style={{
                background: '#3A57E8',
                color: 'white',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '30px',
                transition: 'background-color 0.3s',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              <i className="fas fa-paper-plane"></i>
              {isSubmitting ? 'Gönderiliyor...' : 'Grup Üyelerine Gönder'}
            </button>
          </div>
        )}
      </div>

      {/* Group Details Modal */}
      {showGroupDetailsModal && selectedGroupDetails && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '1px solid #E9ECEF'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#232D42',
                margin: 0
              }}>
                {selectedGroupDetails.name} - Detayları
              </h3>
              <button
                onClick={closeGroupDetailsModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#8A92A6',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'background-color 0.3s'
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{
                color: '#232D42',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '10px'
              }}>
                Grup Bilgileri
              </h4>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <span style={{
                  background: '#F8F9FA',
                  border: '1px solid #DEE2E6',
                  color: '#495057',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 500
                }}>
                  Durum: {selectedGroupDetails.status}
                </span>
                <span style={{
                  background: '#F8F9FA',
                  border: '1px solid #DEE2E6',
                  color: '#495057',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 500
                }}>
                  Oluşturulma: {new Date(selectedGroupDetails.createdAt).toLocaleDateString('tr-TR')}
                </span>
              </div>
            </div>

            {/* Organizations */}
            {selectedGroupDetails.organizations && selectedGroupDetails.organizations.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '10px'
                }}>
                  Organizasyonlar ({selectedGroupDetails.organizations.length})
                </h4>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {selectedGroupDetails.organizations.map((org, index) => {
                    const displayValue = org.includes(':') ? org.split(':')[1] : org;
                    return (
                      <span
                        key={index}
                        style={{
                          background: '#E8F5E8',
                          border: '1px solid #C8E6C9',
                          color: '#388E3C',
                          padding: '6px 12px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: 500
                        }}
                      >
                        {displayValue}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Persons */}
            {selectedGroupDetails.persons && selectedGroupDetails.persons.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '10px'
                }}>
                  Kişiler ({selectedGroupDetails.persons.length})
                </h4>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {selectedGroupDetails.persons.map((person, index) => {
                    const displayValue = person.includes(':') ? person.split(':')[1] : person;
                    return (
                      <span
                        key={index}
                        style={{
                          background: '#E3F2FD',
                          border: '1px solid #BBDEFB',
                          color: '#1976D2',
                          padding: '6px 12px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: 500
                        }}
                      >
                        {displayValue}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Planets */}
            {selectedGroupDetails.planets && selectedGroupDetails.planets.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '10px'
                }}>
                  Gezegenler ({selectedGroupDetails.planets.length})
                </h4>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {selectedGroupDetails.planets.map((planet, index) => {
                    const displayValue = planet.includes(':') ? planet.split(':')[1] : planet;
                    return (
                      <span
                        key={index}
                        style={{
                          background: '#F3E5F5',
                          border: '1px solid #E1BEE7',
                          color: '#7B1FA2',
                          padding: '6px 12px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: 500
                        }}
                      >
                        {displayValue}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
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

      {/* Confirm Modal */}
      {showConfirmModal && (
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
                background: '#FFF3CD',
                color: '#856404'
              }}>
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#232D42',
                margin: 0
              }}>
                {confirmModal.title}
              </h3>
            </div>
            <div style={{
              padding: '16px 24px 24px 24px',
              color: '#495057',
              fontSize: '14px',
              lineHeight: 1.5
            }}>
              {confirmModal.message}
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              padding: '0 24px 24px 24px'
            }}>
              <button
                onClick={() => closeConfirmModal(false)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '80px',
                  background: '#6C757D',
                  color: 'white'
                }}
              >
                İptal
              </button>
              <button
                onClick={() => closeConfirmModal(true)}
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
                Evet
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

export default GameSendPage;
