import React, { useState, useEffect } from 'react';
import { creditAPI } from '../services/api';

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
  const [activeTab, setActiveTab] = useState<'person' | 'group' | 'title'>('person');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingCredits, setRemainingCredits] = useState(0);
  
  // Person tab states
  const [personName, setPersonName] = useState('');
  const [personEmail, setPersonEmail] = useState('');
  const [selectedPlanets, setSelectedPlanets] = useState<string[]>([]);
  const [showPlanetDropdown, setShowPlanetDropdown] = useState(false);
  const [planetSearchTerm, setPlanetSearchTerm] = useState('');
  
  // Group tab states
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [debouncedGroupSearchTerm, setDebouncedGroupSearchTerm] = useState('');
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  
  // Title tab states
  const [titles, setTitles] = useState<any[]>([]);
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [titleSearchTerm, setTitleSearchTerm] = useState('');
  const [debouncedTitleSearchTerm, setDebouncedTitleSearchTerm] = useState('');
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [selectedTitlePlanets, setSelectedTitlePlanets] = useState<string[]>([]);
  const [showTitlePlanetDropdown, setShowTitlePlanetDropdown] = useState(false);
  const [titlePlanetSearchTerm, setTitlePlanetSearchTerm] = useState('');
  
  // Modal states
  const [showGroupDetailsModal, setShowGroupDetailsModal] = useState(false);
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<Group | null>(null);
  const [showTitleDetailsModal, setShowTitleDetailsModal] = useState(false);
  const [selectedTitleDetails, setSelectedTitleDetails] = useState<any>(null);
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
  const [isMobile, setIsMobile] = useState(false);

  // Available planets
  const availablePlanets: Planet[] = [
    { value: 'venus', label: 'Venüs (Belirsizlik Yönetimi - Müşteri Odaklılık)' },
    { value: 'titan', label: 'Titan (İnsanları Etkileme - Güven Veren İşbirlikçi ve Sinerji)' }
  ];

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

  // Load groups when group tab is selected
  useEffect(() => {
    if (activeTab === 'group' && groups.length === 0) {
      loadGroups();
    }
  }, [activeTab, groups.length]);

  // Load titles when title tab is selected
  useEffect(() => {
    if (activeTab === 'title' && titles.length === 0) {
      loadTitles();
    }
  }, [activeTab, titles.length]);

  // Debounce group search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGroupSearchTerm(groupSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [groupSearchTerm]);

  // Debounce title search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTitleSearchTerm(titleSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [titleSearchTerm]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const dropdown = target.closest('[data-dropdown]');
      
      if (!dropdown) {
        setShowGroupDropdown(false);
        setShowTitleDropdown(false);
        setShowPlanetDropdown(false);
        setShowTitlePlanetDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // Load remaining credits on component mount
  useEffect(() => {
    loadRemainingCredits();
  }, []);

  // Sayfa focus olduğunda kredi bilgilerini yenile
  useEffect(() => {
    const handleFocus = () => {
      loadRemainingCredits(true); // Force refresh
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadRemainingCredits = async (forceRefresh = false) => {
    try {
      // Credit API'den güncel veri al
      // Cache'i bypass etmek için timestamp parametresi ekle
      const url = forceRefresh ? `/api/credit?t=${Date.now()}` : '/api/credit';
      const creditResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (creditResponse.ok) {
        const data = await creditResponse.json();
        if (data.success) {
          const { totalCredits, usedCredits, remainingCredits } = data.credit;
          setRemainingCredits(remainingCredits);
          
          // localStorage'ı da güncelle
          localStorage.setItem('remainingCredits', remainingCredits.toString());
          localStorage.setItem('usedCredits', usedCredits.toString());
          localStorage.setItem('totalCredits', totalCredits.toString());
          
          console.log('Kredi bilgileri güncellendi:', { totalCredits, usedCredits, remainingCredits });
        } else {
          setRemainingCredits(0);
        }
      } else {
        throw new Error('API yanıtı başarısız');
      }
    } catch (error) {
      console.error('Kredi bilgisi yüklenirken hata:', error);
      // Fallback: localStorage'dan al
      const fallbackRemaining = parseInt(localStorage.getItem('remainingCredits') || '0');
      const fallbackUsed = parseInt(localStorage.getItem('usedCredits') || '0');
      const fallbackTotal = parseInt(localStorage.getItem('totalCredits') || '0');
      
      if (fallbackTotal > 0) {
        setRemainingCredits(fallbackRemaining);
      } else {
        setRemainingCredits(0);
      }
    }
  };

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
        // Only show active groups and sort alphabetically
        const activeGroups = result.groups
          .filter((group: Group) => group.status === 'Aktif')
          .sort((a: Group, b: Group) => a.name.localeCompare(b.name, 'tr-TR'));
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

  // Load titles from API
  const loadTitles = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/organization', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Unvan listesi yüklenemedi');
      }

      const result = await response.json();
      if (result.success) {
        // Get unique titles and sort alphabetically
        const uniqueTitles = [...new Set(result.organizations.map((org: any) => org.unvan).filter((unvan: any) => unvan && unvan !== '-'))]
          .sort((a: any, b: any) => a.localeCompare(b, 'tr-TR'))
          .map((unvan: any) => ({
            _id: unvan,
            name: unvan,
            organizations: result.organizations.filter((org: any) => org.unvan === unvan)
          }));
        setTitles(uniqueTitles);
      } else {
        throw new Error(result.message || 'Unvan listesi alınamadı');
      }
    } catch (error) {
      console.error('Unvan listesi yükleme hatası:', error);
      showMessage('Hata', 'Unvan listesi yüklenemedi', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Tab switching
  const switchTab = (tabName: 'person' | 'group' | 'title') => {
    setActiveTab(tabName);
  };

  // Planet management (removed old addPlanet function)

  const removePlanet = (planetValue: string) => {
    setSelectedPlanets(selectedPlanets.filter(p => p !== planetValue));
  };

  // Group management
  const addGroup = (groupId: string) => {
    if (!groupId) {
      showMessage('Hata', 'Lütfen bir grup seçin!', 'error');
      return;
    }

    if (selectedGroups.includes(groupId)) {
      showMessage('Hata', 'Bu grup zaten seçilmiş!', 'error');
      return;
    }

    setSelectedGroups([...selectedGroups, groupId]);
    setGroupSearchTerm('');
    setShowGroupDropdown(false);
  };

  const removeGroup = (groupId: string) => {
    setSelectedGroups(selectedGroups.filter(g => g !== groupId));
  };

  // Title management
  const addTitle = (titleId: string) => {
    if (!titleId) {
      showMessage('Hata', 'Lütfen bir unvan seçin!', 'error');
      return;
    }

    if (selectedTitles.includes(titleId)) {
      showMessage('Hata', 'Bu unvan zaten seçilmiş!', 'error');
      return;
    }

    setSelectedTitles([...selectedTitles, titleId]);
    setTitleSearchTerm('');
    setShowTitleDropdown(false);
  };

  const removeTitle = (titleId: string) => {
    setSelectedTitles(selectedTitles.filter(t => t !== titleId));
  };

  const addPlanet = (planetValue: string) => {
    if (selectedPlanets.includes(planetValue)) {
      showMessage('Hata', 'Bu gezegen zaten seçilmiş!', 'error');
      return;
    }
    setSelectedPlanets([...selectedPlanets, planetValue]);
    setPlanetSearchTerm('');
    setShowPlanetDropdown(false);
  };

  // Title planet management (removed old addTitlePlanet function)

  const removeTitlePlanet = (planetValue: string) => {
    setSelectedTitlePlanets(selectedTitlePlanets.filter(p => p !== planetValue));
  };

  // Filter groups based on search term
  const filteredGroups = groups.filter(group => {
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
    
    const searchNormalized = normalizeText(debouncedGroupSearchTerm);
    const groupNameNormalized = normalizeText(group.name);
    
    return groupNameNormalized.includes(searchNormalized);
  });

  // Filter titles based on search term
  const filteredTitles = titles.filter(title => {
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
    
    const searchNormalized = normalizeText(debouncedTitleSearchTerm);
    const titleNameNormalized = normalizeText(title.name);
    
    return titleNameNormalized.includes(searchNormalized);
  });

  // Filter planets based on search term
  const filteredPlanets = availablePlanets.filter(planet => {
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
    
    const searchNormalized = normalizeText(planetSearchTerm);
    const planetLabelNormalized = normalizeText(planet.label);
    
    return planetLabelNormalized.includes(searchNormalized);
  });

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

  // Show group details
  const showGroupDetails = async (groupId: string) => {
    const group = groups.find(g => g._id === groupId);
    if (group) {
      try {
        // Bu gruptaki kişilerin detaylarını al
        const token = localStorage.getItem('token');
        const response = await fetch('/api/authorization', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Grup kişilerinin detaylarını bul
            const groupPersons: any[] = [];
            for (const personValue of group.persons) {
              const personName = personValue.includes(':') ? personValue.split(':')[1] : personValue;
              const personDetail = result.authorizations.find((p: any) => p.personName === personName);
              
              if (personDetail) {
                groupPersons.push({
                  name: personDetail.personName,
                  email: personDetail.email,
                  title: personDetail.title,
                  sicilNo: personDetail.sicilNo
                });
              }
            }

            // Group details'e kişi bilgilerini ekle
            const groupWithPersons = {
              ...group,
              persons: groupPersons
            };

            setSelectedGroupDetails(groupWithPersons);
            setShowGroupDetailsModal(true);
          }
        }
      } catch (error) {
        console.error('Grup detayları yükleme hatası:', error);
        showMessage('Hata', 'Grup detayları yüklenemedi', 'error');
      }
    }
  };

  // Show title details
  const showTitleDetails = async (titleId: string) => {
    const title = titles.find(t => t._id === titleId);
    if (title) {
      try {
        // Bu unvanın pozisyonlarında çalışan kişileri bul
        const token = localStorage.getItem('token');
        const response = await fetch('/api/authorization', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Bu unvanın pozisyonlarını al
            const orgPositions = title.organizations
              .map((org: any) => org.pozisyon)
              .filter(Boolean)
              .filter((position: string, index: number, arr: string[]) => arr.indexOf(position) === index);

            // Bu pozisyonlardaki kişileri bul
            const matchingPersons = result.authorizations.filter((person: any) => 
              orgPositions.includes(person.title)
            );

            // Title details'e kişi bilgilerini ekle
            const titleWithPersons = {
              ...title,
              persons: matchingPersons.map(person => ({
                name: person.personName,
                email: person.email,
                title: person.title,
                sicilNo: person.sicilNo
              }))
            };

            setSelectedTitleDetails(titleWithPersons);
            setShowTitleDetailsModal(true);
          }
        }
      } catch (error) {
        console.error('Unvan detayları yükleme hatası:', error);
        showMessage('Hata', 'Unvan detayları yüklenemedi', 'error');
      }
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
        const creditCost = selectedPlanets.length;
        showMessage('Başarılı', `Kod başarıyla gönderildi! (${creditCost} kredi düşüldü)`, 'success');
        // Clear form
        setPersonName('');
        setPersonEmail('');
        setSelectedPlanets([]);
        // Kredi düşür (API ile)
        try {
          const deductResponse = await creditAPI.deductCredits({
            amount: creditCost,
            type: 'game_send',
            description: `Kişi gönderimi: ${personName} (${creditCost} gezegen)`
          });
          
          if (deductResponse.data.success) {
            // localStorage'ı güncelle
            const { totalCredits, usedCredits, remainingCredits } = deductResponse.data.credit;
            localStorage.setItem('remainingCredits', remainingCredits.toString());
            localStorage.setItem('usedCredits', usedCredits.toString());
            localStorage.setItem('totalCredits', totalCredits.toString());
            
            // UI'yi güncelle
            setRemainingCredits(remainingCredits);
          }
        } catch (error) {
          showMessage('Hata', `Kredi düşürülemedi: ${error.response?.data?.message || error.message}`, 'error');
        }
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

  // Send title interview
  const sendTitleInterview = async () => {
    if (selectedTitles.length === 0) {
      showMessage('Hata', 'Lütfen en az bir unvan seçin!', 'error');
      return;
    }

    if (selectedTitlePlanets.length === 0) {
      showMessage('Hata', 'Lütfen en az bir gezegen seçin!', 'error');
      return;
    }

    try {
      // Get all persons from selected titles
      const allPersons: Person[] = [];

      for (const titleId of selectedTitles) {
        const title = titles.find(t => t._id === titleId);
        console.log('Selected title:', title);
        
        if (title && title.organizations && title.organizations.length > 0) {
          const token = localStorage.getItem('token');
          
          // 1. Bu unvanın pozisyonlarını al (zaten title.organizations'da var)
          const orgPositions = title.organizations
            .map((org: any) => org.pozisyon)
            .filter(Boolean)
            .filter((position: string, index: number, arr: string[]) => arr.indexOf(position) === index); // Tekrarları kaldır
          
          console.log('Positions for this title:', orgPositions);
          
          if (orgPositions.length === 0) {
            console.log('No positions found for this title');
            continue;
          }
          
          // 2. Authorization API'sinden bu pozisyonlara sahip kişileri bul
          const response = await fetch('/api/authorization', {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              console.log('Available authorizations:', result.authorizations.length);
              
              // Debug: Authorization'daki tüm title'ları göster
              const allAuthTitles = [...new Set(result.authorizations.map((p: any) => p.title))];
              console.log('All titles in authorization:', allAuthTitles);
              console.log('Looking for positions:', orgPositions);
              
              // Debug: Authorization verilerinin yapısını kontrol et
              console.log('First authorization sample:', result.authorizations[0]);
              console.log('Authorization fields:', Object.keys(result.authorizations[0] || {}));
              
              // Bu pozisyonlardaki kişileri bul (title alanında arama yap)
              const matchingPersons = result.authorizations.filter((person: any) => 
                orgPositions.includes(person.title)
              );
              
              // Debug: Title eşleştirmesini kontrol et
              console.log('Title matching debug:');
              result.authorizations.forEach((person: any, index: number) => {
                if (index < 3) { // İlk 3 kişiyi kontrol et
                  console.log(`Person ${index}:`, {
                    name: person.personName,
                    title: person.title,
                    isMatch: orgPositions.includes(person.title)
                  });
                }
              });
              
              console.log(`Found ${matchingPersons.length} persons in positions: ${orgPositions.join(', ')}`);
              
              // Debug: Eşleşmeyen pozisyonları göster
              const unmatchedPositions = orgPositions.filter(pos => !allAuthTitles.includes(pos));
              if (unmatchedPositions.length > 0) {
                console.log('Unmatched positions:', unmatchedPositions);
              }
              
              for (const person of matchingPersons) {
                console.log('Person details:', {
                  name: person.personName,
                  email: person.email,
                  pozisyon: person.pozisyon
                });
                
                  if (person.email) {
                    allPersons.push({
                      name: person.personName,
                      email: person.email,
                      title: person.title,
                      groupName: `${person.genelMudurYardimciligi} - ${person.direktörlük}`,
                      planets: selectedTitlePlanets // Seçilen gezegenleri kullan
                    });
                  }
              }
            }
          }
        }
      }

      if (allPersons.length === 0) {
        showMessage('Hata', 'Seçilen unvanlarda email adresi olan kişi bulunamadı!', 'error');
        return;
      }

      // Show confirmation
      const confirmMessage = `${allPersons.length} kişiye oyun kodu gönderilecek. Devam etmek istiyor musunuz?`;
      showConfirm('Onay', confirmMessage, (result) => {
        if (result) {
          sendCodesToTitlePersons(allPersons);
        }
      });
    } catch (error) {
      console.error('Unvan gönderim hatası:', error);
      showMessage('Hata', 'Gönderim sırasında bir hata oluştu!', 'error');
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

      // Kredi hesaplama (başarılı gönderim sayısı * gezegen sayısı)
      // Her kişi için grup gezegen sayısını kullan
      let totalCreditCost = 0;
      for (const groupId of selectedGroups) {
        const group = groups.find(g => g._id === groupId);
        if (group && group.planets) {
          // Bu gruptaki kişi sayısı * gezegen sayısı
          const groupPersonCount = group.persons ? group.persons.length : 0;
          totalCreditCost += groupPersonCount * group.planets.length;
        }
      }
      
      // Show results
      if (successCount > 0 && errorCount === 0) {
        showMessage('Başarılı', `${successCount} kişiye başarıyla gönderildi! (${totalCreditCost} kredi düşüldü)`, 'success');
        // Kredi düşür (API ile)
        try {
          const deductResponse = await creditAPI.deductCredits({
            amount: totalCreditCost,
            type: 'game_send',
            description: `Grup gönderimi: ${successCount} kişi (${totalCreditCost} kredi)`
          });
          
          if (deductResponse.data.success) {
            // localStorage'ı güncelle
            const { totalCredits, usedCredits, remainingCredits } = deductResponse.data.credit;
            localStorage.setItem('remainingCredits', remainingCredits.toString());
            localStorage.setItem('usedCredits', usedCredits.toString());
            localStorage.setItem('totalCredits', totalCredits.toString());
            
            // UI'yi güncelle
            setRemainingCredits(remainingCredits);
          }
        } catch (error) {
          showMessage('Hata', `Kredi düşürülemedi: ${error.response?.data?.message || error.message}`, 'error');
        }
      } else if (successCount > 0 && errorCount > 0) {
        showMessage('Kısmi Başarı', `${successCount} kişiye gönderildi, ${errorCount} kişiye gönderilemedi. (${totalCreditCost} kredi düşüldü)`, 'warning');
        console.error('Gönderim hataları:', errors);
        // Kredi düşür (sadece başarılı gönderimler için - API ile)
        try {
          const deductResponse = await creditAPI.deductCredits({
            amount: totalCreditCost,
            type: 'game_send',
            description: `Grup gönderimi (kısmi): ${successCount} kişi (${totalCreditCost} kredi)`
          });
          
          if (deductResponse.data.success) {
            // localStorage'ı güncelle
            const { totalCredits, usedCredits, remainingCredits } = deductResponse.data.credit;
            localStorage.setItem('remainingCredits', remainingCredits.toString());
            localStorage.setItem('usedCredits', usedCredits.toString());
            localStorage.setItem('totalCredits', totalCredits.toString());
            
            // UI'yi güncelle
            setRemainingCredits(remainingCredits);
          }
        } catch (error) {
          showMessage('Hata', `Kredi düşürülemedi: ${error.response?.data?.message || error.message}`, 'error');
        }
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

  // Send codes to title persons
  const sendCodesToTitlePersons = async (allPersons: Person[]) => {
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

      // Kredi hesaplama (başarılı gönderim sayısı * gezegen sayısı)
      const totalCreditCost = successCount * selectedTitlePlanets.length;
      
      // Show results
      if (successCount > 0 && errorCount === 0) {
        showMessage('Başarılı', `${successCount} kişiye başarıyla gönderildi! (${totalCreditCost} kredi düşüldü)`, 'success');
        // Kredi düşür (API ile)
        try {
          const deductResponse = await creditAPI.deductCredits({
            amount: totalCreditCost,
            type: 'game_send',
            description: `Unvan gönderimi: ${successCount} kişi (${totalCreditCost} kredi)`
          });
          
          if (deductResponse.data.success) {
            // localStorage'ı güncelle
            const { totalCredits, usedCredits, remainingCredits } = deductResponse.data.credit;
            localStorage.setItem('remainingCredits', remainingCredits.toString());
            localStorage.setItem('usedCredits', usedCredits.toString());
            localStorage.setItem('totalCredits', totalCredits.toString());
            
            // UI'yi güncelle
            setRemainingCredits(remainingCredits);
          }
        } catch (error) {
          showMessage('Hata', `Kredi düşürülemedi: ${error.response?.data?.message || error.message}`, 'error');
        }
      } else if (successCount > 0 && errorCount > 0) {
        showMessage('Kısmi Başarı', `${successCount} kişiye gönderildi, ${errorCount} kişiye gönderilemedi. (${totalCreditCost} kredi düşüldü)`, 'warning');
        console.error('Gönderim hataları:', errors);
        // Kredi düşür (sadece başarılı gönderimler için - API ile)
        try {
          const deductResponse = await creditAPI.deductCredits({
            amount: totalCreditCost,
            type: 'game_send',
            description: `Unvan gönderimi (kısmi): ${successCount} kişi (${totalCreditCost} kredi)`
          });
          
          if (deductResponse.data.success) {
            // localStorage'ı güncelle
            const { totalCredits, usedCredits, remainingCredits } = deductResponse.data.credit;
            localStorage.setItem('remainingCredits', remainingCredits.toString());
            localStorage.setItem('usedCredits', usedCredits.toString());
            localStorage.setItem('totalCredits', totalCredits.toString());
            
            // UI'yi güncelle
            setRemainingCredits(remainingCredits);
          }
        } catch (error) {
          showMessage('Hata', `Kredi düşürülemedi: ${error.response?.data?.message || error.message}`, 'error');
        }
      } else {
        showMessage('Hata', 'Hiçbir kişiye gönderilemedi!', 'error');
        console.error('Tüm gönderim hataları:', errors);
      }

      // Clear selections
      setSelectedTitles([]);
      setSelectedTitlePlanets([]);
    } catch (error) {
      console.error('Unvan gönderim hatası:', error);
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

  const closeTitleDetailsModal = () => {
    setShowTitleDetailsModal(false);
    setSelectedTitleDetails(null);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#F8F9FA',
      fontFamily: 'Inter, sans-serif',
      touchAction: 'pan-x pan-y pinch-zoom',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch'
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
        marginTop: '60px',
        position: 'relative',
        touchAction: 'pan-x pan-y pinch-zoom',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {/* Kalan Oyun Sayısı - Sağ Üst Çapraz */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-200px',
          background: 'white',
          borderRadius: '8px',
          padding: '12px 16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #E9ECEF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          minWidth: '120px',
          zIndex: 10
        }}>
          <div style={{
            color: '#8A92A6',
            fontSize: '12px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}>
            Kalan Oyun Sayısı
          </div>
          <div style={{
            color: '#3B8AFF',
            fontSize: '20px',
            fontWeight: 700,
            fontFamily: 'Inter'
          }}>
            {remainingCredits.toLocaleString()}
          </div>
        </div>
        {/* Kredi Bilgi Notu */}
        <div style={{
          background: 'linear-gradient(135deg, #E3F2FD 0%, #F3E5F5 100%)',
          border: '1px solid #BBDEFB',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: '#3A57E8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <i className="fas fa-info" style={{ color: 'white', fontSize: '12px' }}></i>
          </div>
          <div style={{
            color: '#1976D2',
            fontSize: '14px',
            fontWeight: 500,
            lineHeight: '1.4'
          }}>
            <strong>Kredi Bilgisi:</strong> Kişi ve gezegen başına 1 kredi düşülür. 
            Örnek: 2 kişiye 2 gezegen gönderilirse 4 kredi düşer.
          </div>
        </div>

        {/* Uyarı Notu */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '6px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#FFC107',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <i className="fas fa-exclamation-triangle" style={{ color: 'white', fontSize: '10px' }}></i>
          </div>
          <div style={{
            color: '#856404',
            fontSize: '13px',
            fontWeight: 500,
            lineHeight: '1.4'
          }}>
            <strong>Otomatik İade:</strong> Hiç başlanmayıp süresi dolan oyunların kredisi otomatik olarak iade edilir.
          </div>
        </div>

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
          <button
            onClick={() => switchTab('title')}
            style={{
              flex: 1,
              padding: '12px 24px',
              textAlign: 'center',
              background: activeTab === 'title' ? 'white' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: activeTab === 'title' ? '#3A57E8' : '#8A92A6',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === 'title' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Unvan
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
                  {/* Custom Dropdown */}
                  <div style={{ flex: 1, position: 'relative' }} data-dropdown="planet">
                    <div
                      onClick={() => setShowPlanetDropdown(!showPlanetDropdown)}
                      style={{
                        padding: '16px',
                        border: '1px solid #E9ECEF',
                        borderRadius: '4px',
                        fontSize: '14px',
                        color: '#232D42',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        userSelect: 'none'
                      }}
                    >
                      <span style={{ color: planetSearchTerm ? '#232D42' : '#8A92A6' }}>
                        {planetSearchTerm || 'Lütfen Gezegen Seçiniz'}
                      </span>
                      <i 
                        className={`fas fa-chevron-${showPlanetDropdown ? 'up' : 'down'}`}
                        style={{ 
                          color: '#8A92A6',
                          fontSize: '12px',
                          transition: 'transform 0.3s ease'
                        }}
                      />
                    </div>

                    {/* Dropdown Menu */}
                    {showPlanetDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E9ECEF',
                        borderRadius: '4px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflow: 'hidden'
                      }}>
                        {/* Search Input */}
                        <div style={{ padding: '8px', borderBottom: '1px solid #E9ECEF', position: 'relative' }}>
                          <input
                            type="text"
                            placeholder="Gezegen ara..."
                            value={planetSearchTerm}
                            onChange={(e) => setPlanetSearchTerm(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px 8px 32px',
                              border: '1px solid #E9ECEF',
                              borderRadius: '4px',
                              fontSize: '14px',
                              outline: 'none'
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
                          {planetSearchTerm && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPlanetSearchTerm('');
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
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {filteredPlanets
                            .filter(planet => !selectedPlanets.includes(planet.value))
                            .map(planet => (
                              <div
                                key={planet.value}
                                onClick={() => addPlanet(planet.value)}
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
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
                                {highlightText(planet.label, planetSearchTerm)}
                              </div>
                            ))}
                          
                          {/* No results message */}
                          {planetSearchTerm && filteredPlanets.filter(planet => !selectedPlanets.includes(planet.value)).length === 0 && (
                            <div style={{
                              padding: '12px 16px',
                              color: '#8A92A6',
                              fontSize: '14px',
                              textAlign: 'center'
                            }}>
                              "{planetSearchTerm}" için arama sonucu bulunamadı
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
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
                  {/* Custom Dropdown */}
                  <div style={{ flex: 1, position: 'relative' }} data-dropdown="group">
                    <div
                      onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                      style={{
                        padding: '16px',
                        border: '1px solid #E9ECEF',
                        borderRadius: '4px',
                        fontSize: '14px',
                        color: '#232D42',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        userSelect: 'none'
                      }}
                    >
                      <span style={{ color: groupSearchTerm ? '#232D42' : '#8A92A6' }}>
                        {groupSearchTerm || 'Lütfen Grup Seçiniz'}
                      </span>
                      <i 
                        className={`fas fa-chevron-${showGroupDropdown ? 'up' : 'down'}`}
                        style={{ 
                          color: '#8A92A6',
                          fontSize: '12px',
                          transition: 'transform 0.3s ease'
                        }}
                      />
                    </div>

                    {/* Dropdown Menu */}
                    {showGroupDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E9ECEF',
                        borderRadius: '4px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflow: 'hidden'
                      }}>
                        {/* Search Input */}
                        <div style={{ padding: '8px', borderBottom: '1px solid #E9ECEF', position: 'relative' }}>
                          <input
                            type="text"
                            placeholder="Grup ara..."
                            value={groupSearchTerm}
                            onChange={(e) => setGroupSearchTerm(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px 8px 32px',
                              border: '1px solid #E9ECEF',
                              borderRadius: '4px',
                              fontSize: '14px',
                              outline: 'none'
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
                          {groupSearchTerm && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setGroupSearchTerm('');
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
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {filteredGroups
                            .filter(group => !selectedGroups.includes(group._id))
                            .map(group => (
                              <div
                                key={group._id}
                                onClick={() => addGroup(group._id)}
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
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
                                {highlightText(group.name, groupSearchTerm)}
                              </div>
                            ))}
                          
                          {/* No results message */}
                          {groupSearchTerm && filteredGroups.filter(group => !selectedGroups.includes(group._id)).length === 0 && (
                            <div style={{
                              padding: '12px 16px',
                              color: '#8A92A6',
                              fontSize: '14px',
                              textAlign: 'center'
                            }}>
                              "{groupSearchTerm}" için arama sonucu bulunamadı
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
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
                        {highlightText(group.name, groupSearchTerm)}
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

        {/* Title Tab Content */}
        {activeTab === 'title' && (
          <div>
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                color: 'black',
                fontSize: '14px',
                fontWeight: 700,
                marginBottom: '12px'
              }}>
                Unvan Seçimi
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* Custom Dropdown */}
                  <div style={{ flex: 1, position: 'relative' }} data-dropdown="title">
                    <div
                      onClick={() => setShowTitleDropdown(!showTitleDropdown)}
                      style={{
                        padding: '16px',
                        border: '1px solid #E9ECEF',
                        borderRadius: '4px',
                        fontSize: '14px',
                        color: '#232D42',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        userSelect: 'none'
                      }}
                    >
                      <span style={{ color: titleSearchTerm ? '#232D42' : '#8A92A6' }}>
                        {titleSearchTerm || 'Lütfen Unvan Seçiniz'}
                      </span>
                      <i 
                        className={`fas fa-chevron-${showTitleDropdown ? 'up' : 'down'}`}
                        style={{ 
                          color: '#8A92A6',
                          fontSize: '12px',
                          transition: 'transform 0.3s ease'
                        }}
                      />
                    </div>

                    {/* Dropdown Menu */}
                    {showTitleDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E9ECEF',
                        borderRadius: '4px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflow: 'hidden'
                      }}>
                        {/* Search Input */}
                        <div style={{ padding: '8px', borderBottom: '1px solid #E9ECEF', position: 'relative' }}>
                          <input
                            type="text"
                            placeholder="Unvan ara..."
                            value={titleSearchTerm}
                            onChange={(e) => setTitleSearchTerm(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px 8px 32px',
                              border: '1px solid #E9ECEF',
                              borderRadius: '4px',
                              fontSize: '14px',
                              outline: 'none'
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
                          {titleSearchTerm && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTitleSearchTerm('');
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
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {filteredTitles
                            .filter(title => !selectedTitles.includes(title._id))
                            .map(title => (
                              <div
                                key={title._id}
                                onClick={() => addTitle(title._id)}
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
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
                                {highlightText(title.name, titleSearchTerm)}
                              </div>
                            ))}
                          
                          {/* No results message */}
                          {titleSearchTerm && filteredTitles.filter(title => !selectedTitles.includes(title._id)).length === 0 && (
                            <div style={{
                              padding: '12px 16px',
                              color: '#8A92A6',
                              fontSize: '14px',
                              textAlign: 'center'
                            }}>
                              "{titleSearchTerm}" için arama sonucu bulunamadı
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
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
                  {selectedTitles.map(titleId => {
                    const title = titles.find(t => t._id === titleId);
                    return title ? (
                      <div
                        key={titleId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: '#6f42c1',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 500,
                          userSelect: 'none',
                          transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                      >
                        {highlightText(title.name, titleSearchTerm)}
                        <button
                          onClick={() => removeTitle(titleId)}
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
                          onClick={() => showTitleDetails(titleId)}
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
                  {/* Custom Dropdown */}
                  <div style={{ flex: 1, position: 'relative' }} data-dropdown="titlePlanet">
                    <div
                      onClick={() => setShowTitlePlanetDropdown(!showTitlePlanetDropdown)}
                      style={{
                        padding: '16px',
                        border: '1px solid #E9ECEF',
                        borderRadius: '4px',
                        fontSize: '14px',
                        color: '#232D42',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        userSelect: 'none'
                      }}
                    >
                      <span style={{ color: titlePlanetSearchTerm ? '#232D42' : '#8A92A6' }}>
                        {titlePlanetSearchTerm || 'Lütfen Gezegen Seçiniz'}
                      </span>
                      <i 
                        className={`fas fa-chevron-${showTitlePlanetDropdown ? 'up' : 'down'}`}
                        style={{ 
                          color: '#8A92A6',
                          fontSize: '12px',
                          transition: 'transform 0.3s ease'
                        }}
                      />
                    </div>

                    {/* Dropdown Menu */}
                    {showTitlePlanetDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E9ECEF',
                        borderRadius: '4px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflow: 'hidden'
                      }}>
                        {/* Search Input */}
                        <div style={{ padding: '8px', borderBottom: '1px solid #E9ECEF', position: 'relative' }}>
                          <input
                            type="text"
                            placeholder="Gezegen ara..."
                            value={titlePlanetSearchTerm}
                            onChange={(e) => setTitlePlanetSearchTerm(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px 8px 32px',
                              border: '1px solid #E9ECEF',
                              borderRadius: '4px',
                              fontSize: '14px',
                              outline: 'none'
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
                          {titlePlanetSearchTerm && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTitlePlanetSearchTerm('');
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
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {availablePlanets
                            .filter(planet => !selectedTitlePlanets.includes(planet.value))
                            .filter(planet => {
                              if (!titlePlanetSearchTerm) return true;
                              const normalizedSearch = titlePlanetSearchTerm.toLowerCase()
                                .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
                                .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
                              const normalizedLabel = planet.label.toLowerCase()
                                .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
                                .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
                              return normalizedLabel.includes(normalizedSearch);
                            })
                            .map(planet => (
                              <div
                                key={planet.value}
                                onClick={() => {
                                  setSelectedTitlePlanets([...selectedTitlePlanets, planet.value]);
                                  setTitlePlanetSearchTerm('');
                                  setShowTitlePlanetDropdown(false);
                                }}
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
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
                                {highlightText(planet.label, titlePlanetSearchTerm)}
                              </div>
                            ))}
                          
                          {/* No results message */}
                          {titlePlanetSearchTerm && availablePlanets
                            .filter(planet => !selectedTitlePlanets.includes(planet.value))
                            .filter(planet => {
                              if (!titlePlanetSearchTerm) return true;
                              const normalizedSearch = titlePlanetSearchTerm.toLowerCase()
                                .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
                                .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
                              const normalizedLabel = planet.label.toLowerCase()
                                .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
                                .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
                              return normalizedLabel.includes(normalizedSearch);
                            }).length === 0 && (
                            <div style={{
                              padding: '12px 16px',
                              color: '#8A92A6',
                              fontSize: '14px',
                              textAlign: 'center'
                            }}>
                              "{titlePlanetSearchTerm}" için arama sonucu bulunamadı
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
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
                  {selectedTitlePlanets.map((planetValue, index) => {
                    const planet = availablePlanets.find(p => p.value === planetValue);
                    return planet ? (
                      <div
                        key={planetValue}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: '#6f42c1',
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
                          onClick={() => removeTitlePlanet(planetValue)}
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
              onClick={sendTitleInterview}
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
              {isSubmitting ? 'Gönderiliyor...' : 'Bu Unvandaki Kişilere Gönder'}
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
                  Grup Üyeleri ({selectedGroupDetails.persons.length})
                </h4>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {selectedGroupDetails.persons.map((person: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        background: '#E3F2FD',
                        border: '1px solid #BBDEFB',
                        color: '#1976D2',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 500,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                          {person.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {person.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          {person.email}
                        </div>
                      </div>
                      <div style={{
                        background: '#1976D2',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        {person.sicilNo}
                      </div>
                    </div>
                  ))}
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

      {/* Title Details Modal */}
      {showTitleDetailsModal && selectedTitleDetails && (
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
                {selectedTitleDetails.name} - Detayları
              </h3>
              <button
                onClick={closeTitleDetailsModal}
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
                Unvan Bilgileri
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
                  Unvan: {selectedTitleDetails.name}
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
                  Organizasyon Sayısı: {selectedTitleDetails.organizations.length}
                </span>
              </div>
            </div>

            {/* Organizations */}
            {selectedTitleDetails.organizations && selectedTitleDetails.organizations.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '10px'
                }}>
                  Unvan Bilgileri ({selectedTitleDetails.organizations.length})
                </h4>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {selectedTitleDetails.organizations.map((org: any, index: number) => (
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
                      {org.unvan}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Persons */}
            {selectedTitleDetails.persons && selectedTitleDetails.persons.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '10px'
                }}>
                  Bu Unvanda Çalışan Kişiler ({selectedTitleDetails.persons.length})
                </h4>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {selectedTitleDetails.persons.map((person: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        background: '#E3F2FD',
                        border: '1px solid #BBDEFB',
                        color: '#1976D2',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 500,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                          {person.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {person.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          {person.email}
                        </div>
                      </div>
                      <div style={{
                        background: '#1976D2',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        {person.sicilNo}
                      </div>
                    </div>
                  ))}
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
